# Documento de Progresso - ERP Livraria

Este documento registra o progresso e as decisões de desenvolvimento do sistema ERP para livraria.

## 📅 01/04/2023 - Configuração Inicial

### Tarefas Concluídas
- Criação do projeto Next.js com TypeScript e TailwindCSS
- Instalação das dependências iniciais:
  - Supabase para banco de dados e autenticação
  - React Hook Form e Zod para validação de formulários
  - Lucide React para ícones
  - Radix UI para componentes de interface acessíveis
  - Date-fns para manipulação de datas
- Estruturação inicial do README
- Criação da estrutura básica de pastas e arquivos

### Decisões de Design
- Utilização de App Router do Next.js para melhor SEO e controle de rotas
- Adoção de TypeScript para segurança de tipos
- TailwindCSS para estilização rápida e consistente
- Arquitetura modular para facilitar manutenção e escalabilidade

### Próximos Passos
- Configurar variáveis de ambiente para o Supabase
- Implementar a estrutura do banco de dados no Supabase
- Criar página inicial e layout base
- Implementar sistema de autenticação

## 📅 01/04/2023 - Implementação das Interfaces Iniciais

### Tarefas Concluídas
- Implementação da página inicial do sistema
- Criação da página de login
- Desenvolvimento do layout do dashboard
- Implementação da página inicial do dashboard com cards de resumo
- Criação da interface de listagem de vendas
- Implementação do PDV (Ponto de Venda)
- Documentação do Supabase com instruções detalhadas para configuração do banco de dados
- Definição dos modelos de dados (types)

### Decisões de Design
- Interface limpa e moderna com foco na usabilidade
- Sistema de navegação intuitivo com menu lateral
- Cards informativos no dashboard para visualização rápida de métricas importantes
- PDV com layout dividido: produtos à esquerda e carrinho à direita para facilitar o processo de venda
- Utilização de badges coloridos para status (vendas pagas, pendentes, canceladas, etc.)

### Próximos Passos
- Implementar a lógica de autenticação
- Conectar as interfaces ao Supabase
- Desenvolver páginas de gerenciamento de clientes
- Desenvolver páginas de gerenciamento de estoque
- Implementar a lógica do PDV para processamento real de vendas
- Criar relatórios financeiros

## Estrutura do Banco de Dados (Planejamento)

### Tabelas Principais
1. **users** - Usuários do sistema
2. **customers** - Clientes da livraria
3. **books** - Livros disponíveis no estoque
4. **sales** - Registro de vendas
5. **sales_items** - Itens incluídos em cada venda
6. **accounts_receivable** - Contas a receber
7. **accounts_payable** - Contas a pagar
8. **suppliers** - Fornecedores de livros

### Relacionamentos
- Um cliente pode ter várias compras (sales)
- Uma venda contém vários itens (sales_items)
- Um livro pode estar em vários sales_items
- Cada venda pode gerar uma ou mais contas a receber
- Cada compra de estoque gera contas a pagar
- Um fornecedor fornece vários livros 