/**
 * Helper utility to read, downscale, and convert an uploaded image file into a WebP Data URI.
 * WebP provides superior compression and smaller payload sizes compared to PNG/JPEG.
 *
 * @param file - The uploaded Image File object
 * @param maxWidth - Maximum width boundary in pixels (default 800)
 * @param maxHeight - Maximum height boundary in pixels (default 800)
 * @param quality - Compression quality between 0.0 and 1.0 (default 0.75)
 * @returns Promise resolving to the WebP Data URL string
 */
export const processAndConvertToWebP = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to parse image data.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(dataUrl);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as image/webp
        let webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Fallback for older browsers that don't support webp canvas export
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(webpDataUrl);
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
};
