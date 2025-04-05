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
  linkVenda?: string; // Link para acessar a venda relacionada
}

// Interface que representa o formato dos dados na tabela do Supabase
interface TransacaoSupabase {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  datavencimento?: string;
  datapagamento?: string;
  tipo: TransacaoTipo;
  categoria: string;
  status: TransacaoStatus;
  formapagamento?: string;
  observacoes?: string;
  vinculoid?: string;
  vinculotipo?: string;
  comprovante?: string;
  linkvenda?: string;
  created_at?: string;
  updated_at?: string;
}

// Converter objeto da interface Transacao para o formato do Supabase
function transacaoToSupabase(transacao: Omit<Transacao, 'id'>): Omit<TransacaoSupabase, 'id' | 'created_at' | 'updated_at'> {
  const { dataVencimento, dataPagamento, formaPagamento, vinculoId, vinculoTipo, linkVenda, ...resto } = transacao;
  
  return {
    ...resto,
    datavencimento: dataVencimento,
    datapagamento: dataPagamento,
    formapagamento: formaPagamento,
    vinculoid: vinculoId,
    vinculotipo: vinculoTipo,
    linkvenda: linkVenda
  };
}

// Converter objeto do formato do Supabase para a interface Transacao
function supabaseToTransacao(dados: TransacaoSupabase): Transacao {
  const { datavencimento, datapagamento, formapagamento, vinculoid, vinculotipo, linkvenda, created_at, updated_at, ...resto } = dados;
  
  return {
    ...resto,
    dataVencimento: datavencimento,
    dataPagamento: datapagamento,
    formaPagamento: formapagamento as FormaPagamento,
    vinculoId: vinculoid,
    vinculoTipo: vinculotipo as "venda" | "compra" | "outro",
    linkVenda: linkvenda
  };
}

// Função para verificar o estado da autenticação antes de operações CRUD
async function verificarAutenticacao() {
  if (!supabase) {
    console.warn('Cliente Supabase não está disponível');
    return false;
  }
  
  try {
    // Verificar se há uma sessão ativa
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
    
    if (!data.session) {
      console.warn('Não há sessão de autenticação ativa');
      return false;
    }
    
    // Sessão ativa encontrada
    console.log('Sessão de autenticação verificada, ID do usuário:', data.session.user.id);
    return true;
  } catch (error) {
    console.error('Erro inesperado ao verificar autenticação:', error);
    return false;
  }
}

// Armazenamento local de transações para garantir o funcionamento básico
// mesmo sem conectividade com o backend
const TRANSACOES_INICIAIS: Transacao[] = [
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
  }
];

// Variável global para armazenar as transações em memória
let localTransacoes: Transacao[] = [];

// Persistir transações no localStorage para manter dados entre recarregamentos
function salvarDadosNoStorage() {
  if (typeof window !== 'undefined') {
    try {
      console.log('====== Salvando dados no localStorage ======');
      console.log('Total de transações a salvar:', localTransacoes.length);
      const jsonData = JSON.stringify(localTransacoes);
      console.log(`Tamanho dos dados: ${jsonData.length} caracteres`);
      
      localStorage.setItem('erp-livraria-transacoes', jsonData);
      console.log('Dados salvos com sucesso no localStorage');
      
      // Verificação imediata para garantir que os dados foram salvos
      const verificacao = localStorage.getItem('erp-livraria-transacoes');
      console.log(`Verificação de salvamento: ${verificacao ? 'Dados encontrados' : 'FALHA - Dados não encontrados'}`);
      console.log(`Tamanho dos dados verificados: ${verificacao?.length || 0} caracteres`);
    } catch (error) {
      console.error('Erro ao salvar transações no localStorage:', error);
    }
  } else {
    console.warn('Window não está disponível (provavelmente renderização do lado do servidor)');
  }
}

