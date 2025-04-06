"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { ArrowLeft, Search, Package, ArrowUp, ArrowDown, Calendar, User, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { bookService, Book } from "@/lib/services/bookService";
import { stockService, CreateStockMovementDTO } from "@/lib/services/stockService";
import { supabase } from "@/lib/supabase/client";

// Dados simulados de produtos
const produtos = [
  { 
    id: 1, 
    codigo: "LIV001", 
    nome: "O Senhor dos Anéis", 
    autor: "J.R.R. Tolkien",
    estoque: 25,
    precoVenda: 89.90
  },
  { 
    id: 2, 
    codigo: "LIV002", 
    nome: "Harry Potter e a Pedra Filosofal", 
    autor: "J.K. Rowling",
    estoque: 42,
    precoVenda: 34.90
  },
  { 
    id: 3, 
    codigo: "LIV003", 
    nome: "Dom Casmurro", 
    autor: "Machado de Assis",
    estoque: 18,
    precoVenda: 29.90
  },
  { 
    id: 4, 
    codigo: "LIV004", 
    nome: "1984", 
    autor: "George Orwell",
    estoque: 15,
    precoVenda: 42.50
  },
  { 
    id: 5, 
    codigo: "LIV005", 
    nome: "A Metamorfose", 
    autor: "Franz Kafka",
    estoque: 10,
    precoVenda: 28.75
  },
  { 
    id: 6, 
    codigo: "LIV006", 
    nome: "Grande Sertão: Veredas", 
    autor: "João Guimarães Rosa",
    estoque: 3,
    precoVenda: 58.90
  },
  { 
    id: 7, 
    codigo: "LIV007", 
    nome: "Memórias Póstumas de Brás Cubas", 
    autor: "Machado de Assis",
    estoque: 22,
    precoVenda: 32.80
  },
  { 
    id: 8, 
    codigo: "LIV008", 
    nome: "Duna", 
    autor: "Frank Herbert",
    estoque: 0,
    precoVenda: 69.90
  },
];

// Tipos de movimentação
const tiposMovimentacao = [
  { id: "entrada", nome: "Entrada", icon: ArrowUp, descricao: "Adicionar produtos ao estoque" },
  { id: "saida", nome: "Saída", icon: ArrowDown, descricao: "Remover produtos do estoque" },
];

