const { contextBridge } = require('electron');
const Store = require('electron-store');

const store = new Store();

contextBridge.exposeInMainWorld('electron', {
  saveToken: (token) => store.set('token', token),
  getToken: () => store.get('token')
});
