import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { TelegramPhoto } from '../types';

interface LightboxModalProps {
  photo: TelegramPhoto | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photo,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, hasNext, hasPrev, onNext, onPrev, onClose]);

  if (!photo) return null;

  const displayUrl = photo.url.startsWith('/api/proxy-image') || photo.url.includes('images.unsplash.com')
    ? photo.url
    : `/api/proxy-image?url=${encodeURIComponent(photo.url)}`;

  const downloadUrl = photo.url.startsWith('http') && !photo.url.includes('images.unsplash.com')
    ? `/api/proxy-image?url=${encodeURIComponent(photo.url)}&download=1`
    : photo.url;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      {/* Top Bar Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <a
          href={downloadUrl}
          download={`photo-${photo.id}.jpg`}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
          title="下载原图"
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">下载原图</span>
        </a>

        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prev / Next buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-50 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-transform active:scale-90 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 z-50 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-transform active:scale-90 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Container */}
      <div className="max-w-5xl max-h-[90vh] flex flex-col items-center justify-center p-2 relative">
        <img
          src={displayUrl}
          alt={photo.title || 'Telegram Photo'}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800/50"
        />

        {(photo.title || photo.description || photo.date) && (
          <div className="mt-4 text-center max-w-xl space-y-1">
            {photo.title && (
              <h3 className="text-sm font-bold text-white">{photo.title}</h3>
            )}
            {photo.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{photo.description}</p>
            )}
            {photo.date && (
              <p className="text-[10px] text-slate-500 font-mono">{photo.date}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
