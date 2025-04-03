import { supabase } from '@/lib/supabase/client';
import { Book, Customer, Sale, SaleItem } from '@/models/database.types';
import { CartItem } from '@/lib/context/CartContext';

// Dados de exemplo para usar quando o Supabase não estiver configurado
const sampleBooks: Book[] = [
  { 
    id: '1', 
    title: 'O Senhor dos Anéis', 
    author: 'J.R.R. Tolkien', 
    isbn: '9788533613379',
    publisher: 'HarperCollins',
    category: 'Fantasia',
    subcategory: 'Épico',
    purchase_price: 45.00,
    selling_price: 89.90, 
    quantity: 23,
    minimum_stock: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplier_id: '1'
  },
  { 
    id: '2', 
    title: 'Harry Potter e a Pedra Filosofal', 
    author: 'J.K. Rowling', 
    isbn: '9788532511010',
    publisher: 'Rocco',
    category: 'Fantasia',
    subcategory: 'Jovem Adulto',
    purchase_price: 22.50,
    selling_price: 45.50, 
    quantity: 15,
    minimum_stock: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplier_id: '2'
  },
  { 
    id: '3', 
    title: 'Dom Casmurro', 
    author: 'Machado de Assis', 
    isbn: '9788535910663',
    publisher: 'Companhia das Letras',
    category: 'Clássico',
    subcategory: 'Literatura Brasileira',
    purchase_price: 15.00,
    selling_price: 29.90, 
    quantity: 42,
    minimum_stock: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplier_id: '3'
  },
  { 
    id: '4', 
    title: 'A Revolução dos Bichos', 
    author: 'George Orwell', 
    isbn: '9788535909555',
    publisher: 'Companhia das Letras',
    category: 'Ficção',
    subcategory: 'Sátira Política',
    purchase_price: 18.00,
    selling_price: 35.00, 
    quantity: 18,
    minimum_stock: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    supplier_id: '3'
  },
];

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Verifica se o cliente Supabase está disponível
const isSupabaseAvailable = !!supabase;

// Buscar todos os livros disponíveis para venda
export async function fetchAvailableBooks(search: string = ''): Promise<Book[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    // Filtrar os dados de exemplo se houver termo de busca
    if (search) {
      const searchLower = search.toLowerCase();
      return sampleBooks.filter(book => 
        book.title.toLowerCase().includes(searchLower) || 
        book.author.toLowerCase().includes(searchLower) || 
        book.isbn.includes(search)
      );
    }
    return sampleBooks;
  }

  try {
    let query = supabase
      .from('books')
      .select('*')
      .gt('quantity', 0);

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar livros:', error);
      throw new Error('Não foi possível buscar os livros disponíveis');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleBooks;
  }
}

// Buscar um livro por ID
export async function fetchBookById(id: string): Promise<Book | null> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, usando dados de exemplo');
    return sampleBooks.find(book => book.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar livro:', error);
      throw new Error('Não foi possível buscar o livro');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar livro:', error);
    // Fallback para dados de exemplo em caso de erro
    return sampleBooks.find(book => book.id === id) || null;
  }
}

// Buscar clientes para associar à venda
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

    const { data, error } = await query;

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

