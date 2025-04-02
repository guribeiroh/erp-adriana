"use client";

import { useState, useEffect } from "react";
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
import { fetchTransacoes, Transacao, TransacaoTipo, TransacaoStatus, FormaPagamento } from '@/lib/services/financialService';

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

export default function FinanceiroPage() {
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
  
  // Carregar transações do serviço
  useEffect(() => {
    async function carregarTransacoes() {
      try {
        setCarregando(true);
        setErro(null);
        
        const data = await fetchTransacoes();
        setTransacoes(data);
        
        console.log('Transações carregadas:', data.length);
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarTransacoes();
  }, []);
  
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
  
  const saldoAtual = totalReceitasConfirmadas - totalDespesasConfirmadas;
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
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
          <div className="mb-6 grid gap-6 lg:grid-cols-4">
            {/* Cards de Resumo */}
            <div className="grid gap-6 lg:col-span-3">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Saldo */}
                <div className="col-span-2 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-1 text-sm font-medium text-neutral-600">Saldo Atual</h3>
                  <p className={`text-2xl font-semibold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarValor(saldoAtual)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-600">Saldo Previsto:</span>
                    <span className={`text-sm font-medium ${saldoPrevisto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatarValor(saldoPrevisto)}
                    </span>
                  </div>
                </div>
                
                {/* Receitas */}
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-1 text-sm font-medium text-neutral-600">Receitas</h3>
                  <p className="text-2xl font-semibold text-green-600">
                    {formatarValor(totalReceitasConfirmadas)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-600">A receber:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatarValor(totalReceitasPendentes)}
                    </span>
                  </div>
                </div>
                
                {/* Despesas */}
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-1 text-sm font-medium text-neutral-600">Despesas</h3>
                  <p className="text-2xl font-semibold text-red-600">
                    {formatarValor(totalDespesasConfirmadas)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-600">A pagar:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatarValor(totalDespesasPendentes)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Painéis de resumo */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Painel de gráficos */}
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <h3 className="mb-4 font-medium text-neutral-900">Visão Geral Financeira</h3>
                  <div className="flex h-64 items-center justify-center border-t border-neutral-200 pt-5">
                    <div className="text-center text-neutral-600">
                      <ChartPie className="mx-auto mb-2 h-12 w-12 text-neutral-400" />
                      <p>Gráfico de análise financeira</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        (Uma implementação real incluiria gráficos de receitas x despesas)
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Painel de transações recentes */}
                <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-medium text-neutral-900">Transações Recentes</h3>
                  {transacoes.length > 0 ? (
                    <div className="space-y-3">
                      {transacoes.slice(0, 5).map((transacao) => (
                        <div key={transacao.id} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                          <div>
                            <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                              {transacao.descricao}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatarData(transacao.data)}
                            </p>
                          </div>
                          <span className={`text-sm font-medium ${
                            transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transacao.tipo === 'receita' ? '+' : '-'}{formatarValor(transacao.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      <p>Nenhuma transação encontrada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ações rápidas */}
            <div className="space-y-6">
              {/* Menu de ações */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-medium text-neutral-500">Ações Rápidas</h3>
                <div className="mt-3 space-y-2">
                  <Link 
                    href="/dashboard/financeiro/fluxo-caixa"
                    className="flex items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <ChartBar className="mr-2 h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-700">Fluxo de Caixa</span>
                  </Link>
                  <Link 
                    href="/dashboard/financeiro/contas-pagar"
                    className="flex items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <ArrowDown className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-neutral-700">Contas a Pagar</span>
                  </Link>
                  <Link 
                    href="/dashboard/financeiro/contas-receber"
                    className="flex items-center rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-neutral-700">Contas a Receber</span>
                  </Link>
                </div>
              </div>
              
              {/* Botão de nova transação */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-medium text-neutral-500">Nova Transação</h3>
                <div className="space-y-2">
                  <Link
                    href="/dashboard/financeiro/nova-receita"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Receita
                  </Link>
                  <Link
                    href="/dashboard/financeiro/nova-despesa"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Despesa
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista de transações */}
          <div className="mt-6">
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
                <Link
                  href="/dashboard/financeiro/relatorios"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Relatórios</span>
                </Link>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="mb-4 flex flex-wrap gap-2">
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
                        <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
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