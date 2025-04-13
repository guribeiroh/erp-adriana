-- Script para corrigir permissões da tabela customers
-- Este script resolve problemas de Row Level Security para a tabela de clientes

-- 1. Desabilitar temporariamente o RLS para fazer as alterações
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Permitir acesso total para usuários autenticados" ON public.customers;
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON public.customers;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.customers;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.customers;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.customers;

-- 3. Criar novas políticas para permitir todas as operações
CREATE POLICY "Permitir acesso total para todos" ON public.customers
  USING (true)
  WITH CHECK (true);

-- 4. Conceder permissões aos roles necessários
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO service_role;

-- 5. Habilitar o RLS novamente com as novas políticas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 6. Verificar e corrigir a sequência de ID se necessário
-- (isso não é diretamente relacionado ao RLS, mas pode ajudar em outros problemas)
-- SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers), true);

-- 7. Criar trigger para atualizar automaticamente o campo updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.customers;
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 8. Adicionar função para verificar se há problemas na tabela
CREATE OR REPLACE FUNCTION check_customers_table()
RETURNS TABLE (result TEXT) AS $$
DECLARE
  has_rls BOOLEAN;
BEGIN
  -- Verificar se RLS está habilitado
  SELECT relrowsecurity INTO has_rls 
  FROM pg_class 
  WHERE oid = 'public.customers'::regclass;
  
  IF has_rls THEN
    RETURN QUERY SELECT 'RLS está habilitado para a tabela customers'::TEXT;
  ELSE
    RETURN QUERY SELECT 'RLS NÃO está habilitado para a tabela customers'::TEXT;
  END IF;
  
  -- Verificar se as políticas foram criadas
  RETURN QUERY 
    SELECT 'Políticas encontradas: ' || string_agg(policyname, ', ')::TEXT
    FROM pg_policies
    WHERE tablename = 'customers';
    
  -- Verificar permissões da tabela
  RETURN QUERY
    SELECT 'Permissões na tabela: ' || string_agg(privilege_type, ', ')::TEXT
    FROM information_schema.role_table_grants
    WHERE table_name = 'customers'
    AND grantee = 'authenticated';
END;
$$ LANGUAGE plpgsql; 