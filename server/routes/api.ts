import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import { channelConfig, channelPhotos, getChannelPhotos, getChannelConfig, getLastCacheUpdateTime } from '../storage.js';
import { syncTelegramChannel } from '../telegramFetcher.js';
import { groupPhotosToBlogPosts } from '../../src/utils/telegram.js';

const router = Router();

// Fallback helper to fetch image using native https module with option to bypass TLS verification
function fetchWithHttpsModule(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options: https.RequestOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        timeout: 15000,
        rejectUnauthorized: false // Bypasses SSL cert issues in minimal/Alpine Docker/GCP environments
      };

      const req = client.get(url, options, (res) => {
        // Handle redirects (e.g., 301, 302)
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          resolve(fetchWithHttpsModule(redirectUrl));
          return;
        }

        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTPS module returned status code ${res.statusCode}`));
          return;
        }

        const contentType = res.headers['content-type'] || 'image/jpeg';
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType
          });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

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
    let buffer: Buffer;
    let contentType = 'image/jpeg';

    try {
      // First attempt: Standard native fetch
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      if (response.ok) {
        contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error(`Native fetch returned status ${response.status}`);
      }
    } catch (fetchErr) {
      console.warn(`[Proxy Image] Native fetch failed for ${imageUrl}, trying fallback HTTPS module... Error:`, fetchErr instanceof Error ? fetchErr.message : fetchErr);
      
      // Second attempt: Fallback with HTTPS module (rejectUnauthorized: false)
      const fallbackResult = await fetchWithHttpsModule(imageUrl);
      buffer = fallbackResult.buffer;
      contentType = fallbackResult.contentType;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

    if (req.query.download === '1' || req.query.download === 'true') {
      const filename = (req.query.filename as string) || `photo-${Date.now()}.jpg`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    res.send(buffer);
  } catch (err) {
    console.error('Image proxy error for URL:', imageUrl, err);
    res.status(500).send('Proxy error');
  }
});

// Get Photos and Posts
router.get('/photos', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const config = getChannelConfig();
  const photos = getChannelPhotos();
  const lastUpdate = getLastCacheUpdateTime();
  const isStale = Date.now() - lastUpdate > 60 * 1000; // 60 seconds in milliseconds

  if (config.handle) {
    if (photos.length === 0 || isStale) {
      console.log(`[API /photos] Cache is empty or stale (last update: ${lastUpdate ? new Date(lastUpdate).toISOString() : 'Never'}). Synchronously syncing channel @${config.handle}...`);
      await syncTelegramChannel(config.handle);
    }
  }

  const currentPhotos = getChannelPhotos();
  const currentConfig = getChannelConfig();

  const sorted = [...currentPhotos].sort((a, b) => {
    const aId = parseInt(a.messageId || '0', 10);
    const bId = parseInt(b.messageId || '0', 10);
    if (aId && bId && aId !== bId) return bId - aId;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  const posts = groupPhotosToBlogPosts(sorted);

  res.json({
    photos: sorted,
    posts: posts,
    channelName: currentConfig.channelName || `@${currentConfig.handle}`,
    channelBio: currentConfig.channelBio,
    avatarUrl: currentConfig.avatarUrl,
    bannerUrl: currentConfig.bannerUrl,
    handle: currentConfig.handle,
  });
});

// Trigger sync
router.post('/sync', async (_req: Request, res: Response) => {
  const config = getChannelConfig();
  const success = await syncTelegramChannel(config.handle);
  const updatedPhotos = getChannelPhotos();
  const updatedConfig = getChannelConfig();
  res.json({
    success,
    photosCount: updatedPhotos.length,
    channelName: updatedConfig.channelName,
    avatarUrl: updatedConfig.avatarUrl,
    channelBio: updatedConfig.channelBio
  });
});

export default router;
