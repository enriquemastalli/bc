# BC MCP Server

Servidor MCP (Model Context Protocol) para consultar la Base de Conocimiento del agente.

## Instalación

```bash
# Clonar el repositorio
cd mcp-server

# Instalar dependencias
npm install

# Compilar
npm run build
```

## Configuración

El servidor requiere las siguientes variables de entorno:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `BC_ENDPOINT` | URL del endpoint MCP | `https://bc-prod.enrique-mastalli.workers.dev/mcp/v1/query` |
| `BC_API_KEY` | API key del tenant | **Requerido** |

## Uso

### Configurar API Key

```bash
export BC_API_KEY=sk_tu_api_key_aqui
export BC_ENDPOINT=https://bc-prod.enrique-mastalli.workers.dev/mcp/v1/query
```

### Ejecutar

```bash
npm start
```

### Modo desarrollo

```bash
npm run dev
```

## Integración con Claude Desktop

Agregar en `~/.claude/desktop-config.json`:

```json
{
  "mcpServers": {
    "bc-knowledge": {
      "command": "node",
      "args": ["/ruta/al/mcp-server/dist/index.js"],
      "env": {
        "BC_API_KEY": "sk_tu_api_key_aqui",
        "BC_ENDPOINT": "https://bc-prod.enrique-mastalli.workers.dev/mcp/v1/query"
      }
    }
  }
}
```

## Integración con Gemini (Google AI Studio)

En Google AI Studio, configura el MCP server manualmente:

1. Agrega el path al ejecutable: `/ruta/al/mcp-server/dist/index.js`
2. Configura las variables de entorno con tu API key

## Tool Disponible

### `query_knowledge_base`

Consulta la Base de Conocimiento del agente.

**Parámetros:**
- `query` (string, requerido): La pregunta o consulta en texto libre

**Ejemplo:**
```
query_knowledge_base(query: "cual es la politica de devolucion")
```

**Respuesta:**
```
## politicas_devolucion

[conocimiento_experto::politicas_devolucion]

## Políticas de Devolución

- Los productos pueden devolverse dentro de 30 días
- Se requiere factura original
...

---
**Relevancia:** 85%
```

## Integración Programática

```javascript
import { BCSearchServer } from '@bc/mcp-server';

const server = new BCSearchServer({
  endpoint: 'https://bc-prod.enrique-mastalli.workers.dev/mcp/v1/query',
  apiKey: 'sk_tu_api_key'
});

await server.start();
```

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm run build
COPY dist ./dist
ENV BC_API_KEY=sk_tu_api_key
ENV BC_ENDPOINT=https://bc-prod.enrique-mastalli.workers.dev/mcp/v1/query
CMD ["node", "dist/index.js"]
```

## API Keys Disponibles

Para obtener las API keys de tus tenants, consulta la página de Configuración en el dashboard.

| Tenant | API Key |
|--------|---------|
| test_agente | `sk_24874865229641f6914178c7a14c14b6` |

## Troubleshooting

### Error: BC_API_KEY no está configurada

```bash
export BC_API_KEY=sk_tu_api_key
npm start
```

### Error: Connection refused

Verifica que el endpoint esté correcto y que la API key sea válida.

### Error: No matching block found

El query no encontró ningún bloque relevante. Intenta con palabras clave diferentes.