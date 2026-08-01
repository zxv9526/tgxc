import React from 'react';
import { Compass, RefreshCw } from 'lucide-react';

interface EmptyTodayStateProps {
  todayString: string;
  isSyncing: boolean;
  onManualSync: () => void;
  hasTotalPhotos: boolean;
  totalPhotosCount: number;
  onShowAll: () => void;
}

export const EmptyTodayState: React.FC<EmptyTodayStateProps> = ({
  todayString,
  isSyncing,
  onManualSync,
  hasTotalPhotos,
  totalPhotosCount,
  onShowAll,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-900 rounded-3xl p-8 text-center text-slate-400 gap-4 animate-fade-in shadow-inner">
      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
        <Compass className="w-7 h-7 animate-pulse" />
      </div>
      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="text-base font-bold text-slate-200">
          今日（{todayString}）暂无图片更新
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          按照北京时间计算，频道在今日（{todayString}）尚未推送新图片。系统已在零点自动清空昨日列表，正在持续监测频道最新推送中...
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <button
          onClick={onManualSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 border border-sky-400/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? '同步中...' : '重新检测 Telegram 频道'}</span>
        </button>

        {hasTotalPhotos && (
          <button
            onClick={onShowAll}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            查看历史全部图片 ({totalPhotosCount}张)
          </button>
        )}
      </div>
    </div>
  );
};
