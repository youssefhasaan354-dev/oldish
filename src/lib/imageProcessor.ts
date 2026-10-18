/**
 * Image processing pipeline: validation, auto-resizing, WebP conversion,
 * thumbnail generation, and aspect-ratio crop warning.
 */

export interface ProcessedImageResult {
  blob: Blob;
  thumbnailBlob: Blob;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  format: string; // 'webp' | 'svg' | 'png' | 'jpeg'
  cropWarning?: string;
}

export interface ImageProcessingOptions {
  isLogo?: boolean;
  isSocialImage?: boolean;
  maxDimension?: number; // default: 2000 for photos, 800 for logos
  recommendedRatio?: number; // e.g. 16/9 = 1.777, 1/1 = 1, 4/3 = 1.333
  recommendedRatioLabel?: string;
  onProgress?: (percent: number, status: string) => void;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml'
];

/**
 * Validates file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP أو AVIF أو SVG.'
    };
  }

  // Max 20MB
  if (file.size > 20 * 1024 * 1024) {
    return {
      valid: false,
      error: 'حجم الصورة كبير جداً (أكبر من 20 ميجابايت). يرجى اختيار صورة أصغر.'
    };
  }

  return { valid: true };
}

/**
 * Checks if a PNG image contains alpha transparency
 */
async function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<boolean> {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    // Sample pixels
    const step = Math.max(1, Math.floor(imgData.length / 4000));
    for (let i = 3; i < imgData.length; i += step * 4) {
      if (imgData[i] < 250) {
        return true;
      }
    }
  } catch {
    // If security or canvas error, default to false
  }
  return false;
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل قراءة ملف الصورة.'));
    };
    img.src = url;
  });
}

/**
 * Full image processing pipeline
 */
export async function processImageUpload(
  file: File,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const { isLogo = false, recommendedRatio, recommendedRatioLabel, onProgress } = options;

  onProgress?.(10, 'جاري فحص وتجهيز الصورة...');

  // SVG passes through without canvas re-compression
  if (file.type === 'image/svg+xml') {
    onProgress?.(80, 'جاري تجهيز ملف SVG...');
    return {
      blob: file,
      thumbnailBlob: file,
      width: 512,
      height: 512,
      aspectRatio: 1,
      format: 'svg'
    };
  }

  onProgress?.(30, 'جاري قراءة أبعاد الصورة...');
  const img = await loadImageElement(file);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;
  const aspectRatio = origWidth / origHeight;

  // Check aspect ratio crop discrepancy
  let cropWarning: string | undefined;
  if (recommendedRatio && recommendedRatio > 0) {
    const ratioDiff = Math.abs(aspectRatio - recommendedRatio) / recommendedRatio;
    if (ratioDiff > 0.25) {
      const roundedActual = aspectRatio.toFixed(2);
      const label = recommendedRatioLabel || (recommendedRatio > 1.5 ? '16:9' : recommendedRatio === 1 ? '1:1' : '4:3');
      cropWarning = `تنبيه: نسبة أبعاد الصورة المرفوعة (~${roundedActual}:1) تختلف عن النسبة الموصى بها لهذا الموضع (${label}). قد يتم اقتصاص بعض أطراف الصورة. يمكنك ضبط نقطة التركيز (Focal Point) بعد الرفع.`;
    }
  }

  // Dedicated OpenGraph Social Card processing: 1200x630 JPEG under 300KB
  if (options.isSocialImage) {
    onProgress?.(50, 'جاري تهيئة أبعاد بطاقة المشاركة الاجتماعية (1200x630 JPEG)...');
    const targetWidth = 1200;
    const targetHeight = 630;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Center cover crop
    const imgRatio = origWidth / origHeight;
    const targetRatio = targetWidth / targetHeight;
    let renderW = targetWidth;
    let renderH = targetHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > targetRatio) {
      renderW = Math.round(targetHeight * imgRatio);
      offsetX = Math.round((targetWidth - renderW) / 2);
    } else {
      renderH = Math.round(targetWidth / imgRatio);
      offsetY = Math.round((targetHeight - renderH) / 2);
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    onProgress?.(70, 'جاري الضغط بصيغة JPEG لضمان التوافق مع Facebook و WhatsApp...');
    const outputFormat = 'jpeg';
    const mimeType = 'image/jpeg';
    const quality = 0.82;

    const mainBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('فشل ضغط صورة المشاركة الاجتماعية.'));
        },
        mimeType,
        quality
      );
    });

    onProgress?.(90, 'جاري إنشاء الصورة المصغرة...');
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 240;
    thumbCanvas.height = 126;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.imageSmoothingEnabled = true;
      thumbCtx.drawImage(canvas, 0, 0, 240, 126);
    }
    const thumbnailBlob = await new Promise<Blob>((resolve) => {
      thumbCanvas.toBlob(
        (b) => resolve(b || mainBlob),
        mimeType,
        0.75
      );
    });

    onProgress?.(100, 'اكتملت معالجة صورة المشاركة الاجتماعية بنجاح!');
    return {
      blob: mainBlob,
      thumbnailBlob,
      width: targetWidth,
      height: targetHeight,
      aspectRatio: targetWidth / targetHeight,
      format: outputFormat,
      cropWarning
    };
  }

  onProgress?.(50, 'جاري تحسين المقاسات وضغط الصورة...');
  const maxDim = options.maxDimension || (isLogo ? 800 : 2000);
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  // Draw main image onto canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Check for transparency if PNG logo
  const isTransparent = isLogo && file.type === 'image/png' && (await hasTransparency(ctx, targetWidth, targetHeight));

  onProgress?.(70, 'جاري التحويل إلى صيغة WebP المحسنة...');

  let outputFormat = 'webp';
  let mimeType = 'image/webp';
  let quality = isLogo ? 0.92 : 0.85;

  if (isTransparent) {
    outputFormat = 'png';
    mimeType = 'image/png';
  }

  const mainBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('فشل ضغط الصورة إلى الصيغة المستهدفة.'));
      },
      mimeType,
      quality
    );
  });

  onProgress?.(90, 'جاري إنشاء الصورة المصغرة (Thumbnail)...');

  // Create thumbnail (max 240px)
  const thumbMax = 240;
  let thumbW = targetWidth;
  let thumbH = targetHeight;
  if (thumbW > thumbMax || thumbH > thumbMax) {
    if (thumbW > thumbH) {
      thumbH = Math.round((thumbH * thumbMax) / thumbW);
      thumbW = thumbMax;
    } else {
      thumbW = Math.round((thumbW * thumbMax) / thumbH);
      thumbH = thumbMax;
    }
  }

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.imageSmoothingQuality = 'medium';
    thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
  }

  const thumbnailBlob = await new Promise<Blob>((resolve) => {
    thumbCanvas.toBlob(
      (b) => resolve(b || mainBlob),
      mimeType,
      0.75
    );
  });

  onProgress?.(100, 'اكتملت معالجة الصورة بنجاح!');

  return {
    blob: mainBlob,
    thumbnailBlob,
    width: targetWidth,
    height: targetHeight,
    aspectRatio,
    format: outputFormat,
    cropWarning
  };
}
