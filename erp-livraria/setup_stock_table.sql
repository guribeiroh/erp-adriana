-- Script para criar a tabela de movimentações de estoque no Supabase
-- Execute este script no SQL Editor do Supabase para configurar a tabela e permissões

-- Criar tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  notes TEXT,
  responsible TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.stock_movements IS 'Tabela que armazena todas as movimentações de estoque de livros';
COMMENT ON COLUMN public.stock_movements.id IS 'ID único da movimentação';
COMMENT ON COLUMN public.stock_movements.book_id IS 'ID do livro relacionado à movimentação';
COMMENT ON COLUMN public.stock_movements.type IS 'Tipo de movimentação: entrada ou saída';
COMMENT ON COLUMN public.stock_movements.quantity IS 'Quantidade movimentada, sempre um número positivo';
COMMENT ON COLUMN public.stock_movements.reason IS 'Motivo da movimentação (compra, venda, ajuste, etc.)';
COMMENT ON COLUMN public.stock_movements.notes IS 'Observações opcionais sobre a movimentação';
COMMENT ON COLUMN public.stock_movements.responsible IS 'Nome ou ID da pessoa responsável pela movimentação';
COMMENT ON COLUMN public.stock_movements.created_at IS 'Data e hora da criação do registro';
COMMENT ON COLUMN public.stock_movements.updated_at IS 'Data e hora da última atualização do registro';

-- Adicionar trigger para atualizar o timestamp da última atualização
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para updated_at
DROP TRIGGER IF EXISTS set_stock_movements_updated_at ON public.stock_movements;
CREATE TRIGGER set_stock_movements_updated_at
BEFORE UPDATE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Criar funções para incrementar e decrementar estoque
-- Estas funções serão usadas para atualizar a quantidade em estoque na tabela books
CREATE OR REPLACE FUNCTION increment(x integer, row_id uuid)
RETURNS integer AS $$
  UPDATE books SET quantity = quantity + x WHERE id = row_id;
  SELECT quantity FROM books WHERE id = row_id;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrement(x integer, row_id uuid)
RETURNS integer AS $$
  UPDATE books SET quantity = quantity - x WHERE id = row_id;
  SELECT quantity FROM books WHERE id = row_id;
$$ LANGUAGE SQL;

-- Configurar as permissões RLS (Row Level Security)

-- Primeiramente, habilitar RLS na tabela
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.stock_movements;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.stock_movements;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.stock_movements;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON public.stock_movements;

-- Criar política para leitura - Qualquer usuário autenticado pode ler os registros
CREATE POLICY "Permitir leitura para usuários autenticados"
ON public.stock_movements FOR SELECT
TO authenticated
USING (TRUE);

-- Criar política para inserção - Qualquer usuário autenticado pode criar novos registros
CREATE POLICY "Permitir inserção para usuários autenticados"
ON public.stock_movements FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- Criar política para atualização - Apenas administradores podem atualizar registros
CREATE POLICY "Permitir atualização para administradores"
ON public.stock_movements FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Criar política para exclusão - Apenas administradores podem excluir registros
CREATE POLICY "Permitir exclusão para administradores"
ON public.stock_movements FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Conceder permissões para o papel anon (anônimo)
GRANT SELECT ON public.stock_movements TO anon;

-- Conceder permissões para o papel authenticated (autenticado)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;

-- Conceder permissões para o papel service_role
GRANT ALL ON public.stock_movements TO service_role;

-- Conceder permissões para usar as funções de incremento e decremento
GRANT EXECUTE ON FUNCTION public.increment TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement TO anon, authenticated, service_role; 