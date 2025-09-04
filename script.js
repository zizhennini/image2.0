// 常量定义和配置
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION: 2048,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  COMPRESSION_QUALITY: 0.8,
  DEFAULT_TOLERANCE: 30,
  DEFAULT_BRUSH_SIZE: 5,
  MAX_HISTORY_SIZE: 20
};

// 扩展的颜色方案
const COLOR_SCHEMES = {
  blue: {
    '深蓝': [22, 31, 125], '浅蓝': [93, 167, 227],
    '深绿': [25, 53, 34], '浅绿': [249, 225, 149],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  red: {
    '深红': [125, 22, 22], '浅红': [227, 93, 93],
    '深绿': [25, 53, 34], '浅绿': [249, 225, 149],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  purple: {
    '深紫': [125, 22, 125], '浅紫': [227, 93, 227],
    '深绿': [25, 53, 34], '浅绿': [249, 225, 149],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  green: {
    '深绿': [34, 125, 22], '浅绿': [149, 227, 93],
    '深青': [22, 125, 125], '浅青': [93, 227, 227],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  yellow: {
    '深黄': [125, 125, 22], '浅黄': [227, 227, 93],
    '深橙': [125, 75, 22], '浅橙': [227, 175, 93],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  orange: {
    '深橙': [125, 75, 22], '浅橙': [227, 175, 93],
    '深红': [125, 22, 22], '浅红': [227, 93, 93],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  pink: {
    '深粉': [125, 22, 75], '浅粉': [227, 93, 175],
    '深紫': [125, 22, 125], '浅紫': [227, 93, 227],
    '黑色': [6, 16, 8], '白色': [230, 234, 235]
  },
  custom: {}
};

const REPLACE_COLORS = {
  '深蓝': [22, 31, 125], '浅蓝': [93, 167, 227],
  '深绿': [25, 53, 34], '浅绿': [249, 225, 149],
  '黑色': [6, 16, 8], '白色': [230, 234, 235],
  '深紫': [125, 22, 125], '浅紫': [227, 93, 227],
  '深红': [125, 22, 22], '浅红': [227, 93, 93],
  '深青': [22, 125, 125], '浅青': [93, 227, 227],
  '深黄': [125, 125, 22], '浅黄': [227, 227, 93],
  '深橙': [125, 75, 22], '浅橙': [227, 175, 93],
  '深粉': [125, 22, 75], '浅粉': [227, 93, 175]
};

// 工具类
class ImageProcessor {
  static adjustBrightness(imageData, brightness) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + brightness));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
    }
    return imageData;
  }

  static adjustContrast(imageData, contrast) {
    const data = imageData.data;
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
    return imageData;
  }

  static colorDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
      Math.pow(color1[1] - color2[1], 2) +
      Math.pow(color1[2] - color2[2], 2)
    );
  }

  static floodFill(imageData, startX, startY, newColor, tolerance = 0) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const startIndex = (startY * width + startX) * 4;
    const targetColor = [data[startIndex], data[startIndex + 1], data[startIndex + 2]];
    
    if (this.colorDistance(targetColor, newColor) <= tolerance) return;
    
    const visited = new Set();
    const queue = [[startX, startY]];
    
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const index = (y * width + x) * 4;
      const currentColor = [data[index], data[index + 1], data[index + 2]];
      
      if (this.colorDistance(targetColor, currentColor) > tolerance) continue;
      
      visited.add(key);
      data[index] = newColor[0];
      data[index + 1] = newColor[1];
      data[index + 2] = newColor[2];
      
      queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    }
  }
}

// 主应用类
class PCBImageProcessor {
  constructor() {
    this.image = null;
    this.originalImageData = null;
    this.currentColorScheme = {};
    this.simplifiedImageData = null;
    this.editHistory = { original: [], simplified: [] };
    this.maskList = [];
    
    this.tools = {
      original: { type: 'brush', selectedColor: null },
      simplified: { type: 'brush', selectedColor: null }
    };
    
    this.settings = {
      tolerance: CONFIG.DEFAULT_TOLERANCE,
      brushSize: { original: CONFIG.DEFAULT_BRUSH_SIZE, simplified: CONFIG.DEFAULT_BRUSH_SIZE },
      imageFormat: 'png',
      imageQuality: 0.9
    };
    
    this.selections = {
      original: { isDrawing: false, points: [] },
      simplified: { isDrawing: false, points: [] }
    };

    this.initElements();
    this.setupEventListeners();
  }

