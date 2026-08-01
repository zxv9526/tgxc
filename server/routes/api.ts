import { Router, Request, Response } from 'express';
import { channelConfig, channelPhotos } from '../storage.js';
import { syncTelegramChannel } from '../telegramFetcher.js';

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

// Get Photos
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

  res.json({
    photos: sorted,
    channelName: channelConfig.channelName || `@${channelConfig.handle}`,
    handle: channelConfig.handle,
  });
});

// Trigger sync
router.post('/sync', async (_req: Request, res: Response) => {
  const success = await syncTelegramChannel(channelConfig.handle);
  res.json({ success, photosCount: channelPhotos.length });
});

export default router;
