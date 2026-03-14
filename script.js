/**
 * script.js - UI and Event Handling
 * This file manages user interactions and UI updates
 */

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const comparisonSection = document.getElementById('comparisonSection');
const resizeCheck = document.getElementById('resizeCheck');
const resizeControls = document.getElementById('resizeControls');
const maxWidthInput = document.getElementById('maxWidth');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');

// State
let originalFile = null;
let compressedBlob = null;
let originalDimensions = { width: 0, height: 0 };

// Initialize event listeners
function initializeApp() {
    setupDragAndDrop();
    setupFileInput();
    setupResizeToggle();
    setupFormatChange();
    setupQualitySlider();
}

// Quality Slider Setup
function setupQualitySlider() {
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    qualitySlider.addEventListener('change', () => {
        if (originalFile) {
            compressFile();
        }
    });
}

// Drag and Drop Setup
function setupDragAndDrop() {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// File Input Setup
function setupFileInput() {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// Resize Toggle Setup
function setupResizeToggle() {
    resizeCheck.addEventListener('change', (e) => {
        resizeControls.style.display = e.target.checked ? 'flex' : 'none';
        if (originalFile) {
            compressFile();
        }
    });

    maxWidthInput.addEventListener('change', () => {
        if (originalFile) {
            compressFile();
        }
    });
}

// Format Change Setup
function setupFormatChange() {
    const formatRadios = document.querySelectorAll('input[name="format"]');
    formatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (originalFile) {
                compressFile();
            }
        });
    });
}

// Handle File Upload
async function handleFile(file) {
    // Validate file type
    if (!file.type.match('image.*')) {
        alert('Please upload an image file (PNG, JPG, JPEG, WebP)');
        return;
    }

    // Validate file size (max 10MB for browser processing)
    if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Please upload an image under 10MB.');
        return;
    }

    originalFile = file;
    
    try {
        // Get original dimensions
        originalDimensions = await compressor.getDimensions(file);
        
        // Compress the file
        await compressFile();
    } catch (error) {
        console.error('Compression error:', error);
        alert('Failed to compress image: ' + error.message);
    }
}

// Compress File
async function compressFile() {
    if (!originalFile) return;

    // Get settings
    const selectedFormat = document.querySelector('input[name="format"]:checked').value;
    const shouldResize = resizeCheck.checked;
    const maxWidth = parseInt(maxWidthInput.value);
    const quality = parseInt(qualitySlider.value) / 100;

    try {
        // Compress using the compression algorithm
        compressedBlob = await compressor.compress(originalFile, {
            format: selectedFormat,
            resize: shouldResize,
            maxWidth: maxWidth,
            quality: quality
        });

        // Display results
        await displayResults();
    } catch (error) {
        console.error('Compression failed:', error);
        alert('Compression failed: ' + error.message);
    }
}

// Display Results
async function displayResults() {
    // Get compressed dimensions
    const compressedDimensions = await getImageDimensions(compressedBlob);
    
    // Original file info
    document.getElementById('originalName').textContent = originalFile.name;
    document.getElementById('originalSize').textContent = formatBytes(originalFile.size);
    document.getElementById('originalDimensions').textContent = 
        `${originalDimensions.width} × ${originalDimensions.height}px`;
    document.getElementById('originalFormat').textContent = 
        originalFile.type.replace('image/', '').toUpperCase();

    // Compressed file info
    const selectedFormat = document.querySelector('input[name="format"]:checked').value;
    const fileExtension = selectedFormat;
    const compressedName = originalFile.name.replace(/\.[^/.]+$/, '') + `_compressed.${fileExtension}`;
    
    document.getElementById('compressedName').textContent = compressedName;
    document.getElementById('compressedSize').textContent = formatBytes(compressedBlob.size);
    document.getElementById('compressedDimensions').textContent = 
        `${compressedDimensions.width} × ${compressedDimensions.height}px`;
    document.getElementById('compressedFormat').textContent = fileExtension.toUpperCase();

    // Calculate savings
    const savingsBytes = originalFile.size - compressedBlob.size;
    const savingsPercent = ((savingsBytes / originalFile.size) * 100).toFixed(1);
    
    const savingsBox = document.getElementById('savingsBox');
    const savingsPercentElement = document.getElementById('savingsPercent');
    const savingsTextElement = document.getElementById('savingsText');
    
    if (savingsBytes > 0) {
        // File was compressed
        savingsBox.classList.remove('warning');
        savingsPercentElement.textContent = savingsPercent + '%';
        savingsTextElement.textContent = `Size Reduction (Saved ${formatBytes(savingsBytes)})`;
    } else {
        // File increased in size
        savingsBox.classList.add('warning');
        const increasePercent = ((compressedBlob.size - originalFile.size) / originalFile.size * 100).toFixed(1);
        savingsPercentElement.textContent = '+' + increasePercent + '%';
        savingsTextElement.textContent = 'Size Increased - Try JPEG format or lower quality';
    }

    // Display previews
    const originalPreviewUrl = URL.createObjectURL(originalFile);
    const compressedPreviewUrl = URL.createObjectURL(compressedBlob);
    
    document.getElementById('originalPreview').src = originalPreviewUrl;
    document.getElementById('compressedPreview').src = compressedPreviewUrl;

    // Show comparison section
    comparisonSection.classList.add('active');

    // Setup download button
    setupDownloadButton(compressedName);
}

// Setup Download Button
function setupDownloadButton(filename) {
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => {
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}

// Get Image Dimensions from Blob
function getImageDimensions(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.width,
                height: img.height
            });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

// Format Bytes Helper
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Reset Application
function resetApp() {
    originalFile = null;
    compressedBlob = null;
    originalDimensions = { width: 0, height: 0 };
    fileInput.value = '';
    comparisonSection.classList.remove('active');
    resizeCheck.checked = false;
    resizeControls.style.display = 'none';
    maxWidthInput.value = '1920';
    qualitySlider.value = '85';
    qualityValue.textContent = '85';
    
    // Reset format to JPEG
    document.querySelector('input[name="format"][value="jpeg"]').checked = true;
    
    // Clear preview images
    document.getElementById('originalPreview').src = '';
    document.getElementById('compressedPreview').src = '';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
