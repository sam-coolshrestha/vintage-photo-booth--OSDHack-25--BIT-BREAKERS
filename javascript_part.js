const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uploadStatus = document.getElementById('uploadStatus');
const dateStampCheck = document.getElementById('dateStampCheck');
const filmGrainCheck = document.getElementById('filmGrainCheck');
const vignetteCheck = document.getElementById('vignetteCheck');
const scanLinesCheck = document.getElementById('scanLinesCheck');
const downloadBtn = document.getElementById('downloadBtn');

let originalImage = null;
let currentFilter = null;
let currentFrame = 'none';
let appliedStickers = [];
let adjustments = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0
};

// Initialize canvas
const canvasContainer = document.querySelector('.canvas-container');
canvas.width = 400;
canvas.height = 300;

function initializeCanvas() {
    const containerRect = canvasContainer.getBoundingClientRect();
    canvas.width = Math.max(400, containerRect.width - 20);
    canvas.height = Math.max(300, containerRect.height - 20);
    
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('UPLOAD IMAGE', canvas.width/2, canvas.height/2 - 10);
    ctx.fillText('TO START!', canvas.width/2, canvas.height/2 + 20);
}

// Initialize canvas on load and resize
initializeCanvas();
window.addEventListener('resize', () => {
    if (!originalImage) {
        initializeCanvas();
    } else {
        drawImage(originalImage);
    }
});

// Filter buttons
const filters = {
    '90s': document.getElementById('filter90s'),
    '2k': document.getElementById('filter2k'),
    'pixelate': document.getElementById('filterPixel'),
    'sepia': document.getElementById('filterSepia'),
    'neon': document.getElementById('filterNeon'),
    'vhs': document.getElementById('filterVHS'),
    'cyber': document.getElementById('filterCyber'),
    'glitch': document.getElementById('filterGlitch'),
    'vaporwave': document.getElementById('filterVaporwave'),
    'pink': document.getElementById('filterPink'),
    'blue': document.getElementById('filterBlue'),
    'green': document.getElementById('filterGreen'),
    'invert': document.getElementById('filterInvert'),
    'solarize': document.getElementById('filterSolarize'),
    'posterize': document.getElementById('filterPosterize'),
    'oil': document.getElementById('filterOil'),
    'reset': document.getElementById('filterReset')
};

// Frame buttons
const frameButtons = {
    'none': document.getElementById('frameNone'),
    'kawaii': document.getElementById('frameKawaii'),
    'polaroid': document.getElementById('framePolaroid'),
    'glitch': document.getElementById('frameGlitch'),
    'neon': document.getElementById('frameNeon'),
    'vintage': document.getElementById('frameVintage'),
    'hearts': document.getElementById('frameHearts'),
    'stars': document.getElementById('frameStars'),
    'pixel': document.getElementById('framePixel')
};

// Adjustment sliders
const brightnessSlider = document.getElementById('brightnessSlider');
const contrastSlider = document.getElementById('contrastSlider');
const saturationSlider = document.getElementById('saturationSlider');
const hueSlider = document.getElementById('hueSlider');

// Sticker buttons
const stickerButtons = document.querySelectorAll('.sticker-btn');
const clearStickersBtn = document.getElementById('clearStickers');

// Handle image upload
imageLoader.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            uploadStatus.innerHTML = `> LOADED: ${file.name.toUpperCase()}`;
            uploadStatus.style.color = '#00ff00';
            drawImage(img);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Add filter event listeners
Object.entries(filters).forEach(([filterName, button]) => {
    button.addEventListener('click', () => {
        if (filterName === 'reset') {
            currentFilter = null;
            adjustments = { brightness: 0, contrast: 0, saturation: 0, hue: 0 };
            brightnessSlider.value = 0;
            contrastSlider.value = 0;
            saturationSlider.value = 0;
            hueSlider.value = 0;
            document.querySelectorAll('.effect-btn').forEach(btn => btn.classList.remove('active'));
        } else {
            currentFilter = filterName;
            document.querySelectorAll('.effect-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
        if (originalImage) drawImage(originalImage);
    });
});

// Add frame event listeners
Object.entries(frameButtons).forEach(([frameName, button]) => {
    button.addEventListener('click', () => {
        currentFrame = frameName;
        document.querySelectorAll('.frame-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (originalImage) drawImage(originalImage);
    });
});

// Add sticker event listeners
let stickerMode = false;
let selectedSticker = null;

stickerButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedSticker = button.dataset.sticker;
        stickerMode = true;
        canvas.style.cursor = 'crosshair';
        
        // Visual feedback
        document.querySelectorAll('.sticker-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show instruction
        uploadStatus.innerHTML = `> CLICK ON IMAGE TO PLACE ${selectedSticker}`;
        uploadStatus.style.color = '#ffff00';
    });
});

// Canvas click handler for sticker placement
canvas.addEventListener('click', (e) => {
    if (!stickerMode || !selectedSticker || !originalImage) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates to canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    const size = 20 + Math.random() * 20;
    appliedStickers.push({ sticker: selectedSticker, x: canvasX, y: canvasY, size });
    drawImage(originalImage);
});

// Exit sticker mode when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!canvas.contains(e.target) && !e.target.classList.contains('sticker-btn')) {
        stickerMode = false;
        selectedSticker = null;
        