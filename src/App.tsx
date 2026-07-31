import React, { useState, useEffect, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  formatImageUrl,
  TelegramPhoto
} from './utils/telegram';

export default function App() {
  const [channelHandle] = useState<string>(() => {
    return cleanChannelHandle(localStorage.getItem('tg_channel_handle') || 'amlhmfzl');
  });

  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

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
      setCurrentIndex(0);
    } else {
      setErrorMsg('未能在公开频道中获取到照片，请稍后刷新重试。');
    }

    setIsLoading(false);
  }, [channelHandle]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Keyboard arrow keys navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos]);

  const prevPhoto = () => {
    if (photos.length === 0) return;
    setImageFailed(false);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const nextPhoto = () => {
    if (photos.length === 0) return;
    setImageFailed(false);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const currentPhoto = photos[currentIndex];

  // Helper to trigger direct file download
  const handleDownload = async () => {
    if (!currentPhoto) return;
    const targetUrl = formatImageUrl(currentPhoto.url);

    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `photo-${currentIndex + 1}.jpg`;
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

  // Get current image source with fallback option
  const getImageSrc = () => {
    if (!currentPhoto) return '';
    const rawUrl = currentPhoto.url;
    if (imageFailed && rawUrl.includes('/api/proxy-image?url=')) {
      // Extract original URL if proxy failed
      return decodeURIComponent(rawUrl.split('/api/proxy-image?url=')[1]);
    }
    return formatImageUrl(rawUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 select-none">
      {/* Minimal Photo Frame */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Frame Canvas */}
        <div className="relative aspect-4/3 sm:aspect-16/10 min-h-[320px] bg-slate-950 flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-xs">加载原图... </p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-rose-300">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-xs max-w-md">{errorMsg}</p>
              <button
                onClick={loadPhotos}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium cursor-pointer border border-slate-700 transition-colors"
              >
                重试
              </button>
            </div>
          ) : currentPhoto ? (
            <>
              <img
                src={getImageSrc()}
                alt="Photo"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (!imageFailed) {
                    setImageFailed(true);
                  }
                }}
                className="w-full h-full object-contain"
              />

              {/* Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700/80 transition-colors cursor-pointer backdrop-blur-md"
                    title="上一张"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700/80 transition-colors cursor-pointer backdrop-blur-md"
                    title="下一张"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter Badge */}
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-xs font-mono text-slate-300">
                {currentIndex + 1} / {photos.length}
              </div>
            </>
          ) : null}
        </div>

        {/* Action Footer - Download Button Only */}
        {currentPhoto && (
          <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex items-center justify-center">
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>下载原图</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
