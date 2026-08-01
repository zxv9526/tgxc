export interface TelegramPhoto {
  id: string;
  title: string;
  description: string;
  url: string;
  album: string;
  tags: string[];
  likes: number;
  views: number;
  author: string;
  date: string;
  timestamp?: number;
  aspectRatio: string;
  telegramUrl?: string;
  messageId?: string;
}

export interface TelegramChannelInfo {
  channelName: string;
  channelBio: string;
  avatarUrl: string;
  bannerUrl: string;
  totalMembers?: string;
  handle: string;
}

export function cleanChannelHandle(input: string): string {
  if (!input) return '';
  let cleaned = input.trim();
  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  // Remove t.me/s/ or t.me/ or telegram.me/
  cleaned = cleaned.replace(/^(www\.)?(t|telegram)\.me\/(s\/)?/i, '');
  // Remove tg://resolve?domain=
  cleaned = cleaned.replace(/^tg:\/\/resolve\?domain=/i, '');
  // Remove leading @
  cleaned = cleaned.replace(/^@/, '');
  // Remove trailing slashes, query params
  cleaned = cleaned.split('/')[0].split('?')[0].trim();
  return cleaned;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseViews(viewsStr: string): number {
  if (!viewsStr) return 100;
  const clean = viewsStr.trim().toUpperCase();
  if (clean.endsWith('K')) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000);
  }
  if (clean.endsWith('M')) {
    return Math.round(parseFloat(clean.slice(0, -1)) * 1000000);
  }
  const num = parseInt(clean.replace(/\D/g, ''), 10);
  return isNaN(num) ? 120 : num;
}

export function isJunkOrEmojiUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  if (lower.includes('.js') || lower.includes('.css') || lower.includes('.json') || lower.includes('.html')) return true;
  if (lower.includes('telegram.org/img/emoji')) return true;
  if (lower.includes('/emoji/')) return true;
  if (lower.includes('sticker')) return true;
  if (lower.includes('avatar')) return true;
  if (lower.includes('userphoto') || lower.includes('user_photo')) return true;
  if (lower.includes('reaction')) return true;
  if (lower.endsWith('.svg')) return true;

  const isTgCdnFile = lower.includes('telesco.pe/file/') || lower.includes('telegram-cdn.org/file/');
  const isImageExt = /\.(?:jpg|jpeg|png|webp|gif)(\?|$)/i.test(lower);

  if (!isTgCdnFile && !isImageExt) return true;

  return false;
}

