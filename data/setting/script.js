const { dialog } = require('@electron/remote');
const fs = require('fs').promises;


document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const tabId = item.textContent === '←戻る' ? 'generalTab' : item.textContent === '一般' ? 'generalTab' : 'modelTab';
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });
});


document.getElementById('browseBtn').addEventListener('click', async () => {
    try {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            let selectedPath = result.filePaths[0].replace(/\\/g, '￥');
            document.getElementById('downloadPath').value = selectedPath;
            const configPath = '../../config.json';
            const data = await fs.readFile(configPath, 'utf8');
            let config = JSON.parse(data);
            config.download = selectedPath;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        }
    } catch (err) {
        console.error('Error in browseBtn:', err);
    }
});


document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', async () => {
        if (radio.checked) {
            const configPath = '../../config.json';
            try {
                const data = await fs.readFile(configPath, 'utf8');
                let config = JSON.parse(data);
                config.theme = radio.value;
                await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            } catch (err) {
                console.error('Error saving theme:', err);
            }
        }
    });
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
            }
        });
    } catch (err) {
        console.error('Error in createShortcutBtn:', err);
    }
});


document.querySelectorAll('.model-select').forEach(select => {
    select.addEventListener('click', async () => {
        const modelId = select.id.replace('modelItem_', '');
        const configPath = '../../config.json';
        try {
            const data = await fs.readFile(configPath, 'utf8');
            let config = JSON.parse(data);
            config.model = modelId;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        } catch (err) {
            console.error('Error saving model:', err);
        }
    });
});