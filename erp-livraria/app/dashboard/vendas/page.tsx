"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  FileText,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  CircleDollarSign,
  ChevronDown,
  User,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { fetchRecentSales } from "@/lib/services/pdvService";
import { supabase } from "@/lib/supabase/client";
import { Sale } from "@/models/database.types";

// Tipos para vendas
interface VendaCompleta extends Sale {
  cliente?: {
    id: string;
    nome: string;
  };
  itens?: any[];
  vendedor?: string;
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtragem e ordenação
  const [periodoSelecionado, setPeriodoSelecionado] = useState("todos");
  const [statusSelecionado, setStatusSelecionado] = useState("todos");
  const [metodoPagamentoSelecionado, setMetodoPagamentoSelecionado] = useState("todos");
  const [ordenacao, setOrdenacao] = useState({ campo: "created_at", ordem: "desc" });
  const [termoBusca, setTermoBusca] = useState("");

  // Carregar vendas ao montar o componente
  useEffect(() => {
    carregarVendas();
  }, []);

  // Função para carregar vendas do Supabase
  const carregarVendas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar vendas recentes
      const vendasData = await fetchRecentSales(50);
      
      // Enriquecer dados das vendas com informações dos clientes
      const vendasCompletas = await Promise.all(vendasData.map(async (venda) => {
        // Buscar dados do cliente se houver
        let clienteData = undefined;
        
        if (venda.customer_id) {
          const { data: cliente } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', venda.customer_id)
            .single();
            
          if (cliente) {
            clienteData = {
              id: cliente.id,
              nome: cliente.name
            };
          }
        }
        
        // Buscar itens da venda
        const { data: itens } = await supabase
          .from('sale_items')
          .select(`
            id, 
            quantity, 
            unit_price, 
            discount,
            total,
            books(id, title)
          `)
          .eq('sale_id', venda.id);
        
        // Buscar dados do vendedor
        const { data: usuario } = await supabase
          .from('users')
          .select('name')
          .eq('id', venda.user_id)
          .single();
        
        return {
          ...venda,
          cliente: clienteData,
          itens: itens || [],
          vendedor: usuario?.name || 'Vendedor desconhecido'
        };
      }));
      
      setVendas(vendasCompletas);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
      setError("Não foi possível carregar os dados das vendas.");
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar e ordenar vendas
  const vendasFiltradas = vendas
    .filter((venda) => {
      // Filtrar por período
      if (periodoSelecionado === "hoje") {
        const hoje = new Date().toISOString().split('T')[0];
        const dataVenda = new Date(venda.created_at).toISOString().split('T')[0];
        if (dataVenda !== hoje) return false;
      } else if (periodoSelecionado === "semana") {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
        if (new Date(venda.created_at) < umaSemanaAtras) return false;
      } else if (periodoSelecionado === "mes") {
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        if (new Date(venda.created_at) < umMesAtras) return false;
      }
      
      // Filtrar por status
      if (statusSelecionado !== "todos" && venda.payment_status !== statusSelecionado) {
        return false;
      }
      
      // Filtrar por método de pagamento
      if (metodoPagamentoSelecionado !== "todos" && venda.payment_method !== metodoPagamentoSelecionado) {
        return false;
      }
      
      // Filtrar por termo de busca
      if (termoBusca.trim() !== "") {
        const termo = termoBusca.toLowerCase();
        const clienteNome = venda.cliente?.nome?.toLowerCase() || "";
        const vendaId = venda.id.toLowerCase();
        
        return clienteNome.includes(termo) || vendaId.includes(termo);
      }
      
      return true;
    })
    .sort((a, b) => {
      // Ordenar por campo
      const { campo, ordem } = ordenacao;
      
      if (campo === "created_at") {
        return ordem === "asc" 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (campo === "total") {
        return ordem === "asc" 
          ? a.total - b.total
          : b.total - a.total;
      }
      
      return 0;
    });
  
  // Função para formatar a data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Função para formatar o valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Função para mapear o método de pagamento para um texto legível
  const mapearMetodoPagamento = (metodo: string) => {
    const mapeamento: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'transfer': 'Transferência',
    };
    
    return mapeamento[metodo] || metodo;
  };
  
