"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { BookOpen, DollarSign, ShoppingCart, Users, ArrowRight, Clock, ArrowUpRight, ArrowDownRight, Plus, Calendar, Package } from "lucide-react";
import Link from "next/link";
import PDVButton from "@/components/pdv/PDVButton";
import { DashboardSummary, ActivityItem, getDashboardSummary } from "@/lib/services/dashboardService";

export default function DashboardPage() {
  // Estado para armazenar os dados do dashboard
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Efeito para carregar os dados do dashboard
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardSummary();
        console.log('Dados do dashboard carregados:', data);
        setDashboardData(data);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Determinar o tipo de tendência para exibição
  const getTrendType = (trend: number): 'positive' | 'negative' | 'neutral' => {
    if (trend > 0) return 'positive';
    if (trend < 0) return 'negative';
    return 'neutral';
  };

  // Formatação do valor de tendência
  const formatTrend = (trend: number): string => {
    return trend > 0 ? `+${trend}%` : `${trend}%`;
  };

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary-200 mb-4"></div>
            <div className="h-4 w-48 bg-neutral-200 rounded mb-2"></div>
            <div className="h-3 w-32 bg-neutral-100 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <h3 className="font-medium mb-2">Erro ao carregar dados</h3>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Cabeçalho com saudação */}
        <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white shadow-soft">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="mb-1 text-2xl font-bold">Bom dia, Usuário!</h1>
              <p className="text-primary-100">Aqui está um resumo da sua livraria para hoje.</p>
            </div>
          </div>
        </div>

        {/* Cards com resumo */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard 
            title="Vendas Hoje" 
            value={formatCurrency(dashboardData?.salesTotal.today || 0)} 
            icon={ShoppingCart} 
            trend={formatTrend(dashboardData?.salesTotal.trend || 0)} 
            trendType={getTrendType(dashboardData?.salesTotal.trend || 0)}
            href="/dashboard/vendas"
          />
          <SummaryCard 
            title="Clientes Ativos" 
            value={String(dashboardData?.customers.active || 0)} 
            icon={Users} 
            trend={formatTrend(dashboardData?.customers.trend || 0)} 
            trendType={getTrendType(dashboardData?.customers.trend || 0)}
            href="/dashboard/clientes"
          />
          <SummaryCard 
            title="Livros em Estoque" 
            value={String(dashboardData?.inventory.totalBooks || 0)} 
            icon={BookOpen} 
            trend={formatTrend(dashboardData?.inventory.trend || 0)} 
            trendType={getTrendType(dashboardData?.inventory.trend || 0)}
            href="/dashboard/estoque"
          />
          <SummaryCard 
            title="Produtos Cadastrados" 
            value={String(dashboardData?.inventory.totalProducts || 0)} 
            icon={Package} 
            trend={formatTrend(dashboardData?.inventory.trend || 8)} 
            trendType={getTrendType(dashboardData?.inventory.trend || 8)}
            href="/dashboard/produtos"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Últimas vendas */}
          <div className="col-span-1 lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Últimas Vendas</h2>
            </div>

            <div className="space-y-4">
              {dashboardData?.recentActivities.map((activity) => (
                <DynamicActivityItem 
                  key={activity.id}
                  activity={activity}
                />
              ))}

              {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
                <div className="text-center py-6 text-neutral-500">
                  <p>Nenhuma atividade recente registrada.</p>
                </div>
              )}
            </div>
          </div>

          {/* Acesso rápido */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAccessButton 
                label="PDV" 
                href="/dashboard/pdv"
                icon={ShoppingCart}
                iconColor="bg-red-100 text-red-600"
                highlight={true}
              />
              <QuickAccessButton 
                label="Nova Venda" 
                href="/dashboard/vendas/nova"
                icon={ShoppingCart}
                iconColor="bg-green-100 text-green-600"
              />
              <QuickAccessButton 
                label="Novo Cliente" 
                href="/dashboard/clientes/novo"
                icon={Users}
                iconColor="bg-amber-100 text-amber-600"
              />
              <QuickAccessButton 
                label="Novo Produto" 
                href="/dashboard/produtos/novo"
                icon={Package}
                iconColor="bg-indigo-100 text-indigo-600"
              />
            </div>

            {/* Status de estoque baixo */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-700">
                <BookOpen className="h-4 w-4 text-neutral-500" />
                Produtos com Estoque Baixo
              </h3>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">
                  {dashboardData?.inventory.lowStock || 0} produtos com estoque baixo
                </p>
                <Link href="/dashboard/estoque" 
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-1 inline-block">
                  Verificar agora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  href: string;
}

function SummaryCard({ title, value, icon: Icon, trend, trendType, href }: SummaryCardProps) {
  return (
    <Link href={href} className="group rounded-xl border border-neutral-200 bg-white p-6 transition hover:shadow-card shadow-sm">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
        </div>
        <div className="rounded-full bg-primary-100 p-3 text-primary-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        {trendType === 'positive' && (
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        )}
        {trendType === 'negative' && (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
        <span 
          className={`text-sm font-medium ${
            trendType === 'positive' ? 'text-green-600' : 
            trendType === 'negative' ? 'text-red-600' : 
            'text-neutral-600'
          }`}
        >
          {trend}
        </span>
        <span className="text-sm text-neutral-500 ml-1">vs. mês anterior</span>
      </div>
    </Link>
  );
}

interface QuickAccessButtonProps {
  label: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  highlight?: boolean;
}

function QuickAccessButton({ label, href, icon: Icon, iconColor, highlight = false }: QuickAccessButtonProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
        highlight 
          ? 'border-primary-300 bg-primary-50 hover:bg-primary-100' 
          : 'border-neutral-200 hover:border-primary-200 hover:bg-primary-50'
      }`}
    >
      <div className={`mb-2 rounded-full p-2 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className={`text-xs font-medium ${highlight ? 'text-primary-700' : 'text-neutral-700'}`}>{label}</span>
    </Link>
  );
}

// Componente para renderizar atividades dinamicamente com base no tipo
function DynamicActivityItem({ activity }: { activity: ActivityItem }) {
  // Mapear ícones do tipo string para componentes React
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCart': return ShoppingCart;
      case 'BookOpen': return BookOpen;
      case 'Users': return Users;
      case 'Package': return Package;
      case 'DollarSign': return DollarSign;
      default: return ArrowRight;
    }
  };

  const Icon = getIcon(activity.icon);

  return (
    <Link href={activity.link || '#'} className="flex items-start gap-4 hover:bg-neutral-50 p-2 -mx-2 rounded-lg transition-colors">
      <div className={`mt-0.5 rounded-full p-2 ${activity.iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-neutral-900">{activity.title}</h3>
        <p className="text-sm text-neutral-600">{activity.description}</p>
        <span className="mt-1 inline-block text-xs text-neutral-500">
          <Clock className="mr-1 inline h-3 w-3" />
          {activity.time}
        </span>
      </div>
    </Link>
  );
} 