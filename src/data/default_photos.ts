import { TelegramPhoto } from '../types';
import cachedPhotos from '../../channel_photos_cache.json';

export const getDefaultPhotos = (): TelegramPhoto[] => {
  if (Array.isArray(cachedPhotos) && cachedPhotos.length > 0) {
    return cachedPhotos as TelegramPhoto[];
  }
  return [];
};

export const defaultPhotos = getDefaultPhotos();
