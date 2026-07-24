export type WatchStatus = 'Em Estoque' | 'Vendido' | 'Consignação';

export type CurrencyCode = 'BRL' | 'CNY' | 'USD' | 'EUR';

export interface SaleDetails {
  salePriceBrl: number;
  salePriceUsd?: number;
  saleDate: string; // ISO or YYYY-MM-DD
  shippingAndFeesBrl: number;
  buyerName: string;
  buyerContact?: string;
  notes?: string;
}

export interface Watch {
  id: string;
  brand: string;
  model: string;
  ref: string;
  serialNumber?: string;
  condition: string; // e.g., 'Novo', '100% Mint', '95%', '60%', '50%-'
  purchaseDate: string; // YYYY-MM-DD
  shipmentDateBrazil?: string; // YYYY-MM-DD (optional)
  arrivalDateBrazil?: string; // YYYY-MM-DD (optional)
  
  // Purchase Costs & Currency conversion
  purchaseCurrency: CurrencyCode;
  purchasePrice: number; // in original currency
  freightCost: number; // in original currency
  exchangeRate: number; // e.g. CNY to BRL rate (0.85), USD to BRL (5.60)
  taxesBrl: number; // Import taxes/fees in BRL
  totalCostBrl: number; // Calculated: (purchasePrice + freightCost) * exchangeRate + taxesBrl

  supplier: string;
  notesAndSpecs?: string; // Box, papers, movement details, condition notes

  // Image links (direct URLs or data URLs)
  images: string[];
  
  // Status & Sales
  status: WatchStatus;
  marketPriceBrl?: number; // Estimated market value when in stock
  sale?: SaleDetails;

  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalActiveStockValueBrl: number;
  totalActiveStockCount: number;
  soldCountMonth: number;
  profitMonthBrl: number;
  totalRevenueBrl: number;
  totalCogsBrl: number;
  netProfitBrl: number;
  averageMarginPercent: number;
  averageHoldingDays: number;
}

export type PeriodFilter = 'Este Mês' | 'Últimos 30 Dias' | 'No Ano' | 'Todos';
