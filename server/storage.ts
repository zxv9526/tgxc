import fs from 'fs';
import path from 'path';
import { TelegramPhoto } from '../src/types.js';
import { defaultPhotos } from '../src/data/default_photos.js';
import { cleanChannelHandle, isJunkOrEmojiUrl } from '../src/utils/telegram.js';

const cacheFilePath = path.join(process.cwd(), 'channel_photos_cache.json');

const initialChannelHandle = cleanChannelHandle(
  process.env.TELEGRAM_CHANNEL || process.env.TG_CHANNEL || process.env.CHANNEL_NAME || 'amlhmfzl'
);

export let channelConfig = {
  channelName: process.env.CHANNEL_NAME || 'Telegram 频道图片',
  handle: initialChannelHandle
};

export let channelPhotos: TelegramPhoto[] = [];

export function loadCacheFromDisk(): void {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = fs.readFileSync(cacheFilePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
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
    fs.writeFileSync(cacheFilePath, JSON.stringify(channelPhotos, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Cache Save] Failed to save cache:', err);
  }
}

export function setChannelPhotos(photos: TelegramPhoto[]): void {
  channelPhotos = photos.filter(p => p && p.url && !isJunkOrEmojiUrl(p.url));
  saveCacheToDisk();
}
