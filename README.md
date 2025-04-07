# ERP para Livraria

Este é um sistema ERP completo para gerenciamento de livrarias, desenvolvido com Next.js, hospedado na Vercel e utilizando Supabase como banco de dados.

## Funcionalidades

- **Gerenciamento de Vendas**: Registro de transações, emissão de notas, histórico de vendas
- **Gerenciamento de Clientes**: Cadastro, histórico de compras, preferências, sistema de fidelidade
- **Gerenciamento de Estoque**: Controle de livros, alertas de estoque baixo, pedidos de reposição
- **Gerenciamento de Contas**: Contas a pagar e receber, fluxo de caixa
- **PDV (Ponto de Venda)**: Interface rápida para vendas no balcão

## Estrutura do Projeto

```
erp-livraria/
├── app/                # Rotas e páginas da aplicação
├── components/         # Componentes reutilizáveis
├── lib/                # Utilitários e configurações
│   ├── supabase/       # Configuração do Supabase
│   └── utils/          # Funções auxiliares
├── models/             # Tipos e interfaces
└── docs/               # Documentação detalhada
```

## Documentação

O projeto possui documentação detalhada para facilitar o entendimento e manutenção:

- [Progresso do Desenvolvimento](./docs/PROGRESSO.md) - Registro do progresso e decisões de desenvolvimento
- [Configuração do Supabase](./docs/SUPABASE.md) - Instruções para configurar o Supabase
- [Diagrama ER](./docs/DIAGRAMA-ER.md) - Diagrama Entidade-Relacionamento do banco de dados
- [Resumo de Implementação](./docs/RESUMO-IMPLEMENTACAO.md) - Resumo do trabalho realizado e próximos passos

## Etapas de Desenvolvimento

1. Configuração inicial do projeto ✅
2. Configuração do Supabase e estrutura do banco de dados ✅
3. Desenvolvimento das interfaces de usuário ✅
4. Autenticação e perfis de usuário 🔄
5. Implementação dos módulos de gerenciamento:
   - Vendas 🔄
   - Clientes 🔄
   - Estoque 🔄
   - Contas 🔄
   - PDV 🔄
6. Implantação e testes finais 🔄

## Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar servidor de produção
npm start
```

## Configuração do Ambiente

1. Clone este repositório
2. Execute `npm install` para instalar as dependências
3. Copie o arquivo `.env.local.example` para `.env.local`
4. Configure as variáveis de ambiente do Supabase no arquivo `.env.local`
5. Execute `npm run dev` para iniciar o servidor de desenvolvimento

## Tecnologias Utilizadas

- Next.js - Framework React
- Tailwind CSS - Estilização
- Supabase - Banco de dados e autenticação
- TypeScript - Linguagem de programação
- Vercel - Hospedagem

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
