import React from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface HeaderProps {
  channelName: string;
  photoCount: number;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  channelName,
  photoCount,
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
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              {channelName || 'Telegram 频道图集'}
            </h1>
            <p className="text-[11px] text-slate-400">
              最新 25 小时频道动态 ({photoCount} 张)
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-medium"
          title="刷新获取最新频道图集"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? '同步中...' : '刷新'}</span>
        </button>
      </div>
    </header>
  );
};
