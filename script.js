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
                width: { ideal: 1280 },
                height: { ideal: 720 }
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

    drawLivePreview();
}

function stopCamera() {
    isCameraActive = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    if (video) {
        video.srcObject = null;
        video = null;
    }

    // Show/hide buttons
    cameraBtn.style.display = 'block';
    captureBtn.style.display = 'none';
    stopCameraBtn.style.display = 'none';

    // Update status
    if (!originalImage) {
        uploadStatus.innerHTML = '> NO FILE SELECTED';
        uploadStatus.style.color = '#00ff00';
        initializeCanvas();
    } else {
        uploadStatus.innerHTML = '> PHOTO READY FOR EDITING';
        uploadStatus.style.color = '#00ff00';
        drawImage(originalImage);
    }
}

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
        if (originalImage) {
            drawImage(originalImage);
        }
        // For live camera, filters will be applied in the live preview loop
    });
});

// Add frame event listeners
Object.entries(frameButtons).forEach(([frameName, button]) => {
    button.addEventListener('click', () => {
        currentFrame = frameName;
        document.querySelectorAll('.frame-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (originalImage) {
            drawImage(originalImage);
        }
        // For live camera, frames will be applied in the live preview loop
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
    if (!stickerMode || !selectedSticker) return;
    if (!originalImage && !isCameraActive) return;

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

    if (originalImage) {
        drawImage(originalImage);
    }
    // For live camera, stickers will be drawn in the live preview loop
});

// Exit sticker mode when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!canvas.contains(e.target) && !e.target.classList.contains('sticker-btn')) {
        stickerMode = false;
        selectedSticker = null;
        canvas.style.cursor = 'default';
        document.querySelectorAll('.sticker-btn').forEach(btn => btn.classList.remove('active'));
        if (originalImage) {
            uploadStatus.innerHTML = `> LOADED: IMAGE READY`;
            uploadStatus.style.color = '#00ff00';
        }
    }
});

// Clear stickers button
clearStickersBtn.addEventListener('click', () => {
    appliedStickers = [];
    if (originalImage) {
        drawImage(originalImage);
    }
    // For live camera, stickers will be cleared in the live preview loop
});

// Add adjustment slider listeners
[brightnessSlider, contrastSlider, saturationSlider, hueSlider].forEach(slider => {
    slider.addEventListener('input', (e) => {
        const property = e.target.id.replace('Slider', '');
        adjustments[property] = parseInt(e.target.value);
        if (originalImage) {
            drawImage(originalImage);
        }
        // For live camera, adjustments will be applied in the live preview loop
    });
});

// Add checkbox listeners
[dateStampCheck, filmGrainCheck, vignetteCheck, scanLinesCheck].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (originalImage) {
            drawImage(originalImage);
        }
        // For live camera, effects will be applied in the live preview loop
    });
});

