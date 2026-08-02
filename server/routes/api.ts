import { Router, Request, Response } from 'express';
import { channelConfig, channelPhotos } from '../storage.js';
import { syncTelegramChannel } from '../telegramFetcher.js';
import { groupPhotosToBlogPosts } from '../../src/utils/telegram.js';

const router = Router();

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

  // Handle double-proxy or relative path resolution
  if (imageUrl && (imageUrl.startsWith('/api/proxy-image') || imageUrl.includes('/api/proxy-image?'))) {
    try {
      const dummyUrl = new URL(imageUrl, 'http://localhost:3000');
      const innerUrl = dummyUrl.searchParams.get('url');
      const innerEnc = dummyUrl.searchParams.get('enc');
      if (innerEnc) {
        imageUrl = Buffer.from(innerEnc, 'base64').toString('utf-8');
      } else if (innerUrl) {
        imageUrl = innerUrl;
      }
    } catch (e) {}
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

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

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

// Get Photos and Posts
router.get('/photos', async (req: Request, res: Response) => {
  if (channelPhotos.length === 0 && channelConfig.handle) {
    await syncTelegramChannel(channelConfig.handle);
  }

  const sorted = [...channelPhotos].sort((a, b) => {
    const aId = parseInt(a.messageId || '0', 10);
    const bId = parseInt(b.messageId || '0', 10);
    if (aId && bId && aId !== bId) return bId - aId;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  const posts = groupPhotosToBlogPosts(sorted);

  res.json({
    photos: sorted,
    posts: posts,
    channelName: channelConfig.channelName || `@${channelConfig.handle}`,
    channelBio: channelConfig.channelBio,
    avatarUrl: channelConfig.avatarUrl,
    bannerUrl: channelConfig.bannerUrl,
    handle: channelConfig.handle,
  });
});

// Trigger sync
router.post('/sync', async (_req: Request, res: Response) => {
  const success = await syncTelegramChannel(channelConfig.handle);
  res.json({
    success,
    photosCount: channelPhotos.length,
    channelName: channelConfig.channelName,
    avatarUrl: channelConfig.avatarUrl,
    channelBio: channelConfig.channelBio
  });
});

export default router;
