-- Script SQL para configurar políticas de acesso para a tabela customers no Supabase
-- Este script configura as políticas de Row Level Security (RLS) para permitir
-- operações CRUD na tabela customers

-- ===============================================
-- 1. CONFIGURAÇÃO DE POLÍTICA PARA TABELA CUSTOMERS
-- ===============================================

-- Desabilitar RLS temporariamente para configuração
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houverem) para evitar conflitos
DROP POLICY IF EXISTS "Permitir SELECT para todos os usuários" ON customers;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON customers;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON customers;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON customers;

-- Criar políticas para a tabela customers

-- Política de SELECT (leitura) - Todos podem ler
CREATE POLICY "Permitir SELECT para todos os usuários" 
ON customers
FOR SELECT 
USING (true);

-- Política de INSERT (criação) - Apenas usuários autenticados podem criar
CREATE POLICY "Permitir INSERT para usuários autenticados" 
ON customers
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política de UPDATE (atualização) - Apenas usuários autenticados podem atualizar
CREATE POLICY "Permitir UPDATE para usuários autenticados" 
ON customers
FOR UPDATE 
TO authenticated 
USING (true);

-- Política de DELETE (exclusão) - Apenas usuários autenticados podem excluir
CREATE POLICY "Permitir DELETE para usuários autenticados" 
ON customers
FOR DELETE 
TO authenticated 
USING (true);

-- Habilitar RLS novamente
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 2. CONFIGURAÇÃO DE PERMISSÕES PARA ROLES
-- ===============================================

-- Garantir que o role anon (usuário anônimo) pode selecionar da tabela customers
GRANT SELECT ON customers TO anon;

-- Garantir que o role authenticated (usuário autenticado) pode realizar operações CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;

-- Garantir que o role service_role (usado pelo backend) tem acesso completo
GRANT ALL ON customers TO service_role;

-- ===============================================
-- 3. VERIFICAR/CRIAR SEQUÊNCIAS DE ID
-- ===============================================

-- Garantir que a sequência de ID existe e está configurada corretamente 
-- (se você estiver usando um SERIAL ou BIGSERIAL para o ID)

-- Se você estiver usando UUID, esta parte não é necessária, já que o UUID 
-- é geralmente gerado pelo cliente ou por uma função como uuid_generate_v4()

-- ===============================================
-- 4. CRIAR FUNÇÃO PARA VERIFICAR SE A TABELA EXISTE
-- ===============================================

-- Função que verifica se a tabela customers existe e cria se não existir
CREATE OR REPLACE FUNCTION create_customers_table_if_needed() RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        CREATE TABLE public.customers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL, 
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Se a tabela for criada, inicialize as políticas
        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
        
        -- Criar política de SELECT
        CREATE POLICY "Permitir SELECT para todos os usuários" 
        ON customers
        FOR SELECT 
        USING (true);
        
        -- Política de INSERT
        CREATE POLICY "Permitir INSERT para usuários autenticados" 
        ON customers
        FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
        -- Política de UPDATE
        CREATE POLICY "Permitir UPDATE para usuários autenticados" 
        ON customers
        FOR UPDATE 
        TO authenticated 
        USING (true);
        
        -- Política de DELETE
        CREATE POLICY "Permitir DELETE para usuários autenticados" 
        ON customers
        FOR DELETE 
        TO authenticated 
        USING (true);
        
        -- Configurar as permissões
        GRANT SELECT ON customers TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
        GRANT ALL ON customers TO service_role;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para verificar e criar a tabela se necessário
SELECT create_customers_table_if_needed();

-- Dar permissão para todos executarem esta função
GRANT EXECUTE ON FUNCTION create_customers_table_if_needed() TO PUBLIC;