// Carregar transações do localStorage se disponível
function carregarDadosDoStorage() {
  if (typeof window !== 'undefined') {
    try {
      console.log('====== Carregando dados do localStorage ======');
      const dados = localStorage.getItem('erp-livraria-transacoes');
      console.log(`Dados encontrados: ${dados ? 'Sim' : 'Não'}`);
      
      if (dados) {
        console.log(`Tamanho dos dados: ${dados.length} caracteres`);
        const transacoesParsed = JSON.parse(dados);
        console.log(`Total de transações carregadas: ${transacoesParsed.length}`);
        localTransacoes = transacoesParsed;
        
        // Verificar se existem transações
        if (transacoesParsed.length > 0) {
          console.log('Primeira transação:', transacoesParsed[0].id);
          console.log('Última transação:', transacoesParsed[transacoesParsed.length - 1].id);
        } else {
          console.warn('Nenhuma transação encontrada no localStorage');
        }
      } else {
        console.warn('Nenhum dado encontrado no localStorage');
        // Garantir dados iniciais
        localTransacoes = TRANSACOES_INICIAIS;
        // Salvar imediatamente para garantir persistência
        setTimeout(() => salvarDadosNoStorage(), 100);
      }
    } catch (error) {
      console.error('Erro ao carregar transações do localStorage:', error);
      console.log('Usando dados iniciais devido a erro');
      localTransacoes = TRANSACOES_INICIAIS;
    }
  } else {
    console.warn('Window não está disponível (provavelmente renderização do lado do servidor)');
  }
}

// Inicializar dados
carregarDadosDoStorage();

/**
 * Forçar a recarga de dados do localStorage
 * Útil para garantir que os dados estão atualizados após operações
 */
export function forcarRecargaDados() {
  console.log('====== Forçando recarga de dados do localStorage ======');
  carregarDadosDoStorage();
  return localTransacoes.length;
}

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
  vinculoId,
  vinculoTipo,
  page = 1,
  limit = 10
}: {
  tipo?: TransacaoTipo;
  status?: TransacaoStatus;
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
  busca?: string;
  vinculoId?: string;
  vinculoTipo?: "venda" | "compra" | "outro";
  page?: number;
  limit?: number;
}): Promise<{
  transacoes: Transacao[];
  total: number;
  totalPages: number;
  currentBalance: number;
}> {
  // Sempre tentar primeiro com o Supabase
  if (supabase) {
    try {
      console.log('Tentando obter transações do Supabase...');
      let query = supabase.from('financial_transactions').select('*', { count: 'exact' });
      
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
      
      if (vinculoId) {
        query = query.eq('vinculoid', vinculoId);
      }
      
      if (vinculoTipo) {
        query = query.eq('vinculotipo', vinculoTipo);
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
        throw error;
      }
      
      console.log('Transações obtidas do Supabase:', data?.length || 0);
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      // Converter os dados do formato do Supabase para o formato da interface
      const transacoes = (data as TransacaoSupabase[]).map(supabaseToTransacao);
      
      // Calcular saldo atual usando TODAS as transações confirmadas, não apenas as filtradas
      // Fazer uma consulta separada para obter todas as transações confirmadas
      const { data: allConfirmedData, error: allConfirmedError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('status', 'confirmada');
        
      if (allConfirmedError) {
        throw allConfirmedError;
      }
      
      const allConfirmedTransactions = (allConfirmedData as TransacaoSupabase[]).map(supabaseToTransacao);
      const currentBalance = allConfirmedTransactions.reduce((acc, t) => {
        return t.tipo === 'receita' ? acc + t.valor : acc - t.valor;
      }, 0);
      
      return {
        transacoes,
        total,
        totalPages,
        currentBalance
      };
    } catch (error) {
      console.error('Erro ao buscar transações do Supabase:', error);
      console.log('Usando dados locais para transações...');
    }
  } else {
    console.log('Supabase não está disponível, usando dados locais...');
  }
  
  // Fallback para dados locais
  try {
    console.log('====== Executando fallback para dados locais ======');
    console.log('Total de transações em memória:', localTransacoes.length);
    
    // DEBUG: Verificar novamente o localStorage
    if (typeof window !== 'undefined') {
      const rawData = localStorage.getItem('erp-livraria-transacoes');
      console.log(`Dados no localStorage: ${rawData ? 'Encontrados' : 'Não encontrados'}`);
      
      if (rawData) {
        console.log(`Tamanho dos dados: ${rawData.length} caracteres`);
        try {
          const parsedData = JSON.parse(rawData);
          console.log(`Total de transações no localStorage: ${parsedData.length}`);
          
          // Comparar com os dados em memória
          if (parsedData.length !== localTransacoes.length) {
            console.warn('ATENÇÃO: Inconsistência entre localStorage e memória detectada!');
            console.log('Dados completos do localStorage:', parsedData);
            
            // Atualizar os dados em memória
            console.log('Atualizando dados em memória com os do localStorage...');
            localTransacoes = parsedData;
          }
        } catch (parseError) {
          console.error('Erro ao analisar dados do localStorage:', parseError);
        }
      } else {
        console.warn('Nenhum dado encontrado no localStorage');
      }
    }
    
    // Aplicar filtros aos dados locais
    let transacoesFiltradas = [...localTransacoes];
    
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
    
    if (vinculoId) {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.vinculoId === vinculoId);
    }
    
    if (vinculoTipo) {
      transacoesFiltradas = transacoesFiltradas.filter(t => t.vinculoTipo === vinculoTipo);
    }
    
    if (busca) {
      const termoBusca = busca.toLowerCase();
      transacoesFiltradas = transacoesFiltradas.filter(t => 
        t.descricao.toLowerCase().includes(termoBusca) || 
        t.id.toLowerCase().includes(termoBusca) ||
        (t.observacoes && t.observacoes.toLowerCase().includes(termoBusca))
      );
    }
    
    // Ordenar por data (mais recente primeiro)
    transacoesFiltradas.sort((a, b) => {
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });
    
    // Aplicar paginação
    const start = (page - 1) * limit;
    const end = start + limit;
    const transacoesPaginadas = transacoesFiltradas.slice(start, end);
    
    const total = transacoesFiltradas.length;
    const totalPages = Math.ceil(total / limit);
    
    // Calcular saldo atual usando TODAS as transações confirmadas, não apenas as filtradas
    const confirmedTransactions = localTransacoes.filter(t => t.status === 'confirmada');
    const currentBalance = confirmedTransactions.reduce((acc, t) => {
      return t.tipo === 'receita' ? acc + t.valor : acc - t.valor;
    }, 0);
    
    return {
      transacoes: transacoesPaginadas,
      total,
      totalPages,
      currentBalance
    };
  } catch (error) {
    console.error('Erro ao processar dados locais:', error);
    return {
      transacoes: [],
      total: 0,
      totalPages: 0,
      currentBalance: 0
    };
  }
}

