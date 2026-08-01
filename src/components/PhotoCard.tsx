import React, { useState } from 'react';
import { Eye, Heart, Download, Sparkles, Wand2, Tag, Calendar, Layers } from 'lucide-react';
import { TelegramPhoto, LayoutMode } from '../types';

interface PhotoCardProps {
  photo: TelegramPhoto;
  layoutMode: LayoutMode;
  onOpenLightbox: (photo: TelegramPhoto) => void;
  onOpenPromptModal: (photo: TelegramPhoto) => void;
  onOpenWatermarkModal: (photo: TelegramPhoto) => void;
  onLike: (photo: TelegramPhoto, e: React.MouseEvent) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  layoutMode,
  onOpenLightbox,
  onOpenPromptModal,
  onOpenWatermarkModal,
  onLike,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(photo.url)}`;

  return (
    <div
      onClick={() => onOpenLightbox(photo)}
      className={`group relative bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/5 cursor-pointer flex flex-col ${
        layoutMode === 'list' ? 'sm:flex-row' : ''
      }`}
    >
      {/* Image Container */}
      <div
        className={`relative overflow-hidden bg-slate-950 ${
          layoutMode === 'list' ? 'sm:w-1/2 aspect-[16/10]' : 'w-full aspect-[16/10]'
        }`}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-slate-500 gap-2">
            <p className="text-xs font-semibold text-slate-400">资源链接加载异常</p>
            <p className="text-[10px] break-all max-w-xs">{photo.title}</p>
          </div>
        ) : (
          <img
            src={proxyUrl}
            alt={photo.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-950/80 text-sky-400 border border-sky-500/20 backdrop-blur-md shadow-lg flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {photo.album}
          </span>
          {photo.date && (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-md shadow-lg flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {photo.date}
            </span>
          )}
        </div>

        {/* Hover Quick Action Toolbar */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPromptModal(photo);
            }}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/30 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 提示词</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWatermarkModal(photo);
              }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 backdrop-blur-md transition-transform active:scale-95 cursor-pointer"
              title="添加自定义水印"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <a
              href={`/api/proxy-image?url=${encodeURIComponent(photo.url)}&download=1`}
              download={`photo-${photo.id}.jpg`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 backdrop-blur-md transition-transform active:scale-95"
              title="一键下载原图"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Details Container */}
      <div className={`p-5 flex-1 flex flex-col justify-between gap-4 ${layoutMode === 'list' ? 'sm:w-1/2' : ''}`}>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 transition-colors line-clamp-1">
            {photo.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {photo.description}
          </p>
        </div>

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {photo.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-950 text-slate-400 border border-slate-800">
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer info & Likes */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-slate-500 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              {photo.views}
            </span>
            <button
              onClick={(e) => onLike(photo, e)}
              className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>{photo.likes}</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            ID: #{photo.messageId || photo.id.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
};
