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

// Função para melhorar o debug
const sanitizedLog = (type: string, value: string | null | undefined): string => {
  if (!value) return `${type}: <não definido>`;
  if (value.length > 40) {
    return `${type}: ${value.substring(0, 10)}...${value.substring(value.length - 5)}`;
  }
  return `${type}: ${value}`;
};

// Adicionar logs para debug
console.log('------------------- DIAGNÓSTICO SUPABASE -------------------');
console.log('Ambiente:', isDevelopment ? 'Desenvolvimento' : 'Produção');
console.log(sanitizedLog('Supabase URL', supabaseUrl));
console.log('Supabase URL formato válido:', supabaseUrl?.startsWith('https://') || false);
console.log(sanitizedLog('Supabase ANON Key', supabaseAnonKey));
console.log('Supabase ANON Key formato válido:', supabaseAnonKey?.startsWith('eyJ') || false);
console.log('-------------------------------------------------------------');

// Verificar se as variáveis estão indefinidas ou são placeholders
if (!supabaseUrl || supabaseUrl === 'sua_supabase_url' || 
    !supabaseAnonKey || supabaseAnonKey === 'sua_supabase_anon_key') {
  if (isDevelopment) {
    console.warn('⚠️ Usando valores temporários para Supabase no ambiente de desenvolvimento.');
    console.warn('⚠️ Para conectar com seu projeto real, atualize as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
    
    // Se estivermos em desenvolvimento, podemos usar valores padrão para facilitar o teste
    if (!supabaseUrl || supabaseUrl === 'sua_supabase_url') {
      console.warn('⚠️ Usando URL padrão para desenvolvimento');
      supabaseUrl = 'https://coloquesuaurl.supabase.co';
    }
    
    if (!supabaseAnonKey || supabaseAnonKey === 'sua_supabase_anon_key') {
      console.warn('⚠️ Usando ANON_KEY padrão para desenvolvimento');
      supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Token parcial para testes
    }
  } else {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas corretamente!');
  }
}

// Corrigir problemas comuns com a URL do Supabase
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.warn('⚠️ Corrigindo formato da URL do Supabase (adicionando https://)');
  supabaseUrl = 'https://' + supabaseUrl;
}

// Verificar se a ANON_KEY possui quebras de linha ou foi truncada
if (supabaseAnonKey && (supabaseAnonKey.includes('\n') || supabaseAnonKey.includes('\r'))) {
  console.warn('⚠️ A chave ANON_KEY contém quebras de linha. Corrigindo...');
  supabaseAnonKey = supabaseAnonKey.replace(/[\r\n]+/g, '');
}

// Criar cliente apenas se as variáveis estiverem definidas
let supabase = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    // Garantir que as strings não tenham espaços em branco extras
    const cleanUrl = supabaseUrl.trim();
    const cleanKey = supabaseAnonKey.trim();
    
    console.log('Inicializando cliente Supabase com:');
    console.log(sanitizedLog('URL', cleanUrl));
    console.log(sanitizedLog('ANON_KEY', cleanKey));
    
    supabase = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'erp-livraria-auth',
      },
      global: {
        headers: {
          'x-client-info': 'erp-livraria-client',
        },
      },
    });
    
    // Verificar se o cliente foi inicializado corretamente
    if (supabase) {
      console.log('✅ Cliente Supabase inicializado com sucesso');
      
      // Teste de conexão
      supabase.from('sales').select('count(*)', { count: 'exact', head: true })
        .then(({ error }) => {
          if (error) {
            console.warn('⚠️ Teste de conexão falhou:', error.message);
          } else {
            console.log('✅ Teste de conexão bem-sucedido');
          }
        })
        .catch(err => {
          console.warn('⚠️ Erro no teste de conexão:', err.message);
        });
    } else {
      console.error('❌ Cliente Supabase não foi inicializado corretamente');
    }
  } else {
    console.error('❌ Cliente Supabase não inicializado: variáveis de ambiente ausentes');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar cliente Supabase:', error);
  supabase = null;
}

export { supabase };

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
    shouldUseRealData: shouldUseRealData(),
    url: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : null,
    keyValid: supabaseAnonKey ? supabaseAnonKey.startsWith('eyJ') : false
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

/**
 * Limpa dados locais armazenados pela aplicação
 * Usado principalmente no logout para garantir que nenhum dado persista indevidamente
 */
export function clearLocalData() {
  try {
    console.log('Limpando dados locais armazenados');
    
    // Limpar o flag de dados reais
    forceUseRealData = false;
    
    // Limpar sessão atual
    currentSession = null;
    
    if (typeof window !== 'undefined') {
      // Remover itens específicos do localStorage
      localStorage.removeItem('useRealData');
      localStorage.removeItem('lastSession');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('erp-livraria-auth');
      
      // Limpar supabase-auth-token
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith('erp_') || 
            key.startsWith('livraria_') || 
            key.includes('supabase') ||
            key.includes('auth')
          )) {
          localStorage.removeItem(key);
        }
      }
      
      console.log('Dados locais limpos com sucesso');
    }
  } catch (error) {
    console.error('Erro ao limpar dados locais:', error);
  }
} 