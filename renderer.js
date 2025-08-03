const { ipcRenderer } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;

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
  const arrayBuffer = await file.arrayBuffer();
  const image = sharp(arrayBuffer);

  const metadata = await image.metadata();
  const upscaled = await image
    .resize({
      width: metadata.width * 2,
      height: metadata.height * 2,
      kernel: 'lanczos3', // 高品質な補間
    })
    .toBuffer();

  const upscaledDataUrl = `data:image/${file.type.split('/')[1]};base64,${upscaled.toString('base64')}`;
  document.getElementById('result').innerHTML = `<img src="${upscaledDataUrl}" id="upscaled">`;

  const exportBtn = document.createElement('button');
  exportBtn.id = 'exportBtn';
  exportBtn.textContent = '書き出し';
  exportBtn.onclick = () => downloadImage(upscaled, file.name.replace(/\.[^/.]+$/, '') + '_2x.' + file.type.split('/')[1]);
  document.body.appendChild(exportBtn);
}

function downloadImage(buffer, filename) {
  const blob = new Blob([buffer], { type: 'image/' + filename.split('.').pop() });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}