// Motivos de movimentação
const motivosMovimentacao = {
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

export default function MovimentacaoEstoquePage() {
  const router = useRouter();
  
  // Estados do formulário
  const [tipoMovimentacao, setTipoMovimentacao] = useState<string>("entrada");
  const [produtoId, setProdutoId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [responsavel, setResponsavel] = useState<string>("");
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  
  // Estado da busca de produtos
  const [termoBusca, setTermoBusca] = useState<string>("");
  const [produtosFiltrados, setProdutosFiltrados] = useState<Book[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState<boolean>(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState<boolean>(false);
  
  // Estado para produto selecionado
  const [produtoSelecionado, setProdutoSelecionado] = useState<Book | null>(null);
  
  // Estado de validação e envio
  const [erros, setErros] = useState<{[key: string]: string}>({});
  const [enviando, setEnviando] = useState<boolean>(false);
  const [sucessoEnvio, setSucessoEnvio] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  
  // Carregar usuário logado
  useEffect(() => {
    const carregarUsuario = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Buscar dados completos do usuário
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (userData) {
          setUsuarioLogado(userData);
          setResponsavel(userData.name || session.user.email!);
        } else {
          setResponsavel(session.user.email!);
        }
      }
    };
    
    carregarUsuario();
  }, []);
  
  // Buscar produtos
  const buscarProdutos = async (termo: string) => {
    setTermoBusca(termo);
    
    if (termo.length >= 2) {
      setCarregandoProdutos(true);
      
      try {
        const response = await bookService.searchBooks(termo);
        
        if (response.status === 'success' && response.data) {
          setProdutosFiltrados(response.data);
          setMostrarResultados(true);
        } else {
          setProdutosFiltrados([]);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setProdutosFiltrados([]);
      } finally {
        setCarregandoProdutos(false);
      }
    } else {
      setProdutosFiltrados([]);
      setMostrarResultados(false);
    }
  };
  
  // Selecionar produto
  const selecionarProduto = (produto: Book) => {
    setProdutoId(produto.id);
    setProdutoSelecionado(produto);
    setMostrarResultados(false);
    setTermoBusca(produto.title);
    
    // Limpar erro de produto se existir
    if (erros.produtoId) {
      setErros(prev => {
        const newErros = {...prev};
        delete newErros.produtoId;
        return newErros;
      });
    }
  };
  
  // Validar formulário
  const validarFormulario = () => {
    const novosErros: {[key: string]: string} = {};
    
    if (!produtoId) {
      novosErros.produtoId = "Selecione um produto";
    }
    
    if (!quantidade || quantidade <= 0) {
      novosErros.quantidade = "Informe uma quantidade válida";
    }
    
    if (tipoMovimentacao === "saida" && produtoSelecionado && quantidade > produtoSelecionado.quantity) {
      novosErros.quantidade = "Quantidade maior que o estoque disponível";
    }
    
    if (!motivo) {
      novosErros.motivo = "Selecione o motivo da movimentação";
    }
    
    if (!responsavel.trim()) {
      novosErros.responsavel = "Informe o responsável pela movimentação";
    }
    
    if (!data) {
      novosErros.data = "Informe a data da movimentação";
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setEnviando(true);
      setMensagemErro(null);
      
      try {
        // Criar dados da movimentação
        const movimentacaoData: CreateStockMovementDTO = {
          book_id: produtoId!,
          type: tipoMovimentacao as 'entrada' | 'saida',
          quantity: quantidade,
          reason: motivo,
          notes: observacao || undefined,
          responsible: responsavel
        };
        
        // Enviar para o serviço
        const response = await stockService.createMovement(movimentacaoData);
        
        if (response.status === 'success') {
          setSucessoEnvio(true);
          
          // Redirecionar após sucesso
          setTimeout(() => {
            router.push("/dashboard/estoque");
          }, 2000);
        } else {
          setMensagemErro(response.error || 'Erro ao registrar movimentação');
        }
      } catch (error) {
        console.error('Erro ao processar movimentação:', error);
        setMensagemErro(error instanceof Error ? error.message : 'Erro ao processar movimentação');
      } finally {
        setEnviando(false);
      }
    } else {
      // Rolar até o primeiro erro
      const firstErrorField = Object.keys(erros)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  return (
    <DashboardLayout title="Movimentação de Estoque">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/estoque" 
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              {tipoMovimentacao === "entrada" ? "Nova Entrada de Estoque" : "Nova Saída de Estoque"}
            </h1>
          </div>
        </div>

        {/* Tipos de movimentação */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tiposMovimentacao.map((tipo) => (
            <div 
              key={tipo.id}
              onClick={() => setTipoMovimentacao(tipo.id)}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                tipoMovimentacao === tipo.id
                  ? "border-primary-200 bg-primary-50 ring-2 ring-primary-500/30"
                  : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50"
              }`}
            >
              <div className={`rounded-full p-3 ${
                tipoMovimentacao === tipo.id 
                  ? (tipo.id === "entrada" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600")
                  : "bg-neutral-100 text-neutral-500"
              }`}>
                <tipo.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900">{tipo.nome}</h3>
                <p className="text-sm text-neutral-500">{tipo.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem de sucesso */}
        {sucessoEnvio && (
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="mb-2 flex justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-green-800">Movimentação registrada com sucesso!</h3>
            <p className="mt-1 text-green-700">
              Você será redirecionado para a lista de estoque em instantes...
            </p>
          </div>
        )}

        {/* Mensagem de erro */}
        {mensagemErro && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-center">
              <AlertCircle className="mr-3 h-5 w-5 text-red-500" />
              <h3 className="font-medium text-red-800">Erro ao registrar movimentação</h3>
            </div>
            <p className="mt-1 ml-8 text-red-700">{mensagemErro}</p>
          </div>
        )}

        {/* Formulário */}
        {!sucessoEnvio && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Produto */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Selecione o Produto</h2>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="produto" className="block text-sm font-medium text-neutral-700">
                    Buscar produto por nome, código ou autor
                  </label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      name="produtoId"
                      id="produto"
                      value={termoBusca}
                      onChange={(e) => buscarProdutos(e.target.value)}
                      className={`block w-full rounded-md border pl-10 py-2 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.produtoId ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="Digite para buscar..."
                    />
                    {carregandoProdutos && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                      </div>
                    )}
                  </div>
                  {erros.produtoId && (
                    <p className="mt-1 text-sm text-red-600">{erros.produtoId}</p>
                  )}
                  
                  {/* Resultados da busca */}
                  {mostrarResultados && produtosFiltrados.length > 0 && (
                    <div className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {produtosFiltrados.map((produto) => (
                        <div
                          key={produto.id}
                          onClick={() => selecionarProduto(produto)}
                          className="relative cursor-pointer py-2 px-4 hover:bg-neutral-100"
                        >
                          <div className="font-medium text-neutral-900">{produto.title}</div>
                          <div className="flex justify-between text-sm text-neutral-500">
                            <span>ISBN: {produto.isbn}</span>
                            <span>Estoque: {produto.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {mostrarResultados && produtosFiltrados.length === 0 && !carregandoProdutos && (
                    <div className="absolute z-10 mt-2 w-full rounded-md bg-white py-3 px-4 shadow-lg ring-1 ring-black ring-opacity-5">
                      <p className="text-sm text-neutral-500">Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
                
                {/* Produto selecionado */}
                {produtoSelecionado && (
                  <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-neutral-100 p-3">
                        <Package className="h-6 w-6 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900">{produtoSelecionado.title}</h3>
                        <p className="text-sm text-neutral-500">{produtoSelecionado.author}</p>
                        
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-neutral-700">ISBN:</span> {produtoSelecionado.isbn}
                          </div>
                          <div>
                            <span className="font-medium text-neutral-700">Categoria:</span> {produtoSelecionado.category}
                          </div>
                          <div>
                            <span className="font-medium text-neutral-700">Preço:</span> R$ {produtoSelecionado.selling_price.toFixed(2).replace('.', ',')}
                          </div>
                          <div>
                            <span className="font-medium text-neutral-700">Estoque:</span> {produtoSelecionado.quantity} livros
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Detalhes da movimentação */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Detalhes da Movimentação</h2>
              
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="quantidade" className="block text-sm font-medium text-neutral-700">
                    Quantidade
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="quantidade"
                      id="quantidade"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                      className={`block w-full rounded-md border py-2 px-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.quantidade ? 'border-red-300' : 'border-neutral-300'
                      }`}
                    />
                    {erros.quantidade && (
                      <p className="mt-1 text-sm text-red-600">{erros.quantidade}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="motivo" className="block text-sm font-medium text-neutral-700">
                    Motivo
                  </label>
                  <div className="mt-1">
                    <select
                      id="motivo"
                      name="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className={`block w-full rounded-md border py-2 px-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.motivo ? 'border-red-300' : 'border-neutral-300'
                      }`}
                    >
                      <option value="">Selecione um motivo</option>
                      {motivosMovimentacao[tipoMovimentacao === 'entrada' ? 'entrada' : 'saida'].map((m) => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                    {erros.motivo && (
                      <p className="mt-1 text-sm text-red-600">{erros.motivo}</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="observacao" className="block text-sm font-medium text-neutral-700">
                    Observações (opcional)
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="observacao"
                      name="observacao"
                      rows={3}
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Adicione informações complementares sobre esta movimentação..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Informações adicionais */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Informações Adicionais</h2>
              
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="data" className="block text-sm font-medium text-neutral-700">
                    Data
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      name="data"
                      id="data"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className={`block w-full rounded-md border pl-10 py-2 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.data ? 'border-red-300' : 'border-neutral-300'
                      }`}
                    />
                    {erros.data && (
                      <p className="mt-1 text-sm text-red-600">{erros.data}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="responsavel" className="block text-sm font-medium text-neutral-700">
                    Responsável
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      name="responsavel"
                      id="responsavel"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      className={`block w-full rounded-md border pl-10 py-2 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.responsavel ? 'border-red-300' : 'border-neutral-300'
                      }`}
                    />
                    {erros.responsavel && (
                      <p className="mt-1 text-sm text-red-600">{erros.responsavel}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex justify-end gap-3">
              <Link
                href="/dashboard/estoque"
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={enviando}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-70"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {tipoMovimentacao === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
} 