-- Script SQL para adicionar campos de Pessoa Física e Jurídica à tabela customers e corrigir políticas RLS

-- Verificar se a tabela customers existe, caso contrário criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') THEN
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
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END
$$;

-- Adicionar as novas colunas para suporte a pessoa física e jurídica
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'pf' CHECK (customer_type IN ('pf', 'pj')),
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS social_name TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN customers.customer_type IS 'Tipo de cliente: pf (Pessoa Física) ou pj (Pessoa Jurídica)';
COMMENT ON COLUMN customers.cpf IS 'CPF para clientes do tipo pessoa física';
COMMENT ON COLUMN customers.cnpj IS 'CNPJ para clientes do tipo pessoa jurídica';
COMMENT ON COLUMN customers.social_name IS 'Razão social para clientes do tipo pessoa jurídica';
COMMENT ON COLUMN customers.address_complement IS 'Complemento do endereço (apartamento, bloco, etc.)';
COMMENT ON COLUMN customers.status IS 'Status do cliente: ativo ou inativo';

-- Adicionar índices para melhorar a performance de buscas
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_cnpj ON customers(cnpj);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- IMPORTANTE: Temporariamente desabilitar RLS para resolver problemas de permissão
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Permitir SELECT para todos usuários autenticados" ON customers;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON customers;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON customers;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON customers;

-- Reabilitar RLS após a configuração
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso menos restritivas
CREATE POLICY "Permitir operações para todos na tabela customers"
ON customers
USING (true)
WITH CHECK (true);

-- Conceder permissões adequadas
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO anon;
GRANT ALL ON customers TO service_role;

-- Gatilho para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_updated_at(); 