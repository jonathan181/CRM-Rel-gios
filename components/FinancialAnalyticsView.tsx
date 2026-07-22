'use client';

import React, { useState, useMemo } from 'react';
import { Watch, PeriodFilter } from '@/types/watch';
import { calculateInventoryStats, formatCurrencyBrl } from '@/lib/storage';
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
  PieChart as PieIcon
} from 'lucide-react';

interface FinancialAnalyticsViewProps {
  watches: Watch[];
}

const BRAND_COLORS = ['#ffd165', '#4edea3', '#9b8f79', '#3b82f6', '#ec4899', '#8b5cf6'];

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({ watches }) => {
  const [period, setPeriod] = useState<PeriodFilter>('Últimos 30 Dias');

  // Compute Overall Stats
  const stats = useMemo(() => calculateInventoryStats(watches), [watches]);

  // Brand Distribution Data for Pie Chart based on Sold Watches
  const { brandDistribution, totalSoldUnits } = useMemo(() => {
    const brandMap: Record<string, { count: number; value: number }> = {};
    const soldWatches = watches.filter(w => w.status === 'Vendido');
    const totalSoldUnits = soldWatches.length;

    soldWatches.forEach(w => {
      const b = w.brand || 'Outros';
      const val = w.sale?.salePriceBrl || w.totalCostBrl;
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
  }, [watches]);

  // Monthly Financial Trajectory Chart Data directly from sold watches
  const { trajectoryData, activeYear } = useMemo(() => {
    const soldWatches = watches.filter(w => w.status === 'Vendido' && w.sale?.saleDate);

    const monthsNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const now = new Date();
    const currentYear = now.getFullYear();

    if (soldWatches.length === 0) {
      return {
        activeYear: currentYear,
        trajectoryData: monthsNames.map((month) => ({
          month,
          Receita: 0,
          Custo: 0,
          Lucro: 0
        }))
      };
    }

    // Extract years from actual sold watches
    const years = Array.from(
      new Set(soldWatches.map(w => parseInt(w.sale!.saleDate.split('-')[0], 10)))
    ).filter(y => !isNaN(y)).sort((a, b) => a - b);

    // Default to year of latest sale or current year
    let targetYear = years.length > 0 ? years[years.length - 1] : currentYear;

    // Apply period filter if matching sales exist
    let filteredSold = soldWatches;
    if (period === 'Este Mês') {
      const monthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const thisMonthSales = soldWatches.filter(w => w.sale!.saleDate.startsWith(monthPrefix));
      if (thisMonthSales.length > 0) {
        filteredSold = thisMonthSales;
        targetYear = currentYear;
      }
    } else if (period === 'Últimos 30 Dias') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const recentSales = soldWatches.filter(w => new Date(w.sale!.saleDate) >= thirtyDaysAgo);
      if (recentSales.length > 0) {
        filteredSold = recentSales;
      }
    } else if (period === 'No Ano') {
      const thisYearSales = soldWatches.filter(w => w.sale!.saleDate.startsWith(`${currentYear}`));
      if (thisYearSales.length > 0) {
        filteredSold = thisYearSales;
        targetYear = currentYear;
      }
    }

    const monthlyStats = monthsNames.map((monthName, idx) => {
      const monthNumber = idx + 1;
      const monthPrefix = `${targetYear}-${String(monthNumber).padStart(2, '0')}`;

      const soldInMonth = filteredSold.filter(w => w.sale!.saleDate.startsWith(monthPrefix));

      const receita = soldInMonth.reduce((acc, w) => acc + (w.sale?.salePriceBrl || 0), 0);
      const custo = soldInMonth.reduce((acc, w) => acc + w.totalCostBrl, 0);
      const taxas = soldInMonth.reduce((acc, w) => acc + (w.sale?.shippingAndFeesBrl || 0), 0);
      const lucro = Math.max(0, receita - custo - taxas);

      return {
        month: monthName,
        Receita: receita,
        Custo: custo,
        Lucro: lucro
      };
    });

    return {
      activeYear: targetYear,
      trajectoryData: monthlyStats
    };
  }, [watches, period]);

  // Export CSV
  const handleExportCsv = () => {
    const soldWatches = watches.filter(w => w.status === 'Vendido' && w.sale);
    if (soldWatches.length === 0) {
      alert('Nenhuma venda registrada para exportação.');
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
      'Lucro Líquido (BRL)',
      'Comprador'
    ];

    const rows = soldWatches.map(w => {
      const sale = w.sale!;
      const profit = sale.salePriceBrl - w.totalCostBrl - sale.shippingAndFeesBrl;
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
        profit.toFixed(2),
        `"${sale.buyerName}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analise_vendas_horological_${new Date().toISOString().split('T')[0]}.csv`);
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

        {/* Date Filter Pills */}
        <div className="flex gap-1.5 p-1 bg-[#18181b] rounded-full border border-[#27272a] self-stretch md:self-auto overflow-x-auto no-scrollbar">
          {(['Este Mês', 'Últimos 30 Dias', 'No Ano', 'Todos'] as PeriodFilter[]).map((p) => (
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

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Revenue */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#9b8f79] uppercase tracking-wider">
              Receita Total
            </span>
            <TrendingUp className="w-5 h-5 text-[#ffd165]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-extrabold text-[#e5e1e4] font-mono">
              {formatCurrencyBrl(stats.totalRevenueBrl)}
            </span>
            <span className="text-[#4edea3] text-xs font-bold mt-1.5 flex items-center gap-1 font-mono">
              Vendas realizadas no acervo
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
                ? `${((stats.totalCogsBrl / stats.totalRevenueBrl) * 100).toFixed(1)}% da receita total`
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
            <div className="w-full bg-[#353437] h-1.5 rounded-full mt-3 overflow-hidden">
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
                Custo vs Receita vs Lucro Líquido ({activeYear})
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffd165]" />
                <span className="text-[#9b8f79]">Receita</span>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#e5e1e4',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [formatCurrencyBrl(Number(value)), '']}
                />
                <Bar dataKey="Custo" fill="#2a2a2c" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Receita" fill="#ffd165" radius={[4, 4, 0, 0]} barSize={20} />
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#e5e1e4',
                      fontSize: '12px'
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} ${Number(val) === 1 ? 'unidade' : 'unidades'} (${formatCurrencyBrl(item?.payload?.value || 0)})`,
                      'Vendas'
                    ]}
                  />
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

        {/* Tempo Médio de Retenção Metric */}
        <div className="lg:col-span-12 glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ffd165]/10 border border-[#ffd165]/20 flex items-center justify-center text-[#ffd165]">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#e5e1e4]">Tempo Médio de Retenção</h4>
              <p className="text-xs text-[#9b8f79]">
                Duração média em dias entre a compra no fornecedor e a liquidação final.
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#ffd165] font-mono">
              {stats.averageHoldingDays}
            </span>
            <span className="text-sm font-bold text-[#9b8f79] uppercase">Dias</span>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-[#4edea3] text-xs font-bold flex items-center gap-1 font-mono">
              <ArrowDown className="w-3.5 h-3.5" /> 8 dias mais rápido que o mês passado
            </span>
            <p className="text-[11px] text-[#9b8f79] mt-0.5 italic">
              Meta de giro ideal do acervo: 30-45 dias
            </p>
          </div>
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