// Function to draw image and apply effects
function drawImage(img, filter = currentFilter) {
    if (!img) return;

    // Get container dimensions
    const containerRect = canvasContainer.getBoundingClientRect();
    const containerWidth = containerRect.width - 20;
    const containerHeight = containerRect.height - 20;

    // Calculate canvas size maintaining aspect ratio and fitting container
    let { width, height } = img;
    const imgRatio = width / height;
    const containerRatio = containerWidth / containerHeight;

    if (imgRatio > containerRatio) {
        // Image is wider than container
        width = containerWidth;
        height = containerWidth / imgRatio;
    } else {
        // Image is taller than container
        height = containerHeight;
        width = containerHeight * imgRatio;
    }

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Turn off image smoothing for pixelated effect
    ctx.imageSmoothingEnabled = false;

    if (filter === 'pixelate') {
        const pixelateFactor = 0.1;
        const smallWidth = canvas.width * pixelateFactor;
        const smallHeight = canvas.height * pixelateFactor;
        ctx.drawImage(img, 0, 0, smallWidth, smallHeight);
        ctx.drawImage(canvas, 0, 0, smallWidth, smallHeight, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Apply color filters
    if (filter && filter !== 'pixelate') {
        applyColorFilter(filter);
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
}

function applyColorFilter(filter) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        switch (filter) {
            case '90s':
                data[i] = Math.min(255, r + 30);
                data[i + 1] = Math.min(255, g + 15);
                data[i + 2] = Math.max(0, b - 20);
                break;

            case '2k':
                data[i] = Math.max(0, r - 15);
                data[i + 1] = Math.min(255, g + 20);
                data[i + 2] = Math.min(255, b + 35);
                break;

            case 'sepia':
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                break;

            case 'neon':
                data[i] = Math.min(255, r * 1.6);
                data[i + 1] = Math.min(255, g * 1.4);
                data[i + 2] = Math.min(255, b * 1.8);
                break;

            case 'vhs':
                data[i] = Math.min(255, r + 20);
                data[i + 1] = Math.max(0, g - 15);
                data[i + 2] = Math.max(0, b - 10);
                if (Math.random() > 0.95) {
                    data[i] = Math.min(255, data[i] + Math.random() * 60);
                    data[i + 1] = Math.min(255, data[i + 1] + Math.random() * 60);
                    data[i + 2] = Math.min(255, data[i + 2] + Math.random() * 60);
                }
                break;

            case 'cyber':
                data[i] = Math.min(255, r * 0.7);
                data[i + 1] = Math.min(255, g * 1.3);
                data[i + 2] = Math.min(255, b * 1.5);
                break;

            case 'glitch':
                if (Math.random() > 0.98) {
                    data[i] = Math.random() * 255;
                    data[i + 1] = Math.random() * 255;
                    data[i + 2] = Math.random() * 255;
                }
                break;

            case 'vaporwave':
                data[i] = Math.min(255, r * 1.2 + 50);
                data[i + 1] = Math.min(255, g * 0.8 + 30);
                data[i + 2] = Math.min(255, b * 1.5 + 80);
                break;

            case 'pink':
                data[i] = Math.min(255, r * 1.5);
                data[i + 1] = Math.min(255, g * 0.7);
                data[i + 2] = Math.min(255, b * 1.2);
                break;

            case 'blue':
                data[i] = Math.min(255, r * 0.5);
                data[i + 1] = Math.min(255, g * 0.8);
                data[i + 2] = Math.min(255, b * 1.8);
                break;

            case 'green':
                data[i] = Math.min(255, r * 0.6);
                data[i + 1] = Math.min(255, g * 1.6);
                data[i + 2] = Math.min(255, b * 0.6);
                break;

            case 'invert':
                data[i] = 255 - r;
                data[i + 1] = 255 - g;
                data[i + 2] = 255 - b;
                break;

            case 'solarize':
                data[i] = r > 128 ? 255 - r : r;
                data[i + 1] = g > 128 ? 255 - g : g;
                data[i + 2] = b > 128 ? 255 - b : b;
                break;

            case 'posterize':
                data[i] = Math.floor(r / 64) * 64;
                data[i + 1] = Math.floor(g / 64) * 64;
                data[i + 2] = Math.floor(b / 64) * 64;
                break;

            case 'oil':
                const intensity = Math.floor((r + g + b) / 3);
                data[i] = intensity > 128 ? 255 : 0;
                data[i + 1] = intensity > 128 ? 255 : 0;
                data[i + 2] = intensity > 128 ? 255 : 0;
                break;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function applyAdjustments() {
    if (adjustments.brightness === 0 && adjustments.contrast === 0 &&
        adjustments.saturation === 0 && adjustments.hue === 0) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness
        r = Math.max(0, Math.min(255, r + adjustments.brightness));
        g = Math.max(0, Math.min(255, g + adjustments.brightness));
        b = Math.max(0, Math.min(255, b + adjustments.brightness));

        // Contrast
        const contrast = (adjustments.contrast + 100) / 100;
        r = Math.max(0, Math.min(255, ((r - 128) * contrast) + 128));
        g = Math.max(0, Math.min(255, ((g - 128) * contrast) + 128));
        b = Math.max(0, Math.min(255, ((b - 128) * contrast) + 128));

        // Saturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturation = (adjustments.saturation + 100) / 100;
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturation));
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturation));
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturation));

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
}

