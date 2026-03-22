#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const SERVER_CONFIG = {
  name: "BC Knowledge Base",
  version: "1.0.0",
};

const QuerySchema = z.object({
  query: z.string().describe("La pregunta o consulta en texto libre"),
});

interface BCConfig {
  endpoint: string;
  apiKey: string;
}

class BCSearchServer {
  private server: Server;
  private config: BCConfig;

  constructor(config: BCConfig) {
    this.config = config;

    this.server = new Server(
      {
        name: SERVER_CONFIG.name,
        version: SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "query_knowledge_base",
            description: `Consulta la Base de Conocimiento del agente para obtener información sobre políticas, procedimientos y directrices.

Usa esta tool cuando necesites:
- Información sobre políticas de la empresa
- Procedimientos operativos
- Directrices y normas
- Información sobre productos o servicios
- Cualquier pregunta sobre el dominio del agente

La respuesta incluye el bloque de conocimiento más relevante y un score de relevancia (0-1).`,
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "La pregunta o consulta en texto libre. Ej: 'cual es la politica de devolucion' o 'como procedo si un cliente quiere cancelar'",
                },
              },
              required: ["query"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "query_knowledge_base") {
        const result = QuerySchema.safeParse(args);
        
        if (!result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Query inválida. ${result.error.message}`,
              },
            ],
            isError: true,
          };
        }

        try {
          const response = await fetch(this.config.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({ query: result.data.query }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return {
              content: [
                {
                  type: "text",
                  text: `Error consultando la Base de Conocimiento: ${response.status} - ${errorText}`,
                },
              ],
              isError: true,
            };
          }

          const data = await response.json() as {
            error?: string;
            block?: {
              name: string;
              content: string;
            };
            relevance_score?: number;
          };

          if (data.error) {
            return {
              content: [
                {
                  type: "text",
                  text: `No se encontró información relevante para: "${result.data.query}"`,
                },
              ],
              isError: true,
            };
          }

          const block = data.block!;
          const relevanceScore = data.relevance_score ?? 0;

          const formattedResponse = `## ${block.name}

${block.content}

---
**Relevancia:** ${(relevanceScore * 100).toFixed(0)}%`;

          return {
            content: [
              {
                type: "text",
                text: formattedResponse,
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido";
          return {
            content: [
              {
                type: "text",
                text: `Error conectando con la Base de Conocimiento: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Tool desconocido: ${name}`,
          },
        ],
        isError: true,
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("BC MCP Server started on stdio");
  }
}

function getConfig(): BCConfig {
  const endpoint = process.env.BC_ENDPOINT || "https://bc-prod.enrique-mastalli.workers.dev/mcp/v1/query";
  const apiKey = process.env.BC_API_KEY || "";

  if (!apiKey) {
    console.error("Error: BC_API_KEY no está configurada");
    console.error("Exporta tu API key con: export BC_API_KEY=sk_tu_api_key");
    process.exit(1);
  }

  return { endpoint, apiKey };
}

const config = getConfig();
const server = new BCSearchServer(config);
server.start().catch(console.error);