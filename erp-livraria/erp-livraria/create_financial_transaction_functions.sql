-- Funções seguras para manipulação da tabela financial_transactions sem problemas de RLS

-- Função para verificar se uma tabela tem RLS ativado
CREATE OR REPLACE FUNCTION check_table_rls(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
DECLARE
    has_rls BOOLEAN;
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        RAISE EXCEPTION 'Tabela % não existe', table_name;
    END IF;

    -- Verificar se a tabela tem RLS ativado
    EXECUTE format('
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE oid = %L::regclass', 
        'public.' || table_name
    ) INTO has_rls;
    
    RETURN has_rls;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao verificar RLS da tabela %: %', table_name, SQLERRM;
        RETURN NULL;
END;
$$;

-- Função para desabilitar RLS em uma tabela
CREATE OR REPLACE FUNCTION disable_rls(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        RAISE EXCEPTION 'Tabela % não existe', table_name;
    END IF;

    -- Desabilitar RLS
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
    
    RETURN TRUE;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao desabilitar RLS da tabela %: %', table_name, SQLERRM;
        RETURN FALSE;
END;
$$;

-- Função para habilitar RLS em uma tabela
CREATE OR REPLACE FUNCTION enable_rls(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        RAISE EXCEPTION 'Tabela % não existe', table_name;
    END IF;

    -- Habilitar RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    
    RETURN TRUE;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao habilitar RLS da tabela %: %', table_name, SQLERRM;
        RETURN FALSE;
END;
$$;

-- Função para inserir transação financeira ignorando RLS
CREATE OR REPLACE FUNCTION insert_financial_transaction(
    p_descricao VARCHAR(255),
    p_valor DECIMAL(10, 2),
    p_data TIMESTAMP WITH TIME ZONE,
    p_datavencimento TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_datapagamento TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_tipo VARCHAR(10),
    p_categoria VARCHAR(50),
    p_status VARCHAR(15),
    p_formapagamento VARCHAR(20) DEFAULT NULL,
    p_observacoes TEXT DEFAULT NULL,
    p_vinculoid VARCHAR(100) DEFAULT NULL,
    p_vinculotipo VARCHAR(20) DEFAULT NULL,
    p_comprovante VARCHAR(255) DEFAULT NULL,
    p_linkvenda VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador da função
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'financial_transactions') THEN
        RAISE EXCEPTION 'Tabela financial_transactions não existe';
    END IF;

    -- Inserir a transação
    INSERT INTO public.financial_transactions (
        descricao,
        valor,
        data,
        datavencimento,
        datapagamento,
        tipo,
        categoria,
        status,
        formapagamento,
        observacoes,
        vinculoid,
        vinculotipo,
        comprovante,
        linkvenda,
        created_at,
        updated_at
    ) VALUES (
        p_descricao,
        p_valor,
        p_data,
        p_datavencimento,
        p_datapagamento,
        p_tipo,
        p_categoria,
        p_status,
        p_formapagamento,
        p_observacoes,
        p_vinculoid,
        p_vinculotipo,
        p_comprovante,
        p_linkvenda,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
EXCEPTION 
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao inserir transação financeira: %', SQLERRM;
END;
$$; 