export function formatImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.includes('/api/proxy-image?enc=')) {
    try {
      const match = url.match(/enc=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(escape(atob(match[1])));
      }
    } catch (e) {}
  }
  if (url.includes('/api/proxy-image?url=')) {
    try {
      const match = url.match(/url=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }
  return url;
}

export function parseTelegramWebHtml(html: string, channelHandle: string): {
  info: TelegramChannelInfo;
  photos: TelegramPhoto[];
} {
  const handle = cleanChannelHandle(channelHandle);

  // 1. Channel Info Extraction
  let channelName = handle;
  const titleMatch = html.match(/<div class="tgme_channel_info_header_title"[^>]*>([\s\S]*?)<\/div>/i) ||
                     html.match(/<div class="tgme_page_title"[^>]*>([\s\S]*?)<\/div>/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    const rawTitle = stripHtml(titleMatch[1]).replace(/– Telegram$/, '').replace(/Telegram: Contact @\w+/, '').trim();
    if (rawTitle) channelName = rawTitle;
  }

  let channelBio = `@${handle} 频道的图像动态`;
  const bioMatch = html.match(/<div class="tgme_channel_info_description"[^>]*>([\s\S]*?)<\/div>/i) ||
                   html.match(/<div class="tgme_page_description"[^>]*>([\s\S]*?)<\/div>/i);
  if (bioMatch) {
    const rawBio = stripHtml(bioMatch[1]);
    if (rawBio) channelBio = rawBio;
  }

  let avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';
  const avatarMatch = html.match(/<img class="(?:tgme_page_photo_image|tgme_channel_info_header_photo)"[^>]*src="([^"]+)"/i) ||
                      html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*photo/i);
  if (avatarMatch && avatarMatch[1]) {
    avatarUrl = formatImageUrl(avatarMatch[1]);
  }

  let totalMembers = '';
  const memberMatch = html.match(/<div class="tgme_channel_info_counter"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<div class="tgme_page_extra"[^>]*>([^<]+)<\/div>/i);
  if (memberMatch) {
    totalMembers = stripHtml(memberMatch[1]);
  }

  // 2. Messages Parsing
  const photos: TelegramPhoto[] = [];
  // Split message blocks safely by message container markers
  const messageBlocks = html.split(/class=["']tgme_widget_message[\s"']/i);

  for (let i = 1; i < messageBlocks.length; i++) {
    const block = messageBlocks[i];
    // Unescape &quot; for clean url matching
    const cleanBlock = block.replace(/&quot;/g, '"');

    // Strip out user photo / avatar element to avoid extracting avatar background images
    const postContentBlock = cleanBlock.replace(/<(?:div|a)[^>]*class=["'][^"']*tgme_widget_message_userphoto[^"']*["'][^>]*>[\s\S]*?<\/(?:div|a)>/gi, '');

    const imageUrls: string[] = [];

    // Step 1: Specifically extract photo attachment elements in Telegram widget HTML
    const photoWrapMatches = cleanBlock.match(/<(?:a|div)[^>]*class=["'][^"']*(?:tgme_widget_message_photo_wrap|js-message_photo|tgme_widget_message_photo|tgme_widget_message_grouped_media_wrap)[^"']*["'][^>]*>/gi) || [];

    for (const wrapTag of photoWrapMatches) {
      const bgMatch = wrapTag.match(/background-image\s*:\s*url\(['"]?([^'"]+?)['"]?\)/i);
      let url = bgMatch ? bgMatch[1] : null;
      if (!url) {
        const srcMatch = wrapTag.match(/(?:src|data-src)=["']([^"']+)["']/i);
        if (srcMatch) url = srcMatch[1];
      }
      if (url) {
        url = url.trim();
        if (url.startsWith('//')) url = 'https:' + url;
        if (url.startsWith('http') && !imageUrls.includes(url) && !isJunkOrEmojiUrl(url)) {
          imageUrls.push(url);
        }
      }
    }

    // Step 2: Fallback for video thumbnails or documents if no standard photo wraps were found
    if (imageUrls.length === 0) {
      const videoWrapMatches = cleanBlock.match(/<(?:a|div|i)[^>]*class=["'][^"']*(?:tgme_widget_message_videoplayer_thumb|tgme_widget_message_video_thumb|tgme_widget_message_document_thumb)[^"']*["'][^>]*>/gi) || [];
      for (const wrapTag of videoWrapMatches) {
        const bgMatch = wrapTag.match(/background-image\s*:\s*url\(['"]?([^'"]+?)['"]?\)/i);
        let url = bgMatch ? bgMatch[1] : null;
        if (url) {
          url = url.trim();
          if (url.startsWith('//')) url = 'https:' + url;
          if (url.startsWith('http') && !imageUrls.includes(url) && !isJunkOrEmojiUrl(url)) {
            imageUrls.push(url);
          }
        }
      }
    }

    if (imageUrls.length === 0) continue;

    // Post link / Message ID
    const msgIdMatch = cleanBlock.match(/href="https:\/\/t\.me\/[^\/]+\/(\d+)"/i) || cleanBlock.match(/data-post="[^\/]+\/(\d+)"/i);
    const messageId = msgIdMatch ? msgIdMatch[1] : `${Date.now()}-${i}`;
    const telegramUrl = `https://t.me/${handle}/${messageId}`;

    // Caption
    const captionMatch = cleanBlock.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const rawCaption = captionMatch ? stripHtml(captionMatch[1]) : '';

    // Extract tags (#tag)
    const tagMatches = rawCaption.match(/#([\w\u4e00-\u9fa5]+)/g) || [];
    const tags = tagMatches.map(t => t.replace('#', '')).filter(Boolean);
    if (tags.length === 0) tags.push('Telegram', 'Channel');

    // Album recommendation
    let album = tags[0] || '频道图片';
    if (album.length > 10) album = '频道图片';

    // Views
    const viewsMatch = cleanBlock.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/i);
    const viewsStr = viewsMatch ? viewsMatch[1] : '';
    const views = parseViews(viewsStr);

    // Date (converted to Beijing Time / Asia/Shanghai)
    const dateMatch = cleanBlock.match(/<time[^>]*datetime=["']([^"']+)["']/i);
    let date = '';
    const getBeijingDateString = (d: Date) => {
      try {
        const formatter = new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const parts = formatter.formatToParts(d);
        const y = parts.find(p => p.type === 'year')?.value;
        const m = parts.find(p => p.type === 'month')?.value;
        const dayVal = parts.find(p => p.type === 'day')?.value;
        if (y && m && dayVal) return `${y}-${m}-${dayVal}`;
      } catch (e) {}
      return d.toISOString().split('T')[0];
    };

    let timestamp = Date.now();
    if (dateMatch && dateMatch[1]) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        date = getBeijingDateString(parsedDate);
        timestamp = parsedDate.getTime();
      } else {
        date = getBeijingDateString(new Date());
      }
    } else {
      date = getBeijingDateString(new Date());
    }

    // Title & description
    const lines = rawCaption.split('\n').filter(l => l.trim().length > 0);
    const title = lines[0] ? lines[0].slice(0, 40) : `Telegram 频道图片 #${messageId}`;
    const description = rawCaption || `来自 Telegram @${handle} 频道的图文动态`;

    // Add each photo found in message
    imageUrls.forEach((imgUrl, imgIdx) => {
      photos.push({
        id: `tg-${messageId}${imgIdx > 0 ? `-${imgIdx}` : ''}`,
        title: imageUrls.length > 1 ? `${title} (${imgIdx + 1}/${imageUrls.length})` : title,
        description,
        url: formatImageUrl(imgUrl),
        album,
        tags,
        likes: Math.floor(views * 0.15) + Math.floor(Math.random() * 10) + 1,
        views,
        author: `@${handle}`,
        date,
        timestamp,
        aspectRatio: '16:9',
        telegramUrl,
        messageId
      });
    });
  }

  const bannerUrl = photos.length > 0 ? photos[0].url : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop';

  return {
    info: {
      channelName,
      channelBio,
      avatarUrl,
      bannerUrl,
      totalMembers,
      handle
    },
    photos
  };
}

// Client-side fetch helper with multiple CORS proxy fallbacks for static deployments (e.g. Cloudflare Pages)
export async function fetchTelegramChannelFromClient(channelHandle: string): Promise<{
  info: TelegramChannelInfo;
  photos: TelegramPhoto[];
} | null> {
  const handle = cleanChannelHandle(channelHandle);
  if (!handle) return null;

  // First, let's try our local API endpoints because they are fast and cached
  const localEndpoints = [
    `/api/telegram/sync?channel=${encodeURIComponent(handle)}`,
    `/api/photos?channel=${encodeURIComponent(handle)}`
  ];

  for (const endpoint of localEndpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.photos && json.photos.length > 0) {
          return {
            info: json.info || {
              channelName: json.channelName || handle,
              channelBio: json.channelBio || `Telegram @${handle} 频道图集`,
              avatarUrl: json.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
              bannerUrl: json.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
              handle
            },
            photos: json.photos
          };
        }
      }
    } catch (e) {
      console.warn(`Failed fetching local endpoint ${endpoint}:`, e);
    }
  }

  // If local API didn't return photos, let's perform a multi-page client-side scrape using CORS proxies
  const proxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  ];

  for (const getProxyUrl of proxies) {
    try {
      let mergedInfo: TelegramChannelInfo | null = null;
      let allPhotos: TelegramPhoto[] = [];
      let currentBefore: number | null = null;
      
      // Scrape up to 5 pages on client side to get a healthy set of 50-80 images
      for (let page = 0; page < 5; page++) {
        const targetUrl = currentBefore 
          ? `https://t.me/s/${handle}?before=${currentBefore}`
          : `https://t.me/s/${handle}`;
          
        const proxyUrl = getProxyUrl(targetUrl);
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          if (allPhotos.length > 0) break;
          continue;
        }

        const html = await res.text();
        if (!html || !html.includes('tgme_widget_message')) {
          if (allPhotos.length > 0) break;
          continue;
        }

        const parsed = parseTelegramWebHtml(html, handle);
        if (!mergedInfo) {
          mergedInfo = parsed.info;
        }
        if (parsed.photos.length > 0) {
          allPhotos = [...allPhotos, ...parsed.photos];
        }

        // Find the min message ID for the next historical page
        const validIds = parsed.photos
          .map(p => parseInt(p.messageId || '', 10))
          .filter(id => !isNaN(id));
          
        if (validIds.length > 0) {
          const minId = Math.min(...validIds);
          if (currentBefore !== null && minId >= currentBefore) {
            break;
          }
          currentBefore = minId;
        } else {
          // Fallback parsing from raw HTML message blocks if parsed photos are empty but messages exist
          const messageBlocks = html.split(/class="tgme_widget_message\s+/i);
          const blockIds: number[] = [];
          for (let i = 1; i < messageBlocks.length; i++) {
            const block = messageBlocks[i];
            const msgIdMatch = block.match(/href="https:\/\/t\.me\/[^\/]+\/(\d+)"/i) || block.match(/data-post="[^\/]+\/(\d+)"/i);
            if (msgIdMatch && msgIdMatch[1]) {
              const idNum = parseInt(msgIdMatch[1], 10);
              if (!isNaN(idNum)) blockIds.push(idNum);
            }
          }
          if (blockIds.length > 0) {
            const minId = Math.min(...blockIds);
            if (currentBefore !== null && minId >= currentBefore) {
              break;
            }
            currentBefore = minId;
          } else {
            break;
          }
        }

        // Delay between page requests to avoid hitting rate limits too fast
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (allPhotos.length > 0) {
        return {
          info: mergedInfo || {
            channelName: handle,
            channelBio: `Telegram @${handle} 频道图集`,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
            bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
            handle
          },
          photos: allPhotos
        };
      }
    } catch (err) {
      console.warn(`Failed fetching via client proxy:`, err);
    }
  }

  return null;
}
