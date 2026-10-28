export const isCloudinaryConfigured = (): boolean => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  return Boolean(cloudName && cloudName.length > 2);
};

export const getCloudinaryUrl = (
  url: string,
  width?: number,
  options?: { crop?: string; quality?: string }
): string => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  const parts = ['f_auto', options?.quality || 'q_auto'];
  if (width) parts.push(`w_${width}`);
  if (options?.crop) parts.push(`c_${options.crop}`);
  const transform = parts.join(',');

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  const prefix = url.substring(0, uploadIndex + 8);
  const rest = url.substring(uploadIndex + 8);
  
  const matchExisting = rest.match(/^(?:(?:[a-z]_[a-z0-9_]+,?)+\/)/);
  if (matchExisting) {
    return `${prefix}${transform}/${rest.substring(matchExisting[0].length)}`;
  }
  
  return `${prefix}${transform}/${rest}`;
};

export const getResponsiveSrcSet = (url: string): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;

  // 1. Cloudinary upload URL
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const url640 = getCloudinaryUrl(url, 640);
    const url800 = getCloudinaryUrl(url, 800);
    const url1024 = getCloudinaryUrl(url, 1024);
    return `${url640} 640w, ${url800} 800w, ${url1024} 1024w, ${url} 1600w`;
  }

  // 2. Static WebP images in /public/images/
  if (
    url.startsWith('/images/') && 
    url.endsWith('.webp') && 
    !url.includes('-640') && 
    !url.includes('-800') && 
    !url.includes('-1024')
  ) {
    const baseName = url.replace('.webp', '');
    return `${baseName}-640.webp 640w, ${baseName}-800.webp 800w, ${baseName}-1024.webp 1024w, ${url} 1200w`;
  }

  return undefined;
};

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

export const uploadToCloudinary = async (
  fileOrBlob: File | Blob,
  idToken: string,
  options?: {
    onProgress?: (percent: number, status: string) => void;
  }
): Promise<CloudinaryUploadResponse> => {
  options?.onProgress?.(10, 'جاري الحصول على توقيع الرفع الآمن...');

  const signRes = await fetch('/api/sign-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!signRes.ok) {
    const errorJson = await signRes.json().catch(() => ({}));
    throw new Error(errorJson.error || `Failed to sign upload: HTTP ${signRes.status}`);
  }

  const { signature, timestamp, folder, allowed_formats, apiKey, cloudName } = await signRes.json();
  options?.onProgress?.(30, 'جاري رفع الصورة إلى التخزين السحابي...');

  const formData = new FormData();
  formData.append('file', fileOrBlob);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);
  if (allowed_formats) {
    formData.append('allowed_formats', allowed_formats);
  }

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cloudinary upload failed: HTTP ${uploadRes.status}`);
  }

  const data = await uploadRes.json();
  options?.onProgress?.(100, 'تم الرفع السحابي بنجاح!');

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
    format: data.format
  };
};

export const deleteFromCloudinary = async (
  publicId: string,
  idToken: string
): Promise<{ success: boolean; result?: string; error?: string }> => {
  try {
    const res = await fetch('/api/delete-asset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_id: publicId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, result: data.result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};