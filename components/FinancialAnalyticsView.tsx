'use client';

import React, { useState, useMemo } from 'react';
import { Watch, PeriodFilter } from '@/types/watch';
import { calculateInventoryStats, formatCurrencyBrl, formatDatePtBr } from '@/lib/storage';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Percent, 
  History, 
  Download, 
  ArrowDown, 
  Calendar,
  Layers,
  PieChart as PieIcon,
  Plane,
  ShoppingBag,
  Tag,
  Search,
  ArrowUpRight
} from 'lucide-react';

interface FinancialAnalyticsViewProps {
  watches: Watch[];
}

const CustomTrajectoryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#27272a] border border-[#3f3f46] p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[170px]">
        <p className="font-bold text-[#ffd165] text-xs border-b border-[#3f3f46] pb-1 mb-1.5">{label}</p>
        {payload.map((entry: any, index: number) => {
          let textColor = '#e5e1e4';
          if (entry.name === 'Receita Líquida') textColor = '#ffd165';
          else if (entry.name === 'Lucro') textColor = '#4edea3';
          else if (entry.name === 'Custo') textColor = '#d4d4d8';

          return (
            <div key={`item-${index}`} className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#d4d4d8] font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color === '#2a2a2c' ? '#a1a1aa' : entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold" style={{ color: textColor }}>
                {formatCurrencyBrl(Number(entry.value))}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.color || '#ffd165';
    return (
      <div className="bg-[#27272a] border border-[#3f3f46] p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-[#e5e1e4] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
          {data.name}
        </p>
        <p className="text-[#d4d4d8] font-mono">
          {data.value} {Number(data.value) === 1 ? 'unidade' : 'unidades'} ({formatCurrencyBrl(data.payload?.value || 0)})
        </p>
      </div>
    );
  }
  return null;
};

const BRAND_COLORS = ['#ffd165', '#4edea3', '#9b8f79', '#3b82f6', '#ec4899', '#8b5cf6'];

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({ watches }) => {
  const [period, setPeriod] = useState<PeriodFilter>('Este Mês');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st day of current month
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter sold watches by selected period or custom date range
  const filteredSoldWatches = useMemo(() => {
    const sold = watches.filter(w => {
      const isSold = (w.status || '').toLowerCase() === 'vendido';
      return isSold && w.sale !== undefined && w.sale !== null;
    });
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
    const currentYearMonth = `${currentYear}-${currentMonthStr}`;

    return sold.filter(w => {
      const saleDate = w.sale?.saleDate;

      if (period === 'Este Mês') {
        return saleDate ? saleDate.startsWith(currentYearMonth) : false;
      }

      if (period === 'Últimos 30 Dias') {
        if (!saleDate) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const saleDateObj = new Date(saleDate.length === 10 ? `${saleDate}T00:00:00` : saleDate);
        return saleDateObj >= thirtyDaysAgo;
      }

      if (period === 'No Ano') {
        return saleDate ? saleDate.startsWith(`${currentYear}`) : false;
      }

      if (period === 'Personalizado') {
        if (!saleDate) return false;
        if (customStartDate && saleDate < customStartDate) return false;
        if (customEndDate && saleDate > customEndDate) return false;
        return true;
      }

      // 'Todos'
      return true;
    });
  }, [watches, period, customStartDate, customEndDate]);

  // Compute Performance Stats based on filtered sold watches
  const stats = useMemo(() => {
    const totalGrossRevenueBrl = filteredSoldWatches.reduce((acc, w) => acc + (w.sale?.salePriceBrl || 0), 0);
    const totalFeesBrl = filteredSoldWatches.reduce((acc, w) => acc + (w.sale?.shippingAndFeesBrl || 0), 0);
    const totalRevenueBrl = totalGrossRevenueBrl - totalFeesBrl; // Receita líquida

    const totalCogsBrl = filteredSoldWatches.reduce((acc, w) => acc + w.totalCostBrl, 0);
    const netProfitBrl = totalRevenueBrl - totalCogsBrl;

    // Margem % = (Lucro Líquido / Faturamento Bruto) * 100 (apenas de relógios vendidos)
    const averageMarginPercent = totalGrossRevenueBrl > 0 
      ? ((netProfitBrl / totalGrossRevenueBrl) * 100) 
      : 0;

    let averageHoldingDays = 0;
    if (filteredSoldWatches.length > 0) {
      const totalDays = filteredSoldWatches.reduce((acc, w) => {
        if (!w.purchaseDate || !w.sale?.saleDate) return acc;
        const pDate = new Date(w.purchaseDate);
        const sDate = new Date(w.sale.saleDate);
        const diffTime = sDate.getTime() - pDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        return acc + diffDays;
      }, 0);
      averageHoldingDays = Math.round(totalDays / filteredSoldWatches.length);
    }

    // Calculation for Brazil arrival to final sale
    let averageBrazilHoldingDays: number | null = null;
    let brazilCount = 0;
    const watchesWithBrazilDate = filteredSoldWatches.filter(w => w.shipmentDateBrazil && w.sale?.saleDate);
    if (watchesWithBrazilDate.length > 0) {
      const totalBrazilDays = watchesWithBrazilDate.reduce((acc, w) => {
        const bDate = new Date(w.shipmentDateBrazil!.length === 10 ? `${w.shipmentDateBrazil}T00:00:00` : w.shipmentDateBrazil!);
        const sDate = new Date(w.sale!.saleDate.length === 10 ? `${w.sale!.saleDate}T00:00:00` : w.sale!.saleDate);
        const diffTime = sDate.getTime() - bDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        return acc + diffDays;
      }, 0);
      brazilCount = watchesWithBrazilDate.length;
      averageBrazilHoldingDays = Math.round(totalBrazilDays / brazilCount);
    }

    return {
      totalRevenueBrl,
      totalCogsBrl,
      netProfitBrl,
      averageMarginPercent,
      averageHoldingDays,
      averageBrazilHoldingDays,
      brazilCount,
      count: filteredSoldWatches.length
    };
  }, [filteredSoldWatches]);

  // Brand Distribution Data for Pie Chart based on Filtered Sold Watches
  const { brandDistribution, totalSoldUnits } = useMemo(() => {
    const brandMap: Record<string, { count: number; value: number }> = {};
    const totalSoldUnits = filteredSoldWatches.length;

    filteredSoldWatches.forEach(w => {
      const b = w.brand || 'Outros';
      const salePrice = w.sale?.salePriceBrl || w.totalCostBrl;
      const fees = w.sale?.shippingAndFeesBrl || 0;
      const val = w.sale ? (salePrice - fees) : w.totalCostBrl;
      if (!brandMap[b]) {
        brandMap[b] = { count: 0, value: 0 };
      }
      brandMap[b].count += 1;
      brandMap[b].value += val;
    });

    const distribution = Object.entries(brandMap).map(([brand, data]) => ({
      name: brand,
      value: data.value,
      count: data.count,
      percent: totalSoldUnits > 0 ? Math.round((data.count / totalSoldUnits) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    return {
      brandDistribution: distribution,
      totalSoldUnits
    };
  }, [filteredSoldWatches]);

  // Monthly Financial Trajectory Chart Data
  const { trajectoryData, activeYear } = useMemo(() => {
    const monthsNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const now = new Date();
    const currentYear = now.getFullYear();

    let targetYear = currentYear;
    if (period === 'Personalizado' && customStartDate) {
      const parsedYear = parseInt(customStartDate.split('-')[0], 10);
      if (!isNaN(parsedYear)) targetYear = parsedYear;
    } else {
      const allSoldWithDates = watches.filter(w => w.status === 'Vendido' && w.sale?.saleDate);
      const relevantWatches = filteredSoldWatches.length > 0 ? filteredSoldWatches : allSoldWithDates;
      if (relevantWatches.length > 0) {
        const years = Array.from(
          new Set(relevantWatches.map(w => parseInt(w.sale!.saleDate.split('-')[0], 10)))
        ).filter(y => !isNaN(y)).sort((a, b) => a - b);
        if (years.length > 0) {
          targetYear = years[years.length - 1];
        }
      }
    }

    const monthlyStats = monthsNames.map((monthName, idx) => {
      const monthNumber = idx + 1;
      const monthPrefix = `${targetYear}-${String(monthNumber).padStart(2, '0')}`;

      const soldInMonth = filteredSoldWatches.filter(w => w.sale!.saleDate.startsWith(monthPrefix));

      const faturamento = soldInMonth.reduce((acc, w) => acc + (w.sale?.salePriceBrl || 0), 0);
      const custo = soldInMonth.reduce((acc, w) => acc + w.totalCostBrl, 0);
      const taxas = soldInMonth.reduce((acc, w) => acc + (w.sale?.shippingAndFeesBrl || 0), 0);
      const receitaLiquida = faturamento - taxas;
      const lucro = Math.max(0, receitaLiquida - custo);

      return {
        month: monthName,
        'Receita Líquida': receitaLiquida,
        Custo: custo,
        Lucro: lucro
      };
    });

    return {
      activeYear: targetYear,
      trajectoryData: monthlyStats
    };
  }, [filteredSoldWatches, watches, period, customStartDate]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredSoldWatches.length === 0) {
      alert('Nenhuma venda registrada para o período selecionado.');
      return;
    }

    const headers = [
      'ID',
      'Marca',
      'Modelo',
      'Referência',
      'Data Compra',
      'Custo Total (BRL)',
      'Data Venda',
      'Preço Venda (BRL)',
      'Taxas Venda (BRL)',
      'Receita Líquida (BRL)',
      'Lucro Líquido (BRL)',
      'Comprador'
    ];

    const rows = filteredSoldWatches.map(w => {
      const sale = w.sale!;
      const netRevenue = sale.salePriceBrl - sale.shippingAndFeesBrl;
      const profit = netRevenue - w.totalCostBrl;
      return [
        w.id,
        `"${w.brand}"`,
        `"${w.model}"`,
        `"${w.ref}"`,
        w.purchaseDate,
        w.totalCostBrl.toFixed(2),
        sale.saleDate,
        sale.salePriceBrl.toFixed(2),
        sale.shippingAndFeesBrl.toFixed(2),
        netRevenue.toFixed(2),
        profit.toFixed(2),
        `"${sale.buyerName}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analise_vendas_horological_${period.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Subheader & Date Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-[#e5e1e4] tracking-tight">
            Resumo de Performance
          </h3>
          <p className="text-xs text-[#9b8f79]">
            Visão geral financeira consolidada das operações de compra e venda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-stretch md:self-auto">
          {/* Custom Date Range Inputs when 'Personalizado' is selected */}
          {period === 'Personalizado' && (
            <div className="flex items-center gap-2 bg-[#18181b] px-3 py-1.5 rounded-full border border-[#27272a] shadow-sm text-xs">
              <Calendar className="w-3.5 h-3.5 text-[#ffd165] flex-shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-[#9b8f79] text-[11px] font-medium">De:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-lg text-[11px] text-[#e5e1e4] px-2 py-0.5 outline-none font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#9b8f79] text-[11px] font-medium">Até:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[#131315] border border-[#27272a] focus:border-[#ffd165] rounded-lg text-[11px] text-[#e5e1e4] px-2 py-0.5 outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Date Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-[#18181b] rounded-full border border-[#27272a] overflow-x-auto no-scrollbar">
            {(['Este Mês', 'Últimos 30 Dias', 'No Ano', 'Personalizado', 'Todos'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                  period === p
                    ? 'bg-[#2a2a2c] text-[#ffd165] shadow-sm'
                    : 'text-[#9b8f79] hover:text-[#e5e1e4]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Receita Líquida */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
              Receita Líquida
            </span>
            <TrendingUp className="w-5 h-5 text-[#ffd165]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-[#e5e1e4] font-mono">
              {formatCurrencyBrl(stats.totalRevenueBrl)}
            </span>
            <span className="text-[#4edea3] text-xs font-bold mt-1.5 flex items-center gap-1 font-mono">
              Preço Venda − Frete & Taxas Venda
            </span>
          </div>
          <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#ffd165] opacity-30" />
        </div>

        {/* Total COGS */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
              Custo Total de Vendas
            </span>
            <DollarSign className="w-5 h-5 text-[#9b8f79]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-[#e5e1e4] font-mono">
              {formatCurrencyBrl(stats.totalCogsBrl)}
            </span>
            <span className="text-[#9b8f79] text-xs font-medium mt-1.5">
              {stats.totalRevenueBrl > 0
                ? `${((stats.totalCogsBrl / stats.totalRevenueBrl) * 100).toFixed(1)}% da receita líquida`
                : 'Custo de aquisição'}
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="glass-card p-6 rounded-2xl border-[#4edea3]/30 relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
              Lucro Líquido
            </span>
            <Wallet className="w-5 h-5 text-[#4edea3]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-[#4edea3] font-mono">
              {formatCurrencyBrl(stats.netProfitBrl)}
            </span>
            <span className="text-[#4edea3] text-xs font-bold mt-1.5 flex items-center gap-1 font-mono">
              Lucro após custos e taxas
            </span>
          </div>
          <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#4edea3] opacity-50" />
        </div>

        {/* Average Profit Margin */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
              Margem Média
            </span>
            <Percent className="w-5 h-5 text-[#ffd165]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-[#e5e1e4] font-mono">
              {stats.averageMarginPercent.toFixed(1)}%
            </span>
            <span className="text-[#9b8f79] text-xs font-medium mt-1 flex items-center gap-1">
              {stats.count > 0 
                ? `Calculada sobre ${stats.count} ${stats.count === 1 ? 'relógio vendido' : 'relógios vendidos'}`
                : 'Apenas relógios vendidos'}
            </span>
            <div className="w-full bg-[#353437] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#ffd165] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.averageMarginPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Section: Trajectory & Brand Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trajetória Financeira Chart */}
        <div className="lg:col-span-8 glass-card p-6 rounded-2xl flex flex-col h-[420px] shadow-lg">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
            <div>
              <h4 className="text-base font-bold text-[#e5e1e4]">Trajetória Financeira</h4>
              <p className="text-xs text-[#9b8f79]">
                Custo vs Receita Líquida vs Lucro Líquido ({activeYear})
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffd165]" />
                <span className="text-[#9b8f79]">Receita Líquida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#27272a]" />
                <span className="text-[#9b8f79]">Custo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
                <span className="text-[#9b8f79]">Lucro</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#9b8f79" fontSize={11} tickLine={false} />
                <YAxis stroke="#9b8f79" fontSize={10} tickFormatter={(v) => `R$${v/1000}k`} tickLine={false} />
                <Tooltip content={<CustomTrajectoryTooltip />} />
                <Bar dataKey="Custo" fill="#2a2a2c" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Receita Líquida" fill="#ffd165" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="Lucro" stroke="#4edea3" strokeWidth={3} dot={{ fill: '#4edea3', r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exposição por Marca Donut Chart */}
        <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col h-[420px] shadow-lg">
          <div className="mb-4">
            <h4 className="text-base font-bold text-[#e5e1e4]">Exposição por Marca</h4>
            <p className="text-xs text-[#9b8f79]">Distribuição de Vendas por Marca</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {brandDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#e5e1e4] font-mono">
                  {totalSoldUnits}
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#9b8f79]">Vendidos</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-xs">
              {brandDistribution.length > 0 ? (
                brandDistribution.slice(0, 4).map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length] }}
                    />
                    <span className="text-[#e5e1e4] truncate font-medium">
                      {item.name} ({item.percent}%)
                    </span>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-[#9b8f79] text-xs">Sem relógios vendidos</p>
              )}
            </div>
          </div>
        </div>

        {/* Retenção & Chegada Brasil Metrics */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tempo Médio de Retenção (Fornecedor -> Liquidação) */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ffd165]/10 border border-[#ffd165]/20 flex items-center justify-center text-[#ffd165] flex-shrink-0">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#e5e1e4]">Tempo Médio de Retenção</h4>
                  <p className="text-xs text-[#9b8f79] mt-0.5">
                    Duração média em dias entre a compra no fornecedor e a liquidação final.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-[#27272a]">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#ffd165] font-mono">
                  {stats.averageHoldingDays}
                </span>
                <span className="text-xs font-bold text-[#9b8f79] uppercase">Dias</span>
              </div>
              <div className="text-right">
                <span className="text-[#4edea3] text-[11px] font-bold flex items-center justify-end gap-1 font-mono">
                  <ArrowDown className="w-3 h-3" /> Meta: 30-45 dias
                </span>
                <p className="text-[10px] text-[#9b8f79] mt-0.5">
                  Calculado sobre {stats.count} {stats.count === 1 ? 'venda' : 'vendas'}
                </p>
              </div>
            </div>
          </div>

          {/* Tempo Médio Pós-Chegada Brasil (Chegada BR -> Liquidação) */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between gap-4 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center text-[#4edea3] flex-shrink-0">
                  <Plane className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#e5e1e4]">Tempo Médio Pós-Chegada Brasil</h4>
                  <p className="text-xs text-[#9b8f79] mt-0.5">
                    Duração média em dias entre a chegada no Brasil e a liquidação final.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between pt-2 border-t border-[#27272a]">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#4edea3] font-mono">
                  {stats.averageBrazilHoldingDays !== null ? stats.averageBrazilHoldingDays : '--'}
                </span>
                <span className="text-xs font-bold text-[#9b8f79] uppercase">
                  {stats.averageBrazilHoldingDays !== null ? 'Dias' : ''}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#e5e1e4] font-medium">
                  {stats.brazilCount > 0
                    ? `${stats.brazilCount} ${stats.brazilCount === 1 ? 'relógio contabilizado' : 'relógios contabilizados'}`
                    : 'Nenhum relógio com chegada no Brasil'}
                </p>
                <p className="text-[10px] text-[#9b8f79] mt-0.5">
                  Ignora relógios sem data no Brasil
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NOVA SEÇÃO: Listagem dos Relógios Já Vendidos */}
        <div className="lg:col-span-12 glass-card p-6 rounded-2xl shadow-lg border border-[#27272a] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center text-[#4edea3] flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#e5e1e4] flex items-center gap-2">
                  Relógios Vendidos
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#ffd165]/10 text-[#ffd165] border border-[#ffd165]/20 rounded-full">
                    {filteredSoldWatches.length} {filteredSoldWatches.length === 1 ? 'unidade' : 'unidades'}
                  </span>
                </h4>
                <p className="text-xs text-[#9b8f79] mt-0.5">
                  Demonstrativo financeiro individual de custo, venda, lucro líquido e margem de cada peça.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={filteredSoldWatches.length === 0}
              className="px-3.5 py-1.5 bg-[#201f22] hover:bg-[#27272a] border border-[#27272a] hover:border-[#ffd165]/40 text-[#ffd165] font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {filteredSoldWatches.length === 0 ? (
            <div className="p-8 text-center bg-[#18181b]/50 rounded-xl border border-[#27272a] space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#9b8f79] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-[#e5e1e4]">Nenhum relógio vendido no período selecionado</p>
              <p className="text-xs text-[#9b8f79]">
                Selecione outro período no topo ou registre novas vendas para visualizar o desempenho.
              </p>
            </div>
          ) : (
            <>
              {/* Tabela para Telas Médias e Grandes (Desktop / Tablet) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-[#9b8f79] border-b border-[#27272a] pb-2">
                      <th className="pb-3 font-bold pl-1">Relógio</th>
                      <th className="pb-3 font-bold text-center">Data Venda</th>
                      <th className="pb-3 font-bold text-right">Custo Total</th>
                      <th className="pb-3 font-bold text-right">Valor Venda</th>
                      <th className="pb-3 font-bold text-right">Lucro Líquido</th>
                      <th className="pb-3 font-bold text-right pr-2">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {filteredSoldWatches.map((watch) => {
                      const sale = watch.sale!;
                      const fees = sale.shippingAndFeesBrl || 0;
                      const netRevenue = sale.salePriceBrl - fees;
                      const netProfit = netRevenue - watch.totalCostBrl;
                      const marginPercent = sale.salePriceBrl > 0 ? (netProfit / sale.salePriceBrl) * 100 : 0;
                      const isProfitable = netProfit >= 0;

                      const primaryImage =
                        (watch.images && watch.images.length > 0 && watch.images[0]) ||
                        '/no-image.svg';

                      return (
                        <tr key={watch.id} className="hover:bg-[#201f22]/60 transition-colors group">
                          {/* Foto + Nome + Ref */}
                          <td className="py-3.5 pl-1">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#09090b] border border-[#27272a] flex-shrink-0">
                                <img
                                  src={primaryImage}
                                  alt={`${watch.brand} ${watch.model}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/no-image.svg';
                                  }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-[#e5e1e4] truncate group-hover:text-[#ffd165] transition-colors">
                                  {watch.brand} {watch.model}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-[#9b8f79] mt-0.5">
                                  {watch.ref && <span>Ref: {watch.ref}</span>}
                                  {sale.buyerName && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">Cliente: {sale.buyerName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Data de Venda */}
                          <td className="py-3.5 text-center text-xs font-mono text-[#d4d4d8]">
                            {formatDatePtBr(sale.saleDate)}
                          </td>

                          {/* Custo Total */}
                          <td className="py-3.5 text-right text-xs font-mono text-[#d4d4d8]">
                            {formatCurrencyBrl(watch.totalCostBrl)}
                          </td>

                          {/* Valor de Venda */}
                          <td className="py-3.5 text-right font-mono">
                            <div className="text-xs font-bold text-[#e5e1e4]">
                              {formatCurrencyBrl(sale.salePriceBrl)}
                            </div>
                            {fees > 0 && (
                              <div className="text-[10px] text-[#9b8f79]">
                                Taxas: -{formatCurrencyBrl(fees)}
                              </div>
                            )}
                          </td>

                          {/* Lucro Líquido */}
                          <td className="py-3.5 text-right font-mono">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-lg inline-block ${
                                isProfitable
                                  ? 'text-[#4edea3] bg-[#4edea3]/10 border border-[#4edea3]/20'
                                  : 'text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20'
                              }`}
                            >
                              {isProfitable ? '+' : ''}
                              {formatCurrencyBrl(netProfit)}
                            </span>
                          </td>

                          {/* Margem % */}
                          <td className="py-3.5 text-right pr-2 font-mono">
                            <span
                              className={`text-xs font-bold ${
                                marginPercent >= 20
                                  ? 'text-[#4edea3]'
                                  : marginPercent >= 0
                                  ? 'text-[#ffd165]'
                                  : 'text-[#f87171]'
                              }`}
                            >
                              {marginPercent >= 0 ? '+' : ''}
                              {marginPercent.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards para Telas Pequenas (Mobile) */}
              <div className="block md:hidden space-y-3">
                {filteredSoldWatches.map((watch) => {
                  const sale = watch.sale!;
                  const fees = sale.shippingAndFeesBrl || 0;
                  const netRevenue = sale.salePriceBrl - fees;
                  const netProfit = netRevenue - watch.totalCostBrl;
                  const marginPercent = sale.salePriceBrl > 0 ? (netProfit / sale.salePriceBrl) * 100 : 0;
                  const isProfitable = netProfit >= 0;

                  const primaryImage =
                    (watch.images && watch.images.length > 0 && watch.images[0]) ||
                    '/no-image.svg';

                  return (
                    <div
                      key={watch.id}
                      className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl space-y-3 shadow-sm"
                    >
                      {/* Top: Foto e Nome */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#09090b] border border-[#27272a] flex-shrink-0">
                          <img
                            src={primaryImage}
                            alt={`${watch.brand} ${watch.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/no-image.svg';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-[#e5e1e4] truncate">
                            {watch.brand} {watch.model}
                          </h5>
                          <p className="text-[11px] text-[#9b8f79] truncate">
                            {watch.ref ? `Ref: ${watch.ref} • ` : ''}Vendido em {formatDatePtBr(sale.saleDate)}
                          </p>
                        </div>
                      </div>

                      {/* 2x2 Grid de Métricas Financeiras */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272a] text-xs">
                        <div className="bg-[#131315] p-2 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-[#9b8f79] block">Custo</span>
                          <span className="font-mono text-[#d4d4d8] font-semibold">
                            {formatCurrencyBrl(watch.totalCostBrl)}
                          </span>
                        </div>

                        <div className="bg-[#131315] p-2 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-[#9b8f79] block">Valor Venda</span>
                          <span className="font-mono text-[#ffd165] font-semibold">
                            {formatCurrencyBrl(sale.salePriceBrl)}
                          </span>
                        </div>

                        <div className="bg-[#131315] p-2 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-[#9b8f79] block">Lucro Líquido</span>
                          <span
                            className={`font-mono font-bold ${
                              isProfitable ? 'text-[#4edea3]' : 'text-[#f87171]'
                            }`}
                          >
                            {isProfitable ? '+' : ''}
                            {formatCurrencyBrl(netProfit)}
                          </span>
                        </div>

                        <div className="bg-[#131315] p-2 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-[#9b8f79] block">Margem</span>
                          <span
                            className={`font-mono font-bold ${
                              marginPercent >= 20
                                ? 'text-[#4edea3]'
                                : marginPercent >= 0
                                ? 'text-[#ffd165]'
                                : 'text-[#f87171]'
                            }`}
                          >
                            {marginPercent >= 0 ? '+' : ''}
                            {marginPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSV Export Table Header */}
      <div className="flex justify-between items-center pt-4 border-t border-[#27272a]">
        <div>
          <h4 className="text-sm font-bold text-[#e5e1e4]">Relatório Consolidado de Vendas</h4>
          <p className="text-xs text-[#9b8f79]">Exporte todos os registros em formato de planilha CSV</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-[#201f22] border border-[#27272a] hover:border-[#ffd165] text-[#ffd165] font-bold text-xs rounded-xl transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Planilha (CSV)</span>
        </button>
      </div>
    </div>
  );
};
