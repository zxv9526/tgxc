import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Sliders } from 'lucide-react';
import { TelegramPhoto, AiStyleTemplate } from '../types';

interface PromptModalProps {
  photo: TelegramPhoto | null;
  onClose: () => void;
}

const styleTemplates: AiStyleTemplate[] = [
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    promptPrefix: 'Cinematic cyberpunk photography, glowing neon aesthetics, volumetric rain fog, highly detailed, 8k resolution',
    promptSuffix: '--ar 16:9 --v 6.0 --style raw',
    badge: 'Neon Glow',
    bgGradient: 'from-fuchsia-600/20 to-purple-600/20 border-fuchsia-500/30'
  },
  {
    id: 'anime',
    name: '新海诚日漫',
    promptPrefix: 'Makoto Shinkai style anime illustration, vibrant blue skies, fluffy cumulus clouds, emotional lighting, masterpiece',
    promptSuffix: '--ar 16:9 --niji 6',
    badge: 'Anime Art',
    bgGradient: 'from-sky-600/20 to-cyan-600/20 border-sky-500/30'
  },
  {
    id: 'cinematic',
    name: '电影级纪实',
    promptPrefix: 'Award-winning 35mm film photo, Kodak Portra 400, dramatic depth of field, authentic film grain, masterpiece photography',
    promptSuffix: '--ar 16:9 --v 6.0',
    badge: '35mm Film',
    bgGradient: 'from-amber-600/20 to-orange-600/20 border-amber-500/30'
  },
  {
    id: 'realism',
    name: '写实超高清',
    promptPrefix: 'Ultra-realistic photography, shot on Hasselblad H6D-100c, sharp focal precision, 8k UHD studio lighting',
    promptSuffix: '--ar 16:9 --v 6.0 --style raw',
    badge: 'Hasselblad 8K',
    bgGradient: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30'
  }
];

export const PromptModal: React.FC<PromptModalProps> = ({ photo, onClose }) => {
  const [selectedStyle, setSelectedStyle] = useState<AiStyleTemplate>(styleTemplates[0]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!photo) return null;

  const currentPrompt = `${selectedStyle.promptPrefix}, ${photo.title}, ${photo.description}, ${photo.tags.join(', ')} ${selectedStyle.promptSuffix.replace('16:9', aspectRatio)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI 绘图 Prompt 提示词生成器</h3>
              <p className="text-xs text-slate-400">一键将相册图片转化为 Midjourney / Stable Diffusion 极速 Prompt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Style Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>选择画风预设模板</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {styleTemplates.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer bg-gradient-to-br ${style.bgGradient} ${
                  selectedStyle.id === style.id ? 'ring-2 ring-sky-500 shadow-lg' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-xs font-extrabold text-white block">{style.name}</span>
                <span className="text-[10px] text-slate-300 font-mono mt-1 block">{style.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">尺寸画幅比例 (--ar)</label>
          <div className="flex items-center gap-2">
            {['16:9', '9:16', '4:3', '1:1'].map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  aspectRatio === ar
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Prompt Output Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">生成的 Midjourney / SD 完整提示词</label>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-sky-300 leading-relaxed break-words relative">
            {currentPrompt}
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-2xl shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copiedPrompt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copiedPrompt ? '已成功复制提示词！' : '一键复制 AI 提示词'}</span>
        </button>
      </div>
    </div>
  );
};
