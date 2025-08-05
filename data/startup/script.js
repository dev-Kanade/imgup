const fs = require('fs').promises;
const path = require('path');
const { shell } = require('electron');

window.addEventListener('load', () => {
  const configPath = path.resolve('../../config.json');
  fs.readFile(configPath, 'utf8')
    .then(data => {
      const config = JSON.parse(data);
      if (config.startup === true) {
        window.location.href = '../../index.html';
      }
    })
    .catch(error => console.error('config.json読み込みエラー:', error));
});

function createShortcut() {
  const projectRoot = path.resolve('../../'); 
  const desktopPath = path.join(require('os').homedir(), 'Desktop');
  const shortcutPath = path.join(desktopPath, 'ImageUpscaler.lnk');
  const cmdCommand = `@echo off\ncd /d "${projectRoot}"\nstart npm start`;

 
  const batPath = path.join(projectRoot, 'start.bat');
  fs.writeFile(batPath, cmdCommand, 'utf8')
    .then(() => {
   
      const shortcutScript = `
        Set oWS = WScript.CreateObject("WScript.Shell")
        sLinkFile = "${shortcutPath}"
        Set oLink = oWS.CreateShortcut(sLinkFile)
        oLink.TargetPath = "${batPath}"
        oLink.WorkingDirectory = "${projectRoot}"
        oLink.Save
      `;
      fs.writeFile(path.join(projectRoot, 'createShortcut.vbs'), shortcutScript, 'utf8')
        .then(() => {
          shell.openPath(path.join(projectRoot, 'createShortcut.vbs'));
          setTimeout(() => {
            fs.unlink(path.join(projectRoot, 'createShortcut.vbs'), () => {});
            fs.unlink(batPath, () => {});
            window.location.href = 'index3.html'; 
          }, 1000);
        })
        .catch(error => console.error('ショートカット作成エラー:', error));
    })
    .catch(error => console.error('バッチファイル作成エラー:', error));
}