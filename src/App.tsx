import React, { useState, useEffect, useCallback } from 'react';
import { Download, AlertCircle, Loader2, X } from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  formatImageUrl,
  TelegramPhoto
} from './utils/telegram';

// Subcomponent to render each image with self-contained proxy-error fallback
function ScrollableImage({
  photo,
  onClick
}: {
  photo: TelegramPhoto;
  onClick: () => void;
}) {
  const [failed, setFailed] = useState<boolean>(false);

  const getSrc = () => {
    const rawUrl = photo.url;
    if (failed && rawUrl.includes('/api/proxy-image?url=')) {
      // Decode and return original CDN URL directly if proxy failed
      return decodeURIComponent(rawUrl.split('/api/proxy-image?url=')[1]);
    }
    return formatImageUrl(rawUrl);
  };

  return (
    <div
      onClick={onClick}
      className="group relative w-full bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex items-center justify-center min-h-[250px] shadow-lg shadow-black/40"
    >
      <img
        src={getSrc()}
        alt="Telegram Photo"
        referrerPolicy="no-referrer"
        onError={() => {
          if (!failed) {
            setFailed(true);
          }
        }}
        className="max-h-[80vh] w-auto max-w-full object-contain group-hover:scale-[1.01] transition-transform duration-300 rounded-lg"
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
  const [channelHandle] = useState<string>(() => {
    return cleanChannelHandle(localStorage.getItem('tg_channel_handle') || 'amlhmfzl');
  });

  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lightbox magnification state
  const [activePhoto, setActivePhoto] = useState<TelegramPhoto | null>(null);
  const [activePhotoFailed, setActivePhotoFailed] = useState<boolean>(false);

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
    const rawUrl = activePhoto.url;
    if (activePhotoFailed && rawUrl.includes('/api/proxy-image?url=')) {
      return decodeURIComponent(rawUrl.split('/api/proxy-image?url=')[1]);
    }
    return formatImageUrl(rawUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-8 select-none font-sans">
      
      {/* Subtle Mini Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-6 px-1">
        <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">
          Telegram 频道图库
        </span>
        <span className="text-xs text-sky-400 font-mono font-semibold">
          @{channelHandle}
        </span>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex flex-col gap-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs">加载公开频道图片中...</p>
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
            {photos.map((photo, index) => (
              <ScrollableImage
                key={photo.id || index}
                photo={photo}
                onClick={() => {
                  setActivePhoto(photo);
                  setActivePhotoFailed(false);
                }}
              />
            ))}
          </div>
        )}
      </main>

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
              referrerPolicy="no-referrer"
              onError={() => {
                if (!activePhotoFailed) {
                  setActivePhotoFailed(true);
                }
              }}
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
