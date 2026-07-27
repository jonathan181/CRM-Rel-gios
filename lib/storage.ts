import { Watch, InventoryStats } from '@/types/watch';
import { INITIAL_WATCHES } from './initialData';

const STORAGE_KEY = 'horological_precision_watches_v1';

export function getWatches(): Watch[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading watches from localStorage:', e);
  }
  return [];
}

export function saveWatches(watches: Watch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watches));
  } catch (e) {
    console.error('Error saving watches to localStorage:', e);
  }
}

export function resetToInitialWatches(): Watch[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
  return [];
}

export function calculateInventoryStats(watches: Watch[]): InventoryStats {
  const activeStock = watches.filter(w => {
    const s = (w.status || '').toLowerCase();
    return s === 'em estoque' || s === 'consignação' || s === 'consignacao';
  });

  // Strictly filter only sold watches with sale details
  const soldWatches = watches.filter(w => {
    const s = (w.status || '').toLowerCase();
    return s === 'vendido' && w.sale !== undefined && w.sale !== null;
  });

  // Valor do Estoque Ativo (preço mercado ou custo)
  const totalActiveStockValueBrl = activeStock.reduce((acc, w) => {
    return acc + (w.marketPriceBrl || w.totalCostBrl);
  }, 0);

  // Vendas acumuladas (Faturamento bruto, taxas e receita líquida)
  const totalGrossRevenueBrl = soldWatches.reduce((acc, w) => acc + (w.sale?.salePriceBrl || 0), 0);
  const totalSellingFees = soldWatches.reduce((acc, w) => acc + (w.sale?.shippingAndFeesBrl || 0), 0);
  const totalRevenueBrl = totalGrossRevenueBrl - totalSellingFees; // Receita líquida
  const totalCogsBrl = soldWatches.reduce((acc, w) => acc + w.totalCostBrl, 0);
  const netProfitBrl = totalRevenueBrl - totalCogsBrl;

  // Margem % = (Lucro Líquido / Faturamento Bruto) * 100 (apenas relógios vendidos)
  const averageMarginPercent = totalGrossRevenueBrl > 0 
    ? ((netProfitBrl / totalGrossRevenueBrl) * 100) 
    : 0;

  // Calculo de giro medio de estoque (dias entre compra e venda)
  let totalHoldingDays = 0;
  let countWithHoldingDays = 0;

  soldWatches.forEach(w => {
    if (w.purchaseDate && w.sale?.saleDate) {
      const buyDate = new Date(w.purchaseDate).getTime();
      const sellDate = new Date(w.sale.saleDate).getTime();
      const diffDays = Math.max(1, Math.round((sellDate - buyDate) / (1000 * 3600 * 24)));
      totalHoldingDays += diffDays;
      countWithHoldingDays++;
    }
  });

  const averageHoldingDays = countWithHoldingDays > 0 
    ? Math.round(totalHoldingDays / countWithHoldingDays) 
    : 0;

  // Calculo vendas mês atual
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const soldThisMonth = soldWatches.filter(w => w.sale?.saleDate?.startsWith(currentMonthYear));
  const soldCountMonth = soldThisMonth.length;
  const profitMonthBrl = soldThisMonth.reduce((acc, w) => {
    const rev = w.sale?.salePriceBrl || 0;
    const fee = w.sale?.shippingAndFeesBrl || 0;
    return acc + (rev - w.totalCostBrl - fee);
  }, 0);

  return {
    totalActiveStockValueBrl,
    totalActiveStockCount: activeStock.length,
    soldCountMonth,
    profitMonthBrl,
    totalRevenueBrl,
    totalCogsBrl,
    netProfitBrl,
    averageMarginPercent,
    averageHoldingDays
  };
}

export function formatCurrencyBrl(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(val);
}

export function formatCurrencyUsd(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
}

export function formatDatePtBr(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}
