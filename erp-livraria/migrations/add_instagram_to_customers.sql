-- Adicionar coluna de Instagram à tabela de clientes
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN customers.instagram IS 'Nome de usuário do Instagram do cliente (sem @)';

-- Atualizar a migração no log
INSERT INTO migrations (name, executed_at) 
VALUES ('add_instagram_to_customers', NOW())
ON CONFLICT (name) DO UPDATE SET executed_at = NOW(); 