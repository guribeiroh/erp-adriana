import { supabase } from '@/lib/supabase/client';

// Definição dos tipos
export type TransacaoStatus = "confirmada" | "pendente" | "cancelada";
export type TransacaoTipo = "receita" | "despesa";
export type FormaPagamento = "dinheiro" | "credito" | "debito" | "pix" | "boleto" | "transferencia";

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  dataVencimento?: string;
  dataPagamento?: string;
  tipo: TransacaoTipo;
  categoria: string;
  status: TransacaoStatus;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  vinculoId?: string;
  vinculoTipo?: "venda" | "compra" | "outro";
  venda?: string; // ID da venda relacionada
  comprovante?: string; // URL do comprovante
}

// Verifica se o cliente Supabase está disponível e determina se deve usar dados simulados
function deveFallbackParaDadosSimulados() {
  try {
    // Verifica se o Supabase está definido
    if (!supabase) {
      console.warn('Cliente Supabase não está disponível');
      return true;
    }

    // Verifica se estamos em ambiente de desenvolvimento local sem Supabase
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.info('Ambiente de desenvolvimento local detectado, usando dados simulados');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Erro ao verificar disponibilidade do Supabase, usando dados simulados', error);
    return true;
  }
}

// Determina se deve usar dados simulados
const usarDadosSimulados = deveFallbackParaDadosSimulados();

// Dados simulados para quando o Supabase não estiver disponível
const transacoesSimuladas: Transacao[] = [
  {
    id: "TRX001",
    descricao: "Venda - Pedido #V001",
    valor: 85.90,
    data: "2023-04-25",
    dataPagamento: "2023-04-25",
    tipo: "receita",
    categoria: "Vendas",
    status: "confirmada",
    formaPagamento: "credito",
    vinculoId: "V001",
    vinculoTipo: "venda"
  },
  {
    id: "TRX002",
    descricao: "Venda - Pedido #V002",
    valor: 126.40,
    data: "2023-04-25",
    dataPagamento: "2023-04-25",
    tipo: "receita",
    categoria: "Vendas",
    status: "confirmada",
    formaPagamento: "dinheiro",
    vinculoId: "V002",
    vinculoTipo: "venda"
  },
  {
    id: "TRX003",
    descricao: "Venda - Pedido #V003",
    valor: 213.75,
    data: "2023-04-24",
    dataVencimento: "2023-05-01",
    tipo: "receita",
    categoria: "Vendas",
    status: "pendente",
    formaPagamento: "pix",
    vinculoId: "V003",
    vinculoTipo: "venda"
  },
  {
    id: "TRX004",
    descricao: "Compra de Livros - Editora Companhia das Letras",
    valor: 1250.00,
    data: "2023-04-24",
    dataPagamento: "2023-04-24",
    tipo: "despesa",
    categoria: "Compra de Livros",
    status: "confirmada",
    formaPagamento: "transferencia",
    observacoes: "Reposição de estoque - 50 livros"
  },
  {
    id: "TRX005",
    descricao: "Venda - Pedido #V004",
    valor: 45.00,
    data: "2023-04-23",
    dataPagamento: "2023-04-23",
    tipo: "receita",
    categoria: "Vendas",
    status: "confirmada",
    formaPagamento: "debito",
    vinculoId: "V004",
    vinculoTipo: "venda"
  },
  {
    id: "TRX006",
    descricao: "Pagamento de Aluguel",
    valor: 2800.00,
    data: "2023-04-20",
    dataVencimento: "2023-04-20",
    dataPagamento: "2023-04-19",
    tipo: "despesa",
    categoria: "Aluguel",
    status: "confirmada",
    formaPagamento: "transferencia"
  },
  {
    id: "TRX007",
    descricao: "Fatura de Energia",
    valor: 385.60,
    data: "2023-04-18",
    dataVencimento: "2023-04-25",
    dataPagamento: "2023-04-22",
    tipo: "despesa",
    categoria: "Luz",
    status: "confirmada",
    formaPagamento: "boleto"
  },
  {
    id: "TRX008",
    descricao: "Salários - Abril/2023",
    valor: 8500.00,
    data: "2023-04-30",
    dataVencimento: "2023-04-30",
    tipo: "despesa",
    categoria: "Salários",
    status: "pendente",
    formaPagamento: "transferencia"
  },
  {
    id: "TRX009",
    descricao: "Conta de Água",
    valor: 120.30,
    data: "2023-04-15",
    dataVencimento: "2023-04-20",
    dataPagamento: "2023-04-19",
    tipo: "despesa",
    categoria: "Água",
    status: "confirmada",
    formaPagamento: "boleto"
  },
  {
    id: "TRX010",
    descricao: "Venda - Pedido #V006",
    valor: 64.40,
    data: "2023-04-22",
    dataPagamento: "2023-04-22",
    tipo: "receita",
    categoria: "Vendas",
    status: "confirmada",
    formaPagamento: "pix",
    vinculoId: "V006",
    vinculoTipo: "venda"
  }
];

