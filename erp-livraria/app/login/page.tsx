"use client";

import Link from 'next/link';
import { Book, Mail, Lock, ArrowRight, TestTube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { forceRealData, debugSupabaseState } from '@/lib/supabase/client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  // Log para debug
  useEffect(() => {
    console.log('============ PÁGINA DE LOGIN CARREGADA ============');
    document.title = 'Login - ERP Livraria';
    
    // Adicionar mensagem visível na página
    const messageElem = document.createElement('div');
    messageElem.style.position = 'fixed';
    messageElem.style.bottom = '10px';
    messageElem.style.right = '10px';
    messageElem.style.background = 'rgba(0,0,0,0.7)';
    messageElem.style.color = 'white';
    messageElem.style.padding = '5px 10px';
    messageElem.style.borderRadius = '5px';
    messageElem.style.zIndex = '9999';
    messageElem.style.fontSize = '12px';
    messageElem.textContent = 'Página de login carregada - v.1.0.2';
    document.body.appendChild(messageElem);
    
    // Verificar estado
    try {
      const state = debugSupabaseState();
      console.log('Estado Supabase:', state);
    } catch (e) {
      console.error('Erro ao verificar estado:', e);
    }
    
    // Limpar ao desmontar
    return () => {
      if (document.body.contains(messageElem)) {
        document.body.removeChild(messageElem);
      }
    };
  }, []);

  const handleTestLogin = () => {
    try {
      // Simulação de login de teste com log para debug
      console.log('Login de teste realizado - iniciando navegação...');
      
      // Mostrar alerta antes de redirecionar
      alert('Redirecionando para o dashboard...');
      
      // Usando o router do Next.js
      router.push('/dashboard');
      
      console.log('Navegação para /dashboard solicitada');
    } catch (error) {
      console.error('Erro ao navegar:', error);
      alert('Erro ao navegar: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const form = e.target as HTMLFormElement;
      const email = form.email.value;
      const password = form.password.value;
      
      console.log('Tentando login para:', email);
      
      // Usar o método signIn do contexto de autenticação
      const result = await signIn(email, password);
      
      if (result.success) {
        console.log('Login bem-sucedido');
        
        // Forçar uso de dados reais após login bem-sucedido
        forceRealData();
        console.log('Forçando uso de dados reais do Supabase');
        
        router.push('/dashboard');
      } else {
        console.error('Erro de autenticação:', result.error);
        
        // Verificar se é um erro de credenciais
        if (result.error?.includes('Invalid login credentials')) {
          // Tentar login de teste como fallback
          if (email === 'admin@erp-livraria.com' && password === 'admin123') {
            console.log('Credenciais válidas para modo de demonstração - redirecionando...');
            router.push('/dashboard');
          } else {
            setErrorMessage('Email ou senha inválidos');
          }
        } else {
          setErrorMessage(`Erro ao fazer login: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Erro no formulário:', error);
      setErrorMessage('Erro no formulário: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // Função para exibir o estado atual do Supabase
  const handleDebug = () => {
    try {
      const state = debugSupabaseState();
      alert(`Estado do Supabase:\n\nForçar dados reais: ${state.forceUseRealData}\nTem sessão: ${state.hasSession}\nCliente disponível: ${state.hasClient}\nVariáveis de ambiente válidas: ${state.envVarsValid}\nUsando dados reais? ${state.shouldUseRealData}`);
    } catch (error) {
      console.error('Erro ao depurar:', error);
      alert('Erro ao depurar. Verifique o console.');
    }
  };

  // Função para ir diretamente para o dashboard sem autenticação
  const handleDirectAccess = () => {
    try {
      console.log('Acessando dashboard diretamente sem autenticação...');
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao acessar diretamente:', error);
      alert('Erro ao acessar diretamente: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Lado esquerdo - Arte/Imagem de fundo */}
      <div className="hidden w-1/2 bg-primary-600 lg:block">
        <div className="flex h-full items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <Book className="mx-auto mb-6 h-16 w-16 text-white" />
            <h1 className="mb-6 text-4xl font-bold text-white">ERP Livraria</h1>
            <p className="text-lg text-primary-200">
              Gerencie sua livraria com eficiência e precisão. 
              Acompanhe vendas, estoque, clientes e finanças em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário de login */}
      <div className="flex w-full flex-col justify-center p-6 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Book className="h-6 w-6 text-primary-600" />
              <h1 className="text-xl font-bold text-primary-600">ERP Livraria</h1>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-neutral-900">Acesso ao Sistema</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Faça login para continuar gerenciando sua livraria
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-800 border border-red-200">
              {errorMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="email" 
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                E-mail
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  defaultValue="admin@erp-livraria.com"
                  className="w-full rounded-lg border border-neutral-300 py-3 pl-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Senha
                </label>
                <Link 
                  href="/auth/reset-password" 
                  className="text-xs font-medium text-primary-600 hover:text-primary-800"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue="admin123"
                  className="w-full rounded-lg border border-neutral-300 py-3 pl-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-neutral-700">
                Lembrar-me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-primary-600 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-70"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
            
            {/* Botão de Login de Teste */}
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg border border-primary-300 bg-white py-3 text-base font-medium text-primary-600 shadow-sm transition-colors hover:bg-primary-50 disabled:opacity-70"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Login de Teste
            </button>
            
            {/* Botão de Acesso Direto */}
            <button
              type="button"
              onClick={handleDirectAccess}
              className="flex w-full items-center justify-center rounded-lg border border-orange-300 bg-orange-50 py-3 text-base font-medium text-orange-600 shadow-sm transition-colors hover:bg-orange-100"
            >
              Acesso Direto ao Dashboard
            </button>
            
            {/* Botão de Debug */}
            <button
              type="button"
              onClick={handleDebug}
              className="flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-neutral-50 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Verificar Estado
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-500">
            Não possui uma conta?{' '}
            <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-800">
              Entre em contato com o administrador
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 