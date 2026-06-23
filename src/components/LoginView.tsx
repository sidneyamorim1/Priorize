import React, { useState } from 'react';
import { CheckSquare, ArrowRight, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para Recuperação de Senha
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }
    setError('');
    setIsLoading(true);
    const errorMsg = await onLogin(email, password);
    setIsLoading(false);
    if (errorMsg) setError(errorMsg);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Por favor, informe seu e-mail.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Por favor, insira um e-mail válido.');
      return;
    }

    setResetError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (resetErr) {
        setResetError(resetErr.message || 'Erro ao enviar e-mail. Verifique o endereço digitado.');
      } else {
        setResetSuccess('Link de recuperação enviado! Verifique a sua caixa de entrada.');
        setResetEmail('');
      }
    } catch (err) {
      console.error(err);
      setResetError('Erro de conexão ao servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setResetError('');
    setResetSuccess('');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100/50 animate-slide-up">
        
        {/* LOGO & CADEÇALHO */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white shadow-lg shadow-brand-500/20">
            <CheckSquare className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-800">
            {isForgotPassword ? 'Recuperar Senha' : 'Bem-vindo ao Priorize'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isForgotPassword 
              ? 'Digite o e-mail associado à sua conta para receber um link de redefinição de senha.' 
              : 'A ferramenta moderna para organizar suas tarefas e maximizar sua produtividade diária.'}
          </p>
        </div>

        {/* FLUXO DE RECUPERAÇÃO DE SENHA */}
        {isForgotPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleResetSubmit}>
            {resetError && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100 animate-fade-in">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-600 border border-emerald-100 animate-fade-in">
                {resetSuccess}
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="ex: joao@empresa.com"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-xl bg-brand-500 py-3 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 active:scale-98 transition-all duration-200 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar E-mail de Recuperação'
                )}
              </button>

              <button
                type="button"
                onClick={toggleMode}
                className="flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors focus:outline-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </button>
            </div>
          </form>
        ) : (
          /* FLUXO DE LOGIN PADRÃO */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100 animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-4 rounded-md">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: joao@empresa.com"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors focus:outline-none"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ex: suaSenhaSegura"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-xl bg-brand-500 py-3 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 active:scale-98 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Entrando...
                  </span>
                ) : (
                  <>
                    Começar a Organizar
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
