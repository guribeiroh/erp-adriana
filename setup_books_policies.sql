-- Script SQL para configurar políticas de acesso para a tabela books e storage books no Supabase

-- PARTE 1: CONFIGURAÇÃO DA TABELA BOOKS
-- ======================================

-- 1. Primeiro, desativamos temporariamente o RLS (Row Level Security) para permitir a configuração
ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- 2. Removemos todas as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Permitir SELECT para todos os usuários" ON books;
DROP POLICY IF EXISTS "Permitir INSERT para todos os usuários" ON books;
DROP POLICY IF EXISTS "Permitir UPDATE para todos os usuários" ON books;
DROP POLICY IF EXISTS "Permitir DELETE para todos os usuários" ON books;

-- 3. Criamos novas políticas que permitam todas as operações CRUD
-- Política para permitir SELECT (leitura)
CREATE POLICY "Permitir SELECT para todos os usuários"
ON books
FOR SELECT
USING (true);

-- Política para permitir INSERT (criação)
CREATE POLICY "Permitir INSERT para todos os usuários"
ON books
FOR INSERT
WITH CHECK (true);

-- Política para permitir UPDATE (atualização)
CREATE POLICY "Permitir UPDATE para todos os usuários"
ON books
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para permitir DELETE (exclusão)
CREATE POLICY "Permitir DELETE para todos os usuários"
ON books
FOR DELETE
USING (true);

-- 4. Reativamos o RLS agora que as políticas estão configuradas
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- PARTE 2: CONFIGURAÇÃO DO STORAGE PARA BUCKETS
-- =============================================

-- Primeiro precisamos verificar e criar o bucket 'books' se ele não existir
-- No Supabase SQL, não podemos verificar a existência de um bucket diretamente via SQL
-- Vamos apenas garantir que as políticas corretas sejam aplicadas

-- 1. Remover políticas existentes para o bucket 'books' (se existirem)
DROP POLICY IF EXISTS "Permitir download público para todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir gerenciamento para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir remoção para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload para todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir gerenciamento para todos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir remoção para todos" ON storage.objects;

-- 2. Criar políticas para permitir acesso público para download e acesso de upload/update/delete para todos
-- Política para permitir download público
CREATE POLICY "Permitir download público para todos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'books' OR bucket_id IS NULL);

-- Política para permitir upload para todos (normalmente seria apenas para usuários autenticados)
CREATE POLICY "Permitir upload para todos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'books' OR bucket_id IS NULL);

-- Política para permitir atualização para todos
CREATE POLICY "Permitir gerenciamento para todos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'books' OR bucket_id IS NULL)
WITH CHECK (bucket_id = 'books' OR bucket_id IS NULL);

-- Política para permitir exclusão para todos
CREATE POLICY "Permitir remoção para todos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'books' OR bucket_id IS NULL);

-- PARTE 3: PERMISSÕES DE ACESSO ADMINISTRATIVO
-- ============================================

-- Garantir que o papel anon (usuário anônimo) tenha todas as permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE books TO service_role;

-- Permissões para sequências (se houver alguma associada à tabela books)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- PARTE 4: CONFIGURAÇÃO PARA BUCKETS DE STORAGE
-- =============================================

-- Conceder permissões de uso do bucket 'books'
-- Infelizmente, não é possível definir permissões específicas de bucket via SQL padrão
-- Isso precisa ser feito via interface do Supabase ou via API

-- Em vez disso, podemos dar permissões gerais para o schema storage
GRANT ALL ON SCHEMA storage TO anon;
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;

-- PARTE 5: CRIAR O BUCKET DIRETAMENTE 
-- ===================================

-- Criar o bucket 'books' diretamente se ele não existir
DO $$
BEGIN
    -- Verificar se o bucket já existe
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'books') THEN
        -- Criar o bucket
        INSERT INTO storage.buckets (id, name, public, avif_autodetection)
        VALUES ('books', 'books', true, false);
    END IF;
END $$;

-- PARTE 6: FUNÇÃO AUXILIAR PARA CRIAR O BUCKET (opcional)
-- =======================================================

-- Esta função pode ser chamada do lado do cliente para criar o bucket se ele não existir
CREATE OR REPLACE FUNCTION create_books_bucket()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função
AS $$
DECLARE
  bucket_exists boolean;
BEGIN
  -- Verificar se o bucket já existe
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'books'
  ) INTO bucket_exists;
  
  -- Se o bucket não existir, criar
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public, avif_autodetection)
    VALUES ('books', 'books', true, false);
    RETURN true;
  END IF;
  
  RETURN bucket_exists;
END;
$$;

-- Dar permissão para todos os usuários executarem a função
GRANT EXECUTE ON FUNCTION create_books_bucket TO anon;
GRANT EXECUTE ON FUNCTION create_books_bucket TO authenticated;
