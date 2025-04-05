import { supabase } from '@/lib/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateToYYYYMMDD } from '@/lib/utils/dateUtils';

// Tipos para relatórios
export interface SalesReportData {
  period: string;
  totalSales: number;
  totalItems: number;
  averageTicket: number;
  totalCustomers: number;
  salesByCategory: CategoryData[];
  salesByDate: DateData[];
}

export interface InventoryReportData {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  valueByCategory: CategoryData[];
  topSellingItems: TopSellingItem[];
}

export interface FinancialReportData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  revenueByCategory: CategoryData[];
  profitByMonth: DateData[];
}

export interface CustomerReportData {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  topCustomers: TopCustomer[];
  customersByRegion: CategoryData[];
}

export interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

export interface DateData {
  date: string;
  value: number;
}

export interface TopSellingItem {
  id: string;
  title: string;
  quantity: number;
  revenue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  purchases: number;
  totalSpent: number;
}

export type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface ReportFilters {
  timeRange: TimeRange;
  startDate?: string;
  endDate?: string;
  category?: string;
  customer?: string;
}

// Função auxiliar para gerar datas dentro de um intervalo
const generateDateRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

// Função para definir as datas de início e fim com base no timeRange
const getDateRangeFromTimeRange = (timeRange: TimeRange, startDate?: string, endDate?: string): { start: Date, end: Date } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let start = new Date(today);
  let end = new Date(today);
  
  switch (timeRange) {
    case 'today':
      // Início e fim são hoje
      break;
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
      break;
    case 'week':
      start.setDate(today.getDate() - 6);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
      break;
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      break;
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      }
      break;
  }
  
  return { start, end };
};

