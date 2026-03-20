# BC (Base de Conocimiento)

## Ruta Base

```
/home/usuario/Documentos/opencode/bc
```

## Descripción del Proyecto

Sistema multi-tenant de gestión de base de conocimiento para agentes conversacionales. Cada agente tiene su propia BC aislada con bloques estructurados `[conocimiento_experto::nombre]` en formato Markdown.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Cloudflare Workers + Hono |
| Base de datos | Cloudflare D1 |
| Cache | Cloudflare KV |
| Validación | Zod |

---

## Comandos

```bash
npm install           # Instalar dependencias
npm run dev           # Desarrollo local
npm run typecheck     # Verificar tipos
npm run deploy        # Deploy a Cloudflare
npm run db:migrate:local  # Migrar D1 local
```

---

## Estructura de Archivos

```
src/
├── index.ts          # Entrada principal del Worker
├── types.ts          # Tipos y esquemas Zod compartidos
├── db/
│   └── schema.sql    # Esquema D1
└── routes/
    ├── mcp.ts        # Endpoint MCP para agentes
    ├── api.ts        # API REST para gestión de bloques
    └── admin.ts      # Endpoints administrativos
```

---

## Reglas de Desarrollo

### Obligatorias (leer antes de tocar código)

- **@senior-development-protocol:** Debugging científico, reglas sagradas de arquitectura
- **@edge-performance-first:** Optimización para edge, límites de memoria
- **@saas-security-enforcer:** Aislamiento por tenant, validación de API keys
- **@strict-typescript-contract:** Sin `any`, validación en fronteras

---

## Reglas de Negocio Críticas

1. **Aislamiento de Tenant:** Todo query DEBE filtrar por `tenant_id`
2. **Latencia <50ms:** Prohibido embeddings on-demand en el path de consulta
3. **Eliminación Física:** Los bloques se eliminan físicamente (no soft-delete)
4. **Keywords Pre-indexados:** Cada bloque debe tener keywords al crear/editar
5. **Índice Regenerable:** El índice se puede regenerar automático o modificar manual
6. **Autenticación Obligatoria:** Todos los endpoints requieren API key

---

## Variables de Entorno Requeridas

```
ADMIN_API_KEY=sk_xxxx  # API key para endpoints administrativos
```

---

## Endpoints

### MCP (Agentes)
- `POST /mcp/v1/query` - Buscar bloque más relevante

### API (Usuarios)
- `GET /api/v1/blocks` - Listar bloques
- `POST /api/v1/blocks` - Crear bloque
- `PUT /api/v1/blocks/:id` - Actualizar bloque
- `DELETE /api/v1/blocks/:id` - Eliminar bloque

### Admin
- `POST /admin/v1/tenants` - Crear tenant
- `GET /admin/v1/tenants` - Listar tenants
- `DELETE /admin/v1/tenants/:id` - Eliminar tenant