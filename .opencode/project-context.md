# BC (Base de Conocimiento)

**Sistema de gestión de base de conocimiento para agentes conversacionales con bloques estructurados y gestión de índice automático.**

Documento de Contexto de Proyecto

**Implementación:** Uso propio

Plataforma: Cloudflare Edge | Versión: 1.0.0 | 2026-03-20

---

# 1. Visión y Naturaleza del Producto

BC es un sistema multi-tenant para gestionar bases de conocimiento de agentes conversacionales. Cada agente tiene su propia BC aislada, con bloques de conocimiento estructurados que permiten entrenamiento específico del dominio.

Los bloques usan un formato especial: `[conocimiento_experto::nombre_del_bloque]` como encabezado, seguido de contenido Markdown interpretable por LLMs.

El sistema expone un endpoint MCP para que los agentes consulten dinámicamente su BC, con latencia objetivo <50ms.

| Modelo de negocio: SaaS multi-tenant (1 agente = 1 BC) |
| :---- |

| Estrategia de infraestructura: 100% Serverless sobre Cloudflare (Workers + D1 + KV) |
| :---- |

---

# 2. Jerarquía de Entidades

El sistema tiene una jerarquía simple de dos niveles: Tenant (BC) y Blocks.

| Nivel | Entidad | Rol en el sistema | Descripción |
| :---- | :---- | :---- | :---- |
| **N0** | Tenant | Contenedor de BC | Cada agente tiene un tenant con su propia BC aislada |
| **N1** | Block | Unidad de conocimiento | Bloques con encabezado estructurado y contenido MD |

---

# 3. Entidad Central / Modelo de Dominio

**Block** es la entidad central. Cada bloque representa una unidad atómica de conocimiento para un agente.

**Estructura de un bloque:**
- Encabezado: `[conocimiento_experto::nombre_descriptivo]`
- Contenido: Markdown con información del dominio
- Keywords: Lista de palabras clave pre-indexadas para búsqueda rápida

| ⚑ Invariante de diseño: Cada bloque pertenece a un único tenant. No existe visibilidad cross-tenant. |
| :---- |

| ⚑ Invariante de diseño: La búsqueda debe completarse en <50ms usando keywords pre-indexados, no embeddings. |
| :---- |

---

# 4. Roles y Permisos

## 4.1 Admin

* Crear nuevos tenants vía endpoint administrativo con autenticación
* Gestionar usuarios y permisos cross-tenant
* Acceso total al sistema

## 4.2 Usuario (Dueño de BC)

* Crear, editar y eliminar bloques en su BC
* Gestionar keywords de sus bloques
* Modificar manualmente el índice si es necesario
* Configurar su agente asociado

## 4.3 Agente (Consumidor)

* Consultar su BC vía endpoint MCP con autenticación
* Recuperar el bloque más relevante para una query
* Opcionalmente: crear bloques de conocimiento (si tiene permiso)

---

# 5. Modelo de Datos / Estructura Principal

## Tenant
```
- id: UUID (identificador único)
- name: string (nombre del agente/dominio)
- created_at: timestamp
- updated_at: timestamp
```

## Block
```
- id: UUID
- tenant_id: UUID (FK a Tenant)
- name: string (del encabezado [conocimiento_experto::nombre])
- content: text (Markdown)
- keywords: string[] (pre-indexados, separados por coma)
- created_at: timestamp
- updated_at: timestamp
```

## BlockKeyword (Índice invertido)
```
- keyword: string
- block_id: UUID (FK a Block)
- tenant_id: UUID (FK a Tenant, para filtrado rápido)
```

## Índices necesarios
- `blocks(tenant_id)` - Filtrar por tenant
- `block_keywords(keyword, tenant_id)` - Búsqueda rápida de keywords
- `block_keywords(block_id)` - Relación con bloques

---

# 6. Sistema de Notificaciones / Eventos

No aplica en fase inicial. El sistema es síncrono y stateless.

---

# 7. Reglas de Negocio Críticas

**Estas reglas son invariantes. Ningún agente puede ignorarlas ni negociarlas.**

| ⚑ R1 - Aislamiento de Tenant: Todo query DEBE filtrar por tenant_id. No existe acceso cross-tenant bajo ninguna circunstancia. |
| :---- |

