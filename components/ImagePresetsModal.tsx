'use client';

import React from 'react';
import { STOCK_PRESET_IMAGES } from '@/lib/initialData';
import { X, Check } from 'lucide-react';

interface ImagePresetsModalProps {
  onSelectUrl: (url: string) => void;
  onClose: () => void;
}

export const ImagePresetsModal: React.FC<ImagePresetsModalProps> = ({
  onSelectUrl,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#131315]">
          <div>
            <h3 className="text-base font-bold text-[#e5e1e4]">
              Galeria de Fotos de Relógios em Alta Resolução
            </h3>
            <p className="text-xs text-[#9b8f79]">
              Clique em uma imagem para adicionar o link direto instantaneamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of presets */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {STOCK_PRESET_IMAGES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectUrl(preset.url);
                onClose();
              }}
              className="group text-left bg-[#131315] border border-[#27272a] hover:border-[#ffd165] rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-[#09090b]">
                <img
                  src={preset.url}
                  alt={preset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-2.5 py-1 bg-[#ffd165] text-[#131315] font-bold text-[11px] rounded-full shadow-md flex items-center gap-1">
                    <Check className="w-3 h-3" /> Usar Link
                  </span>
                </div>
              </div>
              <div className="p-2.5 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd165] block">
                  {preset.brand}
                </span>
                <p className="text-xs text-[#e5e1e4] font-medium line-clamp-2 leading-tight">
                  {preset.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
