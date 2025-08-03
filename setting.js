const { dialog } = require('electron').remote;
const fs = require('fs').promises;

(async () => {
  
  let config = {};
  try {
    const data = await fs.readFile('config.json', 'utf8');
    config = JSON.parse(data);
  } catch (error) {
    console.error('config.jsonの読み込みに失敗:', error);
    config = { download: 'c:/user/download', language: 'ja' };
    await fs.writeFile('config.json', JSON.stringify(config, null, 2));
  }

  
  document.getElementById('downloadPath').value = config.download;


  document.getElementById('language').value = config.language;


  document.getElementById('browseBtn').addEventListener('click', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (!result.canceled && result.filePaths.length > 0) {
      const newPath = result.filePaths[0];
      document.getElementById('downloadPath').value = newPath;
      config.download = newPath;
      await fs.writeFile('config.json', JSON.stringify(config, null, 2));
    }
  });
})();