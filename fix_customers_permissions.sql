-- Script para corrigir permissões da tabela customers
-- Aplicar diretamente no editor SQL do Supabase

-- 1. Desabilitar temporariamente o RLS para fazer as alterações
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
