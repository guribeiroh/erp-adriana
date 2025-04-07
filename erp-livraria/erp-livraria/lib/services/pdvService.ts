import { supabase } from '@/lib/supabase/client';
import { Book, Customer, Sale, SaleItem } from '@/models/database.types';
import { CartItem } from '@/lib/context/CartContext';
import { stockService } from '@/lib/services/stockService';
import * as financialService from '@/lib/services/financialService';
import { getCurrentBrazilianDate } from '@/lib/utils/date';

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
    
    // Simular movimentação de estoque
    for (const item of items) {
      try {
        await stockService.createMovement({
          book_id: item.book.id,
          type: 'saida',
          quantity: item.quantity,
          reason: 'venda',
          notes: 'Venda simulada',
          responsible: userId || 'sistema'
        });
        console.log(`Movimentação de estoque simulada registrada para o livro ${item.book.id}`);
      } catch (error) {
        console.error(`Erro ao registrar movimentação simulada:`, error);
      }
    }
    
    // Gerar ID da venda simulada
    const saleId = `simulated-${Date.now()}`;
    
    // Obter nome do cliente para a descrição
    let nomeCliente = 'Cliente não identificado';
    if (customerId) {
      try {
        const cliente = sampleCustomers.find(c => c.id === customerId);
        if (cliente) {
          nomeCliente = cliente.name;
        }
      } catch (error) {
        console.error('Erro ao buscar nome do cliente:', error);
      }
    }
    
    // Registrar a transação financeira
    try {
      console.log('====== INÍCIO: Registrando transação financeira simulada ======');
      console.log('Dados da venda para registro financeiro:', { 
        id: saleId,
        total,
        customerId,
        nomeCliente
      });
      
      const formaPagamento = mapPaymentMethodToFinancial(paymentMethod);
      const dataAtual = getCurrentBrazilianDate('date-string');
      
      const dadosTransacao = {
        descricao: `Venda - ${nomeCliente}`,
        valor: total,
        data: dataAtual,
        dataPagamento: dataAtual,
        tipo: 'receita',
        categoria: 'Vendas',
        status: 'confirmada',
        formaPagamento,
        vinculoId: saleId,
        vinculoTipo: 'venda',
        observacoes: notes || undefined,
        linkVenda: `/dashboard/vendas/${saleId}`
      };
      
      console.log('Dados da transação a ser criada:', dadosTransacao);
      
      const transacaoCriada = await financialService.createTransacao(dadosTransacao);
      console.log('Transação financeira simulada criada com sucesso:', transacaoCriada);
      
      // Verificar se a transação foi realmente criada e persistida
      setTimeout(async () => {
        try {
          console.log('Verificando se a transação simulada foi persistida...');
          const transacoesVenda = await financialService.fetchTransacoes({
            vinculoId: saleId,
            limit: 1
          });
          
          if (transacoesVenda.transacoes.length > 0) {
            console.log('Transação simulada encontrada na verificação:', transacoesVenda.transacoes[0]);
          } else {
            console.warn('ALERTA: Transação simulada NÃO foi encontrada na verificação. Pode haver um problema de persistência.');
            // Se não encontrou, tentar criar novamente usando método alternativo
            registrarTransacaoAlternativa(saleId, total, nomeCliente, paymentMethod, notes);
          }
        } catch (verifyError) {
          console.error('Erro ao verificar persistência da transação simulada:', verifyError);
          // Tentar método alternativo em caso de erro de verificação
          registrarTransacaoAlternativa(saleId, total, nomeCliente, paymentMethod, notes);
        }
      }, 500);
      
      console.log('====== FIM: Registro de transação financeira simulada ======');
    } catch (error) {
      console.error('====== ERRO: Falha ao registrar transação financeira simulada ======', error);
      // Tenta novamente usando método alternativo
      registrarTransacaoAlternativa(saleId, total, nomeCliente, paymentMethod, notes);
    }
    
    // Forçar a recarga dos dados do localStorage 
    setTimeout(() => {
      try {
        console.log('Forçando recarga de dados financeiros após venda simulada...');
        financialService.forcarRecargaDados();
      } catch (reloadError) {
        console.error('Erro ao recarregar dados financeiros:', reloadError);
      }
    }, 1000);
    
    return saleId;
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
      // Atualizar o estoque diretamente no banco de dados
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
      
      // Registrar movimentação de estoque
      try {
        await stockService.createMovement({
          book_id: item.book.id,
          type: 'saida',
          quantity: item.quantity,
          reason: 'venda',
          notes: `Venda #${sale.id}`,
          responsible: authenticatedUserId
        });
        console.log(`Movimentação de estoque registrada para o livro ${item.book.id}`);
      } catch (movementError) {
        console.error(`Erro ao registrar movimentação de estoque para o livro ${item.book.id}:`, movementError);
        // Não interromper o processo, apenas logar o erro
      }
    }
    
    // Buscar o nome do cliente para incluir na descrição da transação
    let nomeCliente = 'Cliente não identificado';
    if (customerId) {
      try {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('name')
          .eq('id', customerId)
          .single();
          
        if (!customerError && customerData) {
          nomeCliente = customerData.name;
        }
      } catch (error) {
        console.error('Erro ao buscar nome do cliente:', error);
      }
    }
    
    // Registrar a transação financeira
    try {
      console.log('====== INÍCIO: Registrando transação financeira ======');
      console.log('Dados da venda para registro financeiro:', { 
        id: sale.id,
        total,
        customerId,
        nomeCliente
      });
      
      const formaPagamento = mapPaymentMethodToFinancial(paymentMethod);
      
      // Usar a data atual no formato correto
      const dataAtual = getCurrentBrazilianDate('date-string');
      
      const dadosTransacao = {
        descricao: `Venda - ${nomeCliente}`,
        valor: total,
        data: dataAtual,
        dataPagamento: dataAtual,
        tipo: 'receita',
        categoria: 'Vendas',
        status: 'confirmada',
        formaPagamento,
        vinculoId: sale.id,
        vinculoTipo: 'venda',
        observacoes: notes || undefined,
        linkVenda: `/dashboard/vendas/${sale.id}`
      };
      
      console.log('Dados da transação a ser criada:', dadosTransacao);
      
      // Tentar primeiro usar a função RPC que lida corretamente com o fuso horário
      try {
        console.log(`Enviando data para função RPC: ${dadosTransacao.data} (formato YYYY-MM-DD)`);
        
        // Usar a data atual no formato correto
        const dataAtual = getCurrentBrazilianDate('date-string');
        
        console.log(`Data atual formatada: ${dataAtual}`);
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('insert_financial_transaction_brasilia', {
          p_descricao: dadosTransacao.descricao,
          p_valor: dadosTransacao.valor,
          p_data: dataAtual, // Usar data atual
          p_tipo: dadosTransacao.tipo,
          p_categoria: dadosTransacao.categoria,
          p_status: dadosTransacao.status,
          p_datavencimento: null,
          p_datapagamento: dataAtual, // Usar a mesma data para pagamento
          p_formapagamento: dadosTransacao.formaPagamento,
          p_observacoes: dadosTransacao.observacoes,
          p_vinculoid: dadosTransacao.vinculoId,
          p_vinculotipo: dadosTransacao.vinculoTipo,
          p_comprovante: null,
          p_linkvenda: dadosTransacao.linkVenda
        });
        
        if (rpcError) {
          console.error('Erro ao usar função RPC para inserir transação:', rpcError);
          throw new Error('Falha ao inserir transação via RPC, tentando método padrão');
        }
        
        console.log('Transação financeira criada com sucesso via RPC:', rpcData);
        return sale.id;
      } catch (rpcError) {
        console.error('Erro ao usar função RPC, tentando método padrão:', rpcError);
        // Continuar para o método padrão
      }
      
      // Se falhou com RPC, tentar com o método padrão
      const transacaoCriada = await financialService.createTransacao(dadosTransacao);
      console.log('Transação financeira criada com sucesso:', transacaoCriada);
      
      // Verificar se a transação foi realmente criada e persistida
      setTimeout(async () => {
        try {
          console.log('Verificando se a transação foi persistida...');
          const transacoesVenda = await financialService.fetchTransacoes({
            vinculoId: sale.id,
            limit: 1
          });
          
          if (transacoesVenda.transacoes.length > 0) {
            console.log('Transação encontrada na verificação:', transacoesVenda.transacoes[0]);
          } else {
            console.warn('ALERTA: Transação NÃO foi encontrada na verificação. Pode haver um problema de persistência.');
            
            // Se não encontrou, tentar criar novamente usando método alternativo
            registrarTransacaoAlternativa(sale.id, total, nomeCliente, paymentMethod, notes);
          }
        } catch (verifyError) {
          console.error('Erro ao verificar persistência da transação:', verifyError);
          // Tentar método alternativo em caso de erro de verificação
          registrarTransacaoAlternativa(sale.id, total, nomeCliente, paymentMethod, notes);
        }
      }, 500);
      
      console.log('====== FIM: Registro de transação financeira ======');
    } catch (error) {
      console.error('====== ERRO: Falha ao registrar transação financeira ======', error);
      
      // Tenta novamente usando método alternativo
      registrarTransacaoAlternativa(sale.id, total, nomeCliente, paymentMethod, notes);
      
      // Não interrompe o fluxo principal em caso de erro no registro financeiro
    }

    console.log('Venda finalizada com sucesso!');
    
    // Forçar a recarga dos dados do localStorage 
    setTimeout(() => {
      try {
        console.log('Forçando recarga de dados financeiros após venda real...');
        financialService.forcarRecargaDados();
      } catch (reloadError) {
        console.error('Erro ao recarregar dados financeiros:', reloadError);
      }
    }, 1000);
    
    return sale.id;
  } catch (error) {
    console.error('Erro ao finalizar venda:', error);
    throw error;
  }
}

