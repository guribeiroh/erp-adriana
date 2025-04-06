# Configuração do Sistema Financeiro

Este documento contém instruções para configurar corretamente o sistema financeiro do ERP da Livraria.

## Índice

1. [Criação e Configuração da Tabela](#criação-e-configuração-da-tabela)
2. [Configuração das Políticas de Segurança (RLS)](#configuração-das-políticas-de-segurança-rls)
3. [Instalação das Funções de Suporte](#instalação-das-funções-de-suporte)
4. [Solução de Problemas Comuns](#solução-de-problemas-comuns)

## Criação e Configuração da Tabela

A tabela `financial_transactions` armazena todas as transações financeiras do sistema. Para criar e configurar esta tabela, execute o script SQL a seguir no editor SQL do Supabase:

```sql
-- Execute o conteúdo do arquivo setup_financial_transactions_table.sql
```

Este script vai:
1. Criar a tabela se ela não existir
2. Adicionar colunas que possam estar faltando em uma tabela existente
3. Criar índices para melhorar a performance
4. Configurar triggers para atualização automática do campo `updated_at`

## Configuração das Políticas de Segurança (RLS)

O Supabase utiliza Row Level Security (RLS) para controlar o acesso aos dados. Para configurar as políticas de segurança da tabela `financial_transactions`, execute o script SQL a seguir:

```sql
-- Execute o conteúdo do arquivo fix_financial_transactions_permissions.sql
```

Este script vai:
1. Desativar temporariamente o RLS
2. Remover políticas existentes
3. Criar novas políticas para permitir SELECT, INSERT, UPDATE e DELETE para usuários autenticados
4. Reativar o RLS

## Instalação das Funções de Suporte

Para garantir que as operações funcionem corretamente mesmo em caso de problemas com RLS, instale as funções de suporte executando o script SQL a seguir:

```sql
-- Execute o conteúdo do arquivo create_financial_transaction_functions.sql
```

Este script vai criar funções que:
- Verificam o status RLS de uma tabela
- Habilitam ou desabilitam RLS quando necessário
- Inserem transações financeiras ignorando as restrições de RLS

## Solução de Problemas Comuns

### Erro: "new row violates row-level security policy"

Este erro ocorre quando uma operação INSERT, UPDATE ou DELETE viola as políticas de RLS. Para resolver:

1. Verifique se o usuário está corretamente autenticado
2. Execute o script `fix_financial_transactions_permissions.sql` novamente
3. Verifique se as funções do arquivo `create_financial_transaction_functions.sql` estão instaladas

### Erro: "column X does not exist"

Este erro ocorre quando a estrutura da tabela está desatualizada. Para resolver:

1. Execute novamente o script `setup_financial_transactions_table.sql`

### Transações não aparecem no sistema

Se as transações são criadas mas não aparecem no sistema:

1. Verifique os logs do aplicativo (console do navegador)
2. Certifique-se de que o usuário tem permissão para visualizar os dados
3. Verifique se a política RLS para SELECT está corretamente configurada

### Dados inconsistentes entre online e offline

O sistema tem um modo de fallback offline que armazena transações no localStorage. Se houver inconsistência:

1. Sincronize os dados manualmente usando a função `financialService.forcarRecargaDados()`
2. Verifique se as transações offline foram corretamente sincronizadas com o banco de dados

## Verificação da Instalação

Para verificar se a configuração foi bem-sucedida, execute a seguinte consulta SQL:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'financial_transactions'
);

-- Verificar as políticas RLS
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename = 'financial_transactions';

-- Verificar as funções de suporte
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname IN ('check_table_rls', 'disable_rls', 'enable_rls', 'insert_financial_transaction');
``` 