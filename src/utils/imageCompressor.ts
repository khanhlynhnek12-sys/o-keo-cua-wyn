/**
 * Image and media compression utility for client-side web background & logo upload.
 * Reduces large high-res images to lightweight webp/jpeg data URLs for fast loading
 * and prevents browser localStorage / memory exhaustion.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  isAnimated: boolean;
  mimeType: string;
  rawBlob?: Blob;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export async function compressMediaFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 900,
  quality = 0.75
): Promise<CompressionResult> {
  const originalSize = file.size;
  const isGif = file.type === 'image/gif';
  const isVideo = file.type.startsWith('video/');

  // For video files: create instant Blob URL for 60fps hardware accelerated streaming
  if (isVideo) {
    let videoUrl = '';
    try {
      videoUrl = URL.createObjectURL(file);
    } catch {
      //
    }

    return new Promise((resolve) => {
      resolve({
        dataUrl: videoUrl,
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
        isAnimated: true,
        mimeType: file.type,
        rawBlob: file,
      });
    });
  }

  // For animated GIFs: preserve frames
  if (isGif) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          dataUrl,
          originalSize,
          compressedSize: originalSize,
          reductionPercent: 0,
          isAnimated: true,
          mimeType: file.type,
          rawBlob: file,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Static images (JPG, PNG, WebP) -> Compress via HTML5 Canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved scaling
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP compression first; fallback to JPEG
        let compressedDataUrl: string;
        try {
          compressedDataUrl = canvas.toDataURL('image/webp', quality);
        } catch {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Approximate size of dataUrl (Base64 length * 0.75)
        const base64Content = compressedDataUrl.split(',')[1] || '';
        const compressedSize = Math.round((base64Content.length * 3) / 4);
        const reductionPercent = Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        );

        resolve({
          dataUrl: compressedDataUrl,
          originalSize,
          compressedSize,
          reductionPercent,
          isAnimated: false,
          mimeType: 'image/webp',
          rawBlob: file,
        });
      };

      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an existing Base64 data URL string to lightweight WebP/JPEG data URL (< 100KB)
 * to prevent Firestore document size limit errors (1MB limit).
 */
export async function compressDataUrl(
  dataUrl: string,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.78
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 100000) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = '';
      try {
        compressed = canvas.toDataURL('image/webp', quality);
      } catch {
        try {
          compressed = canvas.toDataURL('image/jpeg', quality);
        } catch {
          compressed = dataUrl;
        }
      }
      resolve(compressed && compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
