'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { safeFetchJson } from '@/lib/api';
import { Watch, WatchStatus, SaleDetails } from '@/types/watch';
import { getWatches, saveWatches, resetToInitialWatches } from '@/lib/storage';
import { 
  broadcastWatchSaved, 
  broadcastWatchDeleted, 
  broadcastWatchesSynced, 
  subscribeToCrossTabSync 
} from '@/lib/tabSync';
import { Navbar } from '@/components/Navbar';
import { InventoryView } from '@/components/InventoryView';
import { TransactionForm } from '@/components/TransactionForm';
import { FinancialAnalyticsView } from '@/components/FinancialAnalyticsView';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ErrorModal } from '@/components/ErrorModal';
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

  // Prevent background refetches from overwriting active in-flight mutations
  const isMutatingRef = useRef(false);

  // Global Error Modal for persistent / sync failures
  const [globalError, setGlobalError] = useState<{
    title?: string;
    message: string;
    details?: string;
    onRetry?: () => void;
  } | null>(null);

  const { user, loading, getToken } = useAuth();

  // Fetch watches from PostgreSQL / Supabase when authenticated
  const fetchCloudSqlWatches = useCallback(async (silent = false) => {
    if (!user || isMutatingRef.current) {
      if (!user) setIsLoadingWatches(false);
      return;
    }
    if (!silent) setIsSyncing(true);
    try {
      const token = await getToken();
      if (!token) {
        setIsLoadingWatches(false);
        return;
      }
      const res = await fetch('/api/watches', {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
      if (res.ok) {
        try {
          const data = await safeFetchJson(res);
          if (Array.isArray(data.watches) && !isMutatingRef.current) {
            setWatches(data.watches);
            saveWatches(data.watches);
            broadcastWatchesSynced(data.watches);
          }
        } catch {
          // If server response is not JSON (e.g. static fallback), keep local stored watches
          const localWatches = getWatches();
          setWatches(localWatches);
        }
      }
    } catch {
      // Keep local cached watches on network / server fetch failures
      const localWatches = getWatches();
      setWatches(localWatches);
    } finally {
      if (!silent) setIsSyncing(false);
      setIsLoadingWatches(false);
    }
  }, [user, getToken]);

  // Initial fetch and focus / visibility change sync
  useEffect(() => {
    let animFrame: number;
    if (user) {
      animFrame = requestAnimationFrame(() => {
        fetchCloudSqlWatches();
      });

      // When tab regains focus or visibility, refresh silently to keep multi-tab concurrency intact
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchCloudSqlWatches(true);
        }
      };

      const handleFocus = () => {
        fetchCloudSqlWatches(true);
      };

      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);

      return () => {
        cancelAnimationFrame(animFrame);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      animFrame = requestAnimationFrame(() => {
        setWatches([]);
        setIsLoadingWatches(false);
      });
      return () => cancelAnimationFrame(animFrame);
    }
  }, [user, fetchCloudSqlWatches]);

  // Subscribe to real-time Cross-Tab synchronization (BroadcastChannel / storage event)
  useEffect(() => {
    const unsubscribe = subscribeToCrossTabSync((msg) => {
      if (msg.type === 'WATCH_SAVED') {
        setWatches((prev) => {
          const exists = prev.some((w) => w.id === msg.watch.id);
          const updated = exists
            ? prev.map((w) => (w.id === msg.watch.id ? msg.watch : w))
            : [msg.watch, ...prev];
          saveWatches(updated);
          return updated;
        });
      } else if (msg.type === 'WATCH_DELETED') {
        setWatches((prev) => {
          const updated = prev.filter((w) => w.id !== msg.watchId);
          saveWatches(updated);
          return updated;
        });
      } else if (msg.type === 'WATCHES_SYNCED') {
        if (Array.isArray(msg.allWatches)) {
          setWatches(msg.allWatches);
          saveWatches(msg.allWatches);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save / Mutate watches helper with instant Optimistic Updates and verified server persistence
  const updateWatchesState = async (
    newWatches: Watch[],
    watchToSave?: Watch,
    action?: 'save' | 'delete' | 'replace_all',
    deletedId?: string
  ): Promise<boolean> => {
    if (!user) {
      setGlobalError({
        title: 'Sessão Expirada',
        message: 'Você precisa estar autenticado para persistir alterações no estoque.',
      });
      return false;
    }

    isMutatingRef.current = true;
    const previousWatches = watches;

    // 1. INSTANT OPTIMISTIC UPDATE: Update React State, LocalStorage & Broadcast IMMEDIATELY (0ms latency)
    setWatches(newWatches);
    saveWatches(newWatches);

    if (action === 'save' && watchToSave) {
      broadcastWatchSaved(watchToSave, newWatches);
    } else if (action === 'delete' && deletedId) {
      broadcastWatchDeleted(deletedId, newWatches);
    } else {
      broadcastWatchesSynced(newWatches);
    }

    setIsSyncing(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Não foi possível obter a credencial de autenticação. Faça login novamente.');
      }

      let res: Response;
      if (action === 'delete' && deletedId) {
        res = await fetch(`/api/watches?id=${encodeURIComponent(deletedId)}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } else if (action === 'save' && watchToSave) {
        res = await fetch('/api/watches', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ watch: watchToSave }),
        });
      } else {
        res = await fetch('/api/watches', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'replace_all', watches: newWatches }),
        });
      }

      if (!res.ok) {
        const errJson = await safeFetchJson(res).catch(() => ({ error: `Falha no servidor (status ${res.status})` }));
        throw new Error(errJson.error || `Erro de persistência no servidor (${res.status})`);
      }

      return true;
    } catch (e: any) {
      console.error('Error persisting to database:', e);
      // Rollback to previous state on server error
      setWatches(previousWatches);
      saveWatches(previousWatches);
      broadcastWatchesSynced(previousWatches);

      const isNetworkError =
        e?.name === 'TypeError' ||
        e?.message?.includes('fetch') ||
        e?.message?.includes('Failed to fetch') ||
        e?.message?.includes('network');

      const userMessage = isNetworkError
        ? 'Falha de conexão com o banco de dados. A alteração foi revertida.'
        : e?.message || 'Ocorreu um erro ao gravar no banco de dados.';

      setGlobalError({
        title: 'Erro ao Gravar no Banco de Dados',
        message: userMessage,
        details: e?.stack || String(e),
        onRetry: () => {
          setGlobalError(null);
          updateWatchesState(newWatches, watchToSave, action, deletedId);
        },
      });

      return false;
    } finally {
      setIsSyncing(false);
      isMutatingRef.current = false;
    }
  };

  // Handlers
  const handleSaveWatch = async (savedWatch: Watch): Promise<boolean> => {
    const exists = watches.some((w) => w.id === savedWatch.id);
    let updated: Watch[];
    if (exists) {
      updated = watches.map((w) => (w.id === savedWatch.id ? savedWatch : w));
    } else {
      updated = [savedWatch, ...watches];
    }

    setEditingWatch(null);
    setActiveTab('estoque');
    return await updateWatchesState(updated, savedWatch, 'save');
  };

  const handleUpdateWatchStatus = async (watch: Watch, newStatus: WatchStatus): Promise<boolean> => {
    let sale = watch.sale;
    if (newStatus !== 'Vendido') {
      sale = undefined;
    }

    const updatedWatch: Watch = {
      ...watch,
      status: newStatus,
      sale,
      updatedAt: new Date().toISOString(),
    };

    const updated = watches.map((w) => (w.id === watch.id ? updatedWatch : w));
    return await updateWatchesState(updated, updatedWatch, 'save');
  };

  const handleConfirmSale = async (watchId: string, saleData: SaleDetails): Promise<boolean> => {
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

    if (!updatedWatch) return false;
    return await updateWatchesState(updated, updatedWatch, 'save');
  };

  const handleDeleteWatch = async (watchId: string): Promise<boolean> => {
    const updated = watches.filter((w) => w.id !== watchId);
    return await updateWatchesState(updated, undefined, 'delete', watchId);
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
            onUpdateWatchStatus={handleUpdateWatchStatus}
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
        description="Deseja remover todos os relógios e zerar o estoque da sua conta no banco de dados?"
        confirmLabel="Zerar Estoque"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={async () => {
          const ok = await updateWatchesState([], undefined, 'replace_all');
          if (ok) {
            setEditingWatch(null);
            setActiveTab('estoque');
            setShowResetConfirm(false);
          }
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Global Persistence / Concurrency Error Pop-up Modal */}
      <ErrorModal
        isOpen={globalError !== null}
        title={globalError?.title || 'Erro ao Gravar no Banco de Dados'}
        errorMessage={globalError?.message || 'Falha ao persistir alterações.'}
        technicalDetails={globalError?.details}
        onRetry={globalError?.onRetry}
        onClose={() => setGlobalError(null)}
        retryLabel="Tentar Novamente"
        closeLabel="Fechar"
      />
    </div>
  );
}
