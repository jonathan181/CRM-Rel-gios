'use client';

import React, { useState, useEffect } from 'react';
import { Watch, WatchStatus, CurrencyCode, SaleDetails } from '@/types/watch';
import { formatCurrencyBrl } from '@/lib/storage';
import { optimizeImageFile } from '@/lib/imageUtils';
import { ImagePresetsModal } from './ImagePresetsModal';
import { ErrorModal } from './ErrorModal';
import { 
  Plus, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Building2, 
  FileText, 
  Sparkles, 
  Check, 
  X,
  Watch as WatchIcon,
  HelpCircle,
  Image as ImageIcon,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface TransactionFormProps {
  initialWatch?: Watch | null;
  onSave: (watch: Watch) => Promise<boolean | void> | void;
  onCancel?: () => void;
}

const BRANDS_LIST = [
  'Seiko',
  'Orient',
  'Citizen',
  'Tissot',
  'Enicar',
  'Seagull',
  'Outro'
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialWatch,
  onSave,
  onCancel
}) => {
  // Brand selection
  const [selectedBrand, setSelectedBrand] = useState<string>(
    initialWatch ? (BRANDS_LIST.includes(initialWatch.brand) ? initialWatch.brand : 'Outro') : 'Seiko'
  );
  const [customBrand, setCustomBrand] = useState<string>(
    initialWatch && !BRANDS_LIST.includes(initialWatch.brand) ? initialWatch.brand : ''
  );

  const [model, setModel] = useState<string>(initialWatch?.model || '');
  const [ref, setRef] = useState<string>(initialWatch?.ref || '');
  const [serialNumber, setSerialNumber] = useState<string>(initialWatch?.serialNumber || '');
  const [condition, setCondition] = useState<string>(initialWatch?.condition || 'Novo / Unworn (100%)');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    initialWatch?.purchaseDate || ''
  );
  const [shipmentDateBrazil, setShipmentDateBrazil] = useState<string>(
    initialWatch?.shipmentDateBrazil || ''
  );
  const [arrivalDateBrazil, setArrivalDateBrazil] = useState<string>(
    initialWatch?.arrivalDateBrazil || ''
  );

  const [notSentYet, setNotSentYet] = useState<boolean>(
    initialWatch
      ? !initialWatch.shipmentDateBrazil && initialWatch.status === 'Em Trânsito'
      : false
  );
  const [notArrivedYet, setNotArrivedYet] = useState<boolean>(
    initialWatch
      ? (!initialWatch.arrivalDateBrazil && initialWatch.status === 'Em Trânsito')
      : false
  );

  // Currency & Financial calculation
  const [purchaseCurrency, setPurchaseCurrency] = useState<CurrencyCode>(
    initialWatch?.purchaseCurrency || 'CNY'
  );
  const [purchasePrice, setPurchasePrice] = useState<number>(initialWatch?.purchasePrice || 0);
  const [freightCost, setFreightCost] = useState<number>(initialWatch?.freightCost || 0);
  
  // Default exchange rates
  const getDefaultExchangeRate = (curr: CurrencyCode) => {
    if (curr === 'CNY') return 1.18;
    if (curr === 'USD') return 5.50;
    if (curr === 'EUR') return 6.00;
    return 1.0;
  };

  const [exchangeRate, setExchangeRate] = useState<number>(
    initialWatch?.exchangeRate || getDefaultExchangeRate('CNY')
  );
  const [taxesBrl, setTaxesBrl] = useState<number>(initialWatch?.taxesBrl || 0);
  const [marketPriceBrl, setMarketPriceBrl] = useState<number>(
    initialWatch?.marketPriceBrl || 0
  );

  const [supplier, setSupplier] = useState<string>(initialWatch?.supplier || '');
  const [notesAndSpecs, setNotesAndSpecs] = useState<string>(initialWatch?.notesAndSpecs || '');

  // Direct Image URLs and File Uploads
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialWatch?.images && initialWatch.images.length > 0
      ? initialWatch.images
      : []
  );
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isOptimizingImages, setIsOptimizingImages] = useState<boolean>(false);

  // Persistence, Loading & Error state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<{
    title?: string;
    message: string;
    details?: string;
    pendingWatch?: Watch;
  } | null>(null);

  // Status & Sale Registration
  const [status, setStatus] = useState<WatchStatus>(initialWatch?.status || 'Em Estoque');
  
  // Sale details if status is 'Vendido'
  const [salePriceBrl, setSalePriceBrl] = useState<number>(initialWatch?.sale?.salePriceBrl || 0);
  const [saleDate, setSaleDate] = useState<string>(
    initialWatch?.sale?.saleDate || new Date().toISOString().split('T')[0]
  );
  const [saleShippingAndFeesBrl, setSaleShippingAndFeesBrl] = useState<number>(
    initialWatch?.sale?.shippingAndFeesBrl || 0
  );
  const [buyerName, setBuyerName] = useState<string>(initialWatch?.sale?.buyerName || '');
  const [buyerContact, setBuyerContact] = useState<string>(initialWatch?.sale?.buyerContact || '');
  const [saleNotes, setSaleNotes] = useState<string>(initialWatch?.sale?.notes || '');

  // When currency changes, update default exchange rate if user hasn't explicitly set a custom one
  const handleCurrencyChange = (curr: CurrencyCode) => {
    setPurchaseCurrency(curr);
    setExchangeRate(getDefaultExchangeRate(curr));
  };

  // Compute total cost BRL
  const computedTotalCostBrl = Math.max(
    0,
    purchaseCurrency === 'BRL'
      ? purchasePrice + freightCost + taxesBrl
      : purchaseCurrency === 'CNY'
      ? (purchasePrice + freightCost) / (exchangeRate || 1) + taxesBrl
      : (purchasePrice + freightCost) * exchangeRate + taxesBrl
  );

  // Compute net profit & margin
  const computedNetProfit = salePriceBrl - computedTotalCostBrl - saleShippingAndFeesBrl;
  const computedMarginPercent = salePriceBrl > 0 ? ((computedNetProfit / salePriceBrl) * 100) : 0;

  // Handlers for "Ainda não enviado" and "Ainda não chegou"
  const handleToggleNotSentYet = () => {
    const nextVal = !notSentYet;
    setNotSentYet(nextVal);
    if (nextVal) {
      setShipmentDateBrazil('');
      setArrivalDateBrazil('');
      setNotArrivedYet(true);
      if (status === 'Em Estoque') {
        setStatus('Em Trânsito');
      }
    } else {
      setNotArrivedYet(false);
      if (status === 'Em Trânsito') {
        setStatus('Em Estoque');
      }
    }
  };

  const handleToggleNotArrivedYet = () => {
    const nextVal = !notArrivedYet;
    setNotArrivedYet(nextVal);
    if (nextVal) {
      setArrivalDateBrazil('');
      if (status === 'Em Estoque') {
        setStatus('Em Trânsito');
      }
    } else {
      if (!notSentYet && status === 'Em Trânsito') {
        setStatus('Em Estoque');
      }
    }
  };

  // Image handling helpers
  const handleAddDirectLink = () => {
    if (!newImageUrl.trim()) return;
    setImageUrls(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsOptimizingImages(true);

    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        if (file.size > 15 * 1024 * 1024) {
          setUploadError(`A imagem "${file.name}" excede o limite máximo permitido de 15 MB por foto.`);
          continue;
        }
        try {
          const optimizedDataUrl = await optimizeImageFile(file, 1600, 0.85);
          if (optimizedDataUrl) {
            setImageUrls(prev => [...prev, optimizedDataUrl]);
          }
        } catch (err: any) {
          console.error('Error optimizing image:', err);
          setUploadError(`Erro ao processar imagem "${file.name}". Tente novamente.`);
        }
      }
    } finally {
      setIsOptimizingImages(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const brand = (selectedBrand === 'Outro' || selectedBrand === 'Outra Marca...') ? customBrand.trim() : selectedBrand;
    if (!brand) {
      alert('Por favor, informe a marca do relógio.');
      return;
    }
    if (!model.trim()) {
      alert('Por favor, informe o modelo / referência.');
      return;
    }
    if (!purchaseDate) {
      alert('Por favor, informe a Data de Compra.');
      return;
    }

    const finalBrand = brand;
    const finalModel = model.trim();
    const finalRef = ref.trim() || 'N/A';

    let sale: SaleDetails | undefined = undefined;
    if (status === 'Vendido') {
      if (!salePriceBrl || salePriceBrl <= 0) {
        alert('Por favor, informe o Preço de Venda em BRL.');
        return;
      }
      sale = {
        salePriceBrl,
        saleDate,
        shippingAndFeesBrl: saleShippingAndFeesBrl,
        buyerName: buyerName.trim() || 'Cliente Não Identificado',
        buyerContact: buyerContact.trim(),
        notes: saleNotes.trim()
      };
    }

    let finalStatus = status;
    if ((notSentYet || notArrivedYet) && finalStatus !== 'Vendido' && finalStatus !== 'Consignação') {
      finalStatus = 'Em Trânsito';
    }

    const watchData: Watch = {
      id: initialWatch?.id || `w-${Date.now()}`,
      brand: finalBrand,
      model: finalModel,
      ref: finalRef,
      serialNumber: serialNumber.trim(),
      condition,
      purchaseDate,
      shipmentDateBrazil: notSentYet ? undefined : (shipmentDateBrazil || undefined),
      arrivalDateBrazil: (notArrivedYet || notSentYet) ? undefined : (arrivalDateBrazil || undefined),
      purchaseCurrency,
      purchasePrice,
      freightCost,
      exchangeRate: purchaseCurrency === 'BRL' ? 1.0 : exchangeRate,
      taxesBrl,
      totalCostBrl: Math.round(computedTotalCostBrl * 100) / 100,
      supplier: supplier.trim(),
      notesAndSpecs: notesAndSpecs.trim(),
      images: imageUrls,
      status: finalStatus,
      marketPriceBrl: marketPriceBrl > 0 ? marketPriceBrl : undefined,
      sale,
      createdAt: initialWatch?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await onSave(watchData);
      if (result === false) {
        // Error was triggered by onSave handler
        setSaveError({
          title: 'Erro ao Gravar no Banco de Dados',
          message: 'Não foi possível confirmar a gravação do relógio no servidor. Seus dados continuam no formulário.',
          pendingWatch: watchData
        });
      }
    } catch (err: any) {
      console.error('Error saving watch:', err);
      setSaveError({
        title: 'Erro ao Gravar no Banco de Dados',
        message: err?.message || 'Falha de conexão com o banco de dados ao salvar o relógio.',
        details: err?.stack || String(err),
        pendingWatch: watchData
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header banner */}
      <div className="flex items-center justify-between p-6 bg-[#18181b] rounded-2xl border border-[#27272a] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#ffd165]/10 border border-[#ffd165]/30 flex items-center justify-center text-[#ffd165]">
            <WatchIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#e5e1e4]">
              {initialWatch ? 'Editar Lançamento de Relógio' : 'Lançamento de Transação'}
            </h2>
            <p className="text-xs text-[#9b8f79]">
              Cadastre novos relógios no estoque, defina custos, cotações de câmbio e links diretos de fotos.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identificação do Relógio */}
        <div className="p-6 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 border-b border-[#27272a]">
            <span className="w-2 h-2 rounded-full bg-[#ffd165]" />
            <h3 className="font-bold text-sm text-[#e5e1e4] uppercase tracking-wider">
              1. Identificação do Relógio
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Marca */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Marca *
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-sm text-[#e5e1e4] outline-none"
              >
                {BRANDS_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {(selectedBrand === 'Outro' || selectedBrand === 'Outra Marca...') && (
                <input
                  type="text"
                  required
                  placeholder="Digite a marca..."
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="w-full mt-2 px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-sm text-[#e5e1e4] outline-none"
                />
              )}
            </div>

            {/* Modelo / Ref */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Modelo / Referência *
              </label>
              <input
                type="text"
                required
                placeholder="ex: SPB143J1 / Prospex ou 116500LN"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-sm text-[#e5e1e4] outline-none placeholder:text-[#9b8f79]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Detalhes Adicionais */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Detalhes Adicionais
              </label>
              <input
                type="text"
                placeholder="ex: R789234X, mostrador azul, etc."
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none placeholder:text-[#9b8f79]/50"
              />
            </div>

            {/* Condição */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Condição *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
              >
                <option value="Novo / Unworn (100%)">Novo / Unworn (100%)</option>
                <option value="Excelente (95-98%)">Excelente (95-98%)</option>
                <option value="Muito Bom (85-90%)">Muito Bom (85-90%)</option>
                <option value="Usado (70-80%)">Usado (70-80%)</option>
                <option value="60% (Pequenas marcas de uso)">60% (Pequenas marcas)</option>
                <option value="50%- (Marcas visíveis)">50%- (Marcas visíveis)</option>
              </select>
            </div>

            {/* Data de Compra */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Data de Compra *
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#27272a]/40">
            {/* Data de envio para Brasil */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#e5e1e4]">
                Data de envio para Brasil
              </label>
              <input
                type="date"
                disabled={notSentYet}
                value={shipmentDateBrazil}
                onChange={(e) => {
                  setShipmentDateBrazil(e.target.value);
                  if (e.target.value) setNotSentYet(false);
                }}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div>
                <button
                  type="button"
                  onClick={handleToggleNotSentYet}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    notSentYet
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                      : 'bg-[#131315] text-[#9b8f79] border-[#27272a] hover:text-[#e5e1e4] hover:border-[#353437]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${notSentYet ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span>Ainda não enviado</span>
                </button>
              </div>
            </div>

            {/* Data de chegada no Brasil */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#e5e1e4]">
                Data de chegada no Brasil
              </label>
              <input
                type="date"
                disabled={notArrivedYet || notSentYet}
                value={arrivalDateBrazil}
                onChange={(e) => {
                  setArrivalDateBrazil(e.target.value);
                  if (e.target.value) {
                    setNotArrivedYet(false);
                    setNotSentYet(false);
                  }
                }}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div>
                <button
                  type="button"
                  disabled={notSentYet}
                  onClick={handleToggleNotArrivedYet}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    notArrivedYet || notSentYet
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                      : 'bg-[#131315] text-[#9b8f79] border-[#27272a] hover:text-[#e5e1e4] hover:border-[#353437]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className={`w-2 h-2 rounded-full ${notArrivedYet || notSentYet ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span>Ainda não chegou</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Custos de Aquisição & Moeda */}
        <div className="p-6 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffd165]" />
              <h3 className="font-bold text-sm text-[#e5e1e4] uppercase tracking-wider">
                2. Custos de Aquisição & Câmbio
              </h3>
            </div>
            <span className="text-xs text-[#ffd165] font-mono font-semibold">
              Custo Total: {formatCurrencyBrl(computedTotalCostBrl)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Moeda */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Moeda
              </label>
              <select
                value={purchaseCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-bold text-[#ffd165] outline-none"
              >
                <option value="CNY">CNY (Yuan)</option>
                <option value="USD">USD (Dólar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="BRL">BRL (Real)</option>
              </select>
            </div>

            {/* Preço de Compra na Moeda */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Preço de Compra ({purchaseCurrency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none"
              />
            </div>

            {/* Frete na Moeda */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Frete ({purchaseCurrency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freightCost || ''}
                onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none"
              />
            </div>

            {/* Cotação Moeda/BRL ou BRL/CNY */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Cotação ({purchaseCurrency === 'CNY' ? 'BRL/CNY' : `${purchaseCurrency}/BRL`})
              </label>
              <input
                type="number"
                step="0.01"
                disabled={purchaseCurrency === 'BRL'}
                value={purchaseCurrency === 'BRL' ? 1.0 : exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder={purchaseCurrency === 'CNY' ? 'ex: 1.18' : 'ex: 5.50'}
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Taxas de Importação em BRL */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Taxas / Impostos (BRL)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxesBrl || ''}
                onChange={(e) => setTaxesBrl(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="R$ 0"
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none"
              />
            </div>

            {/* Preço de Mercado Estimado (BRL) */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Preço Estimado de Mercado (BRL)
              </label>
              <input
                type="number"
                step="0.01"
                value={marketPriceBrl || ''}
                onChange={(e) => setMarketPriceBrl(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="Ex: R$ 32.000"
                className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs font-mono text-[#ffd165] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fornecedor / Origem */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Fornecedor / Origem
              </label>
              <input
                type="text"
                placeholder="Nome do Revendedor / Leilão / Chrono24 / Japão"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
              />
            </div>

            {/* Informações Adicionais / Notas */}
            <div>
              <label className="block text-xs font-semibold text-[#e5e1e4] mb-1.5">
                Informações Adicionais / Especificações
              </label>
              <input
                type="text"
                placeholder="Caixa, documentos, detalhes de uso, precisão do movimento..."
                value={notesAndSpecs}
                onChange={(e) => setNotesAndSpecs(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Links Diretos de Imagem & Galeria */}
        <div className="p-6 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffd165]" />
              <h3 className="font-bold text-sm text-[#e5e1e4] uppercase tracking-wider flex items-center gap-2">
                <span>3. Upload & Links Diretos de Imagens</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffd165]/10 text-[#ffd165] font-normal lowercase">
                  URLs diretas ou arquivo
                </span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowPresetsModal(true)}
              className="text-xs font-semibold text-[#ffd165] hover:underline flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Ver Fotos em Alta Resolução</span>
            </button>
          </div>

          {/* Upload Error Alert Box */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start justify-between gap-3 text-red-200 text-xs animate-fadeIn shadow-lg">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-red-300 mb-0.5 text-xs">
                    Imagem não carregada (Excede o limite)
                  </h5>
                  <p className="text-red-200/90 leading-relaxed text-xs">{uploadError}</p>
                  <p className="text-[11px] text-red-300/80 mt-1">
                    💡 <strong>Solução rápida:</strong> Comprima a foto ou reduza a resolução antes de enviá-la para garantir o processamento rápido no sistema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-red-400 hover:text-red-200 p-1 transition-colors rounded-lg hover:bg-red-500/20 flex-shrink-0"
                title="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Direct Link Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#e5e1e4]">
              Adicionar Link Direto de Foto (URL do HTML / Unsplash / CDN)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-[#9b8f79] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://exemplo.com/relogio.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl text-xs text-[#e5e1e4] outline-none font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddDirectLink}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#353437] text-[#ffd165] font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Link</span>
              </button>
            </div>
          </div>

          {/* Dropzone File Upload */}
          <div className="relative border-2 border-dashed border-[#27272a] hover:border-[#ffd165]/50 rounded-2xl p-6 text-center bg-[#131315]/50 transition-colors group">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center text-[#ffd165] group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#e5e1e4]">
                  Arraste e solte fotos de alta resolução do mostrador
                </p>
                <p className="text-[11px] text-[#9b8f79] mt-0.5">
                  JPEG, PNG ou WebP. Até 10MB por foto.
                </p>
              </div>
            </div>
          </div>

          {/* Current Images List or Empty State */}
          {imageUrls.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-[#e5e1e4]">
                Fotos Adicionadas ({imageUrls.length}):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-[#131315] border border-[#27272a]"
                  >
                    <img
                      src={url}
                      alt={`Relógio ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/no-image.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#ffd165] text-[#131315] font-bold text-[9px] rounded">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-[#131315] rounded-xl border border-[#27272a]">
              <img
                src="/no-image.svg"
                alt="Sem imagem"
                className="w-16 h-16 rounded-lg object-cover border border-[#27272a] flex-shrink-0"
              />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-[#e5e1e4]">
                  Nenhuma foto adicionada ainda
                </p>
                <p className="text-[#9b8f79]">
                  Você pode adicionar sua própria foto acima. Se não enviar nenhuma imagem, o relógio será exibido no estoque com a imagem padrão de exemplo ao lado.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Status do Estoque & Registrar Venda */}
        <div className="p-6 bg-[#18181b] rounded-2xl border border-[#27272a] space-y-4 shadow-md">
          <div className="flex items-center gap-2 pb-3 border-b border-[#27272a]">
            <span className="w-2 h-2 rounded-full bg-[#ffd165]" />
            <h3 className="font-bold text-sm text-[#e5e1e4] uppercase tracking-wider">
              4. Status do Estoque & Venda
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus('Em Estoque');
                setNotSentYet(false);
                setNotArrivedYet(false);
              }}
              className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                status === 'Em Estoque'
                  ? 'bg-[#ffd165] text-[#131315] border-[#ffd165] shadow-lg scale-[1.02]'
                  : 'bg-[#131315] text-[#e5e1e4] border-[#27272a] hover:border-[#ffd165]/50'
              }`}
            >
              Em Estoque
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus('Em Trânsito');
                if (!notSentYet && !notArrivedYet) {
                  setNotArrivedYet(true);
                }
              }}
              className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                status === 'Em Trânsito'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg scale-[1.02]'
                  : 'bg-[#131315] text-[#e5e1e4] border-[#27272a] hover:border-blue-500/50'
              }`}
            >
              Em Trânsito
            </button>

            <button
              type="button"
              onClick={() => setStatus('Consignação')}
              className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                status === 'Consignação'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-[1.02]'
                  : 'bg-[#131315] text-[#e5e1e4] border-[#27272a] hover:border-purple-500/50'
              }`}
            >
              Consignação
            </button>

            <button
              type="button"
              onClick={() => setStatus('Vendido')}
              className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                status === 'Vendido'
                  ? 'bg-[#4edea3] text-[#003824] border-[#4edea3] shadow-lg scale-[1.02]'
                  : 'bg-[#131315] text-[#e5e1e4] border-[#27272a] hover:border-[#4edea3]/50'
              }`}
            >
              Vendido
            </button>
          </div>

          {/* Optional Sales Form fields if Status === 'Vendido' */}
          {status === 'Vendido' && (
            <div className="p-4 bg-[#003824]/10 border border-[#4edea3]/30 rounded-xl space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
                Registrar Dados da Venda
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                    Preço de Venda (BRL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salePriceBrl || ''}
                    onChange={(e) => setSalePriceBrl(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="R$ 0"
                    className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#4edea3] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                    Data da Venda *
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#4edea3] rounded-xl text-xs text-[#e5e1e4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                    Frete & Taxas Venda (BRL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleShippingAndFeesBrl || ''}
                    onChange={(e) => setSaleShippingAndFeesBrl(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="R$ 0"
                    className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#4edea3] rounded-xl text-xs font-mono text-[#e5e1e4] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                    Nome do Comprador / Usuário
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do Cliente"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#4edea3] rounded-xl text-xs text-[#e5e1e4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#e5e1e4] mb-1">
                    Contato do Comprador
                  </label>
                  <input
                    type="text"
                    placeholder="Telefone / WhatsApp / E-mail"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131315] border border-[#27272a] focus:border-[#4edea3] rounded-xl text-xs text-[#e5e1e4] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumo Financeiro Preview */}
          <div className="p-4 bg-[#201f22] rounded-xl border border-[#27272a] flex justify-between items-center">
            <div>
              <span className="text-xs text-[#9b8f79] block">
                {status === 'Vendido' ? 'Lucro Líquido Realizado' : 'Margem Estimada de Lucro'}
              </span>
              <span
                className={`font-mono font-bold text-lg ${
                  computedNetProfit >= 0 ? 'text-[#4edea3]' : 'text-red-400'
                }`}
              >
                {formatCurrencyBrl(computedNetProfit)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#9b8f79] block">Margem %</span>
              <span
                className={`font-mono font-bold text-base ${
                  computedMarginPercent >= 0 ? 'text-[#4edea3]' : 'text-red-400'
                }`}
              >
                {computedMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
          {isOptimizingImages && (
            <div className="flex items-center gap-2 text-xs text-[#ffd165] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Otimizando imagens em alta resolução...</span>
            </div>
          )}
          {!isOptimizingImages && <div />}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="px-6 py-3 text-xs font-bold text-[#9b8f79] hover:text-[#e5e1e4] hover:bg-[#27272a] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving || isOptimizingImages}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#ffd165] text-[#131315] font-bold text-sm rounded-xl hover:bg-[#f7be1d] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gravando no Banco de Dados...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialWatch ? 'Atualizar Registro' : 'Salvar Registro'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preset Modal */}
      {showPresetsModal && (
        <ImagePresetsModal
          onSelectUrl={(url) => setImageUrls(prev => [...prev, url])}
          onClose={() => setShowPresetsModal(false)}
        />
      )}

      {/* Database Persistence / Connection Error Pop-up Modal */}
      <ErrorModal
        isOpen={saveError !== null}
        title={saveError?.title || 'Erro ao Gravar no Banco de Dados'}
        errorMessage={saveError?.message || 'Ocorreu um erro ao persistir o relógio.'}
        technicalDetails={saveError?.details}
        onRetry={() => {
          setSaveError(null);
          handleSubmit();
        }}
        onClose={() => setSaveError(null)}
        retryLabel="Tentar Gravar Novamente"
        closeLabel="Fechar e Revisar Dados"
      />
    </div>
  );
};
