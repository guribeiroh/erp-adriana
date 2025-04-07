-- Adicionar a coluna updated_at à tabela sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualizar os registros existentes para ter um valor em updated_at
UPDATE public.sales SET updated_at = created_at WHERE updated_at IS NULL;

-- Criar ou substituir a função de trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para atualizar automaticamente o campo updated_at
DROP TRIGGER IF EXISTS set_sales_updated_at ON public.sales;
CREATE TRIGGER set_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.sales.updated_at IS 'Data e hora da última atualização da venda';

-- Confirmar alteração concluída
SELECT 'Coluna updated_at adicionada com sucesso à tabela sales' as resultado; 