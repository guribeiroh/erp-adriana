"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  Plus, 
  TrendingDown, 
  ArrowDown,
  ChevronDown,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  Clock,
  CreditCard,
  Tag
} from "lucide-react";
import { fetchTransacoes, Transacao, updateTransacao, TransacaoStatus } from "@/lib/services/financialService";
import { formatBrazilianDate, getCurrentBrazilianDate } from '@/lib/utils/date';

export default function ContasPagarPage() {
  // Estados
  const [despesas, setDespesas] = useState<Transacao[]>([]);
  const [despesasFiltradas, setDespesasFiltradas] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizandoPagamento, setAtualizandoPagamento] = useState<string | null>(null);
  
  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroVencimento, setFiltroVencimento] = useState<"todos" | "atrasados" | "hoje" | "proximos">("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [ordenacao, setOrdenacao] = useState<"vencimento-asc" | "vencimento-desc" | "valor-asc" | "valor-desc">("vencimento-asc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Resumo
  const [totalPendente, setTotalPendente] = useState(0);
  const [totalAtrasado, setTotalAtrasado] = useState(0);
  const [totalProximosDias, setTotalProximosDias] = useState(0);
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarContasPagar();
  }, []);
  
  // Efeito para filtrar e ordenar
  useEffect(() => {
    aplicarFiltros();
  }, [despesas, busca, filtroVencimento, filtroCategoria, periodoInicio, periodoFim, ordenacao]);
  
  // Função para carregar contas a pagar
  const carregarContasPagar = async () => {
    setCarregando(true);
    setErro(null);
    console.log("[carregarContasPagar] Iniciando busca de contas a pagar..."); // Log de início
    
    try {
      // Buscar apenas despesas pendentes
      const result = await fetchTransacoes({
        tipo: "despesa",
        status: "pendente"
      });
      
      console.log("[carregarContasPagar] Busca concluída. Transações recebidas:", result.transacoes); // Log de sucesso
      setDespesas(result.transacoes);
      calcularResumo(result.transacoes);
    } catch (error) {
      console.error("[carregarContasPagar] Erro ao carregar contas a pagar:", error); // Log de erro existente
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  };
  
  // Função para calcular resumos
  const calcularResumo = (despesas: Transacao[]) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let pendente = 0;
    let atrasado = 0;
    let proximos = 0;
    
    despesas.forEach(despesa => {
      const valor = despesa.valor;
      pendente += valor;
      
      if (despesa.dataVencimento) {
        const dataVencimento = new Date(despesa.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        
        if (dataVencimento < hoje) {
          atrasado += valor;
        } else if (dataVencimento >= hoje && dataVencimento <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          proximos += valor;
        }
      }
    });
    
    setTotalPendente(pendente);
    setTotalAtrasado(atrasado);
    setTotalProximosDias(proximos);
  };
  
  // Função para aplicar filtros
  const aplicarFiltros = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let resultado = [...despesas];
    
    // Aplicar filtro de busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(d => 
        d.descricao.toLowerCase().includes(termoBusca) || 
        d.categoria.toLowerCase().includes(termoBusca) ||
        (d.observacoes && d.observacoes.toLowerCase().includes(termoBusca))
      );
    }
    
    // Aplicar filtro de vencimento
    if (filtroVencimento !== "todos") {
      resultado = resultado.filter(d => {
        if (!d.dataVencimento) return false;
        
        const dataVencimento = new Date(d.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        
        switch (filtroVencimento) {
          case "atrasados":
            return dataVencimento < hoje;
          case "hoje":
            return dataVencimento.getTime() === hoje.getTime();
          case "proximos":
            return dataVencimento > hoje && dataVencimento <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      });
    }
    
    // Aplicar filtro de categoria
    if (filtroCategoria !== "todas") {
      resultado = resultado.filter(d => d.categoria === filtroCategoria);
    }
    
    // Aplicar filtro de período
    if (periodoInicio) {
      resultado = resultado.filter(d => {
        if (!d.dataVencimento) return false;
        return d.dataVencimento >= periodoInicio;
      });
    }
    
    if (periodoFim) {
      resultado = resultado.filter(d => {
        if (!d.dataVencimento) return false;
        return d.dataVencimento <= periodoFim;
      });
    }
    
    // Aplicar ordenação
    switch (ordenacao) {
      case "vencimento-asc":
        resultado.sort((a, b) => {
          if (!a.dataVencimento) return 1;
          if (!b.dataVencimento) return -1;
          return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
        });
        break;
      case "vencimento-desc":
        resultado.sort((a, b) => {
          if (!a.dataVencimento) return 1;
          if (!b.dataVencimento) return -1;
          return new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime();
        });
        break;
      case "valor-asc":
        resultado.sort((a, b) => a.valor - b.valor);
        break;
      case "valor-desc":
        resultado.sort((a, b) => b.valor - a.valor);
        break;
    }
    
    setDespesasFiltradas(resultado);
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setBusca("");
    setFiltroVencimento("todos");
    setFiltroCategoria("todas");
    setPeriodoInicio("");
    setPeriodoFim("");
  };
  
  // Função para confirmar pagamento
  const confirmarPagamento = async (id: string) => {
    setAtualizandoPagamento(id);
    console.log(`[confirmarPagamento] Iniciando atualização para ID: ${id}`); // Log de início
    
    try {
      const updateData = {
        status: "confirmada" as TransacaoStatus,
        dataPagamento: new Date().toISOString().split('T')[0] // Usar formato YYYY-MM-DD
      };
      console.log(`[confirmarPagamento] Dados a serem enviados para updateTransacao:`, updateData); // Log dos dados
      
      // Atualizar status para confirmada e adicionar data de pagamento
      await updateTransacao(id, updateData);
      
      console.log(`[confirmarPagamento] Atualização via updateTransacao bem-sucedida para ID: ${id}. Recarregando dados...`); // Log de sucesso da API
      
      // Recarregar dados
      await carregarContasPagar();
    } catch (error) {
      // Capturar e logar erro específico da atualização
      console.error(`[confirmarPagamento] Erro específico ao chamar updateTransacao para ID: ${id}`, error); 
      alert("Erro ao confirmar pagamento. Verifique o console do navegador para mais detalhes."); // Alert mais informativo
    } finally {
      setAtualizandoPagamento(null);
      console.log(`[confirmarPagamento] Finalizando processo para ID: ${id}`); // Log de fim
    }
  };
  
  // Obter categorias únicas
  const categorias = Array.from(new Set(despesas.map(d => d.categoria))).sort();
  
  // Formatadores
  const formatarData = (dataString?: string) => {
    if (!dataString) return "-";
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Verificar se uma data está vencida
  const isVencida = (dataString?: string) => {
    if (!dataString) return false;
    
    // Obter a data atual no formato YYYY-MM-DD no fuso de Brasília
    const hojeStr = getCurrentBrazilianDate('date-string') as string;
    
    // Comparar as strings de data diretamente (no formato YYYY-MM-DD)
    return dataString < hojeStr;
  };
  
  // Verificar se uma data é hoje
  const isHoje = (dataString?: string) => {
    if (!dataString) return false;
    
    // Obter a data atual no formato YYYY-MM-DD no fuso de Brasília
    const hojeStr = getCurrentBrazilianDate('date-string') as string;
    
    // Comparar as strings de data diretamente
    return dataString === hojeStr;
  };
  
  return (
    <DashboardLayout title="Contas a Pagar">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/financeiro"
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              Contas a Pagar
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/financeiro/nova-despesa"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Nova Despesa
            </Link>
          </div>
        </div>
        
        {/* Cards de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total pendente */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-full bg-amber-100 p-1.5">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-medium text-neutral-600">Total Pendente</h3>
            </div>
            <p className="text-2xl font-semibold text-neutral-900">{formatarValor(totalPendente)}</p>
          </div>
          
          {/* Vencidas */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-full bg-red-100 p-1.5">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-sm font-medium text-neutral-600">Contas Atrasadas</h3>
            </div>
            <p className="text-2xl font-semibold text-red-600">{formatarValor(totalAtrasado)}</p>
          </div>
          
          {/* Próximos 7 dias */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-1.5">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-neutral-600">Próximos 7 dias</h3>
            </div>
            <p className="text-2xl font-semibold text-blue-600">{formatarValor(totalProximosDias)}</p>
          </div>
        </div>
        
        {/* Filtros e busca */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <input
                type="text"
                placeholder="Buscar despesas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Filter className="h-4 w-4" />
                Filtros
                <ChevronDown className={`h-4 w-4 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>
          
          {/* Painel de filtros expandível */}
          {mostrarFiltros && (
            <div className="border-t border-neutral-200 pt-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Vencimento</label>
                  <select
                    value={filtroVencimento}
                    onChange={(e) => setFiltroVencimento(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="todos">Todos</option>
                    <option value="atrasados">Atrasados</option>
                    <option value="hoje">Vence hoje</option>
                    <option value="proximos">Próximos 7 dias</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Categoria</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="todas">Todas</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ordenar por</label>
                  <select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="vencimento-asc">Vencimento (mais próximo)</option>
                    <option value="vencimento-desc">Vencimento (mais distante)</option>
                    <option value="valor-asc">Valor (menor)</option>
                    <option value="valor-desc">Valor (maior)</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={limparFiltros}
                    className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Lista de contas a pagar */}
        {carregando ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600 mx-auto"></div>
              <p className="text-neutral-600">Carregando contas a pagar...</p>
            </div>
          </div>
        ) : erro ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="mb-2 text-neutral-900">Erro ao carregar contas a pagar</p>
              <p className="text-neutral-600">{erro}</p>
              <button
                onClick={carregarContasPagar}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        ) : despesasFiltradas.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <ArrowDown className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-lg font-medium text-neutral-900">Nenhuma conta a pagar encontrada</h3>
            <p className="mt-1 text-neutral-600">
              {busca || filtroVencimento !== "todos" || filtroCategoria !== "todas" || periodoInicio || periodoFim
                ? "Tente ajustar os filtros para ver mais resultados."
                : "Você não tem contas pendentes de pagamento."}
            </p>
            {(busca || filtroVencimento !== "todos" || filtroCategoria !== "todas" || periodoInicio || periodoFim) && (
              <button
                onClick={limparFiltros}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Descrição</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Categoria</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Valor</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Vencimento</th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {despesasFiltradas.map((despesa) => (
                    <tr key={despesa.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 line-clamp-1">{despesa.descricao}</p>
                          {despesa.vinculoId && (
                            <p className="mt-1 text-xs text-neutral-500">
                              Ref: #{despesa.vinculoId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{despesa.categoria}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-red-600">
                        {formatarValor(despesa.valor)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-2">
                          {isVencida(despesa.dataVencimento) ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Atrasada
                            </span>
                          ) : isHoje(despesa.dataVencimento) ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Hoje
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Em dia
                            </span>
                          )}
                          <span className="text-sm text-neutral-600">
                            {formatarData(despesa.dataVencimento)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => confirmarPagamento(despesa.id)}
                            disabled={atualizandoPagamento === despesa.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            {atualizandoPagamento === despesa.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Pagar
                          </button>
                          
                          <Link
                            href={`/dashboard/financeiro/${despesa.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Detalhes
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 