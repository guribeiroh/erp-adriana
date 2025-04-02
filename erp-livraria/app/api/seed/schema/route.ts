import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Rota API que verifica a estrutura do banco de dados
export async function GET() {
  try {
    // Verificar se estamos em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        message: 'Esta rota só está disponível em ambiente de desenvolvimento'
      }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Cliente Supabase não disponível'
      }, { status: 500 });
    }

    // Lista de tabelas esperadas
    const expectedTables = [
      'users',
      'books',
      'customers',
      'suppliers',
      'accounts_receivable',
      'accounts_payable'
    ];

    const tablesInfo = {};
    let allTablesExist = true;

    // Verificar cada tabela
    for (const table of expectedTables) {
      // Consultar a tabela para ver se existe
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        tablesInfo[table] = {
          exists: false,
          error: error.message,
          code: error.code
        };
        allTablesExist = false;
      } else {
        // Obter a definição da tabela (colunas)
        const { data: columns, error: columnsError } = await supabase
          .rpc('get_table_columns', { table_name: table });

        tablesInfo[table] = {
          exists: true,
          count,
          columns: columnsError ? null : columns,
          columnsError: columnsError ? columnsError.message : null
        };
      }
    }

    return NextResponse.json({
      success: allTablesExist,
      message: allTablesExist 
        ? 'Todas as tabelas existem' 
        : 'Algumas tabelas não existem ou não podem ser acessadas',
      tables: tablesInfo,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    });
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao verificar tabelas',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 