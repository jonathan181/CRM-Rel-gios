'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeFetchJson } from '@/lib/api';
import { Watch, SaleDetails } from '@/types/watch';
import { getWatches, saveWatches, resetToInitialWatches } from '@/lib/storage';
import { INITIAL_WATCHES } from '@/lib/initialData';
import { Navbar } from '@/components/Navbar';
import { InventoryView } from '@/components/InventoryView';
import { TransactionForm } from '@/components/TransactionForm';
import { FinancialAnalyticsView } from '@/components/FinancialAnalyticsView';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LoginPage } from '@/components/LoginPage';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'estoque' | 'registrar' | 'analise'>('estoque');
  const [watches, setWatches] = useState<Watch[]>(() => {
    if (typeof window !== 'undefined') {
      return getWatches();
    }
    return [];
  });
  const [isLoadingWatches, setIsLoadingWatches] = useState<boolean>(true);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { user, loading, getToken } = useAuth();

  // Fetch watches from Cloud SQL when authenticated
  const fetchCloudSqlWatches = useCallback(async () => {
    if (!user) {
      setIsLoadingWatches(false);
      return;
    }
    setIsSyncing(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsLoadingWatches(false);
        return;
      }
      const res = await fetch('/api/watches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeFetchJson(res);
        if (Array.isArray(data.watches)) {
          setWatches(data.watches);
          saveWatches(data.watches);
        }
      }
    } catch (e) {
      console.error('Error fetching watches from Cloud SQL:', e);
    } finally {
      setIsSyncing(false);
      setIsLoadingWatches(false);
    }
  }, [user, getToken]);

  // Fetch from Cloud SQL on auth
  useEffect(() => {
    if (user) {
      const handle = requestAnimationFrame(() => {
        fetchCloudSqlWatches();
      });
      return () => cancelAnimationFrame(handle);
    } else {
      const handle = requestAnimationFrame(() => {
        setWatches([]);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [user, fetchCloudSqlWatches]);

  // Save watches helper (Local + Cloud SQL)
  const updateWatchesState = async (
    newWatches: Watch[],
    watchToSave?: Watch,
    action?: 'save' | 'delete' | 'replace_all',
    deletedId?: string
  ) => {
    setWatches(newWatches);
    saveWatches(newWatches);

    if (user) {
      setIsSyncing(true);
      try {
        const token = await getToken();
        if (token) {
          if (action === 'delete' && deletedId) {
            await fetch(`/api/watches?id=${encodeURIComponent(deletedId)}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
          } else if (action === 'save' && watchToSave) {
            await fetch('/api/watches', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ watch: watchToSave }),
            });
          } else {
            await fetch('/api/watches', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ action: 'replace_all', watches: newWatches }),
            });
          }
        }
      } catch (e) {
        console.error('Error syncing with Cloud SQL:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handlers
  const handleSaveWatch = (savedWatch: Watch) => {
    const exists = watches.some((w) => w.id === savedWatch.id);
    let updated: Watch[];
    if (exists) {
      updated = watches.map((w) => (w.id === savedWatch.id ? savedWatch : w));
    } else {
      updated = [savedWatch, ...watches];
    }
    updateWatchesState(updated, savedWatch, 'save');
    setEditingWatch(null);
    setActiveTab('estoque');
  };

  const handleConfirmSale = (watchId: string, saleData: SaleDetails) => {
    let updatedWatch: Watch | undefined;
    const updated = watches.map((w) => {
      if (w.id === watchId) {
        updatedWatch = {
          ...w,
          status: 'Vendido' as const,
          sale: saleData,
          updatedAt: new Date().toISOString(),
        };
        return updatedWatch;
      }
      return w;
    });
    updateWatchesState(updated, updatedWatch, 'save');
  };

  const handleDeleteWatch = (watchId: string) => {
    const updated = watches.filter((w) => w.id !== watchId);
    updateWatchesState(updated, undefined, 'delete', watchId);
  };

  const handleEditWatch = (watch: Watch) => {
    setEditingWatch(watch);
    setActiveTab('registrar');
  };

  const handleAddNewClick = () => {
    setEditingWatch(null);
    setActiveTab('registrar');
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  // 1. Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#e5e1e4] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#ffd165]/20 border-t-[#ffd165] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#9b8f79] tracking-wider uppercase">Carregando dados seguros...</p>
      </div>
    );
  }

  // 2. Strict Authentication Requirement: If not logged in, show LoginPage screen
  if (!user) {
    return <LoginPage />;
  }

  // 3. Authenticated Application Layout
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e5e1e4]">
      {/* Navbar (Sidebar on desktop, Top Header & Bottom Tabs on Mobile) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'registrar') setEditingWatch(null);
          setActiveTab(tab);
        }}
        onResetData={handleResetData}
        watchCount={watches.filter((w) => w.status === 'Em Estoque').length}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="lg:pl-[280px] pt-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        {activeTab === 'estoque' && (
          <InventoryView
            watches={watches}
            isLoading={isLoadingWatches}
            isSyncing={isSyncing}
            onEditWatch={handleEditWatch}
            onConfirmSale={handleConfirmSale}
            onDeleteWatch={handleDeleteWatch}
            onAddNewClick={handleAddNewClick}
          />
        )}

        {activeTab === 'registrar' && (
          <TransactionForm
            initialWatch={editingWatch}
            onSave={handleSaveWatch}
            onCancel={() => {
              setEditingWatch(null);
              setActiveTab('estoque');
            }}
          />
        )}

        {activeTab === 'analise' && (
          <FinancialAnalyticsView watches={watches} />
        )}
      </main>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Zerar Estoque"
        description="Deseja remover todos os relógios e zerar o estoque da sua conta?"
        confirmLabel="Zerar Estoque"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={() => {
          updateWatchesState([], undefined, 'replace_all');
          setEditingWatch(null);
          setActiveTab('estoque');
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}

