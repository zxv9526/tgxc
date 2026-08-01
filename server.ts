import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseTelegramWebHtml, cleanChannelHandle, TelegramPhoto } from './src/utils/telegram.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Target TG Channel Handle from Env
const initialChannelHandle = cleanChannelHandle(
  process.env.TELEGRAM_CHANNEL || process.env.TG_CHANNEL || process.env.CHANNEL_NAME || 'amlhmfzl'
);

let channelConfig = {
  channelName: process.env.CHANNEL_NAME || 'Telegram 官方频道图集',
  channelBio: 'Telegram 官方频道图集与精选摄影相册库。支持分类筛选、极速巡览与自动同步。',
  bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  totalMembers: '12,450 关注',
  handle: initialChannelHandle
};

let channelPhotos: TelegramPhoto[] = [];

// Helper function to fetch real Telegram channel web view
async function syncTelegramChannel(channelInput: string) {
  const handle = cleanChannelHandle(channelInput);
  if (!handle) return false;

  try {
    const targetUrl = `https://t.me/s/${handle}`;
    console.log(`[Telegram Sync] Fetching channel page from: ${targetUrl}`);
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    });

    if (!res.ok) {
      console.error(`[Telegram Sync] HTTP error ${res.status} when fetching t.me/s/${handle}`);
      return false;
    }

    const html = await res.text();
    const parsed = parseTelegramWebHtml(html, handle);

    if (parsed.photos.length > 0) {
      if (handle !== channelConfig.handle) {
        // Overwrite if switching to a completely different channel
        channelPhotos = parsed.photos;
      } else {
        // Merge with existing photos if it's the same channel
        const existingPhotosMap = new Map(channelPhotos.map(p => [p.id, p]));
        parsed.photos.forEach(p => {
          if (existingPhotosMap.has(p.id)) {
            const existing = existingPhotosMap.get(p.id)!;
            existingPhotosMap.set(p.id, {
              ...p,
              likes: Math.max(p.likes || 0, existing.likes || 0),
              views: Math.max(p.views || 0, existing.views || 0)
            });
          } else {
            existingPhotosMap.set(p.id, p);
          }
        });
        channelPhotos = Array.from(existingPhotosMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 500); // Limit to last 500 photos to prevent infinite growth
      }
      channelConfig.channelName = parsed.info.channelName;
      channelConfig.channelBio = parsed.info.channelBio;
      channelConfig.avatarUrl = parsed.info.avatarUrl;
      channelConfig.bannerUrl = parsed.info.bannerUrl;
      if (parsed.info.totalMembers) {
        channelConfig.totalMembers = parsed.info.totalMembers;
      }
      channelConfig.handle = handle;
      console.log(`[Telegram Sync] Successfully loaded and merged ${parsed.photos.length} photos for @${handle}. Total cached: ${channelPhotos.length}`);
      return true;
    } else {
      console.warn(`[Telegram Sync] No photos found in html for @${handle}`);
    }
  } catch (err) {
    console.error(`[Telegram Sync] Exception during sync for @${handle}:`, err);
  }
  return false;
}

// Initial sync on server boot
syncTelegramChannel(initialChannelHandle).catch(err => {
  console.error('Initial TG Sync failed:', err);
});

// Endpoint to explicitly trigger TG sync
app.all('/api/telegram/sync', async (req, res) => {
  const channel = (req.query.channel || req.body?.channel || channelConfig.handle || 'amlhmfzl') as string;
  const success = await syncTelegramChannel(channel);
  res.json({
    success,
    handle: channelConfig.handle,
    info: channelConfig,
    photosCount: channelPhotos.length,
    photos: channelPhotos
  });
});

// Image Proxy Endpoint to bypass Telegram CDN Referrer / CORS restrictions
app.get('/api/proxy-image', async (req, res) => {
  let imageUrl = req.query.url as string;
  const encUrl = req.query.enc as string;

  if (encUrl) {
    try {
      imageUrl = Buffer.from(encUrl, 'base64').toString('utf-8');
    } catch (e) {
      return res.status(400).send('Invalid encoded URL');
    }
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Support JSON base64 mode for clients that prefer data URLs
    if (req.query.b64 === 'true' || req.query.json === 'true') {
      const b64Str = buffer.toString('base64');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json({
        success: true,
        dataUrl: `data:${contentType};base64,${b64Str}`,
        contentType,
        size: buffer.length
      });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.query.download === '1' || req.query.download === 'true') {
      const filename = (req.query.filename as string) || `photo-${Date.now()}.jpg`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    res.send(buffer);
  } catch (err) {
    console.error('Image proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

// Get Photos with filter / search / album / sort / channel
app.get('/api/photos', async (req, res) => {
  const { album, search, tag, sort, channel } = req.query;

  if (channel && String(channel) !== channelConfig.handle) {
    await syncTelegramChannel(String(channel));
  }

  // If photos list is still empty, attempt a quick sync
  if (channelPhotos.length === 0 && channelConfig.handle) {
    await syncTelegramChannel(channelConfig.handle);
  }

  let filtered = [...channelPhotos];

  if (album && album !== 'All') {
    filtered = filtered.filter(p => p.album === album);
  }

  if (tag) {
    filtered = filtered.filter(p => p.tags.some(t => t.toLowerCase() === String(tag).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.album.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sort === 'likes') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else {
    // Default newest
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  res.json({
    photos: filtered,
    albums: ['All', ...Array.from(new Set(channelPhotos.map(p => p.album)))],
    info: channelConfig,
    totalCount: filtered.length,
  });
});

// Add new photo
app.post('/api/photos', (req, res) => {
  const { title, description, url, album, tags, cameraOrInfo, aspectRatio } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  const newPhoto: TelegramPhoto = {
    id: `photo-${Date.now()}`,
    title,
    description: description || '频道新增相册图片',
    url,
    album: album || '风光摄影',
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : ['Channel']),
    likes: 1,
    views: 12,
    author: 'Channel Admin',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    aspectRatio: aspectRatio || '16:9'
  };

  channelPhotos.unshift(newPhoto);
  res.json({ success: true, photo: newPhoto });
});

// Like photo
app.post('/api/photos/:id/like', (req, res) => {
  const { id } = req.params;
  const photo = channelPhotos.find(p => p.id === id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  photo.likes += 1;
  res.json({ success: true, likes: photo.likes });
});

// Increment view count
app.post('/api/photos/:id/view', (req, res) => {
  const { id } = req.params;
  const photo = channelPhotos.find(p => p.id === id);
  if (photo) {
    photo.views += 1;
  }
  res.json({ success: true });
});

// Channel Configuration Endpoint (returns channel name and runtime config)
app.get('/api/config', (req, res) => {
  res.json({
    channelName: process.env.CHANNEL_NAME || channelConfig.channelName,
    channelBio: channelConfig.channelBio,
    bannerUrl: channelConfig.bannerUrl,
    avatarUrl: channelConfig.avatarUrl,
    totalMembers: channelConfig.totalMembers,
    appUrl: process.env.APP_URL || '',
    handle: channelConfig.handle
  });
});

// Update Channel config
app.post('/api/config', (req, res) => {
  const { channelName, channelBio, bannerUrl, avatarUrl } = req.body;
  if (channelName) channelConfig.channelName = channelName;
  if (channelBio) channelConfig.channelBio = channelBio;
  if (bannerUrl) channelConfig.bannerUrl = bannerUrl;
  if (avatarUrl) channelConfig.avatarUrl = avatarUrl;

  res.json({ success: true, config: channelConfig });
});

// --- Server-Side Asset & Route Handling ---

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
