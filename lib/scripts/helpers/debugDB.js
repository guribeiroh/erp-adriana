const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Função para verificar variáveis de ambiente
const checkEnvVars = () => {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro: Variáveis de ambiente ausentes:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('\nCrie um arquivo .env.local na raiz do projeto com as variáveis necessárias.');
    return false;
  }
  
  console.log('\x1b[32m%s\x1b[0m', '✅ Variáveis de ambiente: OK');
  return true;
};

// Inicializar cliente Supabase
const initSupabase = () => {
  if (!checkEnvVars()) return null;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Cliente Supabase inicializado');
    return supabase;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro ao inicializar cliente Supabase:');
    console.error(`   ${error.message}`);
    return null;
  }
};

// Verificar conexão
const checkConnection = async (supabase) => {
  if (!supabase) return false;
  
  try {
    console.log('\nVerificando conexão com Supabase...');
    const { data, error } = await supabase.from('customers').select('count').limit(1);
    
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Erro na conexão com Supabase:');
      console.error(`   ${error.message}`);
      return false;
    }
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Conexão com Supabase: OK');
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro inesperado ao verificar conexão:');
    console.error(`   ${error.message}`);
    return false;
  }
};

// Verificar tabelas
const checkTables = async (supabase) => {
  if (!supabase) return;
  
  const tables = ['customers', 'products'];
  
  console.log('\nVerificando tabelas...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.error('\x1b[31m%s\x1b[0m', `❌ Tabela '${table}' não existe`);
      } else if (error) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Erro ao acessar tabela '${table}':`);
        console.error(`   ${error.message}`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', `✅ Tabela '${table}': OK`);
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Erro inesperado ao verificar tabela '${table}':`);
      console.error(`   ${error.message}`);
    }
  }
};

// Testar CRUD em uma tabela
const testCRUD = async (supabase, table) => {
  if (!supabase) return;
  
  console.log(`\nTestando operações CRUD na tabela '${table}'...`);
  
  const testId = `test-${Date.now()}`;
  let insertedId = null;
  
  // Teste SELECT
  try {
    console.log(`\n1. Testando SELECT na tabela '${table}'`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ SELECT falhou:');
      console.error(`   ${error.message}`);
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✅ SELECT: OK');
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro inesperado em SELECT:');
    console.error(`   ${error.message}`);
  }
  
  // Teste INSERT
  try {
    console.log(`\n2. Testando INSERT na tabela '${table}'`);
    const testItem = {
      id: testId,
      name: 'Teste CRUD CLI',
      email: 'teste@exemplo.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(table)
      .insert(testItem)
      .select();
    
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ INSERT falhou:');
      console.error(`   ${error.message}`);
    } else {
      insertedId = data[0]?.id || testId;
      console.log('\x1b[32m%s\x1b[0m', '✅ INSERT: OK');
      console.log(`   ID inserido: ${insertedId}`);
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro inesperado em INSERT:');
    console.error(`   ${error.message}`);
  }
  
  // Teste UPDATE (apenas se o INSERT funcionou)
  if (insertedId) {
    try {
      console.log(`\n3. Testando UPDATE na tabela '${table}'`);
      const { error } = await supabase
        .from(table)
        .update({ name: 'Teste CRUD CLI Atualizado' })
        .eq('id', insertedId);
      
      if (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ UPDATE falhou:');
        console.error(`   ${error.message}`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ UPDATE: OK');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Erro inesperado em UPDATE:');
      console.error(`   ${error.message}`);
    }
  }
  
  // Teste DELETE (apenas se o INSERT funcionou)
  if (insertedId) {
    try {
      console.log(`\n4. Testando DELETE na tabela '${table}'`);
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', insertedId);
      
      if (error) {
        console.error('\x1b[31m%s\x1b[0m', '❌ DELETE falhou:');
        console.error(`   ${error.message}`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ DELETE: OK');
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Erro inesperado em DELETE:');
      console.error(`   ${error.message}`);
    }
  }
};

// Executar diagnóstico completo
const runDiagnostic = async () => {
  console.log('\n====================================');
  console.log('DIAGNÓSTICO SUPABASE - INÍCIO');
  console.log('====================================\n');
  
  const supabase = initSupabase();
  if (!supabase) {
    console.log('\n⚠️  Diagnóstico interrompido devido a erros de inicialização.');
    return;
  }
  
  const isConnected = await checkConnection(supabase);
  if (!isConnected) {
    console.log('\n⚠️  Diagnóstico interrompido devido a erros de conexão.');
    return;
  }
  
  await checkTables(supabase);
  
  // Testar CRUD em cada tabela
  await testCRUD(supabase, 'customers');
  await testCRUD(supabase, 'products');
  
  console.log('\n====================================');
  console.log('DIAGNÓSTICO SUPABASE - CONCLUÍDO');
  console.log('====================================\n');
};

// Executar diagnóstico se for chamado diretamente
if (require.main === module) {
  runDiagnostic()
    .catch(error => {
      console.error('\n❌ Erro fatal durante o diagnóstico:');
      console.error(error);
    });
}

module.exports = {
  checkEnvVars,
  initSupabase,
  checkConnection,
  checkTables,
  testCRUD,
  runDiagnostic
}; 