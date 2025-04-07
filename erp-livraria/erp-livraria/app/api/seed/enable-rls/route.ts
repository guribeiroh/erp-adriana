import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Lista de tabelas para habilitar RLS
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

// Rota API para habilitar o RLS após a população dos dados
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
      enabled: {}
    };

    // Habilitar RLS em cada tabela
    for (const table of tables) {
      try {
        // Execute uma consulta SQL para habilitar RLS
        const { error: enableError } = await supabase.rpc('enable_rls_for_table', {
          table_name: table
        });

        if (enableError) {
          result.enabled[table] = {
            success: false,
            message: enableError.message
          };
        } else {
          result.enabled[table] = {
            success: true,
            message: `RLS habilitado com sucesso para ${table}`
          };
        }
      } catch (error) {
        result.enabled[table] = {
          success: false,
          message: error instanceof Error ? error.message : String(error)
        };
      }
    }

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