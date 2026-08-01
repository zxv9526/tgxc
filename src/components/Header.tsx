import React from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { FilterMode } from '../types';

interface HeaderProps {
  channelName: string;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  todayCount: number;
  totalCount: number;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  channelName,
  filterMode,
  setFilterMode,
  todayCount,
  totalCount,
  isSyncing,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Camera className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">
            {channelName || '频道图集'}
          </h1>
        </div>

        {/* Filter Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'today'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              今日图片 ({todayCount})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部图片 ({totalCount})
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
            title="刷新获取最新图集"
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
