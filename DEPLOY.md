# Deploy en Cloudflare

## Requisitos previos

- Cuenta de Cloudflare (gratuita)
- `wrangler` instalado (viene con el proyecto)

## Paso 1: Autenticación

```bash
npx wrangler login
```

Esto abrirá el navegador para autorizar la CLI de Wrangler.

## Paso 2: Crear recursos

### Base de datos D1

```bash
npx wrangler d1 create bc-db
```

Guarda el `database_id` que aparece en la salida.

### Namespace KV

```bash
npx wrangler kv:namespace create CACHE
```

Guarda el `id` que aparece en la salida.

## Paso 3: Configurar wrangler.toml

Actualiza `wrangler.toml` con los IDs reales:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bc-db"
database_id = "TU_D1_ID_AQUI"

[[kv_namespaces]]
binding = "CACHE"
id = "TU_KV_ID_AQUI"

[env.production]
d1_databases = [
  { binding = "DB", database_name = "bc-db-prod", database_id = "TU_D1_PROD_ID_AQUI" }
]
kv_namespaces = [
  { binding = "CACHE", id = "TU_KV_PROD_ID_AQUI" }
]
```

## Paso 4: Configurar secrets

```bash
# Secret para desarrollo local
echo "ADMIN_API_KEY=sk_tu_clave_secreta_aqui" > .dev.vars

# Secret para producción
npx wrangler secret put ADMIN_API_KEY
# Cuando pida el valor, ingresa tu clave secreta
```

## Paso 5: Migrar base de datos

```bash
# Desarrollo local (ya configurado)
npm run db:migrate:local

# Producción
npx wrangler d1 execute bc-db --remote --file=./src/db/schema.sql
```

## Paso 6: Deploy

```bash
# Desarrollo
npm run dev

# Producción
npm run deploy
```

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `ADMIN_API_KEY` | API key para endpoints administrativos | Sí |

## Comandos útiles

```bash
# Ver logs en tiempo real
npx wrangler tail

# Ver información del worker
npx wrangler deployments list

# Rollback
npx wrangler rollback
```

## Flujo de CI/CD con GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## URLs después del deploy

- Worker: `https://bc.<tu-subdominio>.workers.dev`
- MCP endpoint: `https://bc.<tu-subdominio>.workers.dev/mcp/v1/query`