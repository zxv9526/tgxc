import React, { useState, useEffect } from 'react';
import { Download, Calendar } from 'lucide-react';
import { TelegramPhoto } from '../types';

interface PhotoCardProps {
  photo: TelegramPhoto;
  onOpenLightbox: (photo: TelegramPhoto) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onOpenLightbox }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallbackDirect, setUseFallbackDirect] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setUseFallbackDirect(false);
    setImageError(false);
  }, [photo.id, photo.url]);

  const getProxyUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/api/proxy-image')) return url;
    if (url.includes('images.unsplash.com') || url.startsWith('data:')) return url;
    if (url.startsWith('http')) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const imageSrc = useFallbackDirect ? photo.url : getProxyUrl(photo.url);

  const handleImgError = () => {
    if (!useFallbackDirect && photo.url && photo.url.startsWith('http')) {
      setUseFallbackDirect(true);
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
      <div className="relative overflow-hidden bg-slate-950 w-full aspect-[16/10]">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-slate-900 text-slate-500 text-xs">
            图片加载失败
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={photo.title || 'Telegram Photo'}
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={handleImgError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {photo.date && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-md flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {photo.date}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3 z-20">
          <a
            href={downloadUrl}
            download={`photo-${photo.id}.jpg`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 backdrop-blur-md transition-transform active:scale-95"
            title="下载原图"
          >
            <Download className="w-4 h-4 text-sky-400" />
          </a>
        </div>
      </div>

      {(photo.title || photo.description) && (
        <div className="p-3.5 space-y-1">
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

