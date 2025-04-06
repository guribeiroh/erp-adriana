-- Este script configura o RLS (Row Level Security) para a tabela financial_transactions
-- para garantir que as operações de leitura e escrita funcionem corretamente.

-- Desativar temporariamente o RLS para permitir a configuração
ALTER TABLE public.financial_transactions DISABLE ROW LEVEL SECURITY;

-- Se a tabela não tiver a opção RLS ativada, vamos ativá-la
DO $$
DECLARE
    has_rls boolean;
BEGIN
    SELECT relrowsecurity INTO has_rls
    FROM pg_class
    WHERE oid = 'public.financial_transactions'::regclass;
    
    IF NOT has_rls THEN
        RAISE NOTICE 'Ativando RLS para a tabela financial_transactions';
    END IF;
END $$;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS financial_transactions_select_policy ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_insert_policy ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_update_policy ON public.financial_transactions;
DROP POLICY IF EXISTS financial_transactions_delete_policy ON public.financial_transactions;

-- Criar política para SELECT (leitura)
CREATE POLICY financial_transactions_select_policy
    ON public.financial_transactions FOR SELECT
    USING (true);  -- Todos os usuários autenticados podem ver todas as transações

-- Criar política para INSERT (escrita)
CREATE POLICY financial_transactions_insert_policy
    ON public.financial_transactions FOR INSERT
    WITH CHECK (true);  -- Todos os usuários autenticados podem inserir transações

-- Criar política para UPDATE (atualização)
CREATE POLICY financial_transactions_update_policy
    ON public.financial_transactions FOR UPDATE
    USING (true);  -- Todos os usuários autenticados podem atualizar transações

-- Criar política para DELETE (exclusão)
CREATE POLICY financial_transactions_delete_policy
    ON public.financial_transactions FOR DELETE
    USING (true);  -- Todos os usuários autenticados podem excluir transações

-- Reativar o RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram criadas corretamente
DO $$
DECLARE
    policies_count integer;
BEGIN
    SELECT COUNT(*) INTO policies_count
    FROM pg_policy
    WHERE schemaname = 'public' AND tablename = 'financial_transactions';
    
    RAISE NOTICE 'Número de políticas RLS na tabela financial_transactions: %', policies_count;
END $$; 