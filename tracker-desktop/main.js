const { app, BrowserWindow, powerMonitor } = require('electron');
const path = require('path');
const fetch = require('node-fetch');
const Store = require('electron-store');

const store = new Store();

const FRONTEND_URL = 'http://localhost:3000'; // 🔴 CHANGE
const API_URL = 'http://localhost:4000/graphql';  // 🔴 CHANGE

let mainWindow;
let lastIdle = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load LIVE WEBSITE
  mainWindow.loadURL(FRONTEND_URL);
}
async function reportActivity(type) {
  const token = store.get('token');
  if (!token) return;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation ReportActivity($type: String!) {
            reportActivity(type: $type)
          }
        `,
        variables: { type },
      }),
    });
  } catch (error) {
    console.error('Failed to report activity:', error.message);
  }
}

app.whenReady().then(() => {
  createWindow();

  // OS-level idle detection
  setInterval(() => {
    const idleSeconds = powerMonitor.getSystemIdleTime();

    if (idleSeconds >= 60 && !lastIdle) {
      lastIdle = true;
      reportActivity('IDLE');
    }

    if (idleSeconds < 10 && lastIdle) {
      lastIdle = false;
      reportActivity('ACTIVE');
    }
  }, 1000);
});

async function reportActivity(type) {
  const token = store.get('token');
  if (!token) return;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          mutation ReportActivity($type: String!) {
            reportActivity(type: $type)
          }
        `,
        variables: { type }
      })
    });
  } catch (err) {
    console.error('Activity report failed:', err.message);
  }
}
