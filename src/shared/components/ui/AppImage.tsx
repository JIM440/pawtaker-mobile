import React from 'react';
import { Image, type ImageProps } from 'expo-image';

/**
 * Reusable image component using expo-image for all app images.
 * Use this instead of react-native Image or raw expo-image so we keep one API and better perf/caching.
 */
export function AppImage(props: ImageProps) {
  return <Image {...props} />;
}
