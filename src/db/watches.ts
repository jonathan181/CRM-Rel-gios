import { db } from './index';
import { watches } from './schema';
import { eq, and } from 'drizzle-orm';
import { Watch } from '@/types/watch';

export async function getWatchesFromDb(userUid: string): Promise<Watch[]> {
  try {
    const rows = await db.select().from(watches).where(eq(watches.userUid, userUid));
    return rows.map((r) => ({
      id: r.id,
      brand: r.brand,
      model: r.model,
      ref: r.ref,
      serialNumber: r.serialNumber || undefined,
      condition: r.condition,
      purchaseDate: r.purchaseDate,
      purchaseCurrency: r.purchaseCurrency as any,
      purchasePrice: r.purchasePrice,
      freightCost: r.freightCost,
      exchangeRate: r.exchangeRate,
      taxesBrl: r.taxesBrl,
      totalCostBrl: r.totalCostBrl,
      supplier: r.supplier,
      notesAndSpecs: r.notesAndSpecs || undefined,
      images: (r.images as string[]) || [],
      status: r.status as any,
      marketPriceBrl: r.marketPriceBrl ?? undefined,
      sale: r.salePriceBrl !== null && r.salePriceBrl !== undefined ? {
        salePriceBrl: r.salePriceBrl,
        salePriceUsd: r.salePriceUsd ?? undefined,
        saleDate: r.saleDate || '',
        shippingAndFeesBrl: r.shippingAndFeesBrl || 0,
        buyerName: r.buyerName || '',
        buyerContact: r.buyerContact || undefined,
        notes: r.saleNotes || undefined,
      } : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching watches from DB:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertWatchInDb(watch: Watch, userUid: string, userId?: number): Promise<Watch> {
  try {
    const values = {
      id: watch.id,
      userId: userId || null,
      userUid,
      brand: watch.brand,
      model: watch.model,
      ref: watch.ref,
      serialNumber: watch.serialNumber || null,
      condition: watch.condition,
      purchaseDate: watch.purchaseDate,
      purchaseCurrency: watch.purchaseCurrency,
      purchasePrice: watch.purchasePrice,
      freightCost: watch.freightCost,
      exchangeRate: watch.exchangeRate,
      taxesBrl: watch.taxesBrl,
      totalCostBrl: watch.totalCostBrl,
      supplier: watch.supplier,
      notesAndSpecs: watch.notesAndSpecs || null,
      images: watch.images || [],
      status: watch.status,
      marketPriceBrl: watch.marketPriceBrl ?? null,
      salePriceBrl: watch.sale?.salePriceBrl ?? null,
      salePriceUsd: watch.sale?.salePriceUsd ?? null,
      saleDate: watch.sale?.saleDate ?? null,
      shippingAndFeesBrl: watch.sale?.shippingAndFeesBrl ?? null,
      buyerName: watch.sale?.buyerName ?? null,
      buyerContact: watch.sale?.buyerContact ?? null,
      saleNotes: watch.sale?.notes ?? null,
      updatedAt: new Date(),
    };

    await db.insert(watches)
      .values(values)
      .onConflictDoUpdate({
        target: watches.id,
        set: values,
      });

    return watch;
  } catch (error) {
    console.error('Error upserting watch in DB:', error);
    throw new Error('Failed to save watch to database.', { cause: error });
  }
}

export async function deleteWatchFromDb(watchId: string, userUid: string): Promise<void> {
  try {
    await db.delete(watches).where(and(eq(watches.id, watchId), eq(watches.userUid, userUid)));
  } catch (error) {
    console.error('Error deleting watch from DB:', error);
    throw new Error('Failed to delete watch from database.', { cause: error });
  }
}

export async function replaceAllWatchesInDb(newWatches: Watch[], userUid: string, userId?: number): Promise<Watch[]> {
  try {
    // Delete existing watches for user
    await db.delete(watches).where(eq(watches.userUid, userUid));
    
    // Insert new watches
    for (const w of newWatches) {
      await upsertWatchInDb(w, userUid, userId);
    }
    return newWatches;
  } catch (error) {
    console.error('Error replacing watches in DB:', error);
    throw new Error('Failed to update watches list in database.', { cause: error });
  }
}
