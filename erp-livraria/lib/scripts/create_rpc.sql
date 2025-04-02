-- Criar função para listar as colunas de uma tabela
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
) LANGUAGE SQL AS $$
    SELECT 
        column_name::text,
        data_type::text,
        (is_nullable = 'YES')::boolean as is_nullable,
        column_default::text
    FROM 
        information_schema.columns
    WHERE 
        table_schema = 'public'
        AND table_name = $1
    ORDER BY 
        ordinal_position;
$$;

-- Conceder permissão para executar esta função
GRANT EXECUTE ON FUNCTION get_table_columns TO anon, authenticated; 