// Função auxiliar para registrar transação financeira por método alternativo
function registrarTransacaoAlternativa(
  saleId: string, 
  valor: number, 
  nomeCliente: string, 
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer',
  notes?: string
) {
  try {
    console.log('Tentando método alternativo para criar transação financeira...');
    // Usar o método direto de salvar em localStorage sem tentar Supabase primeiro
    const id = `TRX${Date.now()}`;
    
    // Usar a data atual
    const dataAtual = getCurrentBrazilianDate('date-string');
    console.log(`Data atual formatada (alternativa): ${dataAtual}`);
    
    const novaTransacao = {
      id,
      descricao: `Venda (Recuperação) - ${nomeCliente}`,
      valor,
      data: dataAtual,
      dataPagamento: dataAtual,
      tipo: 'receita' as const,
      categoria: 'Vendas',
      status: 'confirmada' as const,
      formaPagamento: mapPaymentMethodToFinancial(paymentMethod),
      vinculoId: saleId,
      vinculoTipo: 'venda' as const,
      observacoes: `${notes || ''} (Registrado por método alternativo)`,
      linkVenda: `/dashboard/vendas/${saleId}`
    };
    
    console.log('Transação alternativa a ser adicionada:', novaTransacao);
    
    // Acessar diretamente o localStorage
    if (typeof window !== 'undefined') {
      try {
        const dadosAtuais = localStorage.getItem('erp-livraria-transacoes');
        const transacoes = dadosAtuais ? JSON.parse(dadosAtuais) : [];
        transacoes.unshift(novaTransacao);
        localStorage.setItem('erp-livraria-transacoes', JSON.stringify(transacoes));
        console.log('Transação adicionada diretamente ao localStorage. Total:', transacoes.length);
      } catch (localError) {
        console.error('Erro ao salvar diretamente no localStorage:', localError);
      }
    }
    
    console.log('Método alternativo concluído');
  } catch (fallbackError) {
    console.error('Falha também no método alternativo:', fallbackError);
  }
}

