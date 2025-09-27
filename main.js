const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs').promises;
const remoteMain = require('@electron/remote/main'); 
remoteMain.initialize(); 

let win;


app.on('ready', async () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: 'icon.png',//アイコン★
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
            
        },
        
    });
    

    win.setMenu(null);
 
    remoteMain.enable(win.webContents);

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
        console.error("[ERROR]構成ファイルの読み込みに失敗しました。");
        win.loadFile('index.html');
    }

    
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

ipcMain.on('go-back-to-home', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.loadFile('index.html');
    }
});
