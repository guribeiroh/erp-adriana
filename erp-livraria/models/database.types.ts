export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory';
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  customer_type: 'pf' | 'pj';
  cpf?: string;
  cnpj?: string;
  social_name?: string;
  address_complement?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: string;
  subcategory: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
  supplier_id: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id: string | null;
  user_id: string;
  total: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer';
  payment_status: 'paid' | 'pending' | 'canceled';
  notes: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface AccountReceivable {
  id: string;
  sale_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AccountPayable {
  id: string;
  supplier_id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  notes: string;
  created_at: string;
  updated_at: string;
} 