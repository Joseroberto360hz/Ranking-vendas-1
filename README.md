# Ranking de Vendas

Projeto simples de backend + frontend com ranking automático de vendas usando MySQL.

## O que o projeto faz

- Recebe vendas com:
  - seu nome (vendedor)
  - nome do cliente
  - endereço do cliente
  - quantidade vendida
- Exibe um ranking de vendedores por total de quantidade vendida.
- Mostra histórico de vendas.

## Tecnologias

- Node.js + Express
- Sequelize + MySQL
- Frontend HTML/CSS/JavaScript

## Configuração MySQL Workbench

1. Abra o MySQL Workbench.
2. Crie um schema/banco de dados chamado `ranking_vendas`.
3. Configure o usuário e senha MySQL.

## Executando o projeto

1. No terminal, instale as dependências:

```bash
npm install
```

2. Crie um arquivo `.env` na pasta do projeto com base em `.env.example`:

```bash
copy .env.example .env
```

3. Atualize as credenciais MySQL no arquivo `.env`.

4. Inicie o servidor:

```bash
npm start
```

5. Abra no navegador:

```bash
http://localhost:3000
```

## Endpoints disponíveis

- `POST /api/sales`
- `PUT /api/sales/:id`
- `DELETE /api/sales/:id`
- `GET /api/sales`
- `GET /api/ranking`

### Exemplo de body para POST /api/sales

```json
{
  "sellerName": "Pedro",
  "customerName": "Maria",
  "customerAddress": "Rua das Flores, 123",
  "quantity": 10
}
```

## Observações

- O ranking é gerado automaticamente pelo backend a partir do total de quantidade vendida por vendedor.
- A primeira vez que o servidor rodar ele cria a tabela automaticamente pelo Sequelize.
