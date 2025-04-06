"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  BookOpen, 
  DollarSign, 
  Users
} from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="mt-1 text-sm text-gray-500">
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
      className="block bg-white rounded-lg border border-gray-200 shadow-sm p-6 transition-shadow hover:shadow-md"
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${iconColor}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
        Ver relatório
        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
} 