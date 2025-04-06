-- Função para desabilitar RLS para uma tabela específica
CREATE OR REPLACE FUNCTION disable_rls_for_table(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao desabilitar RLS para a tabela %: %', table_name, SQLERRM;
    RETURN false;
END;
$$;

-- Função para habilitar RLS para uma tabela específica
CREATE OR REPLACE FUNCTION enable_rls_for_table(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao habilitar RLS para a tabela %: %', table_name, SQLERRM;
    RETURN false;
END;
$$;

-- Conceder permissão para usar estas funções
GRANT EXECUTE ON FUNCTION disable_rls_for_table TO anon, authenticated;
GRANT EXECUTE ON FUNCTION enable_rls_for_table TO anon, authenticated; 