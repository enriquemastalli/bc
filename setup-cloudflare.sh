#!/bin/bash

echo "🚀 Configurando BC para Cloudflare..."
echo ""

echo "Paso 1: Autenticando con Cloudflare..."
npx wrangler login

echo ""
echo "Paso 2: Creando base de datos D1..."
D1_OUTPUT=$(npx wrangler d1 create bc-db 2>&1)
echo "$D1_OUTPUT"

D1_ID=$(echo "$D1_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' | head -1)
if [ -z "$D1_ID" ]; then
  echo "⚠️  No se pudo extraer el D1 ID. Por favor, copia el ID manualmente."
else
  echo "✅ D1 ID: $D1_ID"
fi

echo ""
echo "Paso 3: Creando namespace KV..."
KV_OUTPUT=$(npx wrangler kv:namespace create CACHE 2>&1)
echo "$KV_OUTPUT"

KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id\s*=\s*"\K[^"]+' | head -1)
if [ -z "$KV_ID" ]; then
  echo "⚠️  No se pudo extraer el KV ID. Por favor, copia el ID manualmente."
else
  echo "✅ KV ID: $KV_ID"
fi

echo ""
echo "Paso 4: Ejecutando migración en producción..."
echo "⚠️ IMPORTANTE: Primero actualiza wrangler.toml con los IDs reales:"
echo ""
echo "  [[d1_databases]]"
echo "  database_id = \"$D1_ID\""
echo ""
echo "  [[kv_namespaces]]"
echo "  id = \"$KV_ID\""
echo ""
echo "Luego ejecuta:"
echo "  npm run db:migrate:prod"
echo "  npm run deploy:prod"
echo ""
echo "📚 Ver DEPLOY.md para instrucciones completas."