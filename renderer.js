const { ipcRenderer } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;

document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) errorMsg.remove();

  if (file) {
    const maxSize = 200 * 1024 * 1024; 
    if (file.size > maxSize) {
      const error = document.createElement('span');
      error.id = 'errorMsg';
      error.textContent = 'ファイルが大きすぎます';
      error.style.color = 'red';
      error.style.marginLeft = '10px';
      document.getElementById('imageInput').parentNode.appendChild(error);
      document.getElementById('result').innerHTML = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('result').innerHTML = `<img src="${event.target.result}" id="preview">`;
    };
    reader.readAsDataURL(file);
  }
});

async function upscaleImage() {
  const fileInput = document.getElementById('imageInput');
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) errorMsg.remove();

  if (!fileInput.files[0]) return alert('画像を選択してください。');

  const file = fileInput.files[0];
  const maxSize = 200 * 1024 * 1024; 
  if (file.size > maxSize) {
    const error = document.createElement('span');
    error.id = 'errorMsg';
    error.textContent = 'ファイルが大きすぎます';
    error.style.color = 'red';
    error.style.marginLeft = '10px';
    document.getElementById('imageInput').parentNode.appendChild(error);
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const image = sharp(arrayBuffer);

    const metadata = await image.metadata();
    const upscaled = await image
      .resize({
        width: metadata.width * 2,
        height: metadata.height * 2,
        kernel: 'lanczos3', 
      })
      .toBuffer();

  
    let config = {};
    try {
      const data = await fs.readFile('config.json', 'utf8');
      config = JSON.parse(data);
    } catch (error) {
      console.error('config.jsonの読み込みに失敗:', error);
      config = { download: require('path').join(require('os').homedir(), 'Downloads') };
    }

    const newFilename = `${file.name.replace(/\.[^/.]+$/, '')}_2x.${file.type.split('/')[1]}`;
    const downloadPath = require('path').join(config.download, newFilename);
    await fs.writeFile(downloadPath, upscaled);

  
    const upscaledDataUrl = `data:image/${file.type.split('/')[1]};base64,${upscaled.toString('base64')}`;
    document.getElementById('result').innerHTML = `<img src="${upscaledDataUrl}" id="upscaled">`;

    alert('画像がダウンロードフォルダに保存されました。');
  } catch (error) {
    console.error('エラー:', error);
    alert('画像のアップスケールに失敗しました。コンソールを確認してください。');
  }
}

document.getElementById('upscaleBtn').addEventListener('click', upscaleImage);
