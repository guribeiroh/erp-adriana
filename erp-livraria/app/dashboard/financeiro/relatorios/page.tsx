"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import {
  ArrowLeft,
  Calendar,
  Download,
  LineChart,
  BarChart3,
  PieChart,
  Filter,
  Printer,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatBrazilianDate } from '@/lib/utils/date';

// Tipos
type Periodo = "7dias" | "30dias" | "3meses" | "6meses" | "12meses" | "personalizado";
type TipoRelatorio = "fluxo-caixa" | "receitas-despesas" | "categorias";

// Dados simulados
const dadosFluxoCaixa = [
  { data: "2023-04-01", receitas: 4200, despesas: 2800, saldo: 1400 },
  { data: "2023-04-02", receitas: 3800, despesas: 1900, saldo: 1900 },
  { data: "2023-04-03", receitas: 4500, despesas: 3100, saldo: 1400 },
  { data: "2023-04-04", receitas: 3200, despesas: 2600, saldo: 600 },
  { data: "2023-04-05", receitas: 5100, despesas: 2900, saldo: 2200 },
  { data: "2023-04-06", receitas: 4800, despesas: 3300, saldo: 1500 },
  { data: "2023-04-07", receitas: 5500, despesas: 2700, saldo: 2800 },
];

const dadosReceitasDespesasMensais = [
  { mes: "Jan", receitas: 38500, despesas: 29800 },
  { mes: "Fev", receitas: 42300, despesas: 31200 },
  { mes: "Mar", receitas: 45600, despesas: 33400 },
  { mes: "Abr", receitas: 39200, despesas: 30100 },
  { mes: "Mai", receitas: 43700, despesas: 32500 },
  { mes: "Jun", receitas: 48900, despesas: 35800 },
];

const dadosCategorias = {
  receitas: [
    { categoria: "Vendas", valor: 35800 },
    { categoria: "Serviços", valor: 12300 },
    { categoria: "Investimentos", valor: 3500 },
    { categoria: "Outros", valor: 1900 },
  ],
  despesas: [
    { categoria: "Estoque", valor: 18700 },
    { categoria: "Salários", valor: 9800 },
    { categoria: "Aluguel", valor: 3500 },
    { categoria: "Marketing", valor: 2300 },
    { categoria: "Impostos", valor: 5200 },
    { categoria: "Outros", valor: 1900 },
  ]
};

