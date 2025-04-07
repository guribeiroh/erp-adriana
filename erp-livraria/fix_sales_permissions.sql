-- Script para configurar permissões de acesso para as tabelas de vendas
-- Este script configura o RLS (Row Level Security) para as tabelas sales e sale_items

-- ===============================================
-- PARTE 1: CONFIGURAÇÃO DA TABELA SALES
-- ===============================================

-- 1. Desabilitar temporariamente o RLS para fazer as alterações
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Permitir acesso total para todos" ON public.sales;
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON public.sales;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.sales;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.sales;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.sales;

-- 3. Criar novas políticas para permitir todas as operações
CREATE POLICY "Permitir acesso total para todos" ON public.sales
  USING (true)
  WITH CHECK (true);

-- 4. Conceder permissões aos roles necessários
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO service_role;

-- 5. Habilitar o RLS novamente com as novas políticas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PARTE 2: CONFIGURAÇÃO DA TABELA SALE_ITEMS
-- ===============================================

-- 1. Desabilitar temporariamente o RLS para fazer as alterações
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Permitir acesso total para todos" ON public.sale_items;
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON public.sale_items;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.sale_items;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.sale_items;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.sale_items;

-- 3. Criar novas políticas para permitir todas as operações
CREATE POLICY "Permitir acesso total para todos" ON public.sale_items
  USING (true)
  WITH CHECK (true);

-- 4. Conceder permissões aos roles necessários
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO service_role;

-- 5. Habilitar o RLS novamente com as novas políticas
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PARTE 3: GARANTIR ACESSO ÀS SEQUÊNCIAS E CHAVES
-- ===============================================

-- Conceder acesso às sequências (se existirem)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===============================================
-- PARTE 4: FUNÇÃO PARA VERIFICAR CONFIGURAÇÃO
-- ===============================================

CREATE OR REPLACE FUNCTION check_sales_tables()
RETURNS TABLE (result TEXT) AS $$
DECLARE
  has_rls_sales BOOLEAN;
  has_rls_items BOOLEAN;
BEGIN
  -- Verificar se RLS está habilitado para a tabela sales
  SELECT relrowsecurity INTO has_rls_sales 
  FROM pg_class 
  WHERE oid = 'public.sales'::regclass;
  
  IF has_rls_sales THEN
    RETURN QUERY SELECT 'RLS está habilitado para a tabela sales'::TEXT;
  ELSE
    RETURN QUERY SELECT 'RLS NÃO está habilitado para a tabela sales'::TEXT;
  END IF;
  
  -- Verificar se RLS está habilitado para a tabela sale_items
  SELECT relrowsecurity INTO has_rls_items 
  FROM pg_class 
  WHERE oid = 'public.sale_items'::regclass;
  
  IF has_rls_items THEN
    RETURN QUERY SELECT 'RLS está habilitado para a tabela sale_items'::TEXT;
  ELSE
    RETURN QUERY SELECT 'RLS NÃO está habilitado para a tabela sale_items'::TEXT;
  END IF;
  
  -- Verificar políticas para sales
  RETURN QUERY 
    SELECT 'Políticas para sales: ' || string_agg(policyname, ', ')::TEXT
    FROM pg_policies
    WHERE tablename = 'sales';
    
  -- Verificar políticas para sale_items
  RETURN QUERY 
    SELECT 'Políticas para sale_items: ' || string_agg(policyname, ', ')::TEXT
    FROM pg_policies
    WHERE tablename = 'sale_items';
END;
$$ LANGUAGE plpgsql; 