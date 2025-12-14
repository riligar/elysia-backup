# Elysia Backup Demo

Demo completo mostrando o uso do plugin `@riligar/elysia-backup` com um sistema de dados JSON.

## Instalação

```bash
cd demo
bun install
```

## Configuração

Copie o arquivo de exemplo e configure suas credenciais R2/S3:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
```

## Executar

```bash
bun run start
# ou para desenvolvimento com hot reload:
bun run dev
```

## Endpoints

| Endpoint             | Descrição        |
| -------------------- | ---------------- |
| `GET /`              | Página inicial   |
| `GET /backup`        | Painel de backup |
| `GET /api/users`     | Listar usuários  |
| `POST /api/users`    | Criar usuário    |
| `GET /api/products`  | Listar produtos  |
| `POST /api/products` | Criar produto    |
| `GET /api/orders`    | Listar pedidos   |
| `POST /api/orders`   | Criar pedido     |

## Estrutura de Dados

Os dados são armazenados em arquivos JSON no diretório `./data`:

-   `users.json` - Dados de usuários
-   `products.json` - Catálogo de produtos
-   `orders.json` - Pedidos

Estes arquivos são automaticamente incluídos no backup.
