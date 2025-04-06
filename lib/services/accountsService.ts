import { supabase } from '@/lib/supabase/client';
import { AccountReceivable, AccountPayable } from '@/models/database.types';

// Verifica se o cliente Supabase está disponível
const isSupabaseAvailable = !!supabase;

// Dados de exemplo para usar quando o Supabase não estiver configurado
const sampleAccountsReceivable: AccountReceivable[] = [
  {
    id: '1',
    sale_id: '1',
    amount: 150.00,
    due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    payment_date: null,
    status: 'pending',
    notes: 'Pagamento parcelado - 1/3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    sale_id: '1',
    amount: 150.00,
    due_date: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
    payment_date: null,
    status: 'pending',
    notes: 'Pagamento parcelado - 2/3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    sale_id: '2',
    amount: 89.90,
    due_date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    payment_date: new Date().toISOString(),
    status: 'paid',
    notes: 'Pagamento via Pix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const sampleAccountsPayable: AccountPayable[] = [
  {
    id: '1',
    supplier_id: '1',
    description: 'Compra de livros - Lote 123',
    amount: 2500.00,
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    payment_date: null,
    status: 'pending',
    notes: 'Pedido #4563',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    supplier_id: '2',
    description: 'Importação - Livros estrangeiros',
    amount: 3200.00,
    due_date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    payment_date: null,
    status: 'overdue',
    notes: 'Contato sobre atraso feito dia 15/03',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    supplier_id: '3',
    description: 'Material promocional',
    amount: 450.00,
    due_date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    payment_date: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString(),
    status: 'paid',
    notes: 'Pedido #1234',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// CONTAS A RECEBER

// Buscar todas as contas a receber
export async function fetchAccountsReceivable(status?: 'pending' | 'paid' | 'overdue' | 'canceled'): Promise<AccountReceivable[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    if (status) {
      return sampleAccountsReceivable.filter(account => account.status === status);
    }
    return sampleAccountsReceivable;
  }

  try {
    let query = supabase.from('accounts_receivable').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('due_date');

    if (error) {
      console.error('Erro ao buscar contas a receber:', error);
      throw new Error('Não foi possível buscar as contas a receber');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    // Fallback para dados de exemplo em caso de erro
    if (status) {
      return sampleAccountsReceivable.filter(account => account.status === status);
    }
    return sampleAccountsReceivable;
  }
}

// Buscar conta a receber por ID
export async function fetchAccountReceivableById(id: string): Promise<AccountReceivable | null> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    return sampleAccountsReceivable.find(account => account.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar conta a receber:', error);
      throw new Error('Não foi possível buscar a conta a receber');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleAccountsReceivable.find(account => account.id === id) || null;
  }
}

// Criar conta a receber
export async function createAccountReceivable(accountData: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at'>): Promise<AccountReceivable> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, não é possível criar conta a receber');
    const newAccount: AccountReceivable = {
      id: (sampleAccountsReceivable.length + 1).toString(),
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    sampleAccountsReceivable.push(newAccount);
    return newAccount;
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert([{ 
        ...accountData, 
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conta a receber:', error);
      throw new Error('Não foi possível criar a conta a receber');
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    throw new Error('Não foi possível criar a conta a receber');
  }
}

// Atualizar conta a receber
export async function updateAccountReceivable(
  id: string, 
  accountData: Partial<Omit<AccountReceivable, 'id' | 'created_at'>>
): Promise<AccountReceivable> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando atualização');
    const accountIndex = sampleAccountsReceivable.findIndex(account => account.id === id);
    if (accountIndex === -1) throw new Error('Conta a receber não encontrada');
    
    const updatedAccount = {
      ...sampleAccountsReceivable[accountIndex],
      ...accountData,
      updated_at: new Date().toISOString()
    };
    sampleAccountsReceivable[accountIndex] = updatedAccount;
    return updatedAccount;
  }

  try {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ 
        ...accountData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      throw new Error('Não foi possível atualizar a conta a receber');
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    throw new Error('Não foi possível atualizar a conta a receber');
  }
}

// Registrar pagamento de conta a receber
export async function registerPaymentReceivable(id: string, paymentDate: string = new Date().toISOString()): Promise<AccountReceivable> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando registro de pagamento');
    const accountIndex = sampleAccountsReceivable.findIndex(account => account.id === id);
    if (accountIndex === -1) throw new Error('Conta a receber não encontrada');
    
    const updatedAccount = {
      ...sampleAccountsReceivable[accountIndex],
      status: 'paid' as const,
      payment_date: paymentDate,
      updated_at: new Date().toISOString()
    };
    sampleAccountsReceivable[accountIndex] = updatedAccount;
    return updatedAccount;
  }

  try {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ 
        status: 'paid',
        payment_date: paymentDate,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw new Error('Não foi possível registrar o pagamento');
    }

    return data;
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    throw new Error('Não foi possível registrar o pagamento');
  }
}

