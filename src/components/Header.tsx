import React from 'react';
import { Radio, RefreshCw, Search } from 'lucide-react';

interface HeaderProps {
  channelName: string;
  channelHandle: string;
  avatarUrl?: string;
  totalPosts: number;
  totalPhotos: number;
  isSyncing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  channelName,
  channelHandle,
  avatarUrl,
  totalPosts,
  totalPhotos,
  isSyncing,
  searchQuery,
  onSearchChange,
  onManualSync,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6">
        {/* Top Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-sky-500/20 ring-2 ring-sky-500/30">
                {avatarUrl ? (
                  <img
                    src={avatarUrl.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(avatarUrl)}` : avatarUrl}
                    alt={channelName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center">
                    AM
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" title="频道实时运行中" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-100 tracking-tight">
                  {channelName || 'Telegram 频道博客'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Broadcast Blog
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <a
                  href={`https://t.me/${channelHandle || 'amlhmfzl'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  @{channelHandle || 'amlhmfzl'}
                </a>
                <span>•</span>
                <span>{totalPosts} 篇文章</span>
                <span>•</span>
                <span>{totalPhotos} 张媒体</span>
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-900 transition-colors text-slate-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? '同步中...' : '立即同步'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Search Bar */}
        <div className="pt-3 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索文章内容、标题、标签 #hashtag 或消息ID..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1 rounded"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
