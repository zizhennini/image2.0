// 常量定义和配置
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION: 4096, // 增加最大尺寸
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  COMPRESSION_QUALITY: 0.95, // 提高压缩质量
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
      downloadAllBtn: document.getElementById('downloadAllBtn'),
      toleranceSlider: document.getElementById('toleranceSlider'),
      toleranceValue: document.getElementById('toleranceValue'),
      brushSizeOriginalSlider: document.getElementById('brushSizeOriginalSlider'),
      brushSizeOriginalValue: document.getElementById('brushSizeOriginalValue'),
      brushSizeSimplifiedSlider: document.getElementById('brushSizeSimplifiedSlider'),
      brushSizeSimplifiedValue: document.getElementById('brushSizeSimplifiedValue')
    };
  }

  setupEventListeners() {
    this.setupFileUpload();
    this.setupToolButtons();
    this.setupColorSelection();
    this.setupCanvasInteraction();
    this.setupExportOptions();
    this.setupNavigationButtons();
    this.setupParameterControls();
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
      
      let processedFile = file;
      
      // 检查是否需要压缩
      const needsCompression = file.size > 8 * 1024 * 1024;
      const needsResize = await this.checkImageSize(file);
      
      // 只有当文件确实需要压缩时才进行压缩
      if (needsCompression || needsResize) {
        processedFile = await imageCompression(file, {
          maxSizeMB: 8, // 增加最大文件大小
          maxWidthOrHeight: CONFIG.MAX_DIMENSION,
          useWebWorker: true,
          quality: CONFIG.COMPRESSION_QUALITY,
          preserveExif: true // 保留图片信息
        });
      }
      
      const image = await this.loadImage(processedFile);
      this.initializeCanvases(image);
      
      // 显示原始文件信息
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const processedSizeMB = (processedFile.size / 1024 / 1024).toFixed(2);
      this.showToast(`图片上传成功！原始: ${fileSizeMB}MB, 处理后: ${processedSizeMB}MB`, 'success');
      
    } catch (error) {
      this.showToast('图片处理失败: ' + error.message, 'error');
    }
  }
  
  checkImageSize(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(img.width > CONFIG.MAX_DIMENSION || img.height > CONFIG.MAX_DIMENSION);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
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
    
    // 设置画布尺寸为图片原始尺寸
    [this.elements.originalCanvas, this.elements.simplifiedCanvas].forEach(canvas => {
      canvas.width = image.width;
      canvas.height = image.height;
      
      // 设置画布样式以保持高质量显示
      canvas.style.imageRendering = 'pixelated';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
    });
    
    // 使用高质量绘制
    const ctx = this.elements.originalCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // 保持像素完整性
    ctx.drawImage(image, 0, 0);
    
    this.originalImageData = ctx.getImageData(0, 0, image.width, image.height);
    
    // 更新图片信息显示
    const fileSizeInfo = this.image.src ? `，大小: ${(this.image.src.length / 1024 / 1024 * 0.75).toFixed(2)}MB` : '';
    document.getElementById('img-info').textContent = `尺寸：${image.width}x${image.height}${fileSizeInfo}`;
    
    document.getElementById('originalEditTool').classList.remove('hidden');
    
    this.setupOriginalColorPicker();
    this.resetEditHistory();
  }

  setupToolButtons() {
    // 原图工具
    ['brush', 'fill'].forEach(tool => {
      const btn = document.getElementById(`original${tool.charAt(0).toUpperCase() + tool.slice(1)}Btn`);
      if (btn) {
        btn.addEventListener('click', () => this.setTool('original', tool));
      }
    });
    
    // 简化图工具
    ['brush', 'fill'].forEach(tool => {
      const btn = document.getElementById(`simplified${tool.charAt(0).toUpperCase() + tool.slice(1)}Btn`);
      if (btn) {
        btn.addEventListener('click', () => this.setTool('simplified', tool));
      }
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
          this.showToast('自定义功能开发中，请选择其他色系', 'warning');
          input.checked = false;
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
    if (!tool.selectedColor) {
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
    
    this.showToast('正在生成简化图像...', 'info');
    
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

  setupNavigationButtons() {
    // 下一步按钮
    const nextStepBtn = document.getElementById('nextStepBtn');
    if (nextStepBtn) {
      nextStepBtn.addEventListener('click', () => this.showColorSelection());
    }

    // 撤销按钮
    const undoOriginalBtn = document.getElementById('undoOriginalBtn');
    if (undoOriginalBtn) {
      undoOriginalBtn.addEventListener('click', () => this.undoEdit('original'));
    }

    const undoSimplifiedBtn = document.getElementById('undoSimplifiedBtn');
    if (undoSimplifiedBtn) {
      undoSimplifiedBtn.addEventListener('click', () => this.undoEdit('simplified'));
    }

    // 重置按钮
    const resetOriginalBtn = document.getElementById('resetOriginalBtn');
    if (resetOriginalBtn) {
      resetOriginalBtn.addEventListener('click', () => this.resetCanvas('original'));
    }

    const resetSimplifiedBtn = document.getElementById('resetSimplifiedBtn');
    if (resetSimplifiedBtn) {
      resetSimplifiedBtn.addEventListener('click', () => this.resetCanvas('simplified'));
    }

    // 返回按钮
    const backToOriginalBtn = document.getElementById('backToOriginalBtn');
    if (backToOriginalBtn) {
      backToOriginalBtn.addEventListener('click', () => this.backToOriginal());
    }

    const backToSimplifiedBtn = document.getElementById('backToSimplifiedBtn');
    if (backToSimplifiedBtn) {
      backToSimplifiedBtn.addEventListener('click', () => this.backToSimplified());
    }

    const backToColorSelectionBtn = document.getElementById('backToColorSelectionBtn');
    if (backToColorSelectionBtn) {
      backToColorSelectionBtn.addEventListener('click', () => this.backToColorSelection());
    }
  }

  showColorSelection() {
    document.getElementById('originalEditTool').classList.add('hidden');
    document.getElementById('colorSelection').classList.remove('hidden');
    this.showToast('请选择颜色系', 'info');
  }

  undoEdit(canvasType) {
    if (this.editHistory[canvasType].length > 0) {
      const canvas = this.elements[`${canvasType}Canvas`];
      const ctx = canvas.getContext('2d');
      const prevState = this.editHistory[canvasType].pop();
      
      ctx.putImageData(prevState, 0, 0);
      
      if (canvasType === 'simplified') {
        this.simplifiedImageData = prevState;
      }
      
      // 更新撤销按钮状态
      const undoBtn = document.getElementById(`undo${canvasType.charAt(0).toUpperCase() + canvasType.slice(1)}Btn`);
      if (undoBtn && this.editHistory[canvasType].length === 0) {
        undoBtn.disabled = true;
      }
      
      this.showToast('已撤销操作', 'success');
    }
  }

  resetCanvas(canvasType) {
    if (confirm('确定要重置所有修改吗？')) {
      const canvas = this.elements[`${canvasType}Canvas`];
      const ctx = canvas.getContext('2d');
      
      if (canvasType === 'original') {
        ctx.drawImage(this.image, 0, 0);
      } else if (canvasType === 'simplified' && this.currentColorScheme) {
        this.generateSimplifiedImage();
      }
      
      this.editHistory[canvasType] = [];
      
      // 更新撤销按钮状态
      const undoBtn = document.getElementById(`undo${canvasType.charAt(0).toUpperCase() + canvasType.slice(1)}Btn`);
      if (undoBtn) {
        undoBtn.disabled = true;
      }
      
      this.showToast('已重置画布', 'success');
    }
  }

  backToOriginal() {
    document.getElementById('maskContainer').classList.add('hidden');
    document.getElementById('layerContainer').classList.add('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('backToEditContainer').classList.add('hidden');
    document.getElementById('originalEditTool').classList.remove('hidden');
    this.showToast('已返回原图编辑模式', 'info');
  }

  backToSimplified() {
    document.getElementById('maskContainer').classList.add('hidden');
    document.getElementById('layerContainer').classList.add('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('backToEditContainer').classList.add('hidden');
    document.getElementById('simplifiedEditTool').classList.remove('hidden');
    this.showToast('已返回简化图编辑模式', 'info');
  }

  backToColorSelection() {
    document.getElementById('maskContainer').classList.add('hidden');
    document.getElementById('layerContainer').classList.add('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('backToEditContainer').classList.add('hidden');
    document.getElementById('simplifiedEditTool').classList.add('hidden');
    document.getElementById('colorSelection').classList.remove('hidden');
    this.showToast('已返回色系选择', 'info');
  }

  setupParameterControls() {
    // 容差设置
    if (this.elements.toleranceSlider && this.elements.toleranceValue) {
      this.elements.toleranceSlider.addEventListener('input', () => {
        this.settings.tolerance = parseInt(this.elements.toleranceSlider.value);
        this.elements.toleranceValue.textContent = this.settings.tolerance;
      });
    }

    // 原图画笔大小
    if (this.elements.brushSizeOriginalSlider && this.elements.brushSizeOriginalValue) {
      this.elements.brushSizeOriginalSlider.addEventListener('input', () => {
        const size = parseInt(this.elements.brushSizeOriginalSlider.value);
        this.settings.brushSize.original = size;
        this.elements.brushSizeOriginalValue.textContent = `${size} 像素`;
      });
    }

    // 简化图画笔大小
    if (this.elements.brushSizeSimplifiedSlider && this.elements.brushSizeSimplifiedValue) {
      this.elements.brushSizeSimplifiedSlider.addEventListener('input', () => {
        const size = parseInt(this.elements.brushSizeSimplifiedSlider.value);
        this.settings.brushSize.simplified = size;
        this.elements.brushSizeSimplifiedValue.textContent = `${size} 像素`;
      });
    }
  }

  generateMasks() {
    if (!this.simplifiedImageData) {
      this.showToast('请先生成简化图像', 'warning');
      return;
    }
    
    this.showToast('正在生成遮罩和图层...', 'info');
    
    const width = this.image.width;
    const height = this.image.height;
    const data = this.simplifiedImageData.data;
    
    // 生成各颜色的遮罩
    const masks = {};
    for (const [colorName, colorValue] of Object.entries(this.currentColorScheme)) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d');
      const maskData = maskCtx.createImageData(width, height);
      
      // 生成单色遮罩
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r === colorValue[0] && g === colorValue[1] && b === colorValue[2]) {
          maskData.data[i] = colorValue[0];
          maskData.data[i + 1] = colorValue[1];
          maskData.data[i + 2] = colorValue[2];
          maskData.data[i + 3] = 255;
        } else {
          maskData.data[i] = 0;
          maskData.data[i + 1] = 0;
          maskData.data[i + 2] = 0;
          maskData.data[i + 3] = 0;
        }
      }
      
      // 添加定位标记
      this.addCornerMarkers(maskCtx, width, height);
      
      maskCtx.putImageData(maskData, 0, 0);
      masks[colorName] = maskCanvas;
    }
    
    // 显示遮罩
    this.displayMasks(masks);
    
    // 生成合成图层
    this.generateLayers(masks);
    
    // 生成实物预览
    this.generatePreview();
    
    // 显示结果区域
    document.getElementById('maskContainer').classList.remove('hidden');
    document.getElementById('layerContainer').classList.remove('hidden');
    document.getElementById('previewContainer').classList.remove('hidden');
    document.getElementById('backToEditContainer').classList.remove('hidden');
    
    this.showToast('生成完成！', 'success');
  }
  
  addCornerMarkers(ctx, width, height) {
    ctx.fillStyle = '#ff0000';
    const markerSize = 2;
    ctx.fillRect(0, 0, markerSize, markerSize); // 左上
    ctx.fillRect(width - markerSize, 0, markerSize, markerSize); // 右上
    ctx.fillRect(0, height - markerSize, markerSize, markerSize); // 左下
    ctx.fillRect(width - markerSize, height - markerSize, markerSize, markerSize); // 右下
  }
  
  displayMasks(masks) {
    const container = document.getElementById('masks');
    container.innerHTML = '';
    
    this.maskList = [];
    
    for (const [colorName, canvas] of Object.entries(masks)) {
      const imgElement = document.createElement('img');
      imgElement.src = canvas.toDataURL();
      imgElement.className = 'w-32 h-32 rounded border hover:shadow-lg cursor-pointer transition-all';
      imgElement.title = colorName;
      imgElement.onclick = () => this.downloadImage(imgElement.src, `${colorName}_遮罩.png`);
      
      const wrapper = document.createElement('div');
      wrapper.className = 'text-center';
      wrapper.appendChild(imgElement);
      
      const label = document.createElement('p');
      label.textContent = colorName;
      label.className = 'text-sm mt-2';
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
      
      this.maskList.push({
        name: colorName,
        canvas: canvas,
        dataURL: imgElement.src
      });
    }
  }
  
  generateLayers(masks) {
    const container = document.getElementById('layers');
    container.innerHTML = '';
    
    // 定义PCB图层组合
    const layerDefinitions = {
      '正面铜皮层': ['浅蓝', '浅红', '浅紫', '浅青', '浅黄', '浅橙', '浅粉', '黑色'],
      '正面阻焉层': ['深绿', '浅绿', '黑色'],
      '丝印层': ['白色'],
      '背面阻焉层': ['浅绿']
    };
    
    for (const [layerName, colorNames] of Object.entries(layerDefinitions)) {
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = this.image.width;
      layerCanvas.height = this.image.height;
      const layerCtx = layerCanvas.getContext('2d');
      
      // 合成图层
      for (const colorName of colorNames) {
        if (masks[colorName]) {
          layerCtx.drawImage(masks[colorName], 0, 0);
        }
      }
      
      if (layerCanvas.getContext('2d').getImageData(0, 0, 1, 1).data[3] === 0) {
        continue; // 跳过空图层
      }
      
      const imgElement = document.createElement('img');
      imgElement.src = layerCanvas.toDataURL();
      imgElement.className = 'w-32 h-32 rounded border hover:shadow-lg cursor-pointer transition-all';
      imgElement.title = layerName;
      imgElement.onclick = () => this.downloadImage(imgElement.src, `${layerName}.png`);
      
      const wrapper = document.createElement('div');
      wrapper.className = 'text-center';
      wrapper.appendChild(imgElement);
      
      const label = document.createElement('p');
      label.textContent = layerName;
      label.className = 'text-sm mt-2';
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
      
      this.maskList.push({
        name: layerName,
        canvas: layerCanvas,
        dataURL: imgElement.src
      });
    }
  }
  
  generatePreview() {
    const previewCanvas = document.getElementById('previewCanvas');
    previewCanvas.width = this.image.width;
    previewCanvas.height = this.image.height;
    
    const ctx = previewCanvas.getContext('2d');
    const data = ctx.getImageData(0, 0, this.image.width, this.image.height);
    const simplifiedData = this.simplifiedImageData;
    
    // 生成实物预览（将黑色替换为银色）
    for (let i = 0; i < simplifiedData.data.length; i += 4) {
      if (simplifiedData.data[i] === 6 && simplifiedData.data[i+1] === 16 && simplifiedData.data[i+2] === 8) {
        // 黑色替换为银色
        data.data[i] = 160;
        data.data[i+1] = 160;
        data.data[i+2] = 160;
        data.data[i+3] = 255;
      } else {
        data.data[i] = simplifiedData.data[i];
        data.data[i+1] = simplifiedData.data[i+1];
        data.data[i+2] = simplifiedData.data[i+2];
        data.data[i+3] = simplifiedData.data[i+3];
      }
    }
    
    ctx.putImageData(data, 0, 0);
    
    const previewImg = document.createElement('img');
    previewImg.src = previewCanvas.toDataURL();
    previewImg.className = 'w-32 h-32 rounded border hover:shadow-lg cursor-pointer transition-all';
    previewImg.title = '实物预览图';
    previewImg.onclick = () => this.downloadImage(previewImg.src, '实物预览图.png');
    
    const previewContainer = document.getElementById('preview');
    previewContainer.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'text-center';
    wrapper.appendChild(previewImg);
    
    const label = document.createElement('p');
    label.textContent = '实物预览图';
    label.className = 'text-sm mt-2';
    wrapper.appendChild(label);
    
    previewContainer.appendChild(wrapper);
    
    this.maskList.push({
      name: '实物预览图',
      canvas: previewCanvas,
      dataURL: previewImg.src
    });
  }
  
  downloadImage(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadAllAsZip() {
    if (!this.maskList || this.maskList.length === 0) {
      this.showToast('请先生成遮罩图层', 'warning');
      return;
    }
    
    const customFilename = document.getElementById('customFilename')?.value.trim() || 'pcb灯光画';
    this.showToast('正在打包下载...', 'info');
    
    const zip = new JSZip();
    
    // 添加所有生成的图片到ZIP
    this.maskList.forEach(({ name, dataURL }) => {
      if (dataURL && dataURL.includes('data:image')) {
        const base64Data = dataURL.split(',')[1];
        let filename = name;
        
        // 重命名映射
        const renameMap = {
          '正面铜皮层': '放在顶层',
          '白色': '放在顶层丝印层',
          '正面阻焉层': '放在顶层阻焉层',
          '背面阻焉层': '放在底层阻焉层注意镜像',
          '实物预览图': '实物预览图'
        };
        
        if (renameMap[name]) {
          filename = renameMap[name];
        }
        
        zip.file(`${filename}.png`, base64Data, { base64: true });
      }
    });
    
    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, `${customFilename}.zip`);
      this.showToast('下载完成！', 'success');
    }).catch((error) => {
      this.showToast('打包失败: ' + error.message, 'error');
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