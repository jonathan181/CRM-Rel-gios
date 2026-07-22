'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Watch, Mail, Lock, User as UserIcon, LogIn, UserPlus, ShieldCheck, Database, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && !name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha email e senha.');
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
      } else {
        await signInWithEmail(email.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      let message = 'Ocorreu um erro ao processar sua solicitação.';
      if (err.code === 'auth/operation-not-allowed') {
        message = 'O login por E-mail/Senha não está ativado no Firebase Console. Por favor, utilize o botão "Continuar com conta Google" para entrar instantaneamente.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setError('Não foi possível entrar com a conta Google. Tente novamente.');
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
            <span className="text-[#e5e1e4] font-medium">Banco PostgreSQL (Cloud SQL)</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded-full border border-[#4edea3]/20">
            <ShieldCheck className="w-3 h-3" /> Conectado
          </span>
        </div>

        {/* Google OAuth Button - Recommended */}
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
          <span>Entrar com conta Google (Recomendado)</span>
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

        {/* Alert Error Box */}
        {error && (
          <div className="bg-[#e51c44]/10 border border-[#e51c44]/30 rounded-xl p-3 text-xs text-[#e51c44] flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-xs font-medium text-[#9b8f79]">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9b8f79] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Sua senha secreta"
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
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
