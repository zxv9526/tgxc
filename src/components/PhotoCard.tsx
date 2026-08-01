import React, { useState, useEffect } from 'react';
import { Download, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { TelegramPhoto } from '../types';

interface PhotoCardProps {
  photo: TelegramPhoto;
  onOpenLightbox: (photo: TelegramPhoto) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onOpenLightbox }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');

  useEffect(() => {
    setImageLoaded(false);
    setRetryCount(0);
    setImageError(false);
  }, [photo.id, photo.url]);

  const getProxyUrl = (url: string, retry: number) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.includes('images.unsplash.com')) return url;
    
    let target = url;
    if (url.startsWith('/api/proxy-image')) {
      return retry > 0 ? `${url}&_r=${retry}` : url;
    }
    
    if (url.startsWith('http')) {
      const encoded = encodeURIComponent(url);
      return `/api/proxy-image?url=${encoded}${retry > 0 ? `&_r=${retry}` : ''}`;
    }
    return url;
  };

  const imageSrc = getProxyUrl(photo.url, retryCount);

  const handleImgError = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  const downloadUrl = photo.url.startsWith('http') && !photo.url.includes('images.unsplash.com')
    ? `/api/proxy-image?url=${encodeURIComponent(photo.url)}&download=1`
    : photo.url;

  return (
    <div
      onClick={() => onOpenLightbox(photo)}
      className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col"
    >
      {/* Photo Container: Clean dark background with object-contain so full image is visible without top/bottom cropping */}
      <div className="relative overflow-hidden bg-slate-950 w-full min-h-[240px] max-h-[380px] h-[300px] flex items-center justify-center p-1">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-slate-500 text-xs gap-1">
            <span>图片加载失败</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImageError(false);
                setRetryCount(0);
              }}
              className="mt-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={photo.title || 'Telegram Photo'}
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={handleImgError}
            className={`w-full h-full ${
              fitMode === 'contain' ? 'object-contain' : 'object-cover'
            } transition-all duration-300 group-hover:scale-[1.02]`}
          />
        )}

        {photo.date && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-md flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {photo.date}
            </span>
          </div>
        )}

        {/* Action Controls Overlay */}
        <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFitMode(fitMode === 'contain' ? 'cover' : 'contain');
            }}
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-transform active:scale-95"
            title={fitMode === 'contain' ? '切换填满显示' : '切换完整适应'}
          >
            {fitMode === 'contain' ? (
              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>

          <a
            href={downloadUrl}
            download={`photo-${photo.id}.jpg`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-transform active:scale-95"
            title="下载原图"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
          </a>
        </div>
      </div>

      {(photo.title || photo.description) && (
        <div className="p-3.5 space-y-1 bg-slate-900/40 border-t border-slate-800/50">
          {photo.title && (
            <h3 className="text-xs font-bold text-slate-200 line-clamp-1">
              {photo.title}
            </h3>
          )}
          {photo.description && (
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {photo.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};


