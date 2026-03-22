import { useEffect, useState } from "react";
import { api, type Tenant } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Copy, Check, Terminal, BookOpen, Key, Zap, Server, FileCode } from "lucide-react";

export function ConfigPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.getTenants().then(data => setTenants(data.tenants));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = "https://bc-prod.enrique-mastalli.workers.dev";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración API</h1>
        <p className="text-muted-foreground">
          Información para conectar agentes a tu Base de Conocimiento
        </p>
      </div>

      {/* Endpoint Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Endpoint MCP
          </CardTitle>
          <CardDescription>
            Usa este endpoint para que tus agentes consulten la BC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">URL del Endpoint</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${baseUrl}/mcp/v1/query`, "endpoint")}
              >
                {copied === "endpoint" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <code className="text-sm break-all">
              {baseUrl}/mcp/v1/query
            </code>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Método</span>
            </div>
            <Badge variant="secondary">POST</Badge>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Headers</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(
                  `Authorization: Bearer <TENANT_API_KEY>\nContent-Type: application/json`, 
                  "headers"
                )}
              >
                {copied === "headers" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-sm overflow-x-auto">
{`Authorization: Bearer <TENANT_API_KEY>
Content-Type: application/json`}
            </pre>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Body (JSON)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(
                  `{\n  "query": "tu pregunta en texto libre"\n}`, 
                  "body"
                )}
              >
                {copied === "body" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-sm overflow-x-auto">
{`{
  "query": "tu pregunta en texto libre"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Ejemplo con curl */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Ejemplo con curl
          </CardTitle>
          <CardDescription>
            Copia y pega este comando para probar la conexión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-black text-green-400 p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Terminal</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => copyToClipboard(
                  `curl -X POST ${baseUrl}/mcp/v1/query \\
  -H "Authorization: Bearer <TENANT_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "cual es la politica de devolucion"}'`, 
                  "curl"
                )}
              >
                {copied === "curl" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-sm">{`curl -X POST ${baseUrl}/mcp/v1/query \\
  -H "Authorization: Bearer <TENANT_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "cual es la politica de devolucion"}'`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Tenants y API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Tenants y API Keys
          </CardTitle>
          <CardDescription>
            Cada tenant tiene su propia API key para autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{tenant.name}</span>
                <Badge variant="outline">{tenant.id.slice(0, 8)}...</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">
                  {tenant.api_key}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(tenant.api_key, `key-${tenant.id}`)}
                >
                  {copied === `key-${tenant.id}` ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Creado: {new Date(tenant.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {tenants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay tenants configurados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Respuesta esperada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Respuesta Esperada
          </CardTitle>
          <CardDescription>
            Formato de la respuesta del endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 overflow-x-auto">
            <pre className="text-sm">
{`{
  "block": {
    "id": "uuid-del-bloque",
    "name": "nombre_del_bloque",
    "content": "[conocimiento_experto::nombre]\n\nContenido MD...",
    "keywords": ["keyword1", "keyword2"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "relevance_score": 0.85
}`}
            </pre>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Nota:</strong> El campo <code>relevance_score</code> indica qué tan bien 
              matcheó el bloque con tu query (0.0 a 1.0). Un score bajo puede indicar que no 
              hay bloques relevantes para esa consulta.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* MCP Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            MCP Server
          </CardTitle>
          <CardDescription>
            Configura el MCP Server para conectar agentes como Claude o Gemini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Pasos de Instalación</span>
            </div>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Clona el repositorio del MCP server</li>
              <li>Instala dependencias: <code>npm install</code></li>
              <li>Compila: <code>npm run build</code></li>
              <li>Configura la API key como variable de entorno</li>
              <li>Ejecuta: <code>npm start</code></li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Configuración Claude Desktop</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(CLAUDE_DESKTOP_CONFIG, "claude-config")}
              >
                {copied === "claude-config" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-xs overflow-x-auto bg-black text-green-400 p-3 rounded">
{`{
  "mcpServers": {
    "bc-knowledge": {
      "command": "node",
      "args": ["/ruta/al/bc/mcp-server/dist/index.js"],
      "env": {
        "BC_API_KEY": "${tenants[0]?.api_key || '<TU_API_KEY>'}",
        "BC_ENDPOINT": "${baseUrl}/mcp/v1/query"
      }
    }
  }
}`}
            </pre>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Variables de Entorno</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(
                  `export BC_API_KEY=${tenants[0]?.api_key || '<TU_API_KEY>'}\nexport BC_ENDPOINT=${baseUrl}/mcp/v1/query`, 
                  "env-vars"
                )}
              >
                {copied === "env-vars" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-sm overflow-x-auto">
{`export BC_API_KEY=${tenants[0]?.api_key || '<TU_API_KEY>'}
export BC_ENDPOINT=${baseUrl}/mcp/v1/query`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Tool Definition para Integración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Tool Definition (para Gemini/OpenAI)
          </CardTitle>
          <CardDescription>
            Define esta tool en tu código para integrar la BC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">JSON de la Tool</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(TOOL_DEFINITION, "tool-def")}
              >
                {copied === "tool-def" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="text-xs overflow-x-auto bg-black text-green-400 p-3 rounded">
{TOOL_DEFINITION}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const BASE_URL = "https://bc-prod.enrique-mastalli.workers.dev";

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "bc-knowledge": {
      "command": "node",
      "args": ["/ruta/al/bc/mcp-server/dist/index.js"],
      "env": {
        "BC_API_KEY": "<TU_API_KEY>",
        "BC_ENDPOINT": "${BASE_URL}/mcp/v1/query"
      }
    }
  }
}`;

const TOOL_DEFINITION = `{
  "name": "query_knowledge_base",
  "description": "Consulta la Base de Conocimiento del agente para obtener información sobre políticas, procedimientos y diretrizes.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "La pregunta o consulta en texto libre. Ej: 'cual es la politica de devolucion'"
      }
    },
    "required": ["query"]
  }
}`;