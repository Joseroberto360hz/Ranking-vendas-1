# Painel de Ranking

Aplicacao Node.js com Express, Sequelize, MySQL e frontend estatico para registrar resultados, gerar ranking e acompanhar historico.

## O que o sistema faz

- cadastra registros com responsavel, referencia, detalhe e pontuacao
- mostra ranking por pontuacao total
- lista o historico completo
- permite editar, excluir e concluir registros

## Requisitos

- Node.js
- MySQL

## Configuracao

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` com base no exemplo:

```bash
copy .env.example .env
```

3. Ajuste os dados do banco no `.env`.

## Variaveis importantes

- `HOST`: use `0.0.0.0` para permitir acesso externo
- `PORT`: porta da aplicacao
- `ALLOWED_ORIGINS`: `*` para liberar acesso de qualquer origem ou uma lista separada por virgula
- `PUBLIC_URL`: URL publica final do site, usada para exibir o endereco correto no log
- `TRUST_PROXY`: use `true` se a aplicacao ficar atras de proxy reverso
- `DATABASE_URL`: string completa de conexao MySQL para hospedagem
- `DB_SSL`: use `true` se seu banco remoto exigir SSL
- `DB_SSL_REJECT_UNAUTHORIZED`: use `false` apenas quando o provedor do banco pedir isso

## Como iniciar

```bash
npm start
```

Quando iniciar, o servidor mostra no terminal os enderecos que podem ser usados para acessar o site.

## Para outras pessoas usarem o site

### Mesma rede local

1. Deixe `HOST=0.0.0.0` no `.env`.
2. Inicie o projeto com `npm start`.
3. Pegue o endereco mostrado no terminal, como `http://192.168.x.x:3000`.
4. Se necessario, libere a porta `3000` no firewall do Windows.
5. As outras pessoas da mesma rede poderao abrir esse endereco no navegador.

### Pela internet

Para acesso fora da sua rede local, voce ainda vai precisar:

- hospedar esta aplicacao em um servidor Node.js
- usar um banco MySQL acessivel por esse servidor
- configurar as variaveis do `.env` no ambiente de hospedagem
- apontar um dominio ou compartilhar a URL publica gerada pela hospedagem

O codigo ja esta preparado para isso com:

- `HOST` configuravel
- `PORT` configuravel
- `ALLOWED_ORIGINS` configuravel
- `PUBLIC_URL` configuravel
- `DATABASE_URL` para banco remoto
- `TRUST_PROXY` para ambientes com proxy
- suporte opcional a SSL no banco
- endpoint de saude em `GET /api/health`
- `Dockerfile` para deploy em container

## Endpoints

- `GET /api/health`
- `GET /api/sales`
- `POST /api/sales`
- `PUT /api/sales/:id`
- `DELETE /api/sales/:id`
- `PATCH /api/sales/:id/status`
- `DELETE /api/sales/clean/all`
- `GET /api/ranking`

## Campos aceitos na API

- formato original: `sellerName`, `customerName`, `customerAddress`, `quantity`
- formato generico: `ownerName`, `referenceName`, `details`, `score`
- status aceitos: `pendente`, `aberto`, `concluido`, `entregue`

## Checagem rapida

```bash
npm run check
```

## Rede movel

Se o site precisa abrir em qualquer 4G ou 5G, rodar na sua maquina de casa nao basta. Voce precisa de uma URL publica.

Os caminhos mais comuns sao:

- publicar a aplicacao em uma hospedagem Node.js e usar um banco MySQL remoto
- usar um tunel publico temporario para testes
- configurar redirecionamento de porta no roteador e um IP publico valido

Para producao, o caminho mais estavel e hospedar a aplicacao e o banco em infraestrutura publica.

## Deploy com Railway

O projeto ja esta preparado para Railway com:

- `Dockerfile`
- `railway.toml`
- suporte a `DATABASE_URL`
- suporte direto a `MYSQL_URL`, `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` e `MYSQLDATABASE`

Passo a passo:

1. Envie este codigo atualizado para o GitHub.
2. No Railway, crie um novo projeto a partir do seu repositorio.
3. No mesmo projeto, adicione um banco `MySQL`.
4. No servico da aplicacao, crie a variavel:
   - `MYSQL_URL=${{MySQL.MYSQL_URL}}`
5. Se quiser um dominio publico fixo, adicione um dominio no Railway.
6. Depois do deploy, abra a URL publica gerada pelo Railway em qualquer celular ou computador.
