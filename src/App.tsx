/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Image as ImageIcon,
  LayoutGrid,
  Film,
  Heart,
  Eye,
  Download,
  Share2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Tag,
  Calendar,
  User,
  Folder,
  Settings,
  RefreshCw,
  Check,
  Camera,
  Play,
  Pause,
  List,
  SlidersHorizontal,
  Info,
  ExternalLink,
  Send
} from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  TelegramPhoto
} from './utils/telegram';

// --- Type Definitions ---
type ChannelPhoto = TelegramPhoto;

interface ChannelConfig {
  channelName: string;
  channelBio: string;
  bannerUrl: string;
  avatarUrl: string;
  totalMembers: string | number;
  handle?: string;
}

// --- Fallback Data for Static Deployments (e.g., GitHub Pages) ---
const FALLBACK_PHOTOS: ChannelPhoto[] = [
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

export default function App() {
  // Telegram Channel Handle State
  const [tgHandle, setTgHandle] = useState<string>(() => {
    return localStorage.getItem('tg_channel_handle') || 'sphotographs';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // --- Global Channel & Gallery State ---
  const [config, setConfig] = useState<ChannelConfig>({
    channelName: 'Telegram 官方频道图集',
    channelBio: '同步 Telegram 公开频道的最新精选相册。支持相册分类、多重过滤、幻灯片巡览与相册管理。',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    totalMembers: '12,450 关注',
    handle: 'sphotographs'
  });

  const [photos, setPhotos] = useState<ChannelPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>(['All']);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'likes'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow' | 'list'>('grid');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lightbox Modal State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Slideshow Auto-Play State
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number>(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Add Photo Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formUrl, setFormUrl] = useState<string>('');
  const [formAlbum, setFormAlbum] = useState<string>('风光摄影');
  const [formTags, setFormTags] = useState<string>('');
  const [formCamera, setFormCamera] = useState<string>('');

  // Edit Channel Settings Form State
  const [editChannelName, setEditChannelName] = useState<string>('');
  const [editChannelBio, setEditChannelBio] = useState<string>('');
  const [editBannerUrl, setEditBannerUrl] = useState<string>('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');

  // Synchronization with Telegram Channel
  const handleSyncTelegram = useCallback(async (targetHandleInput?: string) => {
    const handleToSync = cleanChannelHandle(targetHandleInput || tgHandle);
    if (!handleToSync) return;

    setIsSyncing(true);
    setSyncMsg(`正在连接并拉取 @${handleToSync} 频道的最新图片...`);

    try {
      // 1. Try Backend API first
      const res = await fetch(`/api/telegram/sync?channel=${encodeURIComponent(handleToSync)}`);
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');

      if (isJson) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          setPhotos(data.photos);
          setAlbums(['All', ...Array.from(new Set(data.photos.map((p: any) => p.album))) as string[]]);
          if (data.info) setConfig(data.info);
          localStorage.setItem('tg_channel_handle', handleToSync);
          localStorage.setItem('channel_photos', JSON.stringify(data.photos));
          setSyncMsg(`已成功拉取 @${handleToSync} 频道的 ${data.photos.length} 张原图照片！`);
          setIsLoading(false);
          setIsSyncing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend sync API failed, trying client fallback:', err);
    }

    // 2. Fallback to client-side Telegram Web Parser
    try {
      const clientResult = await fetchTelegramChannelFromClient(handleToSync);
      if (clientResult && clientResult.photos.length > 0) {
        setPhotos(clientResult.photos);
        setAlbums(['All', ...Array.from(new Set(clientResult.photos.map(p => p.album))) as string[]]);
        setConfig({
          channelName: clientResult.info.channelName,
          channelBio: clientResult.info.channelBio,
          avatarUrl: clientResult.info.avatarUrl,
          bannerUrl: clientResult.info.bannerUrl,
          totalMembers: clientResult.info.totalMembers || '12,450 关注',
          handle: handleToSync
        });
        localStorage.setItem('tg_channel_handle', handleToSync);
        localStorage.setItem('channel_photos', JSON.stringify(clientResult.photos));
        setSyncMsg(`同步成功！已展示 @${handleToSync} 频道的 ${clientResult.photos.length} 张最新图片！`);
        setIsLoading(false);
        setIsSyncing(false);
        return;
      }
    } catch (err) {
      console.error('Client-side Telegram fetch error:', err);
    }

    setSyncMsg(`未能在 @${handleToSync} 中解析到照片，请确认频道为公开 Telegram 频道且包含图片发帖。`);
    setIsLoading(false);
    setIsSyncing(false);
  }, [tgHandle]);

  // Fetch Config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        const data = await res.json();
        setConfig(prev => ({ ...prev, ...data }));
        setEditChannelName(data.channelName || '');
        setEditChannelBio(data.channelBio || '');
        setEditBannerUrl(data.bannerUrl || '');
        setEditAvatarUrl(data.avatarUrl || '');
        return;
      }
    } catch (err) {
      console.warn('Backend config endpoint unavailable:', err);
    }

    try {
      const savedConfig = localStorage.getItem('channel_config');
      if (savedConfig) {
        const data = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...data }));
        setEditChannelName(data.channelName || '');
        setEditChannelBio(data.channelBio || '');
        setEditBannerUrl(data.bannerUrl || '');
        setEditAvatarUrl(data.avatarUrl || '');
      }
    } catch (e) {
      console.error('Failed to load local config', e);
    }
  }, []);

  // Fetch Photos
  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    const handleToFetch = cleanChannelHandle(tgHandle);

    try {
      const params = new URLSearchParams();
      if (selectedAlbum !== 'All') params.append('album', selectedAlbum);
      if (selectedTag) params.append('tag', selectedTag);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      if (handleToFetch) params.append('channel', handleToFetch);

      const res = await fetch(`/api/photos?${params.toString()}`);
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          setPhotos(data.photos);
          setAlbums(data.albums || ['All']);
          if (data.info) setConfig(data.info);
          setIsLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Backend API unavailable, trying client fallback:', err);
    }

    if (handleToFetch) {
      const clientResult = await fetchTelegramChannelFromClient(handleToFetch);
      if (clientResult && clientResult.photos.length > 0) {
        let filtered = [...clientResult.photos];
        if (selectedAlbum !== 'All') filtered = filtered.filter(p => p.album === selectedAlbum);
        if (selectedTag) filtered = filtered.filter(p => p.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        setPhotos(filtered);
        setAlbums(['All', ...Array.from(new Set(clientResult.photos.map(p => p.album)))]);
        setConfig({
          channelName: clientResult.info.channelName,
          channelBio: clientResult.info.channelBio,
          avatarUrl: clientResult.info.avatarUrl,
          bannerUrl: clientResult.info.bannerUrl,
          totalMembers: clientResult.info.totalMembers || '12,450 关注',
          handle: handleToFetch
        });
        setIsLoading(false);
        return;
      }
    }

    setPhotos(FALLBACK_PHOTOS);
    setIsLoading(false);
  }, [tgHandle, selectedAlbum, selectedTag, searchQuery, sortBy]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Slideshow interval timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewMode === 'slideshow' && isSlideshowPlaying && photos.length > 0) {
      timer = setInterval(() => {
        setSlideshowIndex(prev => (prev + 1) % photos.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [viewMode, isSlideshowPlaying, photos.length]);

  // Lightbox Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'Escape') setActivePhotoIndex(null);
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex(prev => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, photos.length]);

  // Like photo
  const handleLikePhoto = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/photos/${photoId}/like`, { method: 'POST' });
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        const data = await res.json();
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: data.likes } : p));
        return;
      }
    } catch (err) {
      console.warn('Like photo server call failed, updating local state:', err);
    }

    setPhotos(prev => {
      const next = prev.map(p => p.id === photoId ? { ...p, likes: p.likes + 1 } : p);
      try {
        const stored = localStorage.getItem('channel_photos');
        if (stored) {
          const list: ChannelPhoto[] = JSON.parse(stored);
          const updatedList = list.map(p => p.id === photoId ? { ...p, likes: p.likes + 1 } : p);
          localStorage.setItem('channel_photos', JSON.stringify(updatedList));
        }
      } catch (e) {}
      return next;
    });
  };

  // Open Lightbox
  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
    const photo = photos[index];
    if (photo) {
      fetch(`/api/photos/${photo.id}/view`, { method: 'POST' }).catch(() => {});
      setPhotos(prev => prev.map((p, i) => i === index ? { ...p, views: p.views + 1 } : p));
    }
  };

  // Submit New Photo
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    const newPhoto: ChannelPhoto = {
      id: `photo-${Date.now()}`,
      title: formTitle,
      description: formDesc || '频道新增相册图片',
      url: formUrl,
      album: formAlbum || '风光摄影',
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      likes: 1,
      views: 12,
      author: 'Channel Admin',
      date: new Date().toISOString().split('T')[0],
      aspectRatio: '16:9',
      cameraOrInfo: formCamera || 'Uploaded Photo',
      resolution: '1920 x 1080'
    };

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto)
      });
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        setShowAddModal(false);
        setFormTitle(''); setFormDesc(''); setFormUrl(''); setFormTags(''); setFormCamera('');
        fetchPhotos();
        return;
      }
    } catch (err) {
      console.warn('Backend photo creation failed, storing in localStorage:', err);
    }

    try {
      const stored = localStorage.getItem('channel_photos');
      const list: ChannelPhoto[] = stored ? JSON.parse(stored) : [...FALLBACK_PHOTOS];
      list.unshift(newPhoto);
      localStorage.setItem('channel_photos', JSON.stringify(list));
      setShowAddModal(false);
      setFormTitle(''); setFormDesc(''); setFormUrl(''); setFormTags(''); setFormCamera('');
      fetchPhotos();
    } catch (err) {
      alert('保存图片失败');
    }
  };

  // Save Channel Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      channelName: editChannelName,
      channelBio: editChannelBio,
      bannerUrl: editBannerUrl,
      avatarUrl: editAvatarUrl
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        setConfig(prev => ({ ...prev, ...updated }));
        setShowSettingsModal(false);
        return;
      }
    } catch (err) {
      console.warn('Backend config update failed, storing locally:', err);
    }

    try {
      localStorage.setItem('channel_config', JSON.stringify(updated));
      setConfig(prev => ({ ...prev, ...updated }));
      setShowSettingsModal(false);
    } catch (err) {
      alert('保存设置失败');
    }
  };

  const currentLightboxPhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* --- CHANNEL BANNER HEADER --- */}
      <header className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-800">
        {/* Background Banner Image */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden">
          <img
            src={config.bannerUrl}
            alt="Channel Banner"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Channel Info Overlay Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 pb-6 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Channel Avatar */}
              <div className="relative group">
                <img
                  src={config.avatarUrl}
                  alt="Channel Avatar"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-slate-950 shadow-2xl bg-slate-800"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" title="频道在线" />
              </div>

              {/* Title & Stats */}
              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
                    {config.channelName}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[11px] font-medium text-indigo-300">
                    官方频道相册
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl line-clamp-2">
                  {config.channelBio}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <strong className="text-slate-200">{photos.length}</strong> 张照片
                  </span>
                  <span className="flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-emerald-400" />
                    <strong className="text-slate-200">{albums.length - 1}</strong> 个相册
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <strong className="text-slate-200">{config.totalMembers.toLocaleString()}</strong> 订阅成员
                  </span>
                </div>
              </div>
            </div>

            {/* Top Header Buttons */}
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
              <button
                id="open-add-modal-btn"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                新增相册照片
              </button>
              <button
                id="open-settings-btn"
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl transition-all"
                title="频道外观设置"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- GALLERY CONTROLS & ALBUM BAR --- */}
      <nav className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Albums Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {albums.map(album => (
              <button
                key={album}
                onClick={() => { setSelectedAlbum(album); setSelectedTag(null); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedAlbum === album && !selectedTag ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <Folder className="w-3.5 h-3.5 opacity-70" />
                {album === 'All' ? '全部照片' : album}
              </button>
            ))}
            {selectedTag && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs">
                <Tag className="w-3 h-3" />
                <span>#{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Search, Sort & Layout Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="搜索频道图片/标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === 'newest' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                最新
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === 'popular' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                最热
              </button>
              <button
                onClick={() => setSortBy('likes')}
                className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === 'likes' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                赞最多
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="网格相册"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('slideshow')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'slideshow' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="幻灯片巡览"
              >
                <Film className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="列表明细"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN PHOTO GALLERY CONTENT --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-medium">正在加载频道照片相册...</span>
          </div>
        ) : photos.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl p-12 bg-slate-900/40 max-w-lg mx-auto my-12">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">没有找到相关频道图片</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">试着切换相册分类、清除搜索词，或者新增一张照片到频道相册。</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              上传第一张照片
            </button>
          </div>
        ) : (
          <>
            {/* VIEW MODE 1: GRID GALLERY */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => handleOpenLightbox(index)}
                    className="group relative bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-video sm:aspect-square w-full overflow-hidden bg-slate-950">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg text-[10px] font-semibold text-slate-300">
                            {photo.album}
                          </span>
                          <button
                            onClick={(e) => handleLikePhoto(photo.id, e)}
                            className="p-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1 text-xs"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            <span>{photo.likes}</span>
                          </button>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <Eye className="w-3.5 h-3.5" />
                            {photo.views}
                          </span>
                          <span className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-[11px] flex items-center gap-1 shadow-md">
                            <Maximize2 className="w-3 h-3" /> 大图
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Info Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {photo.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {photo.description}
                        </p>
                      </div>

                      {/* Tags Bar */}
                      <div className="pt-2 flex flex-wrap gap-1 border-t border-slate-800/80">
                        {photo.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}
                            className="px-2 py-0.5 bg-slate-800/60 hover:bg-slate-800 rounded-md text-[10px] text-slate-400 hover:text-indigo-300 transition-all"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE 2: SLIDESHOW / FILMSTRIP */}
            {viewMode === 'slideshow' && photos.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
                {/* Main Large Slide */}
                <div className="relative w-full aspect-[16/9] max-h-[550px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <img
                    src={photos[slideshowIndex].url}
                    alt={photos[slideshowIndex].title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Floating Overlay Controls */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] rounded-full font-medium">
                        {photos[slideshowIndex].album}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                        {photos[slideshowIndex].title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                        {photos[slideshowIndex].description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
                      >
                        {isSlideshowPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isSlideshowPlaying ? '暂停轮播' : '自动轮播'}
                      </button>
                      <button
                        onClick={() => handleOpenLightbox(slideshowIndex)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
                        title="全屏放大"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Previous / Next Arrow Overlays */}
                  <button
                    onClick={() => setSlideshowIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-700/80 text-white rounded-2xl backdrop-blur transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSlideshowIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-700/80 text-white rounded-2xl backdrop-blur transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Filmstrip Thumbnails Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {photos.map((photo, i) => (
                    <button
                      key={photo.id}
                      onClick={() => setSlideshowIndex(i)}
                      className={`relative shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === slideshowIndex ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105' : 'border-slate-800 opacity-50 hover:opacity-100'}`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW MODE 3: COMPACT LIST VIEW */}
            {viewMode === 'list' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">图像</th>
                      <th className="px-4 py-3">标题 & 描述</th>
                      <th className="px-4 py-3">相册</th>
                      <th className="px-4 py-3">标签</th>
                      <th className="px-4 py-3">发布时间</th>
                      <th className="px-4 py-3 text-right">赞/浏览</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {photos.map((photo, index) => (
                      <tr
                        key={photo.id}
                        onClick={() => handleOpenLightbox(index)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <img
                            src={photo.url}
                            alt={photo.title}
                            referrerPolicy="no-referrer"
                            className="w-16 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{photo.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{photo.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-medium text-slate-300">
                            {photo.album}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {photo.tags.map((t, i) => (
                              <span key={i} className="text-[10px] text-indigo-400">#{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{photo.date}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-rose-400 font-medium mr-3">❤️ {photo.likes}</span>
                          <span className="text-slate-400">👀 {photo.views}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- LIGHTBOX FULLSCREEN MODAL --- */}
      {currentLightboxPhoto && activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden animate-fade-in">
          {/* Main Photo Display Stage */}
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 bg-black/60">
            {/* Close Button */}
            <button
              onClick={() => setActivePhotoIndex(null)}
              className="absolute top-4 left-4 z-20 p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={() => setActivePhotoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl transition-all shadow-xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActivePhotoIndex(prev => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl transition-all shadow-xl"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Photo Element */}
            <img
              src={currentLightboxPhoto.url}
              alt={currentLightboxPhoto.title}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Right Metadata Side Panel */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Header Title & Category */}
              <div>
                <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-[11px] font-semibold">
                  {currentLightboxPhoto.album}
                </span>
                <h2 className="text-xl font-bold font-serif text-white mt-2">
                  {currentLightboxPhoto.title}
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {currentLightboxPhoto.description}
                </p>
              </div>

              {/* Photo Stats & Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleLikePhoto(currentLightboxPhoto.id)}
                  className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  点赞 ({currentLightboxPhoto.likes})
                </button>
                <a
                  href={currentLightboxPhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs transition-all"
                  title="下载原图"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentLightboxPhoto.url);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs transition-all"
                  title="复制图片链接"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Technical EXIF / Camera Info */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
                <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">图像属性 / Info</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5" /> 创作者:</span>
                  <span>{currentLightboxPhoto.author}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 发布日期:</span>
                  <span>{currentLightboxPhoto.date}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> 建议分辨率:</span>
                  <span>{currentLightboxPhoto.resolution || '3840 x 2160'}</span>
                </div>
                {currentLightboxPhoto.cameraOrInfo && (
                  <div className="pt-2 border-t border-slate-900 text-slate-400">
                    <span className="text-slate-500 flex items-center gap-1 mb-1"><Camera className="w-3.5 h-3.5" /> 设备 / 拍摄信息:</span>
                    <p className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[11px] font-mono leading-relaxed text-slate-300">
                      {currentLightboxPhoto.cameraOrInfo}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags List */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">相册标签 Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentLightboxPhoto.tags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => { setSelectedTag(tag); setActivePhotoIndex(null); }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 text-xs rounded-lg transition-all cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500">
              {config.channelName} • {activePhotoIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW PHOTO MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">新增频道相册图片</h3>
                <p className="text-xs text-slate-400">填入图片链接与属性并保存至频道相册</p>
              </div>
            </div>

            <form onSubmit={handleCreatePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">图片标题 Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="输入相册照片标题"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">图片 URL 地址 Image URL *</label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">归属相册 Album</label>
                  <select
                    value={formAlbum}
                    onChange={(e) => setFormAlbum(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="风光摄影">风光摄影</option>
                    <option value="视觉艺术">视觉艺术</option>
                    <option value="壁纸素材">壁纸素材</option>
                    <option value="频道活动">频道活动</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">标签 Tags (逗号分隔)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Nature, Sunset, Travel"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">设备 / 参数 Camera Info</label>
                <input
                  type="text"
                  value={formCamera}
                  onChange={(e) => setFormCamera(e.target.value)}
                  placeholder="Canon EOS R5, 35mm f/1.8"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">详细描述 Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="简短描述这幅照片背后的故事..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[60px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  保存并发布到相册
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CHANNEL SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">频道信息与外观设置</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">频道名称 Channel Name *</label>
                <input
                  type="text"
                  required
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">频道简介 Bio</label>
                <textarea
                  value={editChannelBio}
                  onChange={(e) => setEditChannelBio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">顶部 Banner 图片 URL</label>
                <input
                  type="url"
                  value={editBannerUrl}
                  onChange={(e) => setEditBannerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">频道头像 Avatar URL</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  保存频道配置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{config.channelName} • Channel Photo Gallery</span>
          <span className="text-[11px] text-slate-500">支持 GitHub / Cloud Run 单端口快速拉取部署</span>
        </div>
      </footer>
    </div>
  );
}
