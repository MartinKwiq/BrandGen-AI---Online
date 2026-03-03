import { useState } from 'react';
import { cn } from '../utils/cn';

interface ColorPaletteProps {
  colors: { name: string; hex: string; usage: string }[];
  selected?: number;
  onSelect?: (index: number) => void;
}

export function ColorPalette({ colors, selected, onSelect }: ColorPaletteProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (hex: string, index: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {colors.map((color, index) => (
          <div
            key={index}
            onClick={() => onSelect?.(index)}
            className={cn(
              'group relative rounded-xl overflow-hidden shadow-md transition-all hover:scale-105 cursor-pointer',
              selected === index && 'ring-4 ring-violet-500 ring-offset-2'
            )}
          >
            <div
              className="h-20 w-full relative"
              style={{ backgroundColor: color.hex }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(color.hex, index);
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-2 py-1 rounded-lg text-xs font-medium shadow-lg transition-opacity">
                  {copiedIndex === index ? '¡Copiado!' : 'Copiar'}
                </span>
              </button>
            </div>
            <div className="p-3 bg-white">
              <p className="font-semibold text-slate-800 text-sm truncate">{color.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">{color.hex}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{color.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ColorComparisonProps {
  colors: { name: string; hex: string; usage: string }[];
  title?: string;
}

export function ColorComparison({ colors, title }: ColorComparisonProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
      <div className="flex flex-wrap gap-4">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl shadow-md border border-black/10"
              style={{ backgroundColor: color.hex }}
            />
            <div>
              <p className="font-medium text-slate-800 text-sm">{color.name}</p>
              <p className="text-xs text-slate-500 font-mono">{color.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
