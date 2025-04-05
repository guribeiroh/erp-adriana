import { NextResponse } from 'next/server';
import { createTransacao, fetchTransacoes } from '@/lib/services/financialService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar os campos obrigatórios
    if (!body.descricao || !body.valor || !body.data || !body.tipo || !body.categoria || !body.status) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: descricao, valor, data, tipo, categoria, status' },
        { status: 400 }
      );
    }
    
    // Criar a transação
    const transacao = await createTransacao(body);
    
    return NextResponse.json({ success: true, transacao }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transação', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Buscar as últimas 5 transações
    const result = await fetchTransacoes({ limit: 5 });
    
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transações', message: error.message },
      { status: 500 }
    );
  }
} 