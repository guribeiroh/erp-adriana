import { supabase } from './client';
import { Session, User } from '@supabase/supabase-js';

/**
 * Utilitário para gerenciar sessão do Supabase e garantir autenticação
 */

// Armazenar sessão e usuário em cache para performance
let cachedSession: Session | null = null;
let cachedUser: User | null = null;
let lastRefresh: number = 0;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos em ms

/**
 * Verifica se o usuário está autenticado
 * @returns O usuário autenticado ou null
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  // Usar cache se disponível e não expirado
  const now = Date.now();
  if (cachedUser && now - lastRefresh < REFRESH_INTERVAL) {
    return cachedUser;
  }

  if (!supabase) {
    console.error('Cliente Supabase não está disponível');
    return null;
  }

  try {
    // Obter sessão atual
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error.message);
      return null;
    }
    
    // Atualizar cache
    cachedSession = data.session;
    cachedUser = data.session?.user || null;
    lastRefresh = now;
    
    return cachedUser;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

/**
 * Verifica se a sessão atual é válida
 * @returns A sessão atual ou null
 */
export async function getCurrentSession(): Promise<Session | null> {
  // Usar cache se disponível e não expirado
  const now = Date.now();
  if (cachedSession && now - lastRefresh < REFRESH_INTERVAL) {
    return cachedSession;
  }

  if (!supabase) {
    console.error('Cliente Supabase não está disponível');
    return null;
  }

  try {
    // Obter sessão atual
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error.message);
      return null;
    }
    
    // Atualizar cache
    cachedSession = data.session;
    cachedUser = data.session?.user || null;
    lastRefresh = now;
    
    return cachedSession;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

/**
 * Força a atualização da sessão atual
 * @returns A sessão atualizada ou null
 */
export async function refreshSession(): Promise<Session | null> {
  if (!supabase) {
    console.error('Cliente Supabase não está disponível');
    return null;
  }

  try {
    // Atualizar sessão
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Erro ao atualizar sessão:', error.message);
      return null;
    }
    
    // Atualizar cache
    cachedSession = data.session;
    cachedUser = data.user;
    lastRefresh = Date.now();
    
    return cachedSession;
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    return null;
  }
}

/**
 * Verifica se há um usuário autenticado e se possui um ID válido
 * @returns O ID do usuário ou null
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id || null;
}

/**
 * Verifica se o usuário possui acesso a um recurso específico
 * @param resource O recurso a ser verificado (exemplo: 'books', 'sales')
 * @param action A ação a ser verificada (exemplo: 'read', 'write', 'delete')
 * @returns Se o usuário tem permissão
 */
export async function checkPermission(resource: string, action: string): Promise<boolean> {
  // Implementação básica - todos os usuários autenticados têm acesso a tudo
  const user = await getAuthenticatedUser();
  return !!user;
} 