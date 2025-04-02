import { supabase, shouldUseRealData } from '../supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Tipo genérico para entidades
export type Entity = {
  id: string;
  [key: string]: any;
};

// Tipo para respostas do serviço
export type ServiceResponse<T> = {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
};

// Tipo para paginação
export type PaginationParams = {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
};

// Tipo para filtros
export type FilterParams = {
  [key: string]: any;
};

// Classe base para serviços
export abstract class BaseService<T extends Entity> {
  protected tableName: string;
  protected mockData: T[];

  constructor(tableName: string, mockData: T[] = []) {
    this.tableName = tableName;
    this.mockData = mockData;
  }

  // Obter todos os registros (com paginação e filtros opcionais)
  async getAll(
    pagination?: PaginationParams,
    filters?: FilterParams
  ): Promise<ServiceResponse<T[]>> {
    try {
      // Log para debug
      console.log(`[${this.tableName}] shouldUseRealData: ${shouldUseRealData()}, supabase disponível: ${!!supabase}`);
      
      // Verificar se devemos usar dados reais ou simulados
      if (shouldUseRealData() && supabase) {
        let query = supabase.from(this.tableName).select('*');

        // Aplicar filtros se fornecidos
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Aplicar paginação se fornecida
        if (pagination) {
          const { page = 1, pageSize = 10, orderBy, orderDirection = 'asc' } = pagination;
          const start = (page - 1) * pageSize;
          const end = start + pageSize - 1;

          query = query.range(start, end);

          if (orderBy) {
            query = query.order(orderBy, { ascending: orderDirection === 'asc' });
          }
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          data: data as T[],
          error: null,
          status: 'success',
        };
      } else {
        // Usar dados simulados para demonstração
        console.log('Usando dados simulados para', this.tableName);
        
        let result = [...this.mockData];

        // Aplicar filtros
        if (filters) {
          result = result.filter((item) => {
            return Object.entries(filters).every(([key, value]) => {
              if (value === undefined || value === null) return true;
              return item[key] === value;
            });
          });
        }

        // Aplicar ordenação
        if (pagination?.orderBy) {
          const { orderBy, orderDirection = 'asc' } = pagination;
          result.sort((a, b) => {
            if (a[orderBy] < b[orderBy]) return orderDirection === 'asc' ? -1 : 1;
            if (a[orderBy] > b[orderBy]) return orderDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }

        // Aplicar paginação
        if (pagination) {
          const { page = 1, pageSize = 10 } = pagination;
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          result = result.slice(start, end);
        }

        return {
          data: result,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error(`Erro ao buscar ${this.tableName}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Obter um registro por ID
  async getById(id: string): Promise<ServiceResponse<T>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return {
          data: data as T,
          error: null,
          status: 'success',
        };
      } else {
        // Usar dados simulados
        const item = this.mockData.find((item) => item.id === id);
        
        if (!item) {
          return {
            data: null,
            error: `Item com ID ${id} não encontrado`,
            status: 'error',
          };
        }

        return {
          data: { ...item },
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error(`Erro ao buscar ${this.tableName} por ID:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Criar um novo registro
  async create(data: Omit<T, 'id'>): Promise<ServiceResponse<T>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { data: insertedData, error } = await supabase
          .from(this.tableName)
          .insert([data])
          .select()
          .single();

        if (error) throw error;

        return {
          data: insertedData as T,
          error: null,
          status: 'success',
        };
      } else {
        // Simular criação com dados simulados
        const newId = crypto.randomUUID();
        const newItem = { id: newId, ...data, created_at: new Date().toISOString() } as T;
        
        this.mockData.push(newItem);

        return {
          data: { ...newItem },
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error(`Erro ao criar ${this.tableName}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Atualizar um registro existente
  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { data: updatedData, error } = await supabase
          .from(this.tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return {
          data: updatedData as T,
          error: null,
          status: 'success',
        };
      } else {
        // Simular atualização com dados simulados
        const index = this.mockData.findIndex((item) => item.id === id);
        
        if (index === -1) {
          return {
            data: null,
            error: `Item com ID ${id} não encontrado`,
            status: 'error',
          };
        }

        const updatedItem = { 
          ...this.mockData[index], 
          ...data, 
          updated_at: new Date().toISOString() 
        };
        
        this.mockData[index] = updatedItem;

        return {
          data: { ...updatedItem },
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error(`Erro ao atualizar ${this.tableName}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }

  // Excluir um registro
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      if (shouldUseRealData() && supabase) {
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('id', id);

        if (error) throw error;

        return {
          data: true,
          error: null,
          status: 'success',
        };
      } else {
        // Simular exclusão com dados simulados
        const index = this.mockData.findIndex((item) => item.id === id);
        
        if (index === -1) {
          return {
            data: null,
            error: `Item com ID ${id} não encontrado`,
            status: 'error',
          };
        }

        this.mockData.splice(index, 1);

        return {
          data: true,
          error: null,
          status: 'success',
        };
      }
    } catch (error) {
      console.error(`Erro ao excluir ${this.tableName}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        status: 'error',
      };
    }
  }
} 