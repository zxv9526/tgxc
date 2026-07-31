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

export function formatImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/api/proxy-image') || url.includes('/api/proxy-image')) {
    return url;
  }
  if (
    url.includes('telesco.pe') ||
    url.includes('telegram-cdn.org') ||
    url.includes('telegram.org') ||
    url.includes('t.me')
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
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
  const messageBlocks = html.split(/class="tgme_widget_message\s+/i);

  for (let i = 1; i < messageBlocks.length; i++) {
    const block = messageBlocks[i];
    // Unescape &quot; for clean url matching
    const cleanBlock = block.replace(/&quot;/g, '"');

    const imageUrls: string[] = [];

    // Pattern 1: background-image:url(...) or url('...') or url("...")
    const bgRegex = /background-image:\s*url\(['"]?(https:\/\/[^'"\)\s]+)['"]?\)/gi;
    let match;
    while ((match = bgRegex.exec(cleanBlock)) !== null) {
      const url = match[1];
      if (url && !imageUrls.includes(url)) {
        imageUrls.push(url);
      }
    }

    // Pattern 2: Direct CDN links to images (telesco.pe or telegram-cdn)
    const cdnRegex = /(https:\/\/(?:cdn\d*\.telesco\.pe|cdn\d*\.telegram-cdn\.org|telegram\.org)\/file\/[^"'\s\)]+)/gi;
    while ((match = cdnRegex.exec(cleanBlock)) !== null) {
      const url = match[1];
      if (url && !imageUrls.includes(url)) {
        imageUrls.push(url);
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

    // Date
    const dateMatch = cleanBlock.match(/<time datetime="([^"]+)"/i);
    let date = new Date().toISOString().split('T')[0];
    if (dateMatch && dateMatch[1]) {
      date = dateMatch[1].split('T')[0];
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

  const targetUrl = `https://t.me/s/${handle}`;

  // Try multiple endpoints/proxies
  const fetchSources = [
    `/api/telegram/sync?channel=${encodeURIComponent(handle)}`,
    `/api/photos?channel=${encodeURIComponent(handle)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const source of fetchSources) {
    try {
      const res = await fetch(source);
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
      } else {
        const html = await res.text();
        if (html && html.includes('tgme_widget_message')) {
          const parsed = parseTelegramWebHtml(html, handle);
          if (parsed.photos.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn(`Failed fetching from source ${source}:`, err);
    }
  }

  return null;
}