| ⚑ R2 - Latencia <50ms: La consulta de bloques debe completarse en menos de 50ms. Esto prohíbe el uso de embeddings on-demand u APIs externas en el path de consulta. |
| :---- |

| ⚑ R3 - Eliminación Física: Los bloques se eliminan físicamente de la base de datos. No existe soft-delete ni archivo. |
| :---- |

| ⚑ R4 - Keywords Pre-indexados: Cada bloque debe tener keywords pre-indexados al momento de creación/edición. La búsqueda usa estos keywords, no embeddings. |
| :---- |

| ⚑ R5 - Índice Regenerable: El índice de keywords se puede regenerar automáticamente y también modificar manualmente. |
| :---- |

| ⚑ R6 - Autenticación Obligatoria: Todos los endpoints (MCP y administrativos) requieren autenticación. No existe acceso anónimo. |
| :---- |

---

# 8. Stack Tecnológico

**El stack es estricto. No se admiten sustituciones sin revisión de arquitectura.**

| Capa | Tecnología | Rol |
| :---- | :---- | :---- |
| **Backend API** | Cloudflare Workers + Hono | API REST y endpoint MCP |
| **Base de datos** | Cloudflare D1 | Almacenamiento de tenants, bloques y keywords |
| **Cache** | Cloudflare KV | Cache de bloques frecuentes para latencia <50ms |
| **Repo/CI** | GitHub + GitHub Actions | Versionado y deploy automático |
| **Auth** | API Key simple (fase inicial) | Autenticación de agentes y admins |

---

# 9. Flujo de Consulta MCP

**Path crítico para latencia <50ms:**

```
1. Agente envía query (texto libre) vía MCP endpoint
2. Sistema extrae keywords de la query (local, sin API externa)
3. SQL query en D1 con índice invertido por keywords
4. Ranking por score de relevancia (algoritmo simple en memoria)
5. Return del bloque mejor rankeado

Latencia estimada:
- Extracción keywords: <5ms
- SQL query D1: <20ms
- Ranking: <10ms
- Total: ~35ms ✓
```

---

# 10. Agentes de Desarrollo

* **@dba-edge:** Diseño de esquemas D1, migraciones, queries optimizadas, índices.
* **@ui-guardian:** No aplica en fase inicial (sin frontend).
* **@devops-chief:** Configuración de Wrangler, GitHub Actions, deploy en Cloudflare.
* **@stripe-integrator:** No aplica (sin pagos).

| Principio de coordinación: Cada agente recibe solo el contexto mínimo necesario para su tarea. El project-context es el documento raíz compartido por todos. |
| :---- |

---

# 11. Log de Operaciones y Auditoría

Se recomienda implementar en fase futura. Atributos mínimos:

* Timestamp de la operación
* Actor (admin / usuario / agente)
* Tipo de operación (CREATE / UPDATE / DELETE)
* Entidad afectada (tenant / block) y su ID
* tenant_id afectado

---

# 12. Roadmap de Fases

| Fase | Nombre | Alcance |
| :---- | :---- | :---- |
| **Fase 1** | Producción Inicial | Gestión de agentes (tenants), bloques de conocimiento, endpoint MCP de consulta |
| **Fase 2** | Optimización | Cache KV inteligente, métricas de latencia, dashboard básico |
| **Fase 3** | Extensibilidad | Creación de bloques desde el agente, webhooks, API administrativa completa |

---

# 13. Estructura de Documentación por Módulo

Todo módulo debe mantener actualizados:

* **README.md:** Configuración, variables de entorno y comandos
* **CHANGELOG.md:** Historial de versiones (semver)
* **ROADMAP.md:** Planificación alineada al roadmap global

---

# 14. Endpoints MCP Principales

## Consulta de BC
```
POST /mcp/v1/query
Headers: Authorization: Bearer <api_key>Body: { "query": "texto libre del agente" }
Response: { "block": {...}, "relevance_score": 0.85 }
```

## Creación de Tenant (Admin)
```
POST /admin/v1/tenants
Headers: Authorization: Bearer <admin_api_key>
Body: { "name": "nombre_agente" }
Response: { "id": "uuid", "api_key": "sk_..." }
```

## Gestión de Bloques
```
POST /api/v1/blocks
GET /api/v1/blocks
PUT /api/v1/blocks/:id
DELETE /api/v1/blocks/:id
```