// CONTAS A PAGAR

// Buscar todas as contas a pagar
export async function fetchAccountsPayable(status?: 'pending' | 'paid' | 'overdue' | 'canceled'): Promise<AccountPayable[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    if (status) {
      return sampleAccountsPayable.filter(account => account.status === status);
    }
    return sampleAccountsPayable;
  }

  try {
    let query = supabase.from('accounts_payable').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('due_date');

    if (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      throw new Error('Não foi possível buscar as contas a pagar');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contas a pagar:', error);
    // Fallback para dados de exemplo em caso de erro
    if (status) {
      return sampleAccountsPayable.filter(account => account.status === status);
    }
    return sampleAccountsPayable;
  }
}

// Buscar conta a pagar por ID
export async function fetchAccountPayableById(id: string): Promise<AccountPayable | null> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    return sampleAccountsPayable.find(account => account.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar conta a pagar:', error);
      throw new Error('Não foi possível buscar a conta a pagar');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar conta a pagar:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleAccountsPayable.find(account => account.id === id) || null;
  }
}

// Criar conta a pagar
export async function createAccountPayable(accountData: Omit<AccountPayable, 'id' | 'created_at' | 'updated_at'>): Promise<AccountPayable> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, não é possível criar conta a pagar');
    const newAccount: AccountPayable = {
      id: (sampleAccountsPayable.length + 1).toString(),
      ...accountData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    sampleAccountsPayable.push(newAccount);
    return newAccount;
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('accounts_payable')
      .insert([{ 
        ...accountData, 
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conta a pagar:', error);
      throw new Error('Não foi possível criar a conta a pagar');
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    throw new Error('Não foi possível criar a conta a pagar');
  }
}

// Atualizar conta a pagar
export async function updateAccountPayable(
  id: string, 
  accountData: Partial<Omit<AccountPayable, 'id' | 'created_at'>>
): Promise<AccountPayable> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando atualização');
    const accountIndex = sampleAccountsPayable.findIndex(account => account.id === id);
    if (accountIndex === -1) throw new Error('Conta a pagar não encontrada');
    
    const updatedAccount = {
      ...sampleAccountsPayable[accountIndex],
      ...accountData,
      updated_at: new Date().toISOString()
    };
    sampleAccountsPayable[accountIndex] = updatedAccount;
    return updatedAccount;
  }

  try {
    const { data, error } = await supabase
      .from('accounts_payable')
      .update({ 
        ...accountData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
      throw new Error('Não foi possível atualizar a conta a pagar');
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    throw new Error('Não foi possível atualizar a conta a pagar');
  }
}

// Registrar pagamento de conta a pagar
export async function registerPaymentPayable(id: string, paymentDate: string = new Date().toISOString()): Promise<AccountPayable> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando registro de pagamento');
    const accountIndex = sampleAccountsPayable.findIndex(account => account.id === id);
    if (accountIndex === -1) throw new Error('Conta a pagar não encontrada');
    
    const updatedAccount = {
      ...sampleAccountsPayable[accountIndex],
      status: 'paid' as const,
      payment_date: paymentDate,
      updated_at: new Date().toISOString()
    };
    sampleAccountsPayable[accountIndex] = updatedAccount;
    return updatedAccount;
  }

  try {
    const { data, error } = await supabase
      .from('accounts_payable')
      .update({ 
        status: 'paid',
        payment_date: paymentDate,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar pagamento:', error);
      throw new Error('Não foi possível registrar o pagamento');
    }

    return data;
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    throw new Error('Não foi possível registrar o pagamento');
  }
} 