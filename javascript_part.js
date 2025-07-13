const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uploadStatus = document.getElementById('uploadStatus');
const dateStampCheck = document.getElementById('dateStampCheck');
const filmGrainCheck = document.getElementById('filmGrainCheck');
const vignetteCheck = document.getElementById('vignetteCheck');
const scanLinesCheck = document.getElementById('scanLinesCheck');
const downloadBtn = document.getElementById('downloadBtn');
const cameraBtn = document.getElementById('cameraBtn');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');

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
let videoStream = null;
let video = null;
let isCameraActive = false;
let animationId = null;

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
    ctx.fillText('UPLOAD IMAGE', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('TO START!', canvas.width / 2, canvas.height / 2 + 20);
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

    stopCamera(); // Stop camera if active

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

// Camera functionality
cameraBtn.addEventListener('click', async () => {
    try {
        uploadStatus.innerHTML = '> REQUESTING CAMERA ACCESS...';
        uploadStatus.style.color = '#ffff00';

        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: {
                    ideal: 1280
                },
                height: {
                    ideal: 720
                }
            }
        });

        video = document.createElement('video');
        video.srcObject = videoStream;
        video.autoplay = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            isCameraActive = true;
            originalImage = null; // Clear any existing image

            // Show camera controls
            cameraBtn.style.display = 'none';
            captureBtn.style.display = 'block';
            stopCameraBtn.style.display = 'block';

            uploadStatus.innerHTML = '> CAMERA ACTIVE - LIVE PREVIEW';
            uploadStatus.style.color = '#00ff00';

            // Start live preview
            startLivePreview();
        };

    } catch (error) {
        console.error('Camera access denied:', error);
        uploadStatus.innerHTML = '> CAMERA ACCESS DENIED';
        uploadStatus.style.color = '#ff0000';

        // Show fallback message
        setTimeout(() => {
            uploadStatus.innerHTML = '> TRY ALLOWING CAMERA PERMISSION';
            uploadStatus.style.color = '#ff0000';
        }, 2000);
    }
});

// Capture photo from camera
captureBtn.addEventListener('click', () => {
    if (!video || !isCameraActive) return;

    // Create a temporary canvas to capture the video frame
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCtx.drawImage(video, 0, 0);

    // Convert to image
    const img = new Image();
    img.onload = () => {
        originalImage = img;
        stopCamera(); // Stop the camera after capture

        uploadStatus.innerHTML = '> PHOTO CAPTURED!';
        uploadStatus.style.color = '#00ff00';

        // Draw the captured image with current effects
        drawImage(img);
    };
    img.src = tempCanvas.toDataURL();
});

// Stop camera
stopCameraBtn.addEventListener('click', () => {
    stopCamera();
});

function startLivePreview() {
    if (!isCameraActive || !video) return;

    // Get container dimensions
    const containerRect = canvasContainer.getBoundingClientRect();
    const containerWidth = containerRect.width - 20;
    const containerHeight = containerRect.height - 20;

    // Set canvas size based on video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth && videoHeight) {
        const aspectRatio = videoWidth / videoHeight;
        const containerRatio = containerWidth / containerHeight;

        if (aspectRatio > containerRatio) {
            canvas.width = containerWidth;
            canvas.height = containerWidth / aspectRatio;
        } else {
            canvas.height = containerHeight;
            canvas.width = containerHeight * aspectRatio;
        }
    } else {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    }

    function drawLivePreview() {
        if (!isCameraActive || !video) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Apply current filter to live preview
        if (currentFilter) {
            applyColorFilter(currentFilter);
        }

        // Apply adjustments
        applyAdjustments();

        // Add frame
        if (currentFrame !== 'none') {
            addFrame(currentFrame);
        }

        // Add stickers
        appliedStickers.forEach(sticker => {
            addSticker(sticker.sticker, sticker.x, sticker.y, sticker.size);
        });

        // Add extras
        if (filmGrainCheck.checked) {
            addFilmGrain();
        }

        if (vignetteCheck.checked) {
            addVignette();
        }

        if (scanLinesCheck.checked) {
            addScanLines();
        }

        // Add date stamp if checked
        if (dateStampCheck.checked) {
            addDateStamp();
        }

        // Continue the animation loop
        animationId = requestAnimationFrame(drawLivePreview);
    }
    
    // Start the drawing loop
    drawLivePreview();
}