function addFrame(frameType) {
    const frameWidth = 20;
    ctx.save();

    switch (frameType) {
        case 'kawaii':
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = frameWidth;
            ctx.strokeRect(frameWidth/2, frameWidth/2, canvas.width - frameWidth, canvas.height - frameWidth);

            // Add hearts in corners
            ctx.font = '20px Arial';
            ctx.fillStyle = '#ff1493';
            ctx.fillText('💖', 5, 25);
            ctx.fillText('💖', canvas.width - 25, 25);
            ctx.fillText('💖', 5, canvas.height - 5);
            ctx.fillText('💖', canvas.width - 25, canvas.height - 5);
            break;

        case 'polaroid':
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, frameWidth);
            ctx.fillRect(0, canvas.height - frameWidth * 2, canvas.width, frameWidth * 2);
            ctx.fillRect(0, 0, frameWidth, canvas.height);
            ctx.fillRect(canvas.width - frameWidth, 0, frameWidth, canvas.height);

            ctx.fillStyle = '#000';
            ctx.font = '12px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(new Date().toLocaleDateString(), canvas.width/2, canvas.height - 10);
            break;

        case 'glitch':
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const w = Math.random() * 20 + 5;
                const h = Math.random() * 5 + 1;
                ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
                ctx.fillRect(x, y, w, h);
            }
            break;

        case 'neon':
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 5;
            ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            break;

        case 'vintage':
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = frameWidth;
            ctx.strokeRect(frameWidth/2, frameWidth/2, canvas.width - frameWidth, canvas.height - frameWidth);

            // Add vintage pattern
            ctx.fillStyle = '#8B4513';
            for (let i = 0; i < canvas.width; i += 10) {
                ctx.fillRect(i, 0, 2, frameWidth);
                ctx.fillRect(i, canvas.height - frameWidth, 2, frameWidth);
            }
            for (let i = 0; i < canvas.height; i += 10) {
                ctx.fillRect(0, i, frameWidth, 2);
                ctx.fillRect(canvas.width - frameWidth, i, frameWidth, 2);
            }
            break;

        case 'hearts':
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ff69b4';
            for (let i = 0; i < canvas.width; i += 30) {
                ctx.fillText('💖', i, 20);
                ctx.fillText('💖', i, canvas.height - 5);
            }
            for (let i = 0; i < canvas.height; i += 30) {
                ctx.fillText('💖', 5, i);
                ctx.fillText('💖', canvas.width - 20, i);
            }
            break;

        case 'stars':
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < canvas.width; i += 30) {
                ctx.fillText('⭐', i, 20);
                ctx.fillText('⭐', i, canvas.height - 5);
            }
            for (let i = 0; i < canvas.height; i += 30) {
                ctx.fillText('⭐', 5, i);
                ctx.fillText('⭐', canvas.width - 20, i);
            }
            break;

        case 'pixel':
            ctx.fillStyle = '#000';
            const pixelSize = 8;
            for (let x = 0; x < canvas.width; x += pixelSize) {
                for (let y = 0; y < frameWidth; y += pixelSize) {
                    if ((x + y) % (pixelSize * 2) === 0) {
                        ctx.fillRect(x, y, pixelSize, pixelSize);
                        ctx.fillRect(x, canvas.height - frameWidth + y, pixelSize, pixelSize);
                    }
                }
            }
            for (let y = 0; y < canvas.height; y += pixelSize) {
                for (let x = 0; x < frameWidth; x += pixelSize) {
                    if ((x + y) % (pixelSize * 2) === 0) {
                        ctx.fillRect(x, y, pixelSize, pixelSize);
                        ctx.fillRect(canvas.width - frameWidth + x, y, pixelSize, pixelSize);
                    }
                }
            }
            break;
    }

    ctx.restore();
}

function addSticker(sticker, x, y, size) {
    ctx.save();
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(sticker, x, y);
    ctx.restore();
}

function addFilmGrain() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.95) {
            const noise = (Math.random() - 0.5) * 100;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function addVignette() {
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.8)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function addScanLines() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i < canvas.height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    ctx.restore();
}

function addDateStamp() {
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString();

    ctx.save();
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'right';
    ctx.fillText(`${dateString} ${timeString}`, canvas.width - 10, canvas.height - 10);
    ctx.restore();
}

// Download functionality
downloadBtn.addEventListener('click', () => {
    if (!originalImage && !isCameraActive) {
        uploadStatus.innerHTML = '> NO IMAGE TO DOWNLOAD';
        uploadStatus.style.color = '#ff0000';
        return;
    }

    // If camera is active, capture current frame first
    if (isCameraActive && video) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Copy current canvas content
        tempCtx.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.download = 'kawaii-camera-' + Date.now() + '.png';
        link.href = tempCanvas.toDataURL();
        link.click();
    } else {
        const link = document.createElement('a');
        link.download = 'kawaii-photo-' + Date.now() + '.png';
        link.href = canvas.toDataURL();
        link.click();
    }
});