export default function RelatoriosFinanceirosPage() {
  // Estados
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("fluxo-caixa");
  const [periodo, setPeriodo] = useState<Periodo>("30dias");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [showPeriodoPersonalizado, setShowPeriodoPersonalizado] = useState(false);

  // Formatador de valores monetários
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Formatador de datas
  const formatarData = (dataString: string) => {
    return formatBrazilianDate(dataString);
  };

  // Calcular totais para o relatório de fluxo de caixa
  const totaisFluxoCaixa = dadosFluxoCaixa.reduce(
    (acc, item) => {
      acc.receitas += item.receitas;
      acc.despesas += item.despesas;
      acc.saldo += item.saldo;
      return acc;
    },
    { receitas: 0, despesas: 0, saldo: 0 }
  );

  // Calcular totais para o relatório de receitas e despesas mensais
  const totaisReceitasDespesas = dadosReceitasDespesasMensais.reduce(
    (acc, item) => {
      acc.receitas += item.receitas;
      acc.despesas += item.despesas;
      return acc;
    },
    { receitas: 0, despesas: 0 }
  );

  // Calcular totais para o relatório de categorias
  const totaisCategorias = {
    receitas: dadosCategorias.receitas.reduce((acc, item) => acc + item.valor, 0),
    despesas: dadosCategorias.despesas.reduce((acc, item) => acc + item.valor, 0),
  };

  // Handler para alternar período personalizado
  const handlePeriodoChange = (novoPeriodo: Periodo) => {
    setPeriodo(novoPeriodo);
    setShowPeriodoPersonalizado(novoPeriodo === "personalizado");
  };

  // Handler para exportar relatório
  const handleExportarRelatorio = () => {
    alert("Exportando relatório em CSV...");
  };

  // Handler para imprimir relatório
  const handleImprimirRelatorio = () => {
    alert("Preparando relatório para impressão...");
  };

  // Renderizar o título do relatório
  const renderTituloRelatorio = () => {
    switch (tipoRelatorio) {
      case "fluxo-caixa":
        return "Relatório de Fluxo de Caixa";
      case "receitas-despesas":
        return "Relatório de Receitas e Despesas";
      case "categorias":
        return "Relatório por Categorias";
      default:
        return "Relatório Financeiro";
    }
  };

  // Renderizar o ícone do relatório
  const renderIconeRelatorio = () => {
    switch (tipoRelatorio) {
      case "fluxo-caixa":
        return <LineChart className="h-5 w-5" />;
      case "receitas-despesas":
        return <BarChart3 className="h-5 w-5" />;
      case "categorias":
        return <PieChart className="h-5 w-5" />;
      default:
        return <LineChart className="h-5 w-5" />;
    }
  };

  // Renderizar o conteúdo do relatório
  const renderConteudoRelatorio = () => {
    switch (tipoRelatorio) {
      case "fluxo-caixa":
        return renderRelatorioFluxoCaixa();
      case "receitas-despesas":
        return renderRelatorioReceitasDespesas();
      case "categorias":
        return renderRelatorioCategorias();
      default:
        return null;
    }
  };

  // Renderizar relatório de fluxo de caixa
  const renderRelatorioFluxoCaixa = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-neutral-600">Total de Receitas</h3>
            <p className="text-2xl font-bold text-green-600">{formatarValor(totaisFluxoCaixa.receitas)}</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-neutral-600">Total de Despesas</h3>
            <p className="text-2xl font-bold text-red-600">{formatarValor(totaisFluxoCaixa.despesas)}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-neutral-600">Saldo Final</h3>
            <p className="text-2xl font-bold text-blue-600">{formatarValor(totaisFluxoCaixa.saldo)}</p>
          </div>
        </div>

        {/* Gráfico (simulado com div) */}
        <div className="h-72 rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-base font-medium text-neutral-700">Fluxo de Caixa Diário</h3>
          <div className="h-56 bg-neutral-50 p-4 text-center text-neutral-400">
            [Gráfico de linha simulando o fluxo de caixa diário]
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h3 className="text-base font-medium text-neutral-800">Detalhamento Diário</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-sm text-neutral-600">
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Data</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Receitas</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Despesas</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Saldo do Dia</th>
                </tr>
              </thead>
              <tbody>
                {dadosFluxoCaixa.map((item, index) => (
                  <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-6 py-3">{formatarData(item.data)}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-green-600">{formatarValor(item.receitas)}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-red-600">{formatarValor(item.despesas)}</td>
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-blue-600">{formatarValor(item.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200 bg-neutral-50 text-left font-medium text-neutral-800">
                  <td className="whitespace-nowrap px-6 py-3">Total</td>
                  <td className="whitespace-nowrap px-6 py-3 font-bold text-green-600">{formatarValor(totaisFluxoCaixa.receitas)}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-bold text-red-600">{formatarValor(totaisFluxoCaixa.despesas)}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-bold text-blue-600">{formatarValor(totaisFluxoCaixa.saldo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar relatório de receitas e despesas
  const renderRelatorioReceitasDespesas = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-neutral-600">Total de Receitas</h3>
            <p className="text-2xl font-bold text-green-600">{formatarValor(totaisReceitasDespesas.receitas)}</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-neutral-600">Total de Despesas</h3>
            <p className="text-2xl font-bold text-red-600">{formatarValor(totaisReceitasDespesas.despesas)}</p>
          </div>
          <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
            <h3 className="mb-1 text-sm font-medium text-neutral-600">Resultado</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-neutral-900">
                {formatarValor(totaisReceitasDespesas.receitas - totaisReceitasDespesas.despesas)}
              </p>
              {totaisReceitasDespesas.receitas > totaisReceitasDespesas.despesas ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Gráfico (simulado com div) */}
        <div className="h-72 rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="mb-3 text-base font-medium text-neutral-700">Comparativo Mensal</h3>
          <div className="h-56 bg-neutral-50 p-4 text-center text-neutral-400">
            [Gráfico de barras comparando receitas e despesas mensais]
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h3 className="text-base font-medium text-neutral-800">Detalhamento Mensal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-sm text-neutral-600">
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Mês</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Receitas</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Despesas</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Resultado</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Variação</th>
                </tr>
              </thead>
              <tbody>
                {dadosReceitasDespesasMensais.map((item, index) => (
                  <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-6 py-3">{item.mes}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-green-600">{formatarValor(item.receitas)}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-red-600">{formatarValor(item.despesas)}</td>
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-neutral-900">
                      {formatarValor(item.receitas - item.despesas)}
                    </td>
                    <td className="px-6 py-3">
                      {item.receitas > item.despesas ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUp className="h-4 w-4" />
                          <span>{Math.round(((item.receitas - item.despesas) / item.despesas) * 100)}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <ArrowDown className="h-4 w-4" />
                          <span>{Math.round(((item.despesas - item.receitas) / item.receitas) * 100)}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200 bg-neutral-50 text-left font-medium text-neutral-800">
                  <td className="whitespace-nowrap px-6 py-3">Total</td>
                  <td className="whitespace-nowrap px-6 py-3 font-bold text-green-600">
                    {formatarValor(totaisReceitasDespesas.receitas)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-bold text-red-600">
                    {formatarValor(totaisReceitasDespesas.despesas)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 font-bold text-neutral-900">
                    {formatarValor(totaisReceitasDespesas.receitas - totaisReceitasDespesas.despesas)}
                  </td>
                  <td className="px-6 py-3">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar relatório de categorias
  const renderRelatorioCategorias = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Gráficos (simulados com divs) */}
          <div className="h-64 rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-base font-medium text-green-600">Receitas por Categoria</h3>
            <div className="h-48 bg-neutral-50 p-4 text-center text-neutral-400">
              [Gráfico de pizza mostrando receitas por categoria]
            </div>
          </div>

          <div className="h-64 rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-base font-medium text-red-600">Despesas por Categoria</h3>
            <div className="h-48 bg-neutral-50 p-4 text-center text-neutral-400">
              [Gráfico de pizza mostrando despesas por categoria]
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Tabela de receitas por categoria */}
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h3 className="text-base font-medium text-green-600">Receitas por Categoria</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-sm text-neutral-600">
                    <th className="whitespace-nowrap px-6 py-3 font-medium">Categoria</th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">Valor</th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosCategorias.receitas.map((item, index) => (
                    <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-6 py-3">{item.categoria}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-green-600">{formatarValor(item.valor)}</td>
                      <td className="whitespace-nowrap px-6 py-3">
                        {Math.round((item.valor / totaisCategorias.receitas) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200 bg-neutral-50 text-left font-medium text-neutral-800">
                    <td className="whitespace-nowrap px-6 py-3">Total</td>
                    <td className="whitespace-nowrap px-6 py-3 font-bold text-green-600">
                      {formatarValor(totaisCategorias.receitas)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 font-bold">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tabela de despesas por categoria */}
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h3 className="text-base font-medium text-red-600">Despesas por Categoria</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-sm text-neutral-600">
                    <th className="whitespace-nowrap px-6 py-3 font-medium">Categoria</th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">Valor</th>
                    <th className="whitespace-nowrap px-6 py-3 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosCategorias.despesas.map((item, index) => (
                    <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-6 py-3">{item.categoria}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-red-600">{formatarValor(item.valor)}</td>
                      <td className="whitespace-nowrap px-6 py-3">
                        {Math.round((item.valor / totaisCategorias.despesas) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200 bg-neutral-50 text-left font-medium text-neutral-800">
                    <td className="whitespace-nowrap px-6 py-3">Total</td>
                    <td className="whitespace-nowrap px-6 py-3 font-bold text-red-600">
                      {formatarValor(totaisCategorias.despesas)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 font-bold">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Relatórios Financeiros">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/financeiro"
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Relatórios Financeiros</h1>
        </div>
        
        {/* Controles do relatório */}
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          {/* Tipo de relatório */}
          <div className="space-y-1">
            <label htmlFor="tipo-relatorio" className="block text-sm font-medium text-neutral-700">
              Tipo de Relatório
            </label>
            <select
              id="tipo-relatorio"
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
              className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 md:w-48"
            >
              <option value="fluxo-caixa">Fluxo de Caixa</option>
              <option value="receitas-despesas">Receitas e Despesas</option>
              <option value="categorias">Por Categorias</option>
            </select>
          </div>
          
          {/* Período */}
          <div className="space-y-1">
            <label htmlFor="periodo" className="block text-sm font-medium text-neutral-700">
              Período
            </label>
            <select
              id="periodo"
              value={periodo}
              onChange={(e) => handlePeriodoChange(e.target.value as Periodo)}
              className="w-full rounded-lg border border-neutral-300 py-2 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 md:w-48"
            >
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="3meses">Últimos 3 meses</option>
              <option value="6meses">Últimos 6 meses</option>
              <option value="12meses">Últimos 12 meses</option>
              <option value="personalizado">Período personalizado</option>
            </select>
          </div>

          {/* Período personalizado */}
          {showPeriodoPersonalizado && (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <label htmlFor="data-inicio" className="block text-sm font-medium text-neutral-700">
                  De
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    id="data-inicio"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="data-fim" className="block text-sm font-medium text-neutral-700">
                  Até
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    id="data-fim"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>
              <button
                className="rounded-lg border border-primary-500 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                Aplicar
              </button>
            </div>
          )}
          
          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportarRelatorio}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={handleImprimirRelatorio}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>
        
        {/* Título do relatório */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
          {renderIconeRelatorio()}
          <h2 className="text-xl font-semibold text-neutral-900">{renderTituloRelatorio()}</h2>
        </div>
        
        {/* Conteúdo do relatório */}
        {renderConteudoRelatorio()}
      </div>
    </DashboardLayout>
  );
} 