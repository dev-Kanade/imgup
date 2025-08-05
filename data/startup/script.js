const { dialog } = require('@electron/remote');

document.getElementById('browseBtn').addEventListener('click', async () => {
    try {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            let selectedPath = result.filePaths[0].replace(/\\/g, '￥');
            document.getElementById('pathInput').value = selectedPath;
            const fs = require('fs').promises;
            const configPath = '../../config.json';
            const data = await fs.readFile(configPath, 'utf8');
            let config = JSON.parse(data);
            config.download = selectedPath;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
         
            document.querySelector('.input-group').style.display = 'none';
            document.getElementById('shortcutSection').style.display = 'block';
        }
    } catch (err) {
        console.error('Error in browseBtn:', err);
    }
});

document.getElementById('createShortcutBtn').addEventListener('click', () => {
    try {
        const { app } = require('@electron/remote');
        const projectPath = app.getAppPath().replace(/\\/g, '￥');
        const desktopPath = app.getPath('desktop');
        const shortcutPath = `${desktopPath}/StartApp.lnk`;
        const { exec } = require('child_process');
        exec(`cd "${projectPath}" && npm start`, (err) => {
            if (err) {
                console.error('Error creating shortcut:', err);
            } else {
                document.getElementById('shortcutSection').style.display = 'none';
                document.getElementById('thankYouSection').style.display = 'block';
            }
        });
    } catch (err) {
        console.error('Error in createShortcutBtn:', err);
    }
});

document.getElementById('thankYouSection').addEventListener('click', () => {
    try {
        const { shell } = require('@electron/remote');
        shell.openExternal('file://' + __dirname + '/../../index.html');
    } catch (err) {
        console.error('Error in thankYouSection:', err);
    }
});