import { ApiError } from './client';
import type { ImageMimeType } from './types';

const ALLOWED_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_LONG_EDGE = 1280;
const JPEG_QUALITY = 0.82;
const MAX_DECODED_BYTES = 4_000_000;

export interface ProcessedImage {
  imageBase64: string;
  mimeType: ImageMimeType;
  previewUrl: string;
  fileName: string;
}

export async function prepareTextbookImage(file: File): Promise<ProcessedImage> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ApiError(
      'UNSUPPORTED_IMAGE',
      "That photo can't be used. Choose a JPEG, PNG or WebP image.",
      415,
    );
  }

  const tempUrl = URL.createObjectURL(file);

  try {
    const img = await loadHtmlImage(tempUrl);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    if (!srcW || !srcH) {
      throw new ApiError(
        'UNSUPPORTED_IMAGE',
        "That photo can't be used. Choose a JPEG, PNG or WebP image.",
        415,
      );
    }

    const scale = Math.min(1, MAX_LONG_EDGE / Math.max(srcW, srcH));
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ApiError('INTERNAL', 'Canvas context unavailable.', 500);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const commaIdx = dataUrl.indexOf(',');
    const rawBase64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;

    const approxBytes = Math.ceil((rawBase64.length * 3) / 4);
    if (approxBytes > MAX_DECODED_BYTES) {
      throw new ApiError(
        'IMAGE_TOO_LARGE',
        "That photo can't be used. Choose a JPEG, PNG or WebP image.",
        413,
      );
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY),
    );
    const previewUrl = blob ? URL.createObjectURL(blob) : dataUrl;

    return {
      imageBase64: rawBase64,
      mimeType: 'image/jpeg',
      previewUrl,
      fileName: file.name || 'textbook-page.jpg',
    };
  } finally {
    URL.revokeObjectURL(tempUrl);
  }
}

export function revokePreviewUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new ApiError(
          'UNSUPPORTED_IMAGE',
          "That photo can't be used. Choose a JPEG, PNG or WebP image.",
          415,
        ),
      );
    img.src = src;
  });
}

