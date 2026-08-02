import { TelegramPhoto } from '../types';
import cachedPhotos from '../../channel_photos_cache.json';

export const getDefaultPhotos = (): TelegramPhoto[] => {
  if (Array.isArray(cachedPhotos)) {
    return cachedPhotos as TelegramPhoto[];
  }
  if (cachedPhotos && typeof cachedPhotos === 'object' && 'photos' in cachedPhotos && Array.isArray((cachedPhotos as any).photos)) {
    return (cachedPhotos as any).photos as TelegramPhoto[];
  }
  return [];
};

export const defaultPhotos = getDefaultPhotos();
