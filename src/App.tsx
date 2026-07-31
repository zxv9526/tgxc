import React, { useState, useEffect, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
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

  // Sync / fetch photos from Telegram
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
      setErrorMsg(`未能在 @${channelHandle} 频道解析到图片，请确认频道为公开 Telegram 频道且近期发布过图片。`);
    }

    setIsLoading(false);
  }, [channelHandle]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const prevPhoto = () => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const nextPhoto = () => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Photo Frame Container */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Frame Canvas */}
        <div className="relative aspect-4/3 sm:aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-xs">正在载入 @{channelHandle} 频道的图片...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-rose-300">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-xs max-w-md">{errorMsg}</p>
              <button
                onClick={loadPhotos}
                className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer border border-slate-700 transition-colors"
              >
                重新加载
              </button>
            </div>
          ) : currentPhoto ? (
            <>
              <img
                src={formatImageUrl(currentPhoto.url)}
                alt={currentPhoto.title || 'Telegram Channel Photo'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />

              {/* Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700/80 transition-colors cursor-pointer backdrop-blur-md"
                    title="上一张"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700/80 transition-colors cursor-pointer backdrop-blur-md"
                    title="下一张"
                  >
                    <ChevronRight className="w-5 h-5" />
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

        {/* Action Footer - Only Download Button */}
        {currentPhoto && (
          <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-mono">
              @{channelHandle}
            </p>

            <a
              href={formatImageUrl(currentPhoto.url)}
              download={`telegram-${channelHandle}-${currentIndex + 1}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>下载原图</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
