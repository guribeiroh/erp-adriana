/**
 * Utilitários para manipulação de datas
 */

/**
 * Formata uma data para o formato YYYY-MM-DD
 * @param date Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
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
 * Adiciona dias a uma data
 * @param date Data base
 * @param days Número de dias a adicionar (pode ser negativo)
 * @returns Nova data com os dias adicionados/subtraídos
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