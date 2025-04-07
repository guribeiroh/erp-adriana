import { User, Book, Customer, Supplier, AccountReceivable, AccountPayable } from '@/models/database.types';

// Usuários
export const sampleUsers: User[] = [
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

// Fornecedores
export const sampleSuppliers: Supplier[] = [
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

// Livros
export const sampleBooks: Book[] = [
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
  }
];

// Clientes
export const sampleCustomers: Customer[] = [
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
  },
  {
    id: '3',
    name: 'Ana Souza',
    email: 'ana.souza@example.com',
    phone: '21987654321',
    address: 'Rua Copacabana, 500',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '22020-001',
    notes: 'Prefere romances',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Contas a receber
export const sampleAccountsReceivable: AccountReceivable[] = [
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

// Contas a pagar
export const sampleAccountsPayable: AccountPayable[] = [
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