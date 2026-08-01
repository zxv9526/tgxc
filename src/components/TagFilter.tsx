import React from 'react';
import { Tag } from 'lucide-react';

interface TagFilterProps {
  tags: { name: string; count: number }[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTag,
  onSelectTag,
}) => {
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
      <button
        onClick={() => onSelectTag(null)}
        className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
          selectedTag === null
            ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20'
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        <Tag className="w-3.5 h-3.5" />
        <span>全部动态</span>
      </button>

      {tags.map(({ name, count }) => {
        const isActive = selectedTag === name;
        return (
          <button
            key={name}
            onClick={() => onSelectTag(isActive ? null : name)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>#{name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