// Função auxiliar para mapear os métodos de pagamento do PDV para os tipos do serviço financeiro
function mapPaymentMethodToFinancial(paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer'): financialService.FormaPagamento {
  switch (paymentMethod) {
    case 'cash':
      return 'dinheiro';
    case 'credit_card':
      return 'credito';
    case 'debit_card':
      return 'debito';
    case 'pix':
      return 'pix';
    case 'transfer':
      return 'transferencia';
    default:
      return 'outros';
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
    
    // Atualizar a transação financeira correspondente
    try {
      // Buscar transações vinculadas a esta venda
      const { transacoes } = await financialService.fetchTransacoes({
        vinculoId: saleId,
        vinculoTipo: 'venda',
        limit: 1
      });
      
      // Se encontrou alguma transação vinculada à venda
      if (transacoes.length > 0) {
        const transacao = transacoes[0];
        
        // Mapear status da venda para status da transação financeira
        let statusFinanceiro: financialService.TransacaoStatus;
        if (status === 'paid') statusFinanceiro = 'confirmada';
        else if (status === 'pending') statusFinanceiro = 'pendente';
        else statusFinanceiro = 'cancelada';
        
        // Atualizar status da transação
        await financialService.updateTransacao(transacao.id, { 
          status: statusFinanceiro,
          observacoes: notes ? (transacao.observacoes ? `${transacao.observacoes}; ${notes}` : notes) : undefined
        });
        
        console.log(`Transação financeira atualizada para status: ${statusFinanceiro}`);
      } else {
        console.warn('Nenhuma transação financeira encontrada para esta venda');
      }
    } catch (error) {
      console.error('Erro ao atualizar transação financeira:', error);
      // Não interromper o fluxo principal em caso de erro
    }
    
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
    
    // Atualizar a transação financeira correspondente
    try {
      // Buscar informações da venda para obter o total e o cliente
      const { data: saleData } = await supabase
        .from('sales')
        .select('total, customer_id')
        .eq('id', saleId)
        .single();
      
      // Buscar nome do cliente
      let nomeCliente = 'Cliente não identificado';
      if (saleData?.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('name')
          .eq('id', saleData.customer_id)
          .single();
          
        if (customerData) {
          nomeCliente = customerData.name;
        }
      }
        
      // Buscar transações vinculadas a esta venda
      const { transacoes } = await financialService.fetchTransacoes({
        vinculoId: saleId,
        vinculoTipo: 'venda',
        limit: 1
      });
      
      // Se encontrou alguma transação vinculada à venda
      if (transacoes.length > 0) {
        const transacao = transacoes[0];
        
        // Mapear status da venda para status da transação financeira
        let statusFinanceiro: financialService.TransacaoStatus;
        if (status === 'paid') statusFinanceiro = 'confirmada';
        else if (status === 'pending') statusFinanceiro = 'pendente';
        else statusFinanceiro = 'cancelada';
        
        // Atualizar status da transação
        await financialService.updateTransacao(transacao.id, { 
          status: statusFinanceiro,
          descricao: `Venda - ${nomeCliente}`,
          dataPagamento: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
          observacoes: notes ? (transacao.observacoes ? `${transacao.observacoes}; ${notes}` : notes) : undefined,
          linkVenda: `/dashboard/vendas/${saleId}`
        });
        
        console.log(`Transação financeira atualizada para status: ${statusFinanceiro}`);
      } else if (status === 'paid') {
        // Se a venda foi paga mas não existe transação, criar uma nova
        console.log('Nenhuma transação financeira encontrada. Criando nova transação para venda paga...');
        
        if (saleData && saleData.total) {
          const formaPagamento = await getFormaPagamentoVenda(saleId);
          
          await financialService.createTransacao({
            descricao: `Venda - ${nomeCliente}`,
            valor: saleData.total,
            data: new Date().toISOString().split('T')[0],
            dataPagamento: new Date().toISOString().split('T')[0],
            tipo: 'receita',
            categoria: 'Vendas',
            status: 'confirmada',
            formaPagamento,
            vinculoId: saleId,
            vinculoTipo: 'venda',
            observacoes: notes || undefined,
            linkVenda: `/dashboard/vendas/${saleId}`
          });
          
          console.log('Nova transação financeira criada para venda paga');
        } else {
          console.warn('Dados da venda não disponíveis para criar transação financeira');
        }
      } else {
        console.warn('Nenhuma transação financeira encontrada para esta venda');
      }
    } catch (error) {
      console.error('Erro ao atualizar transação financeira:', error);
      // Não interromper o fluxo principal em caso de erro
    }

    console.log(`Status da venda ${saleId} atualizado com sucesso para ${status}`);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    throw error;
  }
}

