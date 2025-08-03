const { ipcRenderer } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;
const { download } = require('electron').remote; 

document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('result').innerHTML = `<img src="${event.target.result}" id="preview">`;
    };
    reader.readAsDataURL(file);
  }
});

async function upscaleImage() {
  const fileInput = document.getElementById('imageInput');
  if (!fileInput.files[0]) return alert('画像を選択してください。');

  const file = fileInput.files[0];
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


    const newFilename = `${file.name.replace(/\.[^/.]+$/, '')}_2x.${file.type.split('/')[1]}`;
    const downloadPath = require('path').join(require('os').homedir(), 'Downloads', newFilename);
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
