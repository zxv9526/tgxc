import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Image as ImageIcon,
  Heart,
  Eye,
  Download,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  RefreshCw,
  ExternalLink,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Filter
} from 'lucide-react';
import {
  fetchTelegramChannelFromClient,
  cleanChannelHandle,
  TelegramPhoto
} from './utils/telegram';

type ChannelPhoto = TelegramPhoto;

interface ChannelConfig {
  channelName: string;
  channelBio: string;
  bannerUrl: string;
  avatarUrl: string;
  totalMembers: string | number;
  handle: string;
}

export default function App() {
  // Telegram Channel Handle State (supports @handle, handle, or t.me URL)
  const [channelInput, setChannelInput] = useState<string>(() => {
    return localStorage.getItem('tg_channel_handle') || '@sphotographs';
  });

  const [activeHandle, setActiveHandle] = useState<string>(() => {
    return cleanChannelHandle(localStorage.getItem('tg_channel_handle') || 'sphotographs');
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Channel & Photos State
  const [config, setConfig] = useState<ChannelConfig>({
    channelName: 'Telegram 频道图片库',
    channelBio: '输入公开 Telegram 频道名称，秒级同步频道内发布的图片与相册。',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    totalMembers: '12,450 关注者',
    handle: activeHandle
  });

  const [photos, setPhotos] = useState<ChannelPhoto[]>([]);
  const [albums, setAlbums] = useState<string[]>(['All']);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lightbox Modal State
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync / Load Telegram Channel Photos
  const loadChannelPhotos = useCallback(async (targetInput?: string) => {
    const rawInput = targetInput ?? channelInput;
    const handle = cleanChannelHandle(rawInput);

    if (!handle) {
      setSyncStatus({ type: 'error', text: '请输入有效的 Telegram 频道名称或链接' });
      return;
    }

    setIsSyncing(true);
    setIsLoading(true);
    setSyncStatus({ type: 'info', text: `正在拉取 @${handle} 频道的最新图片...` });

    let fetchedPhotos: ChannelPhoto[] = [];
    let fetchedInfo: any = null;

    // 1. Try server backend API
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
      console.warn('Backend sync API call failed:', err);
    }

    // 2. Fallback to client-side CORS proxies & Telegram Web view parser
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

      const detectedAlbums = ['All', ...Array.from(new Set(fetchedPhotos.map(p => p.album)))];
      setAlbums(detectedAlbums);

      if (fetchedInfo) {
        setConfig({
          channelName: fetchedInfo.channelName || `@${handle}`,
          channelBio: fetchedInfo.channelBio || `@${handle} 频道的图文动态`,
          avatarUrl: fetchedInfo.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
          bannerUrl: fetchedInfo.bannerUrl || fetchedPhotos[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
          totalMembers: fetchedInfo.totalMembers || 'Telegram 频道',
          handle
        });
      }

      setSyncStatus({
        type: 'success',
        text: `成功加载 @${handle} 频道的 ${fetchedPhotos.length} 张图片！`
      });
    } else {
      setSyncStatus({
        type: 'error',
        text: `未在 @${handle} 找到图片。请检查该频道是否为【公开频道】(Public Channel) 且近期有发送图片。`
      });
    }

    setIsSyncing(false);
    setIsLoading(false);
  }, [channelInput]);

  // Initial load on component mount
  useEffect(() => {
    loadChannelPhotos(activeHandle);
  }, []);

  // Filtered photos
  const filteredPhotos = photos.filter(p => {
    const matchesAlbum = selectedAlbum === 'All' || p.album === selectedAlbum;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    return matchesAlbum && matchesSearch;
  });

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
    setActivePhotoIndex((activePhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex + 1) % filteredPhotos.length);
  };

  const handleShare = async (photo: ChannelPhoto) => {
    const shareUrl = photo.telegramUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* --- Simple Top Navigation & Telegram Channel Input Bar --- */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-snug flex items-center gap-2">
                Telegram 频道图片库
              </h1>
              <p className="text-xs text-slate-400">公开频道图片实时巡览与高清相册</p>
            </div>
          </div>

          {/* Clean Channel Fetch Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadChannelPhotos();
            }}
            className="w-full sm:max-w-xl flex items-center gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-medium text-sm">
                @
              </div>
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="输入频道名，例如 @sphotographs 或 t.me/sphotographs"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 focus:border-sky-500/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSyncing}
              className="shrink-0 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '载入中...' : '载入图片'}</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Status / Alert Banner */}
        {syncStatus && (
          <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 transition-all ${
            syncStatus.type === 'success' ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' :
            syncStatus.type === 'error' ? 'bg-rose-950/40 border-rose-800/60 text-rose-200' :
            'bg-sky-950/40 border-sky-800/60 text-sky-200'
          }`}>
            {syncStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {syncStatus.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {syncStatus.type === 'info' && <RefreshCw className="w-5 h-5 text-sky-400 animate-spin shrink-0 mt-0.5" />}
            <div className="flex-1 leading-relaxed">
              {syncStatus.text}
              {syncStatus.type === 'error' && (
                <div className="mt-2 text-xs text-rose-300/80 flex items-center gap-2">
                  <span>提示：名称前加不加 @ 均可，系统会自动格式化。推荐测试频道：</span>
                  <button
                    onClick={() => {
                      setChannelInput('sphotographs');
                      loadChannelPhotos('sphotographs');
                    }}
                    className="underline hover:text-white font-medium cursor-pointer"
                  >
                    @sphotographs
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Channel Info Card */}
        <div className="relative rounded-2xl bg-slate-800/50 border border-slate-700/60 overflow-hidden shadow-xl">
          {/* Banner */}
          <div className="h-36 sm:h-48 w-full bg-slate-800 relative overflow-hidden">
            <img
              src={config.bannerUrl}
              alt="Channel Banner"
              className="w-full h-full object-cover opacity-60 blur-xs scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>

          {/* Profile Header */}
          <div className="px-6 pb-6 relative -mt-14 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <img
                src={config.avatarUrl}
                alt={config.channelName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-slate-900 shadow-xl object-cover bg-slate-800"
              />
              <div className="mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  {config.channelName}
                </h2>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 mt-1">
                  <span className="font-mono text-sky-400 font-semibold">@{config.handle}</span>
                  {config.totalMembers && <span>• {config.totalMembers}</span>}
                  <span>• {photos.length} 张图片</span>
                </div>
              </div>
            </div>

            <a
              href={`https://t.me/s/${config.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-700/80 hover:bg-slate-600 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border border-slate-600/80 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>在 Telegram 打开</span>
            </a>
          </div>

          {config.channelBio && (
            <p className="px-6 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-700/40 pt-3">
              {config.channelBio}
            </p>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50">
          {/* Albums Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-2 mr-1" />
            {albums.map((album) => (
              <button
                key={album}
                onClick={() => setSelectedAlbum(album)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedAlbum === album
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {album === 'All' ? '全部图片' : album}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索图片描述或标签..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Photo Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-slate-800/60 animate-pulse rounded-2xl h-64 border border-slate-700/40" />
            ))}
          </div>
        ) : filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo.id || idx}
                onClick={() => handlePhotoClick(idx)}
                className="group relative bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col"
              >
                {/* Image Box */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-900">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-sky-400" /> 查看原图
                    </span>
                  </div>
                </div>

                {/* Photo Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                    {photo.description || photo.title}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {photo.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" />
                        {photo.views}
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-3 h-3 fill-rose-400/20" />
                        {photo.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-800">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">未找到相关图片</h3>
            <p className="text-xs text-slate-500 mt-1">尝试重新载入频道或更改关键字。</p>
          </div>
        )}
      </main>

      {/* --- Lightbox / Fullscreen Viewer Modal --- */}
      {activePhotoIndex !== null && filteredPhotos[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Arrow */}
          <button
            onClick={prevPhoto}
            className="absolute left-4 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextPhoto}
            className="absolute right-4 z-50 p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Modal Container */}
          <div
            className="max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview Container */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden min-h-[300px]">
              <img
                src={filteredPhotos[activePhotoIndex].url}
                alt={filteredPhotos[activePhotoIndex].title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Photo Details Sidebar */}
            <div className="w-full md:w-80 bg-slate-900 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-lg">
                    {filteredPhotos[activePhotoIndex].album}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activePhotoIndex + 1} / {filteredPhotos.length}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {filteredPhotos[activePhotoIndex].title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                  {filteredPhotos[activePhotoIndex].description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>发布日期:</span>
                    <span className="text-slate-200">{filteredPhotos[activePhotoIndex].date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>浏览量:</span>
                    <span className="text-slate-200">{filteredPhotos[activePhotoIndex].views} 次</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>频道来源:</span>
                    <span className="text-sky-400">{filteredPhotos[activePhotoIndex].author}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 space-y-2">
                {filteredPhotos[activePhotoIndex].telegramUrl && (
                  <a
                    href={filteredPhotos[activePhotoIndex].telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    在 Telegram 中查看对应发帖
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={filteredPhotos[activePhotoIndex].url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载原图
                  </a>
                  <button
                    onClick={() => handleShare(filteredPhotos[activePhotoIndex])}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {isCopied ? '已复制' : '分享链接'}
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
