"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { ArrowLeft, Search, Filter, Calendar, Package, ArrowUp, ArrowDown, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { stockService, StockMovementWithBook } from "@/lib/services/stockService";
import { fetchBookById } from "@/lib/services/pdvService";
import { Book } from "@/models/database.types";

// Componente para o conteúdo da página envolto por Suspense
function HistoricoMovimentacoesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ID do produto para filtrar, se houver
  const produtoId = searchParams.get('produto');
  
  // Estados
  const [movimentacoes, setMovimentacoes] = useState<StockMovementWithBook[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtoFiltrado, setProdutoFiltrado] = useState<Book | null>(null);
  
  // Estados de filtro e paginação
  const [termoBusca, setTermoBusca] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>(TIPOS_MOVIMENTACAO.TODOS);
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(10);
  
  // Efeito para carregar movimentações
  useEffect(() => {
    buscarMovimentacoes();
  }, []);
  
  // Função para buscar movimentações
  const buscarMovimentacoes = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      // Se tivermos um ID de produto, buscar detalhes do produto e suas movimentações específicas
      if (produtoId) {
        // Buscar detalhes do produto
        const produto = await fetchBookById(produtoId);
        
        if (!produto) {
          throw new Error('Produto não encontrado');
        }
        
        setProdutoFiltrado(produto);
        
        // Buscar movimentações específicas para este produto
        const bookMovementsResponse = await stockService.getBookMovements(produtoId);
        
        if (bookMovementsResponse.status === 'success' && bookMovementsResponse.data) {
          // Precisamos converter StockMovement para StockMovementWithBook, 
          // adicionando a informação do livro encontrado
          const movementsWithBook = bookMovementsResponse.data.map(movement => ({
            ...movement,
            book: produto
          })) as StockMovementWithBook[];
          
          setMovimentacoes(movementsWithBook);
        } else {
          setErro(bookMovementsResponse.error || 'Erro ao carregar movimentações do produto');
        }
      } else {
        // Buscar todas as movimentações normalmente
        const response = await stockService.getMovementsWithBooks(100);
        
        if (response.status === 'success' && response.data) {
          setMovimentacoes(response.data);
        } else {
          setErro(response.error || 'Erro ao carregar movimentações');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao carregar movimentações');
    } finally {
      setCarregando(false);
    }
  };
  
  // Aplicar filtros
  const movimentacoesFiltradas = movimentacoes
    .filter(mov => {
      // Filtro por texto (nome do livro, código ou responsável)
      const termoLowerCase = termoBusca.toLowerCase().trim();
      if (termoBusca && !mov.book?.title?.toLowerCase().includes(termoLowerCase) && 
          !mov.book?.isbn?.toLowerCase().includes(termoLowerCase) &&
          !mov.responsible.toLowerCase().includes(termoLowerCase)) {
        return false;
      }
      
      // Filtro por tipo
      if (filtroTipo !== TIPOS_MOVIMENTACAO.TODOS && mov.type !== filtroTipo) {
        return false;
      }
      
      // Filtro por data de início
      if (filtroDataInicio) {
        const dataInicio = new Date(filtroDataInicio);
        const dataMovimentacao = new Date(mov.created_at);
        if (dataMovimentacao < dataInicio) return false;
      }
      
      // Filtro por data de fim
      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        dataFim.setHours(23, 59, 59, 999); // Fim do dia
        const dataMovimentacao = new Date(mov.created_at);
        if (dataMovimentacao > dataFim) return false;
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // Paginação
  const totalPaginas = Math.ceil(movimentacoesFiltradas.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(indiceInicial, indiceFinal);
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setTermoBusca("");
    setFiltroTipo(TIPOS_MOVIMENTACAO.TODOS);
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setPaginaAtual(1);
  };
  
  // Função para exportar dados
  const exportarDados = () => {
    // Implementação futura para exportar para CSV ou Excel
    alert("Funcionalidade de exportação será implementada em breve!");
  };
  
  // Função para formatar data e hora
  const formatarDataHora = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={produtoFiltrado ? `/dashboard/produtos/${produtoId}` : "/dashboard/estoque"} 
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              {produtoFiltrado 
                ? `Movimentações de Estoque: ${produtoFiltrado.title}` 
                : "Histórico de Movimentações"}
            </h1>
          </div>
          {produtoFiltrado ? null : (
            <Link
              href="/dashboard/estoque/movimentacao"
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700"
            >
              Nova Movimentação
            </Link>
          )}
        </div>
        
        {/* Barra de pesquisa e filtros */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => {
                  setTermoBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar por livro, código ou responsável..."
                className="block w-full rounded-md border-neutral-300 pl-10 py-2 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
              
              <button
                onClick={exportarDados}
                className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>
          
          {/* Painel de filtros */}
          {mostrarFiltros && (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label htmlFor="filtroTipo" className="block text-sm font-medium text-neutral-700">
                  Tipo de Movimentação
                </label>
                <select
                  id="filtroTipo"
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value={TIPOS_MOVIMENTACAO.TODOS}>Todos</option>
                  <option value={TIPOS_MOVIMENTACAO.ENTRADA}>Entradas</option>
                  <option value={TIPOS_MOVIMENTACAO.SAIDA}>Saídas</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="filtroDataInicio" className="block text-sm font-medium text-neutral-700">
                  Data Inicial
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    id="filtroDataInicio"
                    value={filtroDataInicio}
                    onChange={(e) => {
                      setFiltroDataInicio(e.target.value);
                      setPaginaAtual(1);
                    }}
                    className="block w-full rounded-md border-neutral-300 pl-10 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="filtroDataFim" className="block text-sm font-medium text-neutral-700">
                  Data Final
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    id="filtroDataFim"
                    value={filtroDataFim}
                    onChange={(e) => {
                      setFiltroDataFim(e.target.value);
                      setPaginaAtual(1);
                    }}
                    className="block w-full rounded-md border-neutral-300 pl-10 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={limparFiltros}
                  className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Conteúdo principal */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          {/* Mensagem de carregamento */}
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <p className="mt-2 text-neutral-500">Carregando movimentações...</p>
            </div>
          ) : erro ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-red-500">{erro}</p>
              <button
                onClick={buscarMovimentacoes}
                className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : movimentacoesFiltradas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500">Nenhuma movimentação encontrada.</p>
              {(termoBusca || filtroTipo !== TIPOS_MOVIMENTACAO.TODOS || filtroDataInicio || filtroDataFim) && (
                <button
                  onClick={limparFiltros}
                  className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Produto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Quantidade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Motivo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Venda
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Responsável
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Data/Hora
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {movimentacoesPaginadas.map((movimentacao) => (
                      <tr key={movimentacao.id} className="hover:bg-neutral-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-neutral-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-neutral-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {movimentacao.book?.title || "Livro não encontrado"}
                              </div>
                              <div className="text-sm text-neutral-500">
                                ISBN: {movimentacao.book?.isbn || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            movimentacao.type === 'entrada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            <span className="mr-1 mt-0.5">
                              {movimentacao.type === 'entrada' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            </span>
                            {movimentacao.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {movimentacao.quantity} {movimentacao.quantity === 1 ? 'unidade' : 'unidades'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {getNomeMotivo(movimentacao.type, movimentacao.reason)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {movimentacao.sale_id ? (
                            <Link 
                              href={`/dashboard/vendas/${movimentacao.sale_id}`}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-800 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart">
                                <circle cx="8" cy="21" r="1"/>
                                <circle cx="19" cy="21" r="1"/>
                                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                              </svg>
                              Ver venda #{movimentacao.sale_id.substring(0, 8)}
                            </Link>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">
                          {movimentacao.responsible}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                          {formatarDataHora(movimentacao.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
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
                        {Math.min(indiceFinal, movimentacoesFiltradas.length)}
                      </span>{' '}
                      de{' '}
                      <span className="font-medium">{movimentacoesFiltradas.length}</span>{' '}
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
                      
                      {/* Links de páginas */}
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
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Constantes para usar nas filtragens
const TIPOS_MOVIMENTACAO = {
  TODOS: "todos",
  ENTRADA: "entrada",
  SAIDA: "saida",
};

const MOTIVOS_MOVIMENTACAO = {
  entrada: [
    { id: "compra", nome: "Compra de Fornecedor" },
    { id: "devolucao", nome: "Devolução de Cliente" },
    { id: "ajuste", nome: "Ajuste de Inventário" },
    { id: "outro", nome: "Outro" }
  ],
  saida: [
    { id: "venda", nome: "Venda" },
    { id: "perda", nome: "Perda ou Avaria" },
    { id: "doacao", nome: "Doação" },
    { id: "ajuste", nome: "Ajuste de Inventário" },
    { id: "outro", nome: "Outro" }
  ]
};

// Função para obter o nome do motivo a partir do id
const getNomeMotivo = (tipo: string, motivoId: string): string => {
  const lista = tipo === "entrada" ? MOTIVOS_MOVIMENTACAO.entrada : MOTIVOS_MOVIMENTACAO.saida;
  const motivo = lista.find(m => m.id === motivoId);
  return motivo ? motivo.nome : motivoId;
};

export default function HistoricoMovimentacoesPage() {
  return (
    <DashboardLayout title="Histórico de Movimentações">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="mt-4 text-neutral-600">Carregando histórico de movimentações...</p>
        </div>
      }>
        <HistoricoMovimentacoesContent />
      </Suspense>
    </DashboardLayout>
  );
} 