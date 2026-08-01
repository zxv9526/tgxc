import { Router, Request, Response } from 'express';
import { channelConfig, channelPhotos, setChannelPhotos, updateChannelConfig } from '../storage.js';
import { syncTelegramChannel } from '../telegramFetcher.js';
import { TelegramPhoto } from '../../src/types.js';

const router = Router();

// Endpoint to explicitly trigger TG sync
router.all('/telegram/sync', async (req: Request, res: Response) => {
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
router.get('/proxy-image', async (req: Request, res: Response) => {
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
router.get('/photos', async (req: Request, res: Response) => {
  const { album, search, tag, sort, channel } = req.query;

  if (channel && String(channel) !== channelConfig.handle) {
    await syncTelegramChannel(String(channel));
  }

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

  if (sort === 'popular') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sort === 'likes') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else {
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
router.post('/photos', (req: Request, res: Response) => {
  const { title, description, url, album, tags, aspectRatio } = req.body;

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

  const updatedList = [newPhoto, ...channelPhotos];
  setChannelPhotos(updatedList);
  res.json({ success: true, photo: newPhoto });
});

// Like photo
router.post('/photos/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const photo = channelPhotos.find(p => p.id === id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  photo.likes += 1;
  setChannelPhotos([...channelPhotos]);
  res.json({ success: true, likes: photo.likes });
});

// Increment view count
router.post('/photos/:id/view', (req: Request, res: Response) => {
  const { id } = req.params;
  const photo = channelPhotos.find(p => p.id === id);
  if (photo) {
    photo.views += 1;
    setChannelPhotos([...channelPhotos]);
  }
  res.json({ success: true });
});

// Channel Configuration Endpoint
router.get('/config', (req: Request, res: Response) => {
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
router.post('/config', (req: Request, res: Response) => {
  const { channelName, channelBio, bannerUrl, avatarUrl } = req.body;
  const updated = updateChannelConfig({
    ...(channelName && { channelName }),
    ...(channelBio && { channelBio }),
    ...(bannerUrl && { bannerUrl }),
    ...(avatarUrl && { avatarUrl }),
  });

  res.json({ success: true, config: updated });
});

export default router;
