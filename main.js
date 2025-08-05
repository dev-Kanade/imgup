const { app, BrowserWindow } = require('electron');
const fs = require('fs').promises;
let win;

app.on('ready', async () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

 
  let config;
  try {
    const data = await fs.readFile('config.json', 'utf8');
    config = JSON.parse(data);
    if (config.startup === false) {
      win.loadFile('data/startup/index.html');
    } else {
      win.loadFile('index.html');
    }
  } catch (error) {
    console.error('config.json読み込みエラー:', error);
    win.loadFile('index.html'); 
  }
});