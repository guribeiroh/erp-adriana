-- Script para criar e configurar a tabela de transações financeiras

-- Verifica se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'financial_transactions') THEN
        RAISE NOTICE 'Criando tabela financial_transactions...';
        
        -- Cria a tabela se não existir
        CREATE TABLE public.financial_transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            descricao VARCHAR(255) NOT NULL,
            valor DECIMAL(10, 2) NOT NULL,
            data TIMESTAMP WITH TIME ZONE NOT NULL,
            datavencimento TIMESTAMP WITH TIME ZONE,
            datapagamento TIMESTAMP WITH TIME ZONE,
            tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
            categoria VARCHAR(50) NOT NULL,
            status VARCHAR(15) NOT NULL CHECK (status IN ('confirmada', 'pendente', 'cancelada')),
            formapagamento VARCHAR(20) CHECK (formapagamento IN ('dinheiro', 'credito', 'debito', 'pix', 'boleto', 'transferencia')),
            observacoes TEXT,
            vinculoid VARCHAR(100),
            vinculotipo VARCHAR(20) CHECK (vinculotipo IN ('venda', 'compra', 'outro')),
            comprovante VARCHAR(255),
            linkvenda VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices para melhorar a performance
        CREATE INDEX idx_financial_transactions_data ON public.financial_transactions(data);
        CREATE INDEX idx_financial_transactions_tipo ON public.financial_transactions(tipo);
        CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);
        CREATE INDEX idx_financial_transactions_categoria ON public.financial_transactions(categoria);
        CREATE INDEX idx_financial_transactions_vinculo ON public.financial_transactions(vinculoid, vinculotipo);
        
        RAISE NOTICE 'Tabela financial_transactions criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela financial_transactions já existe. Verificando estrutura...';
        
        -- Adicionar colunas que possam estar faltando
        BEGIN
            ALTER TABLE public.financial_transactions 
            ADD COLUMN IF NOT EXISTS linkvenda VARCHAR(255);
            RAISE NOTICE 'Coluna linkvenda verificada/adicionada.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao adicionar coluna linkvenda: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE public.financial_transactions 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at verificada/adicionada.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao adicionar coluna updated_at: %', SQLERRM;
        END;
    END IF;
END $$;

-- Verificar se a extensão uuid-ossp está habilitada (necessária para uuid_generate_v4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        RAISE NOTICE 'Extensão uuid-ossp habilitada.';
    END IF;
END $$;

-- Criar função trigger para atualizar automaticamente o timestamp "updated_at"
CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar automaticamente o campo updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_financial_transactions_updated_at') THEN
        CREATE TRIGGER trigger_update_financial_transactions_updated_at
        BEFORE UPDATE ON public.financial_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_financial_transactions_updated_at();
        
        RAISE NOTICE 'Trigger para atualização automática do campo updated_at criado.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao verificar/criar trigger: %', SQLERRM;
END $$;

-- Criar função para converter valores de texto para formato financeiro correto
CREATE OR REPLACE FUNCTION format_financial_number(value_text TEXT)
RETURNS DECIMAL AS $$
DECLARE
    formatted_value DECIMAL;
BEGIN
    -- Remove caracteres não numéricos, exceto ponto e vírgula
    value_text := regexp_replace(value_text, '[^0-9\.,]', '', 'g');
    
    -- Substitui vírgula por ponto (para formato padrão SQL)
    value_text := replace(value_text, ',', '.');
    
    -- Converte para decimal
    formatted_value := value_text::DECIMAL;
    
    RETURN formatted_value;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql; 