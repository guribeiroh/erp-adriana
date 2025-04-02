import Link from 'next/link';
import { ArrowRight, Book, DollarSign, ShoppingCart, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-semibold text-primary-600">ERP Livraria</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-neutral-700 hover:text-primary-600"
            >
              Entrar
            </Link>
            <Link 
              href="/auth/register" 
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Gerencie sua livraria com <span className="text-secondary-300">facilidade</span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-primary-100">
              Um sistema completo para controle de vendas, estoque, clientes e finanças para livrarias de todos os tamanhos.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-primary-700 shadow-sm hover:bg-neutral-100"
              >
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-400 bg-transparent px-6 py-3 text-base font-medium text-white hover:bg-primary-700"
              >
                Saiba mais
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-neutral-900">Funcionalidades principais</h2>
            <p className="mx-auto max-w-2xl text-lg text-neutral-600">
              Tudo o que você precisa para gerenciar sua livraria em um só lugar, com uma interface moderna e fácil de usar.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={ShoppingCart}
              title="Gerenciamento de Vendas"
              description="Controle completo das vendas, emissão de notas e histórico de transações em tempo real."
            />
            <FeatureCard
              icon={Users}
              title="Gestão de Clientes"
              description="Cadastre clientes, acompanhe histórico de compras e crie programas de fidelidade."
            />
            <FeatureCard
              icon={Book}
              title="Controle de Estoque"
              description="Monitore seu inventário com alertas de estoque baixo e reposição automática."
            />
            <FeatureCard
              icon={DollarSign}
              title="Gestão Financeira"
              description="Acompanhe contas a pagar e receber, fluxo de caixa e relatórios detalhados."
            />
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="bg-neutral-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Pronto para transformar sua livraria?</h2>
          <p className="mb-8 mx-auto max-w-2xl text-neutral-300">
            Faça parte das livrarias que já otimizaram seus processos e aumentaram suas vendas com nosso sistema.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700"
          >
            Começar gratuitamente
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary-600" />
              <span className="text-lg font-semibold text-neutral-900">ERP Livraria</span>
            </div>
            <div className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} ERP Livraria. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-card transition-all hover:shadow-lg hover:border-primary-200">
      <div className="mb-4 rounded-full bg-primary-100 p-3 w-12 h-12 flex items-center justify-center text-primary-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-neutral-900">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
} 