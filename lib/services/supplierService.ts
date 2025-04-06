import { supabase } from '@/lib/supabase/client';
import { Supplier } from '@/models/database.types';

// Verifica se o cliente Supabase está disponível
const isSupabaseAvailable = !!supabase;

// Dados de exemplo para usar quando o Supabase não estiver configurado
const sampleSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Distribuidora Livros Brasil',
    contact_name: 'Carlos Mendes',
    email: 'contato@livrosbrasil.com',
    phone: '11998765432',
    address: 'Av. das Editoras, 1500',
    city: 'São Paulo',
    state: 'SP',
    zip: '04567-000',
    notes: 'Principal fornecedor de livros nacionais',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'International Books',
    contact_name: 'Fernanda Alves',
    email: 'supply@intbooks.com',
    phone: '11987654321',
    address: 'Rua dos Importados, 450',
    city: 'São Paulo',
    state: 'SP',
    zip: '01234-000',
    notes: 'Especializado em livros importados',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Editora Nacional',
    contact_name: 'Roberto Silva',
    email: 'comercial@editoranacional.com',
    phone: '21965432198',
    address: 'Estrada das Letras, 789',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '20000-000',
    notes: 'Fornecedor de livros de literatura brasileira',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Buscar todos os fornecedores
export async function fetchSuppliers(search: string = ''): Promise<Supplier[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    // Filtrar os dados de exemplo se houver termo de busca
    if (search) {
      const searchLower = search.toLowerCase();
      return sampleSuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchLower) || 
        supplier.contact_name.toLowerCase().includes(searchLower) || 
        supplier.email.toLowerCase().includes(searchLower)
      );
    }
    return sampleSuppliers;
  }

  try {
    let query = supabase.from('suppliers').select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw new Error('Não foi possível buscar os fornecedores');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleSuppliers;
  }
}

// Buscar um fornecedor por ID
export async function fetchSupplierById(id: string): Promise<Supplier | null> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    return sampleSuppliers.find(supplier => supplier.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw new Error('Não foi possível buscar o fornecedor');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleSuppliers.find(supplier => supplier.id === id) || null;
  }
}

// Criar um novo fornecedor
export async function createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, não é possível criar fornecedor');
    const newSupplier: Supplier = {
      id: (sampleSuppliers.length + 1).toString(),
      ...supplierData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    sampleSuppliers.push(newSupplier);
    return newSupplier;
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ 
        ...supplierData, 
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw new Error('Não foi possível criar o fornecedor');
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    throw new Error('Não foi possível criar o fornecedor');
  }
}

// Atualizar um fornecedor existente
export async function updateSupplier(id: string, supplierData: Partial<Omit<Supplier, 'id' | 'created_at'>>): Promise<Supplier> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando atualização');
    const supplierIndex = sampleSuppliers.findIndex(supplier => supplier.id === id);
    if (supplierIndex === -1) throw new Error('Fornecedor não encontrado');
    
    const updatedSupplier = {
      ...sampleSuppliers[supplierIndex],
      ...supplierData,
      updated_at: new Date().toISOString()
    };
    sampleSuppliers[supplierIndex] = updatedSupplier;
    return updatedSupplier;
  }

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ 
        ...supplierData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw new Error('Não foi possível atualizar o fornecedor');
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    throw new Error('Não foi possível atualizar o fornecedor');
  }
}

// Excluir um fornecedor
export async function deleteSupplier(id: string): Promise<void> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando exclusão');
    const supplierIndex = sampleSuppliers.findIndex(supplier => supplier.id === id);
    if (supplierIndex === -1) throw new Error('Fornecedor não encontrado');
    sampleSuppliers.splice(supplierIndex, 1);
    return;
  }

  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw new Error('Não foi possível excluir o fornecedor');
    }
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    throw new Error('Não foi possível excluir o fornecedor');
  }
} 