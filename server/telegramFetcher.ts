import { parseTelegramWebHtml, cleanChannelHandle } from '../src/utils/telegram.js';
import { TelegramPhoto } from '../src/types.js';
import { channelConfig, channelPhotos, saveCacheToDisk, setChannelPhotos } from './storage.js';

/**
 * Calculates Beijing time's cutoff timestamp (3 days ago at 00:00:00) for deep pagination.
 */
export function getBeijingCutoffTimestamp(): number {
  let cutoff = Date.now() - 72 * 60 * 60 * 1000;
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (year && month && day) {
      const mm = month.padStart(2, '0');
      const dd = day.padStart(2, '0');
      const todayMidnight = new Date(`${year}-${mm}-${dd}T00:00:00+08:00`);
      if (!isNaN(todayMidnight.getTime())) {
        cutoff = todayMidnight.getTime() - 3 * 24 * 60 * 60 * 1000;
      }
    }
  } catch (e) {
    console.error('[Date Helper Error]:', e);
  }
  return cutoff;
}

/**
 * Extracts message numeric IDs from raw Telegram HTML widget payload.
 */
export function extractMessageIds(html: string): number[] {
  const messageBlocks = html.split(/class=["']tgme_widget_message[\s"']/i);
  const blockIds: number[] = [];
  for (let i = 1; i < messageBlocks.length; i++) {
    const block = messageBlocks[i];
    const msgIdMatch = block.match(/href="https:\/\/t\.me\/[^\/]+\/(\d+)"/i) || block.match(/data-post="[^\/]+\/(\d+)"/i);
    if (msgIdMatch && msgIdMatch[1]) {
      const idNum = parseInt(msgIdMatch[1], 10);
      if (!isNaN(idNum)) {
        blockIds.push(idNum);
      }
    }
  }
  return blockIds;
}

/**
 * Checks if the parsed list contains regular (non-pinned) messages older than the cutoff timestamp.
 */
export function detectOlderMessages(photos: TelegramPhoto[], blockIds: number[], cutoffTimestamp: number): boolean {
  if (photos.length === 0 || blockIds.length === 0) return false;
  const maxId = Math.max(...blockIds);
  for (const photo of photos) {
    const msgId = parseInt(photo.messageId || '', 10);
    if (!isNaN(msgId) && msgId > maxId - 150) {
      if (photo.timestamp && photo.timestamp < cutoffTimestamp) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Merges newly parsed photos and channel metadata into active memory and disk cache.
 */
export function mergePhotosWithCache(newPhotos: TelegramPhoto[], mergedInfo: any, handle: string): void {
  if (newPhotos.length === 0) return;

  let updatedPhotos: TelegramPhoto[];

  if (handle !== channelConfig.handle) {
    updatedPhotos = newPhotos;
  } else {
    const existingPhotosMap = new Map(channelPhotos.map(p => [p.id, p]));
    newPhotos.forEach(p => {
      if (existingPhotosMap.has(p.id)) {
        const existing = existingPhotosMap.get(p.id)!;
        existingPhotosMap.set(p.id, {
          ...existing,
          ...p,
          likes: Math.max(p.likes || 0, existing.likes || 0),
          views: Math.max(p.views || 0, existing.views || 0)
        });
      } else {
        existingPhotosMap.set(p.id, p);
      }
    });

    updatedPhotos = Array.from(existingPhotosMap.values())
      .sort((a, b) => {
        const aId = parseInt(a.messageId || '0', 10);
        const bId = parseInt(b.messageId || '0', 10);
        if (aId && bId && aId !== bId) return bId - aId;
        const aTime = a.timestamp || new Date(`${a.date}T00:00:00+08:00`).getTime();
        const bTime = b.timestamp || new Date(`${b.date}T00:00:00+08:00`).getTime();
        return bTime - aTime;
      })
      .slice(0, 1500);
  }

  if (mergedInfo) {
    channelConfig.channelName = mergedInfo.channelName || channelConfig.channelName;
    channelConfig.channelBio = mergedInfo.channelBio || channelConfig.channelBio;
    channelConfig.avatarUrl = mergedInfo.avatarUrl || channelConfig.avatarUrl;
    channelConfig.bannerUrl = mergedInfo.bannerUrl || channelConfig.bannerUrl;
    if (mergedInfo.totalMembers) {
      channelConfig.totalMembers = mergedInfo.totalMembers;
    }
  }
  channelConfig.handle = handle;

  setChannelPhotos(updatedPhotos);
}

/**
 * Deep sync function that paginates through Telegram channel web views.
 */
export async function syncTelegramChannel(channelInput: string): Promise<boolean> {
  const handle = cleanChannelHandle(channelInput);
  if (!handle) return false;

  try {
    let currentBefore: number | null = null;
    let allParsedPhotos: TelegramPhoto[] = [];
    let mergedInfo: any = null;
    const cutoffTimestamp = getBeijingCutoffTimestamp();

    console.log(`[Telegram Sync] Deep sync starting for @${handle}.`);

    for (let page = 0; page < 40; page++) {
      const targetUrl = currentBefore
        ? `https://t.me/s/${handle}?before=${currentBefore}`
        : `https://t.me/s/${handle}`;

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
      });

      if (!res.ok) {
        console.error(`[Telegram Sync] HTTP error ${res.status} fetching ${targetUrl}`);
        break;
      }

      const html = await res.text();
      const parsed = parseTelegramWebHtml(html, handle);

      if (!mergedInfo) {
        mergedInfo = parsed.info;
      }

      if (parsed.photos.length > 0) {
        allParsedPhotos = [...allParsedPhotos, ...parsed.photos];
      }

      const blockIds = extractMessageIds(html);
      let minId: number | null = null;
      if (blockIds.length > 0) {
        const maxId = Math.max(...blockIds);
        const validIds = blockIds.filter(id => id > maxId - 150);
        minId = validIds.length > 0 ? Math.min(...validIds) : Math.min(...blockIds);
      }

      const pageHasOlderMessages = detectOlderMessages(parsed.photos, blockIds, cutoffTimestamp);

      if (minId !== null) {
        if (currentBefore !== null && minId >= currentBefore) {
          break;
        }
        currentBefore = minId;
      } else {
        break;
      }

      if (pageHasOlderMessages && page >= 3) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (allParsedPhotos.length > 0) {
      mergePhotosWithCache(allParsedPhotos, mergedInfo, handle);
      return true;
    }
  } catch (err) {
    console.error(`[Telegram Sync] Exception during sync for @${handle}:`, err);
  }
  return false;
}
