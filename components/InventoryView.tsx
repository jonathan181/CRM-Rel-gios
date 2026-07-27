'use client';

import React, { useState, useMemo } from 'react';
import { Watch, WatchStatus } from '@/types/watch';
import { formatCurrencyBrl, calculateInventoryStats, formatDatePtBr } from '@/lib/storage';
import { WatchDetailModal } from './WatchDetailModal';
import { QuickSellModal } from './QuickSellModal';
import { ConfirmModal } from './ConfirmModal';
import { 
  Search, 
  Filter, 
  Watch as WatchIcon, 
  TrendingUp, 
  Edit, 
  DollarSign, 
  ArrowRight, 
  Grid, 
  List, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Receipt,
  Trash2
} from 'lucide-react';

interface InventoryViewProps {
  watches: Watch[];
  isLoading?: boolean;
  isSyncing?: boolean;
  onEditWatch: (watch: Watch) => void;
  onConfirmSale: (watchId: string, saleData: any) => void;
  onDeleteWatch: (watchId: string) => void;
  onAddNewClick: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  watches,
  isLoading = false,
  isSyncing = false,
  onEditWatch,
  onConfirmSale,
  onDeleteWatch,
  onAddNewClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<'recent' | 'price-desc' | 'price-asc' | 'profit-desc'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [detailWatch, setDetailWatch] = useState<Watch | null>(null);
  const [sellWatch, setSellWatch] = useState<Watch | null>(null);
  const [deletingWatch, setDeletingWatch] = useState<Watch | null>(null);

  // Compute Stats
  const stats = useMemo(() => calculateInventoryStats(watches), [watches]);

  // Unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(watches.map((w) => w.brand)));
    return list.sort();
  }, [watches]);

  // Filtered & Sorted Watches
  const filteredWatches = useMemo(() => {
    return watches
      .filter((w) => {
        // Status filter
        if (selectedStatus !== 'Todos' && w.status !== selectedStatus) {
          return false;
        }
        // Brand filter
        if (selectedBrand !== 'Todas' && w.brand !== selectedBrand) {
          return false;
        }
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchBrand = w.brand.toLowerCase().includes(q);
          const matchModel = w.model.toLowerCase().includes(q);
          const matchRef = w.ref.toLowerCase().includes(q);
          const matchSerial = w.serialNumber?.toLowerCase().includes(q) || false;
          const matchSupplier = w.supplier.toLowerCase().includes(q);
          const matchBuyer = w.sale?.buyerName.toLowerCase().includes(q) || false;

          if (
            !matchBrand &&
            !matchModel &&
            !matchRef &&
            !matchSerial &&
            !matchSupplier &&
            !matchBuyer
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Status priority order: 1. Em Estoque, 2. Consignação, 3. Vendido
        const STATUS_PRIORITY: Record<string, number> = {
          'Em Estoque': 1,
          'Consignação': 2,
          'Vendido': 3
        };

        const priorityA = STATUS_PRIORITY[a.status] ?? 99;
        const priorityB = STATUS_PRIORITY[b.status] ?? 99;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        if (sortBy === 'price-desc') {
          const valA = a.marketPriceBrl || a.totalCostBrl;
          const valB = b.marketPriceBrl || b.totalCostBrl;
          return valB - valA;
        }
        if (sortBy === 'price-asc') {
          const valA = a.marketPriceBrl || a.totalCostBrl;
          const valB = b.marketPriceBrl || b.totalCostBrl;
          return valA - valB;
        }
        if (sortBy === 'profit-desc') {
          const profitA = a.sale ? (a.sale.salePriceBrl - a.totalCostBrl - a.sale.shippingAndFeesBrl) : 0;
          const profitB = b.sale ? (b.sale.salePriceBrl - b.totalCostBrl - b.sale.shippingAndFeesBrl) : 0;
          return profitB - profitA;
        }

        // default recent: sort by registration date descending (most recently registered first)
        const timeA = new Date(a.createdAt || a.purchaseDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.purchaseDate || 0).getTime();
        return timeB - timeA;
      });
  }, [watches, selectedStatus, selectedBrand, searchTerm, sortBy]);

  const isDataLoading = isLoading || (watches.length === 0 && isSyncing);

  const groupedSections = useMemo(() => {
    const stock = filteredWatches.filter(
      (w) => (w.status || '').toLowerCase() === 'em estoque'
    );
    const consignment = filteredWatches.filter((w) => {
      const s = (w.status || '').toLowerCase();
      return s === 'consignação' || s === 'consignacao';
    });
    const sold = filteredWatches.filter(
      (w) => (w.status || '').toLowerCase() === 'vendido'
    );
    const other = filteredWatches.filter((w) => {
      const s = (w.status || '').toLowerCase();
      return (
        s !== 'em estoque' &&
        s !== 'consignação' &&
        s !== 'consignacao' &&
        s !== 'vendido'
      );
    });

    const sections = [
      {
        title: 'Em Estoque',
        key: 'em-estoque',
        badgeColor: 'border-[#ffd165]/40 bg-[#ffd165]/10 text-[#ffd165]',
        watches: stock,
      },
      {
        title: 'Consignação',
        key: 'consignacao',
        badgeColor: 'border-blue-400/40 bg-blue-500/10 text-blue-400',
        watches: consignment,
      },
      {
        title: 'Vendidos',
        key: 'vendidos',
        badgeColor: 'border-[#4edea3]/40 bg-[#4edea3]/10 text-[#4edea3]',
        watches: sold,
      },
    ];

    if (other.length > 0) {
      sections.push({
        title: 'Outros Status',
        key: 'outros',
        badgeColor: 'border-gray-400/40 bg-gray-500/10 text-gray-300',
        watches: other,
      });
    }

    return sections.filter((sec) => sec.watches.length > 0);
  }, [filteredWatches]);

  return (
    <div className="space-y-6 pb-24">
      {/* Bento Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Card 1: Valor do Estoque Ativo */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 hover:border-[#ffd165] transition-all duration-300 shadow-md">
          <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
            Valor do Estoque Ativo
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#ffd165] font-mono tracking-tight">
              {isDataLoading ? (
                <span className="inline-block w-28 h-7 bg-[#ffd165]/20 rounded animate-pulse" />
              ) : (
                formatCurrencyBrl(stats.totalActiveStockValueBrl)
              )}
            </h3>
            <span className="text-[#4edea3] text-xs font-bold flex items-center gap-1 font-mono bg-[#003824]/40 px-2 py-0.5 rounded-full border border-[#4edea3]/20">
              <TrendingUp className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
        </div>

        {/* Card 2: Relógios em Estoque */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 hover:border-[#ffd165] transition-all duration-300 shadow-md">
          <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
            Relógios em Estoque
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-[#e5e1e4] font-mono">
              {isDataLoading ? (
                <span className="inline-block w-12 h-7 bg-[#e5e1e4]/20 rounded animate-pulse" />
              ) : (
                stats.totalActiveStockCount
              )}
            </h3>
            <span className="text-xs text-[#9b8f79] bg-[#27272a] px-2 py-1 rounded-lg">
              Unidades Ativas
            </span>
          </div>
        </div>

        {/* Card 3: Relógios Vendidos Mês / Lucro */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between h-36 hover:border-[#4edea3] transition-all duration-300 shadow-md">
          <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
            Relógios Vendidos (Mês)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-extrabold text-[#4edea3] font-mono">
              {isDataLoading ? (
                <span className="inline-block w-12 h-7 bg-[#4edea3]/20 rounded animate-pulse" />
              ) : (
                stats.soldCountMonth
              )}
            </h3>
            <span className="text-[#4edea3] text-xs font-bold font-mono bg-[#003824]/40 px-2 py-1 rounded-lg border border-[#4edea3]/20">
              {isDataLoading ? (
                <span className="inline-block w-16 h-4 bg-[#4edea3]/20 rounded animate-pulse" />
              ) : (
                `+${formatCurrencyBrl(stats.profitMonthBrl)}`
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Search & Filters Toolbar */}
      <section className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9b8f79] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar estoque por marca, modelo, serial ou comprador..."
            className="w-full bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e5e1e4] placeholder:text-[#9b8f79]/50 outline-none transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#131315] border border-[#27272a] text-[#e5e1e4] text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:border-[#ffd165]"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Em Estoque">Em Estoque</option>
            <option value="Vendido">Vendido</option>
            <option value="Consignação">Consignação</option>
          </select>

          {/* Brand filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-[#131315] border border-[#27272a] text-[#e5e1e4] text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:border-[#ffd165]"
          >
            <option value="Todas">Marca: Todas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#131315] border border-[#27272a] text-[#e5e1e4] text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:border-[#ffd165]"
          >
            <option value="recent">Mais Recentes</option>
            <option value="price-desc">Maior Valor</option>
            <option value="price-asc">Menor Valor</option>
            <option value="profit-desc">Maior Lucro</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#131315] border border-[#27272a] rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#27272a] text-[#ffd165]' : 'text-[#9b8f79] hover:text-[#e5e1e4]'
              }`}
              title="Visualização em Grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[#27272a] text-[#ffd165]' : 'text-[#9b8f79] hover:text-[#e5e1e4]'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Inventory Cards Grid or List */}
      {isDataLoading ? (
        <div className="text-center py-20 p-8 bg-[#18181b] rounded-2xl border border-[#27272a] flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
          {/* Ambient background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#ffd165]/5 via-transparent to-transparent pointer-events-none" />

          {/* Animated Mechanical Clock Spinner */}
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            {/* Outer rotating bezel */}
            <div className="absolute inset-0 rounded-full border-2 border-[#ffd165]/20 border-t-[#ffd165] border-r-[#ffd165]/80 animate-spin" style={{ animationDuration: '1.8s' }} />
            {/* Inner counter-rotating ring */}
            <div className="absolute inset-2.5 rounded-full border border-[#ffd165]/10 border-b-[#ffd165] animate-spin" style={{ animationDuration: '2.8s', animationDirection: 'reverse' }} />
            {/* Center watch icon with breathing glow */}
            <div className="w-12 h-12 rounded-full bg-[#ffd165]/15 border border-[#ffd165]/30 flex items-center justify-center text-[#ffd165] animate-pulse shadow-[0_0_25px_rgba(255,209,101,0.25)]">
              <WatchIcon className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-lg font-extrabold text-[#e5e1e4] tracking-tight">
            Carregando Estoque...
          </h3>
          <p className="text-xs text-[#9b8f79] max-w-sm mt-1.5 leading-relaxed font-medium">
            Sincronizando os relógios do seu banco de dados com precisão horológica.
          </p>

          {/* Skeleton cards grid preview beneath */}
          <div className="mt-8 w-full grid grid-cols-1 md:grid-cols-3 gap-5 opacity-40 pointer-events-none">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-[#27272a]/60 animate-pulse border border-[#3f3f46]/40 flex flex-col justify-between p-5">
                <div className="flex justify-between items-start">
                  <div className="w-20 h-4 bg-[#3f3f46] rounded" />
                  <div className="w-16 h-5 bg-[#ffd165]/20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="w-32 h-5 bg-[#3f3f46] rounded" />
                  <div className="w-24 h-3 bg-[#3f3f46]/60 rounded" />
                </div>
                <div className="w-28 h-6 bg-[#ffd165]/30 rounded mt-2" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredWatches.length === 0 ? (
        <div className="text-center py-16 p-8 bg-[#18181b] rounded-2xl border border-[#27272a]">
          <WatchIcon className="w-12 h-12 text-[#9b8f79] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-[#e5e1e4]">Nenhum relógio encontrado</h3>
          <p className="text-xs text-[#9b8f79] max-w-md mx-auto mt-1">
            Tente mudar os filtros de busca ou cadastre um novo relógio no seu acervo.
          </p>
          <button
            onClick={onAddNewClick}
            className="mt-4 px-4 py-2 bg-[#ffd165] text-[#131315] font-bold text-xs rounded-xl hover:bg-[#f7be1d] transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Relógio</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-10">
          {groupedSections.map((section) => (
            <div key={section.key} className="space-y-4">
              {/* Subdivision Header */}
              <div className="flex items-center gap-3 pt-2 pb-1">
                <div
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${section.badgeColor} flex items-center gap-2 shadow-sm`}
                >
                  <span>{section.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  <span className="font-mono text-[11px]">
                    {section.watches.length} {section.watches.length === 1 ? 'relógio' : 'relógios'}
                  </span>
                </div>
                <div className="h-px bg-[#27272a] flex-1" />
              </div>

              {/* Grid Section */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {section.watches.map((watch) => {
                  const isSold = watch.status === 'Vendido';
                  const isConsignment = watch.status === 'Consignação';

                  const primaryImage =
                    (watch.images && watch.images.length > 0 && watch.images[0]) ||
                    '/no-image.svg';

                  const netProfit =
                    isSold && watch.sale
                      ? watch.sale.salePriceBrl - watch.totalCostBrl - watch.sale.shippingAndFeesBrl
                      : 0;

                  return (
                    <div
                      key={watch.id}
                      className={`glass-card rounded-2xl overflow-hidden group hover:border-[#ffd165]/50 transition-all duration-300 flex flex-col justify-between shadow-lg ${
                        isSold ? 'opacity-90' : ''
                      }`}
                    >
                      <div>
                        {/* Card Image Banner */}
                        <div className="relative h-60 overflow-hidden bg-[#09090b]">
                          <img
                            src={primaryImage}
                            alt={watch.model}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/no-image.svg';
                            }}
                          />

                          {/* Status Badge */}
                          <div className="absolute top-4 left-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-md ${
                                isSold
                                  ? 'bg-[#003824]/80 text-[#4edea3] border-[#4edea3]/40'
                                  : isConsignment
                                  ? 'bg-blue-900/80 text-blue-300 border-blue-400/40'
                                  : 'bg-[#ffd165]/20 text-[#ffd165] border-[#ffd165]/40'
                              }`}
                            >
                              {watch.status}
                            </span>
                          </div>

                          {/* Quick Image Link Badge */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(primaryImage);
                                alert('Link direto da foto copiado para a área de transferência!');
                              }}
                              className="px-2 py-1 bg-[#131315]/90 hover:bg-[#131315] text-[#ffd165] text-[10px] font-bold rounded-lg border border-[#27272a] flex items-center gap-1 shadow-md"
                              title="Copiar URL desta imagem"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Link Foto</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Main Info */}
                        <div className="p-6 space-y-4">
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#9b8f79]">
                              {watch.brand}
                            </h4>
                            <h3 className="font-bold text-lg text-[#e5e1e4] leading-tight mt-0.5 line-clamp-2">
                              {watch.model}
                            </h3>
                            {watch.ref && watch.ref.trim().toUpperCase() !== 'N/A' && watch.ref.trim() !== '' && watch.ref.trim() !== '-' && (
                              <p className="text-xs font-mono text-[#9b8f79] mt-0.5">Ref. {watch.ref}</p>
                            )}

                            {(watch.serialNumber || watch.notesAndSpecs) && (
                              <p className="text-xs text-[#9b8f79] mt-1 line-clamp-2">
                                {[watch.serialNumber, watch.notesAndSpecs].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>

                          {/* Pricing grid */}
                          <div
                            className={`grid ${
                              isSold ? 'grid-cols-3' : 'grid-cols-2'
                            } gap-2 py-3 border-y border-[#27272a] text-xs`}
                          >
                            <div>
                              <p className="text-[10px] text-[#9b8f79]">Custo Total</p>
                              <p className="font-mono font-bold text-[#e5e1e4]">
                                {formatCurrencyBrl(watch.totalCostBrl)}
                              </p>
                            </div>

                            {!isSold ? (
                              <div>
                                <p className="text-[10px] text-[#9b8f79]">Preço Mercado</p>
                                <p className="font-mono font-bold text-[#ffd165]">
                                  {watch.marketPriceBrl ? formatCurrencyBrl(watch.marketPriceBrl) : 'Sob consulta'}
                                </p>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <p className="text-[10px] text-[#9b8f79]">Venda</p>
                                  <p className="font-mono font-bold text-[#e5e1e4]">
                                    {formatCurrencyBrl(watch.sale?.salePriceBrl || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[#9b8f79]">Lucro</p>
                                  <p className="font-mono font-bold text-[#4edea3]">
                                    +{formatCurrencyBrl(netProfit)}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="p-6 pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditWatch(watch)}
                            className="w-8 h-8 rounded-full bg-[#201f22] border border-[#27272a] flex items-center justify-center text-[#e5e1e4] hover:text-[#ffd165] hover:border-[#ffd165]/50 transition-colors"
                            title="Editar relógio"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {!isSold && (
                            <button
                              onClick={() => setSellWatch(watch)}
                              className="w-8 h-8 rounded-full bg-[#003824] border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] hover:scale-105 transition-transform"
                              title="Registrar Venda"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeletingWatch(watch)}
                            className="w-8 h-8 rounded-full bg-[#201f22] border border-[#27272a] flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => setDetailWatch(watch)}
                          className="text-xs font-bold text-[#ffd165] flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Ver Detalhes</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          ))}
        </div>
      ) : (
        /* List View Grouped */
        <div className="space-y-10">
          {groupedSections.map((section) => (
            <div key={section.key} className="space-y-4">
              {/* Subdivision Header */}
              <div className="flex items-center gap-3 pt-2 pb-1">
                <div
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${section.badgeColor} flex items-center gap-2 shadow-sm`}
                >
                  <span>{section.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  <span className="font-mono text-[11px]">
                    {section.watches.length} {section.watches.length === 1 ? 'relógio' : 'relógios'}
                  </span>
                </div>
                <div className="h-px bg-[#27272a] flex-1" />
              </div>

              <section className="glass-card rounded-2xl overflow-hidden shadow-lg border border-[#27272a]">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs text-[#e5e1e4]">
                    <thead className="bg-[#131315] text-[#9b8f79] uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                      <tr>
                        <th className="p-4">Relógio</th>
                        <th className="p-4">Marca & Ref</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Custo BRL</th>
                        <th className="p-4">Preço Mercado / Venda</th>
                        <th className="p-4">Comprador</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {section.watches.map((watch) => {
                        const isSold = watch.status === 'Vendido';
                        return (
                          <tr key={watch.id} className="hover:bg-[#201f22]/60 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              <img
                                src={(watch.images && watch.images.length > 0 && watch.images[0]) || '/no-image.svg'}
                                alt={watch.model}
                                className="w-10 h-10 rounded-lg object-cover border border-[#27272a]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/no-image.svg';
                                }}
                              />
                              <div className="font-bold text-sm truncate max-w-[200px]">
                                {watch.model}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-[#ffd165] block">{watch.brand}</span>
                              {watch.ref && watch.ref.trim().toUpperCase() !== 'N/A' && watch.ref.trim() !== '' && watch.ref.trim() !== '-' && (
                                <span className="text-[#9b8f79] font-mono text-[11px] block">Ref: {watch.ref}</span>
                              )}
                              {(watch.serialNumber || watch.notesAndSpecs) && (
                                <span className="text-[#9b8f79]/80 text-[10px] block truncate max-w-[180px]" title={watch.serialNumber || watch.notesAndSpecs}>
                                  {watch.serialNumber || watch.notesAndSpecs}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isSold
                                    ? 'bg-[#4edea3]/10 text-[#4edea3]'
                                    : watch.status === 'Consignação'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'bg-[#ffd165]/10 text-[#ffd165]'
                                }`}
                              >
                                {watch.status}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold">
                              {formatCurrencyBrl(watch.totalCostBrl)}
                            </td>
                            <td className="p-4 font-mono font-bold text-[#ffd165]">
                              {isSold
                                ? formatCurrencyBrl(watch.sale?.salePriceBrl || 0)
                                : watch.marketPriceBrl
                                ? formatCurrencyBrl(watch.marketPriceBrl)
                                : 'Sob consulta'}
                            </td>
                            <td className="p-4 text-[#9b8f79]">
                              {watch.sale?.buyerName || '-'}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => setDetailWatch(watch)}
                                className="px-2.5 py-1 bg-[#27272a] text-[#ffd165] rounded-lg text-[11px] font-bold hover:bg-[#353437] cursor-pointer"
                              >
                                Detalhes
                              </button>
                              <button
                                onClick={() => onEditWatch(watch)}
                                className="px-2 py-1 text-[#e5e1e4] hover:text-[#ffd165] cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => setDeletingWatch(watch)}
                                className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={onAddNewClick}
        className="fixed right-6 bottom-20 lg:bottom-12 w-14 h-14 bg-[#ffd165] text-[#131315] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-2 border-[#131315]"
        title="Registrar Novo Relógio"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Detail Modal */}
      {detailWatch && (
        <WatchDetailModal
          watch={detailWatch}
          onClose={() => setDetailWatch(null)}
          onEdit={(w) => {
            setDetailWatch(null);
            onEditWatch(w);
          }}
          onQuickSell={(w) => {
            setDetailWatch(null);
            setSellWatch(w);
          }}
          onDelete={(id) => {
            onDeleteWatch(id);
            setDetailWatch(null);
          }}
        />
      )}

      {/* Quick Sell Modal */}
      {sellWatch && (
        <QuickSellModal
          watch={sellWatch}
          onClose={() => setSellWatch(null)}
          onConfirmSale={(id, saleData) => {
            onConfirmSale(id, saleData);
            setSellWatch(null);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingWatch}
        title="Excluir Relógio"
        description={
          deletingWatch
            ? `Tem certeza que deseja excluir o relógio "${deletingWatch.brand} ${deletingWatch.model}" (Ref. ${deletingWatch.ref})? Esta ação removerá o item permanentemente.`
            : ''
        }
        confirmLabel="Excluir Definitivamente"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (deletingWatch) {
            onDeleteWatch(deletingWatch.id);
            setDeletingWatch(null);
          }
        }}
        onCancel={() => setDeletingWatch(null)}
      />
    </div>
  );
};
