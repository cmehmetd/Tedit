/**
 * Tedit - Modern YouTube Thumbnail Editor
 * Client-Side Engine (Pure HTML5 Canvas + Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Canvas Elements & Contexts
  const mainCanvas = document.getElementById('main-canvas');
  const mainCtx = mainCanvas.getContext('2d');
  const interactiveCanvas = document.getElementById('interactive-canvas');
  const interCtx = interactiveCanvas.getContext('2d');
  const canvasViewport = document.getElementById('canvas-viewport');
  const canvasWrapper = document.getElementById('canvas-wrapper');

  // Application State
  const state = {
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: '#FFFFFF',
    layers: [],
    selectedLayerId: null,
    selectedLayerIds: [],
    activeTool: 'select', // 'select' | 'drawing'
    history: [],
    historyIndex: -1,
    scale: 1,
    
    // Zoom & Pan State
    userZoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    spacePressed: false,
    
    // Magnetic Snap Guidelines State
    snapLines: { x: false, y: false },
    
    // Interaction State
    isDragging: false,
    dragHandle: null, // null | 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'
    dragStart: { x: 0, y: 0 },
    initialLayerState: null,
    
    // Drawing State
    drawingBrush: {
      color: '#FF2B2B',
      size: 12,
      points: []
    }
  };

  // DOM Elements
  const layersListEl = document.getElementById('layers-list');
  const layersEmptyStateEl = document.getElementById('layers-empty-state');
  const layersCountEl = document.getElementById('layers-count');
  const layerActiveControls = document.getElementById('layer-active-controls');
  const layerOpacitySlider = document.getElementById('layer-opacity-slider');
  const layerOpacityNum = document.getElementById('layer-opacity-num');

  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnExportMain = document.getElementById('btn-export-main');
  const btnExportOptions = document.getElementById('btn-export-options');
  const exportMenu = document.getElementById('export-menu');
  const exportPngBtn = document.getElementById('export-png');
  const exportJpgBtn = document.getElementById('export-jpg');

  // Floating Bottom Tools
  const toolTextBtn = document.getElementById('tool-text-btn');
  const toolShapeBtn = document.getElementById('tool-shape-btn');
  const toolDrawBtn = document.getElementById('tool-draw-btn');
  const shapesMenu = document.getElementById('shapes-menu');
  const imageUploadInput = document.getElementById('image-upload-input');
  const removeBgBtn = document.getElementById('remove-bg-btn');
  const removeBgMenu = document.getElementById('remove-bg-menu');
  const removeBgColor = document.getElementById('remove-bg-color');
  const removeBgTolerance = document.getElementById('remove-bg-tolerance');
  const removeBgToleranceValue = document.getElementById('remove-bg-tolerance-value');
  const applyRemoveBg = document.getElementById('apply-remove-bg');
  const translationSets = {
    en: {"Arka Plan:":"Background:","İndir":"Download","Özellikler":"Properties","Seçim Yok":"No Selection","Katmanlar":"Layers","Metin":"Text","Şekil":"Shape","Çizim":"Drawing","Görsel":"Image","Arkaplanı Kaldır":"Remove Background","Uygula":"Apply","Silinecek renk":"Color to remove","Tolerans:":"Tolerance:","Metin İçeriği":"Text Content","Yazı girin...":"Enter text...","Yazı Tipi (Font)":"Font Family","Yazı Boyutu":"Font Size","Yazı Rengi":"Text Color","Kenarlık":"Stroke","Kenar Kalınlığı":"Stroke Width","Thumbnail Gölge Efekti":"Thumbnail Shadow Effect","Gölge Rengi":"Shadow Color","Dolgu":"Fill","Dolgu Rengi":"Fill Color","Kenarlık Rengi":"Stroke Color","Köşe Yuvarlaklığı":"Corner Radius","Fırça Rengi":"Brush Color","Fırça Kalınlığı":"Brush Size","Çizim Modunu Kapat":"Finish Drawing","Döndürme Açısı":"Rotation Angle","Üste":"Up","Alta":"Down","Geri Al":"Undo","İleri Al":"Redo","Dikdörtgen":"Rectangle","Daire":"Circle","Yıldız / Parlama":"Star / Burst","Ok İşareti":"Arrow","Thumbnail Rozeti":"Thumbnail Badge","Düzenlemek için canvas üzerinden bir metin, şekil veya katman seçin.":"Select text, a shape, or a layer on the canvas to edit it.","Çizim Modu Devrede":"Drawing Mode Active","Opaklık":"Opacity","Bir Üste Taşı":"Move Up","Bir Alta Taşı":"Move Down","Çoğalt":"Duplicate","Katmanı Sil":"Delete Layer","Henüz katman yok":"No layers yet","Metin, şekil veya çizim ekleyerek başlayın.":"Add text, shapes, or drawings to get started.","Canvas Arka Plan Rengi":"Canvas Background Color","Format Seçenekleri":"Format Options","PNG (Yüksek Kalite)":"PNG (High Quality)","JPG (Küçük Boyut)":"JPG (Small File)","Yazı Ekle":"Add Text","Şekil Ekle":"Add Shape","Serbest Çizim":"Freehand Drawing","Görsel veya Arka Plan Yükle":"Upload Image or Background","Seçili görselin arka planını kaldır":"Remove the selected image background","Dil seçin":"Select language","Gizle":"Hide","Göster":"Show","Katmanı":"Layer"}
  };
  translationSets.en['Öğe Seçilmedi'] = 'No Item Selected';
  let translations = translationSets.en;
  const originalText = new WeakMap();
  const originalAttributes = new Map();

  function t(key) {
    return translations[key] || key;
  }

  function translatePage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const original = originalText.get(node) || node.nodeValue.trim();
      originalText.set(node, original);
      if (original && translations[original]) {
        node.nodeValue = node.nodeValue.replace(original, translations[original]);
      }
    });
    document.querySelectorAll('[title], [placeholder], [aria-label]').forEach(el => {
      ['title', 'placeholder', 'aria-label'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        const attrKey = `${attr}:${el.id}`;
        const original = originalAttributes.get(attrKey) || el.getAttribute(attr);
        originalAttributes.set(attrKey, original);
        if (translations[original]) {
          el.setAttribute(attr, translations[original]);
        }
      });
    });
    document.querySelectorAll('.shape-opt').forEach(btn => {
      const key = btn.dataset.translationKey;
      if (key) btn.lastChild.textContent = ` ${t(key)}`;
    });
  }

  function loadLanguage(code) {
    translations = translationSets.en;
    translatePage();
    updateUI();
    render();
  }

  // Top Bar View Elements
  const propBgColor = document.getElementById('prop-bg-color');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const zoomVal = document.getElementById('zoom-val');

  // Left Properties Panel Elements
  const propTypeBadge = document.getElementById('prop-type-badge');
  const noSelectionHint = document.getElementById('no-selection-hint');
  const textProps = document.getElementById('text-props');
  const shapeProps = document.getElementById('shape-props');
  const drawProps = document.getElementById('draw-props');
  const transformProps = document.getElementById('transform-props');
  const propRotation = document.getElementById('prop-rotation');
  const propRotationNum = document.getElementById('prop-rotation-num');

  // Text Inputs
  const propTextContent = document.getElementById('prop-text-content');
  const propFontFamily = document.getElementById('prop-font-family');
  const propFontSize = document.getElementById('prop-font-size');
  const propFontSizeNum = document.getElementById('prop-font-size-num');
  const propTextColor = document.getElementById('prop-text-color');
  const textColorHex = document.getElementById('text-color-hex');
  const propStrokeColor = document.getElementById('prop-stroke-color');
  const strokeColorHex = document.getElementById('stroke-color-hex');
  const propStrokeWidth = document.getElementById('prop-stroke-width');
  const propStrokeWidthNum = document.getElementById('prop-stroke-width-num');
  const propTextShadow = document.getElementById('prop-text-shadow');
  const propShadowColor = document.getElementById('prop-shadow-color');
  const shadowColorHex = document.getElementById('shadow-color-hex');

  // Shape Inputs
  const propShapeFillEnabled = document.getElementById('prop-shape-fill-enabled');
  const shapeFillCol = document.getElementById('shape-fill-col');
  const propShapeFill = document.getElementById('prop-shape-fill');
  const shapeFillHex = document.getElementById('shape-fill-hex');
  const propShapeStroke = document.getElementById('prop-shape-stroke');
  const shapeStrokeHex = document.getElementById('shape-stroke-hex');
  const propShapeStrokeWidth = document.getElementById('prop-shape-stroke-width');
  const propShapeStrokeNum = document.getElementById('prop-shape-stroke-num');
  const propShapeRadius = document.getElementById('prop-shape-radius');
  const propShapeRadiusNum = document.getElementById('prop-shape-radius-num');

  // Draw Inputs
  const brushColorInput = document.getElementById('brush-color');
  const brushColorHex = document.getElementById('brush-color-hex');
  const brushSizeInput = document.getElementById('brush-size');
  const brushSizeNum = document.getElementById('brush-size-num');
  const btnFinishDrawing = document.getElementById('btn-finish-drawing');

  // Layer Actions
  const btnLayerUp = document.getElementById('btn-layer-up');
  const btnLayerDown = document.getElementById('btn-layer-down');
  const btnLayerDuplicate = document.getElementById('btn-layer-duplicate');
  const btnLayerDelete = document.getElementById('btn-layer-delete');

  // =========================================================================
  // Initialization & Responsive Viewport Scaling
  // =========================================================================

  function init() {
    loadLanguage();
    setupCanvasScaling();
    window.addEventListener('resize', setupCanvasScaling);
    bindEvents();
    
    // Start with clean canvas
    saveHistoryState();
    render();
    updateZoomDisplay();
  }

  function setupCanvasScaling() {
    const isLargeScreen = window.innerWidth > 1050;
    const paddingLeft = isLargeScreen ? 320 : 24;
    const paddingRight = isLargeScreen ? 320 : 24;
    const paddingTop = 90;
    const paddingBottom = 96;
    
    const availWidth = canvasViewport.clientWidth - paddingLeft - paddingRight;
    const availHeight = canvasViewport.clientHeight - paddingTop - paddingBottom;
    
    const scaleX = availWidth / state.canvasWidth;
    const scaleY = availHeight / state.canvasHeight;
    state.scale = Math.max(0.2, Math.min(scaleX, scaleY, 0.88));

    const displayW = Math.round(state.canvasWidth * state.scale);
    const displayH = Math.round(state.canvasHeight * state.scale);

    canvasWrapper.style.width = `${displayW}px`;
    canvasWrapper.style.height = `${displayH}px`;
    
    mainCanvas.style.width = `${displayW}px`;
    mainCanvas.style.height = `${displayH}px`;
    
    interactiveCanvas.style.width = `${displayW}px`;
    interactiveCanvas.style.height = `${displayH}px`;

    applyCanvasTransform();
  }

  function applyCanvasTransform() {
    canvasWrapper.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.userZoom})`;
  }

  function updateZoomDisplay() {
    const percentage = Math.round(state.userZoom * 100);
    zoomVal.textContent = `${percentage}%`;
  }

  function generateId() {
    return 'layer_' + Math.random().toString(36).substr(2, 9);
  }

  // =========================================================================
  // History (Undo / Redo)
  // =========================================================================

  function saveHistoryState() {
    const snapshot = {
      backgroundColor: state.backgroundColor,
      layers: JSON.parse(JSON.stringify(state.layers.map(l => {
        if (l.type === 'image' && l._imgElement) {
          return { ...l, _imgSrc: l._imgElement.src };
        }
        return l;
      })))
    };

    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }

    state.history.push(snapshot);
    if (state.history.length > 30) {
      state.history.shift();
    } else {
      state.historyIndex++;
    }
    updateHistoryButtons();
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      restoreState(state.history[state.historyIndex]);
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      restoreState(state.history[state.historyIndex]);
    }
  }

  function restoreState(snapshot) {
    state.backgroundColor = snapshot.backgroundColor;
    propBgColor.value = state.backgroundColor;
    
    state.layers = snapshot.layers.map(l => {
      if (l.type === 'image' && l._imgSrc) {
        const img = new Image();
        img.src = l._imgSrc;
        l._imgElement = img;
      }
      return l;
    });

    if (!state.layers.some(l => l.id === state.selectedLayerId)) {
      state.selectedLayerId = state.layers.length > 0 ? state.layers[state.layers.length - 1].id : null;
    }
    
    updateHistoryButtons();
    render();
    updateUI();
  }

  function updateHistoryButtons() {
    btnUndo.disabled = state.historyIndex <= 0;
    btnRedo.disabled = state.historyIndex >= state.history.length - 1;
  }

  // =========================================================================
  // Canvas Rendering Engine
  // =========================================================================

  function render() {
    // 1. Render Main Output Canvas (1280x720)
    mainCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    
    // Draw Background
    mainCtx.fillStyle = state.backgroundColor;
    mainCtx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    // Render layers from bottom to top
    state.layers.forEach(layer => {
      if (!layer.visible) return;
      renderLayer(mainCtx, layer);
    });

    // 2. Render Interactive Overlay (Selection, Handles, Drawing, Snap Guides)
    interCtx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

    // Render Alignment Snap Guidelines & Center Cross
    if (state.snapLines && (state.snapLines.x || state.snapLines.y)) {
      renderAlignmentGuidelines(interCtx);
    }

    if (state.activeTool === 'drawing' && state.drawingBrush.points.length > 0) {
      renderLiveDrawing(interCtx);
    } else if (state.selectedLayerId && state.activeTool !== 'drawing') {
      state.layers.filter(l => state.selectedLayerIds.includes(l.id) && l.visible)
        .forEach(layer => renderSelectionHandles(interCtx, layer, layer.id === state.selectedLayerId));
    }

    renderLayersPanel();
  }

  function renderAlignmentGuidelines(ctx) {
    if (!state.snapLines || (!state.snapLines.x && !state.snapLines.y)) return;

    ctx.save();
    const centerX = state.canvasWidth / 2; // 640
    const centerY = state.canvasHeight / 2; // 360

    ctx.strokeStyle = '#27B3FF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);

    // Vertical Center Snap Line
    if (state.snapLines.x) {
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, state.canvasHeight);
      ctx.stroke();
    }

    // Horizontal Center Snap Line
    if (state.snapLines.y) {
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(state.canvasWidth, centerY);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // When centered both horizontally and vertically: Draw Cross (+) right at center!
    if (state.snapLines.x && state.snapLines.y) {
      ctx.shadowColor = '#27B3FF';
      ctx.shadowBlur = 12;

      const crossSize = 24;
      ctx.beginPath();
      ctx.moveTo(centerX - crossSize, centerY);
      ctx.lineTo(centerX + crossSize, centerY);
      ctx.moveTo(centerX, centerY - crossSize);
      ctx.lineTo(centerX, centerY + crossSize);
      ctx.strokeStyle = '#27B3FF';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF2B2B';
      ctx.fill();
    }

    ctx.restore();
  }

  function renderLayer(ctx, layer) {
    ctx.save();
    ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

    ctx.translate(layer.x, layer.y);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    switch (layer.type) {
      case 'text':
        renderTextLayer(ctx, layer);
        break;
      case 'shape':
        renderShapeLayer(ctx, layer);
        break;
      case 'drawing':
        renderDrawingLayer(ctx, layer);
        break;
      case 'image':
        renderImageLayer(ctx, layer);
        break;
    }

    ctx.restore();
  }

  function renderTextLayer(ctx, layer) {
    ctx.font = `900 ${layer.fontSize}px "${layer.fontFamily}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Textarea normally stores real line breaks, but also accept serialized
    // "\\n" sequences so imported/older layer data renders consistently.
    const lines = String(layer.text || '').replace(/\\n/g, '\n').split(/\r\n|\n|\r/);
    const lineHeight = layer.fontSize * 1.25;
    const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width), 0);
    layer.width = maxLineWidth + (layer.strokeWidth || 0) * 2 + 30;
    layer.height = Math.max(lineHeight, lines.length * lineHeight);

    if (layer.shadow) {
      ctx.shadowColor = layer.shadowColor || 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
    }

    let textOffset = 0;
    lines.forEach((line, index) => {
      const lineY = (index - (lines.length - 1) / 2) * lineHeight;
      const lineWidth = ctx.measureText(line).width;
      let cursorX = -lineWidth / 2;
      [...line].forEach((character, characterIndex) => {
        const charWidth = ctx.measureText(character).width;
        const color = getTextCharacterColor(layer, textOffset + characterIndex);
        const charCenterX = cursorX + charWidth / 2;
        if (layer.strokeWidth > 0) {
          ctx.strokeStyle = layer.stroke || '#000000';
          ctx.lineWidth = layer.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(character, charCenterX, lineY);
        }
        ctx.fillStyle = color;
        ctx.fillText(character, charCenterX, lineY);
        cursorX += charWidth;
      });
      textOffset += line.length + 1;
    });
  }

  function getTextCharacterColor(layer, index) {
    const style = (layer.textStyles || []).find(item => index >= item.start && index < item.end);
    return style ? style.color : (layer.fill || '#FFFFFF');
  }

  function applyTextColorToSelection(layer, color) {
    const start = propTextContent.selectionStart;
    const end = propTextContent.selectionEnd;
    if (start === end) {
      layer.fill = color;
      return;
    }
    const styles = (layer.textStyles || []).filter(item => item.end <= start || item.start >= end);
    styles.push({ start, end, color });
    styles.sort((a, b) => a.start - b.start);
    layer.textStyles = styles;
  }

  function renderShapeLayer(ctx, layer) {
    const w = layer.width;
    const h = layer.height;
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.beginPath();

    switch (layer.shapeType) {
      case 'rect':
        if (layer.radius && layer.radius > 0) {
          ctx.roundRect(-halfW, -halfH, w, h, Math.min(layer.radius, halfW, halfH));
        } else {
          ctx.rect(-halfW, -halfH, w, h);
        }
        break;

      case 'circle':
        ctx.ellipse(0, 0, halfW, halfH, 0, 0, Math.PI * 2);
        break;

      case 'star':
        drawStarPath(ctx, 0, 0, 5, halfW, halfW * 0.45);
        break;

      case 'arrow':
        drawArrowPath(ctx, -halfW, -halfH, w, h);
        break;

      case 'badge':
        drawBadgePath(ctx, -halfW, -halfH, w, h);
        break;
    }

    // Fill shape only if enabled
    if (layer.fillEnabled !== false && layer.fill) {
      ctx.fillStyle = layer.fill;
      ctx.fill();
    }

    if (layer.strokeWidth > 0) {
      ctx.strokeStyle = layer.stroke || '#000000';
      ctx.lineWidth = layer.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  function drawStarPath(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  function drawArrowPath(ctx, x, y, w, h) {
    const headW = w * 0.4;
    const shaftH = h * 0.4;
    const shaftY = (h - shaftH) / 2;

    ctx.moveTo(x, y + shaftY);
    ctx.lineTo(x + w - headW, y + shaftY);
    ctx.lineTo(x + w - headW, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - headW, y + h);
    ctx.lineTo(x + w - headW, y + shaftY + shaftH);
    ctx.lineTo(x, y + shaftY + shaftH);
    ctx.closePath();
  }

  function drawBadgePath(ctx, x, y, w, h) {
    const radius = 12;
    ctx.roundRect(x, y, w, h, radius);
  }

  function renderDrawingLayer(ctx, layer) {
    if (!layer.points || layer.points.length < 2) return;

    ctx.strokeStyle = layer.strokeColor || '#FF2B2B';
    ctx.lineWidth = layer.strokeWidth || 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const pts = layer.points;
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    if (pts.length > 1) {
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.stroke();
  }

  function renderImageLayer(ctx, layer) {
    if (layer._imgElement && layer._imgElement.complete) {
      ctx.drawImage(
        layer._imgElement,
        -layer.width / 2,
        -layer.height / 2,
        layer.width,
        layer.height
      );
    }
  }

  function removeSelectedImageBackground() {
    const layer = state.layers.find(l => l.id === state.selectedLayerId);
    if (!layer || layer.type !== 'image' || !layer._imgElement) return;

    const img = layer._imgElement;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = img.naturalWidth || img.width;
    workCanvas.height = img.naturalHeight || img.height;
    const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
    workCtx.drawImage(img, 0, 0);
    const hex = removeBgColor.value.slice(1);
    const target = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    const threshold = Number(removeBgTolerance.value) ** 2;
    const pixels = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const dr = pixels.data[i] - target[0];
      const dg = pixels.data[i + 1] - target[1];
      const db = pixels.data[i + 2] - target[2];
      if (dr * dr + dg * dg + db * db <= threshold) pixels.data[i + 3] = 0;
    }
    workCtx.putImageData(pixels, 0, 0);
    const cleanedImage = new Image();
    cleanedImage.onload = () => {
      layer._imgElement = cleanedImage;
      saveHistoryState();
      removeBgMenu.classList.add('hidden');
      render();
    };
    cleanedImage.src = workCanvas.toDataURL('image/png');
  }

  function renderLiveDrawing(ctx) {
    const pts = state.drawingBrush.points;
    if (pts.length < 2) return;

    ctx.save();
    ctx.strokeStyle = state.drawingBrush.color;
    ctx.lineWidth = state.drawingBrush.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // Selection Bounding Box & Transform Handles
  // =========================================================================

  function renderSelectionHandles(ctx, layer, showHandles = true) {
    ctx.save();
    ctx.translate(layer.x, layer.y);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    const halfW = layer.width / 2;
    const halfH = layer.height / 2;

    // Bounding Box outline
    ctx.strokeStyle = '#27B3FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(-halfW, -halfH, layer.width, layer.height);
    ctx.setLineDash([]);

    if (!showHandles) {
      ctx.restore();
      return;
    }

    // Draw Corner & Edge Handles
    const handles = getHandleCoordinates(layer.width, layer.height);
    const handleSize = 10;

    // Rotation Stem & Handle
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(0, -halfH - 24);
    ctx.strokeStyle = '#27B3FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#27B3FF';
    ctx.beginPath();
    ctx.arc(0, -halfH - 24, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 8 Resize Handles
    Object.entries(handles).forEach(([name, pos]) => {
      if (name === 'rotate') return;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#27B3FF';
      ctx.lineWidth = 2;
      ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
    });

    ctx.restore();
  }

  function getHandleCoordinates(width, height) {
    const halfW = width / 2;
    const halfH = height / 2;
    return {
      nw: { x: -halfW, y: -halfH },
      n:  { x: 0, y: -halfH },
      ne: { x: halfW, y: -halfH },
      e:  { x: halfW, y: 0 },
      se: { x: halfW, y: halfH },
      s:  { x: 0, y: halfH },
      sw: { x: -halfW, y: halfH },
      w:  { x: -halfW, y: 0 },
      rotate: { x: 0, y: -halfH - 24 }
    };
  }

  // =========================================================================
  // Canvas Hit Testing & Mouse Interactions
  // =========================================================================

  function getCanvasCoords(e) {
    const rect = interactiveCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * state.canvasWidth,
      y: ((clientY - rect.top) / rect.height) * state.canvasHeight
    };
  }

  function getHandleUnderCursor(point, layer) {
    if (!layer) return null;
    
    const rad = (-(layer.rotation || 0) * Math.PI) / 180;
    const dx = point.x - layer.x;
    const dy = point.y - layer.y;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

    const handles = getHandleCoordinates(layer.width, layer.height);
    const threshold = 14;

    for (const [name, pos] of Object.entries(handles)) {
      if (Math.abs(localX - pos.x) <= threshold && Math.abs(localY - pos.y) <= threshold) {
        return name;
      }
    }

    const halfW = layer.width / 2;
    const halfH = layer.height / 2;
    if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
      return 'move';
    }

    return null;
  }

  function findLayerAtPoint(point) {
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      if (!layer.visible) continue;

      const rad = (-(layer.rotation || 0) * Math.PI) / 180;
      const dx = point.x - layer.x;
      const dy = point.y - layer.y;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

      const halfW = (layer.width || 100) / 2;
      const halfH = (layer.height || 100) / 2;

      if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
        return layer;
      }
    }
    return null;
  }

  function handleMouseDown(e) {
    if (state.spacePressed || e.button === 1) {
      state.isPanning = true;
      state.panStart = { x: e.clientX - state.panX, y: e.clientY - state.panY };
      canvasViewport.classList.add('panning');
      return;
    }

    const coords = getCanvasCoords(e);

    if (state.activeTool === 'drawing') {
      state.isDragging = true;
      state.drawingBrush.points = [coords];
      render();
      return;
    }

    const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
    let handle = null;

    if (activeLayer && activeLayer.visible && state.selectedLayerIds.length === 1) {
      handle = getHandleUnderCursor(coords, activeLayer);
    }

    if (handle) {
      state.isDragging = true;
      state.dragHandle = handle;
      state.dragStart = coords;
      state.initialLayerState = state.selectedLayerIds.map(id => {
        const layer = state.layers.find(l => l.id === id);
        return {
          id,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          rotation: layer.rotation,
          fontSize: layer.fontSize
        };
      });
    } else {
      const clickedLayer = findLayerAtPoint(coords);
      if (clickedLayer) {
        if (e.ctrlKey || e.metaKey) {
          toggleLayerSelection(clickedLayer.id);
        } else if (!state.selectedLayerIds.includes(clickedLayer.id)) {
          selectLayer(clickedLayer.id);
        }
        state.isDragging = true;
        state.dragHandle = 'move';
        state.dragStart = coords;
        state.initialLayerState = state.selectedLayerIds.map(id => {
          const layer = state.layers.find(l => l.id === id);
          return { id, x: layer.x, y: layer.y };
        });
      } else {
        selectLayer(null);
      }
    }
    render();
  }

  function handleMouseMove(e) {
    if (state.isPanning) {
      state.panX = e.clientX - state.panStart.x;
      state.panY = e.clientY - state.panStart.y;
      applyCanvasTransform();
      return;
    }

    const coords = getCanvasCoords(e);

    if (state.activeTool === 'drawing') {
      if (state.isDragging) {
        state.drawingBrush.points.push(coords);
        render();
      }
      return;
    }

    if (!state.isDragging) {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.visible) {
        const handle = getHandleUnderCursor(coords, activeLayer);
        updateCursor(handle, activeLayer.rotation || 0);
      } else {
        interactiveCanvas.style.cursor = state.spacePressed ? 'grab' : 'default';
      }
      return;
    }

    const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
    if (!activeLayer || !state.initialLayerState) return;

    const dx = coords.x - state.dragStart.x;
    const dy = coords.y - state.dragStart.y;
    const init = state.initialLayerState.find(item => item.id === activeLayer.id);

    if (state.dragHandle === 'move') {
      const initialPrimary = state.initialLayerState.find(item => item.id === activeLayer.id);
      let targetX = initialPrimary.x + dx;
      let targetY = initialPrimary.y + dy;
      
      const centerX = state.canvasWidth / 2; // 640
      const centerY = state.canvasHeight / 2; // 360
      const snapThreshold = 15;

      let snapX = false;
      let snapY = false;

      if (Math.abs(targetX - centerX) < snapThreshold) {
        targetX = centerX;
        snapX = true;
      }

      if (Math.abs(targetY - centerY) < snapThreshold) {
        targetY = centerY;
        snapY = true;
      }

      state.initialLayerState.forEach(item => {
        const layer = state.layers.find(l => l.id === item.id);
        if (layer) {
          layer.x = item.x + (targetX - initialPrimary.x);
          layer.y = item.y + (targetY - initialPrimary.y);
        }
      });
      state.snapLines = { x: snapX, y: snapY };
    } else if (state.dragHandle === 'rotate') {
      const angleRad = Math.atan2(coords.y - activeLayer.y, coords.x - activeLayer.x);
      let angleDeg = (angleRad * 180) / Math.PI + 90;
      activeLayer.rotation = Math.round(angleDeg);
    } else {
      handleResize(activeLayer, init, state.dragHandle, coords);
    }

    render();
    updateContextBarValues(activeLayer);
  }

  function handleResize(layer, init, handle, currentCoords) {
    const rad = (-(init.rotation || 0) * Math.PI) / 180;
    const dx = currentCoords.x - state.dragStart.x;
    const dy = currentCoords.y - state.dragStart.y;
    
    const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);

    let newWidth = init.width;
    let newHeight = init.height;

    switch (handle) {
      case 'e':
        newWidth = Math.max(30, init.width + localDx);
        break;
      case 'w':
        newWidth = Math.max(30, init.width - localDx);
        break;
      case 's':
        newHeight = Math.max(20, init.height + localDy);
        break;
      case 'n':
        newHeight = Math.max(20, init.height - localDy);
        break;
      case 'se':
        newWidth = Math.max(30, init.width + localDx);
        newHeight = Math.max(20, init.height + localDy);
        break;
      case 'sw':
        newWidth = Math.max(30, init.width - localDx);
        newHeight = Math.max(20, init.height + localDy);
        break;
      case 'ne':
        newWidth = Math.max(30, init.width + localDx);
        newHeight = Math.max(20, init.height - localDy);
        break;
      case 'nw':
        newWidth = Math.max(30, init.width - localDx);
        newHeight = Math.max(20, init.height - localDy);
        break;
    }

    // Görseller yeniden boyutlandırılırken en-boy oranını koru.
    // Merkez tabanlı katman modelinde konum sabit kalır; yalnızca boyutlar düzeltilir.
    if (layer.type === 'image') {
      const aspectRatio = init.width / init.height;
      const isHorizontalHandle = handle === 'e' || handle === 'w';
      const isVerticalHandle = handle === 'n' || handle === 's';

      if (isHorizontalHandle) {
        newHeight = Math.max(20, newWidth / aspectRatio);
      } else if (isVerticalHandle) {
        newWidth = Math.max(30, newHeight * aspectRatio);
      } else if (Math.abs(localDx / init.width) >= Math.abs(localDy / init.height)) {
        newHeight = Math.max(20, newWidth / aspectRatio);
      } else {
        newWidth = Math.max(30, newHeight * aspectRatio);
      }
    }

    layer.width = Math.round(newWidth);
    layer.height = Math.round(newHeight);

    if (layer.type === 'text') {
      const scaleFactor = newWidth / init.width;
      layer.fontSize = Math.max(16, Math.min(250, Math.round(init.fontSize * scaleFactor)));
    }
  }

  function handleMouseUp() {
    if (state.isPanning) {
      state.isPanning = false;
      canvasViewport.classList.remove('panning');
    }

    if (state.isDragging) {
      state.isDragging = false;
      state.dragHandle = null;
      state.snapLines = { x: false, y: false };

      if (state.activeTool === 'drawing') {
        saveStrokeLayer();
      } else {
        saveHistoryState();
      }
      render();
    }
  }

  function updateCursor(handle, rotation) {
    if (state.activeTool === 'drawing') {
      interactiveCanvas.style.cursor = 'crosshair';
      return;
    }
    if (!handle) {
      interactiveCanvas.style.cursor = state.spacePressed ? 'grab' : 'default';
      return;
    }
    if (handle === 'move') {
      interactiveCanvas.style.cursor = 'move';
      return;
    }
    if (handle === 'rotate') {
      interactiveCanvas.style.cursor = 'grab';
      return;
    }
    
    const cursorMap = {
      n: 'ns-resize', s: 'ns-resize',
      e: 'ew-resize', w: 'ew-resize',
      nw: 'nwse-resize', se: 'nwse-resize',
      ne: 'nesw-resize', sw: 'nesw-resize'
    };
    interactiveCanvas.style.cursor = cursorMap[handle] || 'pointer';
  }

  // =========================================================================
  // Layer Management (Add, Select, Reorder, Opacity, Delete)
  // =========================================================================

  function selectLayer(id) {
    state.selectedLayerId = id;
    state.selectedLayerIds = id ? [id] : [];
    state.snapLines = { x: false, y: false };
    updateUI();
    render();
  }

  function toggleLayerSelection(id) {
    const index = state.selectedLayerIds.indexOf(id);
    if (index >= 0) state.selectedLayerIds.splice(index, 1);
    else state.selectedLayerIds.push(id);
    state.selectedLayerId = state.selectedLayerIds[state.selectedLayerIds.length - 1] || null;
    state.snapLines = { x: false, y: false };
    updateUI();
    render();
  }

  function addTextLayer() {
    exitDrawingMode();
    const newLayer = {
      id: generateId(),
      name: t('Metin') + ' ' + (state.layers.filter(l => l.type === 'text').length + 1),
      type: 'text',
      text: 'TEXT HERE',
      fontFamily: 'Montserrat',
      fontSize: 80,
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: 10,
      textStyles: [],
      shadow: true,
      shadowColor: '#000000',
      x: 640,
      y: 360,
      width: 500,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true
    };

    state.layers.push(newLayer);
    selectLayer(newLayer.id);
    saveHistoryState();
  }

  function addShapeLayer(shapeType) {
    exitDrawingMode();
    const shapeNames = {
      rect: t('Dikdörtgen'),
      circle: t('Daire'),
      star: t('Yıldız / Parlama'),
      arrow: t('Ok İşareti'),
      badge: t('Thumbnail Rozeti')
    };

    const newLayer = {
      id: generateId(),
      name: shapeNames[shapeType] || 'Şekil',
      type: 'shape',
      shapeType: shapeType,
      fill: shapeType === 'badge' ? '#FF2B2B' : '#27B3FF',
      fillEnabled: true,
      stroke: '#000000',
      strokeWidth: 0,
      radius: shapeType === 'badge' ? 16 : 0,
      x: 640,
      y: 360,
      width: shapeType === 'badge' ? 320 : (shapeType === 'arrow' ? 300 : 200),
      height: shapeType === 'badge' ? 90 : (shapeType === 'arrow' ? 140 : 200),
      rotation: 0,
      opacity: 1,
      visible: true
    };

    state.layers.push(newLayer);
    selectLayer(newLayer.id);
    saveHistoryState();
  }

  function addImageLayer(img, fileName) {
    exitDrawingMode();
    let w = img.width;
    let h = img.height;
    const maxDim = 600;
    
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const newLayer = {
      id: generateId(),
      name: fileName ? (fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName) : t('Görsel'),
      type: 'image',
      _imgElement: img,
      x: 640,
      y: 360,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      visible: true
    };

    state.layers.push(newLayer);
    selectLayer(newLayer.id);
    saveHistoryState();
  }

  // Save each stroke without exiting drawing mode!
  function saveStrokeLayer() {
    if (state.drawingBrush.points.length > 1) {
      const pts = state.drawingBrush.points;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      pts.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const width = Math.max(40, maxX - minX + state.drawingBrush.size * 2);
      const height = Math.max(40, maxY - minY + state.drawingBrush.size * 2);

      const normalizedPoints = pts.map(p => ({
        x: p.x - centerX,
        y: p.y - centerY
      }));

      const newLayer = {
        id: generateId(),
        name: t('Çizim') + ' ' + (state.layers.filter(l => l.type === 'drawing').length + 1),
        type: 'drawing',
        points: normalizedPoints,
        strokeColor: state.drawingBrush.color,
        strokeWidth: state.drawingBrush.size,
        x: Math.round(centerX),
        y: Math.round(centerY),
        width: Math.round(width),
        height: Math.round(height),
        rotation: 0,
        opacity: 1,
        visible: true
      };

      state.layers.push(newLayer);
      saveHistoryState();
    }
    state.drawingBrush.points = [];
    // Stays in drawing mode continuously!
  }

  function toggleDrawingMode() {
    if (state.activeTool === 'drawing') {
      exitDrawingMode();
    } else {
      state.activeTool = 'drawing';
      state.selectedLayerId = null;
      toolDrawBtn.classList.add('active');
      interactiveCanvas.style.cursor = 'crosshair';
      updateUI();
      render();
    }
  }

  function exitDrawingMode() {
    state.activeTool = 'select';
    toolDrawBtn.classList.remove('active');
    interactiveCanvas.style.cursor = 'default';
    updateUI();
    render();
  }

  function moveLayerUp() {
    const idx = state.layers.findIndex(l => l.id === state.selectedLayerId);
    if (idx < state.layers.length - 1 && idx !== -1) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx + 1];
      state.layers[idx + 1] = temp;
      saveHistoryState();
      render();
    }
  }

  function moveLayerDown() {
    const idx = state.layers.findIndex(l => l.id === state.selectedLayerId);
    if (idx > 0) {
      const temp = state.layers[idx];
      state.layers[idx] = state.layers[idx - 1];
      state.layers[idx - 1] = temp;
      saveHistoryState();
      render();
    }
  }

  function duplicateSelectedLayer() {
    const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
    if (!activeLayer) return;

    const copy = JSON.parse(JSON.stringify(activeLayer));
    copy.id = generateId();
    copy.name = `${copy.name} (Kopya)`;
    copy.x += 20;
    copy.y += 20;
    if (activeLayer.type === 'image') {
      copy._imgElement = activeLayer._imgElement;
    }

    state.layers.push(copy);
    selectLayer(copy.id);
    saveHistoryState();
  }

  function deleteSelectedLayer() {
    if (!state.selectedLayerId) return;
    const selectedIds = new Set(state.selectedLayerIds);
    state.layers = state.layers.filter(l => !selectedIds.has(l.id));
    state.selectedLayerId = null;
    state.selectedLayerIds = [];
    saveHistoryState();
    updateUI();
    render();
  }

  // =========================================================================
  // UI & Panels Update
  // =========================================================================

  function updateUI() {
    const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
    removeBgBtn.disabled = !activeLayer || activeLayer.type !== 'image';

    noSelectionHint.classList.add('hidden');
    textProps.classList.add('hidden');
    shapeProps.classList.add('hidden');
    drawProps.classList.add('hidden');
    transformProps.classList.add('hidden');
    layerActiveControls.classList.add('hidden');

    if (state.activeTool === 'drawing') {
      propTypeBadge.textContent = t('Çizim');
      drawProps.classList.remove('hidden');
    } else if (activeLayer) {
      layerActiveControls.classList.remove('hidden');
      transformProps.classList.remove('hidden');
      
      const rot = activeLayer.rotation || 0;
      propRotation.value = rot;
      propRotationNum.value = rot;

      const op = Math.round((activeLayer.opacity !== undefined ? activeLayer.opacity : 1) * 100);
      layerOpacitySlider.value = op;
      layerOpacityNum.value = op;

      if (activeLayer.type === 'text') {
        propTypeBadge.textContent = t('Metin');
        textProps.classList.remove('hidden');
        propTextContent.value = activeLayer.text;
        propFontFamily.value = activeLayer.fontFamily;
        propFontSize.value = activeLayer.fontSize;
        propFontSizeNum.value = activeLayer.fontSize;
        propTextColor.value = activeLayer.fill;
        textColorHex.textContent = activeLayer.fill;
        propStrokeColor.value = activeLayer.stroke || '#000000';
        strokeColorHex.textContent = activeLayer.stroke || '#000000';
        propStrokeWidth.value = activeLayer.strokeWidth || 0;
        propStrokeWidthNum.value = activeLayer.strokeWidth || 0;
        propTextShadow.checked = !!activeLayer.shadow;
        propShadowColor.value = activeLayer.shadowColor || '#000000';
        shadowColorHex.textContent = propShadowColor.value.toUpperCase();
      } else if (activeLayer.type === 'shape') {
        propTypeBadge.textContent = t('Şekil');
        shapeProps.classList.remove('hidden');
        
        const isFillEnabled = activeLayer.fillEnabled !== false;
        propShapeFillEnabled.checked = isFillEnabled;
        if (shapeFillCol) {
          shapeFillCol.style.opacity = isFillEnabled ? '1' : '0.4';
          shapeFillCol.style.pointerEvents = isFillEnabled ? 'auto' : 'none';
        }

        propShapeFill.value = activeLayer.fill || '#27B3FF';
        shapeFillHex.textContent = (activeLayer.fill || '#27B3FF').toUpperCase();
        propShapeStroke.value = activeLayer.stroke || '#000000';
        strokeColorHex.textContent = (activeLayer.stroke || '#000000').toUpperCase();
        propShapeStrokeWidth.value = activeLayer.strokeWidth || 0;
        propShapeStrokeNum.value = activeLayer.strokeWidth || 0;
        propShapeRadius.value = activeLayer.radius || 0;
        propShapeRadiusNum.value = activeLayer.radius || 0;
      } else if (activeLayer.type === 'image') {
        propTypeBadge.textContent = t('Görsel');
      } else if (activeLayer.type === 'drawing') {
        propTypeBadge.textContent = `${t('Çizim')} ${t('Katmanı')}`;
      }
    } else {
      propTypeBadge.textContent = t('Seçim Yok');
      noSelectionHint.classList.remove('hidden');
    }
  }

  function updateContextBarValues(layer) {
    if (!layer) return;
    if (layer.type === 'text') {
      propFontSize.value = layer.fontSize;
      propFontSizeNum.value = layer.fontSize;
    }
    if (layer.rotation !== undefined) {
      propRotation.value = layer.rotation;
      propRotationNum.value = layer.rotation;
    }
  }

  // Render Layers Panel with Drag & Drop Sorting
  function renderLayersPanel() {
    layersCountEl.textContent = state.layers.length;

    if (state.layers.length === 0) {
      layersEmptyStateEl.classList.remove('hidden');
      layersListEl.innerHTML = '';
      return;
    }

    layersEmptyStateEl.classList.add('hidden');
    layersListEl.innerHTML = '';

    // Render layers in reverse order (top layer is on top of the list)
    [...state.layers].reverse().forEach(layer => {
      let displayName = layer.name;
      if (/^Yazı \d+$/.test(layer.name)) displayName = `${t('Metin')} ${layer.name.match(/\d+$/)[0]}`;
      if (/^Çizim \d+$/.test(layer.name)) displayName = `${t('Çizim')} ${layer.name.match(/\d+$/)[0]}`;
      if (layer.name === 'Görsel') displayName = t('Görsel');
      const item = document.createElement('div');
      item.className = `layer-item ${state.selectedLayerIds.includes(layer.id) ? 'active' : ''}`;
      item.setAttribute('draggable', 'true');
      item.dataset.id = layer.id;
      
      const iconMap = {
        text: 'title',
        shape: layer.shapeType === 'star' ? 'star' : (layer.shapeType === 'arrow' ? 'arrow_forward' : 'shapes'),
        drawing: 'draw',
        image: 'image'
      };

      item.innerHTML = `
        <div class="layer-preview-icon">
          <span class="material-symbols-outlined">${iconMap[layer.type] || 'layers'}</span>
        </div>
        <div class="layer-info">
          <span class="layer-name">${escapeHtml(displayName)}</span>
          <span class="layer-sub">${Math.round((layer.opacity !== undefined ? layer.opacity : 1) * 100)}% ${t('Opaklık')}</span>
        </div>
        <div class="layer-quick-tools">
          <button class="layer-tool-icon btn-vis" title="${layer.visible ? t('Gizle') : t('Göster')}">
            <span class="material-symbols-outlined">${layer.visible ? 'visibility' : 'visibility_off'}</span>
          </button>
        </div>
      `;

      // Select or Toggle Visibility
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-vis')) {
          e.stopPropagation();
          layer.visible = !layer.visible;
          saveHistoryState();
          render();
          return;
        }
        if (e.ctrlKey || e.metaKey) toggleLayerSelection(layer.id);
        else selectLayer(layer.id);
      });

      // HTML5 Drag & Drop Reordering
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', layer.id);
        item.classList.add('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = layer.id;

        if (draggedId && draggedId !== targetId) {
          const fromIndex = state.layers.findIndex(l => l.id === draggedId);
          const toIndex = state.layers.findIndex(l => l.id === targetId);

          if (fromIndex !== -1 && toIndex !== -1) {
            const [moved] = state.layers.splice(fromIndex, 1);
            state.layers.splice(toIndex, 0, moved);
            saveHistoryState();
            render();
          }
        }
      });

      item.addEventListener('dragend', () => {
        document.querySelectorAll('.layer-item').forEach(el => {
          el.classList.remove('dragging', 'drag-over');
        });
      });

      layersListEl.appendChild(item);
    });
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // =========================================================================
  // Export Functions
  // =========================================================================

  function exportThumbnail(format = 'image/png', extension = 'png') {
    const currentSelected = state.selectedLayerId;
    selectLayer(null);
    render();

    const dataUrl = mainCanvas.toDataURL(format, 0.95);
    const link = document.createElement('a');
    link.download = `Tedit_Thumbnail_1280x720.${extension}`;
    link.href = dataUrl;
    link.click();

    selectLayer(currentSelected);
  }

  // =========================================================================
  // Event Listeners Binding
  // =========================================================================

  function bindEvents() {
    // Ctrl + Mouse Wheel Zoom (Canvas Zooming)
    canvasViewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        const newZoom = Math.min(Math.max(0.25, state.userZoom + zoomDelta), 3.5);
        state.userZoom = Math.round(newZoom * 100) / 100;
        
        applyCanvasTransform();
        updateZoomDisplay();
      }
    }, { passive: false });

    // Reset Zoom Button
    btnZoomReset.addEventListener('click', () => {
      state.userZoom = 1.0;
      state.panX = 0;
      state.panY = 0;
      applyCanvasTransform();
      updateZoomDisplay();
    });

    // Canvas Mouse & Touch Interaction
    interactiveCanvas.addEventListener('mousedown', handleMouseDown);
    canvasViewport.addEventListener('mousedown', (e) => {
      if (e.target === canvasViewport || state.spacePressed || e.button === 1) {
        handleMouseDown(e);
      }
    });

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    interactiveCanvas.addEventListener('touchstart', handleMouseDown, { passive: true });
    window.addEventListener('touchmove', handleMouseMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    // Floating Bottom Bar Buttons
    toolTextBtn.addEventListener('click', () => {
      shapesMenu.classList.add('hidden');
      addTextLayer();
    });

    toolShapeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shapesMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('.shape-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        shapesMenu.classList.add('hidden');
        addShapeLayer(btn.dataset.shape);
      });
    });

    // Toggle Drawing Mode
    toolDrawBtn.addEventListener('click', () => {
      shapesMenu.classList.add('hidden');
      toggleDrawingMode();
    });

    btnFinishDrawing.addEventListener('click', () => {
      exitDrawingMode();
    });

    // Image Upload
    imageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            addImageLayer(img, file.name);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    });

    removeBgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!removeBgBtn.disabled) removeBgMenu.classList.toggle('hidden');
    });
    removeBgTolerance.addEventListener('input', () => {
      removeBgToleranceValue.textContent = removeBgTolerance.value;
    });
    applyRemoveBg.addEventListener('click', removeSelectedImageBackground);

    // Close popups when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.tool-btn-wrapper')) {
        shapesMenu.classList.add('hidden');
        removeBgMenu.classList.add('hidden');
      }
      if (!e.target.closest('.dropdown-container')) {
        exportMenu.classList.remove('show');
      }
    });

    // Header Actions
    btnUndo.addEventListener('click', undo);
    btnRedo.addEventListener('click', redo);

    btnExportMain.addEventListener('click', () => exportThumbnail('image/png', 'png'));
    
    // Toggle format dropdown menu
    btnExportOptions.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('show');
    });

    exportPngBtn.addEventListener('click', () => {
      exportMenu.classList.remove('show');
      exportThumbnail('image/png', 'png');
    });

    exportJpgBtn.addEventListener('click', () => {
      exportMenu.classList.remove('show');
      exportThumbnail('image/jpeg', 'jpg');
    });

    // Background Color Picker
    propBgColor.addEventListener('input', (e) => {
      state.backgroundColor = e.target.value;
      render();
    });
    propBgColor.addEventListener('change', saveHistoryState);

    // Text Properties Listeners (Range + Number Input Synced)
    propTextContent.addEventListener('input', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.text = e.target.value;
        activeLayer.name = e.target.value.substring(0, 14) || 'Metin';
        render();
      }
    });
    propTextContent.addEventListener('change', saveHistoryState);

    propFontFamily.addEventListener('change', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.fontFamily = e.target.value;
        saveHistoryState();
        render();
      }
    });

    // Font Size Range
    propFontSize.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      propFontSizeNum.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.fontSize = val;
        render();
      }
    });
    propFontSize.addEventListener('change', saveHistoryState);

    // Font Size Number Box
    propFontSizeNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(16, Math.min(250, val));
      propFontSize.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.fontSize = val;
        render();
      }
    });
    propFontSizeNum.addEventListener('change', saveHistoryState);

    propTextColor.addEventListener('input', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        applyTextColorToSelection(activeLayer, e.target.value);
        textColorHex.textContent = e.target.value.toUpperCase();
        render();
      }
    });
    propTextColor.addEventListener('change', saveHistoryState);

    propStrokeColor.addEventListener('input', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.stroke = e.target.value;
        strokeColorHex.textContent = e.target.value.toUpperCase();
        render();
      }
    });
    propStrokeColor.addEventListener('change', saveHistoryState);

    // Text Stroke Width Range
    propStrokeWidth.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      propStrokeWidthNum.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.strokeWidth = val;
        render();
      }
    });
    propStrokeWidth.addEventListener('change', saveHistoryState);

    // Text Stroke Width Number Box
    propStrokeWidthNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(0, Math.min(30, val));
      propStrokeWidth.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.strokeWidth = val;
        render();
      }
    });
    propStrokeWidthNum.addEventListener('change', saveHistoryState);

    propTextShadow.addEventListener('change', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.shadow = e.target.checked;
        saveHistoryState();
        render();
      }
    });

    propShadowColor.addEventListener('input', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'text') {
        activeLayer.shadowColor = e.target.value;
        shadowColorHex.textContent = e.target.value.toUpperCase();
        render();
      }
    });
    propShadowColor.addEventListener('change', saveHistoryState);

    // Shape Fill Toggle Listener
    propShapeFillEnabled.addEventListener('change', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.fillEnabled = e.target.checked;
        if (!e.target.checked && (!activeLayer.strokeWidth || activeLayer.strokeWidth === 0)) {
          // If shape has no stroke, automatically give it a 6px border so it's visible as outline!
          activeLayer.strokeWidth = 6;
          propShapeStrokeWidth.value = 6;
          propShapeStrokeNum.value = 6;
        }
        if (shapeFillCol) {
          shapeFillCol.style.opacity = e.target.checked ? '1' : '0.4';
          shapeFillCol.style.pointerEvents = e.target.checked ? 'auto' : 'none';
        }
        saveHistoryState();
        render();
      }
    });

    // Shape Properties Listeners
    propShapeFill.addEventListener('input', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.fill = e.target.value;
        shapeFillHex.textContent = e.target.value.toUpperCase();
        render();
      }
    });
    propShapeFill.addEventListener('change', saveHistoryState);

    propShapeStroke.addEventListener('input', (e) => {
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.stroke = e.target.value;
        shapeStrokeHex.textContent = e.target.value.toUpperCase();
        render();
      }
    });
    propShapeStroke.addEventListener('change', saveHistoryState);

    // Shape Stroke Width Range
    propShapeStrokeWidth.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      propShapeStrokeNum.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.strokeWidth = val;
        render();
      }
    });
    propShapeStrokeWidth.addEventListener('change', saveHistoryState);

    // Shape Stroke Width Number Box
    propShapeStrokeNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(0, Math.min(30, val));
      propShapeStrokeWidth.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.strokeWidth = val;
        render();
      }
    });
    propShapeStrokeNum.addEventListener('change', saveHistoryState);

    // Shape Radius Range
    propShapeRadius.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      propShapeRadiusNum.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.radius = val;
        render();
      }
    });
    propShapeRadius.addEventListener('change', saveHistoryState);

    // Shape Radius Number Box
    propShapeRadiusNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(0, Math.min(60, val));
      propShapeRadius.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer && activeLayer.type === 'shape') {
        activeLayer.radius = val;
        render();
      }
    });
    propShapeRadiusNum.addEventListener('change', saveHistoryState);

    // Rotation Range
    propRotation.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      propRotationNum.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer) {
        activeLayer.rotation = val;
        render();
      }
    });
    propRotation.addEventListener('change', saveHistoryState);

    // Rotation Number Box
    propRotationNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(-180, Math.min(180, val));
      propRotation.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer) {
        activeLayer.rotation = val;
        render();
      }
    });
    propRotationNum.addEventListener('change', saveHistoryState);

    // Drawing Settings
    brushColorInput.addEventListener('input', (e) => {
      state.drawingBrush.color = e.target.value;
      brushColorHex.textContent = e.target.value.toUpperCase();
    });

    // Brush Size Range
    brushSizeInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      brushSizeNum.value = val;
      state.drawingBrush.size = val;
    });

    // Brush Size Number Box
    brushSizeNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(2, Math.min(60, val));
      brushSizeInput.value = val;
      state.drawingBrush.size = val;
    });

    // Layers Panel Opacity Range
    layerOpacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      layerOpacityNum.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer) {
        activeLayer.opacity = val / 100;
        render();
      }
    });
    layerOpacitySlider.addEventListener('change', saveHistoryState);

    // Layers Panel Opacity Number Box
    layerOpacityNum.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val)) return;
      val = Math.max(0, Math.min(100, val));
      layerOpacitySlider.value = val;
      const activeLayer = state.layers.find(l => l.id === state.selectedLayerId);
      if (activeLayer) {
        activeLayer.opacity = val / 100;
        render();
      }
    });
    layerOpacityNum.addEventListener('change', saveHistoryState);

    btnLayerUp.addEventListener('click', moveLayerUp);
    btnLayerDown.addEventListener('click', moveLayerDown);
    btnLayerDuplicate.addEventListener('click', duplicateSelectedLayer);
    btnLayerDelete.addEventListener('click', deleteSelectedLayer);

    // Keyboard Shortcuts & Pan Tracking
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        state.spacePressed = true;
        interactiveCanvas.style.cursor = 'grab';
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedLayer();
      } else if (e.key === 'Escape') {
        if (state.activeTool === 'drawing') {
          exitDrawingMode();
        } else {
          selectLayer(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.key === 'NumPad0')) {
        e.preventDefault();
        state.userZoom = 1.0;
        state.panX = 0;
        state.panY = 0;
        applyCanvasTransform();
        updateZoomDisplay();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const selectedLayers = state.layers.filter(l => state.selectedLayerIds.includes(l.id));
        if (selectedLayers.length) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 2;
          selectedLayers.forEach(layer => {
            if (e.key === 'ArrowUp') layer.y -= step;
            if (e.key === 'ArrowDown') layer.y += step;
            if (e.key === 'ArrowLeft') layer.x -= step;
            if (e.key === 'ArrowRight') layer.x += step;
          });
          saveHistoryState();
          render();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        state.spacePressed = false;
        interactiveCanvas.style.cursor = 'default';
      }
    });
  }

  // Start Application
  init();
});
