import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Lista de tabelas para desabilitar RLS temporariamente
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

// Rota API para desabilitar temporariamente o RLS para permitir a inserção de dados
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

    // Status de sucesso para cada tabela
    const result = {
      enabled: {},
      disabled: {}
    };

    // Tentar desabilitar RLS em cada tabela
    for (const table of tables) {
      try {
        // Execute uma consulta SQL para desabilitar RLS temporariamente
        const { error: disableError } = await supabase.rpc('disable_rls_for_table', {
          table_name: table
        });

        if (disableError) {
          result.disabled[table] = {
            success: false,
            message: disableError.message
          };
        } else {
          result.disabled[table] = {
            success: true,
            message: `RLS desabilitado com sucesso para ${table}`
          };
        }
      } catch (error) {
        result.disabled[table] = {
          success: false,
          message: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Este endpoint permite reativar o RLS após a inserção dos dados
    // Um endpoint separado /api/seed/enable-rls pode ser usado para isso

    return NextResponse.json({
      success: true,
      message: 'Operação concluída',
      result
    });
  } catch (error) {
    console.error('Erro ao manipular RLS:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao manipular RLS',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 