/**
 * Busca uma transação pelo ID
 */
export async function fetchTransacaoById(id: string): Promise<Transacao | null> {
  // Tentar primeiro com o Supabase
  if (supabase) {
    try {
      console.log('Tentando buscar transação do Supabase, ID:', id);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      console.log('Transação encontrada no Supabase:', data);
      
      // Converter do formato do Supabase para o formato da interface
      return supabaseToTransacao(data as TransacaoSupabase);
    } catch (error) {
      console.error('Erro ao buscar transação do Supabase:', error);
      console.log('Buscando nos dados locais...');
    }
  } else {
    console.log('Supabase não está disponível, buscando nos dados locais...');
  }
  
  // Fallback para dados locais
  const transacao = localTransacoes.find(t => t.id === id);
  return transacao || null;
}

/**
 * Cria uma nova transação
 */
export async function createTransacao(transacao: Omit<Transacao, 'id'>): Promise<Transacao> {
  console.log('====== INÍCIO: Criação de Transação Financeira ======');
  console.log('Dados recebidos para criação:', JSON.stringify(transacao, null, 2));
  
  // Tentar primeiro com o Supabase
  if (supabase) {
    try {
      console.log('Supabase disponível, tentando criar transação remotamente...');
      
      // Converter para o formato do Supabase
      const dadosSupabase = transacaoToSupabase(transacao);
      console.log('Dados convertidos para formato Supabase:', dadosSupabase);
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([dadosSupabase])
        .select()
        .single();
        
      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        throw error;
      }
      
      console.log('Transação criada com sucesso no Supabase:', data);
      
      // Converter de volta para o formato da interface
      const transacaoFinal = supabaseToTransacao(data as TransacaoSupabase);
      console.log('Dados convertidos de volta para formato da aplicação:', transacaoFinal);
      console.log('====== FIM: Criação de Transação Financeira (Supabase) ======');
      return transacaoFinal;
    } catch (error) {
      console.error('Erro detalhado ao criar transação no Supabase:', error);
      console.log('Fallback: Criando nos dados locais devido a erro no Supabase...');
    }
  } else {
    console.log('Supabase não está disponível, criando nos dados locais...');
  }
  
  // Fallback para dados locais
  console.log('Iniciando criação em armazenamento local...');
  const id = `TRX${String(localTransacoes.length + 1).padStart(3, '0')}`;
  
  const novaTransacao: Transacao = {
    id,
    ...transacao
  };
  
  console.log('Nova transação local criada:', novaTransacao);
  
  // Adicionar ao início do array para aparecer primeiro nas listagens
  localTransacoes.unshift(novaTransacao);
  
  console.log(`Transação adicionada aos dados locais. Total de transações: ${localTransacoes.length}`);
  
  // Persistir no localStorage
  try {
    salvarDadosNoStorage();
    console.log('Dados salvos com sucesso no localStorage');
  } catch (storageError) {
    console.error('Erro ao salvar no localStorage:', storageError);
  }
  
  console.log('====== FIM: Criação de Transação Financeira (Local) ======');
  return novaTransacao;
}

