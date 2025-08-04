const { ipcRenderer } = require('electron');
const { Upscaler } = require('upscaler');
const fs = require('fs').promises;
const tf = require('@tensorflow/tfjs-node');


const upscaler = new Upscaler({
  model: require('@upscalerjs/esrgan-thick/2x'), 
  scale: 2,
});

document.getElementById('settingsIcon').addEventListener('click', () => {
  window.location.href = './settings.html';
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

upscaleBtn.addEventListener('click', async () => {
  fileSelected.style.display = 'none';
  upscaling.style.display = 'block';
  await upscaleImage();
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
  const file = imageInput.files[0];
  const newFilename = `${file.name.replace(/\.[^/.]+$/, '')}_2x.${file.type.split('/')[1]}`;
  const downloadPath = require('path').join(config.download, newFilename);
  const upscaledBuffer = await fs.readFile(upscaledImage.src.split(',')[1], 'base64');
  await fs.writeFile(downloadPath, upscaledBuffer);
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
    const imageBitmap = await createImageBitmap(new Blob([arrayBuffer]));
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);
    const upscaledTensor = await upscaler.upscale(canvas);
    const upscaledCanvas = await tf.browser.toPixels(upscaledTensor);
    upscaledImage.src = upscaledCanvas.toDataURL();

    upscaling.style.display = 'none';
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