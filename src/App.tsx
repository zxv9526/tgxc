import { useState, useEffect, useMemo, useCallback } from 'react';
import { TelegramPhoto } from './types';
import { Header } from './components/Header';
import { PhotoCard } from './components/PhotoCard';
import { LightboxModal } from './components/LightboxModal';
import { ImageOff, RefreshCw } from 'lucide-react';

const TWENTY_FIVE_HOURS_MS = 25 * 60 * 60 * 1000;

export function App() {
  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [channelName, setChannelName] = useState('Telegram 频道图集');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<TelegramPhoto | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        if (data.photos) setPhotos(data.photos);
        if (data.channelName) setChannelName(data.channelName);
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await fetchPhotos();
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter photos from past 25 hours
  const displayedPhotos = useMemo(() => {
    const cutoff = Date.now() - TWENTY_FIVE_HOURS_MS;
    return photos.filter(p => {
      let ts = p.timestamp;
      if (!ts || ts <= 0) {
        if (p.date) {
          const parsed = new Date(p.date).getTime();
          if (!isNaN(parsed)) ts = parsed;
        }
      }
      return (ts || Date.now()) >= cutoff;
    });
  }, [photos]);

  // Lightbox Navigation
  const activeIndex = useMemo(() => {
    if (!lightboxPhoto) return -1;
    return displayedPhotos.findIndex(p => p.id === lightboxPhoto.id);
  }, [lightboxPhoto, displayedPhotos]);

  const handleNextPhoto = () => {
    if (activeIndex >= 0 && activeIndex < displayedPhotos.length - 1) {
      setLightboxPhoto(displayedPhotos[activeIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (activeIndex > 0) {
      setLightboxPhoto(displayedPhotos[activeIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col antialiased">
      {/* Top Header */}
      <Header
        channelName={channelName}
        photoCount={displayedPhotos.length}
        isSyncing={isSyncing}
        onRefresh={handleRefresh}
      />

      {/* Main Picture Stream */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {displayedPhotos.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
              <ImageOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-200">
                近 25 小时内频道暂无新推送图片
              </h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                频道在过去 25 小时内未更新图片。点击下方刷新按钮可手动拉取 Telegram 最新内容。
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="mt-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '同步中...' : '刷新频道动态'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onOpenLightbox={(p) => setLightboxPhoto(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      <LightboxModal
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
        hasNext={activeIndex >= 0 && activeIndex < displayedPhotos.length - 1}
        hasPrev={activeIndex > 0}
      />
    </div>
  );
}

export default App;
