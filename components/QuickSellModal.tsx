'use client';

import React, { useState } from 'react';
import { Watch, SaleDetails } from '@/types/watch';
import { formatCurrencyBrl } from '@/lib/storage';
import { X, DollarSign, Calendar, User, Phone, FileText } from 'lucide-react';

interface QuickSellModalProps {
  watch: Watch | null;
  onClose: () => void;
  onConfirmSale: (watchId: string, saleData: SaleDetails) => void;
}

export const QuickSellModal: React.FC<QuickSellModalProps> = ({
  watch,
  onClose,
  onConfirmSale
}) => {
  const [salePriceBrl, setSalePriceBrl] = useState<number>(
    watch ? (watch.marketPriceBrl || Math.round(watch.totalCostBrl * 1.25)) : 0
  );
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shippingAndFeesBrl, setShippingAndFeesBrl] = useState<number>(0);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerContact, setBuyerContact] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!watch) return null;

  const netProfit = salePriceBrl - watch.totalCostBrl - shippingAndFeesBrl;
  const marginPercent = salePriceBrl > 0 ? ((netProfit / salePriceBrl) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salePriceBrl || salePriceBrl <= 0) {
      alert('Informe um preço de venda válido.');
      return;
    }
    if (!buyerName.trim()) {
      alert('Informe o nome do comprador.');
      return;
    }

    onConfirmSale(watch.id, {
      salePriceBrl,
      saleDate,
      shippingAndFeesBrl,
      buyerName,
      buyerContact,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#131315]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4edea3]">
              Registrar Venda
            </span>
            <h3 className="text-lg font-bold text-[#e5e1e4] truncate">
              {watch.brand} - {watch.model}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {/* Watch Summary Card */}
          <div className="flex items-center gap-3 p-3 bg-[#131315] rounded-xl border border-[#27272a]">
            <img
              src={(watch.images && watch.images.length > 0 && watch.images[0]) || '/no-image.svg'}
              alt={watch.model}
              className="w-12 h-12 rounded-lg object-cover border border-[#27272a]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/no-image.svg';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#ffd165] font-bold">{watch.brand}</p>
              <p className="text-xs text-[#e5e1e4] font-medium truncate">{watch.model} ({watch.ref})</p>
              <p className="text-[11px] text-[#9b8f79] font-mono">
                Custo Total: {formatCurrencyBrl(watch.totalCostBrl)}
              </p>
            </div>
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
              Preço de Venda (BRL) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffd165] font-bold text-sm">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={salePriceBrl || ''}
                onChange={(e) => setSalePriceBrl(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-sm font-mono text-[#e5e1e4] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sale Date */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                Data da Venda *
              </label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
              />
            </div>

            {/* Fees & Shipping */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                Frete & Taxas Venda (BRL)
              </label>
              <input
                type="number"
                step="0.01"
                value={shippingAndFeesBrl || ''}
                onChange={(e) => setShippingAndFeesBrl(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none"
                placeholder="R$ 0"
              />
            </div>
          </div>

          {/* Buyer Name */}
          <div>
            <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
              Nome do Comprador *
            </label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Ex: João da Silva / Cliente Vip"
              className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
            />
          </div>

          {/* Buyer Contact */}
          <div>
            <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
              Contato do Comprador (Telefone/E-mail)
            </label>
            <input
              type="text"
              value={buyerContact}
              onChange={(e) => setBuyerContact(e.target.value)}
              placeholder="Ex: +55 11 99999-8888"
              className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Forma de pagamento, número da NF, local de entrega..."
              className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none resize-none"
            />
          </div>

          {/* Live Profit Preview */}
          <div className="p-4 bg-[#201f22] rounded-xl border border-[#27272a] flex justify-between items-center">
            <div>
              <span className="text-xs text-[#9b8f79] block">Lucro Líquido Previsto</span>
              <span className={`font-mono font-bold text-lg ${netProfit >= 0 ? 'text-[#4edea3]' : 'text-red-400'}`}>
                {formatCurrencyBrl(netProfit)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#9b8f79] block">Margem de Lucro</span>
              <span className={`font-mono font-bold text-sm ${marginPercent >= 0 ? 'text-[#4edea3]' : 'text-red-400'}`}>
                {marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#ffd165] text-[#131315] font-bold text-xs rounded-xl hover:bg-[#f7be1d] transition-colors shadow-lg"
            >
              Confirmar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
