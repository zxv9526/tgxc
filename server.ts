import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.js';
import { loadCacheFromDisk, channelConfig } from './server/storage.js';
import { syncTelegramChannel } from './server/telegramFetcher.js';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize and load disk cache on server boot
loadCacheFromDisk();

// Initial sync on server boot
syncTelegramChannel(channelConfig.handle).catch(err => {
  console.error('Initial TG Sync failed:', err);
});

// Periodic background sync every 30 seconds
setInterval(() => {
  if (channelConfig.handle) {
    syncTelegramChannel(channelConfig.handle).catch(err => {
      console.error('Background TG Sync failed:', err);
    });
  }
}, 30000);

// Mount modular API Router
app.use('/api', apiRouter);

// --- Server-Side Asset & Route Handling ---
const PORT = 3000;

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || 
                       (typeof __filename !== 'undefined' && (__filename.includes('server.cjs') || __filename.includes('dist'))) || 
                       !fs.existsSync(path.join(process.cwd(), 'server.ts'));

  if (isProduction) {
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
