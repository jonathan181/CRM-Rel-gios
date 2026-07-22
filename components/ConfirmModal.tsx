'use client';

import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDanger
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : isWarning
                ? 'bg-[#ffd165]/10 border border-[#ffd165]/20 text-[#ffd165]'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            }`}
          >
            {isDanger ? (
              <Trash2 className="w-6 h-6" />
            ) : isWarning ? (
              <RotateCcw className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#e5e1e4] leading-tight">{title}</h3>
            <p className="text-xs text-[#9b8f79] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272a]">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#201f22] border border-[#27272a] text-[#e5e1e4] hover:bg-[#27272a] font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer ${
              isDanger
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                : isWarning
                ? 'bg-[#ffd165] text-[#131315] hover:bg-[#ffe082]'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
