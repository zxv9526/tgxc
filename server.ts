import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- Channel Photo Gallery Data & Endpoints ---

interface ChannelPhoto {
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
  cameraOrInfo?: string;
  resolution?: string;
}

let channelConfig = {
  channelName: process.env.CHANNEL_NAME || 'AI Creator Studio Channel',
  channelBio: '官方频道图集与精选摄影相册库。支持相册分类、多重过滤、幻灯片巡览与相册管理。',
  bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  totalMembers: 12450,
};

let channelPhotos: ChannelPhoto[] = [
  {
    id: 'photo-1',
    title: '赛博朋克霓虹城市夜景',
    description: '频道视觉精选：高耸的摩天大楼与绚丽霓虹灯交相辉映的光影世界。',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1200&auto=format&fit=crop',
    album: '视觉艺术',
    tags: ['Cyberpunk', 'Neon', 'Cityscape', 'Night'],
    likes: 342,
    views: 1890,
    author: 'Channel Admin',
    date: '2026-07-28',
    aspectRatio: '16:9',
    cameraOrInfo: 'Sony A7S III, 35mm f/1.4',
    resolution: '3840 x 2160'
  },
  {
    id: 'photo-2',
    title: '晨雾中的高山湖泊',
    description: '频道社群摄影采风作品：阳光透射晨雾印照在澄澈如镜的水面上。',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    album: '风光摄影',
    tags: ['Nature', 'Mountain', 'Lake', 'Landscape'],
    likes: 512,
    views: 3100,
    author: 'Elena Vance',
    date: '2026-07-25',
    aspectRatio: '16:9',
    cameraOrInfo: 'Sony A7R IV, 24mm f/2.8, ISO 100',
    resolution: '4000 x 2250'
  },
  {
    id: 'photo-3',
    title: '极简流体抽象艺术',
    description: '用于频道视频背景与UI界面的高分辨率极简梦幻流体渐变。',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    album: '壁纸素材',
    tags: ['Abstract', 'Gradient', 'Minimalist', 'Wallpaper'],
    likes: 289,
    views: 1420,
    author: 'Design Studio',
    date: '2026-07-20',
    aspectRatio: '16:9',
    cameraOrInfo: 'Digital Motion Graphics Design',
    resolution: '3840 x 2160'
  },
  {
    id: 'photo-4',
    title: '频道开发者线下 Meetup 记录',
    description: '年度频道创作者交流大会现场照片，氛围融洽，激发无限灵感。',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    album: '频道活动',
    tags: ['Meetup', 'Community', 'Team', 'Event'],
    likes: 410,
    views: 2200,
    author: 'Channel Team',
    date: '2026-07-15',
    aspectRatio: '16:9',
    cameraOrInfo: 'Canon EOS R5, 35mm f/1.8',
    resolution: '3000 x 2000'
  },
  {
    id: 'photo-5',
    title: '深空银河璀璨星轨',
    description: '深夜山顶拍摄的银河全景，满天繁星闪烁，仿佛伸手可及。',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    album: '风光摄影',
    tags: ['Night', 'Space', 'Stars', 'Astrophotography'],
    likes: 620,
    views: 4500,
    author: 'AstroGuy',
    date: '2026-07-10',
    aspectRatio: '16:9',
    cameraOrInfo: 'Nikon Z7 II, 14mm f/2.8, 25s exposure',
    resolution: '3840 x 2160'
  },
  {
    id: 'photo-6',
    title: '城市建筑立体几何美学',
    description: '频道建筑设计专题：现代钢筋水泥与玻璃幕墙在日光下的几何线条。',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    album: '视觉艺术',
    tags: ['Architecture', 'Urban', 'Design', 'Lines'],
    likes: 195,
    views: 1120,
    author: 'ArchStudio',
    date: '2026-07-05',
    aspectRatio: '1:1',
    cameraOrInfo: 'Leica M11, 50mm f/2.0',
    resolution: '2400 x 2400'
  },
  {
    id: 'photo-7',
    title: '热带雨林中的斑驳阳光',
    description: '阳光穿透茂密的树冠，照耀在青苔与瀑布水雾之上。',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
    album: '风光摄影',
    tags: ['Forest', 'Green', 'Sunlight', 'Nature'],
    likes: 278,
    views: 1650,
    author: 'WildExplorer',
    date: '2026-07-01',
    aspectRatio: '16:9',
    cameraOrInfo: 'Fujifilm X-T4, 16-55mm',
    resolution: '3200 x 1800'
  },
  {
    id: 'photo-8',
    title: '赛博空间极光壁纸',
    description: '充满科技感的虚拟极光效果，适合作为桌面 wallpaper。',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    album: '壁纸素材',
    tags: ['Aurora', 'Sci-Fi', 'Wallpaper', 'Glowing'],
    likes: 388,
    views: 2980,
    author: 'VaporWave Studio',
    date: '2026-06-28',
    aspectRatio: '16:9',
    cameraOrInfo: 'Procedural Shader Render',
    resolution: '3840 x 2160'
  }
];

// Get Photos with filter / search / album / sort
app.get('/api/photos', (req, res) => {
  const { album, search, tag, sort } = req.query;

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
    totalCount: filtered.length,
  });
});

// Add new photo
app.post('/api/photos', (req, res) => {
  const { title, description, url, album, tags, cameraOrInfo, aspectRatio } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  const newPhoto: ChannelPhoto = {
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
    aspectRatio: aspectRatio || '16:9',
    cameraOrInfo: cameraOrInfo || 'Uploaded Photo',
    resolution: '1920 x 1080'
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
    appUrl: process.env.APP_URL || ''
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
