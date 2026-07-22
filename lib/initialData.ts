import { Watch } from '@/types/watch';

export const STOCK_PRESET_IMAGES = [
  {
    title: 'Rolex Cosmograph Daytona Panda',
    url: 'https://images.unsplash.com/photo-1547996160-01ff2474867a?q=80&w=1200&auto=format&fit=crop',
    brand: 'Rolex'
  },
  {
    title: 'Patek Philippe Nautilus Blue Dial',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
    brand: 'Patek Philippe'
  },
  {
    title: 'Audemars Piguet Royal Oak Jumbo',
    url: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1200&auto=format&fit=crop',
    brand: 'Audemars Piguet'
  },
  {
    title: 'Seiko Prospex Diver Automatic',
    url: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?q=80&w=1200&auto=format&fit=crop',
    brand: 'Seiko'
  },
  {
    title: 'Omega Speedmaster Moonwatch',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop',
    brand: 'Omega'
  },
  {
    title: 'Cartier Santos de Cartier Large',
    url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200&auto=format&fit=crop',
    brand: 'Cartier'
  },
  {
    title: 'Vacheron Constantin Overseas',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
    brand: 'Vacheron Constantin'
  },
  {
    title: 'Rolex Submariner Date Black',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop',
    brand: 'Rolex'
  }
];

export const INITIAL_WATCHES: Watch[] = [
  {
    id: 'w-1',
    brand: 'Rolex',
    model: "Cosmograph Daytona 'Panda'",
    ref: '116500LN',
    serialNumber: 'R789234X',
    condition: 'Novo / Unworn (100%)',
    purchaseDate: '2024-04-10',
    purchaseCurrency: 'USD',
    purchasePrice: 27000,
    freightCost: 500,
    exchangeRate: 5.45,
    taxesBrl: 10325, // Total Cost ~ R$ 160,200
    totalCostBrl: 160200,
    supplier: 'Leilão Privado - Hong Kong',
    notesAndSpecs: 'Caixa completa, certificado de garantia 2024, bezel cerâmico cerachrom, bezel e mostrador sem detalhes.',
    images: [
      'https://images.unsplash.com/photo-1547996160-01ff2474867a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'Em Estoque',
    marketPriceBrl: 180000,
    createdAt: '2024-04-10T10:00:00Z',
    updatedAt: '2024-04-10T10:00:00Z'
  },
  {
    id: 'w-2',
    brand: 'Patek Philippe',
    model: 'Nautilus Blue Dial',
    ref: '5711/1A-010',
    serialNumber: 'PP-992384',
    condition: 'Excelente (95%)',
    purchaseDate: '2024-03-01',
    purchaseCurrency: 'USD',
    purchasePrice: 92000,
    freightCost: 1000,
    exchangeRate: 5.50,
    taxesBrl: 20000,
    totalCostBrl: 531500,
    supplier: 'Revendedor Oficial Genebra',
    notesAndSpecs: 'Acompanha caixa de madeira nobre Patek, certificado de origem e extra de arquivo.',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'Vendido',
    marketPriceBrl: 790000,
    sale: {
      salePriceBrl: 795000,
      saleDate: '2024-05-12',
      shippingAndFeesBrl: 12000,
      buyerName: 'Roberto M. Fontes',
      buyerContact: '+55 11 98822-1100',
      notes: 'Pagamento via transferência bancária à vista. Entregue em mãos em SP.'
    },
    createdAt: '2024-03-01T14:30:00Z',
    updatedAt: '2024-05-12T16:00:00Z'
  },
  {
    id: 'w-3',
    brand: 'Audemars Piguet',
    model: "Royal Oak 'Jumbo' Extra-Thin",
    ref: '15202ST',
    serialNumber: 'AP-554109',
    condition: 'Excelente (98%)',
    purchaseDate: '2024-04-18',
    purchaseCurrency: 'USD',
    purchasePrice: 60000,
    freightCost: 800,
    exchangeRate: 5.50,
    taxesBrl: 12600,
    totalCostBrl: 347000,
    supplier: 'Colecionador Privado - Zurique',
    notesAndSpecs: 'Mostrador Petite Tapisserie azul noturno, movimento ultra-fino Calibre 2121. Estado de zero.',
    images: [
      'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'Em Estoque',
    marketPriceBrl: 435000,
    createdAt: '2024-04-18T09:15:00Z',
    updatedAt: '2024-04-18T09:15:00Z'
  },
  {
    id: 'w-4',
    brand: 'Seiko',
    model: 'Prospex 1965 Diver Modern Re-interpretation',
    ref: 'SPB143J1 / Prospex',
    serialNumber: 'SK-2024-089',
    condition: '60% (Usado com Marcas)',
    purchaseDate: '2024-05-02',
    purchaseCurrency: 'CNY',
    purchasePrice: 4200,
    freightCost: 250,
    exchangeRate: 1.18,
    taxesBrl: 350,
    totalCostBrl: 4121.19,
    supplier: 'Revendedor Japão / Leilão Yahoo',
    notesAndSpecs: 'Caixa original presente, pulseira de aço com marcas normais de uso no fecho, bezel impecável.',
    images: [
      'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'Em Estoque',
    marketPriceBrl: 7200,
    createdAt: '2024-05-02T11:00:00Z',
    updatedAt: '2024-05-02T11:00:00Z'
  },
  {
    id: 'w-5',
    brand: 'Omega',
    model: 'Speedmaster Professional Moonwatch',
    ref: '310.30.42.50.01.001',
    serialNumber: 'OM-8839211',
    condition: 'Novo / Unworn (100%)',
    purchaseDate: '2024-05-20',
    purchaseCurrency: 'USD',
    purchasePrice: 6200,
    freightCost: 200,
    exchangeRate: 5.55,
    taxesBrl: 2100,
    totalCostBrl: 37620,
    supplier: 'Boutique Omega Miami',
    notesAndSpecs: 'Calibre 3861 Co-Axial Master Chronometer, safira frente e verso, estojo de apresentação completo.',
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'Consignação',
    marketPriceBrl: 48000,
    createdAt: '2024-05-20T15:00:00Z',
    updatedAt: '2024-05-20T15:00:00Z'
  },
  {
    id: 'w-6',
    brand: 'Cartier',
    model: 'Santos de Cartier Large Model',
    ref: 'WSSA0018',
    serialNumber: 'CT-392019',
    condition: 'Excelente (96%)',
    purchaseDate: '2024-02-15',
    purchaseCurrency: 'USD',
    purchasePrice: 6500,
    freightCost: 150,
    exchangeRate: 5.40,
    taxesBrl: 1800,
    totalCostBrl: 37710,
    supplier: 'Chrono24 Dealer - Europa',
    notesAndSpecs: 'Acompanha pulseira de aço + pulseira extra de couro de crocodilo com fecho fivela QuickSwitch.',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200&auto=format&fit=crop'
    ],
    status: 'Vendido',
    marketPriceBrl: 46000,
    sale: {
      salePriceBrl: 48500,
      saleDate: '2024-04-10',
      shippingAndFeesBrl: 800,
      buyerName: 'Camila A. Siqueira',
      buyerContact: 'camila.s@gmail.com',
      notes: 'Cliente recorrente da loja.'
    },
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2024-04-10T12:00:00Z'
  }
];
