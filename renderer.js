const { ipcRenderer } = require('electron');
const sharp = require('sharp');
const fs = require('fs').promises;

document.getElementById('settingsIcon').addEventListener('click', () => {
  window.location.href = './data/setting/index.html';
  console.log('Settings icon clicked');
});

const dropZone = document.getElementById('dropZone');
if (!dropZone) console.error('dropZone element not found');
const imageInput = document.getElementById('imageInput');
if (!imageInput) console.error('imageInput element not found');
const errorMsg = document.getElementById('errorMsg');
if (!errorMsg) console.error('errorMsg element not found');
const uploadLink = document.getElementById('uploadLink');
if (!uploadLink) console.error('uploadLink element not found');
const fileSelected = document.getElementById('fileSelected');
if (!fileSelected) console.error('fileSelected element not found');
const selectedFileName = document.getElementById('selectedFileName');
if (!selectedFileName) console.error('selectedFileName element not found');
const upscaleBtn = document.getElementById('upscaleBtn');
if (!upscaleBtn) console.error('upscaleBtn element not found');
const reselectBtn = document.getElementById('reselectBtn');
if (!reselectBtn) console.error('reselectBtn element not found');
const upscaling = document.getElementById('upscaling');
if (!upscaling) console.error('upscaling element not found');
const cancelBtn = document.getElementById('cancelBtn');
if (!cancelBtn) console.error('cancelBtn element not found');
const progressBar = document.getElementById('progressBar');
if (!progressBar) console.error('progressBar element not found');
const completed = document.getElementById('completed');
if (!completed) console.error('completed element not found');
const backBtn = document.getElementById('backBtn');
if (!backBtn) console.error('backBtn element not found');
const upscaledImage = document.getElementById('upscaledImage');
if (!upscaledImage) console.error('upscaledImage element not found');
const saveBtn = document.getElementById('saveBtn');
if (!saveBtn) console.error('saveBtn element not found');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  console.log('Drag over detected');
  dropZone.style.backgroundColor = '#e0e0e0';
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.style.backgroundColor = '';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  console.log('Drop detected, files:', e.dataTransfer.files);
  
  const dtFile = e.dataTransfer.files[0];
  if (imageInput) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(dtFile);
    imageInput.files = dataTransfer.files;
  }
  handleFiles(e.dataTransfer.files);
});

uploadLink.addEventListener('click', (e) => {
  e.preventDefault();
  console.log('Upload link clicked');
  if (imageInput) imageInput.click();
  else console.error('imageInput not available to click');
});

imageInput.addEventListener('change', (e) => {
  console.log('File input changed, files:', e.target.files);
  handleFiles(e.target.files);
});

function handleFiles(files) {
  if (files.length > 1) {
    showError('一度に1枚のみアップロードしてください。');
    return;
  }

  const file = files[0];
  if (!file) {
    showError('ファイルが選択されていません。');
    console.error('No file selected');
    return;
  }

  const maxSize = 200 * 1024 * 1024; 
  if (file.size > maxSize) {
    showError('ファイルが大きすぎます');
    return;
  }

 
  if (!file.type.match('image/(png|jpeg|tiff|webp)')) {
    showError('サポートしていないファイル形式です');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    console.log('File loaded successfully:', file.name);
    if (errorMsg) errorMsg.style.display = 'none';
    if (dropZone) dropZone.style.display = 'none';
    if (selectedFileName) selectedFileName.textContent = `${file.name}が選択されています`;
    if (fileSelected) fileSelected.style.display = 'block';
    if (imageInput) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;
    }
  };
  reader.onerror = (error) => {
    console.error('FileReader error:', error);
    showError('ファイルの読み込みに失敗しました。');
  };
  reader.readAsDataURL(file);
}

reselectBtn.addEventListener('click', () => {
  if (fileSelected) fileSelected.style.display = 'none';
  if (dropZone) dropZone.style.display = 'block';
  if (imageInput) imageInput.value = '';
  document.getElementById('result').innerHTML = '';
  console.log('Reselect button clicked');
});

upscaleBtn.addEventListener('click', async () => {
  if (fileSelected) fileSelected.style.display = 'none';
  if (upscaling) upscaling.style.display = 'block';
  console.log('Upscale button clicked');
  await upscaleImage();
});

cancelBtn.addEventListener('click', () => {
  if (upscaling) upscaling.style.display = 'none';
  if (dropZone) dropZone.style.display = 'block';
  if (progressBar) progressBar.value = 0;
  document.getElementById('result').innerHTML = '';
  console.log('Cancel button clicked');
});

backBtn.addEventListener('click', () => {
  if (completed) completed.style.display = 'none';
  if (dropZone) dropZone.style.display = 'block';
  document.getElementById('result').innerHTML = '';
  console.log('Back button clicked');
});

saveBtn.addEventListener('click', async () => {
  const { dialog } = require('@electron/remote');
  const file = imageInput.files[0];
  const newFilename = `${file.name.replace(/\.[^/.]+$/, '')}_2x.${file.type.split('/')[1]}`;
  const upscaledData = upscaledImage.src.split(',')[1];
  const result = await dialog.showSaveDialog({
    title: '保存先を選択',
    defaultPath: newFilename,
    filters: [
      { name: 'Images', extensions: [file.type.split('/')[1]] }
    ]
  });
  if (!result.canceled && result.filePath) {
    await fs.writeFile(result.filePath, Buffer.from(upscaledData, 'base64'));
    alert('画像が保存されました。');
    console.log('Image saved to:', result.filePath);
  }
});

async function upscaleImage() {
  const file = imageInput.files[0];
  if (!file) {
    console.error('No file available for upscaling');
    return;
  }

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (progressBar) progressBar.value = progress;
    if (progress >= 100) clearInterval(interval);
  }, 200);

  try {
    const arrayBuffer = await file.arrayBuffer();
    let sharpImage = sharp(arrayBuffer);
    const metadata = await sharpImage.metadata();

    sharpImage = sharpImage
      .resize({
        width: metadata.width * 2,
        height: metadata.height * 2,
        kernel: 'cubic',
        fit: 'contain',
      })
      .sharpen({
        sigma: 2,
        flat: 2.0,
        jagged: 3.0
      })
      .modulate({
        brightness: 1.05,
        saturation: 1.08
      });

    let upscaledBuffer;
    const ext = file.type.split('/')[1];
    if (ext === 'jpeg' || ext === 'jpg') {
      upscaledBuffer = await sharpImage.jpeg({ quality: 95 }).toBuffer();
    } else if (ext === 'png') {
      upscaledBuffer = await sharpImage.png({ compressionLevel: 9 }).toBuffer();
    } else if (ext === 'tiff') {
      upscaledBuffer = await sharpImage.tiff({ quality: 95 }).toBuffer();
    } else if (ext === 'webp') {
      upscaledBuffer = await sharpImage.webp({ quality: 95 }).toBuffer();
    } else {
      upscaledBuffer = await sharpImage.toBuffer();
    }

    if (upscaledImage) upscaledImage.src = `data:image/${ext};base64,${upscaledBuffer.toString('base64')}`;
    if (upscaling) upscaling.style.display = 'none';
    if (completed) completed.style.display = 'block';
    console.log('Upscaling completed');
  } catch (error) {
    console.error('Upscaling error:', error);
    alert('画像のアップスケールに失敗しました。もう一度お試しください。');
    if (upscaling) upscaling.style.display = 'none';
    if (dropZone) dropZone.style.display = 'block';
    if (progressBar) progressBar.value = 0;
  }
}

function showError(message) {
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    errorMsg.style.color = 'red';
  }
  document.getElementById('result').innerHTML = '';
}