import React, { useState } from 'react';
import { Calendar, Eye, ExternalLink, Download, MessageSquare, Maximize2 } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogCardProps {
  post: BlogPost;
  onOpenArticle: (post: BlogPost) => void;
  onOpenImage: (url: string, title: string, postPhotos?: string[], photoIndex?: number) => void;
  onSelectTag?: (tag: string) => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  post,
  onOpenArticle,
  onOpenImage,
  onSelectTag,
}) => {
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [fallbackRawMap, setFallbackRawMap] = useState<Record<string, boolean>>({});

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
    } else {
      setImageErrorMap(prev => ({ ...prev, [url]: true }));
    }
  };

  // Format text into elements with clickable URLs and hashtags
  const renderFormattedContent = (content: string, isSummary: boolean = false) => {
    if (!content) return null;

    let text = content;
    if (isSummary && text.length > 200) {
      text = text.slice(0, 200) + '...';
    }

    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-slate-300 text-sm leading-relaxed break-words font-sans">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;

          // Highlight URLs and Hashtags in line
          const tokens = line.split(/(\s+)/);
          return (
            <div key={idx} className="min-h-[1.2rem]">
              {tokens.map((token, tIdx) => {
                if (/^https?:\/\/[^\s]+$/i.test(token)) {
                  return (
                    <a
                      key={tIdx}
                      href={token}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors inline-flex items-center gap-0.5 mx-0.5"
                    >
                      {token.length > 35 ? token.slice(0, 32) + '...' : token}
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  );
                }
                if (/^#[\w\u4e00-\u9fa5]+$/i.test(token)) {
                  const tagName = token.replace('#', '');
                  return (
                    <span
                      key={tIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTag) onSelectTag(tagName);
                      }}
                      className="text-sky-400/90 hover:text-sky-300 font-medium cursor-pointer mx-0.5 hover:underline"
                    >
                      {token}
                    </span>
                  );
                }
                return <span key={tIdx}>{token}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Standard Article Card
  return (
    <article
      onClick={() => onOpenArticle(post)}
      className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer shadow-lg h-full"
    >
      {/* Article Post Header */}
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
            AM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">{post.author}</span>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.2 rounded border border-sky-500/20 font-medium">
                博文 #{post.messageId}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {post.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {post.views} 阅读
              </span>
            </div>
          </div>
        </div>

        {/* Telegram Direct Link Button */}
        <a
          href={post.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
          title="在 Telegram 中查看原文"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Media Photo Album Grid */}
      {post.photos.length > 0 && (
        <div className="bg-slate-950/80 border-b border-slate-800/50 relative overflow-hidden">
          {post.photos.length === 1 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenImage(post.photos[0], post.title, post.photos, 0);
              }}
              className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-950 group/img cursor-zoom-in"
            >
              {!imageErrorMap[post.photos[0]] ? (
                <img
                  src={getImageUrl(post.photos[0])}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  onError={() => handleImageError(post.photos[0])}
                  className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover/img:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  图片无法显示
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg border border-slate-700">
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  点击放大
                </span>
              </div>
            </div>
          ) : (
            <div className={`grid gap-1 p-1 bg-slate-950 ${
              post.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
            }`}>
              {post.photos.slice(0, 4).map((imgUrl, idx) => {
                const isFourthAndMore = idx === 3 && post.photos.length > 4;
                return (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenImage(imgUrl, post.title, post.photos, idx);
                    }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 group/subimg cursor-zoom-in border border-slate-800/60"
                  >
                    {!imageErrorMap[imgUrl] ? (
                      <img
                        src={getImageUrl(imgUrl)}
                        alt={`${post.title} - ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(imgUrl)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/subimg:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        图{idx + 1}
                      </div>
                    )}

                    {isFourthAndMore && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm">
                        +{post.photos.length - 3} 张照片
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Article Content & Title */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {post.title && (
            <h2 className="text-base font-bold text-slate-100 group-hover:text-sky-300 transition-colors mb-2 line-clamp-2 leading-snug">
              {post.title}
            </h2>
          )}

          {renderFormattedContent(post.content, true)}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {post.tags.map((tag, tIdx) => (
              <button
                key={tIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectTag) onSelectTag(tag);
                }}
                className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenArticle(post);
            }}
            className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>阅读全文</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
