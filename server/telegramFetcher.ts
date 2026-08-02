import { parseTelegramWebHtml, cleanChannelHandle, isJunkOrEmojiUrl } from '../src/utils/telegram.js';
import { TelegramPhoto } from '../src/types.js';
import { channelConfig, getChannelPhotos, setChannelPhotos, saveCacheToDisk } from './storage.js';

export function getBeijingCutoffTimestamp(): number {
  let cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
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
        cutoff = todayMidnight.getTime() - 365 * 24 * 60 * 60 * 1000;
      }
    }
  } catch (e) {
    console.error('[Date Helper Error]:', e);
  }
  return cutoff;
}

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

export function mergePhotosWithCache(newPhotos: TelegramPhoto[], mergedInfo: any, handle: string): void {
  if (newPhotos.length === 0 && !mergedInfo) return;

  if (mergedInfo) {
    if (mergedInfo.channelName) channelConfig.channelName = mergedInfo.channelName;
    if (mergedInfo.channelBio) channelConfig.channelBio = mergedInfo.channelBio;
    if (mergedInfo.avatarUrl) channelConfig.avatarUrl = mergedInfo.avatarUrl;
    if (mergedInfo.bannerUrl) channelConfig.bannerUrl = mergedInfo.bannerUrl;
  }
  channelConfig.handle = handle;

  if (newPhotos.length > 0) {
    const currentPhotos = getChannelPhotos();
    const existingPhotosMap = new Map(currentPhotos.filter(p => p && p.url && !isJunkOrEmojiUrl(p.url)).map(p => [p.id, p]));
    
    newPhotos.forEach(p => {
      if (p && p.url && !isJunkOrEmojiUrl(p.url)) {
        const existing = existingPhotosMap.get(p.id);
        existingPhotosMap.set(p.id, {
          ...existing,
          ...p,
          url: p.url
        });
      }
    });

    const updatedPhotos = Array.from(existingPhotosMap.values())
      .sort((a, b) => {
        const aId = parseInt(a.messageId || '0', 10);
        const bId = parseInt(b.messageId || '0', 10);
        if (aId && bId && aId !== bId) return bId - aId;
        const aTime = a.timestamp || (a.date ? new Date(`${a.date}T00:00:00+08:00`).getTime() : 0);
        const bTime = b.timestamp || (b.date ? new Date(`${b.date}T00:00:00+08:00`).getTime() : 0);
        return bTime - aTime;
      })
      .slice(0, 1500);

    setChannelPhotos(updatedPhotos);
  } else {
    saveCacheToDisk();
  }
}

export async function syncTelegramChannel(channelInput: string): Promise<boolean> {
  const handle = cleanChannelHandle(channelInput);
  if (!handle) return false;

  try {
    let currentBefore: number | null = null;
    let allParsedPhotos: TelegramPhoto[] = [];
    let mergedInfo: any = null;
    const cutoffTimestamp = getBeijingCutoffTimestamp();

    for (let page = 0; page < 40; page++) {
      const targetUrl = currentBefore
        ? `https://t.me/s/${handle}?before=${currentBefore}`
        : `https://t.me/s/${handle}`;

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) break;

      const html = await res.text();
      const parsed = parseTelegramWebHtml(html, handle);

      if (!mergedInfo || (parsed.info && parsed.info.avatarUrl && parsed.info.avatarUrl !== mergedInfo.avatarUrl)) {
        mergedInfo = { ...mergedInfo, ...parsed.info };
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
        if (currentBefore !== null && minId >= currentBefore) break;
        currentBefore = minId;
      } else {
        break;
      }

      if (pageHasOlderMessages && page >= 3) break;

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (allParsedPhotos.length > 0 || mergedInfo) {
      mergePhotosWithCache(allParsedPhotos, mergedInfo, handle);
      return true;
    }
  } catch (err) {
    console.error(`[Telegram Sync] Error syncing @${handle}:`, err);
  }
  return false;
}
