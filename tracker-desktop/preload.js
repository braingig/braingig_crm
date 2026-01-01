const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

const store = new Store();

contextBridge.exposeInMainWorld('electron', {
  // Token management
  saveToken: (token) => store.set('token', token),
  getToken: () => store.get('token'),
  clearToken: () => store.delete('token'),

  // Activity tracking
  startActivityTracking: (userId) => ipcRenderer.invoke('start-activity-tracking', userId),
  stopActivityTracking: () => ipcRenderer.invoke('stop-activity-tracking'),
  getActivityStatus: () => ipcRenderer.invoke('get-activity-status'),
  setAuthToken: (token) => ipcRenderer.invoke('set-auth-token', token),

  // Activity status events from main process
  onActivityStatus: (callback) => {
    ipcRenderer.on('activity-status', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Platform info
  platform: process.platform
});
