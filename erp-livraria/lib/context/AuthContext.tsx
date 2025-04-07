'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Verificar o estado da autenticação ao carregar
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user, session } = await getAuthStatus();
        setUser(user);
        setSession(session);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Carregar dados iniciais
    loadUserData();

    // Configurar o listener para mudanças na autenticação
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Evento de autenticação: ${event}`);
        setUser(session?.user || null);
        setSession(session);
        
        // Redirecionar apenas no evento SIGNED_IN quando é um login inicial
        if (event === 'SIGNED_IN' && session) {
          // Verificar se é um login inicial ou apenas uma atualização da sessão
          if (!user) { // Só redireciona se não havia usuário antes (login inicial)
            forceRealData();
            console.log('Evento de login inicial detectado, forçando uso de dados reais');
            router.push('/dashboard');
          } else {
            console.log('Atualização de sessão detectada, mantendo na página atual');
          }
        } 
        // Removemos o redirecionamento automático no SIGNED_OUT
        // O redirecionamento será feito pela página de logout
      });

      // Limpar o listener quando o componente for desmontado
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [router]);

  // Função de login
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { 
        success: false, 
        error: 'Cliente Supabase não disponível. Verifique suas variáveis de ambiente.' 
      };
    }

    try {
      setIsLoading(true);
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
      
      // Redirecionar para o login é feito pelo listener de autenticação
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
      
      // Apenas atualizar os dados do usuário em memória
      setUser(data.user);
      
      // Se o usuário estiver logado, forçar uso de dados reais
      // mas sem redirecionar ou recarregar a página
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