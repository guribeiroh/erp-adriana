# Diagrama Entidade-Relacionamento (ER) - ERP Livraria

Este documento apresenta o diagrama Entidade-Relacionamento do sistema ERP para livrarias em formato Markdown.

## Entidades e Relacionamentos

```
+---------------+     +-------------------+     +-----------------+
|    USERS      |     |     CUSTOMERS     |     |    SUPPLIERS    |
+---------------+     +-------------------+     +-----------------+
| id*           |     | id*               |     | id*             |
| email         |     | name              |     | name            |
| name          |     | email             |     | contact_name    |
| role          |     | phone             |     | email           |
| created_at    |     | address           |     | phone           |
+---------------+     | city              |     | address         |
                      | state             |     | city            |
                      | zip               |     | state           |
                      | notes             |     | zip             |
                      | created_at        |     | notes           |
                      | updated_at        |     | created_at      |
                      +-------------------+     | updated_at      |
                              ^                 +-----------------+
                              |                          ^
                              |                          |
                              |                          |
+---------------+     +-------------------+     +-----------------+
|     SALES     |     | ACCOUNTS_RECEIVABLE|    | ACCOUNTS_PAYABLE |
+---------------+     +-------------------+     +-----------------+
| id*           |     | id*               |     | id*             |
| customer_id   +-----+ sale_id           |     | supplier_id     +---+
| user_id       |     | amount            |     | description     |   |
| total         |     | due_date          |     | amount          |   |
| payment_method|     | payment_date      |     | due_date        |   |
| payment_status|     | status            |     | payment_date    |   |
| notes         |     | notes             |     | status          |   |
| created_at    |     | created_at        |     | notes           |   |
+------+--------+     | updated_at        |     | created_at      |   |
       |              +-------------------+     | updated_at      |   |
       |                                        +-----------------+   |
       v                                                              |
+------+--------+                             +-----------------+     |
|  SALE_ITEMS   |                             |      BOOKS      |     |
+---------------+                             +-----------------+     |
| id*           |                             | id*             |     |
| sale_id       |                             | title           |     |
| book_id       +-----------------------------+ author          |     |
| quantity      |                             | isbn            |     |
| unit_price    |                             | publisher       |     |
| discount      |                             | category        |     |
| total         |                             | subcategory     |     |
+---------------+                             | purchase_price  |     |
                                              | selling_price   |     |
                                              | quantity        |     |
                                              | minimum_stock   |     |
                                              | supplier_id     +-----+
                                              | created_at      |
                                              | updated_at      |
                                              +-----------------+
```

## Descrição dos Relacionamentos

1. **Usuários (USERS)** - Armazena informações sobre os usuários do sistema.
   - Relacionamento 1:N com SALES (um usuário pode registrar múltiplas vendas)

2. **Clientes (CUSTOMERS)** - Armazena informações sobre os clientes da livraria.
   - Relacionamento 1:N com SALES (um cliente pode realizar múltiplas compras)

3. **Fornecedores (SUPPLIERS)** - Armazena informações sobre os fornecedores de livros.
   - Relacionamento 1:N com BOOKS (um fornecedor pode fornecer múltiplos livros)
   - Relacionamento 1:N com ACCOUNTS_PAYABLE (um fornecedor pode ter múltiplas contas a pagar)

4. **Livros (BOOKS)** - Armazena informações sobre os livros disponíveis no estoque.
   - Relacionamento N:1 com SUPPLIERS (um livro pertence a um fornecedor)
   - Relacionamento 1:N com SALE_ITEMS (um livro pode estar em múltiplos itens de venda)

5. **Vendas (SALES)** - Armazena informações sobre as transações de venda.
   - Relacionamento N:1 com USERS (uma venda é registrada por um usuário)
   - Relacionamento N:1 com CUSTOMERS (uma venda pertence a um cliente, opcional)
   - Relacionamento 1:N com SALE_ITEMS (uma venda contém múltiplos itens)
   - Relacionamento 1:N com ACCOUNTS_RECEIVABLE (uma venda pode gerar múltiplas contas a receber)

6. **Itens de Venda (SALE_ITEMS)** - Armazena os itens incluídos em cada venda.
   - Relacionamento N:1 com SALES (um item de venda pertence a uma venda)
   - Relacionamento N:1 com BOOKS (um item de venda refere-se a um livro)

7. **Contas a Receber (ACCOUNTS_RECEIVABLE)** - Armazena informações sobre pagamentos pendentes.
   - Relacionamento N:1 com SALES (uma conta a receber está associada a uma venda)

8. **Contas a Pagar (ACCOUNTS_PAYABLE)** - Armazena informações sobre pagamentos a fornecedores.
   - Relacionamento N:1 com SUPPLIERS (uma conta a pagar está associada a um fornecedor)

## Observações sobre o Esquema

- Chaves primárias são indicadas com asterisco (*)
- Todas as datas (created_at, updated_at) são armazenadas em formato ISO com timezone
- Valores monetários (total, amount, price) são armazenados como DECIMAL(10,2)
- Valores de quantidade (quantity) são armazenados como INTEGER
- Status são armazenados como TEXT com checagem de enumeração 