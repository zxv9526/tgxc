import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Heart, Download, Sparkles, Wand2, Copy, Check, ExternalLink } from 'lucide-react';
import { TelegramPhoto } from '../types';

interface LightboxModalProps {
  photo: TelegramPhoto | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onOpenPromptModal: (photo: TelegramPhoto) => void;
  onOpenWatermarkModal: (photo: TelegramPhoto) => void;
  onLike: (photo: TelegramPhoto, e: React.MouseEvent) => void;
  copiedLink: boolean;
  onCopyLink: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photo,
  onClose,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  onOpenPromptModal,
  onOpenWatermarkModal,
  onLike,
  copiedLink,
  onCopyLink,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, hasPrev, hasNext, onClose, onPrev, onNext]);

  if (!photo) return null;

  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(photo.url)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 animate-fade-in">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-2xl hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-2xl hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Content Modal Container */}
      <div className="w-full max-w-6xl max-h-[92vh] bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Left Side Image Display */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative min-h-[300px] max-h-[70vh] md:max-h-none overflow-hidden p-4">
          <img
            src={proxyUrl}
            alt={photo.title}
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        </div>

        {/* Right Side Sidebar Details */}
        <div className="w-full md:w-96 p-6 flex flex-col justify-between gap-6 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/80 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20 inline-block mb-2">
                {photo.album}
              </span>
              <h2 className="text-lg font-bold text-white leading-snug">{photo.title}</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{photo.description}</p>
            </div>

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {photo.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 text-slate-300 border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Photo Metadata */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>发布日期</span>
                <span className="font-semibold text-slate-200">{photo.date || '今日更新'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>消息 ID</span>
                <span className="font-mono text-slate-300">#{photo.messageId || photo.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>热度指标</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {photo.views}</span>
                  <span className="flex items-center gap-1 text-rose-400"><Heart className="w-3.5 h-3.5 fill-rose-500/20" /> {photo.likes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => onOpenPromptModal(photo)}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>生成 AI 绘图 Prompt 提示词</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenWatermarkModal(photo)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>制作水印</span>
              </button>

              <button
                onClick={onCopyLink}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '已复制' : '复制链接'}</span>
              </button>
            </div>

            <a
              href={`/api/proxy-image?url=${encodeURIComponent(photo.url)}&download=1`}
              download={`photo-${photo.id}.jpg`}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-200 font-bold text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>下载原图</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
