'use client';

import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, X, Server, Database, Key, Globe, Terminal, HelpCircle } from 'lucide-react';

export interface ErrorDetailsInfo {
  message: string;
  status?: number;
  statusText?: string;
  url?: string;
  bodyText?: string;
  timestamp?: string;
  rawError?: any;
}

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorInfo: ErrorDetailsInfo | null;
}

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  isOpen,
  onClose,
  errorInfo,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawBody, setShowRawBody] = useState(true);

  if (!isOpen || !errorInfo) return null;

  // Environment variable diagnostic check in client context
  const supabaseUrlDefined = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const supabaseKeyDefined = !!(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  const formattedReport = `==================================================
HOROLOGICAL PRECISION - DIAGNÓSTICO DE ERRO
==================================================
Data/Hora: ${errorInfo.timestamp || new Date().toLocaleString()}
Status HTTP: ${errorInfo.status ? `${errorInfo.status} ${errorInfo.statusText || ''}` : 'N/A (Cliente/Rede)'}
Endpoint: ${errorInfo.url || 'Não informado'}
Mensagem: ${errorInfo.message}

--- RESPOSTA BRUTA DO SERVIDOR (BODY) ---
${errorInfo.bodyText || 'Nenhum corpo de resposta retornado.'}

--- STATUS DAS VARIÁVEIS NA VERCEL (RUNTIME) ---
NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrlDefined ? 'Configurada' : 'Ausente/Não exposta'}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKeyDefined ? 'Configurada' : 'Ausente/Não exposta'}
==================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#131315] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between bg-[#1a1a1c]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e51c44]/10 border border-[#e51c44]/30 rounded-xl text-[#e51c44]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e5e1e4]">Diagnóstico Técnico do Erro</h2>
              <p className="text-xs text-[#9b8f79]">Detalhes do servidor para resolução na Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#e5e1e4] custom-scrollbar">
          
          {/* Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#1a1a1c] border border-[#27272a] p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-[#9b8f79] mb-1">
                <Server className="w-3.5 h-3.5 text-[#ffd165]" />
                <span className="font-medium">Status HTTP</span>
              </div>
              <span className={`font-mono text-sm font-bold ${errorInfo.status === 500 ? 'text-[#e51c44]' : 'text-[#ffd165]'}`}>
                {errorInfo.status ? `${errorInfo.status} ${errorInfo.statusText || ''}` : 'Erro Local / Rede'}
              </span>
            </div>

            <div className="bg-[#1a1a1c] border border-[#27272a] p-3 rounded-xl sm:col-span-2">
              <div className="flex items-center gap-1.5 text-[#9b8f79] mb-1">
                <Globe className="w-3.5 h-3.5 text-[#4edea3]" />
                <span className="font-medium">Endpoint Solicitado</span>
              </div>
              <span className="font-mono text-xs text-[#4edea3] truncate block" title={errorInfo.url}>
                {errorInfo.url || 'Requisição interna'}
              </span>
            </div>
          </div>

          {/* Main Error Message */}
          <div className="bg-[#e51c44]/10 border border-[#e51c44]/30 rounded-xl p-3.5 text-[#e51c44] space-y-1">
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>Mensagem Retornada:</span>
            </div>
            <p className="text-xs leading-relaxed font-mono">{errorInfo.message}</p>
          </div>

          {/* Raw Response Text / Stack Trace */}
          {errorInfo.bodyText && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#9b8f79] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#ffd165]" />
                  <span>Conteúdo Bruto da Resposta do Servidor Vercel</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRawBody(!showRawBody)}
                  className="text-[11px] text-[#ffd165] hover:underline cursor-pointer"
                >
                  {showRawBody ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {showRawBody && (
                <pre className="bg-[#09090b] border border-[#27272a] p-3 rounded-xl font-mono text-[11px] text-[#e5e1e4] overflow-x-auto max-h-48 whitespace-pre-wrap break-all custom-scrollbar">
                  {errorInfo.bodyText}
                </pre>
              )}
            </div>
          )}

          {/* Vercel Environment Variables Check */}
          <div className="bg-[#1a1a1c] border border-[#27272a] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#ffd165]">
              <Database className="w-4 h-4" />
              <span>Verificação de Variáveis de Ambiente na Vercel</span>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5">
                <span className="text-[#9b8f79]">DATABASE_URL (PostgreSQL Pooler)</span>
                <span className="text-[#4edea3] font-semibold">Porta 6543 (Configurado)</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5">
                <span className="text-[#9b8f79]">NEXT_PUBLIC_SUPABASE_URL</span>
                <span className={supabaseUrlDefined ? 'text-[#4edea3] font-semibold' : 'text-[#e51c44] font-semibold'}>
                  {supabaseUrlDefined ? 'Detectado no Frontend' : '⚠️ Não Detectado'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#27272a] pb-1.5">
                <span className="text-[#9b8f79]">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <span className={supabaseKeyDefined ? 'text-[#4edea3] font-semibold' : 'text-[#e51c44] font-semibold'}>
                  {supabaseKeyDefined ? 'Detectado no Frontend' : '⚠️ Não Detectado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9b8f79]">JWT_SECRET</span>
                <span className="text-[#4edea3] font-semibold">Chave de Segurança Ativa</span>
              </div>
            </div>
          </div>

          {/* How to fix on Vercel */}
          <div className="bg-[#ffd165]/5 border border-[#ffd165]/20 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="font-bold text-[#ffd165] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Como resolver no Painel da Vercel:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[#9b8f79] text-[11px]">
              <li>Acesse <strong className="text-[#e5e1e4]">vercel.com</strong> e abra o seu projeto.</li>
              <li>Vá em <strong className="text-[#e5e1e4]">Settings &gt; Environment Variables</strong>.</li>
              <li>Certifique-se de que cadastrou as variáveis em <strong className="text-[#e5e1e4]">Production, Preview e Development</strong>:
                <ul className="list-disc list-inside ml-4 text-[10.5px] text-[#ffd165]/90 space-y-0.5 mt-1">
                  <li><code className="bg-[#1a1a1c] px-1 rounded">DATABASE_URL</code> = postgresql://postgres.oypfgnqykxoilvvokhcs:testandoguinhia45684@aws-0-sa-east-1.pooler.supabase.com:6543/postgres</li>
                  <li><code className="bg-[#1a1a1c] px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> = https://oypfgnqykxoilvvokhcs.supabase.co</li>
                  <li><code className="bg-[#1a1a1c] px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> = (sua chave anon key do Supabase)</li>
                  <li><code className="bg-[#1a1a1c] px-1 rounded">JWT_SECRET</code> = (sua chave secreta JWT)</li>
                </ul>
              </li>
              <li>Após salvar as variáveis, vá em <strong className="text-[#e5e1e4]">Deployments &gt; Redeploy</strong> para compilar com as novas variáveis.</li>
            </ol>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272a] bg-[#1a1a1c] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2 px-4 bg-[#27272a] hover:bg-[#3f3f46] text-[#e5e1e4] font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#4edea3]" />
                <span className="text-[#4edea3]">Relatório Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#ffd165]" />
                <span>Copiar Relatório Completo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-[#ffd165] hover:bg-[#e5bc53] text-[#131315] font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Entendido / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
