"use client";

import Link from 'next/link';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  BarChart3,
  Users, 
  ShoppingCart, 
  BookOpen, 
  DollarSign, 
  Home, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Bell,
  Search,
  Package,
  User,
  Settings,
  FileText
} from 'lucide-react';

// Array de links do menu
const menuLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/estoque', label: 'Estoque', icon: BookOpen },
  { href: '/dashboard/produtos', label: 'Livros', icon: Package },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarSign },
];

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title = "Dashboard" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Fechar menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuRef]);
  
  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      // Vamos redirecionar para a página de logout em vez de chamar signOut diretamente
      // Isso centraliza a lógica de logout na página dedicada
      window.location.href = '/logout';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar para mobile - quando aberto */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-neutral-900/50" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200">
              <Link href="/dashboard" className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary-600" />
                <span className="text-lg font-semibold text-primary-600">ERP Livraria</span>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MobileNavigation />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200">
        <div className="flex h-16 items-center justify-center border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-semibold text-primary-600">ERP Livraria</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <DesktopNavigation />
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-medium text-neutral-900">{title}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Perfil do usuário */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-neutral-300 p-1 pr-3 text-sm font-medium hover:bg-neutral-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block">
                  {user?.email?.split('@')[0] || 'Usuário'}
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </button>
              
              {/* Menu dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-neutral-200 bg-white shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-neutral-700 border-b border-neutral-200">
                      <div className="font-medium">{user?.email || 'Usuário'}</div>
                      <div className="text-xs text-neutral-500">Logado</div>
                    </div>
                    <Link
                      href="/dashboard/perfil"
                      className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair do sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">{children}</main>
      </div>
    </div>
  );
}

function DesktopNavigation() {
  const pathname = usePathname();
  
  // Função para verificar se um link está ativo
  const isActive = (href: string) => {
    // Caso especial para o Dashboard: só ativo quando estiver exatamente na rota /dashboard
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // Para outros links, verificar se o pathname começa com o href
    return pathname === href || pathname?.startsWith(`${href}/`);
  };
  
  return (
    <nav>
      <ul className="space-y-1">
        {menuLinks.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active 
                    ? 'bg-primary-50 text-primary-600 font-semibold' 
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-600'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
                {active && (
                  <div className="ml-auto w-1 h-5 bg-primary-600 rounded-full"></div>
                )}
              </Link>
            </li>
          );
        })}
        <li className="mt-6 border-t border-neutral-200 pt-6">
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function MobileNavigation() {
  const pathname = usePathname();
  
  // Função para verificar se um link está ativo
  const isActive = (href: string) => {
    // Caso especial para o Dashboard: só ativo quando estiver exatamente na rota /dashboard
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // Para outros links, verificar se o pathname começa com o href
    return pathname === href || pathname?.startsWith(`${href}/`);
  };
  
  return (
    <nav>
      <ul className="space-y-1">
        {menuLinks.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active 
                    ? 'bg-primary-50 text-primary-600 font-semibold' 
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-600'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary-600' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
                {active && (
                  <div className="ml-auto w-1 h-5 bg-primary-600 rounded-full"></div>
                )}
              </Link>
            </li>
          );
        })}
        <li className="mt-6 border-t border-neutral-200 pt-6">
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
} 