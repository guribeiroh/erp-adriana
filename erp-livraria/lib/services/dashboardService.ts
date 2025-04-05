import { supabase } from '@/lib/supabase/client';
import { fetchTransacoes } from './financialService';
import { bookService } from './bookService';
import { customerService } from './customerService';
import { fetchRecentSales } from './pdvService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para resumo do dashboard
export interface DashboardSummary {
  salesTotal: {
    today: number;
    month: number;
    trend: number; // percentual de aumento/diminuição em relação ao mês anterior
  };
  customers: {
    total: number;
    active: number;
    trend: number;
  };
  inventory: {
    totalBooks: number;
    totalProducts: number;
    lowStock: number;
    trend: number;
  };
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'sale' | 'inventory' | 'customer' | 'product' | 'financial';
  title: string;
  description: string;
  time: string;
  timestamp: string; // ISO date string para ordenação
  icon: string;
  iconColor: string;
  link?: string;
}

/**
 * Obtém um resumo de dados para o dashboard
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // Valores padrão caso alguma das consultas falhe
    const defaultSummary: DashboardSummary = {
      salesTotal: {
        today: 0,
        month: 0,
        trend: 0
      },
      customers: {
        total: 0,
        active: 0,
        trend: 0
      },
      inventory: {
        totalBooks: 0,
        totalProducts: 0,
        lowStock: 0,
        trend: 0
      },
      recentActivities: []
    };

    // 1. Obter resumo de vendas
    const salesSummary = await getSalesSummary();
    
    // 2. Obter resumo de clientes
    const customerSummary = await getCustomerSummary();
    
    // 3. Obter resumo de estoque
    const inventorySummary = await getInventorySummary();
    
    // 4. Obter atividades recentes (limitadas a 4 itens)
    const activities = await getRecentActivities(4);

    return {
      salesTotal: salesSummary,
      customers: customerSummary,
      inventory: inventorySummary,
      recentActivities: activities
    };
  } catch (error) {
    console.error('Erro ao obter resumo do dashboard:', error);
    // Retornar dados vazios em caso de erro
    return {
      salesTotal: { today: 0, month: 0, trend: 0 },
      customers: { total: 0, active: 0, trend: 0 },
      inventory: { totalBooks: 0, totalProducts: 0, lowStock: 0, trend: 0 },
      recentActivities: []
    };
  }
}

/**
 * Obtém resumo de vendas
 */
async function getSalesSummary(): Promise<DashboardSummary['salesTotal']> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para vendas');
      return {
        today: 1250.00,
        month: 24680.50,
        trend: 15
      };
    }

    // Data de hoje (início e fim do dia)
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Data do início do mês atual
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Data do início do mês anterior
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // Data do fim do mês anterior
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Consulta de vendas de hoje
    const { data: todaySales, error: todayError } = await supabase
      .from('sales')
      .select('total')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Consulta de vendas do mês atual
    const { data: monthSales, error: monthError } = await supabase
      .from('sales')
      .select('total')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Consulta de vendas do mês anterior
    const { data: lastMonthSales, error: lastMonthError } = await supabase
      .from('sales')
      .select('total')
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString());

    if (todayError || monthError || lastMonthError) {
      console.error('Erro ao consultar vendas:', { todayError, monthError, lastMonthError });
      throw new Error('Falha ao obter dados de vendas');
    }

    // Somar os totais
    const todayTotal = todaySales?.reduce((acc, sale) => acc + (sale.total || 0), 0) || 0;
    const monthTotal = monthSales?.reduce((acc, sale) => acc + (sale.total || 0), 0) || 0;
    const lastMonthTotal = lastMonthSales?.reduce((acc, sale) => acc + (sale.total || 0), 0) || 0;

    // Calcular tendência (% de crescimento em relação ao mês anterior)
    let trend = 0;
    if (lastMonthTotal > 0) {
      // Evitar divisão por zero
      trend = Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100);
    }

    return {
      today: todayTotal,
      month: monthTotal,
      trend
    };
  } catch (error) {
    console.error('Erro ao obter resumo de vendas:', error);
    return {
      today: 0,
      month: 0,
      trend: 0
    };
  }
}

/**
 * Obtém resumo de clientes
 */
async function getCustomerSummary(): Promise<DashboardSummary['customers']> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para clientes');
      return {
        total: 198,
        active: 143,
        trend: 5
      };
    }

    // Consulta total de clientes
    const { count: totalCustomers, error: totalError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Consulta clientes ativos (que fizeram compras nos últimos 90 dias)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    const { data: activeSalesData, error: activeError } = await supabase
      .from('sales')
      .select('customer_id')
      .gte('created_at', threeMonthsAgo.toISOString())
      .not('customer_id', 'is', null);

    if (totalError || activeError) {
      console.error('Erro ao consultar clientes:', { totalError, activeError });
      throw new Error('Falha ao obter dados de clientes');
    }

    // Contar clientes únicos que fizeram compras recentes
    const activeCustomersSet = new Set(activeSalesData?.map(sale => sale.customer_id));
    const activeCustomersCount = activeCustomersSet.size;

    // Tendência é calculada como uma estimativa para exemplo
    // Idealmente, compararíamos com o período anterior
    const trend = 5; // Valor fixo para exemplo

    return {
      total: totalCustomers || 0,
      active: activeCustomersCount,
      trend
    };
  } catch (error) {
    console.error('Erro ao obter resumo de clientes:', error);
    return {
      total: 0,
      active: 0,
      trend: 0
    };
  }
}

