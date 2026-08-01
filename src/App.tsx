import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TelegramPhoto, ChannelConfig, FilterMode, LayoutMode } from './types';
import { Header } from './components/Header';
import { ChannelConfigBar } from './components/ChannelConfigBar';
import { FilterBar } from './components/FilterBar';
import { PhotoCard } from './components/PhotoCard';
import { LightboxModal } from './components/LightboxModal';
import { PromptModal } from './components/PromptModal';
import { WatermarkModal } from './components/WatermarkModal';
import { UploadModal } from './components/UploadModal';
import { EmptyTodayState } from './components/EmptyTodayState';

export function App() {
  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>(['All']);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig>({
    channelName: 'Telegram 官方频道图集',
    channelBio: 'Telegram 官方频道图集与精选摄影相册库。支持分类筛选、极速巡览与自动同步。',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    totalMembers: '12,450 关注',
    handle: 'amlhmfzl'
  });

  const [targetInput, setTargetInput] = useState('amlhmfzl');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('All');
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Modals
  const [lightboxPhoto, setLightboxPhoto] = useState<TelegramPhoto | null>(null);
  const [promptModalPhoto, setPromptModalPhoto] = useState<TelegramPhoto | null>(null);
  const [watermarkModalPhoto, setWatermarkModalPhoto] = useState<TelegramPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate current Beijing Time today date string (YYYY-MM-DD)
  const todayString = useMemo(() => {
    try {
      const d = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      if (year && month && day) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Error calculating Beijing today date string:', e);
    }
    return new Date().toISOString().split('T')[0];
  }, []);

  // Calculate midnight timestamp for today in Beijing Time
  const beijingTodayMidnightTimestamp = useMemo(() => {
    const d = new Date();
    const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
    const tzOffsetMs = 8 * 3600000; // Asia/Shanghai UTC+8
    const localTime = utcTime + tzOffsetMs;
    const msInDay = 24 * 3600000;
    return Math.floor(localTime / msInDay) * msInDay - tzOffsetMs;
  }, []);

  // Fetch photos & channel info from server
  const fetchPhotos = useCallback(async (channelHandle?: string) => {
    try {
      const url = channelHandle
        ? `/api/photos?channel=${encodeURIComponent(channelHandle)}`
        : '/api/photos';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.photos) setPhotos(data.photos);
        if (data.albums) setAlbums(data.albums);
        if (data.info) {
          setChannelConfig(data.info);
          setTargetInput(data.info.handle || 'amlhmfzl');
        }
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Handle Channel Deep Sync
  const handleSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncSuccessMsg(null);

    try {
      const handleToSync = targetInput.trim() || channelConfig.handle || 'amlhmfzl';
      const res = await fetch('/api/telegram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: handleToSync })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photos) setPhotos(data.photos);
        if (data.info) {
          setChannelConfig(data.info);
          setTargetInput(data.info.handle);
        }
        setSyncSuccessMsg(`成功解析 @${data.handle} 频道，共同步 ${data.photosCount || 0} 张最新图片素材`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to sync TG channel:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter photos for Beijing Time TODAY
  const todayPhotos = useMemo(() => {
    return photos.filter(p => {
      return p.date === todayString || (p.timestamp && p.timestamp >= beijingTodayMidnightTimestamp);
    });
  }, [photos, todayString, beijingTodayMidnightTimestamp]);

  // Compute processed and filtered photo stream
  const processedPhotos = useMemo(() => {
    let result = filterMode === 'today' ? [...todayPhotos] : [...photos];

    if (selectedAlbum !== 'All') {
      result = result.filter(p => p.album === selectedAlbum);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort order: newest first by messageId / timestamp
    result.sort((a, b) => {
      const aId = parseInt(a.messageId || '0', 10);
      const bId = parseInt(b.messageId || '0', 10);
      if (aId && bId && aId !== bId) return bId - aId;
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      return bTime - aTime;
    });

    return result;
  }, [photos, todayPhotos, filterMode, selectedAlbum, searchQuery]);

  // Lightbox Navigation
  const activePhotoIndex = useMemo(() => {
    if (!lightboxPhoto) return -1;
    return processedPhotos.findIndex(p => p.id === lightboxPhoto.id);
  }, [lightboxPhoto, processedPhotos]);

  const handleNextPhoto = () => {
    if (activePhotoIndex >= 0 && activePhotoIndex < processedPhotos.length - 1) {
      setLightboxPhoto(processedPhotos[activePhotoIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIndex > 0) {
      setLightboxPhoto(processedPhotos[activePhotoIndex - 1]);
    }
  };

  // Like photo
  const handleLike = async (photo: TelegramPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/photos/${photo.id}/like`, { method: 'POST' });
      if (res.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, likes: p.likes + 1 } : p));
        if (lightboxPhoto && lightboxPhoto.id === photo.id) {
          setLightboxPhoto(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        }
      }
    } catch (err) {
      console.error('Failed to like photo:', err);
    }
  };

  // Add custom photo
  const handleAddPhoto = async (newPhotoData: any) => {
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPhotoData)
    });
    if (res.ok) {
      fetchPhotos();
    }
  };

  const handleCopyLink = () => {
    if (!lightboxPhoto) return;
    navigator.clipboard.writeText(lightboxPhoto.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col antialiased">
      {/* Navbar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        channelConfig={channelConfig}
        isSyncing={isSyncing}
        onManualSync={() => handleSync()}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Channel Banner & Config Bar */}
        <ChannelConfigBar
          channelConfig={channelConfig}
          targetInput={targetInput}
          setTargetInput={setTargetInput}
          isSyncing={isSyncing}
          syncSuccessMsg={syncSuccessMsg}
          onSync={handleSync}
        />

        {/* Filters & Stream Controls */}
        <FilterBar
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          selectedAlbum={selectedAlbum}
          setSelectedAlbum={setSelectedAlbum}
          albums={albums}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          todayPhotosCount={todayPhotos.length}
          totalPhotosCount={photos.length}
          todayString={todayString}
          isSyncing={isSyncing}
          onManualSync={() => handleSync()}
        />

        {/* Gallery Grid or Empty State */}
        {processedPhotos.length === 0 ? (
          filterMode === 'today' ? (
            <EmptyTodayState
              todayString={todayString}
              isSyncing={isSyncing}
              onManualSync={() => handleSync()}
              hasTotalPhotos={photos.length > 0}
              totalPhotosCount={photos.length}
              onShowAll={() => setFilterMode('all')}
            />
          ) : (
            <div className="py-20 text-center text-slate-500 bg-slate-900/20 border border-slate-900 rounded-3xl">
              暂未找到符合条件的历史图片素材
            </div>
          )
        ) : (
          <div className={layoutMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-6'}>
            {processedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                layoutMode={layoutMode}
                onOpenLightbox={(p) => setLightboxPhoto(p)}
                onOpenPromptModal={(p) => setPromptModalPhoto(p)}
                onOpenWatermarkModal={(p) => setWatermarkModalPhoto(p)}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-12">
        <p>Telegram Deep Gallery & AI Prompt Studio · 北京时间每日整天多维同步相册</p>
      </footer>

      {/* Lightbox Modal */}
      <LightboxModal
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
        hasNext={activePhotoIndex >= 0 && activePhotoIndex < processedPhotos.length - 1}
        hasPrev={activePhotoIndex > 0}
        onOpenPromptModal={(p) => setPromptModalPhoto(p)}
        onOpenWatermarkModal={(p) => setWatermarkModalPhoto(p)}
        onLike={handleLike}
        copiedLink={copiedLink}
        onCopyLink={handleCopyLink}
      />

      {/* Prompt Modal */}
      <PromptModal
        photo={promptModalPhoto}
        onClose={() => setPromptModalPhoto(null)}
      />

      {/* Watermark Modal */}
      <WatermarkModal
        photo={watermarkModalPhoto}
        onClose={() => setWatermarkModalPhoto(null)}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddPhoto={handleAddPhoto}
      />
    </div>
  );
}

export default App;
