"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Search, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  BookOpen,
  ShoppingBag,
  CreditCard,
  CircleDollarSign,
  Banknote,
  FileText,
  Save,
  Loader2,
  AlertCircle,
  PercentCircle,
  DollarSign,
  Percent,
  X
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { finalizeSale, fetchAvailableBooks, fetchCustomers } from "@/lib/services/pdvService";
import { supabase } from "@/lib/supabase/client";
import { Book, Customer } from "@/models/database.types";

// Tipos de dados
type Cliente = Customer;
type Produto = Book;

type ItemVenda = {
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  discount: number;
};

type FormaPagamento = "cash" | "credit_card" | "debit_card" | "pix" | "transfer";

// Dados simulados
const clientesDisponiveis: Cliente[] = [
  { id: 1, nome: "Maria Silva", email: "maria.silva@email.com", telefone: "(11) 98765-4321", tipo: "pessoaFisica" },
  { id: 2, nome: "João Pereira", email: "joao.pereira@email.com", telefone: "(21) 97654-3210", tipo: "pessoaFisica" },
  { id: 3, nome: "Livraria Cultura Ltda", email: "contato@livrariacultura.com", telefone: "(31) 3333-2222", tipo: "pessoaJuridica" },
  { id: 4, nome: "Ana Beatriz Santos", email: "ana.santos@email.com", telefone: "(41) 98888-7777", tipo: "pessoaFisica" },
  { id: 5, nome: "Escola Municipal Monteiro Lobato", email: "contato@escolamonteirolobato.edu.br", telefone: "(61) 3555-4444", tipo: "pessoaJuridica" },
];

const produtosDisponiveis: Produto[] = [
  {
    id: 1,
    titulo: "O Senhor dos Anéis",
    autor: "J.R.R. Tolkien",
    editora: "HarperCollins",
    isbn: "9788595084759",
    preco: 85.90,
    estoque: 15
  },
  {
    id: 2,
    titulo: "Harry Potter e a Pedra Filosofal",
    autor: "J.K. Rowling",
    editora: "Rocco",
    isbn: "9788532511010",
    preco: 45.50,
    estoque: 23
  },
  {
    id: 3,
    titulo: "Dom Casmurro",
    autor: "Machado de Assis",
    editora: "Principis",
    isbn: "9786555520149",
    preco: 39.90,
    estoque: 30
  },
  {
    id: 4,
    titulo: "1984",
    autor: "George Orwell",
    editora: "Companhia das Letras",
    isbn: "9788535914849",
    preco: 49.90,
    estoque: 18
  },
  {
    id: 5,
    titulo: "A Metamorfose",
    autor: "Franz Kafka",
    editora: "Companhia das Letras",
    isbn: "9788535908462",
    preco: 45.00,
    estoque: 12
  },
  {
    id: 6,
    titulo: "O Pequeno Príncipe",
    autor: "Antoine de Saint-Exupéry",
    editora: "HarperCollins",
    isbn: "9788595081512",
    preco: 25.90,
    estoque: 45
  },
  {
    id: 7,
    titulo: "Memórias Póstumas de Brás Cubas",
    autor: "Machado de Assis",
    editora: "Antofágica",
    isbn: "9788552200413",
    preco: 42.90,
    estoque: 17
  },
  {
    id: 8,
    titulo: "Orgulho e Preconceito",
    autor: "Jane Austen",
    editora: "Martin Claret",
    isbn: "9788572329408",
    preco: 48.90,
    estoque: 20
  },
  {
    id: 9,
    titulo: "A Culpa é das Estrelas",
    autor: "John Green",
    editora: "Intrínseca",
    isbn: "9788580573466",
    preco: 39.90,
    estoque: 25
  },
  {
    id: 10,
    titulo: "O Hobbit",
    autor: "J.R.R. Tolkien",
    editora: "HarperCollins",
    isbn: "9788595084742",
    preco: 55.90,
    estoque: 22
  },
];

// Funções auxiliares para compatibilidade de tipos
const convertToCustomer = (cliente: any): Customer => {
  return {
    id: cliente.id?.toString() || '',
    name: cliente.nome || '',
    email: cliente.email || '',
    phone: cliente.telefone || '',
    address: cliente.address || '',
    city: cliente.city || '',
    state: cliente.state || '',
    zip: cliente.zip || '',
    notes: cliente.notes || '',
    customer_type: cliente.tipo === 'pessoaJuridica' ? 'pj' : 'pf',
    status: 'active',
    created_at: cliente.created_at || new Date().toISOString(),
    updated_at: cliente.updated_at || new Date().toISOString(),
  };
};

