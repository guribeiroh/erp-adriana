"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  History, 
  RefreshCw, 
  Truck,
  Loader2
} from "lucide-react";
import { bookService, Book } from "@/lib/services/bookService";
import { stockService, StockMovementWithBook } from "@/lib/services/stockService";
import { useRouter } from "next/navigation";
import { formatBrazilianDate } from '@/lib/utils/date';

// Interface para livro com status de estoque calculado
interface BookWithStockStatus extends Book {
  status: 'normal' | 'baixo' | 'critico';
  ultimaEntrada?: string;
  ultimaSaida?: string;
}

export default function EstoquePage() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos, baixo, critico, sem-estoque
  const [ordenacao, setOrdenacao] = useState("title-asc"); // title-asc, title-desc, quantity-asc, quantity-desc
  
  // Estado para livros
  const [livros, setLivros] = useState<BookWithStockStatus[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<BookWithStockStatus[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estado para movimentações de estoque
  const [movimentacoes, setMovimentacoes] = useState<StockMovementWithBook[]>([]);
  
  const router = useRouter();
  
  // Buscar livros e suas movimentações
  useEffect(() => {
    const fetchData = async () => {
      setCarregando(true);
      setErro(null);
      
      try {
        // Buscar todos os livros
        const booksResponse = await bookService.getAll();
        
        if (booksResponse.status === 'error' || !booksResponse.data) {
          throw new Error(booksResponse.error || 'Erro ao buscar livros');
        }
        
        // Buscar movimentações de estoque
        const movementsResponse = await stockService.getMovementsWithBooks();
        
        if (movementsResponse.status === 'success' && movementsResponse.data) {
          setMovimentacoes(movementsResponse.data);
        }
        
        // Calcular status e últimas movimentações para cada livro
        const livrosComStatus: BookWithStockStatus[] = booksResponse.data.map(livro => {
          const movimentacoesDoLivro = movementsResponse.data?.filter(
            m => m.book_id === livro.id
          ) || [];
          
          // Encontrar última entrada e saída, se existirem
          const ultimaEntrada = movimentacoesDoLivro
            .filter(m => m.type === 'entrada')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
          const ultimaSaida = movimentacoesDoLivro
            .filter(m => m.type === 'saida')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          // Determinar status do estoque
          let status: 'normal' | 'baixo' | 'critico' = 'normal';
          
          if (livro.quantity === 0) {
            status = 'critico';
          } else if (livro.quantity <= livro.minimum_stock) {
            status = 'baixo';
          }
          
          return {
            ...livro,
            status,
            ultimaEntrada: ultimaEntrada?.created_at,
            ultimaSaida: ultimaSaida?.created_at
          };
        });
        
        setLivros(livrosComStatus);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao buscar dados');
      } finally {
        setCarregando(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Efeito para filtrar e ordenar produtos
  useEffect(() => {
    let resultado = [...livros];
    
    // Aplicar filtro de status
    if (filtro === "baixo") {
      resultado = resultado.filter(livro => livro.status === "baixo");
    } else if (filtro === "critico") {
      resultado = resultado.filter(livro => livro.status === "critico");
    } else if (filtro === "sem-estoque") {
      resultado = resultado.filter(livro => livro.quantity === 0);
    }
    
    // Aplicar filtro de busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(livro => 
        livro.title.toLowerCase().includes(termoBusca) || 
        livro.isbn.toLowerCase().includes(termoBusca) ||
        livro.author.toLowerCase().includes(termoBusca)
      );
    }
    
    // Aplicar ordenação
    if (ordenacao === "title-asc") {
      resultado.sort((a, b) => a.title.localeCompare(b.title));
    } else if (ordenacao === "title-desc") {
      resultado.sort((a, b) => b.title.localeCompare(a.title));
    } else if (ordenacao === "quantity-asc") {
      resultado.sort((a, b) => a.quantity - b.quantity);
    } else if (ordenacao === "quantity-desc") {
      resultado.sort((a, b) => b.quantity - a.quantity);
    }
    
    setProdutosFiltrados(resultado);
  }, [busca, filtro, ordenacao, livros]);

  // Handler para alterar ordenação
  const handleOrdenacaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrdenacao(e.target.value);
  };

  // Formatador de data
  const formatarData = (dataString?: string) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  // Calcular totais para o resumo
  const totalProdutos = livros.length;
  const totalUnidades = livros.reduce((acc, livro) => acc + livro.quantity, 0);
  const totalEstoqueBaixo = livros.filter(livro => livro.status === "baixo").length;
  const totalSemEstoque = livros.filter(livro => livro.quantity === 0).length;

  // Calcular valor total do estoque (preço x quantidade)
  const valorTotalEstoque = livros.reduce(
    (acc, livro) => acc + (livro.selling_price * livro.quantity), 
    0
  );

  return (
    <DashboardLayout title="Gestão de Estoque">
      <div className="space-y-6">
        {/* Cabeçalho e ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Controle de Estoque</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Gerencie o estoque de produtos da livraria
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/estoque/movimentacao"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Nova Movimentação
            </Link>
            <Link
              href="/dashboard/estoque/inventario"
              className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Ajuste de Inventário
            </Link>
            <Link
              href="/dashboard/estoque/historico"
              className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <History className="h-4 w-4" />
              Histórico
            </Link>
          </div>
        </div>
        
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Total de Produtos</h3>
            <p className="text-2xl font-semibold text-neutral-900">{totalProdutos}</p>
            <p className="mt-2 text-sm text-neutral-600">
              <span className="font-medium">{totalUnidades}</span> unidades em estoque
            </p>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Valor em Estoque</h3>
            <p className="text-2xl font-semibold text-neutral-900">
              R$ {valorTotalEstoque.toFixed(2).replace('.', ',')}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Preço de venda dos produtos
            </p>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Estoque Baixo</h3>
            <p className="text-2xl font-semibold text-amber-600">{totalEstoqueBaixo}</p>
            <p className="mt-2 text-sm text-neutral-600">
              Produtos abaixo do mínimo
            </p>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Sem Estoque</h3>
            <p className="text-2xl font-semibold text-red-600">{totalSemEstoque}</p>
            <p className="mt-2 text-sm text-neutral-600">
              Produtos indisponíveis
            </p>
          </div>
        </div>
        
        {/* Filtros e busca */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-2/5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar por título, autor ou ISBN..."
                  className="block w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row md:gap-2">
              <div className="flex items-center">
                <label htmlFor="filtro" className="mr-2 text-sm text-neutral-600">Status:</label>
                <select
                  id="filtro"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-8 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="todos">Todos</option>
                  <option value="baixo">Estoque Baixo</option>
                  <option value="critico">Estoque Crítico</option>
                  <option value="sem-estoque">Sem Estoque</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label htmlFor="ordenacao" className="mr-2 text-sm text-neutral-600">Ordenar por:</label>
                <select
                  id="ordenacao"
                  value={ordenacao}
                  onChange={handleOrdenacaoChange}
                  className="rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-8 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="title-asc">Título (A-Z)</option>
                  <option value="title-desc">Título (Z-A)</option>
                  <option value="quantity-asc">Estoque (Menor)</option>
                  <option value="quantity-desc">Estoque (Maior)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mensagem de carregamento */}
        {carregando && (
          <div className="flex h-32 items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-500" />
            <p className="text-neutral-600">Carregando dados do estoque...</p>
          </div>
        )}
        
        {/* Mensagem de erro */}
        {erro && (
          <div className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <AlertTriangle className="mr-3 h-5 w-5 text-red-500" />
            <p>
              {erro}. Por favor, tente novamente mais tarde ou contate o suporte.
            </p>
          </div>
        )}
        
        {/* Tabela de produtos em estoque */}
        {!carregando && !erro && (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            {produtosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Título</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">ISBN</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Categoria</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Preço</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Estoque</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Mínimo</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Últ. Entrada</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Últ. Saída</th>
                      <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {produtosFiltrados.map((produto) => (
                      <tr 
                        key={produto.id} 
                        className="hover:bg-neutral-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/estoque/historico?produto=${produto.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{produto.title}</div>
                          <div className="text-sm text-neutral-500">{produto.author}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{produto.isbn}</td>
                        <td className="px-4 py-3 text-neutral-700">{produto.category}</td>
                        <td className="px-4 py-3 text-neutral-700">
                          R$ {produto.selling_price.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {produto.quantity}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {produto.minimum_stock}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {formatarData(produto.ultimaEntrada)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {formatarData(produto.ultimaSaida)}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${produto.status === 'normal' 
                              ? 'bg-green-100 text-green-800' 
                              : produto.status === 'baixo' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {produto.status === 'normal' 
                              ? 'Normal' 
                              : produto.status === 'baixo' 
                                ? 'Baixo' 
                                : 'Crítico'
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-neutral-500">
                <Package className="mr-3 h-5 w-5" />
                <p>Nenhum produto encontrado com os filtros aplicados.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 