// Função auxiliar para obter o método de pagamento da venda
async function getFormaPagamentoVenda(saleId: string): Promise<financialService.FormaPagamento> {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('payment_method')
      .eq('id', saleId)
      .single();
      
    if (error || !data) {
      console.error('Erro ao buscar método de pagamento da venda:', error);
      return 'outros';
    }
    
    return mapPaymentMethodToFinancial(data.payment_method);
  } catch (error) {
    console.error('Erro ao obter forma de pagamento da venda:', error);
    return 'outros';
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

    // Buscar informações da venda para obter o usuário responsável
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .select('user_id, customer_id')
      .eq('id', saleId)
      .single();

    if (saleError) {
      console.error('Erro ao buscar informações da venda para estorno:', saleError);
      // Continuar mesmo sem as informações do usuário
    }

    const responsibleUserId = saleData?.user_id || 'sistema';

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
      
      // Registrar movimentação de estoque para o estorno
      try {
        await stockService.createMovement({
          book_id: item.book_id,
          type: 'entrada',
          quantity: item.quantity,
          reason: 'estorno',
          notes: `Estorno da venda #${saleId}`,
          responsible: responsibleUserId
        });
        console.log(`Movimentação de estoque de estorno registrada para o livro ${item.book_id}`);
      } catch (movementError) {
        console.error(`Erro ao registrar movimentação de estoque para estorno do livro ${item.book_id}:`, movementError);
        // Não interromper o processo, apenas logar o erro
      }
    }
    
    // Atualizar a transação financeira correspondente se o estorno incluir aspectos financeiros
    try {
      // Buscar transações vinculadas a esta venda
      const { transacoes } = await financialService.fetchTransacoes({
        vinculoId: saleId,
        vinculoTipo: 'venda',
        limit: 1
      });
      
      // Buscar nome do cliente
      let nomeCliente = 'Cliente não identificado';
      if (saleData?.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('name')
          .eq('id', saleData.customer_id)
          .single();
          
        if (customerData) {
          nomeCliente = customerData.name;
        }
      }
      
      // Se encontrou alguma transação vinculada à venda, cancelá-la
      if (transacoes.length > 0) {
        const transacao = transacoes[0];
        console.log(`Cancelando transação financeira ${transacao.id} relacionada à venda estornada`);
        
        await financialService.updateTransacao(transacao.id, { 
          status: 'cancelada',
          descricao: `Venda - ${nomeCliente}`,
          observacoes: transacao.observacoes 
            ? `${transacao.observacoes}; Cancelada automaticamente no estorno da venda #${saleId}` 
            : `Cancelada automaticamente no estorno da venda #${saleId}`,
          linkVenda: `/dashboard/vendas/${saleId}`
        });
        
        console.log(`Transação financeira ${transacao.id} cancelada com sucesso`);
      } else {
        console.warn('Nenhuma transação financeira encontrada para cancelar associada à venda estornada');
      }
    } catch (error) {
      console.error('Erro ao cancelar transação financeira relacionada à venda estornada:', error);
      // Não interromper o processo, apenas logar o erro
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