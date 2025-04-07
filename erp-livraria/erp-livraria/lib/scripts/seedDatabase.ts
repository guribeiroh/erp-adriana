import { supabase } from '@/lib/supabase/client';

// Importar os dados de exemplo
import {
  sampleUsers,
  sampleBooks,
  sampleCustomers,
  sampleSuppliers,
  sampleAccountsReceivable,
  sampleAccountsPayable
} from './seedData';

/**
 * Script para popular o banco de dados Supabase com dados iniciais
 */
async function seedDatabase() {
  console.log('Verificando cliente Supabase...');
  
  if (!supabase) {
    console.error('❌ Cliente Supabase não disponível.');
    return { success: false, message: 'Cliente Supabase não disponível.' };
  }

  // Verificar conexão com o Supabase
  try {
    console.log('Testando conexão com o Supabase...');
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.error('❌ Erro ao conectar com o Supabase:', error);
      return { 
        success: false, 
        message: 'Erro ao conectar com o Supabase. Verifique suas credenciais em .env.local.',
        error: error.message
      };
    }
    
    console.log('✅ Conexão com o Supabase estabelecida!');
  } catch (error) {
    console.error('❌ Erro ao testar conexão com o Supabase:', error);
    return { 
      success: false, 
      message: 'Erro ao testar conexão com o Supabase.',
      error: error instanceof Error ? error.message : String(error)
    };
  }

  console.log('🚀 Iniciando população do banco de dados...');
  console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Objeto para armazenar resultados da operação
  const results = {
    users: { success: false, count: 0, error: null },
    suppliers: { success: false, count: 0, error: null },
    books: { success: false, count: 0, error: null },
    customers: { success: false, count: 0, error: null },
    accounts_receivable: { success: false, count: 0, error: null },
    accounts_payable: { success: false, count: 0, error: null }
  };

  try {
    // Inserir usuários
    console.log('Inserindo usuários...');
    console.log('Dados:', JSON.stringify(sampleUsers, null, 2));
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert(sampleUsers, { onConflict: 'id' })
      .select();

    if (usersError) {
      console.error('❌ Erro ao inserir usuários:', usersError);
      results.users.error = usersError.message;
    } else {
      console.log('✅ Usuários inseridos com sucesso!', usersData?.length || 0);
      results.users.success = true;
      results.users.count = usersData?.length || 0;
    }

    // Inserir fornecedores
    console.log('Inserindo fornecedores...');
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .upsert(sampleSuppliers, { onConflict: 'id' })
      .select();

    if (suppliersError) {
      console.error('❌ Erro ao inserir fornecedores:', suppliersError);
      results.suppliers.error = suppliersError.message;
    } else {
      console.log('✅ Fornecedores inseridos com sucesso!', suppliersData?.length || 0);
      results.suppliers.success = true;
      results.suppliers.count = suppliersData?.length || 0;
    }

    // Inserir livros
    console.log('Inserindo livros...');
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .upsert(sampleBooks, { onConflict: 'id' })
      .select();

    if (booksError) {
      console.error('❌ Erro ao inserir livros:', booksError);
      results.books.error = booksError.message;
    } else {
      console.log('✅ Livros inseridos com sucesso!', booksData?.length || 0);
      results.books.success = true;
      results.books.count = booksData?.length || 0;
    }

    // Inserir clientes
    console.log('Inserindo clientes...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .upsert(sampleCustomers, { onConflict: 'id' })
      .select();

    if (customersError) {
      console.error('❌ Erro ao inserir clientes:', customersError);
      results.customers.error = customersError.message;
    } else {
      console.log('✅ Clientes inseridos com sucesso!', customersData?.length || 0);
      results.customers.success = true;
      results.customers.count = customersData?.length || 0;
    }

    // Inserir contas a receber
    console.log('Inserindo contas a receber...');
    const { data: receivablesData, error: receivablesError } = await supabase
      .from('accounts_receivable')
      .upsert(sampleAccountsReceivable, { onConflict: 'id' })
      .select();

    if (receivablesError) {
      console.error('❌ Erro ao inserir contas a receber:', receivablesError);
      results.accounts_receivable.error = receivablesError.message;
    } else {
      console.log('✅ Contas a receber inseridas com sucesso!', receivablesData?.length || 0);
      results.accounts_receivable.success = true;
      results.accounts_receivable.count = receivablesData?.length || 0;
    }

    // Inserir contas a pagar
    console.log('Inserindo contas a pagar...');
    const { data: payablesData, error: payablesError } = await supabase
      .from('accounts_payable')
      .upsert(sampleAccountsPayable, { onConflict: 'id' })
      .select();

    if (payablesError) {
      console.error('❌ Erro ao inserir contas a pagar:', payablesError);
      results.accounts_payable.error = payablesError.message;
    } else {
      console.log('✅ Contas a pagar inseridas com sucesso!', payablesData?.length || 0);
      results.accounts_payable.success = true;
      results.accounts_payable.count = payablesData?.length || 0;
    }

    const allSuccess = Object.values(results).every(r => r.success);
    if (allSuccess) {
      console.log('🎉 Banco de dados populado com sucesso!');
    } else {
      console.log('⚠️ Banco de dados parcialmente populado com erros.');
    }

    return { success: allSuccess, results };
  } catch (error) {
    console.error('❌ Erro inesperado ao popular banco de dados:', error);
    return { 
      success: false, 
      message: 'Erro inesperado ao popular banco de dados',
      error: error instanceof Error ? error.message : String(error),
      results
    };
  }
}

export default seedDatabase; 