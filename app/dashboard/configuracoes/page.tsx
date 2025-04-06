"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Settings, 
  User, 
  Building, 
  Database, 
  Lock, 
  Mail, 
  Printer, 
  CloudUpload,
  BookOpen,
  Tag,
  PenSquare,
  UserCog,
  ShieldCheck
} from "lucide-react";

interface ConfigCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

export default function ConfiguracoesPage() {
  const configCards: ConfigCard[] = [
    {
      title: "Perfil do Usuário",
      description: "Altere suas informações pessoais, senha e preferências",
      icon: User,
      href: "/dashboard/configuracoes/perfil",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Dados da Empresa",
      description: "Configure razão social, CNPJ, endereço e informações fiscais",
      icon: Building,
      href: "/dashboard/configuracoes/empresa",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Banco de Dados",
      description: "Configurações de backup, restauração e manutenção",
      icon: Database,
      href: "/dashboard/configuracoes/banco-dados",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Segurança",
      description: "Políticas de senha, autenticação em dois fatores e logs de acesso",
      icon: Lock,
      href: "/dashboard/configuracoes/seguranca",
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Notificações",
      description: "Configure alertas por e-mail e notificações do sistema",
      icon: Mail,
      href: "/dashboard/configuracoes/notificacoes",
      color: "bg-amber-100 text-amber-600",
    },
    {
      title: "Impressão",
      description: "Configure impressoras, modelos de impressão e etiquetas",
      icon: Printer,
      href: "/dashboard/configuracoes/impressao",
      color: "bg-pink-100 text-pink-600",
    },
    {
      title: "Importação e Exportação",
      description: "Importe e exporte dados do sistema",
      icon: CloudUpload,
      href: "/dashboard/configuracoes/importacao-exportacao",
      color: "bg-cyan-100 text-cyan-600",
    },
    {
      title: "Catálogo de Livros",
      description: "Configure campos personalizados e categorias de produtos",
      icon: BookOpen,
      href: "/dashboard/configuracoes/catalogo",
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Parâmetros de Venda",
      description: "Configure impostos, descontos e condições de pagamento",
      icon: Tag,
      href: "/dashboard/configuracoes/parametros-venda",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Customização",
      description: "Personalize a interface, temas e campos do sistema",
      icon: PenSquare,
      href: "/dashboard/configuracoes/customizacao",
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Usuários e Permissões",
      description: "Gerencie usuários, grupos e permissões do sistema",
      icon: UserCog,
      href: "/dashboard/configuracoes/usuarios-permissoes",
      color: "bg-violet-100 text-violet-600",
    },
    {
      title: "Integrações",
      description: "Configure integração com outros sistemas e APIs",
      icon: ShieldCheck,
      href: "/dashboard/configuracoes/integracoes",
      color: "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <DashboardLayout title="Configurações">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-neutral-900">Configurações do Sistema</h1>
          <p className="mt-1 text-neutral-500">
            Configure os parâmetros do sistema para adequá-lo às necessidades da sua livraria
          </p>
        </div>

        {/* Cards de configuração */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {configCards.map((card, index) => (
            <Link
              key={index}
              href={card.href}
              className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-base font-medium text-neutral-900">
                {card.title}
              </h3>
              <p className="text-sm text-neutral-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 