"use client";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { BookOpen, DollarSign, ShoppingCart, Users, ArrowRight, Clock, ArrowUpRight, ArrowDownRight, Plus, Calendar, Package } from "lucide-react";
import Link from "next/link";
import PDVButton from "@/components/pdv/PDVButton";

export default function DashboardPage() {
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
            <PDVButton className="bg-white text-primary-600 hover:bg-primary-50" />
          </div>
        </div>

        {/* Cards com resumo */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard 
            title="Vendas Hoje" 
            value="R$ 1.250,00" 
            icon={ShoppingCart} 
            trend="+15%" 
            trendType="positive"
            href="/dashboard/vendas"
          />
          <SummaryCard 
            title="Clientes Ativos" 
            value="143" 
            icon={Users} 
            trend="+5%" 
            trendType="positive"
            href="/dashboard/clientes"
          />
          <SummaryCard 
            title="Livros em Estoque" 
            value="865" 
            icon={BookOpen} 
            trend="-2%" 
            trendType="negative"
            href="/dashboard/estoque"
          />
          <SummaryCard 
            title="Produtos Cadastrados" 
            value="215" 
            icon={Package} 
            trend="+8%" 
            trendType="positive"
            href="/dashboard/produtos"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Atividades recentes */}
          <div className="col-span-1 lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Atividades Recentes</h2>
              <Link href="/dashboard/atividades" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                Ver todas
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-4">
              <ActivityItem 
                icon={ShoppingCart}
                iconColor="bg-green-100 text-green-600"
                title="Venda Concluída" 
                description="Venda de R$ 85,90 para cliente Maria Silva"
                time="15 minutos atrás"
              />
              <ActivityItem 
                icon={BookOpen}
                iconColor="bg-blue-100 text-blue-600"
                title="Estoque Atualizado" 
                description="15 unidades de 'O Senhor dos Anéis' adicionadas"
                time="2 horas atrás"
              />
              <ActivityItem 
                icon={Package}
                iconColor="bg-indigo-100 text-indigo-600"
                title="Novo Produto Cadastrado" 
                description="Livro 'Duna' adicionado ao catálogo"
                time="3 horas atrás"
              />
              <ActivityItem 
                icon={Users}
                iconColor="bg-amber-100 text-amber-600"
                title="Novo Cliente" 
                description="João Pereira cadastrado como novo cliente"
                time="1 dia atrás"
              />
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

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Calendar className="h-4 w-4 text-neutral-500" />
                Próximos Eventos
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs font-medium text-neutral-500">Amanhã, 10:00</p>
                  <p className="text-sm font-medium text-neutral-900">Lançamento do livro "O Futuro da Ficção"</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs font-medium text-neutral-500">15/04, 15:00</p>
                  <p className="text-sm font-medium text-neutral-900">Inventário mensal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botão flutuante do PDV para acesso rápido em qualquer lugar */}
      <PDVButton variant="floating" />
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

interface ActivityItemProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ icon: Icon, iconColor, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-0.5 rounded-full p-2 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
        <span className="mt-1 inline-block text-xs text-neutral-500">
          <Clock className="mr-1 inline h-3 w-3" />
          {time}
        </span>
      </div>
    </div>
  );
} 