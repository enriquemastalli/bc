# BC - Base de Conocimiento

Sistema de gestión de base de conocimiento para agentes conversacionales.

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Crear base de datos local
npm run db:migrate:local

# Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno

Copiar `.dev.vars.example` a `.dev.vars` y configurar:

- `ADMIN_API_KEY`: API key para endpoints administrativos

## Endpoints

### MCP (Agentes)

```bash
POST /mcp/v1/query
Authorization: Bearer <tenant_api_key>
{
  "query": "texto libre"
}
```

### API (Gestión de Bloques)

```bash
# Listar bloques
GET /api/v1/blocks
Authorization: Bearer <tenant_api_key>

# Crear bloque
POST /api/v1/blocks
Authorization: Bearer <tenant_api_key>
{
  "name": "nombre_del_bloque",
  "content": "[conocimiento_experto::nombre_del_bloque]\n\nContenido...",
  "keywords": ["keyword1", "keyword2"]
}
```

### Admin (Gestión de Tenants)

```bash
# Crear tenant
POST /admin/v1/tenants
Authorization: Bearer <admin_api_key>
{
  "name": "mi_agente"
}
```

## Estructura del Proyecto

Ver [AGENTS.md](./AGENTS.md) para documentación completa.