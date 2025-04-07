import { NextResponse } from 'next/server';
import { supabase, getAuthStatus } from '@/lib/supabase/client';
import seedDatabase from '@/lib/scripts/seedDatabase';

// Rota API que inicia a população do banco de dados com dados de exemplo
export async function GET() {
  try {
    // Verificar se estamos em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        message: 'Esta rota só está disponível em ambiente de desenvolvimento'
      }, { status: 403 });
    }

    // Verificar a configuração do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'sua_supabase_url' || 
        supabaseKey === 'sua_supabase_anon_key') {
      return NextResponse.json({
        success: false,
        message: 'Configuração do Supabase incompleta',
        details: 'Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local'
      }, { status: 500 });
    }

    // Verificar o estado de autenticação
    const authStatus = await getAuthStatus();
    console.log('Estado de autenticação:', authStatus);

    // Executar o script de população do banco de dados
    const result = await seedDatabase();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao popular banco de dados',
        ...result,
        auth_status: authStatus,
        troubleshooting: {
          message: 'Se estiver encontrando erros de permissão, tente desabilitar temporariamente o RLS:',
          step1: 'Execute este SQL no Supabase SQL Editor: ALTER TABLE users DISABLE ROW LEVEL SECURITY;',
          step2: 'Repita para todas as tabelas (books, customers, suppliers, etc.)',
          alternative: 'Ou use o endpoint /api/seed/disable-rls para tentar desabilitar o RLS automaticamente'
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Banco de dados populado com sucesso!',
      auth_status: authStatus,
      ...result
    });
  } catch (error) {
    console.error('Erro ao popular banco de dados:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao popular banco de dados',
      error: error instanceof Error ? error.message : String(error),
      troubleshooting: {
        message: 'Verifique as políticas de segurança (RLS) no Supabase e ajuste conforme necessário',
        tip1: 'Utilize o endpoint /api/seed/disable-rls para desabilitar temporariamente o RLS',
        tip2: 'No painel do Supabase, verifique suas policies em Authentication > Policies'
      }
    }, { status: 500 });
  }
} 