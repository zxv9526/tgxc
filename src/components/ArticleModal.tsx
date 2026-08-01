import React, { useState } from 'react';
import { X, Calendar, Eye, ExternalLink, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { BlogPost } from '../types';

interface ArticleModalProps {
  post: BlogPost | null;
  allPosts: BlogPost[];
  onClose: () => void;
  onNavigate: (post: BlogPost) => void;
  onOpenImage: (url: string, title: string) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  post,
  allPosts,
  onClose,
  onNavigate,
  onOpenImage,
}) => {
  const [fallbackRawMap, setFallbackRawMap] = useState<Record<string, boolean>>({});

  if (!post) return null;

  const currentIndex = allPosts.findIndex(p => p.id === post.id);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

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

  const lines = post.content ? post.content.split('\n') : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              #{post.messageId}
            </span>
            <h3 className="text-sm font-bold text-slate-200 truncate">
              {post.title || '文章详情'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={post.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="在 Telegram 打开"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Post Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                AM
              </div>
              <span className="font-semibold text-slate-300">{post.author}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {post.views} 阅读
              </span>
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
              {post.title}
            </h1>
          )}

          {/* Photo Gallery Stack */}
          {post.photos.length > 0 && (
            <div className="space-y-4 my-6">
              {post.photos.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenImage(imgUrl, `${post.title} (${idx + 1}/${post.photos.length})`)}
                  className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[500px] flex items-center justify-center cursor-zoom-in"
                >
                  <img
                    src={getImageUrl(imgUrl)}
                    alt={`${post.title} - ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(imgUrl)}
                    className="w-full h-full object-contain max-h-[500px] transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs font-medium border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    图片 {idx + 1} / {post.photos.length} (点击放大)
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Article Text */}
          <div className="space-y-2 text-slate-200 text-base leading-relaxed break-words">
            {lines.map((line, idx) => {
              if (!line.trim()) return <div key={idx} className="h-3" />;
              return (
                <p key={idx} className="min-h-[1.4rem]">
                  {line.split(/(\s+)/).map((token, tIdx) => {
                    if (/^https?:\/\/[^\s]+$/i.test(token)) {
                      return (
                        <a
                          key={tIdx}
                          href={token}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300 underline underline-offset-2 mx-0.5"
                        >
                          {token}
                        </a>
                      );
                    }
                    if (/^#[\w\u4e00-\u9fa5]+$/i.test(token)) {
                      return (
                        <span key={tIdx} className="text-sky-400 font-semibold mx-0.5">
                          {token}
                        </span>
                      );
                    }
                    return <span key={tIdx}>{token}</span>;
                  })}
                </p>
              );
            })}
          </div>

          {/* Tags list */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-sky-400 border border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {prevPost ? (
            <button
              onClick={() => onNavigate(prevPost)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer max-w-[45%] truncate"
            >
              <ChevronLeft className="w-4 h-4 shrink-0 text-sky-400" />
              <span className="truncate">上一篇: {prevPost.title || `#${prevPost.messageId}`}</span>
            </button>
          ) : (
            <div />
          )}

          {nextPost ? (
            <button
              onClick={() => onNavigate(nextPost)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer max-w-[45%] truncate ml-auto"
            >
              <span className="truncate">下一篇: {nextPost.title || `#${nextPost.messageId}`}</span>
              <ChevronRight className="w-4 h-4 shrink-0 text-sky-400" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
};
