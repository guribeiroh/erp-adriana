"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Filter, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  CircleDollarSign
} from "lucide-react";
import { fetchTransacoes, obterResumoFinanceiro } from "@/lib/services/financialService";

// Tipo para resumo mensal
interface ResumoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export default function FluxoCaixaPage() {
  // Estados
  const [periodoInicio, setPeriodoInicio] = useState<string>("");
  const [periodoFim, setPeriodoFim] = useState<string>("");
  const [resumoFinanceiro, setResumoFinanceiro] = useState<{
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
    receitasPorCategoria: Record<string, number>;
    despesasPorCategoria: Record<string, number>;
  } | null>(null);
  const [resumosMensais, setResumosMensais] = useState<ResumoMensal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'mes' | 'trimestre' | 'ano' | 'personalizado'>('mes');
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    atualizarPeriodo(periodoSelecionado);
    carregarDados();
  }, []);
  
  // Função para atualizar período baseado na seleção
  const atualizarPeriodo = (periodo: 'mes' | 'trimestre' | 'ano' | 'personalizado') => {
    const hoje = new Date();
    let dataInicio: Date;
    
    switch (periodo) {
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'trimestre':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        break;
      case 'personalizado':
        // Não alterar as datas se for personalizado
        return;
    }
    
    // Formatar datas para o formato ISO
    setPeriodoInicio(dataInicio.toISOString().split('T')[0]);
    setPeriodoFim(hoje.toISOString().split('T')[0]);
    setPeriodoSelecionado(periodo);
  };
  
  // Função para carregar dados
  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Carregar resumo financeiro
      const resumo = await obterResumoFinanceiro(periodoInicio, periodoFim);
      setResumoFinanceiro(resumo);
      
      // Carregar transações para criar resumo mensal
      const result = await fetchTransacoes({
        dataInicio: periodoInicio,
        dataFim: periodoFim,
        limit: 1000 // Valor alto para pegar todas as transações do período
      });
      
      // Agrupar por mês para gerar resumo mensal
      const transacoesPorMes: Record<string, { receitas: number; despesas: number }> = {};
      
      result.transacoes.forEach(transacao => {
        if (transacao.status === 'cancelada') return;
        
        const data = new Date(transacao.data);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        
        if (!transacoesPorMes[chave]) {
          transacoesPorMes[chave] = { receitas: 0, despesas: 0 };
        }
        
        if (transacao.tipo === 'receita') {
          transacoesPorMes[chave].receitas += transacao.valor;
        } else {
          transacoesPorMes[chave].despesas += transacao.valor;
        }
      });
      
      // Converter para array de resumos mensais
      const resumos: ResumoMensal[] = Object.entries(transacoesPorMes)
        .map(([chave, valores]) => {
          const [ano, mes] = chave.split('-');
          const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1, 1).toLocaleString('pt-BR', { month: 'long' });
          
          return {
            mes: `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${ano}`,
            receitas: valores.receitas,
            despesas: valores.despesas,
            saldo: valores.receitas - valores.despesas
          };
        })
        .sort((a, b) => {
          // Ordenar por data (mais recente primeiro)
          const [mesA, anoA] = a.mes.split('/');
          const [mesB, anoB] = b.mes.split('/');
          
          const mesIndiceA = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                          "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
                          .findIndex(m => mesA.toLowerCase().includes(m));
                          
          const mesIndiceB = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                          "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
                          .findIndex(m => mesB.toLowerCase().includes(m));
          
          // Comparar primeiro por ano, depois por mês
          return parseInt(anoB) !== parseInt(anoA) 
            ? parseInt(anoB) - parseInt(anoA) 
            : mesIndiceB - mesIndiceA;
        });
      
      setResumosMensais(resumos);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  };
  
  // Formatador de valores monetários
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Handler para alterar período personalizado
  const handlePeriodoChange = () => {
    if (periodoInicio && periodoFim) {
      setPeriodoSelecionado('personalizado');
      carregarDados();
    }
  };
  
  return (
    <DashboardLayout title="Fluxo de Caixa">
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
              Fluxo de Caixa
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              Exportar Relatório
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">Período</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => atualizarPeriodo('mes')}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    periodoSelecionado === 'mes'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  Mês Atual
                </button>
                <button
                  onClick={() => atualizarPeriodo('trimestre')}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    periodoSelecionado === 'trimestre'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  Último Trimestre
                </button>
                <button
                  onClick={() => atualizarPeriodo('ano')}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    periodoSelecionado === 'ano'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  Ano Atual
                </button>
              </div>
            </div>
            
            <div className="flex items-end gap-3">
              <div>
                <label htmlFor="periodoInicio" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  De
                </label>
                <input
                  type="date"
                  id="periodoInicio"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              <div>
                <label htmlFor="periodoFim" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Até
                </label>
                <input
                  type="date"
                  id="periodoFim"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              <button
                onClick={handlePeriodoChange}
                className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Filter className="h-4 w-4" />
                Aplicar
              </button>
            </div>
          </div>
        </div>
        
        {/* Conteúdo */}
        {carregando ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600 mx-auto"></div>
              <p className="text-neutral-600">Carregando informações financeiras...</p>
            </div>
          </div>
        ) : erro ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="mb-2 text-neutral-900">Erro ao carregar dados financeiros</p>
              <p className="text-neutral-600">{erro}</p>
              <button
                onClick={() => carregarDados()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de resumo */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Saldo */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Saldo no Período</h3>
                </div>
                <p className={`text-2xl font-semibold ${
                  (resumoFinanceiro?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatarValor(resumoFinanceiro?.saldo || 0)}
                </p>
              </div>
              
              {/* Receitas */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Total de Receitas</h3>
                </div>
                <p className="text-2xl font-semibold text-green-600">
                  {formatarValor(resumoFinanceiro?.totalReceitas || 0)}
                </p>
              </div>
              
              {/* Despesas */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-full bg-red-100 p-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Total de Despesas</h3>
                </div>
                <p className="text-2xl font-semibold text-red-600">
                  {formatarValor(resumoFinanceiro?.totalDespesas || 0)}
                </p>
              </div>
            </div>
            
            {/* Gráfico simulado */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Evolução Financeira</h2>
              <div className="h-[300px] rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                  <CircleDollarSign className="mx-auto h-12 w-12 text-neutral-400" />
                  <p className="mt-2 text-neutral-600">Gráfico de evolução financeira</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    (Em um ambiente de produção, aqui seria renderizado um gráfico real)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Resumo mensal */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Resumo Mensal</h2>
              
              {resumosMensais.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Mês</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Receitas</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Despesas</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {resumosMensais.map((resumo, index) => (
                        <tr key={index} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-900">{resumo.mes}</td>
                          <td className="px-4 py-3 text-green-600">{formatarValor(resumo.receitas)}</td>
                          <td className="px-4 py-3 text-red-600">{formatarValor(resumo.despesas)}</td>
                          <td className={`px-4 py-3 font-medium ${
                            resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarValor(resumo.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-neutral-300 bg-neutral-50 font-medium">
                      <tr>
                        <td className="px-4 py-3 text-neutral-900">Total</td>
                        <td className="px-4 py-3 text-green-600">{formatarValor(resumoFinanceiro?.totalReceitas || 0)}</td>
                        <td className="px-4 py-3 text-red-600">{formatarValor(resumoFinanceiro?.totalDespesas || 0)}</td>
                        <td className={`px-4 py-3 font-medium ${
                          (resumoFinanceiro?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatarValor(resumoFinanceiro?.saldo || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                  <p className="text-neutral-600">Nenhum dado disponível para o período selecionado.</p>
                </div>
              )}
            </div>
            
            {/* Categorias */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Receitas por categoria */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-medium text-neutral-900">Receitas por Categoria</h2>
                
                {resumoFinanceiro?.receitasPorCategoria && 
                 Object.keys(resumoFinanceiro.receitasPorCategoria).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(resumoFinanceiro.receitasPorCategoria)
                      .sort((a, b) => b[1] - a[1])
                      .map(([categoria, valor]) => (
                        <div key={categoria} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3">
                          <span className="font-medium text-neutral-800">{categoria}</span>
                          <span className="text-green-600">{formatarValor(valor)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                    <p className="text-neutral-600">Nenhum dado disponível para o período selecionado.</p>
                  </div>
                )}
              </div>
              
              {/* Despesas por categoria */}
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-medium text-neutral-900">Despesas por Categoria</h2>
                
                {resumoFinanceiro?.despesasPorCategoria && 
                 Object.keys(resumoFinanceiro.despesasPorCategoria).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(resumoFinanceiro.despesasPorCategoria)
                      .sort((a, b) => b[1] - a[1])
                      .map(([categoria, valor]) => (
                        <div key={categoria} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3">
                          <span className="font-medium text-neutral-800">{categoria}</span>
                          <span className="text-red-600">{formatarValor(valor)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                    <p className="text-neutral-600">Nenhum dado disponível para o período selecionado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 