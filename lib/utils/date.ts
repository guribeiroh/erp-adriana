/**
 * Utilitários para manipulação e formatação de datas no fuso horário de Brasília
 */

/**
 * Converte uma data para o fuso horário de Brasília e retorna no formato DD/MM/YYYY
 * @param dateString Data em formato string ou ISO
 * @returns Data formatada no padrão brasileiro DD/MM/YYYY ou string vazia se a data for inválida
 */
export function formatBrazilianDate(dateString?: string | null): string {
  if (!dateString) return '';
  
  try {
    // Criar data a partir da string
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Formatar a data para o fuso horário de Brasília
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch (error) {
    console.error(`Erro ao formatar data ${dateString}:`, error);
    return '';
  }
}

/**
 * Converte uma data para o fuso horário de Brasília e retorna no formato HH:MM
 * @param dateString Data em formato string ou ISO
 * @returns Hora formatada no padrão HH:MM ou string vazia se a data for inválida
 */
export function formatBrazilianTime(dateString?: string | null): string {
  if (!dateString) return '';
  
  try {
    // Criar data a partir da string
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Formatar a hora para o fuso horário de Brasília
    return date.toLocaleTimeString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error(`Erro ao formatar hora ${dateString}:`, error);
    return '';
  }
}

/**
 * Converte uma data para o fuso horário de Brasília e retorna no formato completo DD/MM/YYYY HH:MM
 * @param dateString Data em formato string ou ISO
 * @returns Data e hora formatadas ou string vazia se a data for inválida
 */
export function formatBrazilianDateTime(dateString?: string | null): string {
  if (!dateString) return '';
  
  try {
    // Criar data a partir da string
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Formatar a data e hora para o fuso horário de Brasília
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch (error) {
    console.error(`Erro ao formatar data e hora ${dateString}:`, error);
    return '';
  }
}

/**
 * Converte uma data para string ISO ajustada para o fuso horário de Brasília
 * @param dateString Data no formato YYYY-MM-DD
 * @param endOfDay Se true, define a hora para 23:59:59, se false, para 00:00:00
 * @returns Data ISO ajustada para Brasília
 */
export function toBrazilianISOString(dateString: string, endOfDay: boolean = false): string {
  try {
    // Parseamos a data assumindo que está no formato YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Criar a data no fuso de Brasília
    let date;
    if (endOfDay) {
      // Se for final do dia, definimos para 23:59:59
      date = new Date(year, month - 1, day, 23, 59, 59);
    } else {
      // Se for início do dia, definimos para 00:00:00
      date = new Date(year, month - 1, day, 0, 0, 0);
    }
    
    // Convertemos para string ISO
    return date.toISOString();
  } catch (error) {
    console.error(`Erro ao converter data '${dateString}' para ISO brasileira:`, error);
    return dateString; // Em caso de erro, retornar a data original
  }
}

/**
 * Converte uma data para o formato YYYY-MM-DD no fuso horário de Brasília
 * @param dateString Data em formato string ou ISO
 * @returns Data no formato YYYY-MM-DD ou string vazia se a data for inválida
 */
export function toBrazilianDateString(dateString?: string | null): string {
  if (!dateString) return '';
  
  try {
    // Criar data a partir da string
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Obter os componentes da data em fuso horário de Brasília
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    // Formatar usando Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('fr-CA', options); // fr-CA usa formato YYYY-MM-DD
    return formatter.format(date);
  } catch (error) {
    console.error(`Erro ao converter para formato YYYY-MM-DD: ${dateString}`, error);
    return '';
  }
}

/**
 * Obtém a data atual no fuso horário de Brasília
 * @param format Formato de saída ('iso' | 'date-string' | 'locale' | 'date-object')
 * @param withTime Se true, inclui o horário 15:00:00 UTC (equivalente a 12:00 em Brasília)
 * @returns Data atual no formato especificado
 */
export function getCurrentBrazilianDate(format: 'iso' | 'date-string' | 'locale' | 'date-object' = 'date-string', withTime: boolean = false): string | Date {
  // Criar a data atual
  const now = new Date();
  
  // Opções para formatação com o fuso de Brasília
  const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo' };
  
  if (format === 'date-object') {
    // Retorna o objeto Date
    // Obs: O objeto Date em JavaScript sempre representa um instante UTC,
    // então não podemos criar um objeto Date "no fuso de Brasília"
    return now;
  } else if (format === 'iso') {
    // Retorna no formato ISO
    return now.toLocaleString('sv', { ...options, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(' ', 'T') + '.000Z';
  } else if (format === 'locale') {
    // Retorna no formato local brasileiro (DD/MM/YYYY)
    return now.toLocaleDateString('pt-BR', options);
  } else {
    // Para 'date-string', retorna apenas a data no formato YYYY-MM-DD
    try {
      // Obter a data no fuso horário de Brasília usando o Intl
      const formatter = new Intl.DateTimeFormat('fr-CA', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const formattedDate = formatter.format(now);
      // Se withTime for true, adicionar 15:00:00 (que será 12:00 em Brasília)
      // Usamos 15:00 UTC porque Brasília é UTC-3, então isso será meio-dia em Brasília
      return withTime ? `${formattedDate} 15:00:00` : formattedDate;
    } catch (error) {
      console.error('Erro formatando data para Brasília:', error);
      
      // Fallback
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return withTime ? `${dateStr} 15:00:00` : dateStr;
    }
  }
} 