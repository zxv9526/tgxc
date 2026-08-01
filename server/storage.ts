import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TelegramPhoto, ChannelConfig } from '../src/types.js';
import { defaultPhotos } from '../src/data/default_photos.js';
import { cleanChannelHandle } from '../src/utils/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root path for cache storage
const cacheFilePath = path.join(process.cwd(), 'channel_photos_cache.json');
const configCacheFilePath = path.join(process.cwd(), 'channel_config_cache.json');

const initialChannelHandle = cleanChannelHandle(
  process.env.TELEGRAM_CHANNEL || process.env.TG_CHANNEL || process.env.CHANNEL_NAME || 'amlhmfzl'
);

export let channelConfig: ChannelConfig = {
  channelName: process.env.CHANNEL_NAME || 'Telegram 官方频道图集',
  channelBio: 'Telegram 官方频道图集与精选摄影相册库。支持分类筛选、极速巡览与自动同步。',
  bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  totalMembers: '12,450 关注',
  handle: initialChannelHandle
};

export let channelPhotos: TelegramPhoto[] = [];

/**
 * Loads cached photos and config from disk.
 */
export function loadCacheFromDisk(): void {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = fs.readFileSync(cacheFilePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        channelPhotos = parsed;
        console.log(`[Cache Load] Loaded ${channelPhotos.length} photos from disk cache.`);
      }
    }
  } catch (e) {
    console.warn('[Cache Load] Error loading photos cache:', e);
  }

  if (!channelPhotos || channelPhotos.length === 0) {
    channelPhotos = [...defaultPhotos];
    console.log(`[Fallback Init] Initialized with ${defaultPhotos.length} default fallback photos.`);
  }

  try {
    if (fs.existsSync(configCacheFilePath)) {
      const data = fs.readFileSync(configCacheFilePath, 'utf8');
      const parsedConfig = JSON.parse(data);
      channelConfig = { ...channelConfig, ...parsedConfig };
      console.log(`[Cache Load] Loaded channel config from disk cache.`);
    }
  } catch (e) {
    console.warn('[Cache Load] Error loading config cache:', e);
  }
}

/**
 * Saves current photos and config state to disk cache.
 */
export function saveCacheToDisk(): void {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(channelPhotos, null, 2), 'utf8');
    fs.writeFileSync(configCacheFilePath, JSON.stringify(channelConfig, null, 2), 'utf8');
    console.log(`[Cache Save] Saved ${channelPhotos.length} photos and config to disk cache.`);
  } catch (err) {
    console.warn('[Cache Save] Failed to save cache:', err);
  }
}

/**
 * Updates channel config in memory and on disk.
 */
export function updateChannelConfig(newConfig: Partial<ChannelConfig>): ChannelConfig {
  channelConfig = { ...channelConfig, ...newConfig };
  saveCacheToDisk();
  return channelConfig;
}

/**
 * Replaces or merges photos array in memory.
 */
export function setChannelPhotos(photos: TelegramPhoto[]): void {
  channelPhotos = photos;
  saveCacheToDisk();
}
