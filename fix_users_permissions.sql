-- Script para configurar permissões de acesso para a tabela users
-- Este script configura o RLS (Row Level Security) para a tabela users 
-- e garante que os usuários possam ser criados/atualizados automaticamente

-- ===============================================
-- CONFIGURAÇÃO DA TABELA USERS
-- ===============================================

-- 1. Desabilitar temporariamente o RLS para fazer as alterações
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Permitir acesso total para todos" ON public.users;
DROP POLICY IF EXISTS "Permitir SELECT para todos" ON public.users;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON public.users;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON public.users;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON public.users;

-- 3. Criar novas políticas para permitir todas as operações
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir SELECT para todos" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir que usuários criem seus próprios registros
CREATE POLICY "Permitir INSERT para usuários autenticados" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permitir que usuários atualizem seus próprios registros
CREATE POLICY "Permitir UPDATE para usuários autenticados" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Permitir que usuários excluam seus próprios registros (raramente usado)
CREATE POLICY "Permitir DELETE para usuários autenticados" ON public.users
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- 4. Re-habilitar RLS com as novas políticas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Criar uma função que permite criar/atualizar qualquer usuário independente do RLS
CREATE OR REPLACE FUNCTION public.register_user(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text DEFAULT 'vendedor'
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (user_id, user_email, user_name, user_role, now(), now())
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = user_email,
    name = user_name,
    role = COALESCE(users.role, user_role),
    updated_at = now()
  RETURNING *;
END;
$$;

-- 6. Conceder permissões para que todos os usuários possam executar a função
GRANT EXECUTE ON FUNCTION public.register_user TO anon;
GRANT EXECUTE ON FUNCTION public.register_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_user TO service_role;

-- 7. Criar um gatilho que sincroniza os usuários após cada alteração na autenticação
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_name text;
  user_role text;
BEGIN
  SELECT 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor')
  INTO user_name, user_role;
  
  PERFORM public.register_user(
    NEW.id,
    NEW.email,
    user_name,
    user_role
  );
  
  RETURN NEW;
END;
$$;

-- 8. Configurar o gatilho apenas se o schema auth existir e não criar se já existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    -- Remover o gatilho se já existir
    DROP TRIGGER IF EXISTS sync_auth_users ON auth.users;
    
    -- Criar o gatilho
    CREATE TRIGGER sync_auth_users
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
  ELSE
    RAISE NOTICE 'Tabela auth.users não encontrada. Ignorando criação do gatilho.';
  END IF;
END
$$; 