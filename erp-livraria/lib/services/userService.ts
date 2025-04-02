import { supabase, shouldUseRealData } from '@/lib/supabase/client';
import { User } from '@/models/database.types';

// Dados de exemplo para usar quando o Supabase não estiver configurado
const sampleUsers: User[] = [
  {
    id: '1',
    email: 'admin@erp-livraria.com',
    name: 'Administrador',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'gerente@erp-livraria.com',
    name: 'Gerente',
    role: 'manager',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    email: 'caixa@erp-livraria.com',
    name: 'Caixa',
    role: 'cashier',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    email: 'estoque@erp-livraria.com',
    name: 'Estoquista',
    role: 'inventory',
    created_at: new Date().toISOString()
  }
];

// Buscar todos os usuários
export async function fetchUsers(): Promise<User[]> {
  // Verificar se devemos usar dados reais
  if (!shouldUseRealData()) {
    console.warn('Usando dados simulados para usuários');
    return sampleUsers;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error('Não foi possível buscar os usuários');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleUsers;
  }
}

// Buscar um usuário por ID
export async function fetchUserById(id: string): Promise<User | null> {
  // Verificar se devemos usar dados reais
  if (!shouldUseRealData()) {
    console.warn('Usando dados simulados para usuário');
    return sampleUsers.find(user => user.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      throw new Error('Não foi possível buscar o usuário');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleUsers.find(user => user.id === id) || null;
  }
}

// Criar um novo usuário
export async function createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
  // Verificar se devemos usar dados reais
  if (!shouldUseRealData()) {
    console.warn('Usando dados simulados para criar usuário');
    const newUser: User = {
      id: (sampleUsers.length + 1).toString(),
      ...userData,
      created_at: new Date().toISOString()
    };
    sampleUsers.push(newUser);
    return newUser;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...userData }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error('Não foi possível criar o usuário');
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw new Error('Não foi possível criar o usuário');
  }
}

// Atualizar um usuário existente
export async function updateUser(id: string, userData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
  if (!shouldUseRealData()) {
    console.warn('Usando dados simulados para atualizar usuário');
    const userIndex = sampleUsers.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('Usuário não encontrado');
    
    const updatedUser = {
      ...sampleUsers[userIndex],
      ...userData
    };
    sampleUsers[userIndex] = updatedUser;
    return updatedUser;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...userData })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Não foi possível atualizar o usuário');
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw new Error('Não foi possível atualizar o usuário');
  }
}

// Excluir um usuário
export async function deleteUser(id: string): Promise<void> {
  if (!shouldUseRealData()) {
    console.warn('Usando dados simulados para excluir usuário');
    const userIndex = sampleUsers.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('Usuário não encontrado');
    sampleUsers.splice(userIndex, 1);
    return;
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir usuário:', error);
      throw new Error('Não foi possível excluir o usuário');
    }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw new Error('Não foi possível excluir o usuário');
  }
} 