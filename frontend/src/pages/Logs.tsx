import { useEffect, useState } from "react";
import { api, type QueryLog, type Tenant } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Search, Clock, Filter } from "lucide-react";

export function LogsPage() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const limit = 50;

  const loadLogs = async () => {
    try {
      const data = await api.getLogs(limit, offset, selectedTenant || undefined);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.getTenants().then(data => setTenants(data.tenants));
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [offset, selectedTenant]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Queries</h1>
        <p className="text-muted-foreground">
          Historial de consultas realizadas por los agentes
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          variant={selectedTenant === "" ? "default" : "outline"}
          size="sm"
          onClick={() => { setSelectedTenant(""); setOffset(0); }}
        >
          Todos
        </Button>
        {tenants.map((tenant) => (
          <Button
            key={tenant.id}
            variant={selectedTenant === tenant.id ? "default" : "outline"}
            size="sm"
            onClick={() => { setSelectedTenant(tenant.id); setOffset(0); }}
          >
            {tenant.name}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium truncate">{log.query}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{log.tenant_name || "Unknown"}</span>
                    {log.block_id && (
                      <Badge variant="outline" className="text-xs">
                        Score: {(log.relevance_score || 0).toFixed(2)}
                      </Badge>
                    )}
                    {log.latency_ms && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.latency_ms}ms
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {logs.length} de {total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}