/**
 * Busca transações com opções de filtragem e paginação
 */
export async function fetchTransacoes({
  tipo,
  status,
  dataInicio,
  dataFim,
  categoria,
  busca,
  page = 1,
  limit = 10
}: {
  tipo?: TransacaoTipo;
  status?: TransacaoStatus;
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
  busca?: string;
  page?: number;
  limit?: number;
}): Promise<{
  transacoes: Transacao[];
  total: number;
  totalPages: number;
}> {
  // Se Supabase não estiver disponível, retorna dados simulados
  if (usarDadosSimulados) {
    console.warn('Supabase não está disponível, usando dados simulados para transações financeiras');
    return processarDadosSimulados({ tipo, status, dataInicio, dataFim, categoria, busca, page, limit });
  }
  
  // Implementação real com Supabase
  try {
    let query = supabase.from('transactions').select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (dataInicio) {
      query = query.gte('data', dataInicio);
    }
    
    if (dataFim) {
      query = query.lte('data', dataFim);
    }
    
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    if (busca) {
      query = query.or(`descricao.ilike.%${busca}%,id.ilike.%${busca}%,observacoes.ilike.%${busca}%`);
    }
    
    // Aplicar paginação
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);
    
    // Ordenar por data (mais recente primeiro)
    query = query.order('data', { ascending: false });
    
    const { data, error, count } = await query;
    
    if (error) {
      // Se o erro for de tabela não existente, use dados simulados
      if (error.code === '42P01') {
        console.warn('Tabela "transactions" não existe no Supabase, usando dados simulados');
        return processarDadosSimulados({ tipo, status, dataInicio, dataFim, categoria, busca, page, limit });
      }
      
      console.error('Erro ao buscar transações:', error);
      throw new Error('Não foi possível buscar as transações');
    }
    
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      transacoes: data as Transacao[],
      total,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    // Fallback para dados simulados em caso de erro
    return processarDadosSimulados({ tipo, status, dataInicio, dataFim, categoria, busca, page, limit });
  }
}

// Função auxiliar para processar os dados simulados
function processarDadosSimulados({
  tipo,
  status,
  dataInicio,
  dataFim,
  categoria,
  busca,
  page = 1,
  limit = 10
}: {
  tipo?: TransacaoTipo;
  status?: TransacaoStatus;
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
  busca?: string;
  page?: number;
  limit?: number;
}): {
  transacoes: Transacao[];
  total: number;
  totalPages: number;
} {
  // Aplicar filtros aos dados simulados
  let transacoesFiltradas = [...transacoesSimuladas];
  
  if (tipo) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.tipo === tipo);
  }
  
  if (status) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.status === status);
  }
  
  if (dataInicio) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.data >= dataInicio);
  }
  
  if (dataFim) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.data <= dataFim);
  }
  
  if (categoria) {
    transacoesFiltradas = transacoesFiltradas.filter(t => t.categoria === categoria);
  }
  
  if (busca) {
    const termoBusca = busca.toLowerCase();
    transacoesFiltradas = transacoesFiltradas.filter(t => 
      t.descricao.toLowerCase().includes(termoBusca) || 
      t.id.toLowerCase().includes(termoBusca) ||
      (t.observacoes && t.observacoes.toLowerCase().includes(termoBusca))
    );
  }
  
  // Aplicar paginação
  const total = transacoesFiltradas.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const transacoesPaginadas = transacoesFiltradas.slice(start, end);
  
  return {
    transacoes: transacoesPaginadas,
    total,
    totalPages
  };
}

/**
 * Busca uma transação pelo ID
 */
export async function fetchTransacaoById(id: string): Promise<Transacao | null> {
  if (usarDadosSimulados) {
    console.warn('Supabase não está disponível, usando dados simulados');
    return transacoesSimuladas.find(t => t.id === id) || null;
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      // Se o erro for de tabela não existente, use dados simulados
      if (error.code === '42P01') {
        console.warn('Tabela "transactions" não existe no Supabase, usando dados simulados');
        return transacoesSimuladas.find(t => t.id === id) || null;
      }
      
      console.error('Erro ao buscar transação:', error);
      throw new Error('Não foi possível buscar a transação');
    }
    
    return data as Transacao;
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    // Fallback para dados simulados em caso de erro
    return transacoesSimuladas.find(t => t.id === id) || null;
  }
}

/**
 * Cria uma nova transação
 */
