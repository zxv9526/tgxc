import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Image as ImageIcon } from 'lucide-react';

export interface LightboxImageItem {
  url: string;
  title?: string;
  description?: string;
  date?: string;
}

interface LightboxModalProps {
  images: LightboxImageItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const [fallbackRawMap, setFallbackRawMap] = useState<Record<string, boolean>>({});

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentImage) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImage, hasNext, hasPrev, currentIndex, onNavigate, onClose]);

  if (!currentImage || images.length === 0) return null;

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (fallbackRawMap[url]) return url;
    if (url.startsWith('data:') || url.includes('images.unsplash.com') || url.startsWith('/api/proxy-image')) return url;
    if (url.startsWith('http')) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    return url;
  };

  const handleImageError = (url: string) => {
    if (!fallbackRawMap[url]) {
      setFallbackRawMap(prev => ({ ...prev, [url]: true }));
    }
  };

  const displayUrl = getImageUrl(currentImage.url);
  const downloadUrl = currentImage.url.startsWith('http') && !currentImage.url.includes('images.unsplash.com')
    ? `/api/proxy-image?url=${encodeURIComponent(currentImage.url)}&download=1`
    : currentImage.url;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 animate-fade-in select-none"
    >
      {/* Top Bar Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        {/* Counter Badge */}
        <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-lg">
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>图片 {currentIndex + 1} / {images.length}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <a
            href={downloadUrl}
            download={`photo-${currentIndex + 1}.jpg`}
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shadow-lg"
            title="下载原图"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">下载原图</span>
          </a>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer shadow-lg"
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev Navigation Arrow Button (Left) */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-slate-900/90 hover:bg-sky-500 hover:text-white text-slate-200 border border-slate-700/80 transition-all shadow-2xl active:scale-95 cursor-pointer group"
          title="上一张图片 (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Next Navigation Arrow Button (Right) */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-4 rounded-full bg-slate-900/90 hover:bg-sky-500 hover:text-white text-slate-200 border border-slate-700/80 transition-all shadow-2xl active:scale-95 cursor-pointer group"
          title="下一张图片 (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Main Image View Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center p-2 relative pointer-events-auto"
      >
        <div className="relative flex items-center justify-center max-h-[75vh]">
          <img
            key={currentImage.url}
            src={displayUrl}
            alt={currentImage.title || 'Telegram Photo'}
            referrerPolicy="no-referrer"
            onError={() => handleImageError(currentImage.url)}
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-slate-800/80 transition-all duration-300"
          />
        </div>

        {(currentImage.title || currentImage.description || currentImage.date) && (
          <div className="mt-4 text-center max-w-xl space-y-1 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
            {currentImage.title && (
              <h3 className="text-sm font-bold text-white leading-snug">{currentImage.title}</h3>
            )}
            {currentImage.description && (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{currentImage.description}</p>
            )}
            {currentImage.date && (
              <p className="text-[10px] text-slate-500 font-mono pt-0.5">{currentImage.date}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
