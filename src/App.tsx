import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Download,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Eye,
  ExternalLink
} from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  formatImageUrl,
  TelegramPhoto
} from './utils/telegram';

type ChannelPhoto = TelegramPhoto;

interface ChannelConfig {
  channelName: string;
  channelBio: string;
  avatarUrl: string;
  totalMembers?: string;
  handle: string;
}

export default function App() {
  // Target Telegram Public Channel Handle
  const [channelInput, setChannelInput] = useState<string>(() => {
    return localStorage.getItem('tg_channel_handle') || 'amlhmfzl';
  });

  const [activeHandle, setActiveHandle] = useState<string>(() => {
    return cleanChannelHandle(localStorage.getItem('tg_channel_handle') || 'amlhmfzl');
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Channel & Photos State
  const [config, setConfig] = useState<ChannelConfig>({
    channelName: `@${activeHandle}`,
    channelBio: 'Telegram 公开频道实时图像相册库',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    totalMembers: '',
    handle: activeHandle
  });

  const [photos, setPhotos] = useState<ChannelPhoto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lightbox Modal State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load photos from Telegram channel
  const loadChannelPhotos = useCallback(async (targetInput?: string) => {
    const rawInput = targetInput ?? channelInput;
    const handle = cleanChannelHandle(rawInput);

    if (!handle) {
      setSyncStatus({ type: 'error', text: '请输入有效的 Telegram 频道名称或链接' });
      return;
    }

    setIsSyncing(true);
    setIsLoading(true);
    setSyncStatus({ type: 'info', text: `正在拉取 @${handle} 公开频道的最新图片...` });

    let fetchedPhotos: ChannelPhoto[] = [];
    let fetchedInfo: any = null;

    // 1. Backend Express API call
    try {
      const res = await fetch(`/api/telegram/sync?channel=${encodeURIComponent(handle)}`);
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          fetchedPhotos = data.photos;
          fetchedInfo = data.info;
        }
      }
    } catch (err) {
      console.warn('Backend sync API failed, trying client proxies:', err);
    }

    // 2. Client-side parser with fallback CORS proxies
    if (fetchedPhotos.length === 0) {
      try {
        const clientData = await fetchTelegramChannelFromClient(handle);
        if (clientData && clientData.photos.length > 0) {
          fetchedPhotos = clientData.photos;
          fetchedInfo = clientData.info;
        }
      } catch (err) {
        console.warn('Client-side Telegram parser failed:', err);
      }
    }

    if (fetchedPhotos.length > 0) {
      setActiveHandle(handle);
      localStorage.setItem('tg_channel_handle', handle);
      setPhotos(fetchedPhotos);

      if (fetchedInfo) {
        setConfig({
          channelName: fetchedInfo.channelName || `@${handle}`,
          channelBio: fetchedInfo.channelBio || `@${handle} 频道的图像动态`,
          avatarUrl: formatImageUrl(fetchedInfo.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
          totalMembers: fetchedInfo.totalMembers || '',
          handle
        });
      }

      setSyncStatus({
        type: 'success',
        text: `成功加载 @${handle} 频道的 ${fetchedPhotos.length} 张最新照片！`
      });
    } else {
      setSyncStatus({
        type: 'error',
        text: `未在 @${handle} 找到图片。请确认该频道为【公开频道】(Public Channel) 且近期包含带图消息。`
      });
    }

    setIsSyncing(false);
    setIsLoading(false);
  }, [channelInput]);

  // Initial auto-sync on mount
  useEffect(() => {
    loadChannelPhotos(activeHandle);
  }, []);

  // Lightbox handlers
  const handlePhotoClick = (index: number) => {
    setActivePhotoIndex(index);
  };

  const closeLightbox = () => {
    setActivePhotoIndex(null);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex - 1 + photos.length) % photos.length);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex + 1) % photos.length);
  };

  const handleShare = async (photo: ChannelPhoto) => {
    const shareUrl = photo.telegramUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation & Channel Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Channel Name Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            <img
              src={formatImageUrl(config.avatarUrl)}
              alt={config.channelName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl border border-slate-700 object-cover bg-slate-800 shadow-md"
            />
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                {config.channelName}
              </h1>
              <p className="text-xs text-sky-400 font-mono">@{config.handle}</p>
            </div>
          </div>

          {/* Minimal Channel Switcher Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadChannelPhotos();
            }}
            className="w-full sm:max-w-md flex items-center gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                @
              </div>
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="Telegram 公开频道 (如 amlhmfzl 或 https://t.me/amlhmfzl)"
                className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-sky-500/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSyncing}
              className="shrink-0 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '同步中' : '同步'}</span>
            </button>
            <a
              href={`https://t.me/s/${config.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
              title="在 Telegram 中打开"
            >
              <Send className="w-4 h-4 text-sky-400" />
            </a>
          </form>
        </div>
      </header>

      {/* Main Photo Gallery Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Sync Alert Banner */}
        {syncStatus && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            syncStatus.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200' :
            syncStatus.type === 'error' ? 'bg-rose-950/30 border-rose-800/50 text-rose-200' :
            'bg-sky-950/30 border-sky-800/50 text-sky-200'
          }`}>
            <div className="flex items-center gap-2">
              {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {syncStatus.type === 'info' && <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />}
              <span>{syncStatus.text}</span>
            </div>
            <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Photo Gallery Grid Frame */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-slate-900 animate-pulse rounded-2xl h-64 border border-slate-800/80" />
            ))}
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.id || idx}
                onClick={() => handlePhotoClick(idx)}
                className="group relative bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 flex flex-col"
              >
                {/* Image Frame */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-950">
                  <img
                    src={formatImageUrl(photo.url)}
                    alt={photo.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 font-medium">
                      <Maximize2 className="w-3 h-3 text-sky-400" /> 放大查看
                    </span>
                  </div>
                </div>

                {/* Caption / Description */}
                {photo.description && (
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {photo.description}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {photo.date}
                      </span>
                      {photo.views > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Eye className="w-3 h-3" />
                          {photo.views}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
            <ImageIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">未检测到频道图片</h3>
            <p className="text-xs text-slate-500 mt-1">请确认 Telegram 频道 @{activeHandle} 为公开频道，且包含带图发帖。</p>
          </div>
        )}
      </main>

      {/* Lightbox / Fullscreen Image Viewer Frame Modal */}
      {activePhotoIndex !== null && photos[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Arrow */}
          <button
            onClick={prevPhoto}
            className="absolute left-4 z-50 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full border border-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextPhoto}
            className="absolute right-4 z-50 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full border border-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Lightbox Modal Frame */}
          <div
            className="max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Full Resolution Image */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden min-h-[300px]">
              <img
                src={formatImageUrl(photos[activePhotoIndex].url)}
                alt={photos[activePhotoIndex].title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Sidebar Info */}
            <div className="w-full md:w-80 bg-slate-900 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-sky-400 font-semibold">@{activeHandle}</span>
                  <span>{activePhotoIndex + 1} / {photos.length}</span>
                </div>

                {photos[activePhotoIndex].description && (
                  <p className="text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                    {photos[activePhotoIndex].description}
                  </p>
                )}

                <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>发布日期:</span>
                    <span className="text-slate-200 font-mono">{photos[activePhotoIndex].date}</span>
                  </div>
                  {photos[activePhotoIndex].views > 0 && (
                    <div className="flex items-center justify-between">
                      <span>浏览次数:</span>
                      <span className="text-slate-200">{photos[activePhotoIndex].views} 次</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-2">
                {photos[activePhotoIndex].telegramUrl && (
                  <a
                    href={photos[activePhotoIndex].telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    在 Telegram 中查看对应消息
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={formatImageUrl(photos[activePhotoIndex].url)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载原图
                  </a>
                  <button
                    onClick={() => handleShare(photos[activePhotoIndex])}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {isCopied ? '已复制' : '分享'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
