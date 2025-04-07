import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createTransacao } from '@/lib/services/financialService';

/**
 * Endpoint para diagnóstico do módulo financeiro
 * Testa a autenticação e CRUD com Supabase
 */
export async function GET() {
  try {
    // 1. Verificar a autenticação
    if (!supabase) {
      return NextResponse.json(
        { error: 'Cliente Supabase não inicializado' },
        { status: 500 }
      );
    }

    // 2. Obter status da sessão
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json(
        { error: 'Erro ao verificar sessão', details: sessionError.message },
        { status: 401 }
      );
    }

    const isAuthenticated = !!sessionData.session;
    const userId = sessionData.session?.user?.id || null;

    // 3. Tenta inserir uma transação diretamente via SQL
    const now = new Date().toISOString();
    const testDesc = `Teste diagnóstico ${now}`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('financial_transactions')
      .insert([{
        descricao: testDesc,
        valor: 1.99,
        data: now,
        tipo: 'receita',
        categoria: 'Diagnóstico',
        status: 'confirmada'
      }])
      .select()
      .single();

    // 4. Tenta buscar transações existentes
    const { data: queryData, error: queryError } = await supabase
      .from('financial_transactions')
      .select('*')
      .limit(3);

    // 5. Retornar resultado do diagnóstico
    return NextResponse.json({
      success: true,
      diagnostic: {
        clientInitialized: !!supabase,
        isAuthenticated,
        userId,
        directInsert: {
          success: !insertError,
          error: insertError ? insertError.message : null,
          data: insertData || null
        },
        queryTest: {
          success: !queryError,
          error: queryError ? queryError.message : null,
          count: queryData ? queryData.length : 0
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erro no diagnóstico financeiro:', error);
    return NextResponse.json(
      { error: 'Erro durante o diagnóstico', message: error.message },
      { status: 500 }
    );
  }
} 