  // Função para mapear o status para um texto legível
  const mapearStatus = (status: string) => {
    const mapeamento: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'canceled': 'Cancelado',
    };
    
    return mapeamento[status] || status;
  };
  
  // Função para obter a classe CSS para o status
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-green-100 text-green-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'canceled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  return (
    <DashboardLayout title="Vendas">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            Gerenciamento de Vendas
          </h1>
            <Link
              href="/dashboard/vendas/nova"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700 sm:w-auto"
            >
            <Plus className="h-5 w-5" />
              Nova Venda
            </Link>
        </div>
        
        {/* Filtros e busca */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar venda..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-400" />
              <select
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="todos">Todos os períodos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Últimos 7 dias</option>
                <option value="mes">Último mês</option>
              </select>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 rounded-full ${
                statusSelecionado === "paid" ? "bg-green-500" : 
                statusSelecionado === "pending" ? "bg-yellow-500" : 
                statusSelecionado === "canceled" ? "bg-red-500" : 
                "bg-neutral-400"
              }`} />
              <select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="todos">Todos os status</option>
                <option value="paid">Pagos</option>
                <option value="pending">Pendentes</option>
                <option value="canceled">Cancelados</option>
              </select>
            </div>
          </div>
          
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-neutral-400" />
              <select
                value={metodoPagamentoSelecionado}
                onChange={(e) => setMetodoPagamentoSelecionado(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 py-2 pl-3 pr-10 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="todos">Todos os métodos</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Visualização das vendas */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <p className="mt-2 text-neutral-500">Carregando vendas...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={carregarVendas}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
              >
                Tentar novamente
              </button>
          </div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="p-6 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-2 text-lg font-medium text-neutral-900">Nenhuma venda encontrada</h3>
              <p className="mt-1 text-neutral-500">
                {termoBusca || periodoSelecionado !== "todos" || statusSelecionado !== "todos" || metodoPagamentoSelecionado !== "todos"
                  ? "Tente ajustar os filtros de busca para encontrar o que você está procurando."
                  : "Você ainda não registrou nenhuma venda. Clique em 'Nova Venda' para começar."}
              </p>
        </div>
          ) : (
          <div className="overflow-x-auto">
              <table className="w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500"
                      onClick={() => setOrdenacao({ 
                        campo: "created_at", 
                        ordem: ordenacao.campo === "created_at" && ordenacao.ordem === "asc" ? "desc" : "asc" 
                      })}
                    >
                      <div className="flex items-center gap-1 cursor-pointer">
                        Data
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Itens
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500"
                      onClick={() => setOrdenacao({ 
                        campo: "total", 
                        ordem: ordenacao.campo === "total" && ordenacao.ordem === "asc" ? "desc" : "asc" 
                      })}
                    >
                      <div className="flex items-center justify-end gap-1 cursor-pointer">
                        Valor
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Pagamento
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {vendasFiltradas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-neutral-900">
                        {formatarData(venda.created_at)}
                    </td>
                      <td className="px-4 py-4 text-sm text-neutral-900">
                        {venda.cliente ? (
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                              <User className="h-4 w-4 text-neutral-600" />
                            </div>
                            <div>
                              <div className="font-medium">{venda.cliente.nome}</div>
                              <div className="text-xs text-neutral-500">ID: {venda.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-500">Cliente não identificado</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-neutral-900">
                        {venda.itens?.length || 0} {(venda.itens?.length || 0) === 1 ? "item" : "itens"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-neutral-900">
                        {formatarValor(venda.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center text-sm">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(venda.payment_status)}`}>
                          {mapearStatus(venda.payment_status)}
                        </span>
                    </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-neutral-900">
                        {mapearMetodoPagamento(venda.payment_method)}
                    </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/vendas/${venda.id}`}
                            className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                          <div className="relative">
                        <button
                              className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                              <MoreHorizontal className="h-4 w-4" />
                        </button>
                          </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 