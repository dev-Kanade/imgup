const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs').promises;
let win;

app.on('ready', () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('index.html');
  win.webContents.openDevTools();
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    await fs.writeFile('config.json', JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
