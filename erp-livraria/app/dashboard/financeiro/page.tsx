"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  ChevronDown,
  CreditCard,
  Wallet,
  Banknote,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Coins,
  FileText,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ChartBar,
  ChartPie,
  CircleDollarSign,
  Receipt,
  ShoppingCart,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { fetchTransacoes, Transacao, TransacaoTipo, TransacaoStatus, FormaPagamento, forcarRecargaDados } from '@/lib/services/financialService';

// Dados simulados de categorias
const categoriasReceitas = [
  "Vendas", "Serviços", "Investimentos", "Outros"
];

const categoriasDespesas = [
  "Compra de Livros", "Salários", "Aluguel", "Água", "Luz", "Internet", 
  "Telefone", "Marketing", "Material de Escritório", "Manutenção",
  "Impostos", "Taxas Bancárias", "Outros"
];

// Dados simulados de transações
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
  },
  {
    id: "TRX011",
    descricao: "Insumos para Café",
    valor: 180.45,
    data: "2023-04-10",
    dataPagamento: "2023-04-10",
    tipo: "despesa",
    categoria: "Outros",
    status: "confirmada",
    formaPagamento: "dinheiro",
    observacoes: "Café, açúcar, copos descartáveis e outros insumos"
  },
  {
    id: "TRX012",
    descricao: "Pagamento de Impostos",
    valor: 1230.80,
    data: "2023-04-20",
    dataVencimento: "2023-04-20",
    dataPagamento: "2023-04-20",
    tipo: "despesa",
    categoria: "Impostos",
    status: "confirmada",
    formaPagamento: "boleto"
  },
  {
    id: "TRX013",
    descricao: "Venda - Pedido #V008",
    valor: 121.70,
    data: "2023-04-20",
    dataPagamento: "2023-04-20",
    tipo: "receita",
    categoria: "Vendas",
    status: "confirmada",
    formaPagamento: "credito",
    vinculoId: "V008",
    vinculoTipo: "venda"
  },
  {
    id: "TRX014",
    descricao: "Compra de Material de Escritório",
    valor: 235.90,
    data: "2023-04-05",
    dataPagamento: "2023-04-05",
    tipo: "despesa",
    categoria: "Material de Escritório",
    status: "confirmada",
    formaPagamento: "debito"
  },
  {
    id: "TRX015",
    descricao: "Taxas do Cartão de Crédito",
    valor: 128.75,
    data: "2023-04-15",
    dataVencimento: "2023-04-15",
    dataPagamento: "2023-04-15",
    tipo: "despesa",
    categoria: "Taxas Bancárias",
    status: "confirmada",
    formaPagamento: "debito"
  }
];

