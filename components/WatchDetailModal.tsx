'use client';

import React, { useState } from 'react';
import { Watch } from '@/types/watch';
import { formatCurrencyBrl, formatDatePtBr, formatCurrencyUsd } from '@/lib/storage';
import { ConfirmModal } from './ConfirmModal';
import { X, Calendar, DollarSign, Tag, User, MapPin, FileText, ExternalLink, Copy, Check, Edit, Trash2, DollarSign as SellIcon, ShieldCheck } from 'lucide-react';

interface WatchDetailModalProps {
  watch: Watch | null;
  onClose: () => void;
  onEdit: (watch: Watch) => void;
  onQuickSell: (watch: Watch) => void;
  onDelete: (id: string) => void;
}

export const WatchDetailModal: React.FC<WatchDetailModalProps> = ({
  watch,
  onClose,
  onEdit,
  onQuickSell,
  onDelete
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!watch) return null;

  const activeImage = (watch.images && watch.images.length > 0 && (watch.images[activeImageIndex] || watch.images[0])) || '/no-image.svg';

  const isSold = watch.status === 'Vendido';
  const isConsignment = watch.status === 'Consignação';

  const salePriceBrl = watch.sale?.salePriceBrl || 0;
  const feesBrl = watch.sale?.shippingAndFeesBrl || 0;
  const netProfit = isSold ? (salePriceBrl - watch.totalCostBrl - feesBrl) : 0;
  const marginPercent = isSold && salePriceBrl > 0 ? ((netProfit / salePriceBrl) * 100) : 0;

  const handleCopyLink = () => {
    if (activeImage) {
      navigator.clipboard.writeText(activeImage);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#131315]">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider border ${
                isSold
                  ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                  : isConsignment
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-[#ffd165]/10 text-[#ffd165] border-[#ffd165]/30'
              }`}
            >
              {watch.status}
            </span>
            <span className="text-xs text-[#9b8f79] font-mono">ID: {watch.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(watch);
              }}
              className="p-2 text-[#e5e1e4] hover:text-[#ffd165] hover:bg-[#27272a] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>

            {!isSold && (
              <button
                onClick={() => {
                  onClose();
                  onQuickSell(watch);
                }}
                className="px-3 py-1.5 bg-[#4edea3] text-[#003824] hover:bg-[#3ecb93] font-bold text-xs rounded-lg transition-all flex items-center gap-1"
              >
                <SellIcon className="w-4 h-4" />
                <span>Registrar Venda</span>
              </button>
            )}

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Main Grid: Gallery & Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Gallery Left Column */}
            <div className="md:col-span-6 space-y-3">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#09090b] border border-[#27272a] group">
                <img
                  src={activeImage}
                  alt={`${watch.brand} ${watch.model}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/no-image.svg';
                  }}
                />

                <button
                  onClick={handleCopyLink}
                  className="absolute bottom-3 right-3 px-2.5 py-1.5 bg-[#131315]/80 backdrop-blur-md hover:bg-[#131315] border border-[#27272a] text-[#ffd165] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-lg"
                  title="Copiar link direto desta imagem"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Link Copiado!' : 'Copiar URL da Foto'}</span>
                </button>
              </div>

              {/* Thumbnails list */}
              {watch.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {watch.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeImageIndex === idx ? 'border-[#ffd165] scale-105' : 'border-[#27272a] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Direct image link info box */}
              <div className="p-3 bg-[#131315] rounded-xl border border-[#27272a] text-xs text-[#9b8f79] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#e5e1e4]">Link Direto da Imagem Ativa:</span>
                  <a
                    href={activeImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ffd165] hover:underline flex items-center gap-1"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="font-mono text-[11px] truncate text-[#9b8f79]">{activeImage}</p>
              </div>
            </div>

            {/* Info Right Column */}
            <div className="md:col-span-6 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ffd165] mb-1">
                  {watch.brand}
                </p>
                <h3 className="text-2xl font-bold text-[#e5e1e4] leading-tight">
                  {watch.model}
                </h3>
                {watch.ref && watch.ref.trim().toUpperCase() !== 'N/A' && watch.ref.trim() !== '' && watch.ref.trim() !== '-' && (
                  <p className="text-sm font-mono text-[#9b8f79] mt-1">Ref. {watch.ref}</p>
                )}
              </div>

              {/* Badges / Quick attributes */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#131315] rounded-xl border border-[#27272a]">
                <div>
                  <p className="text-xs text-[#9b8f79]">Condição</p>
                  <p className="text-sm font-semibold text-[#e5e1e4]">{watch.condition}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9b8f79]">Detalhes Adicionais</p>
                  <p className="text-sm font-semibold text-[#e5e1e4] truncate" title={watch.serialNumber || watch.notesAndSpecs || 'N/A'}>
                    {watch.serialNumber || watch.notesAndSpecs || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9b8f79]">Data de Compra</p>
                  <p className="text-sm font-semibold text-[#e5e1e4]">
                    {formatDatePtBr(watch.purchaseDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9b8f79]">Fornecedor / Origem</p>
                  <p className="text-sm font-semibold text-[#e5e1e4] truncate">
                    {watch.supplier || 'Não informado'}
                  </p>
                </div>
                {watch.shipmentDateBrazil && (
                  <div>
                    <p className="text-xs text-[#9b8f79]">Envio p/ Brasil</p>
                    <p className="text-sm font-semibold text-[#e5e1e4]">
                      {formatDatePtBr(watch.shipmentDateBrazil)}
                    </p>
                  </div>
                )}
                {watch.arrivalDateBrazil && (
                  <div>
                    <p className="text-xs text-[#9b8f79]">Chegada no Brasil</p>
                    <p className="text-sm font-semibold text-[#e5e1e4]">
                      {formatDatePtBr(watch.arrivalDateBrazil)}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Box */}
              <div className="p-4 bg-[#201f22] rounded-xl border border-[#27272a] space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#ffd165]">
                  Resumo Financeiro da Transação
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-[#9b8f79] block">Preço de Compra</span>
                    <span className="font-mono text-[#e5e1e4]">
                      {watch.purchaseCurrency} {watch.purchasePrice.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-[#9b8f79] block">Cotação Moeda</span>
                    <span className="font-mono text-[#e5e1e4]">
                      {watch.purchaseCurrency === 'CNY'
                        ? `R$ 1,00 = ${watch.exchangeRate.toFixed(2)} CNY`
                        : watch.purchaseCurrency === 'BRL'
                        ? '1,00 (BRL)'
                        : `1 ${watch.purchaseCurrency} = R$ ${watch.exchangeRate.toFixed(2)}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-[#9b8f79] block">Frete + Taxas (BRL)</span>
                    <span className="font-mono text-[#e5e1e4]">
                      {formatCurrencyBrl(
                        watch.purchaseCurrency === 'CNY'
                          ? (watch.freightCost / (watch.exchangeRate || 1)) + watch.taxesBrl
                          : watch.purchaseCurrency === 'BRL'
                          ? watch.freightCost + watch.taxesBrl
                          : (watch.freightCost * watch.exchangeRate) + watch.taxesBrl
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-[#9b8f79] block font-bold text-[#e5e1e4]">Custo Total Acumulado</span>
                    <span className="font-mono font-bold text-[#ffd165]">
                      {formatCurrencyBrl(watch.totalCostBrl)}
                    </span>
                  </div>
                </div>

                {/* Market Price or Sale Result */}
                {!isSold ? (
                  <div className="pt-3 border-t border-[#27272a] flex justify-between items-center">
                    <div>
                      <span className="text-xs text-[#9b8f79]">Preço Estimado de Mercado</span>
                      <p className="font-mono font-bold text-lg text-[#ffd165]">
                        {watch.marketPriceBrl ? formatCurrencyBrl(watch.marketPriceBrl) : 'Em Avaliação'}
                      </p>
                    </div>
                    {watch.marketPriceBrl && watch.marketPriceBrl > watch.totalCostBrl && (
                      <div className="text-right">
                        <span className="text-xs text-[#9b8f79]">Margem Estimada</span>
                        <p className="font-mono font-bold text-[#4edea3]">
                          +
                          {(
                            ((watch.marketPriceBrl - watch.totalCostBrl) /
                              watch.marketPriceBrl) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#27272a] space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div className="flex flex-col justify-between">
                        <span className="text-xs text-[#9b8f79] block leading-tight">Preço de Venda</span>
                        <span className="font-mono font-bold text-[#e5e1e4] mt-auto pt-1">
                          {formatCurrencyBrl(salePriceBrl)}
                        </span>
                      </div>
                      <div className="flex flex-col justify-between">
                        <span className="text-xs text-[#9b8f79] block leading-tight">Taxas de Venda</span>
                        <span className="font-mono font-bold text-[#e5e1e4] mt-auto pt-1">
                          {formatCurrencyBrl(feesBrl)}
                        </span>
                      </div>
                      <div className="flex flex-col justify-between">
                        <span className="text-xs text-[#9b8f79] block leading-tight">Lucro Líquido</span>
                        <span className={`font-mono font-bold mt-auto pt-1 ${netProfit >= 0 ? 'text-[#4edea3]' : 'text-red-400'}`}>
                          {formatCurrencyBrl(netProfit)}
                        </span>
                      </div>
                      <div className="flex flex-col justify-between">
                        <span className="text-xs text-[#9b8f79] block leading-tight">Margem %</span>
                        <span className={`font-mono font-bold mt-auto pt-1 ${marginPercent >= 0 ? 'text-[#4edea3]' : 'text-red-400'}`}>
                          {marginPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buyer Details (if sold) */}
          {isSold && watch.sale && (
            <div className="p-4 bg-[#003824]/20 border border-[#4edea3]/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[#4edea3] font-bold text-sm">
                <User className="w-4 h-4" />
                <span>Dados da Venda e Comprador</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#9b8f79]">Comprador:</span>
                  <p className="font-semibold text-[#e5e1e4]">{watch.sale.buyerName || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-[#9b8f79]">Contato:</span>
                  <p className="font-semibold text-[#e5e1e4]">{watch.sale.buyerContact || '-'}</p>
                </div>
                <div>
                  <span className="text-[#9b8f79]">Data da Venda:</span>
                  <p className="font-semibold text-[#e5e1e4]">{formatDatePtBr(watch.sale.saleDate)}</p>
                </div>
              </div>
              {watch.sale.notes && (
                <p className="text-xs text-[#9b8f79] pt-1 border-t border-[#4edea3]/20">
                  <strong className="text-[#e5e1e4]">Observações da Venda:</strong> {watch.sale.notes}
                </p>
              )}
            </div>
          )}

          {/* Notes and Specs */}
          {watch.notesAndSpecs && (
            <div className="p-4 bg-[#131315] rounded-xl border border-[#27272a] space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffd165] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Notas & Especificações Técnicas</span>
              </span>
              <p className="text-xs text-[#e5e1e4]/90 whitespace-pre-wrap leading-relaxed">
                {watch.notesAndSpecs}
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Relógio"
        description={`Tem certeza que deseja excluir o relógio "${watch.brand} ${watch.model}" (Ref. ${watch.ref})? Esta ação removerá o item permanentemente do sistema.`}
        confirmLabel="Excluir Definitivamente"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          onDelete(watch.id);
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
