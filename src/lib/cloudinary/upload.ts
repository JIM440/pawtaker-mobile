import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const KYC_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_KYC_PRESET ?? '';

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/** Gallery uploads (pets, etc.): prefer `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, else KYC preset. */
export const CLOUDINARY_GALLERY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  process.env.EXPO_PUBLIC_CLOUDINARY_KYC_PRESET ||
  '';

export type UploadResult = {
  secure_url: string;
  public_id: string;
};

/**
 * Compresses an image and uploads it to Cloudinary.
 * Returns the secure_url and public_id to store in Supabase.
 *
 * @param localUri - the local file URI from expo-image-picker
 * @param preset   - the upload preset name (defaults to KYC preset)
 */
export async function uploadToCloudinary(
  localUri: string,
  preset: string = KYC_PRESET,
): Promise<UploadResult> {
  // Compress before uploading — 1200px wide, 80% JPEG quality
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, fetch the URI and convert to Blob
    const res = await fetch(compressed.uri);
    const blob = await res.blob();
    formData.append('file', blob, `upload_${Date.now()}.jpg`);
  } else {
    formData.append('file', {
      uri: compressed.uri,
      type: 'image/jpeg',
      name: `upload_${Date.now()}.jpg`,
    } as unknown as Blob);
  }

  formData.append('upload_preset', preset);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { error?: { message?: string } })?.error?.message ??
        'Cloudinary upload failed',
    );
  }

  const data = await response.json();
  return {
    secure_url: data.secure_url as string,
    public_id: data.public_id as string,
  };
}
