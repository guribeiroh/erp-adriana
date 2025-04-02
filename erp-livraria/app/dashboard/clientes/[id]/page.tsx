"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  User, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Calendar,
  FileText,
  ShoppingBag,
  CreditCard,
  Instagram
} from "lucide-react";
import { fetchCustomerById, deleteCustomer, fetchCustomerPurchaseSummary, CustomerPurchaseSummary } from "@/lib/services/customerService";
import { Customer } from "@/models/database.types";

// Função para formatar valores monetários
const formatarMoeda = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined) return "0,00";
  return valor.toFixed(2).replace('.', ',');
};

export default function DetalheClientePage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.id as string;
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativasReload, setTentativasReload] = useState(0);
  const componenteMontado = useRef(true);
  const [resumoCompras, setResumoCompras] = useState<CustomerPurchaseSummary>({
    totalPurchases: 0,
    totalSpent: 0,
    recentPurchases: []
  });
  const [carregandoCompras, setCarregandoCompras] = useState(true);

  // Marcar componente como desmontado quando sair da página
  useEffect(() => {
    componenteMontado.current = true;
    return () => {
      componenteMontado.current = false;
    };
  }, []);

  // Função para carregar os dados do cliente
  const carregarCliente = useCallback(async () => {
    if (!clienteId || !componenteMontado.current) return;
    
    setCarregando(true);
    setErro(null);
    
    try {
      console.log(`Carregando dados do cliente ID: ${clienteId}`);
      const data = await fetchCustomerById(clienteId);
      
      if (!data) {
        throw new Error("Cliente não encontrado");
      }
      
      if (componenteMontado.current) {
        setCliente(data);
        setErro(null);
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      if (componenteMontado.current) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar dados do cliente");
      }
    } finally {
      if (componenteMontado.current) {
        setCarregando(false);
      }
    }
  }, [clienteId]);

  // Função para carregar o histórico de compras do cliente
  const carregarHistoricoCompras = useCallback(async () => {
    if (!clienteId || !componenteMontado.current) return;
    
    setCarregandoCompras(true);
    
    try {
      console.log(`Carregando histórico de compras do cliente ID: ${clienteId}`);
      const data = await fetchCustomerPurchaseSummary(clienteId);
      
      if (componenteMontado.current) {
        setResumoCompras(data);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de compras:", error);
    } finally {
      if (componenteMontado.current) {
        setCarregandoCompras(false);
      }
    }
  }, [clienteId]);

  // Carregar cliente quando o componente montar ou o ID mudar
  useEffect(() => {
    carregarCliente();
    carregarHistoricoCompras();
  }, [carregarCliente, carregarHistoricoCompras]);

  // Função para recarregar dados manualmente
  const recarregarDados = () => {
    setTentativasReload(prev => prev + 1);
    carregarCliente();
    carregarHistoricoCompras();
  };

  // Função para excluir o cliente
  const handleExcluir = async () => {
    if (!cliente) return;
    
    const confirmar = window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.name}"?`);
    if (confirmar) {
      try {
        await deleteCustomer(cliente.id);
        alert("Cliente excluído com sucesso!");
        router.push("/dashboard/clientes");
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        alert(`Erro ao excluir cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }
  };

  // Formatador de data
  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return "N/A";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Renderizar estado de carregamento
  if (carregando && !cliente) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex h-[400px] flex-col items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
            <p className="text-neutral-600">Carregando informações do cliente...</p>
            <p className="mt-2 text-sm text-neutral-500">ID do cliente: {clienteId}</p>
            <button
              onClick={recarregarDados}
              className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar estado de erro
  if (erro && !cliente) {
    return (
      <DashboardLayout title="Erro">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-neutral-900">Erro ao carregar cliente</h2>
            <p className="mb-6 text-neutral-600">{erro}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={recarregarDados}
                className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
              <Link
                href="/dashboard/clientes"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Voltar para a lista
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar o cliente
  return (
    <DashboardLayout title={cliente?.name || "Detalhes do Cliente"}>
      <div className="space-y-6">
        {/* Cabeçalho e ações */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/clientes" 
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              {cliente?.name || "Detalhes do Cliente"}
            </h1>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/dashboard/clientes/${clienteId}/editar`}
              className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <Edit className="h-4 w-4" />
              Editar Cliente
            </Link>
            <button
              onClick={handleExcluir}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Cliente
            </button>
          </div>
        </div>
        
        {/* Conteúdo principal - Grid com informações do cliente */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna da esquerda - Informações básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados básicos */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Informações Básicas</h2>
              
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Nome</h3>
                  <p className="mt-1 text-neutral-900">{cliente?.name || "N/A"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Tipo de Cliente</h3>
                  <p className="mt-1 text-neutral-900">
                    {cliente?.customer_type === 'pf' 
                      ? 'Pessoa Física' 
                      : cliente?.customer_type === 'pj' 
                        ? 'Pessoa Jurídica' 
                        : "N/A"}
                  </p>
                </div>
                
                {cliente?.customer_type === 'pf' && cliente?.cpf && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">CPF</h3>
                    <p className="mt-1 text-neutral-900">{cliente.cpf}</p>
                  </div>
                )}
                
                {cliente?.customer_type === 'pj' && (
                  <>
                    {cliente?.social_name && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">Razão Social</h3>
                        <p className="mt-1 text-neutral-900">{cliente.social_name}</p>
                      </div>
                    )}
                    
                    {cliente?.cnpj && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500">CNPJ</h3>
                        <p className="mt-1 text-neutral-900">{cliente.cnpj}</p>
                      </div>
                    )}
                  </>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Status</h3>
                  <div className="mt-1">
                    {cliente?.status === 'active' ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Data de Cadastro</h3>
                  <p className="mt-1 text-neutral-900">{formatarData(cliente?.created_at)}</p>
                </div>
              </div>
            </div>
            
            {/* Contato */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Informações de Contato</h2>
              
              <div className="mt-4 space-y-4">
                {/* Email */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Email</h3>
                  <p className="mt-1 flex items-center text-neutral-900">
                    <Mail className="mr-1.5 h-4 w-4 text-neutral-500" />
                    {cliente?.email || '-'}
                  </p>
                </div>
                
                {/* Instagram */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Instagram</h3>
                  <p className="mt-1 flex items-center text-neutral-900">
                    <Instagram className="mr-1.5 h-4 w-4 text-neutral-500" />
                    {cliente?.instagram 
                      ? <a href={`https://instagram.com/${cliente.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">@{cliente.instagram}</a>
                      : '-'
                    }
                  </p>
                </div>
                
                {cliente?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-400" />
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">Telefone</h3>
                      <p className="text-neutral-700">{cliente.phone}</p>
                    </div>
                  </div>
                )}
                
                {(cliente?.address || cliente?.city || cliente?.state) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-400" />
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">Endereço</h3>
                      <p className="text-neutral-700">
                        {cliente?.address && <span>{cliente.address}</span>}
                        {cliente?.address_complement && <span>, {cliente.address_complement}</span>}
                        <br />
                        {cliente?.city && <span>{cliente.city}</span>}
                        {cliente?.state && <span>, {cliente.state}</span>}
                        {cliente?.zip && <span> - CEP: {cliente.zip}</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notas */}
            {cliente?.notes && (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neutral-500" />
                  <h2 className="text-lg font-medium text-neutral-900">Observações</h2>
                </div>
                <p className="mt-4 whitespace-pre-line text-neutral-700">{cliente.notes}</p>
              </div>
            )}
          </div>
          
          {/* Coluna da direita - Resumo e estatísticas */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Resumo de Atividades</h2>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  {carregandoCompras ? (
                    <div className="mt-2 flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-neutral-400 mr-1" />
                      <span className="text-neutral-400">Carregando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">{resumoCompras.totalPurchases}</p>
                      <p className="text-sm text-neutral-500">Compras</p>
                    </>
                  )}
                </div>
                
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  {carregandoCompras ? (
                    <div className="mt-2 flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-neutral-400 mr-1" />
                      <span className="text-neutral-400">Carregando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">R$ {formatarMoeda(resumoCompras.totalSpent)}</p>
                      <p className="text-sm text-neutral-500">Total gasto</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Últimas compras */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Últimas Compras</h2>
              
              {carregandoCompras ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-neutral-400 mr-2" />
                  <span className="text-neutral-500">Carregando histórico de compras...</span>
                </div>
              ) : resumoCompras.recentPurchases.length > 0 ? (
                <div className="space-y-3">
                  {resumoCompras.recentPurchases.map(compra => (
                    <Link 
                      key={compra.id}
                      href={`/dashboard/vendas/${compra.id}`}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">
                          Compra #{compra.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {new Date(compra.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-neutral-900">
                          R$ {formatarMoeda(compra.total)}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          compra.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : compra.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {compra.status === 'paid' 
                            ? 'Pago' 
                            : compra.status === 'pending'
                              ? 'Pendente'
                              : 'Cancelado'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <p>Nenhuma compra registrada</p>
                </div>
              )}
              
              {resumoCompras.totalPurchases > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/dashboard/vendas?cliente=${clienteId}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Ver todas as {resumoCompras.totalPurchases} compras
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 