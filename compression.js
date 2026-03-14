/**
 * compression.js - Advanced Image Compression Algorithms
 * This file handles actual file size reduction using multiple techniques
 */

class ImageCompressor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            willReadFrequently: false
        });
    }

    /**
     * Main compression method with aggressive size reduction
     * @param {File} file - Original image file
     * @param {Object} options - Compression options
     * @returns {Promise<Blob>} - Compressed image blob
     */
    async compress(file, options = {}) {
        const {
            format = 'jpeg',
            resize = false,
            maxWidth = 1920,
            quality = 0.85
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        this.processImage(img, format, resize, maxWidth, quality)
                            .then(resolve)
                            .catch(reject);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Process and compress the image with smart optimization
     * @param {HTMLImageElement} img - Loaded image
     * @param {string} format - Output format
     * @param {boolean} resize - Whether to resize
     * @param {number} maxWidth - Maximum width for resize
     * @param {number} quality - Compression quality (0-1)
     * @returns {Promise<Blob>} - Compressed blob
     */
    async processImage(img, format, resize, maxWidth, quality) {
        let width = img.width;
        let height = img.height;

        // Smart resizing for large images
        if (resize && width > maxWidth) {
            const aspectRatio = height / width;
            width = maxWidth;
            height = Math.round(width * aspectRatio);
        } else if (!resize && width > 2000) {
            // Auto-resize very large images
            const aspectRatio = height / width;
            width = 2000;
            height = Math.round(width * aspectRatio);
        }

        // Set canvas dimensions
        this.canvas.width = width;
        this.canvas.height = height;

        // Use high-quality smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Draw image
        this.ctx.drawImage(img, 0, 0, width, height);

        // Compress based on format
        return this.compressToFormat(format, quality);
    }

    /**
     * Compress to specific format with quality control
     * @param {string} format - Target format
     * @param {number} quality - Quality setting
     * @returns {Promise<Blob>} - Compressed blob
     */
    async compressToFormat(format, quality) {
        return new Promise((resolve, reject) => {
            const mimeType = this.getMimeType(format);
            
            this.canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                mimeType,
                quality
            );
        });
    }

    /**
     * Get MIME type for format
     * @param {string} format - Format name
     * @returns {string} - MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };
        return mimeTypes[format.toLowerCase()] || 'image/jpeg';
    }

    /**
     * Get image dimensions
     * @param {File} file - Image file
     * @returns {Promise<Object>} - Width and height
     */
    async getDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height
                    });
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Multi-pass compression to achieve target size
     * @param {File} file - Original file
     * @param {number} targetSizeKB - Target size in KB
     * @returns {Promise<Blob>} - Compressed blob
     */
    async compressToSize(file, targetSizeKB = 500) {
        let quality = 0.9;
        let compressed = null;
        const maxAttempts = 10;
        let attempt = 0;

        while (attempt < maxAttempts) {
            compressed = await this.compress(file, {
                format: 'jpeg',
                quality: quality
            });

            const sizeKB = compressed.size / 1024;

            if (sizeKB <= targetSizeKB) {
                break;
            }

            // Reduce quality for next attempt
            quality -= 0.1;
            attempt++;

            if (quality < 0.1) {
                quality = 0.1;
                break;
            }
        }

        return compressed;
    }
}

// Create global instance
const compressor = new ImageCompressor();
