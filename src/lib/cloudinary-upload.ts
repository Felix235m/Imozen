/**
 * Cloudinary Direct Upload Utility
 *
 * Uploads images directly from browser to Cloudinary using unsigned presets.
 * Includes file validation and error handling.
 */

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
function validateFile(file: File | Blob): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    };
  }

  // Check file type
  if (file instanceof File) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Please use JPG, PNG, or WebP images.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Upload image to Cloudinary
 *
 * @param file - File or Blob to upload
 * @param folder - Cloudinary folder (e.g., 'leads', 'agents')
 * @returns Promise with upload result
 *
 * @example
 * const result = await uploadToCloudinary(imageBlob, 'leads');
 * if (result.success) {
 *   console.log('Image URL:', result.url);
 * }
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: 'leads' | 'agents' = 'leads'
): Promise<CloudinaryUploadResponse> {
  // Validate environment variables
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.error('Cloudinary configuration missing in environment variables');
    return {
      success: false,
      error: 'Image upload is not configured. Please contact support.',
    };
  }

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `imozen/${folder}`);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cloudinary upload failed:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Failed to upload image. Please try again.',
      };
    }

    const data = await response.json();

    // Return the secure URL
    return {
      success: true,
      url: data.secure_url,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Network error occurred while uploading image.',
    };
  }
}

/**
 * Convert canvas to Blob
 * Helper function for image cropping workflows
 *
 * @param canvas - HTML Canvas element
 * @param mimeType - Image MIME type (default: 'image/jpeg')
 * @param quality - Image quality 0-1 (default: 0.9)
 * @returns Promise with Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}
