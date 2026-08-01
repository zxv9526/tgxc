import React from 'react';
import { Calendar, Layers, Grid, List, RefreshCw } from 'lucide-react';
import { FilterMode, LayoutMode } from '../types';

interface FilterBarProps {
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedAlbum: string;
  setSelectedAlbum: (album: string) => void;
  albums: string[];
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  todayPhotosCount: number;
  totalPhotosCount: number;
  todayString: string;
  isSyncing: boolean;
  onManualSync: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterMode,
  setFilterMode,
  selectedAlbum,
  setSelectedAlbum,
  albums,
  layoutMode,
  setLayoutMode,
  todayPhotosCount,
  totalPhotosCount,
  todayString,
  isSyncing,
  onManualSync,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('today')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
              filterMode === 'today'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>显示当天图片</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[10px] text-slate-300 border border-slate-800">
              {todayPhotosCount} 张
            </span>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border ${
              filterMode === 'all'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-lg shadow-sky-500/10'
                : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>全部历史图库</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-[10px] text-slate-300 border border-slate-800">
              {totalPhotosCount} 张
            </span>
          </button>
        </div>

        {/* Layout Switcher & Status Info */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            {filterMode === 'today'
              ? todayPhotosCount > 0
                ? `北京时间今日 (${todayString}) 已有 ${todayPhotosCount} 张图片`
                : `北京时间今日 (${todayString}) 尚无更新，等待频道推送...`
              : `已加载全部 ${totalPhotosCount} 张历史图片`}
          </span>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === 'grid' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="双列/网格视图"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                layoutMode === 'list' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="单列大图流"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="p-2 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all cursor-pointer disabled:opacity-50 sm:hidden"
            title="刷新与抓取"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Album Pills */}
      {albums.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {albums.map((album) => (
            <button
              key={album}
              onClick={() => setSelectedAlbum(album)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedAlbum === album
                  ? 'bg-slate-200 text-slate-950 border-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {album === 'All' ? '全部专辑分类' : album}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
