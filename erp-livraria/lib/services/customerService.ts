import { supabase } from '@/lib/supabase/client';
import { Customer } from '@/models/database.types';

// Verifica se o cliente Supabase está disponível
const isSupabaseAvailable = !!supabase;

// Dados de exemplo para usar quando o Supabase não estiver configurado
const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@example.com',
    phone: '11999887766',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zip: '01234-567',
    notes: 'Cliente frequente',
    customer_type: 'pf',
    cpf: '123.456.789-10',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'João Pereira',
    email: 'joao.pereira@example.com',
    phone: '11988776655',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-100',
    notes: '',
    customer_type: 'pf',
    cpf: '987.654.321-00',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com',
    phone: '11987654321',
    address: 'Rua Comercial, 500',
    city: 'São Paulo',
    state: 'SP',
    zip: '04538-132',
    notes: 'Cliente corporativo',
    customer_type: 'pj',
    cnpj: '12.345.678/0001-90',
    social_name: 'ABC Comércio e Serviços Ltda',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Interface para o resumo de compras de um cliente
export interface CustomerPurchaseSummary {
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  recentPurchases: {
    id: string;
    date: string;
    total: number;
    paymentMethod: string;
    status: string;
  }[];
}

// Buscar todos os clientes
export async function fetchCustomers(search: string = ''): Promise<Customer[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    // Filtrar os dados de exemplo se houver termo de busca
    if (search) {
      const searchLower = search.toLowerCase();
      return sampleCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) || 
        customer.email.toLowerCase().includes(searchLower) || 
        customer.phone.includes(search)
      );
    }
    return sampleCustomers;
  }

  try {
    let query = supabase.from('customers').select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Não foi possível buscar os clientes');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleCustomers;
  }
}

// Buscar um cliente por ID
export async function fetchCustomerById(id: string): Promise<Customer | null> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    return sampleCustomers.find(customer => customer.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar cliente:', error);
      throw new Error('Não foi possível buscar o cliente');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleCustomers.find(customer => customer.id === id) || null;
  }
}

// Criar um novo cliente
export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, não é possível criar cliente');
    const newCustomer: Customer = {
      id: (sampleCustomers.length + 1).toString(),
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    sampleCustomers.push(newCustomer);
    return newCustomer;
  }

  try {
    const now = new Date().toISOString();
    
    // Garantir que os campos opcionais não sejam enviados como nulos
    const dataToInsert = { 
      ...customerData, 
      created_at: now,
      updated_at: now
    };
    
    // Remover campos undefined
    Object.keys(dataToInsert).forEach(key => {
      if (dataToInsert[key] === undefined) {
        delete dataToInsert[key];
      }
    });

    console.log('Tentando inserir cliente:', JSON.stringify(dataToInsert, null, 2));

    const { data, error } = await supabase
      .from('customers')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error(`Não foi possível criar o cliente: ${error.message}. Código: ${error.code}, Detalhes: ${error.details || 'sem detalhes'}`);
    }

    if (!data) {
      console.error('Nenhum dado retornado após inserção');
      throw new Error('Nenhum dado retornado após inserção do cliente');
    }

    console.log('Cliente criado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (error instanceof Error) {
      throw new Error(`Não foi possível criar o cliente: ${error.message}`);
    } else {
      throw new Error('Não foi possível criar o cliente: erro desconhecido');
    }
  }
}

// Atualizar um cliente existente
export async function updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando atualização');
    const customerIndex = sampleCustomers.findIndex(customer => customer.id === id);
    if (customerIndex === -1) throw new Error('Cliente não encontrado');
    
    const updatedCustomer = {
      ...sampleCustomers[customerIndex],
      ...customerData,
      updated_at: new Date().toISOString()
    };
    sampleCustomers[customerIndex] = updatedCustomer;
    return updatedCustomer;
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({ 
        ...customerData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Não foi possível atualizar o cliente');
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    throw new Error('Não foi possível atualizar o cliente');
  }
}

// Excluir um cliente
export async function deleteCustomer(id: string): Promise<void> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando exclusão');
    const customerIndex = sampleCustomers.findIndex(customer => customer.id === id);
    if (customerIndex === -1) throw new Error('Cliente não encontrado');
    sampleCustomers.splice(customerIndex, 1);
    return;
  }

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir cliente:', error);
      throw new Error('Não foi possível excluir o cliente');
    }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    throw new Error('Não foi possível excluir o cliente');
  }
}

// Buscar resumo de compras de um cliente
export async function fetchCustomerPurchaseSummary(customerId: string): Promise<CustomerPurchaseSummary> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    // Retornar dados simulados
    return {
      totalPurchases: 0,
      totalSpent: 0,
      recentPurchases: []
    };
  }

  try {
    // Buscar todas as vendas para o cliente
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de compras:', error);
      throw new Error('Não foi possível buscar o histórico de compras');
    }

    // Calcular estatísticas
    const totalPurchases = sales?.length || 0;
    const totalSpent = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const lastPurchaseDate = sales && sales.length > 0 ? sales[0].created_at : undefined;

    // Preparar dados das compras recentes (limitado a 5)
    const recentPurchases = (sales || []).slice(0, 5).map(sale => ({
      id: sale.id,
      date: sale.created_at,
      total: sale.total,
      paymentMethod: sale.payment_method,
      status: sale.payment_status
    }));

    return {
      totalPurchases,
      totalSpent,
      lastPurchaseDate,
      recentPurchases
    };
  } catch (error) {
    console.error('Erro ao buscar histórico de compras:', error);
    // Retornar dados vazios em caso de erro
    return {
      totalPurchases: 0,
      totalSpent: 0,
      recentPurchases: []
    };
  }
} 