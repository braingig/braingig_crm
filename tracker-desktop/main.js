const { app, BrowserWindow, powerMonitor, ipcMain, Notification, desktopCapturer } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const Store = require('electron-store');
const http = require('http');
const url = require('url');
const fs = require('fs');

const store = new Store();

const FRONTEND_URL = 'http://localhost:3000'; // 🔴 CHANGE
const API_URL = 'http://localhost:4000/graphql';  // 🔴 CHANGE
const ELECTRON_PORT = 8765; // Port for HTTP server

let mainWindow;
let lastIdle = false;
let isTrackingEnabled = false;
let currentUserId = null;
let activityCheckInterval;
let httpServer;
let browserSSEClients = []; // Store Server-Sent Events clients

function createWindow() {
  // Create a hidden window for background processing
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Hide the window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load LIVE WEBSITE for IPC communication
  mainWindow.loadURL(FRONTEND_URL);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Function to show system notifications
function showSystemNotification(title, body, icon = null) {
  if (!Notification.isSupported()) {
    console.log('System notifications not supported');
    return false;
  }

  const notification = new Notification({
    title: title,
    body: body,
    icon: icon || null,
    silent: false,
    urgency: 'critical', // Use 'critical' for higher visibility
    timeoutType: 'default',
    requireInteraction: true, // Keep notification visible until user interacts
    showWhen: true // Show timestamp
  });

  notification.on('click', () => {
    console.log('Notification clicked');
    // Focus the window when notification is clicked
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
  console.log(`System notification shown: ${title} - ${body}`);
  return true;
}

async function captureScreen() {
  try {
    // Get all available screen sources
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length === 0) {
      throw new Error('No screen sources found');
    }

    // Get the primary screen (usually the first one)
    const primaryScreen = sources[0];
    
    // Convert thumbnail to PNG buffer
    const screenshotBuffer = primaryScreen.thumbnail.toPNG();
    
    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    
    // Save to a screenshots directory
    const screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const filepath = path.join(screenshotsDir, filename);
    fs.writeFileSync(filepath, screenshotBuffer);
    
    console.log(`Screenshot saved to: ${filepath}`);
    
    // Convert buffer to base64 for browser display
    const base64Data = screenshotBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Data}`;
    
    return {
      success: true,
      filepath: filepath,
      filename: filename,
      timestamp: timestamp,
      size: screenshotBuffer.length,
      data: dataUrl
    };
    
  } catch (error) {
    console.error('Failed to capture screen:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create HTTP server for browser communication
function createHttpServer() {
  httpServer = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (path === '/start-tracking' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          startActivityTracking(data.userId, data.token);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, tracking: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else if (path === '/stop-tracking' && req.method === 'POST') {
      stopActivityTracking();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tracking: false }));
    } else if (path === '/activity-status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tracking: isTrackingEnabled,
        userId: currentUserId,
        idleTime: powerMonitor.getSystemIdleTime(),
        isIdle: lastIdle
      }));
    } else if (path === '/activity-events' && req.method === 'GET') {
      // Server-Sent Events endpoint for real-time activity updates
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Add client to SSE clients list
      browserSSEClients.push(res);
      console.log(`🔗 New SSE client connected. Total clients: ${browserSSEClients.length}`);

      // Send initial status
      const initialStatus = {
        type: lastIdle ? 'IDLE' : 'ACTIVE',
        idleTime: powerMonitor.getSystemIdleTime(),
        timestamp: Date.now()
      };
      console.log('📤 Sending initial status to new SSE client:', initialStatus);
      res.write(`data: ${JSON.stringify(initialStatus)}\n\n`);

      // Remove client when connection closes
      req.on('close', () => {
        const index = browserSSEClients.indexOf(res);
        if (index > -1) {
          browserSSEClients.splice(index, 1);
        }
      });
    } else if (path === '/show-notification' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          showSystemNotification(data.title, data.body, data.icon);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else if (path === '/capture-screenshot' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          
          // Check consent before capturing screenshot
          if (!data.consent || data.consent !== true) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Screenshot capture requires explicit consent' 
            }));
            return;
          }
          
          // Capture screenshot
          const result = await captureScreen();
          
          if (result.success) {
            // Show notification that screenshot was taken
            showSystemNotification(
              '📸 SCREENSHOT CAPTURED', 
              `Time tracking screenshot captured at ${new Date().toLocaleTimeString()}`,
              null
            );
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else if (path === '/' && req.method === 'GET') {
      // Default route to show Electron is running
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Electron is running on port ' + ELECTRON_PORT);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  httpServer.listen(ELECTRON_PORT, () => {
    console.log(`Electron HTTP server running on port ${ELECTRON_PORT}`);
  });
}

// Notify all connected browser clients via SSE
function notifyBrowserClients(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  console.log(`📡 Notifying ${browserSSEClients.length} SSE clients:`, data);
  browserSSEClients.forEach((client, index) => {
    try {
      client.write(message);
      console.log(`✅ SSE message sent to client ${index}`);
    } catch (error) {
      console.error(`❌ Failed to send message to SSE client ${index}:`, error);
      // Remove disconnected client
      browserSSEClients.splice(index, 1);
    }
  });
}

async function reportActivity(type, metadata = {}) {
  if (!isTrackingEnabled || !currentUserId) return;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${store.get('token')}`
      },
      body: JSON.stringify({
        query: `
          mutation ReportActivity($type: String!, $metadata: JSON) {
            reportActivity(type: $type, metadata: $metadata)
          }
        `,
        variables: { 
          type,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: 'electron-desktop'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Send activity status to renderer process
    console.log(`Sending IPC event 'activity-status' with type: ${type}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('activity-status', {
        type,
        idleTime: powerMonitor.getSystemIdleTime(),
        timestamp: Date.now()
      });
      console.log('IPC event sent successfully');
    } else {
      console.log('Cannot send IPC event - mainWindow or webContents not available');
    }

    // Also send to any connected browser clients via Server-Sent Events
    notifyBrowserClients({
      type,
      idleTime: powerMonitor.getSystemIdleTime(),
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Activity report failed:', error.message);
    
    // If unauthorized, stop tracking
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      stopActivityTracking();
    }
  }
}

function startActivityTracking(userId, token = null) {
  if (isTrackingEnabled) return;
  
  // Store token if provided
  if (token) {
    store.set('token', token);
  }
  
  isTrackingEnabled = true;
  currentUserId = userId;
  console.log(`🎯 Activity tracking started for user: ${userId}`);
  console.log(`📊 System idle time check will begin now...`);

  // Clear any existing interval
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }

  // Report initial activity
  reportActivity('TRACKING_STARTED');

  // OS-level idle detection - check every second
  console.log('Starting idle detection interval...');
  activityCheckInterval = setInterval(() => {
    const idleSeconds = powerMonitor.getSystemIdleTime();

    // Debug: Log idle time every 10 seconds
    if (idleSeconds % 10 === 0) {
      console.log(`Current idle time: ${idleSeconds} seconds, lastIdle: ${lastIdle}`);
    }

    // Check if user has been idle for 1 minute (60 seconds)
    if (idleSeconds >= 60 && !lastIdle) {
      lastIdle = true;
      console.log(`User idle for ${idleSeconds} seconds - pausing timer`);
      reportActivity('IDLE', { idleTime: idleSeconds });
    }

    // Check if user became active again (less than 10 seconds idle)
    if (idleSeconds < 10 && lastIdle) {
      lastIdle = false;
      console.log(`User became active again - resuming timer`);
      reportActivity('ACTIVE', { idleTime: idleSeconds });
    }
  }, 1000);
}

function stopActivityTracking() {
  if (!isTrackingEnabled) return;
  
  console.log('Stopping activity tracking');
  
  isTrackingEnabled = false;
  currentUserId = null;
  lastIdle = false;
  
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
    activityCheckInterval = null;
  }

  // Report tracking stopped
  reportActivity('TRACKING_STOPPED');
}

// IPC handlers
ipcMain.handle('start-activity-tracking', async (event, userId) => {
  startActivityTracking(userId);
  return { success: true, tracking: true };
});

ipcMain.handle('stop-activity-tracking', async (event) => {
  stopActivityTracking();
  return { success: true, tracking: false };
});

ipcMain.handle('get-activity-status', async (event) => {
  return {
    tracking: isTrackingEnabled,
    userId: currentUserId,
    idleTime: powerMonitor.getSystemIdleTime(),
    isIdle: lastIdle
  };
});

ipcMain.handle('set-auth-token', async (event, token) => {
  store.set('token', token);
  return { success: true };
});

ipcMain.handle('capture-screen', async (event, consent) => {
  // Check consent before capturing screenshot
  if (!consent || consent !== true) {
    return {
      success: false,
      error: 'Screenshot capture requires explicit consent'
    };
  }
  
  // Capture screenshot
  const result = await captureScreen();
  
  if (result.success) {
    // Show system notification that screenshot was taken
    showSystemNotification(
      '📸 SCREENSHOT CAPTURED', 
      `Time tracking screenshot captured at ${new Date().toLocaleTimeString()}`,
      null
    );
  }
  
  return result;
});

// Enhanced activity monitoring with mouse and keyboard hooks
function setupGlobalActivityMonitoring() {
  const { exec } = require('child_process');
  const os = require('os');

  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows-specific monitoring using PowerShell
    const monitorScript = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class MouseTracker {
          [DllImport("user32.dll")]
          public static extern bool GetCursorPos(out POINT lpPoint);
          
          [Struct(LayoutKind.Sequential)]
          public struct POINT {
            public int X;
            public int Y;
          }
        }
      '
      
      $lastPos = [MouseTracker]::GetCursorPos()
      while($true) {
        Start-Sleep -Milliseconds 500
        $currentPos = [MouseTracker]::GetCursorPos()
        if($currentPos.X -ne $lastPos.X -or $currentPos.Y -ne $lastPos.Y) {
          $lastPos = $currentPos
          Write-Output "MOUSE_MOVE"
        }
      }
    `;

    // Start monitoring in background
    const child = exec(`powershell -Command "${monitorScript}"`, (error, stdout, stderr) => {
      if (stdout && stdout.trim() === 'MOUSE_MOVE') {
        // Mouse movement detected
        if (isTrackingEnabled && lastIdle) {
          lastIdle = false;
          reportActivity('ACTIVE', { source: 'mouse-hook' });
        }
      }
    });

    // Cleanup on app exit
    app.on('before-quit', () => {
      child.kill();
    });
  }
}

app.whenReady().then(() => {
  console.log('🚀 Electron app starting up...');
  createWindow();
  createHttpServer();
  setupGlobalActivityMonitoring();
  console.log('✅ Electron app ready and monitoring system activity');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  stopActivityTracking();
});