// Componente de carregamento
function FinanceiroLoading() {
  return (
    <DashboardLayout title="Financeiro">
      <div className="flex h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600 mx-auto"></div>
          <p className="text-neutral-600">Carregando informações financeiras...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Componente principal
function FinanceiroPage() {
  // Estados
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [transacoesFiltradas, setTransacoesFiltradas] = useState<Transacao[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | TransacaoTipo>("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | TransacaoStatus>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [ordenacao, setOrdenacao] = useState("data-desc"); // data-asc, data-desc, valor-asc, valor-desc
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [saldoAtual, setSaldoAtual] = useState(0);
  
  // Função para carregar transações
  const carregarTransacoes = useCallback(async () => {
    try {
      setAtualizando(true);
      setErro(null);
      
      const result = await fetchTransacoes({
        limit: 100 // Aumentar o limite para garantir que todas as transações recentes sejam carregadas
      });
      
      setTransacoes(result.transacoes);
      setSaldoAtual(result.currentBalance);
      
      console.log('Transações carregadas:', result.transacoes.length);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);
  
  // Efeito para carregar transações do serviço na inicialização
  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);
  
  // Efeito para atualizar dados a cada 60 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      console.log('Atualizando transações automaticamente...');
      carregarTransacoes();
    }, 60000); // 60 segundos
    
    return () => clearInterval(intervalo);
  }, [carregarTransacoes]);
  
  // Função para forçar a atualização manual dos dados
  const atualizarDados = () => {
    console.log('====== INÍCIO: Atualização manual de transações ======');
    setAtualizando(true);
    
    // Pequeno delay para garantir efeito visual de carregamento
    setTimeout(async () => {
      try {
        // Forçar uma chamada ao localStorage para verificar se há dados
        if (typeof window !== 'undefined') {
          const dadosLocal = localStorage.getItem('erp-livraria-transacoes');
          console.log(`Dados no localStorage: ${dadosLocal ? 'Encontrados' : 'Não encontrados'}`);
          if (dadosLocal) {
            console.log(`Tamanho dos dados: ${dadosLocal.length} caracteres`);
            const dadosParsed = JSON.parse(dadosLocal);
            console.log(`Transações no localStorage: ${dadosParsed.length}`);
          }
        }
        
        // Forçar recarga de dados do localStorage
        const quantidadeTransacoes = forcarRecargaDados();
        console.log(`Recarregadas ${quantidadeTransacoes} transações do localStorage`);
        
        console.log('Buscando transações do serviço financeiro...');
        const result = await fetchTransacoes({
          limit: 100
        });
        
        console.log('Resultado da busca:', {
          totalTransacoes: result.transacoes.length,
          saldo: result.currentBalance,
          totalPaginas: result.totalPages,
          total: result.total
        });
        
        if (result.transacoes.length > 0) {
          console.log('Primeira transação:', result.transacoes[0]);
          console.log('Última transação:', result.transacoes[result.transacoes.length - 1]);
        } else {
          console.warn('Nenhuma transação retornada pela API');
        }
        
        setTransacoes(result.transacoes);
        setSaldoAtual(result.currentBalance);
      } catch (error) {
        console.error('Erro durante atualização manual:', error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setAtualizando(false);
        console.log('====== FIM: Atualização manual de transações ======');
      }
    }, 300);
  };
  
  // Calcular totais para o resumo
  const todasReceitas = transacoes.filter(t => t.tipo === "receita" && t.status !== "cancelada");
  const todasDespesas = transacoes.filter(t => t.tipo === "despesa" && t.status !== "cancelada");
  
  const receitasConfirmadas = todasReceitas.filter(t => t.status === "confirmada");
  const despesasConfirmadas = todasDespesas.filter(t => t.status === "confirmada");
  const receitasPendentes = todasReceitas.filter(t => t.status === "pendente");
  const despesasPendentes = todasDespesas.filter(t => t.status === "pendente");
  
  const totalReceitasConfirmadas = receitasConfirmadas.reduce((acc, t) => acc + t.valor, 0);
  const totalDespesasConfirmadas = despesasConfirmadas.reduce((acc, t) => acc + t.valor, 0);
  const totalReceitasPendentes = receitasPendentes.reduce((acc, t) => acc + t.valor, 0);
  const totalDespesasPendentes = despesasPendentes.reduce((acc, t) => acc + t.valor, 0);
  
  const saldoPrevisto = saldoAtual + totalReceitasPendentes - totalDespesasPendentes;
  
  // Agrupar transações por categoria para análise
  const receitasPorCategoria = receitasConfirmadas.reduce((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
    return acc;
  }, {} as Record<string, number>);
  
  const despesasPorCategoria = despesasConfirmadas.reduce((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
    return acc;
  }, {} as Record<string, number>);
  
  // Formatador de data
  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  // Formatador de valor monetário
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };
  
  // Efeito para filtrar e ordenar transações
  useEffect(() => {
    let resultado = [...transacoes];
    
    // Aplicar filtro de tipo
    if (filtroTipo !== "todos") {
      resultado = resultado.filter(t => t.tipo === filtroTipo);
    }
    
    // Aplicar filtro de status
    if (filtroStatus !== "todos") {
      resultado = resultado.filter(t => t.status === filtroStatus);
    }
    
    // Aplicar filtro de categoria
    if (filtroCategoria !== "todas") {
      resultado = resultado.filter(t => t.categoria === filtroCategoria);
    }
    
    // Aplicar filtro de período
    if (periodoInicio) {
      resultado = resultado.filter(t => t.data >= periodoInicio);
    }
    
    if (periodoFim) {
      resultado = resultado.filter(t => t.data <= periodoFim);
    }
    
    // Aplicar filtro de busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(t => 
        t.descricao.toLowerCase().includes(termoBusca) || 
        t.id.toLowerCase().includes(termoBusca) ||
        t.categoria.toLowerCase().includes(termoBusca)
      );
    }
    
    // Aplicar ordenação
    if (ordenacao === "data-asc") {
      resultado.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    } else if (ordenacao === "data-desc") {
      resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    } else if (ordenacao === "valor-asc") {
      resultado.sort((a, b) => a.valor - b.valor);
    } else if (ordenacao === "valor-desc") {
      resultado.sort((a, b) => b.valor - a.valor);
    }
    
    setTransacoesFiltradas(resultado);
  }, [transacoes, busca, filtroTipo, filtroStatus, filtroCategoria, ordenacao, periodoInicio, periodoFim]);
  
  // Handler para alterar ordenação
  const handleOrdenacaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrdenacao(e.target.value);
  };
  
  return (
    <DashboardLayout title="Financeiro">
      {carregando ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600 mx-auto"></div>
            <p className="text-neutral-600">Carregando informações financeiras...</p>
          </div>
        </div>
      ) : erro ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="mb-2 text-neutral-900">Erro ao carregar dados financeiros</p>
            <p className="text-neutral-600">{erro}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 grid gap-6">
            {/* Cards de Resumo */}
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Saldo */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-neutral-500">Saldo Atual</h3>
                <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarValor(saldoAtual)}
                </p>
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Saldo Previsto:</span>
                    <span className={`text-sm font-medium ${saldoPrevisto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatarValor(saldoPrevisto)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Receitas */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-neutral-500">Receitas</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatarValor(totalReceitasConfirmadas)}
                </p>
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">A receber:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatarValor(totalReceitasPendentes)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Despesas */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-medium text-neutral-500">Despesas</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatarValor(totalDespesasConfirmadas)}
                </p>
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">A pagar:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatarValor(totalDespesasPendentes)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista de transações e ações rápidas */}
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold text-neutral-900">Lista de Transações</h2>
            
            {/* Ações em lote e pesquisa */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-grow sm:max-w-[240px]">
                <input
                  type="text"
                  placeholder="Pesquisar transações..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              <button
                onClick={atualizarDados}
                disabled={atualizando}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`h-4 w-4 ${atualizando ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
              <Link
                href="/dashboard/financeiro/relatorios"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </Link>
            </div>
          </div>
          
          {/* Filtros e ações rápidas */}
          <div className="mb-4 flex flex-wrap justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as "todos" | TransacaoTipo)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="todos">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
              
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as "todos" | TransacaoStatus)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="todos">Todos os status</option>
                <option value="confirmada">Confirmadas</option>
                <option value="pendente">Pendentes</option>
                <option value="cancelada">Canceladas</option>
              </select>
              
              <select
                value={ordenacao}
                onChange={handleOrdenacaoChange}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="data-desc">Data (mais recente)</option>
                <option value="data-asc">Data (mais antiga)</option>
                <option value="valor-desc">Valor (maior)</option>
                <option value="valor-asc">Valor (menor)</option>
              </select>
            </div>
            
            {/* Ações rápidas em linha */}
            <div className="flex gap-2">
              <Link 
                href="/dashboard/financeiro/nova-receita"
                className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <Plus className="mr-1 h-4 w-4" />
                Nova Receita
              </Link>
              <Link 
                href="/dashboard/financeiro/nova-despesa"
                className="inline-flex items-center rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <Plus className="mr-1 h-4 w-4" />
                Nova Despesa
              </Link>
              <Link 
                href="/dashboard/financeiro/contas-pagar"
                className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                title="Contas a Pagar"
              >
                <ArrowDown className="h-4 w-4 text-red-500" />
                <span className="hidden lg:ml-1 lg:inline">Contas a Pagar</span>
              </Link>
              <Link 
                href="/dashboard/financeiro/contas-receber"
                className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                title="Contas a Receber"
              >
                <ArrowUp className="h-4 w-4 text-green-500" />
                <span className="hidden lg:ml-1 lg:inline">Contas a Receber</span>
              </Link>
            </div>
          </div>
          
          {/* Tabela de transações */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Data</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Descrição</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Categoria</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Valor</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Link</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {transacoesFiltradas.length > 0 ? (
                    transacoesFiltradas.map((transacao) => (
                      <tr key={transacao.id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-900">
                          {formatarData(transacao.data)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-900">
                          <div>
                            <p className="font-medium">{transacao.descricao}</p>
                            {transacao.dataVencimento && transacao.status === 'pendente' && (
                              <p className="text-xs text-neutral-500">
                                Vence: {formatarData(transacao.dataVencimento)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-500">
                          {transacao.categoria}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium">
                          <span className={transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                            {transacao.tipo === 'receita' ? '+' : '-'}{formatarValor(transacao.valor)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                          <StatusBadge status={transacao.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-500">
                          {transacao.linkVenda && (
                            <Link
                              href={transacao.linkVenda}
                              className="rounded p-1 text-primary-600 hover:bg-neutral-100 hover:underline flex items-center"
                              title="Ver venda"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              <span>Ver venda</span>
                            </Link>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-500">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/financeiro/${transacao.id}`}
                              className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600"
                              title="Ver detalhes"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                            {transacao.status !== "cancelada" && (
                              <Link
                                href={`/dashboard/financeiro/${transacao.id}/editar`}
                                className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600"
                                title="Editar"
                              >
                                <Coins className="h-4 w-4" />
                              </Link>
                            )}
                            <button
                              className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600"
                              title="Imprimir comprovante"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                        Nenhuma transação encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginação simplificada */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-700">
                  Exibindo <span className="font-medium">{transacoesFiltradas.length}</span> transações
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                  disabled
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Componente para exibir o status da transação
function StatusBadge({ status }: { status: TransacaoStatus }) {
  let color;
  
  switch (status) {
    case "confirmada":
      color = "bg-green-50 text-green-700";
      break;
    case "pendente":
      color = "bg-yellow-50 text-yellow-700";
      break;
    case "cancelada":
      color = "bg-red-50 text-red-700";
      break;
    default:
      color = "bg-neutral-100 text-neutral-700";
  }
  
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status === "confirmada" && "Confirmada"}
      {status === "pendente" && "Pendente"}
      {status === "cancelada" && "Cancelada"}
    </span>
  );
}

// Exporta o componente principal em um Suspense
export default function FinanceiroPageWrapper() {
  return (
    <Suspense fallback={<FinanceiroLoading />}>
      <FinanceiroPage />
    </Suspense>
  );
} 