// Finalizar uma venda
export async function finalizeSale(
  items: CartItem[],
  customerId: string | null,
  userId: string,
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer',
  notes: string = ''
): Promise<string> {
  // Calcular o total da venda
  const total = items.reduce(
    (sum, item) => sum + (item.book.selling_price * item.quantity) - item.discount,
    0
  );

  console.log('Iniciando finalização da venda:', { 
    itemsCount: items.length, 
    customerId, 
    userId, 
    paymentMethod, 
    total 
  });

  // Se Supabase não estiver disponível, simular o processo
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando venda');
    // Simular o ID da venda
    return `simulated-${Date.now()}`;
  }

  try {
    // Verificar se usuário existe na autenticação
    console.log('Verificando usuário na autenticação com ID:', userId);
    
    // Verificar autenticação diretamente
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Erro ao verificar sessão:', authError);
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    if (!authData.session) {
      console.error('Sessão não encontrada');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    console.log('Usuário autenticado:', authData.session.user.email);
    
    // Usar ID do usuário da sessão atual
    const authenticatedUserId = authData.session.user.id;
    
    // Checar se o ID fornecido corresponde ao usuário autenticado
    if (userId !== authenticatedUserId) {
      console.warn(`ID fornecido (${userId}) difere do ID da sessão (${authenticatedUserId}). Usando ID da sessão.`);
    }
    
    // Tentar criar o registro na tabela users (se não existir)
    try {
      console.log('Tentando criar/atualizar registro de usuário...');
      
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authenticatedUserId,
          email: authData.session.user.email,
          name: authData.session.user.user_metadata?.name || authData.session.user.email,
          role: authData.session.user.user_metadata?.role || 'vendedor',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        
      if (upsertError) {
        console.warn('Erro ao criar/atualizar registro de usuário, mas continuando:', upsertError);
      } else {
        console.log('Registro de usuário atualizado com sucesso');
      }
    } catch (upsertErr) {
      console.warn('Erro ao atualizar registro do usuário, mas continuando:', upsertErr);
    }

    // Criar a venda com o ID do usuário autenticado
    console.log('Criando registro de venda...');
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_id: customerId,
        user_id: authenticatedUserId,
        total,
        payment_method: paymentMethod,
        payment_status: 'paid',
        notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao criar venda:', saleError);
      throw new Error('Não foi possível finalizar a venda: ' + saleError.message);
    }

    console.log('Venda criada com sucesso:', sale);

    // Criar os itens da venda
    console.log('Criando itens da venda...');
    const saleItems = items.map(item => {
      const itemTotal = (item.book.selling_price * item.quantity) - item.discount;
      return {
        sale_id: sale.id,
        book_id: item.book.id,
        quantity: item.quantity,
        unit_price: item.book.selling_price,
        discount: item.discount,
        total: itemTotal
      };
    });

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('Erro ao criar itens da venda:', itemsError);
      throw new Error('Erro ao registrar itens da venda: ' + itemsError.message);
    }

    console.log('Itens da venda criados com sucesso');

    // Atualizar o estoque dos livros
    console.log('Atualizando estoque dos livros...');
    for (const item of items) {
      const { error: bookError } = await supabase
        .from('books')
        .update({ 
          quantity: supabase.rpc('decrement', { x: item.quantity, row_id: item.book.id })
        })
        .eq('id', item.book.id);

      if (bookError) {
        console.error(`Erro ao atualizar estoque do livro ${item.book.id}:`, bookError);
        // Não interromper o processo, apenas logar o erro
      }
    }

    console.log('Venda finalizada com sucesso!');
    return sale.id;
  } catch (error) {
    console.error('Erro ao finalizar venda:', error);
    throw error;
  }
}

// Buscar vendas recentes
export async function fetchRecentSales(limit: number = 10): Promise<Sale[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, retornando dados vazios');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar vendas recentes:', error);
      throw new Error('Não foi possível buscar as vendas recentes');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar vendas recentes:', error);
    return [];
  }
}

// Buscar detalhes de uma venda específica
export async function fetchSaleDetails(saleId: string): Promise<{ sale: Sale, items: SaleItem[] }> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, retornando dados vazios');
    return { sale: null as any, items: [] };
  }

  try {
    // Buscar a venda
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (saleError) {
      console.error('Erro ao buscar venda:', saleError);
      throw new Error('Não foi possível buscar os detalhes da venda');
    }

    // Buscar os itens da venda
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId);

    if (itemsError) {
      console.error('Erro ao buscar itens da venda:', itemsError);
      throw new Error('Não foi possível buscar os itens da venda');
    }

    return { sale, items: items || [] };
  } catch (error) {
    console.error('Erro ao buscar detalhes da venda:', error);
    return { sale: null as any, items: [] };
  }
}

