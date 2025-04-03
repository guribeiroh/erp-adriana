"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Package, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Truck,
  BookOpen,
  DollarSign,
  Share2,
  Calendar,
  Tag,
  Hash,
  Languages,
  PenTool,
  Building,
  User,
  RefreshCw,
  History
} from "lucide-react";
import { supabase, getAuthStatus } from "@/lib/supabase/client";

// Interface para o produto
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
  codigo?: string;
  editora?: string;
  categoria?: string;
  preco?: number;
  precoCusto?: number;
  estoque?: number;
  estoqueMinimo?: number;
  imagem?: string;
  autor?: string;
  idioma?: string;
  paginas?: number;
  ano?: number;
  descricao?: string;
  ultimaVenda?: string | null;
}

// Constante para o nome da chave de armazenamento no localStorage
const STORAGE_KEY_PREFIX = 'produto_page_';
const LAST_VISITED_ID_KEY = 'ultimo_produto_id_visitado';
const PAGE_VISITED_KEY = 'pagina_detalhe_produto_visitada';

// Função para formatar valores monetários
const formatarMoeda = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined) return "0,00";
  return valor.toFixed(2).replace('.', ',');
};

// Função para verificar autenticação e reconectar ao Supabase se necessário
const verificarAutenticacao = async () => {
  console.log("Verificando estado de autenticação...");
  try {
    if (!supabase) {
      console.error("Cliente Supabase não está disponível");
      return false;
    }
    
    // Obter status da autenticação
    const authStatus = await getAuthStatus();
    
    if (authStatus.error) {
      console.error("Erro ao verificar autenticação:", authStatus.error);
      return false;
    }
    
    if (!authStatus.session) {
      console.log("Não há sessão ativa, tentando reconectar...");
      // Informamos o usuário que pode haver problemas de conexão
      return false;
    }
    
    console.log("Autenticação verificada com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return false;
  }
};

export default function DetalheProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const produtoIdRef = useRef<string>('');
  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativaReload, setTentativaReload] = useState(0);
  const componentMounted = useRef(true);

  // Função para navegar para o histórico de movimentações do produto
  const verMovimentacoesEstoque = () => {
    router.push(`/dashboard/estoque/historico?produto=${params.id}`);
  };

  // Verificar e salvar o estado de que esta página foi visitada
  useEffect(() => {
    try {
      localStorage.setItem(PAGE_VISITED_KEY, 'true');
      
      // Salvar o ID do produto visitado para referência futura
      const id = params.id as string;
      if (id) {
        localStorage.setItem(LAST_VISITED_ID_KEY, id);
        produtoIdRef.current = id;
      }
    } catch (e) {
      console.error('Erro ao salvar estado de visita no localStorage:', e);
    }

    return () => {
      componentMounted.current = false;
    };
  }, [params.id]);

  // Função para salvar o produto no localStorage
  const saveProdutoToStorage = useCallback((id: string, data: Produto) => {
    try {
      // Salvar no localStorage para persistência entre sessões/abas
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar produto no localStorage:', e);
    }
  }, []);

  // Função para recuperar o produto do localStorage
  const getProdutoFromStorage = useCallback((id: string): Produto | null => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erro ao recuperar produto do localStorage:', e);
      return null;
    }
  }, []);

  // Função para carregar o produto do Supabase
  const carregarProduto = useCallback(async (id: string, forceRefresh: boolean = false) => {
    if (!id || !componentMounted.current) return;
    
    // Criar um timeout para garantir que não ficaremos presos em carregamento indefinidamente
    const timeoutId = setTimeout(() => {
      if (componentMounted.current && carregando) {
        console.error("Timeout ao carregar produto - ID:", id);
        setErro("Tempo limite excedido ao carregar o produto. Por favor, tente novamente.");
        setCarregando(false);
      }
    }, 10000); // 10 segundos de timeout
    
    try {
      if (!forceRefresh) {
        // Tentar obter do localStorage primeiro
        const cachedProduto = getProdutoFromStorage(id);
        if (cachedProduto) {
          setProduto(cachedProduto);
          setCarregando(false);
          clearTimeout(timeoutId); // Limpar o timeout já que terminamos
          return;
        }
      }
      
      setCarregando(true);
      setErro(null);
      
      // Verificar se o Supabase está disponível
      if (!supabase) {
        console.warn("Cliente Supabase não disponível, usando dados simulados");
        
        // Extrair o identificador do produto da URL para usar como base para os dados simulados
        const idShort = id.substring(0, 8);
        
        // Criar um produto simulado para fins de demonstração
        const produtoSimulado: Produto = {
          id: id,
          title: `Livro Demonstrativo (ID: ${idShort})`,
          author: "Autor Exemplo",
          isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          publisher: "Editora Simulada",
          category: "Ficção",
          subcategory: "Romance",
          purchase_price: 25.50,
          selling_price: 45.90,
          quantity: 10,
          minimum_stock: 5,
          supplier_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          image_url: null,
          language: "Português",
          pages: 250,
          publication_year: 2023,
          description: "Este é um livro demonstrativo gerado automaticamente porque o Supabase não está disponível no momento.",
          nome: `Livro Demonstrativo (ID: ${idShort})`,
          codigo: `LIV-${idShort}`,
          editora: "Editora Simulada",
          categoria: "Ficção",
          preco: 45.90,
          precoCusto: 25.50,
          estoque: 10,
          estoqueMinimo: 5,
          autor: "Autor Exemplo",
          idioma: "Português",
          paginas: 250,
          ano: 2023,
          descricao: "Este é um livro demonstrativo gerado automaticamente porque o Supabase não está disponível no momento.",
          ultimaVenda: null
        };
        
        // Salvar no estado e localStorage
        setProduto(produtoSimulado);
        saveProdutoToStorage(id, produtoSimulado);
        
        // Adicionar atraso simulado de 1s para parecer mais real
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clearTimeout(timeoutId);
        setCarregando(false);
        return;
      }
      
      // Debug para verificar o estado da conexão com o Supabase
      console.log("DEBUG - Estado do Supabase antes da consulta:", {
        supabaseDisponivel: !!supabase,
        id: id
      });
      
      // Consultar o produto no Supabase
      let resultadoConsulta = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();
      
      let data = resultadoConsulta.data;
      let error = resultadoConsulta.error;
      
      if (error) {
        console.error("Erro Supabase:", error);
        
        // Tentar verificar e reconectar a autenticação
        const autenticacaoOk = await verificarAutenticacao();
        
        if (autenticacaoOk) {
          // Se conseguiu reconectar, tenta novamente a consulta
          console.log("Tentando consulta novamente após verificar autenticação...");
          const novaConsulta = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();
            
          if (!novaConsulta.error && novaConsulta.data) {
            console.log("Segunda tentativa bem-sucedida!");
            // Continuar com os dados da nova consulta
            data = novaConsulta.data;
            error = null;
          } else {
            // Falhou mesmo após reconexão
            throw new Error(`Erro ao carregar produto: ${error.message}`);
          }
        } else {
          throw new Error(`Erro ao carregar produto: ${error.message}`);
        }
      }
      
      if (!data) {
        throw new Error("Produto não encontrado");
      }
      
      // Consultar últimas vendas deste produto (a implementar no futuro)
      // Por enquanto, estamos definindo como null
      const ultimaVenda = null;
      
      // Converter os dados para o formato usado na UI
      const produtoConvertido: Produto = {
        ...data,
        nome: data.title,
        codigo: data.isbn ? `ISBN-${data.isbn.substring(data.isbn.length - 6)}` : `LIV-${data.id.substring(0, 6)}`,
        editora: data.publisher,
        categoria: data.category,
        preco: typeof data.selling_price === 'number' ? data.selling_price : 0,
        precoCusto: typeof data.purchase_price === 'number' ? data.purchase_price : 0,
        estoque: data.quantity,
        estoqueMinimo: data.minimum_stock,
        imagem: data.image_url,
        autor: data.author,
        idioma: data.language,
        paginas: data.pages,
        ano: data.publication_year,
        descricao: data.description,
        ultimaVenda: ultimaVenda
      };
      
      // Debug para verificar os valores dos preços
      console.log("DEBUG - Dados do Produto:", {
        id: data.id,
        selling_price: data.selling_price,
        purchase_price: data.purchase_price,
        preco_convertido: produtoConvertido.preco,
        precoCusto_convertido: produtoConvertido.precoCusto
      });
      
      if (componentMounted.current) {
        // Salvar no estado e no localStorage para persistência
        setProduto(produtoConvertido);
        saveProdutoToStorage(id, produtoConvertido);
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      if (componentMounted.current) {
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      }
    } finally {
      clearTimeout(timeoutId); // Limpar o timeout
      if (componentMounted.current) {
        setCarregando(false);
      }
    }
  }, [getProdutoFromStorage, saveProdutoToStorage, carregando]);

  // Lidar com mudanças na URL e carregamento inicial
  useEffect(() => {
    const id = params.id as string;
    if (id) {
      produtoIdRef.current = id;
      carregarProduto(id);
    }
  }, [params.id, carregarProduto]);

  // Configurar evento de visibilidade para recarregar dados quando a página ficar visível
  useEffect(() => {
    const onVisibilityChange = () => {
      // Só recarregar se a página estiver visível (não estiver em outra aba)
      if (document.visibilityState === 'visible') {
        // Se o lastVisitedId armazenado for o mesmo que o ID atual, recarregamos os dados
        const lastVisitedId = localStorage.getItem(LAST_VISITED_ID_KEY);
        const currentId = produtoIdRef.current;
        
        if (lastVisitedId && currentId && lastVisitedId === currentId) {
          carregarProduto(currentId, true);
        }
      }
    };

    // Lidar com retorno da página através de eventos do navegador
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      
      // Verificamos se esta página foi visitada antes e o ID ainda é válido
      const wasVisited = localStorage.getItem(PAGE_VISITED_KEY) === 'true';
      const lastId = localStorage.getItem(LAST_VISITED_ID_KEY);
      const currentId = produtoIdRef.current || (params.id as string);
      
      if (wasVisited && lastId && lastId === currentId) {
        carregarProduto(currentId, true);
        setTentativaReload(prev => prev + 1);
      }
    };

    // Eventos para detectar quando o usuário volta para a página
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [carregarProduto, params.id]);

  // Funções adicionais para refresh manual
  const recarregarDados = () => {
    const id = produtoIdRef.current || (params.id as string);
    if (id) {
      carregarProduto(id, true);
      setTentativaReload(prev => prev + 1);
    }
  };

  const handleExcluir = async () => {
    if (!produto) return;
    
    const confirmar = window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`);
    if (confirmar) {
      try {
        if (!supabase) {
          throw new Error("Cliente Supabase não disponível");
        }
        
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', produto.id);
        
        if (error) {
          throw new Error(`Erro ao excluir produto: ${error.message}`);
        }
        
      alert("Produto excluído com sucesso!");
      router.push("/dashboard/produtos");
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        alert(`Erro ao excluir produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }
  };

  if (carregando && !produto) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
            <p className="text-neutral-600">Carregando informações do produto...</p>
            <button
              onClick={recarregarDados}
              className="mt-6 flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Forçar recarga
            </button>
            
            {/* Botão de debug - apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  // Obter informações de debug
                  const statusAuth = await getAuthStatus();
                  alert(JSON.stringify({
                    supabaseDisponivel: !!supabase,
                    sessao: !!statusAuth.session,
                    usuario: statusAuth.user ? statusAuth.user.email : null,
                    erroAuth: statusAuth.error,
                    params: params
                  }, null, 2));
                }}
                className="mt-2 text-xs text-neutral-500 underline"
              >
                Debug conexão
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (erro && !produto) {
    return (
      <DashboardLayout title="Produto não encontrado">
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Produto não encontrado</h2>
          <p className="mb-6 text-neutral-600">{erro || "O produto solicitado não foi encontrado ou foi removido."}</p>
          <div className="flex gap-3">
            <button
              onClick={recarregarDados}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
            <Link
              href="/dashboard/produtos"
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Produtos
            </Link>
          </div>
          
          {/* Botão de debug - apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                // Obter informações de debug
                const statusAuth = await getAuthStatus();
                alert(JSON.stringify({
                  supabaseDisponivel: !!supabase,
                  sessao: !!statusAuth.session,
                  usuario: statusAuth.user ? statusAuth.user.email : null,
                  erroAuth: statusAuth.error,
                  erroOriginal: erro,
                  params: params
                }, null, 2));
              }}
              className="mt-4 text-xs text-neutral-500 underline"
            >
              Debug conexão
            </button>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (!produto) {
    return (
      <DashboardLayout title="Produto não localizado">
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Produto não localizado</h2>
          <p className="mb-6 text-neutral-600">Não foi possível encontrar as informações deste produto.</p>
          <div className="flex gap-3">
            <button
              onClick={recarregarDados}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente ({tentativaReload})
            </button>
          <Link
            href="/dashboard/produtos"
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Produtos
          </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={produto.nome || ""}>
      <div className="space-y-6">
        {/* Cabeçalho com ações */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/produtos" 
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">{produto.nome}</h1>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
              {produto.categoria}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/produtos/${produtoIdRef.current}/editar`}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <Edit className="h-4 w-4" />
              Editar Produto
            </Link>
            <button
              onClick={handleExcluir}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
            <button
              onClick={verMovimentacoesEstoque}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <History className="h-4 w-4" />
              Movimentações
            </button>
          </div>
        </div>
        
        {/* Detalhes do produto */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna da esquerda - Imagem e informações rápidas */}
          <div className="space-y-6">
            {/* Imagem do produto */}
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-4">
              <div className="aspect-[3/4] w-full overflow-hidden rounded bg-neutral-100">
                {produto.imagem ? (
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                    <Package className="h-16 w-16" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Informações de estoque */}
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h2 className="mb-4 font-medium text-neutral-900">Estoque</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Quantidade atual:</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    produto.estoque && produto.estoqueMinimo ? (
                    produto.estoque > produto.estoqueMinimo * 2 
                      ? 'bg-green-50 text-green-700' 
                      : produto.estoque > produto.estoqueMinimo
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    ) : 'bg-neutral-50 text-neutral-700'
                  }`}>
                    {produto.estoque} unidades
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Estoque mínimo:</span>
                  <span className="text-sm text-neutral-900">{produto.estoqueMinimo} unidades</span>
                </div>
                
                {produto.estoque !== undefined && produto.estoqueMinimo !== undefined && 
                 produto.estoque <= produto.estoqueMinimo && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">Estoque abaixo do mínimo!</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Última venda:</span>
                  <span className="text-sm text-neutral-900">
                    {produto.ultimaVenda ? new Date(produto.ultimaVenda).toLocaleDateString('pt-BR') : "Sem registro"}
                  </span>
                </div>
                
                <div className="pt-3">
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                    <Truck className="h-4 w-4" />
                    Gerenciar Estoque
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Coluna central - Informações principais */}
          <div className="col-span-2 space-y-6">
            {/* Informações básicas */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-neutral-900">
                <BookOpen className="h-5 w-5 text-primary-600" />
                Informações do Livro
              </h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <Hash className="h-4 w-4 text-neutral-500" />
                    Código
                  </h3>
                  <p className="text-neutral-900">{produto.codigo}</p>
                </div>
                
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <Tag className="h-4 w-4 text-neutral-500" />
                    ISBN
                  </h3>
                  <p className="text-neutral-900">{produto.isbn || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <PenTool className="h-4 w-4 text-neutral-500" />
                    Autor
                  </h3>
                  <p className="text-neutral-900">{produto.autor}</p>
                </div>
                
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <Building className="h-4 w-4 text-neutral-500" />
                    Editora
                  </h3>
                  <p className="text-neutral-900">{produto.editora}</p>
                </div>
                
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <Calendar className="h-4 w-4 text-neutral-500" />
                    Ano de Publicação
                  </h3>
                  <p className="text-neutral-900">{produto.ano || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <Languages className="h-4 w-4 text-neutral-500" />
                    Idioma
                  </h3>
                  <p className="text-neutral-900">{produto.idioma || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                    <BookOpen className="h-4 w-4 text-neutral-500" />
                    Número de Páginas
                  </h3>
                  <p className="text-neutral-900">{produto.paginas || "Não informado"}</p>
                </div>
              </div>
              
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <h3 className="mb-2 text-sm font-medium text-neutral-700">Descrição</h3>
                <p className="whitespace-pre-line text-sm text-neutral-600">
                  {produto.descricao || "Sem descrição disponível."}
                </p>
              </div>
            </div>
            
            {/* Informações de preço */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-neutral-900">
                <DollarSign className="h-5 w-5 text-primary-600" />
                Informações de Preço
              </h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <h3 className="text-sm font-medium text-neutral-700">Preço de Custo</h3>
                  <p className="text-xl font-medium text-neutral-900">
                    R$ {formatarMoeda(produto.precoCusto)}
                  </p>
                </div>
                
                <div className="rounded-lg bg-neutral-50 p-4">
                  <h3 className="text-sm font-medium text-neutral-700">Preço de Venda</h3>
                  <p className="text-xl font-medium text-primary-600">
                    R$ {formatarMoeda(produto.preco)}
                  </p>
                </div>
                
                <div className="rounded-lg bg-neutral-50 p-4">
                  <h3 className="text-sm font-medium text-neutral-700">Margem de Lucro</h3>
                  <p className="text-xl font-medium text-green-600">
                    {(() => {
                      // Calcular margem de lucro mesmo quando os valores são zero
                      const precoCusto = typeof produto.precoCusto === 'number' ? produto.precoCusto : 0;
                      const precoVenda = typeof produto.preco === 'number' ? produto.preco : 0;
                      
                      if (precoVenda === 0) return "0,00%";
                      
                      const margemLucro = ((precoVenda - precoCusto) / precoVenda) * 100;
                      return margemLucro.toFixed(2).replace('.', ',') + '%';
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Ações adicionais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50">
                <Share2 className="h-4 w-4" />
                Exportar Informações
              </button>
              <Link
                href={`/dashboard/produtos/${produto.id}/historico`}
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <User className="h-4 w-4" />
                Histórico de Vendas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 