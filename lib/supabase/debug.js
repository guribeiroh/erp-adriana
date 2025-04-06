import { supabase } from './client';

// Função para verificar o estado da conexão com o Supabase
export const checkSupabaseConnection = async () => {
  console.log('Verificando conexão com Supabase...');
  
  try {
    // Verificar se o cliente Supabase existe
    if (!supabase) {
      console.error('Erro: Cliente Supabase não foi inicializado');
      return {
        success: false,
        error: 'Cliente Supabase não inicializado - verifique as variáveis de ambiente'
      };
    }
    
    // Tentar fazer uma consulta simples para verificar a conexão
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Erro na conexão com Supabase:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    console.log('Conexão com Supabase sucedida!', data);
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Erro inesperado ao verificar Supabase:', err);
    return {
      success: false,
      error: err.message,
      details: err
    };
  }
};

// Função para diagnosticar problemas com políticas de acesso
export const testSupabaseCRUD = async (table) => {
  console.log(`Testando operações CRUD na tabela ${table}...`);
  
  if (!supabase) {
    return {
      success: false,
      error: 'Cliente Supabase não inicializado'
    };
  }
  
  const testId = `test-${Date.now()}`;
  const results = {
    select: { success: false, error: null },
    insert: { success: false, error: null, id: null },
    update: { success: false, error: null },
    delete: { success: false, error: null }
  };
  
  try {
    // Teste SELECT
    const { data: selectData, error: selectError } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    results.select.success = !selectError;
    results.select.error = selectError?.message;
    
    // Teste INSERT
    const { data: insertData, error: insertError } = await supabase
      .from(table)
      .insert({
        id: testId,
        name: 'Teste CRUD',
        email: 'teste@exemplo.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    results.insert.success = !insertError && insertData;
    results.insert.error = insertError?.message;
    results.insert.id = insertData?.[0]?.id || testId;
    
    // Teste UPDATE (apenas se o INSERT funcionou)
    if (results.insert.success) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ name: 'Teste CRUD Atualizado' })
        .eq('id', results.insert.id);
      
      results.update.success = !updateError;
      results.update.error = updateError?.message;
    }
    
    // Teste DELETE (apenas se o INSERT funcionou)
    if (results.insert.success) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', results.insert.id);
      
      results.delete.success = !deleteError;
      results.delete.error = deleteError?.message;
    }
    
    return {
      success: results.select.success && results.insert.success && 
               results.update.success && results.delete.success,
      operations: results
    };
  } catch (err) {
    console.error(`Erro inesperado ao testar CRUD na tabela ${table}:`, err);
    return {
      success: false,
      error: err.message,
      details: err
    };
  }
};

// Função para exibir informações sobre o cliente Supabase
export const debugSupabaseClient = () => {
  const supabaseInfo = {
    clientExists: !!supabase,
    env: {
      url: typeof window !== 'undefined' ? window.ENV_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPrefix: typeof window !== 'undefined' 
        ? (window.ENV_SUPABASE_KEY ? window.ENV_SUPABASE_KEY.substring(0, 10) + '...' : undefined)
        : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...' : undefined)
    }
  };
  
  console.log('Debug Supabase Client:', supabaseInfo);
  return supabaseInfo;
};

// Função para verificar as políticas existentes (apenas para diagnóstico)
export const checkSupabasePolicies = async (table) => {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Cliente Supabase não inicializado'
      };
    }
    
    // Esta é uma operação avançada que requer permissões especiais
    // Normalmente não estaria disponível para usuários regulares
    const { data, error } = await supabase.rpc('check_table_policies', { 
      table_name: table 
    });
    
    if (error) {
      console.error(`Erro ao verificar políticas para ${table}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      policies: data
    };
  } catch (err) {
    console.error(`Erro ao verificar políticas para ${table}:`, err);
    return {
      success: false,
      error: err.message
    };
  }
}; 