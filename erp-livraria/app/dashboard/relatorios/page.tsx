"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  BookOpen, 
  DollarSign, 
  Users, 
  BarChart2,
  PieChart,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Relatórios</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acesse os relatórios gerenciais para análise do desempenho do negócio
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Relatório de Vendas */}
        <ReportCard 
          title="Vendas" 
          description="Analise o desempenho de vendas por período, categoria e clientes" 
          icon={ShoppingCart} 
          href="/dashboard/relatorios/vendas"
          iconColor="bg-green-100 text-green-600"
        />
        
        {/* Relatório de Estoque */}
        <ReportCard 
          title="Estoque" 
          description="Visão geral do inventário, itens com estoque baixo e mais vendidos" 
          icon={BookOpen} 
          href="/dashboard/relatorios/estoque"
          iconColor="bg-blue-100 text-blue-600"
        />
        
        {/* Relatório Financeiro */}
        <ReportCard 
          title="Financeiro" 
          description="Resultados financeiros, receitas, despesas e lucratividade" 
          icon={DollarSign} 
          href="/dashboard/relatorios/financeiro"
          iconColor="bg-purple-100 text-purple-600"
        />
        
        {/* Relatório de Clientes */}
        <ReportCard 
          title="Clientes" 
          description="Análise da base de clientes, frequência de compras e regiões" 
          icon={Users} 
          href="/dashboard/relatorios/clientes"
          iconColor="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Gráficos e Dashboards</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Dashboard de Vendas */}
          <DashboardCard 
            title="Dashboard de Vendas" 
            description="Visualize tendências e desempenho de vendas" 
            icon={BarChart2} 
            href="/dashboard/relatorios/dashboard-vendas"
          />
          
          {/* Dashboard Financeiro */}
          <DashboardCard 
            title="Dashboard Financeiro" 
            description="Acompanhe a saúde financeira do negócio" 
            icon={TrendingUp} 
            href="/dashboard/relatorios/dashboard-financeiro"
          />
          
          {/* Relatório Personalizado */}
          <DashboardCard 
            title="Relatório Personalizado" 
            description="Crie relatórios customizados conforme sua necessidade" 
            icon={PieChart} 
            href="/dashboard/relatorios/personalizado"
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Relatórios Programados</h2>
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="font-medium text-neutral-900">Relatórios Agendados</h3>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
              Agendar Novo Relatório
            </button>
          </div>
          
          <div className="divide-y divide-neutral-200">
            <ScheduledReport 
              title="Relatório Mensal de Vendas"
              frequency="Mensal (Todo dia 1)" 
              lastRun="01/04/2025"
              recipients="admin@livraria.com, gerente@livraria.com"
            />
            
            <ScheduledReport 
              title="Relatório Semanal de Estoque"
              frequency="Semanal (Toda segunda-feira)" 
              lastRun="01/04/2025"
              recipients="estoque@livraria.com"
            />
            
            <ScheduledReport 
              title="Relatório Diário de Vendas"
              frequency="Diário (23:00)" 
              lastRun="05/04/2025"
              recipients="vendas@livraria.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  iconColor: string;
}

function ReportCard({ title, description, icon: Icon, href, iconColor }: ReportCardProps) {
  return (
    <Link 
      href={href}
      className="block bg-white rounded-lg border border-neutral-200 p-6 transition-shadow hover:shadow-md"
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${iconColor}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-600">{description}</p>
      <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
        Ver relatório
        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

function DashboardCard({ title, description, icon: Icon, href }: DashboardCardProps) {
  return (
    <Link 
      href={href}
      className="flex items-start p-5 bg-white rounded-lg border border-neutral-200 transition-shadow hover:shadow-md"
    >
      <div className="mr-4 bg-neutral-100 rounded-lg p-3">
        <Icon className="h-5 w-5 text-neutral-700" />
      </div>
      <div>
        <h3 className="text-base font-medium text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
    </Link>
  );
}

interface ScheduledReportProps {
  title: string;
  frequency: string;
  lastRun: string;
  recipients: string;
}

function ScheduledReport({ title, frequency, lastRun, recipients }: ScheduledReportProps) {
  return (
    <div className="px-6 py-4 flex items-center justify-between flex-wrap">
      <div className="space-y-1 mb-2 sm:mb-0">
        <h4 className="font-medium text-neutral-900">{title}</h4>
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <p className="text-sm text-neutral-500 flex items-center">
            <Calendar className="mr-1 h-3.5 w-3.5" />
            {frequency}
          </p>
          <p className="text-sm text-neutral-500">Última execução: {lastRun}</p>
        </div>
        <p className="text-xs text-neutral-500">Destinatários: {recipients}</p>
      </div>
      <div className="flex space-x-2">
        <button className="text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded text-xs font-medium">
          Editar
        </button>
        <button className="text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded text-xs font-medium">
          Executar Agora
        </button>
      </div>
    </div>
  );
} 