/**
 * Atualiza uma transação existente
 */
export async function updateTransacao(id: string, transacao: Partial<Omit<Transacao, 'id'>>): Promise<Transacao> {
  // Tentar primeiro com o Supabase
  if (supabase) {
    try {
      console.log('Tentando atualizar transação no Supabase, ID:', id);
      
      // Converter para o formato do Supabase
      const dadosSupabase: Partial<TransacaoSupabase> = {};
      
      // Mapear manualmente cada campo para garantir a conversão correta
      if (transacao.dataVencimento !== undefined) dadosSupabase.datavencimento = transacao.dataVencimento;
      if (transacao.dataPagamento !== undefined) dadosSupabase.datapagamento = transacao.dataPagamento;
      if (transacao.formaPagamento !== undefined) dadosSupabase.formapagamento = transacao.formaPagamento;
      if (transacao.vinculoId !== undefined) dadosSupabase.vinculoid = transacao.vinculoId;
      if (transacao.vinculoTipo !== undefined) dadosSupabase.vinculotipo = transacao.vinculoTipo;
      
      // Copiar os campos que têm o mesmo nome
      if (transacao.descricao !== undefined) dadosSupabase.descricao = transacao.descricao;
      if (transacao.valor !== undefined) dadosSupabase.valor = transacao.valor;
      if (transacao.data !== undefined) dadosSupabase.data = transacao.data;
      if (transacao.tipo !== undefined) dadosSupabase.tipo = transacao.tipo;
      if (transacao.categoria !== undefined) dadosSupabase.categoria = transacao.categoria;
      if (transacao.status !== undefined) dadosSupabase.status = transacao.status;
      if (transacao.observacoes !== undefined) dadosSupabase.observacoes = transacao.observacoes;
      if (transacao.comprovante !== undefined) dadosSupabase.comprovante = transacao.comprovante;
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(dadosSupabase)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      console.log('Transação atualizada com sucesso no Supabase:', data);
      
      // Converter de volta para o formato da interface
      return supabaseToTransacao(data as TransacaoSupabase);
    } catch (error) {
      console.error('Erro ao atualizar transação no Supabase:', error);
      console.log('Atualizando nos dados locais...');
    }
  } else {
    console.log('Supabase não está disponível, atualizando nos dados locais...');
  }
  
  // Fallback para dados locais
  const index = localTransacoes.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error(`Transação com id ${id} não encontrada`);
  }
  
  const transacaoAtualizada = {
    ...localTransacoes[index],
    ...transacao
  };
  
  localTransacoes[index] = transacaoAtualizada;
  
  // Persistir no localStorage
  salvarDadosNoStorage();
  
  return transacaoAtualizada;
}

/**
 * Remove uma transação
 */
export async function deleteTransacao(id: string): Promise<void> {
  // Tentar primeiro com o Supabase
  if (supabase) {
    try {
      console.log('Tentando excluir transação do Supabase, ID:', id);
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      console.log('Transação excluída com sucesso do Supabase');
      
      // Remover também dos dados locais se existir
      const index = localTransacoes.findIndex(t => t.id === id);
      if (index !== -1) {
        localTransacoes.splice(index, 1);
        salvarDadosNoStorage();
      }
      
      return;
    } catch (error) {
      console.error('Erro ao excluir transação do Supabase:', error);
      console.log('Excluindo dos dados locais...');
    }
  } else {
    console.log('Supabase não está disponível, excluindo dos dados locais...');
  }
  
  // Fallback para dados locais
  const index = localTransacoes.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error(`Transação com id ${id} não encontrada`);
  }
  
  localTransacoes.splice(index, 1);
  
  // Persistir no localStorage
  salvarDadosNoStorage();
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