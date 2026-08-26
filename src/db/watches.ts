import { Watch } from '@/types/watch';
import { getSupabaseClient } from '../lib/supabase';

function mapRowToWatch(r: any): Watch {
  const serialNumber = r.serial_number ?? r.serialNumber ?? undefined;
  const purchaseDate = r.purchase_date || r.purchaseDate || '';
  const shipmentDateBrazil = r.shipment_date_brazil ?? r.shipmentDateBrazil ?? undefined;
  const arrivalDateBrazil = r.arrival_date_brazil ?? r.arrivalDateBrazil ?? undefined;
  const purchaseCurrency = r.purchase_currency || r.purchaseCurrency || 'USD';
  const purchasePrice = Number(r.purchase_price ?? r.purchasePrice ?? 0);
  const freightCost = Number(r.freight_cost ?? r.freightCost ?? 0);
  const exchangeRate = Number(r.exchange_rate ?? r.exchangeRate ?? 1);
  const taxesBrl = Number(r.taxes_brl ?? r.taxesBrl ?? 0);
  const totalCostBrl = Number(r.total_cost_brl ?? r.totalCostBrl ?? 0);
  const notesAndSpecs = r.notes_and_specs ?? r.notesAndSpecs ?? undefined;
  const images = Array.isArray(r.images)
    ? r.images
    : typeof r.images === 'string'
    ? JSON.parse(r.images || '[]')
    : [];
  const marketPriceBrl = r.market_price_brl ?? r.marketPriceBrl ?? undefined;

  const salePriceBrl = r.sale_price_brl ?? r.salePriceBrl;
  const salePriceUsd = r.sale_price_usd ?? r.salePriceUsd;
  const saleDate = r.sale_date ?? r.saleDate;
  const shippingAndFeesBrl = r.shipping_and_fees_brl ?? r.shippingAndFeesBrl;
  const buyerName = r.buyer_name ?? r.buyerName;
  const buyerContact = r.buyer_contact ?? r.buyerContact;
  const saleNotes = r.sale_notes ?? r.saleNotes;

  const hasSale = salePriceBrl !== null && salePriceBrl !== undefined;

  return {
    id: r.id,
    brand: r.brand || '',
    model: r.model || '',
    ref: r.ref || '',
    serialNumber: serialNumber || undefined,
    condition: r.condition || 'Usado',
    purchaseDate,
    shipmentDateBrazil: shipmentDateBrazil || undefined,
    arrivalDateBrazil: arrivalDateBrazil || undefined,
    purchaseCurrency: purchaseCurrency as any,
    purchasePrice,
    freightCost,
    exchangeRate,
    taxesBrl,
    totalCostBrl,
    supplier: r.supplier || '',
    notesAndSpecs: notesAndSpecs || undefined,
    images,
    status: r.status as any,
    marketPriceBrl: marketPriceBrl !== undefined && marketPriceBrl !== null ? Number(marketPriceBrl) : undefined,
    sale: hasSale
      ? {
          salePriceBrl: Number(salePriceBrl),
          salePriceUsd: salePriceUsd !== undefined && salePriceUsd !== null ? Number(salePriceUsd) : undefined,
          saleDate: saleDate || '',
          shippingAndFeesBrl: Number(shippingAndFeesBrl || 0),
          buyerName: buyerName || '',
          buyerContact: buyerContact || undefined,
          notes: saleNotes || undefined,
        }
      : undefined,
    createdAt: r.created_at || r.createdAt ? new Date(r.created_at || r.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt ? new Date(r.updated_at || r.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function mapWatchToSupabaseRow(watch: Watch, userUid: string, userId?: number | null) {
  const row: any = {
    id: watch.id,
    user_id: userId || null,
    user_uid: userUid,
    brand: watch.brand || 'Desconhecido',
    model: watch.model || 'N/A',
    ref: watch.ref || 'N/A',
    serial_number: watch.serialNumber || null,
    condition: watch.condition,
    purchase_date: watch.purchaseDate,
    purchase_currency: watch.purchaseCurrency,
    purchase_price: watch.purchasePrice,
    freight_cost: watch.freightCost,
    exchange_rate: watch.exchangeRate,
    taxes_brl: watch.taxesBrl,
    total_cost_brl: watch.totalCostBrl,
    supplier: watch.supplier,
    notes_and_specs: watch.notesAndSpecs || null,
    images: watch.images || [],
    status: watch.status,
    market_price_brl: watch.marketPriceBrl ?? null,
    sale_price_brl: watch.sale?.salePriceBrl ?? null,
    sale_price_usd: watch.sale?.salePriceUsd ?? null,
    sale_date: watch.sale?.saleDate ?? null,
    shipping_and_fees_brl: watch.sale?.shippingAndFeesBrl ?? null,
    buyer_name: watch.sale?.buyerName ?? null,
    buyer_contact: watch.sale?.buyerContact ?? null,
    sale_notes: watch.sale?.notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (watch.shipmentDateBrazil) row.shipment_date_brazil = watch.shipmentDateBrazil;
  if (watch.arrivalDateBrazil) row.arrival_date_brazil = watch.arrivalDateBrazil;

  return row;
}

export async function getWatchesFromDb(userUid: string): Promise<Watch[]> {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return [];
  }

  try {
    let sbUserId: number | null = null;
    let canonicalUid = userUid;

    const { data: userRow } = await supabaseClient
      .from('users')
      .select('id, uid')
      .eq('uid', userUid)
      .maybeSingle();

    if (userRow) {
      sbUserId = userRow.id;
      if (userRow.uid) canonicalUid = userRow.uid;
    }

    let query = supabaseClient.from('watches').select('*');
    if (sbUserId) {
      query = query.or(`user_uid.eq.${canonicalUid},user_id.eq.${sbUserId}`);
    } else {
      query = query.eq('user_uid', canonicalUid);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Warning fetching watches via Supabase client:', error);
      return [];
    }

    if (Array.isArray(data)) {
      return data.map(mapRowToWatch);
    }
  } catch (err: any) {
    console.warn('Warning in getWatchesFromDb:', err);
  }

  return [];
}

export async function upsertWatchInDb(watch: Watch, userUid: string, userId?: number | null): Promise<Watch> {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return watch;
  }

  let resolvedUserId: number | null = userId || null;
  let canonicalUid = userUid;

  if (userUid || userId) {
    let filterStr = `uid.eq.${userUid}`;
    if (userId) filterStr += `,id.eq.${userId}`;

    const { data: existingSbUser } = await supabaseClient
      .from('users')
      .select('id, uid')
      .or(filterStr)
      .maybeSingle();

    if (existingSbUser?.id) {
      resolvedUserId = existingSbUser.id;
      if (existingSbUser.uid) canonicalUid = existingSbUser.uid;
    }
  }

  const rowData = mapWatchToSupabaseRow(watch, canonicalUid, resolvedUserId);
  const { error: sbErr } = await supabaseClient
    .from('watches')
    .upsert(rowData, { onConflict: 'id' });

  if (sbErr) {
    if (sbErr.code === 'PGRST204') {
      // Fallback if Supabase schema cache lacks optional columns
      delete rowData.shipment_date_brazil;
      delete rowData.arrival_date_brazil;
      const { error: retryErr } = await supabaseClient.from('watches').upsert(rowData, { onConflict: 'id' });
      if (retryErr) {
        console.warn('Retry upsert error:', retryErr);
      }
    } else {
      console.warn('Upsert watch warning:', sbErr);
    }
  }

  return watch;
}

export async function deleteWatchFromDb(watchId: string, userUid: string): Promise<void> {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.from('watches').delete().eq('id', watchId);
  if (error) {
    console.warn('Error deleting watch via Supabase client:', error);
  }
}

export async function replaceAllWatchesInDb(newWatches: Watch[], userUid: string, userId?: number): Promise<Watch[]> {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return newWatches;
  }

  const { error: delErr } = await supabaseClient.from('watches').delete().eq('user_uid', userUid);
  if (delErr) {
    console.warn('Error clearing watches via Supabase client:', delErr);
  }

  for (const w of newWatches) {
    const rowData = mapWatchToSupabaseRow(w, userUid, userId);
    const { error: insErr } = await supabaseClient.from('watches').upsert(rowData, { onConflict: 'id' });
    if (insErr) {
      console.warn('Error upserting watch in replaceAll:', insErr);
    }
  }

  return newWatches;
}
