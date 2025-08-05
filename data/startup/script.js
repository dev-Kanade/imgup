const fs = require('fs').promises;
const path = require('path');
const { shell, dialog } = require('electron');

window.addEventListener('load', () => {
  const configPath = path.resolve('../../config.json');
  fs.readFile(configPath, 'utf8')
    .then(data => {
      const config = JSON.parse(data);
      if (config.startup === true) {
        window.location.href = '../../index.html';
      } else {
        showStep('step1'); 
      }
    })
    .catch(error => console.error('config.json読み込みエラー:', error));
});

function showStep(stepId) {
  document.querySelectorAll('.content').forEach(step => step.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
}

function createShortcut() {
  const projectRoot = path.resolve(__dirname, '../../'); 
  const desktopPath = path.join(require('os').homedir(), 'Desktop');
  const shortcutPath = path.join(desktopPath, 'ImageUpscaler.lnk');
  const batPath = path.join(projectRoot, 'start.bat');
  const cmdCommand = `@echo off\ncd /d "${projectRoot.replace(/\\/g, '\\\\')}"\nstart npm start`; 

  fs.writeFile(batPath, cmdCommand, 'utf8')
    .then(() => {
      const shortcutScript = `
        Set oWS = WScript.CreateObject("WScript.Shell")
        sLinkFile = "${shortcutPath.replace(/\\/g, '\\\\')}"
        Set oLink = oWS.CreateShortcut(sLinkFile)
        oLink.TargetPath = "${batPath.replace(/\\/g, '\\\\')}"
        oLink.WorkingDirectory = "${projectRoot.replace(/\\/g, '\\\\')}"
        oLink.Save
      `;
      const vbsPath = path.join(projectRoot, 'createShortcut.vbs');
      return fs.writeFile(vbsPath, shortcutScript, 'utf8')
        .then(() => {
          shell.openPath(vbsPath)
            .then(() => {
              setTimeout(() => {
                Promise.all([
                  fs.unlink(vbsPath),
                  fs.unlink(batPath)
                ]).then(() => {
                  showStep('step3'); 
                }).catch(unlinkError => {
                  console.error('一時ファイル削除エラー:', unlinkError);
                  showStep('step3'); 
                });
              }, 1000);
            })
            .catch(shellError => {
              console.error('VBScript実行エラー:', shellError);
              const errorMsg = document.getElementById('errorMsg');
              if (errorMsg) {
                errorMsg.textContent = 'ショートカット作成に失敗しました。';
                errorMsg.style.display = 'block';
              }
            });
        });
    })
    .catch(error => {
      console.error('バッチファイル作成エラー:', error);
      const errorMsg = document.getElementById('errorMsg');
      if (errorMsg) {
        errorMsg.textContent = 'バッチファイル作成に失敗しました。';
        errorMsg.style.display = 'block';
      }
    });
}

function selectFolder() {
  dialog.showOpenDialog({ properties: ['openDirectory'] })
    .then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const newPath = result.filePaths[0];
        document.getElementById('downloadPath').value = newPath;
        return fs.readFile('../../config.json', 'utf8')
          .then(data => {
            const config = JSON.parse(data);
            config.download = newPath;
            return fs.writeFile('../../config.json', JSON.stringify(config, null, 2), 'utf8');
          })
          .then(() => {
            showStep('step2'); 
          })
          .catch(error => {
            console.error('config.json保存エラー:', error);
            const errorMsg = document.getElementById('errorMsg');
            if (errorMsg) {
              errorMsg.textContent = 'ダウンロード場所の保存に失敗しました。';
              errorMsg.style.display = 'block';
            }
          });
      }
    })
    .catch(error => {
      console.error('フォルダ選択エラー:', error);
      const errorMsg = document.getElementById('errorMsg');
      if (errorMsg) {
        errorMsg.textContent = 'フォルダ選択に失敗しました。';
        errorMsg.style.display = 'block';
      }
    });
}


document.getElementById('step2').addEventListener('click', () => {
  fs.readFile('../../config.json', 'utf8')
    .then(data => {
      const config = JSON.parse(data);
      config.startup = true;
      return fs.writeFile('../../config.json', JSON.stringify(config, null, 2), 'utf8');
    })
    .then(() => {
      window.location.href = '../../index.html';
    })
    .catch(error => console.error('config.json更新エラー:', error));
});
