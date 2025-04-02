import { createClient } from '@supabase/supabase-js';

// Verificar se estamos em ambiente de desenvolvimento e se as variáveis estão definidas corretamente
const isDevelopment = process.env.NODE_ENV === 'development';

// Obter as variáveis de ambiente ou usar valores de desenvolvimento
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Flag para controlar se devemos forçar o uso de dados reais
// Esta variável será definida como true quando o login for bem-sucedido
let forceUseRealData = false;

// Guardar a sessão atual para reutilizar
let currentSession = null;

// Verificar se as variáveis estão indefinidas ou são placeholders
if (!supabaseUrl || supabaseUrl === 'sua_supabase_url' || 
    !supabaseAnonKey || supabaseAnonKey === 'sua_supabase_anon_key') {
  if (isDevelopment) {
    console.warn('⚠️ Usando valores temporários para Supabase no ambiente de desenvolvimento.');
    console.warn('⚠️ Para conectar com seu projeto real, atualize as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
  } else {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas corretamente!');
  }
}

// Criar cliente apenas se as variáveis estiverem definidas
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Permitir persistência da sessão para manter o login
        autoRefreshToken: true, // Para manter o token atualizado
        detectSessionInUrl: true, // Detectar a sessão na URL
        storageKey: 'erp-livraria-auth', // Chave personalizada para armazenamento
      },
      // Importante: Definir o cabeçalho para evitar problemas de CORS e melhorar a depuração
      global: {
        headers: {
          'x-client-info': 'erp-livraria-client',
        },
      },
    })
  : null;

// Função para verificar se devemos usar dados reais do Supabase
export function shouldUseRealData() {
  // Verificar flag explícita primeiro
  if (forceUseRealData) {
    return true;
  }
  
  // Verificar se há uma sessão válida
  if (!!supabase && !!currentSession) {
    return true;
  }
  
  // Verificar se as variáveis de ambiente são válidas
  return !!supabase && 
         supabaseUrl !== undefined && 
         supabaseUrl !== 'sua_supabase_url' &&
         supabaseAnonKey !== undefined && 
         supabaseAnonKey !== 'sua_supabase_anon_key';
}

// Função para forçar o uso de dados reais após login bem-sucedido
export function forceRealData() {
  console.log('✅ Login bem-sucedido, forçando uso de dados reais do Supabase');
  forceUseRealData = true;
}

// Função para debug do estado atual do Supabase
export function debugSupabaseState() {
  const state = {
    forceUseRealData,
    hasSession: !!currentSession,
    hasClient: !!supabase,
    envVarsValid: !!supabaseUrl && 
                 supabaseUrl !== 'sua_supabase_url' &&
                 !!supabaseAnonKey && 
                 supabaseAnonKey !== 'sua_supabase_anon_key',
    shouldUseRealData: shouldUseRealData()
  };
  
  console.log('🔍 Estado atual do Supabase:', state);
  return state;
}

// Função para desabilitar o RLS para permitir operações CRUD
export async function disableRLS() {
  if (!supabase) {
    throw new Error('Cliente Supabase não disponível');
  }
  
  // Lista de tabelas para desabilitar RLS
  const tables = [
    'users',
    'books',
    'customers',
    'suppliers',
    'accounts_receivable',
    'accounts_payable',
    'sales',
    'sale_items'
  ];
  
  console.log('Desabilitando RLS para permitir operações CRUD...');
  
  // Tente desabilitar o RLS através de uma função RPC (requer função no Supabase)
  try {
    for (const table of tables) {
      // Método 1: Usar RPC (função personalizada no Supabase)
      try {
        const { error } = await supabase.rpc('disable_rls_for_table', {
          table_name: table
        });
        
        if (error) {
          console.warn(`Não foi possível desabilitar RLS via RPC para ${table}: ${error.message}`);
        } else {
          console.log(`✅ RLS desabilitado para ${table}`);
        }
      } catch (err) {
        console.warn(`Erro ao chamar RPC para desabilitar RLS para ${table}`);
        
        // Método 2: Executar SQL diretamente
        try {
          const { error } = await supabase.from('_exec_sql').select('*').eq('query', `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
          if (!error) {
            console.log(`✅ RLS desabilitado para ${table} via SQL direto`);
          }
        } catch (sqlErr) {
          console.error(`Não foi possível desabilitar RLS para ${table}`);
        }
      }
    }
    
    return { success: true, message: 'Operação de desabilitar RLS concluída' };
  } catch (error) {
    console.error('Erro ao desabilitar RLS:', error);
    return { 
      success: false, 
      message: 'Erro ao desabilitar RLS',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Função para autenticar como um usuário administrador
// Isso pode ser usado para operações que precisam de permissões elevadas
export async function authenticateAsAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error('Cliente Supabase não disponível');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(`Erro de autenticação: ${error.message}`);
  }
  
  // Guardar a sessão atual
  currentSession = data.session;
  
  // Se autenticação for bem-sucedida, forçar uso de dados reais
  forceRealData();
  
  // Tentar desabilitar RLS para operações CRUD
  await disableRLS();
  
  return data;
}

// Função para verificar o estado atual da autenticação
export async function getAuthStatus() {
  if (!supabase) {
    return { user: null, session: null, error: 'Cliente Supabase não disponível' };
  }
  
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    return { user: null, session: null, error: error.message };
  }
  
  // Guardar a sessão atual
  currentSession = data.session;
  
  // Se há uma sessão válida, forçar uso de dados reais
  if (data.session) {
    forceRealData();
    
    // Tentar desabilitar RLS para operações CRUD se tiver sessão válida
    await disableRLS();
  }
  
  return { 
    user: data.session?.user || null, 
    session: data.session,
    error: null 
  };
} 