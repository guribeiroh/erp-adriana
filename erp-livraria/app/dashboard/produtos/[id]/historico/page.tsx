"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Download, 
  Loader2, 
  ShoppingCart,
  Calendar, 
  User, 
  DollarSign, 
  Package, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { fetchProductSaleHistory } from "@/lib/services/pdvService";
import { fetchBookById } from "@/lib/services/pdvService";
import { Book } from "@/models/database.types";

// Interface para item de venda
interface SaleHistoryItem {
  id: string;
  sale_id: string;
  date: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  customer_name: string;
  payment_method: string;
  payment_status: string;
}

export default function HistoricoVendasProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const produtoId = params.id as string;
  
  // Estados
  const [produto, setProduto] = useState<Book | null>(null);
  const [historicoVendas, setHistoricoVendas] = useState<SaleHistoryItem[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de filtro e paginação
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(10);
  
  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      setErro(null);
      
      try {
        // Carregar detalhes do produto
        const produtoDetalhes = await fetchBookById(produtoId);
        
        if (!produtoDetalhes) {
          throw new Error("Produto não encontrado");
        }
        
        setProduto(produtoDetalhes);
        
        // Carregar histórico de vendas
        const historico = await fetchProductSaleHistory(produtoId);
        setHistoricoVendas(historico);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setErro(error instanceof Error ? error.message : "Erro ao carregar dados");
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [produtoId]);
  
  // Aplicar filtros
  const vendasFiltradas = historicoVendas.filter(venda => {
    // Filtro por status de pagamento
    if (filtroStatus !== "todos" && venda.payment_status !== filtroStatus) {
      return false;
    }
    
    // Filtro por período
    if (filtroPeriodo !== "todos") {
      const dataVenda = new Date(venda.date);
      const hoje = new Date();
      
      // Filtro personalizado por data
      if (filtroPeriodo === "personalizado") {
        if (dataInicio) {
          const inicio = new Date(dataInicio);
          if (dataVenda < inicio) return false;
        }
        
        if (dataFim) {
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999); // Fim do dia
          if (dataVenda > fim) return false;
        }
        
        return true;
      }
      
      // Outros filtros de período
      const diasAtras = hoje.getTime() - 24 * 60 * 60 * 1000 * (
        filtroPeriodo === "7dias" ? 7 : 
        filtroPeriodo === "30dias" ? 30 : 
        filtroPeriodo === "90dias" ? 90 : 0
      );
      
      if (dataVenda.getTime() < diasAtras) {
        return false;
      }
    }
    
    return true;
  });
  
  // Dados de paginação
  const totalPaginas = Math.ceil(vendasFiltradas.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const vendasPaginadas = vendasFiltradas.slice(indiceInicial, indiceFinal);
  
  // Cálculos para resumo
  const totalVendas = vendasFiltradas.length;
  const totalQtd = vendasFiltradas.reduce((sum, venda) => sum + venda.quantity, 0);
  const totalValor = vendasFiltradas.reduce((sum, venda) => sum + venda.total, 0);
  const ticketMedio = totalVendas > 0 ? totalValor / totalVendas : 0;
  
  // Formatar moeda
  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };
  
  // Formatar data
  const formatarData = (dataString: string): string => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Formatar método de pagamento
  const formatarMetodoPagamento = (metodo: string): string => {
    const metodos: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'transfer': 'Transferência',
    };
    
    return metodos[metodo] || metodo;
  };
  
  // Formatar status de pagamento
  const formatarStatusPagamento = (status: string): string => {
    const statusMap: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'canceled': 'Cancelado'
    };
    
    return statusMap[status] || status;
  };
  
  // Estilo para status de pagamento
  const estiloStatusPagamento = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltroStatus("todos");
    setFiltroPeriodo("todos");
    setDataInicio("");
    setDataFim("");
    setPaginaAtual(1);
  };
  
  // Exportar dados
  const exportarDados = () => {
    // Implementação futura
    alert("Funcionalidade de exportação será implementada em breve!");
  };
  
  return (
    <DashboardLayout title={`Histórico de Vendas - ${produto?.title || 'Carregando...'}`}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={`/dashboard/produtos/${produtoId}`} 
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              Histórico de Vendas
            </h1>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <Calendar className="h-4 w-4" />
              Filtros
            </button>
            
            <button
              onClick={exportarDados}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
        
        {/* Dados do produto */}
        {produto && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-medium text-neutral-900">{produto.title}</h2>
                  <p className="text-sm text-neutral-500">{produto.author}</p>
                </div>
              </div>
              
              <div className="flex flex-1 flex-wrap gap-4 text-sm md:justify-end">
                <div className="rounded-lg bg-neutral-100 px-3 py-1">
                  <span className="font-medium text-neutral-700">ISBN:</span> {produto.isbn}
                </div>
                <div className="rounded-lg bg-neutral-100 px-3 py-1">
                  <span className="font-medium text-neutral-700">Estoque:</span> {produto.quantity} unidades
                </div>
                <div className="rounded-lg bg-neutral-100 px-3 py-1">
                  <span className="font-medium text-neutral-700">Preço:</span> {formatarMoeda(produto.selling_price)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Painel de filtros */}
        {mostrarFiltros && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-medium text-neutral-900">Filtros de Pesquisa</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="filtroStatus" className="block text-sm font-medium text-neutral-700">
                  Status de Pagamento
                </label>
                <select
                  id="filtroStatus"
                  value={filtroStatus}
                  onChange={(e) => {
                    setFiltroStatus(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="mt-1 block w-full rounded-md border-neutral-300 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="paid">Pagos</option>
                  <option value="pending">Pendentes</option>
                  <option value="canceled">Cancelados</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="filtroPeriodo" className="block text-sm font-medium text-neutral-700">
                  Período
                </label>
                <select
                  id="filtroPeriodo"
                  value={filtroPeriodo}
                  onChange={(e) => {
                    setFiltroPeriodo(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="mt-1 block w-full rounded-md border-neutral-300 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="30dias">Últimos 30 dias</option>
                  <option value="90dias">Últimos 90 dias</option>
                  <option value="personalizado">Período personalizado</option>
                </select>
              </div>
              
              {filtroPeriodo === "personalizado" && (
                <>
                  <div>
                    <label htmlFor="dataInicio" className="block text-sm font-medium text-neutral-700">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      id="dataInicio"
                      value={dataInicio}
                      onChange={(e) => {
                        setDataInicio(e.target.value);
                        setPaginaAtual(1);
                      }}
                      className="mt-1 block w-full rounded-md border-neutral-300 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dataFim" className="block text-sm font-medium text-neutral-700">
                      Data Final
                    </label>
                    <input
                      type="date"
                      id="dataFim"
                      value={dataFim}
                      onChange={(e) => {
                        setDataFim(e.target.value);
                        setPaginaAtual(1);
                      }}
                      className="mt-1 block w-full rounded-md border-neutral-300 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={limparFiltros}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
        
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total de Vendas</p>
                <p className="text-xl font-semibold text-neutral-900">{totalVendas}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 text-green-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Qtd. Total Vendida</p>
                <p className="text-xl font-semibold text-neutral-900">{totalQtd} unidades</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Valor Total</p>
                <p className="text-xl font-semibold text-neutral-900">{formatarMoeda(totalValor)}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2 text-purple-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Ticket Médio</p>
                <p className="text-xl font-semibold text-neutral-900">{formatarMoeda(ticketMedio)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabela de histórico */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {carregando ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <span className="ml-3 text-lg text-neutral-500">Carregando histórico de vendas...</span>
            </div>
          ) : erro ? (
            <div className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-neutral-900">Erro ao carregar histórico</h3>
              <p className="text-neutral-600">{erro}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500">Nenhuma venda encontrada para este produto.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Cliente
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Qtd.
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Preço Unit.
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Desconto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Pagamento
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {vendasPaginadas.map((venda) => (
                      <tr key={venda.id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {formatarData(venda.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-neutral-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-neutral-500" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {venda.customer_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {venda.quantity}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {formatarMoeda(venda.unit_price)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {venda.discount ? formatarMoeda(venda.discount) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                          {formatarMoeda(venda.total)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {formatarMetodoPagamento(venda.payment_method)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estiloStatusPagamento(venda.payment_status)}`}>
                            {formatarStatusPagamento(venda.payment_status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Link
                            href={`/dashboard/vendas/${venda.sale_id}`}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                      disabled={paginaAtual === 1}
                      className="relative inline-flex items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                      disabled={paginaAtual === totalPaginas}
                      className="relative ml-3 inline-flex items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-neutral-700">
                        Mostrando{' '}
                        <span className="font-medium">{indiceInicial + 1}</span>
                        {' '}a{' '}
                        <span className="font-medium">
                          {Math.min(indiceFinal, vendasFiltradas.length)}
                        </span>{' '}
                        de{' '}
                        <span className="font-medium">{vendasFiltradas.length}</span>{' '}
                        resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginação">
                        <button
                          onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                          disabled={paginaAtual === 1}
                          className="relative inline-flex items-center rounded-l-md border border-neutral-300 bg-white px-2 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        {Array.from({ length: Math.min(totalPaginas, 5) }).map((_, i) => {
                          // Lógica para mostrar páginas em torno da página atual
                          let pageNumber;
                          if (totalPaginas <= 5) {
                            pageNumber = i + 1;
                          } else if (paginaAtual <= 3) {
                            pageNumber = i + 1;
                          } else if (paginaAtual >= totalPaginas - 2) {
                            pageNumber = totalPaginas - 4 + i;
                          } else {
                            pageNumber = paginaAtual - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPaginaAtual(pageNumber)}
                              className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                                paginaAtual === pageNumber
                                  ? 'z-10 border-primary-500 bg-primary-50 text-primary-600'
                                  : 'border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaAtual === totalPaginas}
                          className="relative inline-flex items-center rounded-r-md border border-neutral-300 bg-white px-2 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Próxima</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 