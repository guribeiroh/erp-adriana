# Como Resolver Problemas de Conexão com o Supabase

## Ferramentas de Diagnóstico

1. **Página de Diagnóstico Web**
   - Acesse `/dashboard/debug` para verificar o status da conexão e testar operações CRUD.

2. **Script de Diagnóstico em Linha de Comando**
   - Execute `node lib/scripts/helpers/debugDB.js` para um diagnóstico completo.

## Problemas Comuns e Soluções

### 1. Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` na raiz do projeto contém as variáveis corretas:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 2. Políticas de Segurança (RLS)

Execute os scripts SQL de configuração de políticas no painel do Supabase:

- `setup_customers_policies.sql` para a tabela de clientes
- `setup_books_policies.sql` para a tabela de produtos e storage

### 3. Tabelas Ausentes ou Incorretas

Verifique se as tabelas `customers` e `products` existem com a estrutura correta:

```sql
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  year TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Problemas com Storage

Se estiver tendo problemas com upload de imagens:

1. Verifique se o bucket `books` existe
2. Certifique-se de que as políticas de RLS para o bucket estão configuradas
3. Para testar, você pode temporariamente desativar RLS para testes

## Usando Dados Simulados

Para desenvolvimento sem Supabase, modifique o arquivo `lib/supabase/client.ts` para habilitar dados simulados:

```typescript
export const useMockData = true;
```

Isso irá usar os serviços de simulação em vez de enviar requisições para o Supabase.

## Verificando Erros de Rede

Se estiver vendo erros de rede ou 404/500 nas requisições:

1. Abra as ferramentas de desenvolvedor do navegador (F12)
2. Verifique a aba "Network" 
3. Procure por requisições com erro para o domínio do Supabase
4. Verifique o corpo da resposta para mensagens de erro detalhadas

## Soluções para Erros Específicos

### Erro: "new row violates row-level security policy"

Este erro ocorre quando as políticas RLS bloqueiam a inserção/atualização:

1. Verifique se as políticas para a tabela em questão estão configuradas corretamente
2. Execute os scripts SQL para configurar as políticas
3. Temporariamente, você pode desativar o RLS para a tabela para depuração:

```sql
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- Após os testes, lembre-se de reabilitar:
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
```

### Erro: "column X of relation Y does not exist"

Este erro ocorre quando a estrutura da tabela não corresponde ao modelo esperado:

1. Verifique o esquema da tabela no painel do Supabase 
2. Compare com o modelo esperado na aplicação
3. Adicione as colunas ausentes ou ajuste o código para corresponder à estrutura da tabela

## Etapas de Instalação do Zero

Se estiver configurando o projeto em um novo ambiente:

1. Clone o repositório
2. Crie um arquivo `.env.local` com as variáveis do Supabase
3. Execute `npm install`
4. Acesse o Supabase e crie um novo projeto
5. Execute os scripts SQL para criar tabelas e configurar políticas
6. Execute `npm run dev` para iniciar a aplicação 