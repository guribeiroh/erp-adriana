import { BaseService, ServiceResponse } from './baseService';
import { supabase, shouldUseRealData } from '@/lib/supabase/client';
import { Book } from '@/models/database.types';
import { bookService } from './bookService';

// Tipo para representar uma movimentação de estoque
export interface StockMovement {
  id: string;
  book_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  reason: string;
  notes?: string;
  responsible: string;
  created_at: string;
  updated_at?: string;
  sale_id?: string; // Referência à venda que gerou a movimentação
}

// Tipo para criação de uma movimentação de estoque
export type CreateStockMovementDTO = Omit<StockMovement, 'id' | 'created_at' | 'updated_at'>;

// Interface retornada na listagem de movimentações com dados do livro
export interface StockMovementWithBook extends StockMovement {
  book?: Book;
}

// Classe de serviço para gerenciamento de estoque
class StockService extends BaseService<StockMovement> {
  constructor() {
    // Passar o nome da tabela para o construtor da classe base
    super('stock_movements', []);
  }

  // Método para criar uma nova movimentação de estoque
  async createMovement(data: CreateStockMovementDTO): Promise<ServiceResponse<StockMovement>> {
    try {
      // Buscar o livro para verificar estoque
      const bookResponse = await bookService.getById(data.book_id);
      
      if (bookResponse.status === 'error' || !bookResponse.data) {
        return {
          data: null,
          error: bookResponse.error || 'Livro não encontrado',
          status: 'error',
        };
      }

      const book = bookResponse.data;

      // Verificar se tem estoque suficiente em caso de saída
      if (data.type === 'saida' && data.quantity > book.quantity) {
        return {
          data: null,
          error: `Estoque insuficiente. Disponível: ${book.quantity}, Solicitado: ${data.quantity}`,
          status: 'error',
        };
      }

      // Inicia a transação (no caso real)
      if (shouldUseRealData() && supabase) {
        // Criar movimentação
        const { data: movementData, error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            book_id: data.book_id,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            notes: data.notes,
            responsible: data.responsible,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (movementError) throw movementError;

        // Atualizar estoque do livro
        const newQuantity = data.type === 'entrada' 
          ? book.quantity + data.quantity 
          : book.quantity - data.quantity;

        const { error: bookError } = await supabase
          .from('books')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.book_id);

        if (bookError) throw bookError;

        return {
          data: movementData as StockMovement,
          error: null,
          status: 'success',
        };
      } else {
        // Simular criação para ambiente de desenvolvimento
        const movementId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        const newMovement: StockMovement = {
          id: movementId,
          book_id: data.book_id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason,
          notes: data.notes,
          responsible: data.responsible,
          created_at: now
        };

        // Também atualizar o livro nos dados mockados
        await bookService.updateStock(
          data.book_id, 
          data.type === 'entrada' ? data.quantity : -data.quantity
        );

        return {
          data: newMovement,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error('Erro ao criar movimentação de estoque:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Método para listar movimentações com dados do livro
  async getMovementsWithBooks(limit: number = 100): Promise<ServiceResponse<StockMovementWithBook[]>> {
    try {
      if (shouldUseRealData() && supabase) {
        // Modificar a consulta para extrair a ID da venda das notas, se existir
        const { data, error } = await supabase
          .from('stock_movements')
          .select('*, book:books(*)')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Processar os dados para extrair os IDs de venda das notas
        const processedData = data?.map(movement => {
          const processedMovement: StockMovementWithBook = {
            ...movement,
            sale_id: undefined
          };
          
          // Verifica se a movimentação é do tipo 'saida' e razão 'venda'
          if (movement.type === 'saida' && movement.reason === 'venda' && movement.notes) {
            // Tenta extrair o ID da venda das notas (formato "Venda #id-da-venda")
            const vendaMatch = movement.notes.match(/Venda #([a-zA-Z0-9-]+)/);
            if (vendaMatch && vendaMatch[1]) {
              processedMovement.sale_id = vendaMatch[1];
            }
          }
          
          return processedMovement;
        });

        return {
          data: processedData as StockMovementWithBook[],
          error: null,
          status: 'success',
        };
      } else {
        // No ambiente de desenvolvimento, não é possível popular os dados de livros
        // Então retornamos apenas as movimentações
        const { data: movements } = await this.getAll();
        
        // Processar para adicionar sale_id simulado
        const processedMovements = movements?.map(movement => {
          const processedMovement: StockMovementWithBook = {
            ...movement,
            sale_id: undefined
          };
          
          if (movement.type === 'saida' && movement.reason === 'venda' && movement.notes) {
            // Para ambiente de desenvolvimento, simular sale_id
            if (movement.notes.includes('simulada')) {
              processedMovement.sale_id = `simulated-${Date.now()}`;
            } else {
              const vendaMatch = movement.notes.match(/Venda #([a-zA-Z0-9-]+)/);
              if (vendaMatch && vendaMatch[1]) {
                processedMovement.sale_id = vendaMatch[1];
              }
            }
          }
          
          return processedMovement;
        });
        
        return {
          data: processedMovements as StockMovementWithBook[],
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações de estoque:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Método para obter movimentações de um livro específico
  async getBookMovements(bookId: string): Promise<ServiceResponse<StockMovement[]>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { data, error } = await supabase
          .from('stock_movements')
          .select('*')
          .eq('book_id', bookId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Processar os dados para extrair os IDs de venda das notas
        const processedData = data?.map(movement => {
          const processedMovement: StockMovement = {
            ...movement,
            sale_id: undefined
          };
          
          // Verifica se a movimentação é do tipo 'saida' e razão 'venda'
          if (movement.type === 'saida' && movement.reason === 'venda' && movement.notes) {
            // Tenta extrair o ID da venda das notas (formato "Venda #id-da-venda")
            const vendaMatch = movement.notes.match(/Venda #([a-zA-Z0-9-]+)/);
            if (vendaMatch && vendaMatch[1]) {
              processedMovement.sale_id = vendaMatch[1];
            }
          }
          
          return processedMovement;
        });

        return {
          data: processedData as StockMovement[],
          error: null,
          status: 'success',
        };
      } else {
        // Filtrar movimentações pelo ID do livro
        const { data: allMovements } = await this.getAll();
        let bookMovements = allMovements?.filter(
          movement => movement.book_id === bookId
        ) || [];
        
        // Processar para adicionar sale_id simulado
        bookMovements = bookMovements.map(movement => {
          const processedMovement: StockMovement = {
            ...movement,
            sale_id: undefined
          };
          
          if (movement.type === 'saida' && movement.reason === 'venda' && movement.notes) {
            // Para ambiente de desenvolvimento, simular sale_id
            if (movement.notes.includes('simulada')) {
              processedMovement.sale_id = `simulated-${Date.now()}`;
            } else {
              const vendaMatch = movement.notes.match(/Venda #([a-zA-Z0-9-]+)/);
              if (vendaMatch && vendaMatch[1]) {
                processedMovement.sale_id = vendaMatch[1];
              }
            }
          }
          
          return processedMovement;
        });

        return {
          data: bookMovements,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações do livro:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Método para realizar um ajuste de inventário
  async adjustInventory(
    bookId: string, 
    newQuantity: number, 
    responsible: string, 
    notes?: string
  ): Promise<ServiceResponse<StockMovement>> {
    try {
      // Buscar o livro para verificar estoque atual
      const bookResponse = await bookService.getById(bookId);
      
      if (bookResponse.status === 'error' || !bookResponse.data) {
        return {
          data: null,
          error: bookResponse.error || 'Livro não encontrado',
          status: 'error',
        };
      }

      const book = bookResponse.data;
      const currentQuantity = book.quantity;
      
      // Se as quantidades forem iguais, não há necessidade de ajuste
      if (currentQuantity === newQuantity) {
        return {
          data: null,
          error: 'A quantidade atual é igual à nova quantidade. Nenhum ajuste necessário.',
          status: 'error',
        };
      }

      // Determinar o tipo de ajuste e a quantidade
      const difference = newQuantity - currentQuantity;
      const type = difference > 0 ? 'entrada' : 'saida';
      const quantity = Math.abs(difference);

      // Criar a movimentação de ajuste
      return this.createMovement({
        book_id: bookId,
        type,
        quantity,
        reason: 'ajuste',
        notes: notes || `Ajuste de inventário: ${currentQuantity} → ${newQuantity}`,
        responsible
      });
    } catch (error) {
      console.error('Erro ao realizar ajuste de inventário:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }
}

// Criar e exportar uma instância do serviço
export const stockService = new StockService(); 