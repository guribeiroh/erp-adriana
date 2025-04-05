"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInventoryReport, InventoryReportData } from '@/lib/services/reportService';
import { 
  ArrowLeft, 
  Download, 
  RefreshCcw,
  Package,
  AlertCircle,
  BarChart2,
  DollarSign
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
  Legend
} from 'recharts';

// Cores para gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B'];

export default function RelatorioEstoquePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<InventoryReportData | null>(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInventoryReport();
      setReportData(data);
    } catch (err) {
      console.error('Erro ao carregar relatório de estoque:', err);
      setError('Não foi possível carregar o relatório. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
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
    let csv = 'Categoria,Valor Total,Porcentagem\n';
    
    // Dados de valor por categoria
    reportData.valueByCategory.forEach(item => {
      csv += `${item.category},${item.value},${item.percentage}\n`;
    });

    // Criar um blob e iniciar o download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Estoque</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral do inventário, itens com estoque baixo e mais vendidos
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {/* Resumo do estoque */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mt-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard 
                title="Total de Itens" 
                value={reportData.totalItems.toString()} 
                icon={Package} 
                iconColor="bg-blue-100 text-blue-600"
              />
              <SummaryCard 
                title="Valor Total do Estoque" 
                value={formatCurrency(reportData.totalValue)} 
                icon={DollarSign} 
                iconColor="bg-green-100 text-green-600"
              />
              <SummaryCard 
                title="Itens com Estoque Baixo" 
                value={reportData.lowStockItems.toString()} 
                icon={AlertCircle} 
                iconColor="bg-amber-100 text-amber-600"
              />
            </div>
          </div>
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Gráfico de valor por categoria */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Valor do Estoque por Categoria</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.valueByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="category"
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.valueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de itens mais vendidos */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Itens Mais Vendidos (Últimos 30 dias)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={reportData.topSellingItems}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="title" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [value, 'Quantidade']} />
                    <Bar dataKey="quantity" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Tabela de valor por categoria */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Valor do Estoque por Categoria</h3>
            </div>
            <div className="overflow-x-auto">
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
                  {reportData.valueByCategory.map((category, idx) => (
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
                            style={{ width: `${category.percentage}%` }}
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
                      {formatCurrency(reportData.totalValue)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Tabela de itens mais vendidos */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Top 10 Itens Mais Vendidos (Últimos 30 dias)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade Vendida
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita Gerada
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.topSellingItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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