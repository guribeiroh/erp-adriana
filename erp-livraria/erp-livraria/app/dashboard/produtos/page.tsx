"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { Package, Plus, Search, Filter, ArrowUpDown, Edit, Trash2, Eye, AlertTriangle, RefreshCw, Image, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Número de itens por página
const ITENS_POR_PAGINA = 20;

// Tipo para os produtos
interface Produto {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: string;
  subcategory: string | null;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  supplier_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
  language: string | null;
  pages: number | null;
  publication_year: number | null;
  description: string | null;
  // Campos convertidos para UI
  nome?: string;
  editora?: string;
  categoria?: string;
  preco?: number;
  estoque?: number;
  codigo?: string;
}

export default function ProdutosPage() {
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [produtosPaginados, setProdutosPaginados] = useState<Produto[]>([]);
  
  // Estado para o modal de visualização da imagem
  const [imagemModal, setImagemModal] = useState<{url: string, titulo: string} | null>(null);
  
  // Estado para o diálogo de confirmação de exclusão
  const [exclusaoModal, setExclusaoModal] = useState<{id: string, nome: string} | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Função para carregar produtos do Supabase
  const carregarProdutos = async () => {
    setCarregando(true);
    setErro(null);
    
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não disponível");
      }
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        throw new Error(`Erro ao carregar produtos: ${error.message}`);
      }
      
      // Converter os dados para o formato usado na UI
      const produtosConvertidos = data.map((item) => ({
        ...item,
        nome: item.title,
        editora: item.publisher,
        categoria: item.category,
        preco: item.selling_price,
        estoque: item.quantity,
        codigo: item.isbn ? `ISBN-${item.isbn.substring(item.isbn.length - 6)}` : `LIV-${item.id.substring(0, 6)}`
      }));
      
      setProdutos(produtosConvertidos);
      setProdutosFiltrados(produtosConvertidos);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao carregar produtos');
    } finally {
      setCarregando(false);
    }
  };
  
  // Carregar produtos ao montar o componente
  useEffect(() => {
    carregarProdutos();
  }, []);

  // Função para filtrar produtos com base na busca
  const filtrarProdutos = (termo: string) => {
    setBusca(termo);
    if (!termo.trim()) {
      setProdutosFiltrados(produtos);
    } else {
      const termoBusca = termo.toLowerCase();
      const resultados = produtos.filter(produto =>
        produto.nome?.toLowerCase().includes(termoBusca) ||
        produto.codigo?.toLowerCase().includes(termoBusca) ||
        produto.categoria?.toLowerCase().includes(termoBusca) ||
        produto.author?.toLowerCase().includes(termoBusca)
      );
      
      setProdutosFiltrados(resultados);
    }
    
    // Resetar para a primeira página sempre que a busca mudar
    setPaginaAtual(1);
  };
  
  // Efeito para calcular o total de páginas
  useEffect(() => {
    setTotalPaginas(Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA) || 1);
  }, [produtosFiltrados]);
  
  // Efeito para aplicar paginação
  useEffect(() => {
    aplicarPaginacao();
  }, [produtosFiltrados, paginaAtual]);
  
  // Função para aplicar paginação
  const aplicarPaginacao = () => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    
    setProdutosPaginados(produtosFiltrados.slice(inicio, fim));
  };
  
  // Função para mudar de página
  const mudarPagina = (novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Função para abrir o modal de imagem
  const abrirModalImagem = (url: string, titulo: string) => {
    setImagemModal({ url, titulo });
    // Impedir rolagem da página enquanto o modal estiver aberto
    document.body.style.overflow = 'hidden';
  };
  
  // Função para fechar o modal de imagem
  const fecharModalImagem = () => {
    setImagemModal(null);
    // Restaurar rolagem da página
    document.body.style.overflow = 'auto';
  };

  // Função para abrir o modal de confirmação de exclusão
  const confirmarExclusao = (id: string, nome: string) => {
    setExclusaoModal({ id, nome });
  };
  
  // Função para cancelar a exclusão
  const cancelarExclusao = () => {
    setExclusaoModal(null);
  };
  
  // Função para excluir o produto
  const excluirProduto = async () => {
    if (!exclusaoModal) return;
    
    try {
      setExcluindo(true);
      
      if (!supabase) {
        throw new Error("Cliente Supabase não disponível");
      }
      
      // Excluir o produto
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', exclusaoModal.id);
      
      if (error) {
        throw new Error(`Erro ao excluir produto: ${error.message}`);
      }
      
      // Atualizar a lista de produtos
      setProdutos(prev => prev.filter(p => p.id !== exclusaoModal.id));
      setProdutosFiltrados(prev => prev.filter(p => p.id !== exclusaoModal.id));
      
      // Fechar o modal
      setExclusaoModal(null);
      
      // Mostrar notificação de sucesso (opcional)
      alert("Produto excluído com sucesso!");
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert(error instanceof Error ? error.message : 'Erro ao excluir produto');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <DashboardLayout title="Gestão de Produtos">
      <div className="space-y-6">
        {/* Cabeçalho e ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Produtos</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Gerencie o catálogo de produtos da livraria
            </p>
          </div>
          
          <Link
            href="/dashboard/produtos/novo"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Link>
        </div>
        
        {/* Filtros e busca */}
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => filtrarProdutos(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <Filter className="h-4 w-4" />
              Filtrar
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <ArrowUpDown className="h-4 w-4" />
              Ordenar
            </button>
            <button 
              onClick={carregarProdutos}
              className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>
        
        {/* Estado de carregamento */}
        {carregando && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-neutral-200 border-t-primary-600 h-8 w-8 mb-4"></div>
            <p className="text-neutral-600">Carregando produtos...</p>
          </div>
        )}
        
        {/* Mensagem de erro */}
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Erro ao carregar produtos</h3>
              <p className="text-sm text-red-700">{erro}</p>
              <button 
                onClick={carregarProdutos}
                className="mt-2 text-xs font-medium text-red-800 hover:text-red-900 underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
        
        {/* Tabela de produtos */}
        {!carregando && !erro && produtosFiltrados.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Capa</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Título</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Autor</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Preço</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Estoque</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {produtosPaginados.map((produto) => (
                    <tr key={produto.id} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                        <Link href={`/dashboard/produtos/${produto.id}`}>
                          <div 
                            className="h-12 w-9 overflow-hidden rounded bg-neutral-100 flex items-center justify-center cursor-pointer transition-all hover:shadow-md"
                            onClick={(e) => {
                              e.preventDefault();
                              if (produto.image_url) {
                                abrirModalImagem(produto.image_url, produto.nome || '');
                              }
                            }}
                          >
                            {produto.image_url ? (
                              <img 
                                src={produto.image_url} 
                                alt={produto.nome} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Image className="h-4 w-4 text-neutral-400" />
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                        {produto.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        <Link href={`/dashboard/produtos/${produto.id}`} className="hover:text-primary-600">
                          <div className="font-medium">{produto.nome}</div>
                          <div className="text-xs text-neutral-500">{produto.editora}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">{produto.author}</td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                          {produto.categoria}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                        R$ {produto.preco?.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          produto.estoque && produto.minimum_stock ? (
                            produto.estoque > (produto.minimum_stock * 2) 
                              ? 'bg-green-50 text-green-700' 
                              : produto.estoque > produto.minimum_stock
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                          ) : 'bg-neutral-50 text-neutral-700'
                        }`}>
                          {produto.estoque} unid.
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-900">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/dashboard/produtos/${produto.id}`}
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/dashboard/produtos/${produto.id}/editar`}
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-amber-600"
                            title="Editar produto"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => confirmarExclusao(produto.id, produto.nome || produto.title)}
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
                            title="Excluir produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3">
              <div className="flex-1 flex sm:hidden justify-between">
                <button
                  onClick={() => mudarPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => mudarPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-neutral-700">
                    Mostrando <span className="font-medium">{(paginaAtual - 1) * ITENS_POR_PAGINA + 1}</span> a{" "}
                    <span className="font-medium">
                      {Math.min(paginaAtual * ITENS_POR_PAGINA, produtosFiltrados.length)}
                    </span>{" "}
                    de <span className="font-medium">{produtosFiltrados.length}</span> resultados
                  </p>
                </div>
                {totalPaginas > 1 && (
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                      <button
                        onClick={() => mudarPagina(paginaAtual - 1)}
                        disabled={paginaAtual === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {/* Lógica de renderização dos números de página */}
                      {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                        let pageNumber;
                        
                        // Lógica para mostrar as páginas certas quando há muitas
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
                            key={i}
                            onClick={() => mudarPagina(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              paginaAtual === pageNumber
                                ? 'bg-primary-50 text-primary-600 border-primary-500'
                                : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => mudarPagina(paginaAtual + 1)}
                        disabled={paginaAtual === totalPaginas}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Próxima</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Mensagem de nenhum produto encontrado */}
        {!carregando && !erro && produtosFiltrados.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-neutral-600 mb-4">
              {busca ? 
                `Não encontramos produtos correspondentes à sua busca "${busca}".` : 
                "Parece que você ainda não cadastrou nenhum produto."}
            </p>
            {busca ? (
              <button
                onClick={() => setBusca("")}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Limpar busca
              </button>
            ) : (
              <Link
                href="/dashboard/produtos/novo"
                className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Produto
              </Link>
            )}
          </div>
        )}
        
        {/* Modal para visualização da imagem */}
        {imagemModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            onClick={fecharModalImagem}
          >
            <div 
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 p-4">
                <h3 className="text-lg font-medium text-neutral-900">{imagemModal.titulo}</h3>
                <button 
                  onClick={fecharModalImagem}
                  className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <img 
                  src={imagemModal.url} 
                  alt={imagemModal.titulo} 
                  className="max-h-[70vh] rounded border border-neutral-200 object-contain shadow"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de confirmação de exclusão */}
        {exclusaoModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            onClick={cancelarExclusao}
          >
            <div 
              className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-50 p-4 text-red-800">
                <h3 className="text-lg font-medium">Confirmar exclusão</h3>
              </div>
              <div className="p-6">
                <p className="mb-4 text-neutral-700">
                  Tem certeza que deseja excluir o produto <strong>{exclusaoModal.nome}</strong>?
                </p>
                <p className="mb-4 text-sm text-neutral-500">
                  Esta ação não pode ser desfeita e todos os dados relacionados a este produto serão permanentemente removidos.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={cancelarExclusao}
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    disabled={excluindo}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={excluirProduto}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                    disabled={excluindo}
                  >
                    {excluindo ? (
                      <>
                        <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Excluindo...
                      </>
                    ) : (
                      'Excluir'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 