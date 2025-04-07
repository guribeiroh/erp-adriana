'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getAuthStatus, forceRealData, clearLocalData } from '../supabase/client';
import { useRouter } from 'next/navigation';

// Tipos para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

// Criar o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  signUp: async () => ({ success: false }),
  refreshUser: async () => {},
});

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Referência para controlar se o login foi feito diretamente pelo usuário
  const isInitialLogin = useRef(true);
  const hasInitialized = useRef(false);
  
  // Verificar o estado da autenticação ao carregar
  useEffect(() => {
    const loadUserData = async () => {
      if (hasInitialized.current) return;
      
      try {
        const { user, session } = await getAuthStatus();
        setUser(user);
        setSession(session);
        
        // Marcar que não é o login inicial, pois estamos apenas carregando o estado
        if (user) {
          isInitialLogin.current = false;
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setIsLoading(false);
        hasInitialized.current = true;
      }
    };

    // Carregar dados iniciais
    loadUserData();

    // Configurar o listener para mudanças na autenticação
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        // Não logar eventos de refresh de token para reduzir ruído no console
        if (event !== 'TOKEN_REFRESHED') {
          console.log(`Evento de autenticação: ${event}`);
        }
        
        // Atualizar o estado do usuário e sessão sem redirecionar
        if (newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
          
          // Forçar uso de dados reais, independente do tipo de evento
          forceRealData();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          // Não redirecionamos aqui - o redirecionamento no logout é feito explicitamente
        }
        
        // Redirecionar APENAS se for um login inicial explícito (vindo da tela de login)
        if (event === 'SIGNED_IN' && isInitialLogin.current) {
          console.log('Login inicial detectado, redirecionando para dashboard');
          isInitialLogin.current = false; // Resetar para evitar redirecionamentos futuros
          router.push('/dashboard');
        } else if (event === 'SIGNED_IN') {
          console.log('Sessão atualizada ou token renovado, mantendo na página atual');
        }
      });

      // Limpar o listener quando o componente for desmontado
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [router]);

  // Função de login - aqui definimos que é um login inicial explícito
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { 
        success: false, 
        error: 'Cliente Supabase não disponível. Verifique suas variáveis de ambiente.' 
      };
    }

    try {
      setIsLoading(true);
      
      // Marcar como login inicial explícito para permitir redirecionamento
      isInitialLogin.current = true;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      
      // Forçar uso de dados reais após login bem-sucedido
      forceRealData();
      console.log('Login bem-sucedido, forçando uso de dados reais do Supabase');
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer login' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    if (!supabase) return;

    try {
      setIsLoading(true);
      console.log('Iniciando processo de logout...');
      
      // Limpar dados locais armazenados
      clearLocalData();
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro durante logout do Supabase:', error);
        throw error;
      }
      
      console.log('Logout do Supabase concluído com sucesso');
      
      // Limpar o estado local
      setUser(null);
      setSession(null);
      
      // O redirecionamento é feito pela página de logout, não aqui
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer logout' };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de cadastro
  const signUp = async (email: string, password: string, name: string, role: string) => {
    if (!supabase) {
      return { 
        success: false, 
        error: 'Cliente Supabase não disponível. Verifique suas variáveis de ambiente.' 
      };
    }

    try {
      setIsLoading(true);
      
      // Registrar o usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Inserir informações adicionais na tabela users
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            { 
              id: data.user.id,
              email: email,
              name: name,
              role: role
            }
          ]);

        if (profileError) {
          console.error('Erro ao criar perfil do usuário:', profileError);
          return { success: false, error: profileError.message };
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar conta' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar os dados do usuário
  const refreshUser = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
        return;
      }
      
      // Apenas atualizar os dados do usuário em memória sem redirecionamento
      setUser(data.user);
      
      // Se o usuário estiver logado, forçar uso de dados reais
      if (data.user) {
        forceRealData();
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  // Fornecer o contexto para os componentes filhos
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signIn, 
      signOut, 
      signUp,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 