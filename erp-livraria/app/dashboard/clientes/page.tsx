"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowUpDown,
  UserCog,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  Tag,
  Loader2,
  AlertTriangle,
  RefreshCw,
  UserX,
  User,
  ChevronLeft,
  ChevronRight,
  Gift
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Customer } from "@/models/database.types";

// Número de itens por página
const ITENS_POR_PAGINA = 20;

export default function ClientesPage() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos, ativos, inativos, pessoaFisica, pessoaJuridica
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Customer[]>([]);
  const [ordenacao, setOrdenacao] = useState("name-asc"); // name-asc, name-desc, data-asc, data-desc
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [clientesPaginados, setClientesPaginados] = useState<Customer[]>([]);
  
  // Carregar clientes do Supabase
  useEffect(() => {
    async function carregarClientes() {
      try {
        setCarregando(true);
        setErro(null);
        
        if (!supabase) {
          throw new Error("Cliente Supabase não disponível");
        }
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (error) {
          throw new Error(`Erro ao carregar clientes: ${error.message}`);
        }
        
        setClientes(data || []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarClientes();
  }, []);
  
  // Calcular totais para o resumo
  const totalClientes = clientes.length;
  
  // Efeito para filtrar e ordenar clientes
  useEffect(() => {
    let resultado = [...clientes];
    
    // Aplicar filtro de busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(cliente => 
        cliente.name.toLowerCase().includes(termoBusca) || 
        (cliente.email && cliente.email.toLowerCase().includes(termoBusca)) ||
        (cliente.phone && cliente.phone.includes(termoBusca))
      );
    }
    
    // Aplicar ordenação
    if (ordenacao === "name-asc") {
      resultado.sort((a, b) => a.name.localeCompare(b.name));
    } else if (ordenacao === "name-desc") {
      resultado.sort((a, b) => b.name.localeCompare(a.name));
    } else if (ordenacao === "data-asc") {
      resultado.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (ordenacao === "data-desc") {
      resultado.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    setClientesFiltrados(resultado);
    
    // Resetar para a primeira página sempre que os filtros mudarem
    setPaginaAtual(1);
    
    // Calcular total de páginas
    setTotalPaginas(Math.ceil(resultado.length / ITENS_POR_PAGINA) || 1);
  }, [busca, ordenacao, clientes]);
  
  // Efeito para aplicar paginação
  useEffect(() => {
    aplicarPaginacao();
  }, [clientesFiltrados, paginaAtual]);
  
  // Função para aplicar paginação
  const aplicarPaginacao = () => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    
    setClientesPaginados(clientesFiltrados.slice(inicio, fim));
  };
  
  // Função para mudar de página
  const mudarPagina = (novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handler para alterar ordenação
  const handleOrdenacaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrdenacao(e.target.value);
  };

  // Formatador de data
  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  // Função para recarregar os dados
  const recarregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      if (!supabase) {
        throw new Error("Cliente Supabase não disponível");
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(`Erro ao carregar clientes: ${error.message}`);
      }
      
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  };

  // Render de carregamento
  if (carregando && clientes.length === 0) {
    return (
      <DashboardLayout title="Gestão de Clientes">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
            <p className="text-neutral-600">Carregando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render de erro
  if (erro && clientes.length === 0) {
    return (
      <DashboardLayout title="Gestão de Clientes">
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Erro ao carregar clientes</h2>
          <p className="mb-6 text-neutral-600">{erro}</p>
          <div className="flex gap-3">
            <button
              onClick={recarregarDados}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestão de Clientes">
      <div className="space-y-6">
        {/* Cabeçalho e ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Gestão de Clientes</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Gerencie os clientes da sua livraria
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/clientes/sorteio"
              className="flex items-center justify-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm hover:bg-primary-100"
            >
              <Gift className="h-4 w-4" />
              Sorteio de Aniversariantes
            </Link>
            <Link
              href="/dashboard/clientes/novo"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <UserPlus className="h-4 w-4" />
              Novo Cliente
            </Link>
          </div>
        </div>
        
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Total de Clientes</h3>
            <p className="text-2xl font-semibold text-neutral-900">{totalClientes}</p>
            <div className="mt-2 flex items-center text-sm text-neutral-600">
              <Users className="mr-1 h-4 w-4 text-primary-500" />
              <span>Cadastrados na base de dados</span>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Novos Clientes</h3>
            <p className="text-2xl font-semibold text-neutral-900">
              {clientes.filter(c => {
                const umMesAtras = new Date();
                umMesAtras.setMonth(umMesAtras.getMonth() - 1);
                return new Date(c.created_at) > umMesAtras;
              }).length}
            </p>
            <div className="mt-2 flex items-center text-sm text-neutral-600">
              <Calendar className="mr-1 h-4 w-4 text-primary-500" />
              <span>Nos últimos 30 dias</span>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-neutral-500">Clientes Ativos</h3>
            <p className="text-2xl font-semibold text-neutral-900">0</p>
            <div className="mt-2 flex items-center text-sm text-neutral-600">
              <ShoppingBag className="mr-1 h-4 w-4 text-primary-500" />
              <span>Com compras nos últimos 90 dias</span>
            </div>
          </div>
        </div>
        
        {/* Barra de busca e filtros */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="block w-full rounded-md border border-neutral-300 py-2 pl-10 pr-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
              placeholder="Buscar por nome, email ou telefone..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={ordenacao}
              onChange={handleOrdenacaoChange}
              className="rounded-md border border-neutral-300 py-2 pl-3 pr-8 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
            >
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="data-asc">Data de cadastro (mais antigos)</option>
              <option value="data-desc">Data de cadastro (mais recentes)</option>
            </select>
            
            <button 
              onClick={recarregarDados}
              className="flex items-center justify-center rounded-md border border-neutral-300 p-2 text-neutral-700 shadow-sm hover:bg-neutral-50"
              title="Atualizar lista"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Lista de clientes */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-12 gap-4 border-b border-neutral-200 bg-neutral-50 px-6 py-3">
            <div className="col-span-4 font-medium text-neutral-700">Nome</div>
            <div className="col-span-3 font-medium text-neutral-700">Contato</div>
            <div className="col-span-3 font-medium text-neutral-700">Localização</div>
            <div className="col-span-2 font-medium text-neutral-700">Cadastro</div>
          </div>
          
          {/* Dados da tabela */}
          <div className="divide-y divide-neutral-200">
            {clientesPaginados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <UserX className="h-8 w-8" />
                </div>
                <h3 className="mb-1 text-base font-medium text-neutral-900">Nenhum cliente encontrado</h3>
                <p className="text-sm text-neutral-500">{busca ? "Tente mudar sua busca" : "Ainda não há clientes cadastrados"}</p>
                {!busca && (
                  <Link
                    href="/dashboard/clientes/novo"
                    className="mt-4 flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Novo Cliente
                  </Link>
                )}
              </div>
            ) : (
              clientesPaginados.map((cliente) => (
                <Link
                  key={cliente.id}
                  href={`/dashboard/clientes/${cliente.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-neutral-50"
                >
                  {/* Nome */}
                  <div className="col-span-4">
                    <div className="flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-neutral-900">{cliente.name}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contato */}
                  <div className="col-span-3">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Mail className="mr-1 h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">{cliente.email || "Não informado"}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Phone className="mr-1 h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">{cliente.phone || "Não informado"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Localização */}
                  <div className="col-span-3">
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">
                        {cliente.city && cliente.state 
                          ? `${cliente.city} - ${cliente.state}` 
                          : "Localização não informada"
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Data de cadastro */}
                  <div className="col-span-2">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">{formatarData(cliente.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="border-t border-neutral-200 bg-white px-4 py-3 flex items-center justify-between sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
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
                      {Math.min(paginaAtual * ITENS_POR_PAGINA, clientesFiltrados.length)}
                    </span>{" "}
                    de <span className="font-medium">{clientesFiltrados.length}</span> resultados
                  </p>
                </div>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 