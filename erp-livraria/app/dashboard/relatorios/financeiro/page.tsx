"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFinancialReport, FinancialReportData, ReportFilters, TimeRange } from '@/lib/services/reportService';
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Filter, 
  RefreshCcw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart
} from 'recharts';

// Cores para gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

export default function RelatorioFinanceiroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    timeRange: 'year'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Solicitando relatório financeiro com filtros:', filters);
      const data = await getFinancialReport(filters);
      console.log('Dados recebidos do relatório financeiro:', data);
      
      if (!data.revenueByCategory || data.revenueByCategory.length === 0) {
        console.warn('Nenhum dado de categoria recebido, gerando dados padrão');
      }
      
      setReportData(data);
    } catch (err) {
      console.error('Erro ao carregar relatório financeiro:', err);
      setError('Não foi possível carregar o relatório. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    loadReportData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportCSV = () => {
    if (!reportData) return;

    // Cabeçalho do CSV
    let csv = 'Mês,Lucro\n';
    
    // Dados de lucro por mês
    reportData.profitByMonth.forEach(item => {
      csv += `${item.date},${item.value}\n`;
    });

    // Criar um blob e iniciar o download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTimeRangeLabel = (timeRange: TimeRange): string => {
    const options: Record<TimeRange, string> = {
      today: 'Hoje',
      yesterday: 'Ontem',
      week: 'Últimos 7 dias',
      month: 'Este mês',
      quarter: 'Este trimestre',
      year: 'Este ano',
      custom: 'Período personalizado'
    };
    
    return options[timeRange] || 'Período desconhecido';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header com navegação e título */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/dashboard/relatorios" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar para Relatórios
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resultados financeiros, receitas, despesas e lucratividade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
          <button 
            onClick={loadReportData}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Área de filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4 shadow-sm mt-6">
          <h3 className="font-medium text-gray-900">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value as TimeRange)}
              >
                <option value="month">Este mês</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este ano</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            {filters.timeRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Todas as categorias"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Estado de carregando */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando relatório...</span>
        </div>
      )}
      
      {/* Estado de erro */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-6">
          <p>{error}</p>
          <button 
            onClick={loadReportData}
            className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {/* Conteúdo do relatório */}
      {!isLoading && !error && reportData && (
        <>
          {/* Cabeçalho do relatório */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar className="h-4 w-4" />
              <span>Período: {getTimeRangeLabel(filters.timeRange)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard 
                title="Receita Total" 
                value={formatCurrency(reportData.revenue)} 
                icon={DollarSign} 
                iconColor="bg-green-100 text-green-600"
              />
              <SummaryCard 
                title="Despesas Totais" 
                value={formatCurrency(reportData.expenses)} 
                icon={TrendingDown} 
                iconColor="bg-red-100 text-red-600"
              />
              <SummaryCard 
                title="Lucro" 
                value={formatCurrency(reportData.profit)} 
                icon={TrendingUp} 
                iconColor="bg-blue-100 text-blue-600"
              />
              <SummaryCard 
                title="Margem de Lucro" 
                value={`${reportData.profitMargin.toFixed(2)}%`} 
                icon={Percent} 
                iconColor="bg-purple-100 text-purple-600"
              />
            </div>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Gráfico de lucro por mês */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lucro por Período</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.profitByMonth}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#6366F1" 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de receita por categoria */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Receita por Categoria</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {reportData?.revenueByCategory && reportData.revenueByCategory.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={reportData.revenueByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="category"
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {reportData.revenueByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-gray-500">Nenhum dado de categoria disponível</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Tabela de receita por categoria */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Detalhamento por Categoria</h3>
            </div>
            <div className="overflow-x-auto">
              {reportData?.revenueByCategory && reportData.revenueByCategory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participação (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.revenueByCategory.map((category, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(category.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {category.percentage.toFixed(2)}%
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(category.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th scope="row" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(reportData.revenue)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Nenhum dado de categoria disponível</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Resumo financeiro */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Resumo Financeiro</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Receita Total</p>
                    <p className="text-lg font-medium text-gray-900">{formatCurrency(reportData.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Despesas Totais</p>
                    <p className="text-lg font-medium text-gray-900">{formatCurrency(reportData.expenses)}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Lucro</p>
                      <p className="text-lg font-medium text-gray-900">{formatCurrency(reportData.profit)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Margem de Lucro</p>
                      <p className="text-lg font-medium text-gray-900">{reportData.profitMargin.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
}

function SummaryCard({ title, value, icon: Icon, iconColor }: SummaryCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
} 