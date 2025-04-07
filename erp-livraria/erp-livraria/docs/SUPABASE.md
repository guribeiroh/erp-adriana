# Configuração do Supabase para o ERP Livraria

Este documento descreve como configurar o Supabase para ser usado como banco de dados e autenticação no sistema ERP para livrarias.

## 1. Criação da conta e projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta ou faça login
2. Clique em "New Project" para criar um novo projeto
3. Escolha um nome para o projeto (ex: "erp-livraria")
4. Escolha uma senha forte para o banco de dados
5. Selecione a região mais próxima para hospedar o projeto
6. Clique em "Create new project"

## 2. Obtenção das credenciais

Após a criação do projeto, você precisará das credenciais para conectar sua aplicação:

1. Na dashboard do Supabase, vá para Settings > API
2. Você verá dois valores importantes:
   - **URL**: `https://[seu-id-projeto].supabase.co`
   - **anon key**: Uma chave pública para acesso anônimo

Essas credenciais devem ser adicionadas ao arquivo `.env.local` do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://[seu-id-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

## 3. Criação das tabelas

Execute os seguintes comandos SQL no editor SQL do Supabase para criar as tabelas necessárias:

### Tabela de Usuários

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'cashier', 'inventory')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela de Clientes

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela de Fornecedores

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela de Livros

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  publisher TEXT,
  category TEXT,
  subcategory TEXT,
  purchase_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela de Vendas

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES auth.users(id),
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'transfer')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'canceled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela de Itens de Venda

```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL
);
```

### Tabela de Contas a Receber

```sql
CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela de Contas a Pagar

```sql
CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Configuração das RLS (Row Level Security)

Para garantir a segurança dos dados, configure as políticas de acesso para cada tabela:

```sql
-- Exemplo para a tabela de livros
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa autenticada pode ler livros"
  ON books FOR SELECT
  USING (auth.role() = 'authenticated');
  
CREATE POLICY "Apenas funcionários do estoque podem inserir/atualizar livros"
  ON books FOR INSERT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager', 'inventory')
    )
  );
  
CREATE POLICY "Apenas funcionários do estoque podem atualizar livros"
  ON books FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager', 'inventory')
    )
  );
```

Configure políticas semelhantes para as outras tabelas de acordo com as necessidades de segurança.

## 5. Autenticação e Autorização

O Supabase oferece autenticação baseada em JWT. Para usar:

1. Configure os provedores de autenticação desejados em Authentication > Settings
2. Para email/senha, você pode usar a configuração padrão
3. Após o login, o usuário receberá um token JWT que pode ser usado para acessar recursos protegidos

## 6. Funções e Gatilhos

Crie funções e gatilhos para lógica mais complexa:

```sql
-- Gatilho para atualizar o estoque quando um item é vendido
CREATE OR REPLACE FUNCTION decrease_book_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_sale_item_insert
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION decrease_book_stock();
```

## 7. Dicas e Boas Práticas

- Use consultas parametrizadas sempre para evitar injeção de SQL
- Evite armazenar dados sensíveis sem criptografia
- Faça backup regularmente
- Use transações para operações que afetam várias tabelas (como vendas)
- Configure alertas para monitorar o uso de recursos

## Recursos Adicionais

- [Documentação oficial do Supabase](https://supabase.io/docs)
- [Exemplos de autenticação com Next.js](https://github.com/supabase/supabase/tree/master/examples/nextjs-auth)
- [Exemplos de CRUD com Supabase](https://github.com/supabase/supabase/tree/master/examples/nextjs-todo-list) 