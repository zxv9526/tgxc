import React from 'react';
import { Send, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ChannelConfig } from '../types';

interface ChannelConfigBarProps {
  channelConfig: ChannelConfig;
  targetInput: string;
  setTargetInput: (val: string) => void;
  isSyncing: boolean;
  syncSuccessMsg: string | null;
  onSync: (e: React.FormEvent) => void;
}

export const ChannelConfigBar: React.FC<ChannelConfigBarProps> = ({
  channelConfig,
  targetInput,
  setTargetInput,
  isSyncing,
  syncSuccessMsg,
  onSync,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
      {/* Banner background */}
      <div className="h-36 sm:h-48 w-full relative overflow-hidden bg-slate-950">
        <img
          src={channelConfig.bannerUrl}
          alt="Channel Banner"
          className="w-full h-full object-cover opacity-60 scale-105 filter blur-[1px] transition-transform duration-700 hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Info Content Overlay */}
      <div className="relative px-6 pb-6 pt-0 sm:px-8 -mt-12 sm:-mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex items-start sm:items-end gap-5">
          <div className="relative shrink-0">
            <img
              src={channelConfig.avatarUrl}
              alt="Avatar"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-slate-950 shadow-2xl bg-slate-900"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-sky-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {channelConfig.channelName}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Users className="w-3 h-3" />
                {channelConfig.totalMembers}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {channelConfig.channelBio}
            </p>
          </div>
        </div>

        {/* Telegram Channel Input / Sync Form */}
        <form onSubmit={onSync} className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-1.5 shadow-xl">
            <span className="text-xs text-slate-500 font-bold pl-2.5">@</span>
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="输入 Telegram 频道 Handle"
              className="w-36 sm:w-44 bg-transparent text-xs text-slate-200 font-medium focus:outline-none placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={isSyncing}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 border border-sky-400/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '抓取中...' : '深度同步'}</span>
            </button>
          </div>

          {syncSuccessMsg && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium px-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
