import fs from 'fs';
import path from 'path';
import { TelegramPhoto } from '../src/types.js';
import { defaultPhotos } from '../src/data/default_photos.js';
import { cleanChannelHandle, isJunkOrEmojiUrl } from '../src/utils/telegram.js';

let cacheFilePath = path.join(process.cwd(), 'channel_photos_cache.json');

try {
  if (!fs.existsSync(cacheFilePath)) {
    // If not found in process.cwd(), fall back to checking relative to __dirname
    if (typeof __dirname !== 'undefined' && __dirname) {
      const parentPath = path.join(__dirname, '..', 'channel_photos_cache.json');
      if (fs.existsSync(parentPath)) {
        cacheFilePath = parentPath;
      } else {
        const currentPath = path.join(__dirname, 'channel_photos_cache.json');
        if (fs.existsSync(currentPath)) {
          cacheFilePath = currentPath;
        }
      }
    }
  }
} catch (e) {
  // Fallback to default path
}

const initialChannelHandle = cleanChannelHandle(
  process.env.TELEGRAM_CHANNEL || process.env.TG_CHANNEL || process.env.CHANNEL_NAME || 'amlhmfzl'
);

export let channelConfig = {
  channelName: process.env.CHANNEL_NAME || 'Telegram 频道图片',
  channelBio: '',
  avatarUrl: '',
  bannerUrl: '',
  handle: initialChannelHandle
};

export let channelPhotos: TelegramPhoto[] = [];
export let lastCacheUpdateTime = 0;

export function getChannelConfig() {
  return channelConfig;
}

export function getChannelPhotos() {
  return channelPhotos;
}

export function getLastCacheUpdateTime() {
  return lastCacheUpdateTime;
}

export function loadCacheFromDisk(): void {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = fs.readFileSync(cacheFilePath, 'utf8');
      const parsed = JSON.parse(data);

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (typeof parsed.lastUpdated === 'number') {
          lastCacheUpdateTime = parsed.lastUpdated;
        }
        if (Array.isArray(parsed.photos)) {
          channelPhotos = parsed.photos.filter((p: TelegramPhoto) => p && p.url && !isJunkOrEmojiUrl(p.url));
        }
        if (parsed.config && typeof parsed.config === 'object') {
          channelConfig = {
            ...channelConfig,
            ...parsed.config,
            handle: initialChannelHandle || parsed.config.handle || 'amlhmfzl'
          };
        }
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        channelPhotos = parsed.filter((p: TelegramPhoto) => p && p.url && !isJunkOrEmojiUrl(p.url));
      }
    }
  } catch (e) {
    console.warn('[Cache Load] Error loading cache:', e);
  }

  if (!channelPhotos || channelPhotos.length === 0) {
    channelPhotos = defaultPhotos
      .filter(p => p && p.url && !isJunkOrEmojiUrl(p.url))
      .map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.url,
        date: p.date,
        timestamp: p.timestamp,
        messageId: p.messageId
      }));
  } else {
    // Save cleaned cache back to disk immediately
    saveCacheToDisk();
  }
}

export function saveCacheToDisk(): void {
  try {
    const payload = {
      config: channelConfig,
      photos: channelPhotos,
      lastUpdated: lastCacheUpdateTime || Date.now()
    };
    fs.writeFileSync(cacheFilePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Cache Save] Failed to save cache:', err);
  }
}

export function setChannelPhotos(photos: TelegramPhoto[]): void {
  channelPhotos = photos.filter(p => p && p.url && !isJunkOrEmojiUrl(p.url));
  lastCacheUpdateTime = Date.now();
  saveCacheToDisk();
}