// Atualizar o status de pagamento de uma venda
export async function updateSalePaymentStatus(
  saleId: string, 
  status: 'paid' | 'pending' | 'canceled',
  notes?: string
): Promise<boolean> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, simulando atualização');
    return true;
  }

  try {
    console.log(`Atualizando status da venda ${saleId} para ${status}`);
    
    const updateData: any = { 
      payment_status: status,
      updated_at: new Date().toISOString()
    };
    
    // Adicionar notas se fornecidas
    if (notes) {
      updateData.notes = notes;
    }
    
    const { error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', saleId);

    if (error) {
      console.error('Erro ao atualizar status da venda:', error);
      throw new Error(`Não foi possível atualizar o status da venda: ${error.message}`);
    }

    // Se a venda for cancelada, devemos estornar os itens para o estoque
    if (status === 'canceled') {
      await estornarItensParaEstoque(saleId);
    }

    console.log(`Status da venda ${saleId} atualizado com sucesso para ${status}`);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    throw error;
  }
}

// Função auxiliar para estornar itens para o estoque quando uma venda é cancelada
async function estornarItensParaEstoque(saleId: string): Promise<void> {
  try {
    console.log(`Estornando itens da venda ${saleId} para o estoque`);
    
    // Buscar os itens da venda
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId);

    if (itemsError) {
      console.error('Erro ao buscar itens para estorno:', itemsError);
      throw new Error('Não foi possível buscar os itens da venda para estorno');
    }

    if (!items || items.length === 0) {
      console.log('Nenhum item encontrado para estorno');
      return;
    }

    // Atualizar o estoque dos livros
    for (const item of items) {
      console.log(`Estornando ${item.quantity} unidades do livro ${item.book_id}`);
      
      const { error: bookError } = await supabase
        .from('books')
        .update({ 
          // Incrementar a quantidade em estoque
          quantity: supabase.rpc('increment', { x: item.quantity, row_id: item.book_id })
        })
        .eq('id', item.book_id);

      if (bookError) {
        console.error(`Erro ao estornar estoque do livro ${item.book_id}:`, bookError);
        // Não interromper o processo, apenas logar o erro
      }
    }

    console.log(`Estorno dos itens da venda ${saleId} concluído com sucesso`);
  } catch (error) {
    console.error('Erro ao estornar itens para o estoque:', error);
    // Não propagar o erro para não interromper o cancelamento da venda
  }
}

// Buscar histórico de vendas de um produto específico
export async function fetchProductSaleHistory(productId: string, limit: number = 50): Promise<any[]> {
  if (!isSupabaseAvailable) {
    console.warn('Supabase não está disponível, retornando dados simulados');
    
    // Dados simulados de vendas para o produto
    return Array.from({ length: 5 }, (_, i) => ({
      id: `sale-${i+1}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      quantity: Math.floor(Math.random() * 5) + 1,
      unit_price: sampleBooks.find(b => b.id === productId)?.selling_price || 29.90,
      total: (Math.floor(Math.random() * 5) + 1) * (sampleBooks.find(b => b.id === productId)?.selling_price || 29.90),
      customer_name: sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)].name,
      payment_method: ['cash', 'credit_card', 'debit_card', 'pix'][Math.floor(Math.random() * 4)],
      payment_status: ['paid', 'pending'][Math.floor(Math.random() * 2)]
    }));
  }

  try {
    // Obter vendas através dos itens de venda
    const { data: saleItems, error: itemsError } = await supabase
      .from('sale_items')
      .select(`
        id,
        quantity,
        unit_price,
        discount,
        total,
        sale_id,
        sales:sale_id (
          id,
          created_at,
          payment_method,
          payment_status,
          customer_id,
          customers:customer_id (
            id,
            name
          )
        )
      `)
      .eq('book_id', productId)
      .order('created_at', { foreignTable: 'sales', ascending: false })
      .limit(limit);

    if (itemsError) {
      console.error('Erro ao buscar histórico de vendas do produto:', itemsError);
      throw new Error('Não foi possível buscar o histórico de vendas');
    }

    return saleItems.map(item => ({
      id: item.id,
      sale_id: item.sale_id,
      date: item.sales?.created_at,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      total: item.total,
      customer_name: item.sales?.customers?.name || 'Cliente não identificado',
      payment_method: item.sales?.payment_method,
      payment_status: item.sales?.payment_status
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar histórico de vendas do produto:', error);
    throw new Error('Não foi possível buscar o histórico de vendas');
  }
} 