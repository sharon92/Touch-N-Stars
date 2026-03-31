import { applyImageFilter } from './useImageFilter';

export function getFilteredImageHistory(images, imageFilter) {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  return applyImageFilter(images, imageFilter);
}

export function getVisibleImageHistory(images, imageFilter, historyTimeRange) {
  const filteredImages = getFilteredImageHistory(images, imageFilter);
  const startIndex = historyTimeRange?.startIndex ?? 0;
  const endIndex = historyTimeRange?.endIndex ?? null;

  if (startIndex >= filteredImages.length) {
    return filteredImages;
  }

  if (endIndex === null) {
    return filteredImages.slice(startIndex);
  }

  return filteredImages.slice(startIndex, endIndex + 1);
}
