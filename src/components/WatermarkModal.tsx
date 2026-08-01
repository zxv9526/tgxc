import React, { useState, useRef, useEffect } from 'react';
import { X, Wand2, Download } from 'lucide-react';
import { TelegramPhoto } from '../types';

interface WatermarkModalProps {
  photo: TelegramPhoto | null;
  onClose: () => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({ photo, onClose }) => {
  const [watermarkText, setWatermarkText] = useState('© Telegram Channel');
  const [position, setPosition] = useState<'br' | 'bl' | 'center' | 'tr'>('br');
  const [opacity, setOpacity] = useState(0.8);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!photo) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `/api/proxy-image?url=${encodeURIComponent(photo.url)}`;

    img.onload = () => {
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 800;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Add Watermark text
      ctx.globalAlpha = opacity;
      const fontSize = Math.max(20, Math.floor(canvas.width / 35));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;

      const padding = 30;
      const metrics = ctx.measureText(watermarkText);
      let x = canvas.width - metrics.width - padding;
      let y = canvas.height - padding;

      if (position === 'bl') {
        x = padding;
        y = canvas.height - padding;
      } else if (position === 'tr') {
        x = canvas.width - metrics.width - padding;
        y = fontSize + padding;
      } else if (position === 'center') {
        x = (canvas.width - metrics.width) / 2;
        y = canvas.height / 2;
      }

      ctx.fillText(watermarkText, x, y);
    };
  }, [photo, watermarkText, position, opacity]);

  if (!photo) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `watermarked-${photo.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">图片个性化水印绘制</h3>
              <p className="text-xs text-slate-400">实时在 Canvas 上添加自定义版权水印并直接导出</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 max-h-[50vh] overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="max-w-full max-h-[45vh] object-contain rounded-xl" />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">水印文字</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">位置坐标</label>
            <select
              value={position}
              onChange={(e: any) => setPosition(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="br">右下角</option>
              <option value="bl">左下角</option>
              <option value="tr">右上角</option>
              <option value="center">居中透明</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">不透明度 ({Math.round(opacity * 100)}%)</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-8 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>下载带水印高清原图</span>
        </button>
      </div>
    </div>
  );
};
