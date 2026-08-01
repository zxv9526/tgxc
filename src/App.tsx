import { useState, useEffect, useMemo, useCallback } from 'react';
import { TelegramPhoto, FilterMode } from './types';
import { Header } from './components/Header';
import { PhotoCard } from './components/PhotoCard';
import { LightboxModal } from './components/LightboxModal';
import { ImageOff, RefreshCw } from 'lucide-react';

export function App() {
  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [channelName, setChannelName] = useState('Telegram 频道图集');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<TelegramPhoto | null>(null);

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

  // Filter photos for Beijing Time TODAY
  const todayPhotos = useMemo(() => {
    return photos.filter(p => {
      return p.date === todayString || (p.timestamp && p.timestamp >= beijingTodayMidnightTimestamp);
    });
  }, [photos, todayString, beijingTodayMidnightTimestamp]);

  const displayedPhotos = useMemo(() => {
    return filterMode === 'today' ? todayPhotos : photos;
  }, [filterMode, todayPhotos, photos]);

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
      {/* Clean Top Header */}
      <Header
        channelName={channelName}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        todayCount={todayPhotos.length}
        totalCount={photos.length}
        isSyncing={isSyncing}
        onRefresh={handleRefresh}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {displayedPhotos.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
              <ImageOff className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-200">
                {filterMode === 'today' ? `今日（${todayString}）暂无新推送图片` : '暂无图片'}
              </h2>
              <p className="text-xs text-slate-400 max-w-md">
                {filterMode === 'today'
                  ? '按照北京时间计算，频道在今日尚未推送新图片。您可以点击下方按钮查看历史全部图片。'
                  : '频道暂未同步到图片数据。'}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              {filterMode === 'today' && photos.length > 0 && (
                <button
                  onClick={() => setFilterMode('all')}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  查看历史全部图片 ({photos.length} 张)
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isSyncing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>刷新监测</span>
              </button>
            </div>
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