const convertToBook = (produto: any): Book => {
  return {
    id: produto.id?.toString() || '',
    title: produto.titulo || produto.title || '',
    author: produto.autor || produto.author || '',
    isbn: produto.isbn || '',
    publisher: produto.editora || produto.publisher || '',
    category: produto.categoria || produto.category || '',
    subcategory: produto.subCategoria || produto.subcategory || '',
    purchase_price: produto.precoCusto || produto.purchase_price || 0,
    selling_price: produto.preco || produto.selling_price || 0,
    quantity: produto.estoque || produto.quantity || 0,
    minimum_stock: produto.estoqueMinimo || produto.minimum_stock || 0,
    created_at: produto.created_at || new Date().toISOString(),
    updated_at: produto.updated_at || new Date().toISOString(),
    supplier_id: produto.supplier_id || '',
  };
};

// Componente de carregamento
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-lg">Carregando...</p>
      </div>
    </div>
  );
}

// Componente principal com Suspense para o useSearchParams
function NovaVendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  
  // Estados para a venda
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
  
  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [mostrarResultadosProduto, setMostrarResultadosProduto] = useState(false);
  
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("cash");
  const [parcelas, setParcelas] = useState(1);
  const [valorRecebido, setValorRecebido] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  // Estados para os passos de conclusão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para verificar autenticação
  const [authChecked, setAuthChecked] = useState(false);
  
  // Calcular totais
  const subtotal = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);
  const totalDesconto = itensVenda.reduce((acc, item) => acc + item.discount, 0);
  const totalItens = itensVenda.reduce((acc, item) => acc + item.quantidade, 0);
  const total = subtotal - totalDesconto;
  
  const [descontoGeral, setDescontoGeral] = useState<string>('');
  const [tipoDescontoGeral, setTipoDescontoGeral] = useState<'value' | 'percentage'>('value');
  const [mostrarDescontoGeral, setMostrarDescontoGeral] = useState(false);
  
  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading) {
        if (!user) {
          // Se não estiver autenticado, redirecionar para a página de login
          console.log("Usuário não autenticado, redirecionando para login");
          router.push("/login?redirect=/dashboard/vendas/nova");
        } else {
          // Atualizar dados do usuário
          await refreshUser();
          setAuthChecked(true);
        }
      }
    };
    
    checkAuth();
  }, [user, authLoading, router, refreshUser]);
  
  // Verificar se há um cliente pré-selecionado na URL
  useEffect(() => {
    const clienteId = searchParams.get('cliente');
    if (clienteId) {
      fetchClienteById(clienteId);
    }
  }, [searchParams]);
  
  // Função para buscar cliente por ID
  const fetchClienteById = async (id: string) => {
    try {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) setCliente(data);
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
    }
  };
  
  // Carregar produtos e clientes do banco real
  useEffect(() => {
    const loadLists = async () => {
      // Implementação real será feita através do pdvService
    };
    
    loadLists();
  }, []);
  
  // Filtrar clientes ao digitar na busca
  useEffect(() => {
    const searchClientes = async () => {
      if (buscaCliente.trim() === "") {
        setClientesFiltrados([]);
        return;
      }
      
      try {
        const clientes = await fetchCustomers(buscaCliente);
        setClientesFiltrados(clientes);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      }
    };
    
    searchClientes();
  }, [buscaCliente]);
  
  // Filtrar produtos ao digitar na busca
  useEffect(() => {
    const searchProdutos = async () => {
      if (buscaProduto.trim() === "") {
        setProdutosFiltrados([]);
        return;
      }
      
      try {
        const produtos = await fetchAvailableBooks(buscaProduto);
        setProdutosFiltrados(produtos);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      }
    };
    
    searchProdutos();
  }, [buscaProduto]);
  
  // Handler para selecionar cliente
  const handleSelecionarCliente = (cliente: any) => {
    // Converter o cliente para o formato esperado pelo Customer
    const customerData = convertToCustomer(cliente);
    setCliente(customerData);
    setBuscaCliente("");
    setClientesFiltrados([]);
    setMostrarResultadosCliente(false);
  };
  
  // Handler para adicionar produto
  const handleAdicionarProduto = (produto: any) => {
    // Converter o produto para o formato esperado pelo Book
    const bookData = convertToBook(produto);
    
    // Verificar se o produto já está na lista
    const itemExistente = itensVenda.find(item => item.produto.id === bookData.id);
    
    if (itemExistente) {
      // Atualizar quantidade se já existe
      const novaQuantidade = itemExistente.quantidade + 1;
      if (novaQuantidade <= bookData.quantity) {
        handleAtualizarQuantidade(bookData.id, novaQuantidade);
      }
    } else {
      // Adicionar novo item
      const novoItem: ItemVenda = {
        produto: bookData,
        quantidade: 1,
        precoUnitario: bookData.selling_price,
        subtotal: bookData.selling_price,
        discount: 0
      };
      
      setItensVenda([...itensVenda, novoItem]);
    }
    
    setBuscaProduto("");
    setProdutosFiltrados([]);
    setMostrarResultadosProduto(false);
  };
  
  // Handler para atualizar quantidade
  const handleAtualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    setItensVenda(itensAtuais => 
      itensAtuais.map(item => {
        if (item.produto.id === produtoId) {
          // Verificar se a quantidade não excede o estoque
          if (novaQuantidade <= item.produto.quantity && novaQuantidade > 0) {
            return {
              ...item,
              quantidade: novaQuantidade,
              subtotal: item.precoUnitario * novaQuantidade
            };
          }
        }
        return item;
      })
    );
  };
  
  // Handler para remover produto
  const handleRemoverProduto = (produtoId: number) => {
    setItensVenda(itensAtuais => 
      itensAtuais.filter(item => item.produto.id !== produtoId)
    );
  };
  
  // Handler para valor recebido (formatação)
  const handleValorRecebidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/[^\d,]/g, ""); // Manter apenas dígitos e vírgula
    setValorRecebido(valor);
  };
  
  // Handler para atualizar desconto de um item
  const handleAtualizarDesconto = (produtoId: number, novoDesconto: number) => {
    setItensVenda(itensAtuais => 
      itensAtuais.map(item => {
        if (item.produto.id === produtoId) {
          // Garantir que o desconto não exceda o valor total do item
          const descontoMaximo = item.precoUnitario * item.quantidade;
          const descontoSeguro = Math.min(novoDesconto, descontoMaximo);
          
          return {
            ...item,
            discount: descontoSeguro,
            subtotal: (item.precoUnitario * item.quantidade) - descontoSeguro
          };
        }
        return item;
      })
    );
  };

  // Calcular o desconto geral
  const calcularDescontoGeral = (): number => {
    const valorDesconto = parseFloat(descontoGeral.replace(',', '.')) || 0;
    
    if (valorDesconto <= 0) return 0;
    
    if (tipoDescontoGeral === 'percentage') {
      // Calcular o valor com base na porcentagem (limitado a 100%)
      const porcentagemSegura = Math.min(valorDesconto, 100);
      return (subtotal * porcentagemSegura) / 100;
    } else {
      // Valor direto (limitado ao total da venda)
      return Math.min(valorDesconto, subtotal);
    }
  };
  
  // Aplicar desconto geral aos itens
  const aplicarDescontoGeral = () => {
    const valorDescontoGeral = calcularDescontoGeral();
    
    if (valorDescontoGeral <= 0 || itensVenda.length === 0) return;
    
    // Se houver apenas um item, aplicar todo o desconto a ele
    if (itensVenda.length === 1) {
      const item = itensVenda[0];
      handleAtualizarDesconto(item.produto.id, valorDescontoGeral);
      setDescontoGeral('');
      setMostrarDescontoGeral(false);
      return;
    }
    
    // Distribuir o desconto proporcionalmente entre os itens
    const valorTotalItens = itensVenda.reduce((sum, item) => 
      sum + (item.precoUnitario * item.quantidade), 0);
    
    let descontoRestante = valorDescontoGeral;
    
    // Copiar os itens para atualização em massa
    const novosItens = [...itensVenda];
    
    // Aplicar aos itens, exceto o último
    for (let i = 0; i < novosItens.length - 1; i++) {
      const item = novosItens[i];
      const valorItem = item.precoUnitario * item.quantidade;
      const parteDesconto = (valorItem / valorTotalItens) * valorDescontoGeral;
      const descontoArredondado = Math.floor(parteDesconto * 100) / 100; // Arredondar para 2 casas
      
      novosItens[i] = {
        ...item,
        discount: descontoArredondado,
        subtotal: valorItem - descontoArredondado
      };
      
      descontoRestante -= descontoArredondado;
    }
    
    // Aplicar o restante ao último item
    const ultimoItem = novosItens[novosItens.length - 1];
    const valorUltimoItem = ultimoItem.precoUnitario * ultimoItem.quantidade;
    const novoDescontoUltimoItem = Math.min(descontoRestante, valorUltimoItem);
    
    novosItens[novosItens.length - 1] = {
      ...ultimoItem,
      discount: novoDescontoUltimoItem,
      subtotal: valorUltimoItem - novoDescontoUltimoItem
    };
    
    // Atualizar o estado com todos os novos itens
    setItensVenda(novosItens);
    setDescontoGeral('');
    setMostrarDescontoGeral(false);
  };
  
  // Validação do formulário
  const validarFormulario = () => {
    // Verificar se há cliente selecionado
    if (!cliente) {
      alert("Selecione um cliente para continuar.");
      return false;
    }
    
    // Verificar se há itens na venda
    if (itensVenda.length === 0) {
      alert("Adicione pelo menos um produto à venda.");
      return false;
    }
    
    // Verificar valor recebido quando pagamento em dinheiro
    if (formaPagamento === "cash") {
      const valorRecebidoNum = parseFloat(valorRecebido.replace(",", "."));
      if (isNaN(valorRecebidoNum) || valorRecebidoNum < subtotal) {
        alert("O valor recebido deve ser maior ou igual ao valor total da venda.");
        return false;
      }
    }
    
    return true;
  };
  
  // Handler para finalizar venda
  const handleFinalizarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Verificar se o usuário está autenticado
      if (!user) {
        // Tentar atualizar informações do usuário
        await refreshUser();
        
        // Verificar novamente
        if (!user) {
          throw new Error("Usuário não autenticado. Faça login novamente.");
        }
      }
      
      // Garantir que temos o ID do usuário
      if (!user.id) {
        throw new Error("ID do usuário não encontrado. Faça login novamente.");
      }
      
      // Converter os itens da venda para o formato esperado pelo serviço
      const cartItems = itensVenda.map(item => ({
        book: item.produto,
        quantity: item.quantidade,
        discount: item.discount
      }));
      
      console.log('Dados enviados para finalizar venda:', {
        cartItems,
        customerId: cliente?.id,
        userId: user.id,
        paymentMethod: formaPagamento,
        notes: observacoes
      });
      
      // Chamar o serviço para finalizar a venda
      const saleId = await finalizeSale(
        cartItems,
        cliente?.id || null,
        user.id,
        formaPagamento,
        observacoes
      );
      
      setSuccess(true);
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push(`/dashboard/vendas/${saleId}`);
      }, 1500);
    } catch (err) {
      console.error("Erro ao finalizar venda:", err);
      setError(err instanceof Error ? err.message : "Erro ao finalizar venda");
      setIsSubmitting(false);
    }
  };
  
  // Formatador de valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Se estiver carregando autenticação, mostrar mensagem de carregamento
  if (authLoading) {
    return (
      <DashboardLayout title="Nova Venda">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-neutral-600">Verificando autenticação...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Se não estiver autenticado após verificação, mostrar mensagem para fazer login
  if (!authChecked || !user) {
    return (
      <DashboardLayout title="Nova Venda">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-medium text-neutral-900">Usuário não autenticado</h2>
          <p className="mt-2 text-neutral-600">É necessário estar logado para registrar uma venda.</p>
          <div className="mt-6">
            <Link
              href="/login?redirect=/dashboard/vendas/nova"
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Nova Venda">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/vendas" 
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            Registrar Nova Venda
          </h1>
        </div>
        
        <form onSubmit={handleFinalizarVenda} className="space-y-6">
          {/* Seleção de cliente */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Cliente</h2>
            
            {cliente ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{cliente.name}</p>
                    <p className="text-sm text-neutral-600">{cliente.email} • {cliente.phone}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setCliente(null)}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome, email ou telefone..."
                    value={buscaCliente}
                    onChange={(e) => {
                      setBuscaCliente(e.target.value);
                      setMostrarResultadosCliente(true);
                    }}
                    onFocus={() => setMostrarResultadosCliente(true)}
                    className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                
                {mostrarResultadosCliente && clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full max-w-2xl overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                    {clientesFiltrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => handleSelecionarCliente(cliente)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                      >
                        <User className="h-4 w-4 text-neutral-400" />
                        <div>
                          <p className="font-medium text-neutral-900">{cliente.name}</p>
                          <p className="text-sm text-neutral-600">{cliente.email} • {cliente.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {mostrarResultadosCliente && buscaCliente.trim() !== "" && clientesFiltrados.length === 0 && (
                  <div className="rounded-md border border-neutral-200 bg-white p-4 text-center text-neutral-600">
                    Nenhum cliente encontrado. <Link href="/dashboard/clientes/novo" className="text-primary-600 hover:underline">Cadastrar novo cliente?</Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Produtos */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Produtos</h2>
            
            <div className="mb-6 space-y-4">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produto por título, autor ou ISBN..."
                  value={buscaProduto}
                  onChange={(e) => {
                    setBuscaProduto(e.target.value);
                    setMostrarResultadosProduto(true);
                  }}
                  onFocus={() => setMostrarResultadosProduto(true)}
                  className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              
              {mostrarResultadosProduto && produtosFiltrados.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full max-w-2xl overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                  {produtosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => handleAdicionarProduto(produto)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-neutral-400" />
                        <div>
                          <p className="font-medium text-neutral-900">{produto.title}</p>
                          <p className="text-sm text-neutral-600">{produto.author} • {produto.publisher}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900">{formatarValor(produto.selling_price)}</p>
                        <p className="text-sm text-neutral-600">Estoque: {produto.quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {mostrarResultadosProduto && buscaProduto.trim() !== "" && produtosFiltrados.length === 0 && (
                <div className="rounded-md border border-neutral-200 bg-white p-4 text-center text-neutral-600">
                  Nenhum produto encontrado.
                </div>
              )}
              
              {itensVenda.length > 0 ? (
                <div className="mt-6 rounded-lg border border-neutral-200">
                  <table className="w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Produto</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Quantidade</th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Preço Unit.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Subtotal</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {itensVenda.map((item) => (
                        <tr key={item.produto.id}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium text-neutral-900">{item.produto.title}</p>
                              <p className="text-xs text-neutral-600">{item.produto.author}</p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleAtualizarQuantidade(item.produto.id, item.quantidade - 1)}
                                className="rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 p-1 text-neutral-500 hover:bg-neutral-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input
                                type="number"
                                value={item.quantidade}
                                onChange={(e) => handleAtualizarQuantidade(item.produto.id, parseInt(e.target.value) || 1)}
                                min="1"
                                max={item.produto.quantity}
                                className="w-16 border-y border-neutral-300 py-1 text-center focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAtualizarQuantidade(item.produto.id, item.quantidade + 1)}
                                className="rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 p-1 text-neutral-500 hover:bg-neutral-100"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-neutral-900">
                            {formatarValor(item.precoUnitario)}
                            
                            {/* Desconto por item */}
                            <div className="mt-1 flex flex-col items-center">
                              <button
                                type="button"
                                className="text-xs text-emerald-600 hover:text-emerald-700"
                                onClick={() => {
                                  // Abrir um modal ou popover para editar o desconto
                                  const valor = prompt(`Digite o valor do desconto para ${item.produto.title}:`, item.discount.toString());
                                  if (valor !== null) {
                                    const desconto = parseFloat(valor.replace(',', '.')) || 0;
                                    handleAtualizarDesconto(item.produto.id, desconto);
                                  }
                                }}
                              >
                                {item.discount > 0 
                                  ? `Desconto: -${formatarValor(item.discount)}` 
                                  : "Adicionar desconto"}
                              </button>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-neutral-900">
                            {formatarValor(item.subtotal)}
                            {item.discount > 0 && (
                              <div className="text-xs text-gray-500 line-through">
                                {formatarValor(item.precoUnitario * item.quantidade)}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                            <button
                              type="button"
                              onClick={() => handleRemoverProduto(item.produto.id)}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-50">
                      <tr>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                          Total: {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                        </td>
                        <td colSpan={2} className="whitespace-nowrap px-4 py-3 text-right text-sm">
                          {totalDesconto > 0 && (
                            <div className="font-medium text-red-600">
                              Descontos: -{formatarValor(totalDesconto)}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-neutral-900">
                          Total da venda: {formatarValor(total)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
                  <ShoppingBag className="mb-2 h-10 w-10 text-neutral-400" />
                  <h3 className="text-lg font-medium text-neutral-900">Nenhum produto adicionado</h3>
                  <p className="mt-1 text-neutral-600">
                    Busque e adicione produtos à venda
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Pagamento e finalização */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Forma de pagamento */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Forma de Pagamento</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pag-cash"
                    name="formaPagamento"
                    checked={formaPagamento === "cash"}
                    onChange={() => setFormaPagamento("cash")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="pag-cash" className="flex items-center gap-2 text-neutral-900">
                    <Banknote className="h-5 w-5 text-neutral-500" /> Dinheiro
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pag-credit_card"
                    name="formaPagamento"
                    checked={formaPagamento === "credit_card"}
                    onChange={() => setFormaPagamento("credit_card")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="pag-credit_card" className="flex items-center gap-2 text-neutral-900">
                    <CreditCard className="h-5 w-5 text-neutral-500" /> Cartão de Crédito
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pag-debit_card"
                    name="formaPagamento"
                    checked={formaPagamento === "debit_card"}
                    onChange={() => setFormaPagamento("debit_card")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="pag-debit_card" className="flex items-center gap-2 text-neutral-900">
                    <CreditCard className="h-5 w-5 text-neutral-500" /> Cartão de Débito
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pag-pix"
                    name="formaPagamento"
                    checked={formaPagamento === "pix"}
                    onChange={() => setFormaPagamento("pix")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="pag-pix" className="flex items-center gap-2 text-neutral-900">
                    <CircleDollarSign className="h-5 w-5 text-neutral-500" /> PIX
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pag-transfer"
                    name="formaPagamento"
                    checked={formaPagamento === "transfer"}
                    onChange={() => setFormaPagamento("transfer")}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="pag-transfer" className="flex items-center gap-2 text-neutral-900">
                    <FileText className="h-5 w-5 text-neutral-500" /> Transferência Bancária
                  </label>
                </div>
                
                {/* Parcelas para cartão de crédito */}
                {formaPagamento === "credit_card" && (
                  <div className="mt-4">
                    <label htmlFor="parcelas" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Número de parcelas
                    </label>
                    <select
                      id="parcelas"
                      value={parcelas}
                      onChange={(e) => setParcelas(parseInt(e.target.value))}
                      className="w-full rounded-lg border border-neutral-300 bg-white py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      <option value={1}>1x de {formatarValor(subtotal)}</option>
                      <option value={2}>2x de {formatarValor(subtotal / 2)}</option>
                      <option value={3}>3x de {formatarValor(subtotal / 3)}</option>
                      <option value={4}>4x de {formatarValor(subtotal / 4)}</option>
                      <option value={5}>5x de {formatarValor(subtotal / 5)}</option>
                      <option value={6}>6x de {formatarValor(subtotal / 6)}</option>
                    </select>
                  </div>
                )}
                
                {/* Valor recebido para dinheiro */}
                {formaPagamento === "cash" && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="valorRecebido" className="mb-1.5 block text-sm font-medium text-neutral-900">
                        Valor recebido
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-neutral-500">R$</span>
                        </div>
                        <input
                          type="text"
                          id="valorRecebido"
                          value={valorRecebido}
                          onChange={handleValorRecebidoChange}
                          placeholder="0,00"
                          className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                    </div>
                    
                    {valorRecebido && !isNaN(parseFloat(valorRecebido.replace(",", "."))) && (
                      <div className="rounded-lg bg-neutral-100 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">Valor da venda:</span>
                          <span className="font-medium text-neutral-900">{formatarValor(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">Valor recebido:</span>
                          <span className="font-medium text-neutral-900">
                            {formatarValor(parseFloat(valorRecebido.replace(",", ".")))}
                          </span>
                        </div>
                        <div className="mt-1 border-t border-neutral-200 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-900">Troco:</span>
                            <span className={`font-medium ${parseFloat(valorRecebido.replace(",", ".")) - subtotal < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatarValor(parseFloat(valorRecebido.replace(",", ".")) - subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Resumo e observações */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Resumo da Venda</h2>
              
              <div className="space-y-4">
                <div className="rounded-lg bg-neutral-100 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Subtotal:</span>
                      <span className="font-medium text-neutral-900">{formatarValor(subtotal)}</span>
                    </div>
                    
                    {totalDesconto > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Descontos:</span>
                        <span className="font-medium text-red-600">-{formatarValor(totalDesconto)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Itens:</span>
                      <span className="font-medium text-neutral-900">{totalItens}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-neutral-200 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium text-neutral-900">Total:</span>
                        <span className="text-lg font-semibold text-neutral-900">{formatarValor(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botão para aplicar desconto geral */}
                {!mostrarDescontoGeral ? (
                  <button 
                    type="button"
                    onClick={() => setMostrarDescontoGeral(true)}
                    disabled={itensVenda.length === 0}
                    className="w-full mt-3 flex items-center justify-center space-x-2 py-2 border border-dashed border-emerald-300 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PercentCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Aplicar desconto geral</span>
                  </button>
                ) : (
                  <div className="mt-3 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <PercentCircle className="h-5 w-5 mr-2 text-emerald-600" />
                        <span className="font-medium text-gray-800">Desconto Geral</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarDescontoGeral(false);
                          setDescontoGeral('');
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Switch para tipo de desconto */}
                      <label className="inline-flex items-center cursor-pointer">
                        <span className={`mr-2 text-sm ${tipoDescontoGeral === 'value' ? 'font-semibold text-emerald-600' : 'text-gray-500'}`}>
                          <DollarSign className="h-4 w-4 inline mr-0.5" />
                          R$
                        </span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            value="" 
                            className="sr-only peer"
                            checked={tipoDescontoGeral === 'percentage'}
                            onChange={() => setTipoDescontoGeral(
                              tipoDescontoGeral === 'value' ? 'percentage' : 'value'
                            )}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                        <span className={`ml-2 text-sm ${tipoDescontoGeral === 'percentage' ? 'font-semibold text-emerald-600' : 'text-gray-500'}`}>
                          <Percent className="h-4 w-4 inline mr-0.5" />
                          %
                        </span>
                      </label>
                      
                      {/* Input para valor do desconto */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">
                            {tipoDescontoGeral === 'value' ? 'R$' : ''}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={descontoGeral}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.,]/g, '');
                            setDescontoGeral(value);
                          }}
                          placeholder={tipoDescontoGeral === 'percentage' ? '0' : '0,00'}
                          className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-10 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                        />
                        {tipoDescontoGeral === 'percentage' && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">%</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Calcular e mostrar valor de desconto */}
                      {descontoGeral && parseFloat(descontoGeral.replace(',', '.')) > 0 && (
                        <div className="bg-white rounded-lg mt-2 p-3 shadow-sm">
                          <div className="text-sm flex justify-between items-center">
                            <span className="text-gray-600">Desconto aplicado:</span>
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-red-500">
                                -{formatarValor(calcularDescontoGeral())}
                              </span>
                              {tipoDescontoGeral === 'percentage' && (
                                <span className="text-xs text-gray-500">
                                  ({parseFloat(descontoGeral.replace(',', '.'))}%)
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex justify-between items-center font-medium text-emerald-700">
                            <span>Novo total:</span>
                            <span>{formatarValor(total - calcularDescontoGeral())}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Botão para aplicar o desconto */}
                      <button
                        type="button"
                        onClick={aplicarDescontoGeral}
                        disabled={!descontoGeral || parseFloat(descontoGeral.replace(',', '.')) <= 0}
                        className="w-full py-2 mt-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aplicar desconto aos itens
                      </button>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="observacoes" className="mb-1.5 block text-sm font-medium text-neutral-900">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações sobre a venda (opcional)"
                    className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                
                <div className="pt-4">
                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Erro ao finalizar venda</span>
                      </div>
                      <p className="mt-1 text-sm">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || success || itensVenda.length === 0 || !cliente}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : success ? (
                      <>
                        <Save className="h-4 w-4" />
                        Venda finalizada!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        Finalizar Venda
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

// Componente principal encapsulando o conteúdo com Suspense
export default function NovaVendaPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NovaVendaContent />
    </Suspense>
  );
} 