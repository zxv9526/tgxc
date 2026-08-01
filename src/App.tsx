import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  AlertCircle,
  Loader2,
  X,
  Play,
  Pause,
  ChevronUp,
  RefreshCw,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Square,
  Calendar,
  Tag,
  Eye,
  Heart,
  Compass,
  Search,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  formatImageUrl,
  TelegramPhoto
} from './utils/telegram';
import { defaultPhotos } from './data/default_photos';

function safeBtoa(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    try {
      return btoa(str);
    } catch (err) {
      return '';
    }
  }
}

function safeAtob(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try {
      return atob(str);
    } catch (err) {
      return '';
    }
  }
}

// Subcomponent to render each image with smooth states, blob decoding, and robust error fallbacks
function ScrollableImage({
  photo,
  onClick,
  onCopyLink,
  onLike,
  onTagClick
}: {
  photo: TelegramPhoto;
  onClick: () => void;
  onCopyLink?: (url: string) => void;
  onLike?: (photoId: string, e?: React.MouseEvent) => void;
  onTagClick?: (tag: string) => void;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [sourceIndex, setSourceIndex] = useState(0);

  // Extract raw direct image URL from wrapped proxy URL
  let rawImgUrl = photo.url;
  if (photo.url.includes('/api/proxy-image')) {
    try {
      const urlObj = new URL(photo.url, window.location.origin);
      const enc = urlObj.searchParams.get('enc');
      const plain = urlObj.searchParams.get('url');
      if (enc) {
        rawImgUrl = safeAtob(enc);
      } else if (plain) {
        rawImgUrl = plain;
      }
    } catch (e) {
      if (photo.url.includes('?url=')) {
        rawImgUrl = decodeURIComponent(photo.url.split('?url=')[1]);
      } else if (photo.url.includes('?enc=')) {
        rawImgUrl = safeAtob(photo.url.split('?enc=')[1]);
      }
    }
  }

  const sources = [
    `/api/proxy-image?enc=${safeBtoa(rawImgUrl)}`,
    `/api/proxy-image?url=${encodeURIComponent(rawImgUrl)}`,
    rawImgUrl,
    `https://corsproxy.io/?${encodeURIComponent(rawImgUrl)}`
  ];

  const currentSrc = sources[sourceIndex] || rawImgUrl;

  const handleLoad = () => setStatus('loaded');
  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex(prev => prev + 1);
    } else {
      setStatus('error');
    }
  };

  useEffect(() => {
    setSourceIndex(0);
    setStatus('loading');
  }, [photo.url]);

  return (
    <div className="flex flex-col bg-slate-900/40 border border-slate-900 hover:border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl group">
      {/* Image Area */}
      <div
        onClick={onClick}
        className="relative w-full overflow-hidden cursor-pointer flex flex-col items-center justify-center min-h-[260px] bg-slate-950/40"
      >
        {/* Loading state spinner */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs text-slate-500">正在载入图片...</span>
          </div>
        )}

        {/* Error state fallback */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center bg-slate-900/95 gap-3 p-6 text-center select-text w-full min-h-[260px]">
            <AlertCircle className="w-8 h-8 text-rose-500 animate-pulse" />
            <p className="text-xs text-slate-400 max-w-md">
              图片载入出现阻碍，直接访问原图。
            </p>
            <div className="flex gap-2">
              <a
                href={rawImgUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg border border-slate-700/50 transition-colors"
              >
                打开原图
              </a>
            </div>
          </div>
        )}

        <img
          src={currentSrc}
          alt={photo.title || 'Telegram Photo'}
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          className={`max-h-[70vh] w-auto max-w-full object-contain group-hover:scale-[1.015] transition-all duration-500 ${
            status === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute pointer-events-none'
          }`}
        />

        {/* Hover quick tip overlay */}
        {status === 'loaded' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 pointer-events-none">
            <span className="text-xs text-white bg-sky-500/90 font-medium tracking-wider px-3.5 py-1.5 rounded-full border border-sky-400/40 shadow-xl backdrop-blur-sm pointer-events-auto transition-transform duration-300 group-hover:translate-y-0 translate-y-2">
              点击放大图片 🔍
            </span>
          </div>
        )}
      </div>

      {/* Info Card Body */}
      <div className="p-4 sm:p-5 flex flex-col gap-3 bg-slate-950/25 border-t border-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-sky-400 transition-colors">
              {photo.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <Calendar className="w-3 h-3 text-slate-600" />
              <span>{photo.date}</span>
              {photo.album && (
                <>
                  <span>•</span>
                  <span className="text-sky-400 font-semibold">{photo.album}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {photo.description && (
          <div className="text-xs text-slate-300 leading-relaxed font-normal">
            <p className="whitespace-pre-wrap">{photo.description}</p>
          </div>
        )}

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {photo.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800/80 rounded-md text-[10px] text-slate-400"
              >
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                <span>#{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* Interactions Row */}
        <div className="flex items-center justify-between border-t border-slate-900/80 pt-3 mt-1 text-xs text-slate-400">
          <div className="flex items-center gap-4 font-semibold">
            {/* Views */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Eye className="w-4 h-4 text-slate-600" />
              <span>{photo.views || 0} 次阅读</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent to load and render the magnified image inside the lightbox modal
function LightboxImage({
  photo,
  onDownload,
  onCopyLink,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}: {
  photo: TelegramPhoto;
  onDownload: () => void;
  onCopyLink: (url: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  let rawImgUrl = photo.url;
  if (photo.url.includes('/api/proxy-image')) {
    try {
      const urlObj = new URL(photo.url, window.location.origin);
      const enc = urlObj.searchParams.get('enc');
      const plain = urlObj.searchParams.get('url');
      if (enc) {
        rawImgUrl = safeAtob(enc);
      } else if (plain) {
        rawImgUrl = plain;
      }
    } catch (e) {
      if (photo.url.includes('?url=')) {
        rawImgUrl = decodeURIComponent(photo.url.split('?url=')[1]);
      } else if (photo.url.includes('?enc=')) {
        rawImgUrl = safeAtob(photo.url.split('?enc=')[1]);
      }
    }
  }

  const sources = [
    `/api/proxy-image?enc=${safeBtoa(rawImgUrl)}`,
    `/api/proxy-image?url=${encodeURIComponent(rawImgUrl)}`,
    rawImgUrl,
    `https://corsproxy.io/?${encodeURIComponent(rawImgUrl)}`
  ];

  const currentSrc = sources[sourceIndex] || rawImgUrl;

  const handleLoad = () => setStatus('loaded');
  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex(prev => prev + 1);
    } else {
      setStatus('error');
    }
  };

  useEffect(() => {
    setSourceIndex(0);
    setStatus('loading');
  }, [photo.url]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[300px] w-full px-2 sm:px-12">
      
      {/* Navigation Arrow buttons */}
      {onPrev && hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 rounded-full bg-slate-900/85 hover:bg-slate-850 text-white border border-slate-800 hover:scale-110 transition-all cursor-pointer shadow-2xl shrink-0"
          title="上一张 (← 键)"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {onNext && hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 rounded-full bg-slate-900/85 hover:bg-slate-850 text-white border border-slate-800 hover:scale-110 transition-all cursor-pointer shadow-2xl shrink-0"
          title="下一张 (→ 键)"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/20 py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-xs text-slate-400">正在载入高清原图...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center select-text bg-slate-900/50 rounded-2xl border border-slate-800 my-10">
          <AlertCircle className="w-8 h-8 text-rose-500 animate-pulse" />
          <p className="text-sm text-slate-400 max-w-md">
            原图加载受限，您可以直接在新标签页打开或下载。
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSourceIndex(0);
                setStatus('loading');
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              重试加载
            </button>
            <a
              href={rawImgUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg border border-slate-700/50"
            >
              在新标签页打开原图
            </a>
          </div>
        </div>
      )}

      <div className={`overflow-auto max-w-full ${isZoomed ? 'max-h-[85vh]' : ''} flex justify-center`}>
        <img
          src={currentSrc}
          alt={photo.title || 'Magnified Original'}
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          onClick={() => setIsZoomed(!isZoomed)}
          className={`w-auto max-w-full rounded-xl shadow-2xl transition-all duration-300 cursor-zoom-in ${
            isZoomed ? 'max-h-none scale-100 cursor-zoom-out' : 'max-h-[70vh] object-contain'
          } ${status === 'loaded' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
        />
      </div>

      {status === 'loaded' && (
        <div className="mt-6 flex flex-col items-center gap-4 w-full">
          {/* Metadata Overlay inside Lightbox */}
          <div className="w-full max-w-xl text-center px-4 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">{photo.title}</h3>
            {photo.description && (
              <p className="text-xs text-slate-300 line-clamp-3 mb-2 whitespace-pre-wrap leading-relaxed">
                {photo.description}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {photo.date}
              </span>
              <span>•</span>
              <span className="text-sky-400">{photo.album || 'All'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Eye className="w-3.5 h-3.5" />
                {photo.views || 0}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3 h-3 fill-rose-500/10" />
                {photo.likes || 0}
              </span>
            </div>
          </div>


        </div>
      )}
    </div>
  );
}

export default function App() {
  const [channelHandle, setChannelHandle] = useState<string>('amlhmfzl');
  const [channelInfo, setChannelInfo] = useState<any>({
    channelName: 'Telegram 频道图集',
    channelBio: 'Telegram 官方频道图集与精选摄影相册库。支持分类筛选、极速巡览与自动同步。',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    totalMembers: '12,450 关注',
    handle: 'amlhmfzl'
  });

  const [photos, setPhotos] = useState<TelegramPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters & State
  const [filterMode, setFilterMode] = useState<'today' | 'yesterday' | 'all'>('all');
  const [layoutMode, setLayoutMode] = useState<'stream' | 'grid'>('stream');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'likes'>('newest');

  // Custom handle search input
  const [customChannelInput, setCustomChannelInput] = useState<string>('');

  // Auto-scrolling state
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2.25);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Lightbox magnification state
  const [activePhoto, setActivePhoto] = useState<TelegramPhoto | null>(null);

  // Toast notification trigger
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load photos and sync channel info
  const loadPhotosForHandle = useCallback(async (handleToLoad: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedAlbum('All');
    setSearchQuery('');

    let loadedPhotos: TelegramPhoto[] = [];

    // Step 1: Instantly load cached photos from DB
    try {
      const res = await fetch(`/api/photos?channel=${encodeURIComponent(handleToLoad)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.photos && data.photos.length > 0) {
          loadedPhotos = data.photos;
          setPhotos(data.photos);
          if (data.info) {
            setChannelInfo(data.info);
          }
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.warn('Failed to load cached photos:', err);
    }

    // Step 2: Trigger Telegram sync in background to fetch latest updates
    try {
      const syncPromise = fetch(`/api/telegram/sync?channel=${encodeURIComponent(handleToLoad)}`)
        .then(async (syncRes) => {
          if (syncRes.ok && syncRes.headers.get('content-type')?.includes('application/json')) {
            const syncData = await syncRes.json();
            if (syncData.photos && syncData.photos.length > 0) {
              setPhotos(syncData.photos);
              loadedPhotos = syncData.photos;
              if (syncData.info) {
                setChannelInfo(syncData.info);
              }
              setIsLoading(false);
            }
          }
        })
        .catch((syncErr) => {
          console.warn('Background sync error:', syncErr);
        });

      if (loadedPhotos.length === 0) {
        await syncPromise;
      }
    } catch (err) {
      console.warn('Sync handler error:', err);
    }

    // Step 3: Client fallback parser if still no photos
    if (loadedPhotos.length === 0) {
      try {
        const clientData = await fetchTelegramChannelFromClient(handleToLoad);
        if (clientData && clientData.photos.length > 0) {
          setPhotos(clientData.photos);
          if (clientData.info) {
            setChannelInfo(clientData.info);
          }
          setIsLoading(false);
        } else {
          console.log('Client sync returned no photos, loading fallback dataset...');
          setPhotos(defaultPhotos);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Client parser error, loading fallback dataset:', err);
        setPhotos(defaultPhotos);
        setIsLoading(false);
      }
    }
  }, []);

  // Manual trigger to force re-sync with Telegram channel
  const handleManualSync = async () => {
    setIsSyncing(true);
    showToast(`正在重新从 Telegram 频道 @${channelHandle} 同步最新图片...`);

    try {
      const syncRes = await fetch(`/api/telegram/sync?channel=${encodeURIComponent(channelHandle)}`);
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.photos && syncData.photos.length > 0) {
          setPhotos(syncData.photos);
          if (syncData.info) {
            setChannelInfo(syncData.info);
          }
          showToast(`同步成功！已载入 ${syncData.photos.length} 张最新照片`);
        } else {
          showToast('同步完成，当前频道暂无新动态');
        }
      } else {
        showToast('同步稍有延迟，将自动更新图片列表');
      }
    } catch (err) {
      console.error('Manual sync error:', err);
      showToast('同步失败，请检查网络后重试');
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial load config on mount
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.handle) {
          setChannelHandle(data.handle);
          setChannelInfo(data);
          loadPhotosForHandle(data.handle);
        } else {
          loadPhotosForHandle('amlhmfzl');
        }
      })
      .catch(err => {
        console.warn('Failed to load config, using fallback:', err);
        loadPhotosForHandle('amlhmfzl');
      });
  }, [loadPhotosForHandle]);

  // Back to top scroll visibility listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-Scroller Engine via requestAnimationFrame
  useEffect(() => {
    if (!isAutoScrolling) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      const pixelsToScroll = scrollSpeed * (delta / 16.666);
      window.scrollBy(0, pixelsToScroll);

      const scrollHeight = document.documentElement.scrollHeight;
      const currentScroll = window.scrollY + window.innerHeight;
      if (currentScroll >= scrollHeight - 3) {
        setIsAutoScrolling(false);
        return;
      }

      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Interrupt auto-scroll on user interaction
  useEffect(() => {
    if (!isAutoScrolling) return;

    const handleUserInteraction = () => {
      setIsAutoScrolling(false);
    };

    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
      window.removeEventListener('mousedown', handleUserInteraction);
    };
  }, [isAutoScrolling]);

  // Interact: Like Photo
  const handleLike = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return { ...p, likes: (p.likes || 0) + 1 };
      }
      return p;
    }));

    if (activePhoto && activePhoto.id === photoId) {
      setActivePhoto(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
    }

    try {
      const res = await fetch(`/api/photos/${encodeURIComponent(photoId)}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.likes === 'number') {
          setPhotos(prev => prev.map(p => {
            if (p.id === photoId) {
              return { ...p, likes: data.likes };
            }
            return p;
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to like on server:', err);
    }
  };

  // Interact: Increment View Count
  const handleView = async (photoId: string) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return { ...p, views: (p.views || 0) + 1 };
      }
      return p;
    }));

    try {
      await fetch(`/api/photos/${encodeURIComponent(photoId)}/view`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to view on server:', err);
    }
  };

  // Handle image download
  const handleDownload = async (photo: TelegramPhoto) => {
    let rawUrl = photo.url;
    if (photo.url.includes('/api/proxy-image')) {
      try {
        const urlObj = new URL(photo.url, window.location.origin);
        const enc = urlObj.searchParams.get('enc');
        const plain = urlObj.searchParams.get('url');
        if (enc) {
          rawUrl = safeAtob(enc);
        } else if (plain) {
          rawUrl = plain;
        }
      } catch (e) {
        if (photo.url.includes('?url=')) {
          rawUrl = decodeURIComponent(photo.url.split('?url=')[1]);
        } else if (photo.url.includes('?enc=')) {
          rawUrl = safeAtob(photo.url.split('?enc=')[1]);
        }
      }
    }

    try {
      const res = await fetch(rawUrl, { referrerPolicy: 'no-referrer' });
      if (res.ok) {
        const blob = await res.blob();
        const bUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = bUrl;
        a.download = `${photo.id || 'photo'}-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(bUrl);
        showToast('原图文件已成功触发下载！');
        return;
      }
    } catch (e) {}

    // Fallback download via proxy
    const proxyDownloadUrl = `/api/proxy-image?enc=${safeBtoa(rawUrl)}&download=1`;
    window.open(proxyDownloadUrl, '_blank');
    showToast('通过加密通道开始下载图片...');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('原图链接已复制到剪贴板！');
    }).catch(() => {
      showToast('复制失败，请手工选中链接');
    });
  };

  // Format Beijing Date
  const getTodayString = () => {
    try {
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(new Date());
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch (e) {}

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();

  // Today midnight (00:00:00) in Beijing Time
  const beijingTodayMidnightTimestamp = useMemo(() => {
    try {
      const d = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      if (year && month && day) {
        const mm = month.padStart(2, '0');
        const dd = day.padStart(2, '0');
        const todayMidnightStr = `${year}-${mm}-${dd}T00:00:00+08:00`;
        const todayMidnight = new Date(todayMidnightStr);
        if (!isNaN(todayMidnight.getTime())) {
          return todayMidnight.getTime();
        }
      }
    } catch (e) {
      console.error('[Beijing Date Error]:', e);
    }
    // Robust fallback
    const now = Date.now();
    const tzOffsetMs = 8 * 60 * 60 * 1000;
    const localTime = now + tzOffsetMs;
    const msInDay = 24 * 60 * 60 * 1000;
    return Math.floor(localTime / msInDay) * msInDay - tzOffsetMs;
  }, []);

  // Yesterday midnight (00:00:00) in Beijing Time
  const beijingYesterdayMidnightTimestamp = useMemo(() => {
    return beijingTodayMidnightTimestamp - 24 * 60 * 60 * 1000;
  }, [beijingTodayMidnightTimestamp]);

  const photosInTodayCount = useMemo(() => {
    if (photos.length === 0) return 0;
    return photos.filter(p => {
      const pTime = p.timestamp || new Date(`${p.date}T00:00:00+08:00`).getTime();
      return pTime >= beijingTodayMidnightTimestamp;
    }).length;
  }, [photos, beijingTodayMidnightTimestamp]);

  const photosInYesterdayCount = useMemo(() => {
    if (photos.length === 0) return 0;
    return photos.filter(p => {
      const pTime = p.timestamp || new Date(`${p.date}T00:00:00+08:00`).getTime();
      return pTime >= beijingYesterdayMidnightTimestamp;
    }).length;
  }, [photos, beijingYesterdayMidnightTimestamp]);

  // Extract unique albums
  const availableAlbums = useMemo(() => {
    const list = new Set<string>();
    photos.forEach(p => {
      if (p.album) list.add(p.album);
    });
    return ['All', ...Array.from(list)];
  }, [photos]);

  // Compute processed and filtered photo stream
  const processedPhotos = useMemo(() => {
    let result = [...photos];

    // Filter by date ranges
    if (filterMode === 'today') {
      result = result.filter(p => {
        const pTime = p.timestamp || new Date(`${p.date}T00:00:00+08:00`).getTime();
        return pTime >= beijingTodayMidnightTimestamp;
      });
    } else if (filterMode === 'yesterday') {
      result = result.filter(p => {
        const pTime = p.timestamp || new Date(`${p.date}T00:00:00+08:00`).getTime();
        return pTime >= beijingYesterdayMidnightTimestamp;
      });
    }

    // Category
    if (selectedAlbum !== 'All') {
      result = result.filter(p => p.album === selectedAlbum);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.album?.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'likes') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      result.sort((a, b) => {
        const aTime = a.timestamp || new Date(`${a.date}T00:00:00+08:00`).getTime();
        const bTime = b.timestamp || new Date(`${b.date}T00:00:00+08:00`).getTime();
        return bTime - aTime;
      });
    }

    return result;
  }, [photos, filterMode, beijingTodayMidnightTimestamp, beijingYesterdayMidnightTimestamp, selectedAlbum, searchQuery, sortBy]);

  // Slide-by-slide modal navigation calculations
  const activePhotoIndex = useMemo(() => {
    if (!activePhoto) return -1;
    return processedPhotos.findIndex(p => p.id === activePhoto.id);
  }, [activePhoto, processedPhotos]);

  const hasPrev = activePhotoIndex > 0;
  const hasNext = activePhotoIndex !== -1 && activePhotoIndex < processedPhotos.length - 1;

  const handlePrevPhoto = useCallback(() => {
    if (hasPrev) {
      const prevPhoto = processedPhotos[activePhotoIndex - 1];
      setActivePhoto(prevPhoto);
      handleView(prevPhoto.id);
    }
  }, [activePhotoIndex, hasPrev, processedPhotos]);

  const handleNextPhoto = useCallback(() => {
    if (hasNext) {
      const nextPhoto = processedPhotos[activePhotoIndex + 1];
      setActivePhoto(nextPhoto);
      handleView(nextPhoto.id);
    }
  }, [activePhotoIndex, hasNext, processedPhotos]);

  // Keyboard controls inside lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePhoto) return;
      if (e.key === 'Escape') {
        setActivePhoto(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, handlePrevPhoto, handleNextPhoto]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-2 sm:p-6 select-none font-sans">
      
      {/* Toast Notification Popup */}
      {toastMsg && (
        <div className="fixed top-5 z-50 bg-sky-500 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-2xl border border-sky-400/40 animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex flex-col gap-6 py-4">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs">智能解析载入 Telegram 图片中...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center text-rose-300 bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs max-w-md">{errorMsg}</p>
            <button
              onClick={() => loadPhotosForHandle(channelHandle)}
              className="mt-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium cursor-pointer border border-slate-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Minimalist Channel Header (No buttons/controls) */}
            <div className="flex flex-col items-center text-center gap-3 py-4 border-b border-slate-900 pb-6">
              {channelInfo?.avatarUrl && (
                <img
                  src={channelInfo.avatarUrl}
                  alt={channelInfo.channelName}
                  className="w-16 h-16 rounded-full border border-slate-855 object-cover shadow-xl"
                  referrerPolicy="no-referrer"
                />
              )}
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white mb-1">
                  {channelInfo?.channelName || channelHandle}
                </h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {channelInfo?.channelBio || `@${channelHandle} 频道的精彩图片流`}
                </p>
                {channelInfo?.totalMembers && (
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-sky-400">
                    {channelInfo.totalMembers}
                  </span>
                )}
              </div>
            </div>

            {/* Main Picture Stream Grid */}
            {processedPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-900/20 border border-slate-900 rounded-3xl p-6 text-center text-slate-400 gap-3 animate-fade-in">
                <Compass className="w-12 h-12 text-slate-700 animate-pulse" />
                <h3 className="text-base font-bold text-slate-300">暂无图片内容</h3>
                <p className="text-xs max-w-sm">
                  未找到任何图片发布，请稍后再试。
                </p>
              </div>
            ) : (
              <div className={layoutMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-6'}>
                {processedPhotos.map((photo, index) => (
                  <ScrollableImage
                    key={photo.id || index}
                    photo={photo}
                    onClick={() => {
                      setActivePhoto(photo);
                      handleView(photo.id);
                    }}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Floating Control Panel */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2.5 items-end">
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 bg-slate-900/95 hover:bg-slate-800 active:bg-slate-950 text-sky-400 rounded-full border border-slate-800 shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm"
            title="回到顶部"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {!isLoading && !errorMsg && processedPhotos.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-800 p-2 rounded-2xl shadow-2xl backdrop-blur-sm">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              {isAutoScrolling ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current animate-pulse text-emerald-400" />
                  <span className="text-emerald-400">滚动中</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>自动滚动</span>
                </>
              )}
            </button>

            <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-900">
              {[
                { label: '慢', value: 1.05 },
                { label: '中', value: 2.25 },
                { label: '快', value: 4.8 }
              ].map((speed) => (
                <button
                  key={speed.value}
                  onClick={() => setScrollSpeed(speed.value)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    scrollSpeed === speed.value
                      ? 'bg-sky-500/20 text-sky-400 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 z-50 p-3 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full border border-slate-800 transition-colors cursor-pointer shadow-lg animate-pulse"
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center max-w-5xl w-full max-h-[90vh] bg-transparent"
          >
            <LightboxImage
              photo={activePhoto}
              onDownload={() => handleDownload(activePhoto)}
              onCopyLink={handleCopyLink}
              onPrev={handlePrevPhoto}
              onNext={handleNextPhoto}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          </div>
        </div>
      )}
    </div>
  );
}
