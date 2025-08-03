const { ipcRenderer } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;

document.getElementById('settingsIcon').addEventListener('click', () => {
  window.location.href = './setting.html';
});

const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const errorMsg = document.getElementById('errorMsg');
const uploadLink = document.getElementById('uploadLink');
const fileSelected = document.getElementById('fileSelected');
const selectedFileName = document.getElementById('selectedFileName');
const upscaleBtn = document.getElementById('upscaleBtn');
const reselectBtn = document.getElementById('reselectBtn');
const upscaling = document.getElementById('upscaling');
const cancelBtn = document.getElementById('cancelBtn');
const progressBar = document.getElementById('progressBar');
const completed = document.getElementById('completed');
const backBtn = document.getElementById('backBtn');
const upscaledImage = document.getElementById('upscaledImage');
const saveBtn = document.getElementById('saveBtn');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});

uploadLink.addEventListener('click', (e) => {
  e.preventDefault();
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  if (files.length > 1) {
    showError('一度に1枚のみアップロードしてください。');
    return;
  }

  const file = files[0];
  if (!file) return;

  const maxSize = 200 * 1024 * 1024; 
  if (file.size > maxSize) {
    showError('ファイルが大きすぎます');
    return;
  }

  if (!file.type.match('image/(png|jpeg)')) {
    showError('サポートしていないファイル形式です');
    return;
  }

  errorMsg.style.display = 'none';
  dropZone.style.display = 'none';
  selectedFileName.textContent = `${file.name}が選択されています`;
  fileSelected.style.display = 'block';
}

reselectBtn.addEventListener('click', () => {
  fileSelected.style.display = 'none';
  dropZone.style.display = 'block';
  document.getElementById('result').innerHTML = '';
});

upscaleBtn.addEventListener('click', () => {
  fileSelected.style.display = 'none';
  upscaling.style.display = 'block';
  upscaleImage();
});

cancelBtn.addEventListener('click', () => {
  upscaling.style.display = 'none';
  dropZone.style.display = 'block';
  progressBar.value = 0;
  document.getElementById('result').innerHTML = '';
});

backBtn.addEventListener('click', () => {
  completed.style.display = 'none';
  dropZone.style.display = 'block';
  document.getElementById('result').innerHTML = '';
});

saveBtn.addEventListener('click', async () => {
  let config = {};
  try {
    const data = await fs.readFile('config.json', 'utf8');
    config = JSON.parse(data);
  } catch (error) {
    console.error('config.jsonの読み込みに失敗:', error);
    config = { download: require('path').join(require('os').homedir(), 'Downloads') };
  }
  const downloadPath = require('path').join(config.download, upscaledImage.src.split(';base64,')[0].split('/')[1]);
  await fs.writeFile(downloadPath, Buffer.from(upscaledImage.src.split(',')[1], 'base64'));
  alert('画像が保存されました。');
});

async function upscaleImage() {
  const file = imageInput.files[0];
  if (!file) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressBar.value = progress;
    if (progress >= 100) clearInterval(interval);
  }, 200);

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

    upscaling.style.display = 'none';
    const upscaledDataUrl = `data:image/${file.type.split('/')[1]};base64,${upscaled.toString('base64')}`;
    upscaledImage.src = upscaledDataUrl;
    completed.style.display = 'block';
  } catch (error) {
    console.error('エラー:', error);
    alert('画像のアップスケールに失敗しました。');
    upscaling.style.display = 'none';
    dropZone.style.display = 'block';
    progressBar.value = 0;
  }
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  document.getElementById('result').innerHTML = '';
}