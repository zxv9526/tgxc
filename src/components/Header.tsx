import React from 'react';
import { Radio, RefreshCw, ExternalLink, Search, LayoutList, Grid, ListFilter, Rss } from 'lucide-react';

interface HeaderProps {
  channelName: string;
  channelHandle: string;
  totalPosts: number;
  totalPhotos: number;
  isSyncing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'feed' | 'grid' | 'compact';
  onViewModeChange: (mode: 'feed' | 'grid' | 'compact') => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  channelName,
  channelHandle,
  totalPosts,
  totalPhotos,
  isSyncing,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onRefresh,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6">
        {/* Top Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-sky-500/20 ring-2 ring-sky-500/30">
                AM
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
            <a
              href={`https://t.me/${channelHandle || 'amlhmfzl'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Rss className="w-3.5 h-3.5" />
              <span>订阅频道</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>

            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="获取 Telegram 频道最新动态"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? '同步中...' : '同步最新'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Search & View Controls Bar */}
        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索文章内容、标题、标签 #hashtag 或消息ID..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/50 transition-all"
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

          {/* Layout Mode Toggles */}
          <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => onViewModeChange('feed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="博客流视图"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>文章流</span>
            </button>

            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="网格试图"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>卡片网格</span>
            </button>

            <button
              onClick={() => onViewModeChange('compact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="紧凑列表视图"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>列表</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
