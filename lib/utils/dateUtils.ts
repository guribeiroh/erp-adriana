/**
 * Utilitários para manipulação de datas
 */

/**
 * Formata uma data no formato YYYY-MM-DD
 * @param date A data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formata uma data para exibição em formato brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String no formato DD/MM/YYYY
 */
export const formatDateToBR = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Verifica se uma data está entre duas outras datas
 * @param date Data a ser verificada
 * @param startDate Data de início
 * @param endDate Data de fim
 * @returns true se a data estiver dentro do intervalo (inclusive)
 */
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * Adiciona um número de dias a uma data
 * @param date A data de referência
 * @param days Número de dias a adicionar (negativo para subtrair)
 * @returns A nova data
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Retorna o primeiro dia do mês de uma data
 * @param date Data de referência
 * @returns Data do primeiro dia do mês
 */
export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Retorna o último dia do mês de uma data
 * @param date Data de referência
 * @returns Data do último dia do mês
 */
export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Obtém a data atual no formato brasileiro (DD/MM/YYYY)
 * @returns String no formato DD/MM/YYYY
 */
export const getCurrentBrazilianDate = (): string => {
  const today = new Date();
  return today.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data no formato brasileiro (DD/MM/YYYY)
 * @param date A data a ser formatada
 * @returns String no formato DD/MM/YYYY
 */
export const formatBrazilianDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Verifica se uma data é válida
 * @param date A data a ser verificada
 * @returns true se a data for válida, false caso contrário
 */
export const isValidDate = (date: any): boolean => {
  if (date === null || date === undefined) return false;
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date instanceof Date && !isNaN(date.getTime());
}; 