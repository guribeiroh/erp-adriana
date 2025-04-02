import { BaseService, ServiceResponse, PaginationParams, FilterParams } from './baseService';
import { supabase, shouldUseRealData } from '@/lib/supabase/client';
import { Book } from '@/models/database.types';

// Tipo para representar um livro
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
  supplier_id: string;
  created_at: string;
  updated_at?: string;
}

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
  }
];

// Classe de serviço para livros que estende a classe base
class BookService extends BaseService<Book> {
  constructor() {
    // Passar o nome da tabela e os dados de exemplo para o construtor da classe base
    super('books', sampleBooks);
  }

  // Método para buscar livros com filtro de pesquisa
  async searchBooks(search: string = ''): Promise<ServiceResponse<Book[]>> {
    try {
      // Se não houver termo de busca, retornar todos
      if (!search) {
        return this.getAll();
      }

      // Se usarmos o Supabase, fazer busca com filtros
      if (shouldUseRealData() && supabase) {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`)
          .order('title');

        if (error) throw error;

        return {
          data: data as Book[],
          error: null,
          status: 'success',
        };
      } else {
        // Filtrar os dados de exemplo
        const searchLower = search.toLowerCase();
        const filteredBooks = this.mockData.filter(book => 
          book.title.toLowerCase().includes(searchLower) || 
          book.author.toLowerCase().includes(searchLower) || 
          book.isbn.includes(search)
        );

        return {
          data: filteredBooks,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Método para atualizar estoque
  async updateStock(id: string, quantity: number): Promise<ServiceResponse<Book>> {
    try {
      // Primeiro buscar o livro atual
      const bookResponse = await this.getById(id);
      
      if (bookResponse.status === 'error' || !bookResponse.data) {
        return {
          data: null,
          error: bookResponse.error || 'Livro não encontrado',
          status: 'error',
        };
      }

      const currentBook = bookResponse.data;
      const newQuantity = currentBook.quantity + quantity;
      
      // Não permitir estoque negativo
      if (newQuantity < 0) {
        return {
          data: null,
          error: 'Estoque insuficiente para esta operação',
          status: 'error',
        };
      }

      // Atualizar o livro com a nova quantidade
      return this.update(id, { quantity: newQuantity });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Método para buscar livros com estoque baixo
  async getLowStockBooks(): Promise<ServiceResponse<Book[]>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .lte('quantity', supabase.raw('minimum_stock'))
          .order('quantity');

        if (error) throw error;

        return {
          data: data as Book[],
          error: null,
          status: 'success',
        };
      } else {
        // Filtrar livros com estoque abaixo do mínimo
        const lowStockBooks = this.mockData.filter(book => 
          book.quantity <= book.minimum_stock
        );

        return {
          data: lowStockBooks,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error('Erro ao buscar livros com estoque baixo:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Método para obter categorias únicas
  async getCategories(): Promise<ServiceResponse<string[]>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('category')
          .order('category');

        if (error) throw error;

        // Extrair categorias únicas
        const categories = [...new Set(data.map(item => item.category))];

        return {
          data: categories,
          error: null,
          status: 'success',
        };
      } else {
        // Extrair categorias únicas dos dados de exemplo
        const categories = [...new Set(this.mockData.map(book => book.category))];

        return {
          data: categories,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }
}

// Criar e exportar uma instância do serviço
export const bookService = new BookService();

// Funções compatíveis com a API anterior para manter compatibilidade
export async function fetchBooks(search: string = ''): Promise<Book[]> {
  const response = await bookService.searchBooks(search);
  return response.data || [];
}

export async function fetchBookById(id: string): Promise<Book | null> {
  const response = await bookService.getById(id);
  return response.data;
}

export async function createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
  const response = await bookService.create(bookData as Omit<Book, 'id'>);
  if (response.error) throw new Error(response.error);
  return response.data!;
}

export async function updateBook(id: string, bookData: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>): Promise<Book> {
  const response = await bookService.update(id, bookData);
  if (response.error) throw new Error(response.error);
  return response.data!;
}

export async function deleteBook(id: string): Promise<void> {
  const response = await bookService.delete(id);
  if (response.error) throw new Error(response.error);
}

export async function updateBookStock(id: string, quantity: number): Promise<Book> {
  const response = await bookService.updateStock(id, quantity);
  if (response.error) throw new Error(response.error);
  return response.data!;
}

export async function fetchLowStockBooks(): Promise<Book[]> {
  const response = await bookService.getLowStockBooks();
  return response.data || [];
} 