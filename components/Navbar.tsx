'use client';

import React from 'react';
import Link from 'next/link';
import { Watch, PlusCircle, BarChart3, Bell, ShieldCheck, RefreshCw, Database, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface NavbarProps {
  activeTab: 'estoque' | 'registrar' | 'analise';
  setActiveTab: (tab: 'estoque' | 'registrar' | 'analise') => void;
  onResetData?: () => void;
  watchCount?: number;
  isSyncing?: boolean;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  watchCount = 0,
  isSyncing = false,
  onOpenLogin,
}) => {
  const { user, signInWithGoogle, signOutUser, loading } = useAuth();

  return (
    <>
      {/* Navigation Drawer (Desktop Sidebar) */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 hidden lg:flex bg-[#131315] border-r border-[#27272a] flex-col justify-between p-6 z-40">
        <div>
          {/* Logo Branding */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Watch className="w-6 h-6 text-[#ffd165]" />
              <h1 className="font-bold text-lg text-[#ffd165] tracking-tight">
                Horological Precision
              </h1>
            </div>
            <p className="text-[#9b8f79] text-xs uppercase tracking-widest font-medium pl-8">
              Painel Executivo
            </p>
          </div>

          {/* Database Cloud SQL Status Badge */}
          <div className="mb-6 px-3 py-2 bg-[#1a1a1c] border border-[#27272a] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#4edea3]" />
              <span className="font-medium text-[#e5e1e4]">PostgreSQL Cloud SQL</span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
              {isSyncing ? 'Sincronizando...' : 'Ativo'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('registrar')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'registrar'
                  ? 'text-[#ffd165] bg-[#2a2a2c] shadow-sm'
                  : 'text-[#e5e1e4]/70 hover:text-[#ffd165] hover:bg-[#201f22]'
              }`}
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <PlusCircle className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap truncate">Registrar Relógio / Venda</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('estoque')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'estoque'
                  ? 'text-[#ffd165] bg-[#2a2a2c] shadow-sm'
                  : 'text-[#e5e1e4]/70 hover:text-[#ffd165] hover:bg-[#201f22]'
              }`}
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <Watch className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap truncate">Controle de Estoque</span>
              </div>
              {watchCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#353437] text-[#ffd165] font-mono flex-shrink-0 ml-2">
                  {watchCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analise')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'analise'
                  ? 'text-[#ffd165] bg-[#2a2a2c] shadow-sm'
                  : 'text-[#e5e1e4]/70 hover:text-[#ffd165] hover:bg-[#201f22]'
              }`}
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap truncate">Análise Financeira</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="pt-6 border-t border-[#27272a] space-y-3">
          {onResetData && (
            <button
              onClick={onResetData}
              title="Zerar todo o estoque"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#9b8f79] hover:text-[#e51c44] hover:bg-[#e51c44]/10 rounded-lg transition-colors border border-[#27272a]/50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Zerar Estoque</span>
            </button>
          )}

          {user ? (
            <div className="bg-[#1a1a1c] border border-[#27272a] p-3 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuário'}
                    className="w-8 h-8 rounded-full border border-[#ffd165]/40 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#353437] border border-[#ffd165]/30 flex items-center justify-center text-[#ffd165] text-xs font-bold flex-shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="overflow-hidden min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-[#e5e1e4] truncate">{user.displayName || user.email}</p>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                  </div>
                  <p className="text-[10px] text-[#9b8f79] truncate">{user.email}</p>
                </div>
              </div>
              <Link
                href="/admin/database"
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-[#ffd165] hover:bg-[#ffd165]/10 rounded-lg transition-colors border border-[#ffd165]/20 font-medium"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Ver Banco de Dados</span>
              </Link>
              <button
                onClick={signOutUser}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-[#e51c44] hover:bg-[#e51c44]/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da conta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onOpenLogin}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#ffd165] text-[#131315] font-bold text-xs rounded-xl hover:bg-[#e5bc53] transition-colors shadow-md cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1a1a1c] hover:bg-[#27272a] text-[#e5e1e4] font-medium text-[11px] rounded-xl transition-colors border border-[#27272a] cursor-pointer disabled:opacity-50"
              >
                <span>Login com Google</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Top App Bar (Mobile & Tablet Header) */}
      <header className="lg:pl-[280px] flex justify-between items-center px-4 md:px-8 h-16 fixed top-0 left-0 right-0 z-30 bg-[#131315]/90 backdrop-blur-md border-b border-[#27272a]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <Watch className="w-5 h-5 text-[#ffd165]" />
          </div>
          <h2
            id="page-active-tab-title"
            className="font-bold text-sm sm:text-base md:text-lg text-[#ffd165] tracking-tight ml-2 sm:ml-3 md:ml-4 lg:ml-8 truncate"
          >
            {activeTab === 'estoque' && 'Controle de Estoque e Vendas'}
            {activeTab === 'registrar' && 'Lançamento de Transação'}
            {activeTab === 'analise' && 'Análise Financeira'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onResetData && (
            <button
              onClick={onResetData}
              title="Restaurar dados"
              className="lg:hidden p-2 text-[#9b8f79] hover:text-[#ffd165] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button className="p-2 text-[#e5e1e4] hover:bg-[#201f22] rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffd165]" />
          </button>

          <div className="w-8 h-8 rounded-full bg-[#353437] border border-[#ffd165]/30 overflow-hidden flex items-center justify-center text-[#ffd165] text-xs font-bold lg:hidden">
            AT
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-[#27272a] bg-[#131315]/95 backdrop-blur-md shadow-2xl flex justify-around items-center h-16 px-2">
        <button
          onClick={() => setActiveTab('registrar')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'registrar'
              ? 'text-[#ffd165] font-bold'
              : 'text-[#9b8f79] hover:text-[#e5e1e4]'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Registrar</span>
        </button>

        <button
          onClick={() => setActiveTab('estoque')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'estoque'
              ? 'text-[#ffd165] font-bold'
              : 'text-[#9b8f79] hover:text-[#e5e1e4]'
          }`}
        >
          <Watch className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Estoque</span>
        </button>

        <button
          onClick={() => setActiveTab('analise')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'analise'
              ? 'text-[#ffd165] font-bold'
              : 'text-[#9b8f79] hover:text-[#e5e1e4]'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Análise</span>
        </button>
      </nav>
    </>
  );
};
