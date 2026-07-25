'use client';

import React, { useState } from 'react';
import { safeFetchJson } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { ErrorDetailsModal, ErrorDetailsInfo } from './ErrorDetailsModal';
import { Watch, Mail, Lock, User as UserIcon, LogIn, UserPlus, ShieldCheck, Database, AlertCircle, CheckCircle, KeyRound, Sparkles, Terminal } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemo } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorDetailsInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorInfo(null);
    setSuccessMsg(null);

    if (mode === 'register' && !name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        await signUpWithEmail(name.trim(), email.trim(), password);
        if (onSuccess) onSuccess();
      } else if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
        if (onSuccess) onSuccess();
      } else if (mode === 'reset') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), newPassword: password }),
        });
        const data = await safeFetchJson(res);
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Erro ao redefinir a senha.');
        }
        setSuccessMsg('Senha redefinida com sucesso! Informe sua nova senha para entrar.');
        setMode('login');
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      let message = 'Ocorreu um erro ao processar sua solicitação.';
      if (err.code === 'auth/operation-not-allowed') {
        message = 'O login por E-mail/Senha não está ativado no Firebase Console. Utilize o botão Google ou Modo Demonstração.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Senha incorreta. Tente novamente ou redefina sua senha.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado. Verifique seu e-mail ou crie uma conta.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      setErrorInfo({
        message,
        status: err.status,
        statusText: err.statusText,
        url: err.url || (mode === 'reset' ? '/api/auth/reset-password' : mode === 'register' ? '/api/auth/register' : '/api/auth/login'),
        bodyText: err.bodyText || err.stack || JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        timestamp: err.timestamp || new Date().toLocaleString('pt-BR'),
        rawError: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setErrorInfo(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      const message = 'Não foi possível entrar com a conta Google. Tente novamente ou use o Modo Demonstração.';
      setError(message);
      setErrorInfo({
        message,
        status: err.status,
        statusText: err.statusText,
        url: 'Google OAuth / Firebase Auth',
        bodyText: err.bodyText || err.message || JSON.stringify(err),
        timestamp: new Date().toLocaleString('pt-BR'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setErrorInfo(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInAsDemo();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro no modo demonstração:', err);
      const message = 'Erro ao iniciar modo demonstração.';
      setError(message);
      setErrorInfo({
        message,
        status: err.status,
        statusText: err.statusText,
        url: 'Demo Auth',
        bodyText: err.bodyText || err.message || JSON.stringify(err),
        timestamp: new Date().toLocaleString('pt-BR'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e5e1e4] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle Golden Glow Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ffd165]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#4edea3]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#131315] border border-[#27272a] rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#1a1a1c] border border-[#ffd165]/30 rounded-2xl mb-1 shadow-inner">
            <Watch className="w-8 h-8 text-[#ffd165]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ffd165]">
            HOROLOGICAL PRECISION
          </h1>
          <p className="text-xs text-[#9b8f79] tracking-widest uppercase font-medium">
            Gestão Executiva de Estoque & Vendas
          </p>
        </div>

        {/* Database Status Indicator */}
        <div className="bg-[#1a1a1c] border border-[#27272a] rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#4edea3]" />
            <span className="text-[#e5e1e4] font-medium">Banco Supabase (PostgreSQL)</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded-full border border-[#4edea3]/20">
            <ShieldCheck className="w-3 h-3" /> Ativo
          </span>
        </div>

        {/* Quick Demo Mode Access Button */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          disabled={loading}
          className="w-full py-3 bg-[#ffd165]/10 hover:bg-[#ffd165]/20 text-[#ffd165] border border-[#ffd165]/40 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-[#ffd165]" />
          <span>Acessar Modo Demonstração (Sem Cadastro)</span>
        </button>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-[#ffffff] hover:bg-gray-100 text-gray-900 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>Entrar com conta Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-[#27272a]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-[#9b8f79] uppercase">ou com e-mail</span>
          <div className="flex-grow border-t border-[#27272a]"></div>
        </div>

        {/* Tab Switchers (Login / Cadastro) */}
        <div className="flex bg-[#1a1a1c] p-1 rounded-xl border border-[#27272a]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-[#ffd165] text-[#131315] shadow-md'
                : 'text-[#9b8f79] hover:text-[#e5e1e4]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-[#ffd165] text-[#131315] shadow-md'
                : 'text-[#9b8f79] hover:text-[#e5e1e4]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Alert Success Box */}
        {successMsg && (
          <div className="bg-[#4edea3]/10 border border-[#4edea3]/30 rounded-xl p-3 text-xs text-[#4edea3] flex items-start gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Alert Error Box */}
        {error && (
          <div className="bg-[#e51c44]/10 border border-[#e51c44]/30 rounded-xl p-3.5 text-xs text-[#e51c44] flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{error}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#e51c44]/20 text-[11px]">
              {error.includes('Senha incorreta') ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                  }}
                  className="text-left underline font-medium text-[#ffd165] hover:text-[#e5bc53] transition-colors"
                >
                  Esqueceu sua senha? Clique para redefinir.
                </button>
              ) : <span />}

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e51c44]/20 hover:bg-[#e51c44]/30 text-[#e5e1e4] font-bold rounded-lg border border-[#e51c44]/40 transition-all cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-[#ffd165]" />
                <span>Ver Detalhes do Erro</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'reset' && (
            <div className="p-3 bg-[#ffd165]/10 border border-[#ffd165]/20 rounded-xl text-xs text-[#ffd165] flex items-center gap-2">
              <KeyRound className="w-4 h-4 flex-shrink-0" />
              <span>Digite seu e-mail e escolha sua nova senha abaixo.</span>
            </div>
          )}

          {/* Name Field (Cadastro) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9b8f79]">Nome Completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#9b8f79] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#1a1a1c] border border-[#27272a] rounded-xl text-xs text-[#e5e1e4] focus:outline-none focus:border-[#ffd165] transition-colors placeholder-[#9b8f79]/50"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9b8f79]">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9b8f79] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#1a1a1c] border border-[#27272a] rounded-xl text-xs text-[#e5e1e4] focus:outline-none focus:border-[#ffd165] transition-colors placeholder-[#9b8f79]/50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#9b8f79]">
                {mode === 'reset' ? 'Nova Senha' : 'Senha'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-[#9b8f79] hover:text-[#ffd165] transition-colors"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9b8f79] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder={mode === 'reset' ? 'Digite a nova senha' : 'Sua senha secreta'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#1a1a1c] border border-[#27272a] rounded-xl text-xs text-[#e5e1e4] focus:outline-none focus:border-[#ffd165] transition-colors placeholder-[#9b8f79]/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#ffd165] hover:bg-[#e5bc53] text-[#131315] font-bold text-xs rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Processando...</span>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar e Entrar</span>
              </>
            ) : mode === 'reset' ? (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Redefinir e Salvar Senha</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Detailed Technical Error Modal */}
      <ErrorDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        errorInfo={errorInfo}
      />
    </div>
  );
};