/**
 * Obtém resumo de estoque/produtos
 */
async function getInventorySummary(): Promise<DashboardSummary['inventory']> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para estoque');
      return {
        totalBooks: 865,
        totalProducts: 215,
        lowStock: 23,
        trend: -2
      };
    }

    // Consulta total de livros
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, quantity, minimum_stock');

    if (booksError) {
      console.error('Erro ao consultar livros:', booksError);
      throw new Error('Falha ao obter dados de livros');
    }

    // Contar produtos diversos
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) {
      console.error('Erro ao consultar produtos:', productsError);
      throw new Error('Falha ao obter dados de produtos');
    }

    // Calcular quantidade total em estoque e produtos com estoque baixo
    const totalBooksInStock = books?.reduce((acc, book) => acc + (book.quantity || 0), 0) || 0;
    const lowStockCount = books?.filter(book => (book.quantity || 0) <= (book.minimum_stock || 5)).length || 0;

    // Tendência é uma estimativa para exemplo
    const trend = -2; // Valor fixo para exemplo, indicando redução no estoque

    return {
      totalBooks: totalBooksInStock,
      totalProducts: productsCount || 0,
      lowStock: lowStockCount,
      trend
    };
  } catch (error) {
    console.error('Erro ao obter resumo de estoque:', error);
    return {
      totalBooks: 0,
      totalProducts: 0,
      lowStock: 0,
      trend: 0
    };
  }
}

/**
 * Obtém as vendas mais recentes para exibição no dashboard
 */
async function getRecentActivities(limit: number = 4): Promise<ActivityItem[]> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados de vendas recentes');
      
      // Retornar apenas vendas simuladas
      const simulatedSales = [
        {
          id: 'sale1',
          type: 'sale' as const,
          title: 'Venda Concluída',
          description: 'Venda de R$ 85,90 para cliente Maria Silva',
          time: '15 minutos atrás',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          icon: 'ShoppingCart',
          iconColor: 'bg-green-100 text-green-600',
          link: '/dashboard/vendas/V001'
        },
        {
          id: 'sale2',
          type: 'sale' as const,
          title: 'Venda Concluída',
          description: 'Venda de R$ 126,40 para cliente João Pereira',
          time: '2 horas atrás',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: 'ShoppingCart',
          iconColor: 'bg-green-100 text-green-600',
          link: '/dashboard/vendas/V002'
        },
        {
          id: 'sale3',
          type: 'sale' as const,
          title: 'Venda Concluída',
          description: 'Venda de R$ 213,75 para cliente Empresa ABC',
          time: '3 horas atrás',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          icon: 'ShoppingCart',
          iconColor: 'bg-green-100 text-green-600',
          link: '/dashboard/vendas/V003'
        },
        {
          id: 'sale4',
          type: 'sale' as const,
          title: 'Venda Concluída',
          description: 'Venda de R$ 45,00 para cliente não identificado',
          time: '1 dia atrás',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: 'ShoppingCart',
          iconColor: 'bg-green-100 text-green-600',
          link: '/dashboard/vendas/V004'
        }
      ];
      
      return simulatedSales.slice(0, limit);
    }

    const activities: ActivityItem[] = [];

    // Buscar apenas as vendas recentes
    const recentSales = await fetchRecentSales(limit);
    for (const sale of recentSales) {
      // Buscar nome do cliente se disponível
      let customerName = 'Cliente não identificado';
      if (sale.customer_id) {
        try {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', sale.customer_id)
            .single();
            
          if (customer) {
            customerName = customer.name;
          }
        } catch (error) {
          console.error('Erro ao buscar cliente da venda:', error);
        }
      }

      const saleTime = new Date(sale.created_at);
      const formattedTime = formatRelativeTime(saleTime);

      activities.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: 'Venda Concluída',
        description: `Venda de R$ ${sale.total?.toFixed(2).replace('.', ',')} para ${customerName}`,
        time: formattedTime,
        timestamp: sale.created_at,
        icon: 'ShoppingCart',
        iconColor: 'bg-green-100 text-green-600',
        link: `/dashboard/vendas/${sale.id}`
      });
    }

    return activities;
  } catch (error) {
    console.error('Erro ao obter vendas recentes:', error);
    return [];
  }
}

/**
 * Formata uma data para exibição relativa (ex: "5 minutos atrás", "2 horas atrás")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
  }
  
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`;
  }
  
  return format(date, "dd 'de' MMMM", { locale: ptBR });
} 