export async function createTransacao(transacao: Omit<Transacao, 'id'>): Promise<Transacao> {
  if (usarDadosSimulados) {
    console.warn('Supabase não está disponível, simulando criação de transação');
    return criarTransacaoSimulada(transacao);
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transacao])
      .select()
      .single();
      
    if (error) {
      // Se o erro for de tabela não existente, use dados simulados
      if (error.code === '42P01') {
        console.warn('Tabela "transactions" não existe no Supabase, usando dados simulados');
        return criarTransacaoSimulada(transacao);
      }
      
      console.error('Erro ao criar transação:', error);
      throw new Error('Não foi possível criar a transação');
    }
    
    return data as Transacao;
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    throw new Error('Não foi possível criar a transação');
  }
}

/**
 * Função auxiliar para criar transação simulada
 */
function criarTransacaoSimulada(transacao: Omit<Transacao, 'id'>): Transacao {
  const novaTransacao: Transacao = {
    id: `TRX${(transacoesSimuladas.length + 1).toString().padStart(3, '0')}`,
    ...transacao
  };
  transacoesSimuladas.unshift(novaTransacao);
  return novaTransacao;
}

/**
 * Atualiza uma transação existente
 */
export async function updateTransacao(id: string, transacao: Partial<Omit<Transacao, 'id'>>): Promise<Transacao> {
  if (usarDadosSimulados) {
    console.warn('Supabase não está disponível, simulando atualização de transação');
    return atualizarTransacaoSimulada(id, transacao);
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(transacao)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      // Se o erro for de tabela não existente, use dados simulados
      if (error.code === '42P01') {
        console.warn('Tabela "transactions" não existe no Supabase, usando dados simulados');
        return atualizarTransacaoSimulada(id, transacao);
      }
      
      console.error('Erro ao atualizar transação:', error);
      throw new Error('Não foi possível atualizar a transação');
    }
    
    return data as Transacao;
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    throw new Error('Não foi possível atualizar a transação');
  }
}

/**
 * Função auxiliar para atualizar transação simulada
 */
function atualizarTransacaoSimulada(id: string, transacao: Partial<Omit<Transacao, 'id'>>): Transacao {
  const index = transacoesSimuladas.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Transação não encontrada');
  }
  
  const transacaoAtualizada = {
    ...transacoesSimuladas[index],
    ...transacao
  };
  transacoesSimuladas[index] = transacaoAtualizada;
  return transacaoAtualizada;
}

/**
 * Remove uma transação
 */
export async function deleteTransacao(id: string): Promise<void> {
  if (usarDadosSimulados) {
    console.warn('Supabase não está disponível, simulando exclusão de transação');
    return excluirTransacaoSimulada(id);
  }
  
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
      
    if (error) {
      // Se o erro for de tabela não existente, use dados simulados
      if (error.code === '42P01') {
        console.warn('Tabela "transactions" não existe no Supabase, usando dados simulados');
        return excluirTransacaoSimulada(id);
      }
      
      console.error('Erro ao excluir transação:', error);
      throw new Error('Não foi possível excluir a transação');
    }
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    throw new Error('Não foi possível excluir a transação');
  }
}

/**
 * Função auxiliar para excluir transação simulada
 */
function excluirTransacaoSimulada(id: string): void {
  const index = transacoesSimuladas.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Transação não encontrada');
  }
  
  transacoesSimuladas.splice(index, 1);
}

/**
 * Obtém resumo financeiro (totais, receitas, despesas) para um período
 */
export async function obterResumoFinanceiro(dataInicio?: string, dataFim?: string): Promise<{
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitasPorCategoria: Record<string, number>;
  despesasPorCategoria: Record<string, number>;
}> {
  try {
    // Buscar todas as transações do período
    const { transacoes } = await fetchTransacoes({
      dataInicio,
      dataFim,
      limit: 1000 // Buscar um número grande para ter todas as transações do período
    });
    
    // Calcular totais
    const totalReceitas = transacoes
      .filter(t => t.tipo === 'receita' && t.status !== 'cancelada')
      .reduce((sum, t) => sum + t.valor, 0);
      
    const totalDespesas = transacoes
      .filter(t => t.tipo === 'despesa' && t.status !== 'cancelada')
      .reduce((sum, t) => sum + t.valor, 0);
      
    const saldo = totalReceitas - totalDespesas;
    
    // Calcular totais por categoria
    const receitasPorCategoria: Record<string, number> = {};
    const despesasPorCategoria: Record<string, number> = {};
    
    transacoes
      .filter(t => t.status !== 'cancelada')
      .forEach(t => {
        if (t.tipo === 'receita') {
          receitasPorCategoria[t.categoria] = (receitasPorCategoria[t.categoria] || 0) + t.valor;
        } else {
          despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + t.valor;
        }
      });
    
    return {
      totalReceitas,
      totalDespesas,
      saldo,
      receitasPorCategoria,
      despesasPorCategoria
    };
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    // Em caso de erro, retornar valores zerados
    return {
      totalReceitas: 0,
      totalDespesas: 0,
      saldo: 0,
      receitasPorCategoria: {},
      despesasPorCategoria: {}
    };
  }
} 