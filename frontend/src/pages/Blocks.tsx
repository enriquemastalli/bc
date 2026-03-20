import { useEffect, useState } from "react";
import { api, type Block, type Tenant } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { FileText, Loader2, Plus, Trash2, X, Edit2, Save } from "lucide-react";

export function BlocksPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  
  const [newBlock, setNewBlock] = useState({
    name: "",
    content: "",
    keywords: "",
  });

  useEffect(() => {
    api.getTenants().then(data => {
      setTenants(data.tenants);
      if (data.tenants.length > 0) {
        setSelectedTenant(data.tenants[0]);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadBlocks(selectedTenant.api_key);
    }
  }, [selectedTenant]);

  const loadBlocks = async (apiKey: string) => {
    try {
      const data = await api.getBlocks(apiKey);
      setBlocks(data.blocks);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async () => {
    if (!selectedTenant || !newBlock.name || !newBlock.content) return;
    
    setIsCreating(true);
    try {
      await api.createBlock(selectedTenant.api_key, {
        name: newBlock.name,
        content: newBlock.content,
        keywords: newBlock.keywords.split(",").map(k => k.trim()).filter(Boolean),
      });
      setNewBlock({ name: "", content: "", keywords: "" });
      loadBlocks(selectedTenant.api_key);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTenant || !editingBlock) return;
    
    try {
      await api.updateBlock(selectedTenant.api_key, editingBlock.id, {
        name: editingBlock.name,
        content: editingBlock.content,
        keywords: Array.isArray(editingBlock.keywords) 
          ? editingBlock.keywords 
          : (editingBlock.keywords as unknown as string).split(",").map(k => k.trim()).filter(Boolean),
      });
      setEditingBlock(null);
      loadBlocks(selectedTenant.api_key);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedTenant || !confirm("¿Estás seguro de eliminar este bloque?")) return;
    
    try {
      await api.deleteBlock(selectedTenant.api_key, id);
      loadBlocks(selectedTenant.api_key);
    } catch (error) {
      console.error(error);
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Bloques de Conocimiento</h1>
        <p className="text-muted-foreground">
          Gestiona el contenido de tus agentes
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tenants.map((tenant) => (
          <Button
            key={tenant.id}
            variant={selectedTenant?.id === tenant.id ? "default" : "outline"}
            onClick={() => setSelectedTenant(tenant)}
            size="sm"
          >
            {tenant.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear nuevo bloque
          </CardTitle>
          <CardDescription>
            {selectedTenant ? `Para: ${selectedTenant.name}` : "Selecciona un tenant"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del bloque</Label>
            <Input
              placeholder="politica_devolucion"
              value={newBlock.name}
              onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Contenido (Markdown)</Label>
            <Textarea
              placeholder="[conocimiento_experto::politica_devolucion]\n\nContenido del bloque..."
              value={newBlock.content}
              onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label>Keywords (separadas por coma)</Label>
            <Input
              placeholder="devolucion, politica, reembolso"
              value={newBlock.keywords}
              onChange={(e) => setNewBlock({ ...newBlock, keywords: e.target.value })}
            />
          </div>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !selectedTenant}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Crear bloque"
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {blocks.map((block) => (
          <Card key={block.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {block.name}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingBlock(block)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(block.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingBlock?.id === block.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={editingBlock.content}
                    onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                    rows={6}
                  />
                  <Input
                    value={Array.isArray(editingBlock.keywords) 
                      ? editingBlock.keywords.join(", ") 
                      : editingBlock.keywords}
                    onChange={(e) => setEditingBlock({ 
                      ...editingBlock, 
                      keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean)
                    })}
                    placeholder="Keywords separadas por coma"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate}>
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingBlock(null)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {block.content}
                  </pre>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(Array.isArray(block.keywords) ? block.keywords : []).map((keyword) => (
                      <Badge key={keyword} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}