  initElements() {
    this.elements = {
      uploader: document.getElementById('uploader'),
      dropArea: document.getElementById('drop-area'),
      originalCanvas: document.getElementById('originalCanvas'),
      simplifiedCanvas: document.getElementById('simplifiedCanvas'),
      toast: document.getElementById('toast'),
      generateBtn: document.getElementById('generateBtn'),
      downloadAllBtn: document.getElementById('downloadAllBtn')
    };
  }

  setupEventListeners() {
    this.setupFileUpload();
    this.setupToolButtons();
    this.setupColorSelection();
    this.setupCanvasInteraction();
    this.setupExportOptions();
  }

  setupFileUpload() {
    const { dropArea, uploader } = this.elements;
    
    dropArea.addEventListener('click', () => uploader.click());
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('dragover');
    });
    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('dragover');
    });
    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      this.handleImageUpload(e.dataTransfer.files[0]);
    });
    uploader.addEventListener('change', (e) => {
      this.handleImageUpload(e.target.files[0]);
    });
  }

  async handleImageUpload(file) {
    if (!this.validateFile(file)) return;

    try {
      this.showToast('正在处理图片...', 'info');
      
      const compressed = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: CONFIG.MAX_DIMENSION,
        useWebWorker: true,
        quality: CONFIG.COMPRESSION_QUALITY
      });
      
      const image = await this.loadImage(compressed);
      this.initializeCanvases(image);
      this.showToast('图片上传成功！', 'success');
      
    } catch (error) {
      this.showToast('图片处理失败: ' + error.message, 'error');
    }
  }

  validateFile(file) {
    if (!file) {
      this.showToast('请选择文件', 'error');
      return false;
    }
    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
      this.showToast('不支持的文件格式', 'error');
      return false;
    }
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      this.showToast('文件大小超过限制', 'error');
      return false;
    }
    return true;
  }

  loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('图片加载失败'));
        image.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  initializeCanvases(image) {
    this.image = image;
    
    [this.elements.originalCanvas, this.elements.simplifiedCanvas].forEach(canvas => {
      canvas.width = image.width;
      canvas.height = image.height;
    });
    
    const ctx = this.elements.originalCanvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    this.originalImageData = ctx.getImageData(0, 0, image.width, image.height);
    
    document.getElementById('img-info').textContent = `尺寸：${image.width}x${image.height}`;
    document.getElementById('preprocessSettings').classList.remove('hidden');
    document.getElementById('originalEditTool').classList.remove('hidden');
    
    this.setupOriginalColorPicker();
    this.resetEditHistory();
  }

  setupToolButtons() {
    ['original', 'simplified'].forEach(type => {
      ['brush', 'lasso', 'fill', 'eraser'].forEach(tool => {
        const btn = document.getElementById(`${type}${tool.charAt(0).toUpperCase() + tool.slice(1)}Btn`);
        if (btn) {
          btn.addEventListener('click', () => this.setTool(type, tool));
        }
      });
    });
  }

  setTool(canvasType, tool) {
    this.tools[canvasType].type = tool;
    
    document.querySelectorAll(`#${canvasType}EditTool .tool-button`).forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${canvasType}${tool.charAt(0).toUpperCase() + tool.slice(1)}Btn`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  setupColorSelection() {
    document.querySelectorAll('input[name="mainColor"]').forEach(input => {
      input.addEventListener('change', () => {
        if (input.value === 'custom') {
          document.getElementById('customColorSettings').classList.remove('hidden');
        } else {
          document.getElementById('customColorSettings').classList.add('hidden');
          this.currentColorScheme = COLOR_SCHEMES[input.value];
          this.generateSimplifiedImage();
        }
      });
    });
  }

  setupOriginalColorPicker() {
    const container = document.getElementById('availableColorsOriginal');
    container.innerHTML = '';
    
    Object.entries(REPLACE_COLORS).forEach(([name, color]) => {
      const colorDiv = this.createColorPicker(name, color, (selectedColor) => {
        this.tools.original.selectedColor = selectedColor;
      });
      container.appendChild(colorDiv);
    });
  }

  createColorPicker(name, color, onSelect) {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-picker';
    colorDiv.style.backgroundColor = `rgb(${color.join(',')})`;
    colorDiv.title = name;
    
    colorDiv.addEventListener('click', () => {
      colorDiv.parentElement.querySelectorAll('.color-picker').forEach(el => {
        el.classList.remove('selected');
      });
      colorDiv.classList.add('selected');
      onSelect(color);
    });
    
    return colorDiv;
  }

  setupCanvasInteraction() {
    ['original', 'simplified'].forEach(type => {
      const canvas = this.elements[`${type}Canvas`];
      canvas.addEventListener('click', (e) => this.handleCanvasClick(e, type));
    });
  }

  handleCanvasClick(e, canvasType) {
    const tool = this.tools[canvasType];
    if (!tool.selectedColor && tool.type !== 'eraser') {
      this.showToast('请先选择颜色', 'warning');
      return;
    }
    
    const rect = e.target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (e.target.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (e.target.height / rect.height));
    
    this.saveCanvasState(canvasType);
    
    switch (tool.type) {
      case 'fill':
        this.applyFillTool({ x, y }, canvasType);
        break;
      case 'brush':
        this.applyBrushTool({ x, y }, canvasType);
        break;
    }
  }

  applyFillTool(coords, canvasType) {
    const canvas = this.elements[`${canvasType}Canvas`];
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const newColor = this.tools[canvasType].selectedColor || [255, 255, 255];
    ImageProcessor.floodFill(imageData, coords.x, coords.y, newColor, this.settings.tolerance);
    
    ctx.putImageData(imageData, 0, 0);
    if (canvasType === 'simplified') {
      this.simplifiedImageData = imageData;
    }
    
    this.showToast('填充完成', 'success');
  }

  applyBrushTool(coords, canvasType) {
    const canvas = this.elements[`${canvasType}Canvas`];
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const brushSize = this.settings.brushSize[canvasType];
    const newColor = this.tools[canvasType].selectedColor || [255, 255, 255];
    
    const radius = Math.floor(brushSize / 2);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = coords.x + dx;
        const y = coords.y + dy;
        
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const index = (y * canvas.width + x) * 4;
          imageData.data[index] = newColor[0];
          imageData.data[index + 1] = newColor[1];
          imageData.data[index + 2] = newColor[2];
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    if (canvasType === 'simplified') {
      this.simplifiedImageData = imageData;
    }
  }

  generateSimplifiedImage() {
    if (!this.image || !this.currentColorScheme) return;
    
    const ctx = this.elements.originalCanvas.getContext('2d');
    const data = ctx.getImageData(0, 0, this.image.width, this.image.height);
    
    const simplified = this.elements.simplifiedCanvas.getContext('2d');
    this.simplifiedImageData = simplified.createImageData(this.image.width, this.image.height);
    
    for (let i = 0; i < data.data.length; i += 4) {
      const pixel = [data.data[i], data.data[i+1], data.data[i+2]];
      let closest = Object.keys(this.currentColorScheme)[0];
      let minDist = Infinity;
      
      for (const [name, color] of Object.entries(this.currentColorScheme)) {
        const distance = ImageProcessor.colorDistance(pixel, color);
        if (distance < minDist) {
          minDist = distance;
          closest = name;
        }
      }
      
      const mappedColor = this.currentColorScheme[closest];
      this.simplifiedImageData.data.set([...mappedColor, 255], i);
    }
    
    simplified.putImageData(this.simplifiedImageData, 0, 0);
    
    this.setupSimplifiedColorPicker();
    document.getElementById('simplifiedEditTool').classList.remove('hidden');
    this.showToast('简化图像生成完成', 'success');
  }

  setupSimplifiedColorPicker() {
    const container = document.getElementById('availableColorsSimplified');
    container.innerHTML = '';
    
    Object.entries(this.currentColorScheme).forEach(([name, color]) => {
      const colorDiv = this.createColorPicker(name, color, () => {
        this.tools.simplified.selectedColor = color;
      });
      container.appendChild(colorDiv);
    });
  }

  saveCanvasState(canvasType) {
    const canvas = this.elements[`${canvasType}Canvas`];
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    this.editHistory[canvasType].push(new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    ));
    
    if (this.editHistory[canvasType].length > CONFIG.MAX_HISTORY_SIZE) {
      this.editHistory[canvasType].shift();
    }
  }

  resetEditHistory() {
    this.editHistory = { original: [], simplified: [] };
  }

  setupExportOptions() {
    if (this.elements.generateBtn) {
      this.elements.generateBtn.addEventListener('click', () => this.generateMasks());
    }
    
    if (this.elements.downloadAllBtn) {
      this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAllAsZip());
    }
  }

  generateMasks() {
    this.showToast('正在生成遮罩和图层...', 'info');
    // 遮罩生成逻辑
    this.showToast('生成完成！', 'success');
  }

  downloadAllAsZip() {
    const customFilename = document.getElementById('customFilename')?.value.trim() || 'pcb灯光画';
    this.showToast('正在打包下载...', 'info');
    
    const zip = new JSZip();
    // 添加文件到zip
    
    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, `${customFilename}.zip`);
      this.showToast('下载完成！', 'success');
    });
  }

  showToast(message, type = 'info') {
    const toast = this.elements.toast;
    toast.textContent = message;
    toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded shadow fade text-sm z-50 ${type}`;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new PCBImageProcessor();
});