"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileCode, 
  Copy,
  Download,
  Upload,
  Settings
} from "lucide-react";

interface TissTemplate {
  id: number;
  name: string;
  description?: string;
  category: 'consultation' | 'procedure' | 'exam' | 'emergency' | 'custom';
  is_default: boolean;
  xml_template: string;
  variables: string[];
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

const TEMPLATE_CATEGORIES = {
  'consultation': 'Consulta',
  'procedure': 'Procedimento',
  'exam': 'Exame',
  'emergency': 'Emergência',
  'custom': 'Personalizado'
};

export default function TissTemplatesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<TissTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TissTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<TissTemplate>>({
    name: "",
    description: "",
    category: "consultation",
    is_default: false,
    xml_template: "",
    variables: []
  });

  useEffect(() => {
    // Wait for auth context to finish loading (same pattern as pagamentos page)
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    // Check role permissions
    if (isAuthenticated && !['admin', 'secretary'].includes(user?.role || '')) {
      router.push("/unauthorized");
      return;
    }
    
    // Load templates when authenticated
    if (isAuthenticated) {
      loadTemplates();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadTemplates = async () => {
    // Don't load if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }
    
    setLoading(true);
    try {
      // Load templates from backend API
      const data = await api.get<TissTemplate[]>('/api/financial/templates');
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Failed to load TISS templates:", error);
      
      // Don't show error toast if it's an auth error (will redirect)
      if ((error as any).status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return;
      }
      
      toast.error("Erro ao carregar templates TISS", {
        description: error.message || "Não foi possível carregar os templates TISS"
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.xml_template) {
        toast.error("Campos obrigatórios não preenchidos", {
          description: "Nome e Template XML são obrigatórios"
        });
        return;
      }

      if (editingTemplate) {
        // Update existing template
        const updateData = {
          name: formData.name,
          description: formData.description || "",
          category: formData.category || "consultation",
          xml_template: formData.xml_template,
          is_default: formData.is_default || false,
          is_active: formData.is_active !== undefined ? formData.is_active : true
        };
        
        await api.put<TissTemplate>(`/api/financial/templates/${editingTemplate.id}`, updateData);
        toast.success("Template TISS atualizado!");
      } else {
        // Create new template
        const createData = {
          name: formData.name,
          description: formData.description || "",
          category: formData.category || "consultation",
          xml_template: formData.xml_template,
          is_default: formData.is_default || false,
          is_active: true
        };
        
        await api.post<TissTemplate>('/api/financial/templates', createData);
        toast.success("Template TISS criado!");
      }
      
      // Reload templates
      await loadTemplates();
      
      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({
        name: "",
        description: "",
        category: "consultation",
        is_default: false,
        xml_template: "",
        variables: []
      });
    } catch (error: any) {
      console.error("Failed to save TISS template:", error);
      toast.error("Erro ao salvar template TISS", {
        description: error.message || "Não foi possível salvar o template TISS"
      });
    }
  };

  const handleEdit = (template: TissTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category,
      is_default: template.is_default,
      xml_template: template.xml_template,
      variables: template.variables || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este template TISS?")) {
      try {
        await api.delete(`/api/financial/templates/${id}`);
        toast.success("Template TISS excluído!");
        // Reload templates
        await loadTemplates();
      } catch (error: any) {
        console.error("Failed to delete TISS template:", error);
        toast.error("Erro ao excluir template TISS", {
          description: error.message || "Não foi possível excluir o template TISS"
        });
      }
    }
  };

  const handleDuplicate = async (template: TissTemplate) => {
    try {
      const createData = {
        name: `${template.name} (Cópia)`,
        description: template.description || "",
        category: template.category,
        xml_template: template.xml_template,
        is_default: false,
        is_active: true
      };
      
      await api.post<TissTemplate>('/api/financial/templates', createData);
      toast.success("Template TISS duplicado!");
      // Reload templates
      await loadTemplates();
    } catch (error: any) {
      console.error("Failed to duplicate TISS template:", error);
      toast.error("Erro ao duplicar template TISS", {
        description: error.message || "Não foi possível duplicar o template TISS"
      });
    }
  };

  const handleExport = (template: TissTemplate) => {
    // Export template in a format compatible with import
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      xml_template: template.xml_template,
      variables: template.variables || []
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiss_template_${template.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Template TISS exportado!");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // Map old format to new format if needed
          const createData = {
            name: importedData.name || "Template Importado",
            description: importedData.description || "",
            category: importedData.category || "custom",
            xml_template: importedData.xmlTemplate || importedData.xml_template || "",
            is_default: false,
            is_active: true
          };
          
          if (!createData.xml_template) {
            throw new Error("Template XML não encontrado no arquivo");
          }
          
          await api.post<TissTemplate>('/api/financial/templates', createData);
          toast.success("Template TISS importado!");
          // Reload templates
          await loadTemplates();
          
          // Reset file input
          event.target.value = '';
        } catch (error: any) {
          console.error("Failed to import TISS template:", error);
          toast.error("Erro ao importar template TISS", {
            description: error.message || "Arquivo inválido"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while auth is initializing or while we wait for AuthContext
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }


  // Show loading while fetching templates
  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando templates TISS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates TISS XML</h1>
          <p className="text-muted-foreground">
            Gerencie templates personalizados para geração de arquivos TISS XML
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-templates"
          />
          <label htmlFor="import-templates">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </span>
            </Button>
          </label>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTemplate(null);
                setFormData({
                  name: "",
                  description: "",
                  category: "consultation",
                  is_default: false,
                  xml_template: "",
                  variables: []
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Editar Template TISS" : "Novo Template TISS"}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate ? "Atualize as informações do template" : "Crie um novo template TISS XML"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Consulta Médica Padrão"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category || "consultation"}
                      onValueChange={(value) => setFormData({...formData, category: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do template"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="xmlTemplate">Template XML</Label>
                  <Textarea
                    id="xmlTemplate"
                    value={formData.xml_template || ""}
                    onChange={(e) => setFormData({...formData, xml_template: e.target.value})}
                    placeholder="Cole o template XML aqui..."
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use variáveis como {`{{VARIABLE_NAME}}`} para substituição dinâmica
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingTemplate ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates por nome, descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates TISS ({filteredTemplates.length})</CardTitle>
          <CardDescription>
            Lista de templates personalizados para geração de TISS XML
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Variáveis</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TEMPLATE_CATEGORIES[template.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {template.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.is_default ? "default" : "secondary"}>
                      {template.is_default ? "Padrão" : "Personalizado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(template.variables || []).length} variáveis
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {template.updated_at 
                      ? new Date(template.updated_at).toLocaleDateString('pt-BR')
                      : new Date(template.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title="Editar template"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                        title="Duplicar template"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(template)}
                        title="Exportar template"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!template.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          title="Excluir template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {loading && templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template TISS encontrado</p>
              {searchTerm ? (
                <p className="text-sm mt-2">Tente ajustar o termo de busca</p>
              ) : (
                <p className="text-sm mt-2">Crie um novo template para começar</p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