// Função para formatar o período baseado no timeRange
const formatPeriod = (timeRange: TimeRange, start: Date, end: Date): string => {
  const dateFormatter = new Intl.DateTimeFormat('pt-BR');
  
  switch (timeRange) {
    case 'today':
      return `Hoje (${dateFormatter.format(start)})`;
    case 'yesterday':
      return `Ontem (${dateFormatter.format(start)})`;
    case 'week':
      return `Últimos 7 dias (${dateFormatter.format(start)} a ${dateFormatter.format(end)})`;
    case 'month':
      return `${start.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
    case 'quarter':
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `${quarter}º Trimestre de ${start.getFullYear()}`;
    case 'year':
      return `Ano de ${start.getFullYear()}`;
    case 'custom':
      return `${dateFormatter.format(start)} a ${dateFormatter.format(end)}`;
    default:
      return 'Período desconhecido';
  }
};

/**
 * Gera um relatório de vendas com base nos filtros fornecidos
 */
export const getSalesReport = async (filters: ReportFilters): Promise<SalesReportData> => {
  try {
    // Logs para depuração
    console.log('Filtros recebidos:', filters);
    
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para relatório de vendas');
      return getMockSalesReportV2(filters);
    }
    
    const { start, end } = getDateRangeFromTimeRange(
      filters.timeRange, 
      filters.startDate, 
      filters.endDate
    );
    
    console.log('Intervalo de datas calculado:', { start, end });
    
    // Formato do período baseado no timeRange
    const period = formatPeriod(filters.timeRange, start, end);
    
    // Consulta de vendas no período
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, total, items:sale_items(quantity, book_id, price), customer_id, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (salesError) {
      console.error('Erro ao consultar vendas:', salesError);
      throw new Error('Falha ao obter dados de vendas para relatório');
    }

    // Valores iniciais
    let totalSales = 0;
    let totalItems = 0;
    const customerIds = new Set<string>();
    const categorySales: Record<string, number> = {};
    const datesSales: Record<string, number> = {};

    // Processar vendas
    for (const sale of sales || []) {
      // Somar ao total
      totalSales += sale.total || 0;
      
      // Adicionar cliente ao conjunto de clientes únicos
      if (sale.customer_id) {
        customerIds.add(sale.customer_id);
      }

      // Agrupar por data
      const saleDate = new Date(sale.created_at);
      const formattedDate = saleDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      datesSales[formattedDate] = (datesSales[formattedDate] || 0) + (sale.total || 0);

      // Processar itens
      if (sale.items && Array.isArray(sale.items)) {
        // Contar total de itens
        totalItems += sale.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
        
        // Buscar categorias dos livros vendidos
        for (const item of sale.items) {
          if (item.book_id) {
            try {
              const { data: book } = await supabase
                .from('books')
                .select('category')
                .eq('id', item.book_id)
                .single();

              if (book && book.category) {
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                
                // Filtrar por categoria se especificado
                if (!filters.category || book.category.toLowerCase().includes(filters.category.toLowerCase())) {
                  categorySales[book.category] = (categorySales[book.category] || 0) + itemTotal;
                }
              }
            } catch (error) {
              console.error('Erro ao buscar categoria do livro:', error);
            }
          }
        }
      }
    }

    // Calcular ticket médio
    const averageTicket = customerIds.size > 0 ? totalSales / customerIds.size : 0;

    // Formatar dados por categoria
    const salesByCategory: CategoryData[] = Object.entries(categorySales).map(([category, value]) => ({
      category,
      value,
      percentage: totalSales > 0 ? (value / totalSales) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // Formatar dados por data
    const salesByDate: DateData[] = Object.entries(datesSales).map(([date, value]) => ({
      date,
      value
    })).sort((a, b) => {
      // Converter DD/MM para comparar corretamente
      const [aDay, aMonth] = a.date.split('/').map(Number);
      const [bDay, bMonth] = b.date.split('/').map(Number);
      
      if (aMonth !== bMonth) return aMonth - bMonth;
      return aDay - bDay;
    });

    // Se não houver vendas no período ou o array estiver vazio, preencher com datas do período e valores zero
    if (salesByDate.length === 0) {
      const dateRange = generateDateRange(start, end);
      dateRange.forEach(date => {
        salesByDate.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: 0
        });
      });
    }

    return {
      period,
      totalSales,
      totalItems,
      averageTicket,
      totalCustomers: customerIds.size,
      salesByDate,
      salesByCategory
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    return getMockSalesReportV2(filters);
  }
};

/**
 * Obtém dados de relatório de estoque
 */
export async function getInventoryReport(): Promise<InventoryReportData> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para relatório de estoque');
      return getMockInventoryReport();
    }

    // Consulta de livros
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, category, quantity, purchase_price, minimum_stock');

    if (booksError) {
      console.error('Erro ao consultar livros:', booksError);
      throw new Error('Falha ao obter dados de livros para relatório');
    }

    // Valores iniciais
    let totalItems = 0;
    let totalValue = 0;
    let lowStockItems = 0;
    const categoryValues: Record<string, number> = {};

    // Processar livros
    for (const book of books || []) {
      const quantity = book.quantity || 0;
      const purchasePrice = book.purchase_price || 0;
      const value = quantity * purchasePrice;
      
      totalItems += quantity;
      totalValue += value;
      
      if (quantity <= (book.minimum_stock || 5)) {
        lowStockItems++;
      }

      if (book.category) {
        categoryValues[book.category] = (categoryValues[book.category] || 0) + value;
      }
    }

    // Consulta de itens mais vendidos (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: saleItems, error: saleItemsError } = await supabase
      .from('sale_items')
      .select('book_id, price, quantity, sales:sales!inner(created_at)')
      .gte('sales.created_at', thirtyDaysAgo.toISOString());

    if (saleItemsError) {
      console.error('Erro ao consultar itens de venda:', saleItemsError);
      throw new Error('Falha ao obter dados de itens vendidos para relatório');
    }

    // Agrupar por livro
    const salesByBook: Record<string, { quantity: number, revenue: number }> = {};
    
    for (const item of saleItems || []) {
      if (item.book_id) {
        const bookId = String(item.book_id);
        if (!salesByBook[bookId]) {
          salesByBook[bookId] = { quantity: 0, revenue: 0 };
        }
        
        salesByBook[bookId].quantity += item.quantity || 0;
        salesByBook[bookId].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }

    // Obter top 10 livros mais vendidos
    const topSellingItems: TopSellingItem[] = [];
    
    for (const [bookId, sales] of Object.entries(salesByBook)) {
      try {
        const { data: book } = await supabase
          .from('books')
          .select('title')
          .eq('id', bookId)
          .single();

        topSellingItems.push({
          id: bookId,
          title: book?.title || 'Livro não encontrado',
          quantity: sales.quantity,
          revenue: sales.revenue
        });
      } catch (error) {
        console.error('Erro ao buscar detalhes do livro:', error);
      }
    }

    // Ordenar e limitar a 10 itens
    const sortedTopSellingItems = topSellingItems
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Formatar dados por categoria
    const valueByCategory: CategoryData[] = Object.entries(categoryValues).map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      valueByCategory,
      topSellingItems: sortedTopSellingItems
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error);
    return getMockInventoryReport();
  }
}

/**
 * Obtém dados de relatório financeiro
 */
export async function getFinancialReport(filters: ReportFilters): Promise<FinancialReportData> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para relatório financeiro');
      return getMockFinancialReport(filters);
    }

    const { startDate, endDate } = getDateRangeFromFilters(filters);

    // Consulta de transações financeiras no período
    const { data: transactions, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (transactionsError) {
      console.error('Erro ao consultar transações:', transactionsError);
      throw new Error('Falha ao obter dados de transações para relatório');
    }

    // Valores iniciais
    let revenue = 0;
    let expenses = 0;
    const categoryRevenue: Record<string, number> = {};
    const profitByMonth: Record<string, { revenue: number, expenses: number }> = {};

    // Processar transações
    for (const transaction of transactions || []) {
      const value = transaction.value || 0;
      const date = new Date(transaction.date);
      const monthYear = format(date, 'yyyy-MM');
      
      // Inicializar mês se não existir
      if (!profitByMonth[monthYear]) {
        profitByMonth[monthYear] = { revenue: 0, expenses: 0 };
      }

      if (transaction.type === 'receita') {
        revenue += value;
        profitByMonth[monthYear].revenue += value;
        
        if (transaction.category) {
          categoryRevenue[transaction.category] = (categoryRevenue[transaction.category] || 0) + value;
        }
      } else if (transaction.type === 'despesa') {
        expenses += value;
        profitByMonth[monthYear].expenses += value;
      }
    }

    // Calcular lucro e margem de lucro
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Formatar dados por categoria
    const revenueByCategory: CategoryData[] = Object.entries(categoryRevenue).map(([category, value]) => ({
      category,
      value,
      percentage: revenue > 0 ? (value / revenue) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // Formatar dados por mês
    const profitByMonthArray: DateData[] = Object.entries(profitByMonth).map(([date, data]) => ({
      date,
      value: data.revenue - data.expenses
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      revenue,
      expenses,
      profit,
      profitMargin,
      revenueByCategory,
      profitByMonth: profitByMonthArray
    };
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    return getMockFinancialReport(filters);
  }
}

/**
 * Obtém dados de relatório de clientes
 */
export async function getCustomerReport(filters: ReportFilters): Promise<CustomerReportData> {
  try {
    if (!supabase) {
      console.warn('Supabase não disponível, retornando dados simulados para relatório de clientes');
      return getMockCustomerReport();
    }

    const { startDate, endDate } = getDateRangeFromFilters(filters);

    // Consulta de clientes
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, created_at, city, state');

    if (customersError) {
      console.error('Erro ao consultar clientes:', customersError);
      throw new Error('Falha ao obter dados de clientes para relatório');
    }

    // Consulta de vendas no período
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, total, customer_id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (salesError) {
      console.error('Erro ao consultar vendas:', salesError);
      throw new Error('Falha ao obter dados de vendas para relatório de clientes');
    }

    // Valores iniciais
    const totalCustomers = customers?.length || 0;
    let newCustomers = 0;
    
    const customerPurchases: Record<string, { count: number, total: number }> = {};
    const regionCounts: Record<string, number> = {};

    // Contar novos clientes no período
    for (const customer of customers || []) {
      const createdAt = new Date(customer.created_at);
      if (createdAt >= startDate && createdAt <= endDate) {
        newCustomers++;
      }

      // Agrupar por região
      const region = customer.state || 'Não informado';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }

    // Processar vendas por cliente
    for (const sale of sales || []) {
      if (sale.customer_id) {
        const customerId = String(sale.customer_id);
        if (!customerPurchases[customerId]) {
          customerPurchases[customerId] = { count: 0, total: 0 };
        }
        
        customerPurchases[customerId].count += 1;
        customerPurchases[customerId].total += sale.total || 0;
      }
    }

    // Considerar clientes ativos aqueles que fizeram pelo menos uma compra no período
    const activeCustomers = Object.keys(customerPurchases).length;

    // Obter top 10 clientes
    const topCustomers: TopCustomer[] = [];
    
    for (const [customerId, data] of Object.entries(customerPurchases)) {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', customerId)
          .single();

        topCustomers.push({
          id: customerId,
          name: customer?.name || 'Cliente não encontrado',
          purchases: data.count,
          totalSpent: data.total
        });
      } catch (error) {
        console.error('Erro ao buscar detalhes do cliente:', error);
      }
    }

    // Ordenar e limitar a 10 clientes
    const sortedTopCustomers = topCustomers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Formatar dados por região
    const customersByRegion: CategoryData[] = Object.entries(regionCounts).map(([category, value]) => ({
      category,
      value,
      percentage: totalCustomers > 0 ? (value / totalCustomers) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return {
      totalCustomers,
      newCustomers,
      activeCustomers,
      topCustomers: sortedTopCustomers,
      customersByRegion
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error);
    return getMockCustomerReport();
  }
}

/**
 * Converte um filtro de período em datas de início e fim
 */
function getDateRangeFromFilters(filters: ReportFilters): { startDate: Date, endDate: Date } {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  let endDate = new Date(now);
  
  switch (filters.timeRange) {
    case 'today':
      // startDate já está definido como hoje
      break;
    case 'yesterday':
      startDate = subDays(startDate, 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate = subDays(startDate, 7);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'quarter':
      startDate = new Date(now);
      startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    case 'custom':
      if (filters.startDate) {
        startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (filters.endDate) {
        endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
  }
  
  return { startDate, endDate };
}

// Dados simulados para os relatórios

function getMockSalesReportV2(filters: ReportFilters): SalesReportData {
  const { start, end } = getDateRangeFromTimeRange(filters.timeRange, filters.startDate, filters.endDate);
  const period = formatPeriod(filters.timeRange, start, end);
  
  // Gera um array de datas no intervalo
  const dateRange = generateDateRange(start, end);
  
  // Simula vendas para cada dia no intervalo
  const salesByDate = dateRange.map(date => {
    // Gera um valor de venda aleatório entre 1000 e 10000
    const value = Math.floor(Math.random() * 9000 + 1000);
    
    // Formata a data como DD/MM
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value
    };
  });
  
  // Calcula o total de vendas
  const totalSales = salesByDate.reduce((sum, item) => sum + item.value, 0);
  
  // Categorias simuladas
  const categories = [
    'Literatura',
    'Didáticos',
    'Infantil',
    'Autoajuda',
    'Negócios'
  ];
  
  // Filtra categorias se houver filtro de categoria
  const filteredCategories = filters.category 
    ? categories.filter(cat => cat.toLowerCase().includes(filters.category!.toLowerCase()))
    : categories;
  
  // Gera dados de vendas por categoria
  const salesByCategory = filteredCategories.map(category => {
    // Gera um valor de venda aleatório
    const value = Math.floor(Math.random() * (totalSales / 2));
    
    return {
      category,
      value,
      percentage: 0 // Será calculado depois
    };
  });
  
  // Ajusta o último valor para que a soma seja igual ao totalSales
  const sumExceptLast = salesByCategory.slice(0, -1).reduce((sum, item) => sum + item.value, 0);
  if (salesByCategory.length > 0) {
    salesByCategory[salesByCategory.length - 1].value = totalSales - sumExceptLast;
  }
  
  // Calcula as porcentagens
  salesByCategory.forEach(item => {
    item.percentage = (item.value / totalSales) * 100;
  });
  
  // Ordenar por valor (do maior para o menor)
  salesByCategory.sort((a, b) => b.value - a.value);
  
  // Dados simulados para os outros campos
  const totalItems = Math.floor(Math.random() * 500 + 100);
  const totalCustomers = Math.floor(Math.random() * 100 + 20);
  const averageTicket = Math.round(totalSales / totalCustomers);
  
  return {
    period,
    totalSales,
    totalItems,
    averageTicket,
    totalCustomers,
    salesByDate,
    salesByCategory
  };
}

function getMockInventoryReport(): InventoryReportData {
  return {
    totalItems: 1235,
    totalValue: 45680.75,
    lowStockItems: 28,
    valueByCategory: [
      { category: 'Literatura', value: 15000, percentage: 32.84 },
      { category: 'Infantil', value: 10500, percentage: 22.99 },
      { category: 'Técnico', value: 8750, percentage: 19.15 },
      { category: 'Escolar', value: 6230.75, percentage: 13.64 },
      { category: 'Autoajuda', value: 3200, percentage: 7.01 },
      { category: 'Outros', value: 2000, percentage: 4.38 }
    ],
    topSellingItems: [
      { id: '1', title: 'O Pequeno Príncipe', quantity: 42, revenue: 1680 },
      { id: '2', title: 'A Arte da Guerra', quantity: 28, revenue: 1400 },
      { id: '3', title: 'Dom Casmurro', quantity: 24, revenue: 1200 },
      { id: '4', title: 'Pai Rico, Pai Pobre', quantity: 22, revenue: 1100 },
      { id: '5', title: 'Harry Potter e a Pedra Filosofal', quantity: 18, revenue: 900 }
    ]
  };
}

function getMockFinancialReport(filters: ReportFilters): FinancialReportData {
  const { startDate, endDate } = getDateRangeFromFilters(filters);
  
  return {
    revenue: 35620.50,
    expenses: 18450.75,
    profit: 17169.75,
    profitMargin: 48.2,
    revenueByCategory: [
      { category: 'Vendas', value: 28750.40, percentage: 80.71 },
      { category: 'Serviços', value: 4870.10, percentage: 13.67 },
      { category: 'Outros', value: 2000, percentage: 5.61 }
    ],
    profitByMonth: [
      { date: '2025-01', value: 3500 },
      { date: '2025-02', value: 4200 },
      { date: '2025-03', value: 4800 },
      { date: '2025-04', value: 4669.75 }
    ]
  };
}

function getMockCustomerReport(): CustomerReportData {
  return {
    totalCustomers: 245,
    newCustomers: 18,
    activeCustomers: 95,
    topCustomers: [
      { id: '1', name: 'Maria Silva', purchases: 12, totalSpent: 1450 },
      { id: '2', name: 'João Pereira', purchases: 8, totalSpent: 980 },
      { id: '3', name: 'Empresa ABC Ltda', purchases: 6, totalSpent: 3200 },
      { id: '4', name: 'Ana Oliveira', purchases: 5, totalSpent: 675 },
      { id: '5', name: 'Carlos Santos', purchases: 4, totalSpent: 520 }
    ],
    customersByRegion: [
      { category: 'SP', value: 85, percentage: 34.69 },
      { category: 'RJ', value: 65, percentage: 26.53 },
      { category: 'MG', value: 45, percentage: 18.37 },
      { category: 'RS', value: 25, percentage: 10.20 },
      { category: 'PR', value: 15, percentage: 6.12 },
      { category: 'Outros', value: 10, percentage: 4.08 }
    ]
  };
} 