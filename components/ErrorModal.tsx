'use client';

import React from 'react';
import { AlertCircle, WifiOff, RefreshCw, X, Database, ShieldAlert } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  errorMessage: string;
  technicalDetails?: string;
  onRetry?: () => void;
  onClose: () => void;
  retryLabel?: string;
  closeLabel?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title = 'Falha ao Gravar no Banco de Dados',
  errorMessage,
  technicalDetails,
  onRetry,
  onClose,
  retryLabel = 'Tentar Gravar Novamente',
  closeLabel = 'Fechar e Revisar Dados'
}) => {
  if (!isOpen) return null;

  const isNetworkIssue =
    errorMessage.toLowerCase().includes('conexão') ||
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('failed to fetch') ||
    errorMessage.toLowerCase().includes('internet') ||
    errorMessage.toLowerCase().includes('timeout');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#18181b] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-full transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-red-400">
            {isNetworkIssue ? <WifiOff className="w-6 h-6" /> : <Database className="w-6 h-6" />}
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold text-[#e5e1e4] leading-tight">
              {title}
            </h3>
            <p className="text-xs text-red-300/90 font-medium mt-1.5 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>

        {/* Security & safety reassurance */}
        <div className="p-3.5 bg-[#131315] rounded-xl border border-[#27272a] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ffd165]">
            <ShieldAlert className="w-4 h-4 text-[#ffd165] flex-shrink-0" />
            <span>Seus dados não foram perdidos</span>
          </div>
          <p className="text-xs text-[#9b8f79] leading-relaxed">
            As informações preenchidas continuam salvas no formulário. Verifique sua conexão com a internet e tente gravar novamente.
          </p>

          {technicalDetails && (
            <div className="mt-2 pt-2 border-t border-[#27272a]/60">
              <span className="text-[10px] font-mono text-[#9b8f79] block mb-1">
                Detalhes do erro do servidor:
              </span>
              <pre className="text-[11px] font-mono text-red-400/90 bg-[#09090b] p-2 rounded-lg border border-[#27272a] overflow-x-auto whitespace-pre-wrap">
                {technicalDetails}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 border-t border-[#27272a]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#201f22] border border-[#27272a] text-[#e5e1e4] hover:bg-[#27272a] font-semibold text-xs rounded-xl transition-all cursor-pointer text-center"
          >
            {closeLabel}
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto px-5 py-2.5 bg-red-500 text-white hover:bg-red-600 font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{retryLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
