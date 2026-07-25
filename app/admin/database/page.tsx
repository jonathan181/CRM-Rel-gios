'use client';

import React, { useState, useEffect } from 'react';
import { safeFetchJson } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Database, Users, Watch, RefreshCw, ArrowLeft, ShieldCheck, Search, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function DatabaseViewerPage() {
  const { user, loading, getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'watches'>('watches');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDatabase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Você precisa estar logado para acessar os registros do banco de dados.');
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/admin/db', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await safeFetchJson(res);
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao carregar registros do banco.');
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao carregar banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const handle = requestAnimationFrame(() => {
        fetchDatabase();
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e11] text-[#f4efe6] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-[#ffd165]">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Carregando autenticação...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0e11] text-[#f4efe6] flex flex-col items-center justify-center p-6">
        <div className="bg-[#18171b] border border-[#27272a] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <Database className="w-12 h-12 text-[#ffd165] mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Acesso Restrito ao Banco de Dados</h1>
          <p className="text-[#9b8f79] text-sm mb-6">
            Por favor, faça login na aplicação para visualizar os registros do banco de dados Supabase (PostgreSQL).
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ffd165] text-[#0f0e11] font-semibold text-sm rounded-xl hover:bg-[#e6bb53] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  const usersList = data?.tables?.users || [];
  const watchesList = data?.tables?.watches || [];

  const filteredUsers = usersList.filter((u: any) =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.uid || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWatches = watchesList.filter((w: any) =>
    (w.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.userUid || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f0e11] text-[#f4efe6] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18171b] border border-[#27272a] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffd165]/10 border border-[#ffd165]/20 flex items-center justify-center text-[#ffd165]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Gerenciador de Banco de Dados</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Supabase (PostgreSQL)
                </span>
              </div>
              <p className="text-xs text-[#9b8f79] mt-0.5">
                Visualização em tempo real das tabelas registradas no banco de dados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDatabase}
              disabled={isLoading}
              className="px-4 py-2 bg-[#201f22] hover:bg-[#2a292e] text-[#f4efe6] text-xs font-medium rounded-xl border border-[#27272a] flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#ffd165]' : ''}`} />
              Atualizar Dados
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-[#ffd165] hover:bg-[#e6bb53] text-[#0f0e11] text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao App
            </Link>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#18171b] border border-[#27272a] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#9b8f79]">Total de Usuários Cadastrados</p>
              <p className="text-2xl font-bold text-[#f4efe6] mt-1">{data?.summary?.totalUsers ?? '...'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#18171b] border border-[#27272a] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#9b8f79]">Total de Relógios no Banco</p>
              <p className="text-2xl font-bold text-[#f4efe6] mt-1">{data?.summary?.totalWatches ?? '...'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ffd165]/10 text-[#ffd165] flex items-center justify-center">
              <Watch className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#18171b] border border-[#27272a] rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#9b8f79]">Motor de Banco de Dados</p>
              <p className="text-sm font-semibold text-[#22c55e] mt-1">Supabase (PostgreSQL)</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Controls and Tabs */}
        <div className="bg-[#18171b] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('watches')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === 'watches'
                    ? 'bg-[#ffd165] text-[#0f0e11]'
                    : 'bg-[#201f22] text-[#9b8f79] hover:text-[#f4efe6]'
                }`}
              >
                <Watch className="w-4 h-4" /> Tabela Relógios ({watchesList.length})
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === 'users'
                    ? 'bg-[#ffd165] text-[#0f0e11]'
                    : 'bg-[#201f22] text-[#9b8f79] hover:text-[#f4efe6]'
                }`}
              >
                <Users className="w-4 h-4" /> Tabela Usuários ({usersList.length})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#9b8f79] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f0e11] border border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-xs text-[#f4efe6] focus:outline-none focus:border-[#ffd165]"
              />
            </div>
          </div>

          {/* Table Data Render */}
          {activeTab === 'watches' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#f4efe6]">
                <thead className="bg-[#0f0e11] text-[#9b8f79] uppercase font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="p-3">ID / Ref</th>
                    <th className="p-3">Marca & Modelo</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Custo Total (BRL)</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3">Comprador</th>
                    <th className="p-3">UID do Proprietário</th>
                    <th className="p-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {filteredWatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#9b8f79]">
                        Nenhum relógio encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    filteredWatches.map((watch: any) => (
                      <tr key={watch.id} className="hover:bg-[#201f22]/50 transition-colors font-mono">
                        <td className="p-3 font-semibold text-[#ffd165]">{watch.id}</td>
                        <td className="p-3 font-sans font-medium">
                          {watch.brand} {watch.model}
                          <span className="block text-[10px] text-[#9b8f79] font-mono">Ref: {watch.ref}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              watch.status === 'Vendido'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {watch.status}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-400">
                          R$ {Number(watch.totalCostBrl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans text-[#9b8f79]">{watch.supplier || 'N/A'}</td>
                        <td className="p-3 font-sans text-[#9b8f79]">{watch.buyerName || '-'}</td>
                        <td className="p-3 text-[10px] text-[#9b8f79] truncate max-w-[120px]" title={watch.userUid}>
                          {watch.userUid}
                        </td>
                        <td className="p-3 text-[10px] text-[#9b8f79]">
                          {watch.createdAt ? new Date(watch.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#f4efe6]">
                <thead className="bg-[#0f0e11] text-[#9b8f79] uppercase font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="p-3">ID Banco</th>
                    <th className="p-3">Nome</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3">UID Autenticação</th>
                    <th className="p-3">Data de Criação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#9b8f79]">
                        Nenhum usuário encontrado na tabela.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-[#201f22]/50 transition-colors font-mono">
                        <td className="p-3 font-semibold text-[#ffd165]">#{u.id}</td>
                        <td className="p-3 font-sans font-medium text-[#f4efe6]">{u.name || 'Sem nome'}</td>
                        <td className="p-3 font-sans text-blue-400">{u.email}</td>
                        <td className="p-3 text-[11px] text-[#9b8f79]">{u.uid}</td>
                        <td className="p-3 text-[10px] text-[#9b8f79]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
