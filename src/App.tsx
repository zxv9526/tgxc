import React, { useState, useEffect, useCallback } from 'react';
import { Download, AlertCircle, Loader2, X, Play, Pause, ChevronUp } from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  formatImageUrl,
  TelegramPhoto
} from './utils/telegram';

// Subcomponent to render each image with smooth fade-in and loading state
function ScrollableImage({
  photo,
  onClick
}: {
  photo: TelegramPhoto;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group relative w-full bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex items-center justify-center min-h-[250px] shadow-lg shadow-black/40"
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400/60" />
        </div>
      )}
      <img
        src={formatImageUrl(photo.url)}
        alt="Telegram Photo"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`max-h-[85vh] w-auto max-w-full object-contain group-hover:scale-[1.01] transition-all duration-500 rounded-lg ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
      
      {/* Dynamic Hover Indicator */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-xs text-white/90 bg-slate-950/80 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-sm tracking-wider font-medium">
          点击放大图片
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Use strictly amlhmfzl channel
  const channelHandle = 'amlhmfzl';

  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & State
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');

  // Auto-scrolling state
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(0.5); // pixels per frame normalized
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Lightbox magnification state
  const [activePhoto, setActivePhoto] = useState<TelegramPhoto | null>(null);

  // Sync / fetch photos automatically on load
  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    let fetchedPhotos: TelegramPhoto[] = [];

    // 1. Try Express backend endpoint
    try {
      const res = await fetch(`/api/telegram/sync?channel=${encodeURIComponent(channelHandle)}`);
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          fetchedPhotos = data.photos;
        }
      }
    } catch (err) {
      console.warn('Backend endpoint error:', err);
    }

    // 2. Client fallback parser
    if (fetchedPhotos.length === 0) {
      try {
        const clientData = await fetchTelegramChannelFromClient(channelHandle);
        if (clientData && clientData.photos.length > 0) {
          fetchedPhotos = clientData.photos;
        }
      } catch (err) {
        console.warn('Client parser error:', err);
      }
    }

    if (fetchedPhotos.length > 0) {
      setPhotos(fetchedPhotos);
    } else {
      setErrorMsg('未能在公开频道中获取到照片，请稍后刷新重试。');
    }

    setIsLoading(false);
  }, [channelHandle]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Back to top scroll visibility listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Premium Auto-Scroller Engine via requestAnimationFrame
  useEffect(() => {
    if (!isAutoScrolling) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Base: at 60fps (16.67ms frame time), scroll pixels equal scrollSpeed.
      const pixelsToScroll = scrollSpeed * (delta / 16.666);
      window.scrollBy(0, pixelsToScroll);

      // Stop if reached the end of the scroll container
      const scrollHeight = document.documentElement.scrollHeight;
      const currentScroll = window.scrollY + window.innerHeight;
      if (currentScroll >= scrollHeight - 3) {
        setIsAutoScrolling(false);
        return;
      }

      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Dynamic interrupt: pause auto-scrolling if user interacts with wheel, touch, drag
  useEffect(() => {
    if (!isAutoScrolling) return;

    const handleUserInteraction = () => {
      setIsAutoScrolling(false);
    };

    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isAutoScrolling]);

  // Handle direct file download for the magnified active image
  const handleDownload = async (photo: TelegramPhoto) => {
    const targetUrl = formatImageUrl(photo.url);

    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `telegram-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Direct window download fallback
      const downloadUrl = targetUrl.includes('?') 
        ? `${targetUrl}&download=1` 
        : `${targetUrl}?download=1`;
      window.open(downloadUrl, '_blank');
    }
  };

  const getActiveImageSrc = () => {
    if (!activePhoto) return '';
    return formatImageUrl(activePhoto.url);
  };

  // Helper to format today's date in browser local time
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();
  const hasTodayPhotos = photos.some(p => p.date === todayString);
  const latestDateInChannel = photos.length > 0 
    ? photos.reduce((max, p) => p.date > max ? p.date : max, photos[0].date) 
    : '';
  const targetDateString = hasTodayPhotos ? todayString : latestDateInChannel;

  // Filter photos based on selection mode
  const filteredPhotos = filterMode === 'today'
    ? photos.filter(p => p.date === targetDateString)
    : photos;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-2 sm:p-6 select-none font-sans">
      
      {/* Main Content Area - No Header */}
      <main className="w-full max-w-4xl flex flex-col gap-6 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs">加载图片中...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center text-rose-300 bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs max-w-md">{errorMsg}</p>
            <button
              onClick={loadPhotos}
              className="mt-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium cursor-pointer border border-slate-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Elegant Sub-navigation Filter Bar */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterMode('today')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                    filterMode === 'today'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-900'
                  }`}
                >
                  {hasTodayPhotos ? '今日图片' : '最新更新'}
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-900'
                  }`}
                >
                  全部历史 ({photos.length})
                </button>
              </div>

              {/* Dynamic Info Status Badge */}
              <div className="text-xs text-slate-400 bg-slate-900/40 px-3.5 py-2 rounded-xl border border-slate-900">
                {filterMode === 'today' ? (
                  <span>
                    日期: <strong className="text-sky-400">{targetDateString}</strong> ({filteredPhotos.length} 张)
                  </span>
                ) : (
                  <span>
                    共包含 <strong className="text-sky-400">{photos.length}</strong> 张图片
                  </span>
                )}
              </div>
            </div>

            {/* Main Image Grid / List */}
            <div className="flex flex-col gap-6">
              {filteredPhotos.map((photo, index) => (
                <ScrollableImage
                  key={photo.id || index}
                  photo={photo}
                  onClick={() => {
                    setActivePhoto(photo);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Auto-Scroll & Back-to-Top Control Panel */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2.5 items-end">
        {/* Go to Top Button (only visible if scrolled down) */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 bg-slate-900/95 hover:bg-slate-800 active:bg-slate-950 text-sky-400 rounded-full border border-slate-800 shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm"
            title="回到顶部"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Auto scroll control pill */}
        {!isLoading && !errorMsg && filteredPhotos.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-800 p-2 rounded-2xl shadow-2xl backdrop-blur-sm">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAutoScrolling
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isAutoScrolling ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>滚动中</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>自动滚动</span>
                </>
              )}
            </button>

            {/* Speed Controls */}
            <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-900">
              {[
                { label: '慢', value: 0.3 },
                { label: '中', value: 0.75 },
                { label: '快', value: 1.5 }
              ].map((speed) => (
                <button
                  key={speed.value}
                  onClick={() => setScrollSpeed(speed.value)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    scrollSpeed === speed.value
                      ? 'bg-sky-500/20 text-sky-400 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Magnification Fullscreen Modal (Visible only after clicking an image) */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          {/* Close button */}
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 z-50 p-3 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full border border-slate-800 transition-colors cursor-pointer shadow-lg"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Expanded Image Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center max-w-5xl w-full max-h-[90vh] bg-transparent"
          >
            <img
              src={getActiveImageSrc()}
              alt="Magnified Original"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* Downloader Button (Only appears below magnified image) */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handleDownload(activePhoto)}
                className="px-8 py-3 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-sm sm:text-base rounded-xl flex items-center gap-2 shadow-xl shadow-sky-500/20 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>下载原图</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
