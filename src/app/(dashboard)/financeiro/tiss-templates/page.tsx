"use client";

import { useState, useEffect } from "react";
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
  id: string;
  name: string;
  description: string;
  category: 'consultation' | 'procedure' | 'exam' | 'emergency' | 'custom';
  isDefault: boolean;
  xmlTemplate: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_CATEGORIES = {
  'consultation': 'Consulta',
  'procedure': 'Procedimento',
  'exam': 'Exame',
  'emergency': 'Emergência',
  'custom': 'Personalizado'
};

export default function TissTemplatesPage() {
  const [templates, setTemplates] = useState<TissTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TissTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<TissTemplate>>({
    name: "",
    description: "",
    category: "consultation",
    isDefault: false,
    xmlTemplate: "",
    variables: []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load from localStorage (in a real app, this would be from the backend)
      const savedTemplates = localStorage.getItem('tiss-templates');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      } else {
        // Load default templates
        const defaultTemplates: TissTemplate[] = [
          {
            id: "1",
            name: "Consulta Médica Padrão",
            description: "Template padrão para consultas médicas",
            category: "consultation",
            isDefault: true,
            xmlTemplate: `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>{{SEQUENTIAL}}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>{{DATE}}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>{{TIME}}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>{{PRESTADOR_CODE}}</ans:codigoPrestadorNaOperadora>
        <ans:cnpjPrestador>{{PRESTADOR_CNPJ}}</ans:cnpjPrestador>
        <ans:nomePrestador>{{PRESTADOR_NAME}}</ans:nomePrestador>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>{{OPERADORA_ANS}}</ans:registroANS>
      <ans:cnpjOperadora>{{OPERADORA_CNPJ}}</ans:cnpjOperadora>
      <ans:nomeOperadora>{{OPERADORA_NAME}}</ans:nomeOperadora>
    </ans:destino>
    <ans:versaoPadrao>3.03.00</ans:versaoPadrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>{{LOTE_NUMBER}}</ans:numeroLote>
      <ans:guiasTISS>
        <ans:guiaConsulta>
          <ans:cabecalhoGuia>
            <ans:numeroGuiaPrestador>{{GUIA_NUMBER}}</ans:numeroGuiaPrestador>
            <ans:numeroGuiaOperadora>{{GUIA_OPERADORA}}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>{{AUTH_DATE}}</ans:dataAutorizacao>
            <ans:senha>{{PASSWORD}}</ans:senha>
            <ans:dataValidadeSenha>{{PASSWORD_VALIDITY}}</ans:dataValidadeSenha>
          </ans:cabecalhoGuia>
          <ans:beneficiario>
            <ans:numeroCarteira>{{BENEFICIARIO_CARTEIRA}}</ans:numeroCarteira>
            <ans:nomeBeneficiario>{{BENEFICIARIO_NAME}}</ans:nomeBeneficiario>
            <ans:numeroCNS>{{BENEFICIARIO_CNS}}</ans:numeroCNS>
            <ans:identificacaoBeneficiario>
              <ans:cpf>{{BENEFICIARIO_CPF}}</ans:cpf>
            </ans:identificacaoBeneficiario>
          </ans:beneficiario>
          <ans:contratadoExecutante>
            <ans:identificacaoExecutante>
              <ans:codigoPrestadorNaOperadora>{{PRESTADOR_CODE}}</ans:codigoPrestadorNaOperadora>
              <ans:cnpjContratado>{{PRESTADOR_CNPJ}}</ans:cnpjContratado>
              <ans:nomeContratado>{{PRESTADOR_NAME}}</ans:nomeContratado>
            </ans:identificacaoExecutante>
            <ans:profissionalExecutante>
              <ans:nomeProfissional>{{DOCTOR_NAME}}</ans:nomeProfissional>
              <ans:conselhoProfissional>{{DOCTOR_COUNCIL}}</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>{{DOCTOR_COUNCIL_NUMBER}}</ans:numeroConselhoProfissional>
              <ans:UFConselho>{{DOCTOR_COUNCIL_UF}}</ans:UFConselho>
              <ans:CBOS>{{DOCTOR_CBOS}}</ans:CBOS>
            </ans:profissionalExecutante>
          </ans:contratadoExecutante>
          <ans:procedimentosExecutados>
            <ans:procedimentoExecutado>
              <ans:procedimento>
                <ans:codigoTabela>22</ans:codigoTabela>
                <ans:codigoProcedimento>{{PROCEDURE_CODE}}</ans:codigoProcedimento>
                <ans:descricaoProcedimento>{{PROCEDURE_DESCRIPTION}}</ans:descricaoProcedimento>
              </ans:procedimento>
              <ans:quantidadeExecutada>{{PROCEDURE_QUANTITY}}</ans:quantidadeExecutada>
              <ans:reducaoAcrescimo>{{PROCEDURE_REDUCTION}}</ans:reducaoAcrescimo>
              <ans:valorUnitario>{{PROCEDURE_VALUE}}</ans:valorUnitario>
              <ans:valorTotal>{{PROCEDURE_TOTAL}}</ans:valorTotal>
            </ans:procedimentoExecutado>
          </ans:procedimentosExecutados>
          <ans:observacao>{{OBSERVATIONS}}</ans:observacao>
          <ans:valorTotal>{{TOTAL_VALUE}}</ans:valorTotal>
        </ans:guiaConsulta>
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:operadoraParaPrestador>
    <ans:protocoloRecebimento>
      <ans:identificacaoOperadora>
        <ans:registroANS>{{OPERADORA_ANS}}</ans:registroANS>
        <ans:cnpjOperadora>{{OPERADORA_CNPJ}}</ans:cnpjOperadora>
        <ans:nomeOperadora>{{OPERADORA_NAME}}</ans:nomeOperadora>
      </ans:identificacaoOperadora>
      <ans:numeroProtocolo>{{PROTOCOL_NUMBER}}</ans:numeroProtocolo>
      <ans:dataProtocolo>{{PROTOCOL_DATE}}</ans:dataProtocolo>
    </ans:protocoloRecebimento>
  </ans:operadoraParaPrestador>
</ans:mensagemTISS>`,
            variables: [
              "SEQUENTIAL", "DATE", "TIME", "PRESTADOR_CODE", "PRESTADOR_CNPJ", "PRESTADOR_NAME",
              "OPERADORA_ANS", "OPERADORA_CNPJ", "OPERADORA_NAME", "LOTE_NUMBER", "GUIA_NUMBER",
              "GUIA_OPERADORA", "AUTH_DATE", "PASSWORD", "PASSWORD_VALIDITY", "BENEFICIARIO_CARTEIRA",
              "BENEFICIARIO_NAME", "BENEFICIARIO_CNS", "BENEFICIARIO_CPF", "DOCTOR_NAME", "DOCTOR_COUNCIL",
              "DOCTOR_COUNCIL_NUMBER", "DOCTOR_COUNCIL_UF", "DOCTOR_CBOS", "PROCEDURE_CODE",
              "PROCEDURE_DESCRIPTION", "PROCEDURE_QUANTITY", "PROCEDURE_REDUCTION", "PROCEDURE_VALUE",
              "PROCEDURE_TOTAL", "OBSERVATIONS", "TOTAL_VALUE", "PROTOCOL_NUMBER", "PROTOCOL_DATE"
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "2",
            name: "Procedimento Cirúrgico",
            description: "Template para procedimentos cirúrgicos",
            category: "procedure",
            isDefault: true,
            xmlTemplate: `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <!-- Template para procedimentos cirúrgicos -->
  <ans:cabecalho>
    <!-- Cabeçalho padrão -->
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>{{LOTE_NUMBER}}</ans:numeroLote>
      <ans:guiasTISS>
        <ans:guiaSP-SADT>
          <!-- Estrutura para procedimentos -->
        </ans:guiaSP-SADT>
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
</ans:mensagemTISS>`,
            variables: ["LOTE_NUMBER", "PROCEDURE_CODE", "PROCEDURE_DESCRIPTION"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setTemplates(defaultTemplates);
        localStorage.setItem('tiss-templates', JSON.stringify(defaultTemplates));
      }
    } catch (error: any) {
      toast.error("Erro ao carregar templates TISS", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      let updatedTemplates;
      
      if (editingTemplate) {
        // Update existing template
        updatedTemplates = templates.map(template => 
          template.id === editingTemplate.id 
            ? { 
                ...template, 
                ...formData,
                updatedAt: new Date().toISOString()
              } 
            : template
        );
      } else {
        // Add new template
        const { id, ...formDataWithoutId } = formData as TissTemplate;
        const newTemplate: TissTemplate = {
          id: Date.now().toString(),
          ...formDataWithoutId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedTemplates = [...templates, newTemplate];
      }
      
      setTemplates(updatedTemplates);
      localStorage.setItem('tiss-templates', JSON.stringify(updatedTemplates));
      
      toast.success(editingTemplate ? "Template TISS atualizado!" : "Template TISS adicionado!");
      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData({
        name: "",
        description: "",
        category: "consultation",
        isDefault: false,
        xmlTemplate: "",
        variables: []
      });
    } catch (error: any) {
      toast.error("Erro ao salvar template TISS", {
        description: error.message
      });
    }
  };

  const handleEdit = (template: TissTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este template TISS?")) {
      try {
        const updatedTemplates = templates.filter(template => template.id !== id);
        setTemplates(updatedTemplates);
        localStorage.setItem('tiss-templates', JSON.stringify(updatedTemplates));
        toast.success("Template TISS excluído!");
      } catch (error: any) {
        toast.error("Erro ao excluir template TISS", {
          description: error.message
        });
      }
    }
  };

  const handleDuplicate = (template: TissTemplate) => {
    const duplicatedTemplate: TissTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Cópia)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedTemplates = [...templates, duplicatedTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('tiss-templates', JSON.stringify(updatedTemplates));
    toast.success("Template TISS duplicado!");
  };

  const handleExport = (template: TissTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTemplate = JSON.parse(e.target?.result as string);
          const newTemplate: TissTemplate = {
            ...importedTemplate,
            id: Date.now().toString(),
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const updatedTemplates = [...templates, newTemplate];
          setTemplates(updatedTemplates);
          localStorage.setItem('tiss-templates', JSON.stringify(updatedTemplates));
          toast.success("Template TISS importado!");
        } catch (error) {
          toast.error("Erro ao importar template TISS", {
            description: "Arquivo inválido"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                  isDefault: false,
                  xmlTemplate: "",
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
                    value={formData.xmlTemplate || ""}
                    onChange={(e) => setFormData({...formData, xmlTemplate: e.target.value})}
                    placeholder="Cole o template XML aqui..."
                    rows={15}
                    className="font-mono text-sm"
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
                    {template.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isDefault ? "default" : "secondary"}>
                      {template.isDefault ? "Padrão" : "Personalizado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.variables.length} variáveis
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(template.updatedAt).toLocaleDateString('pt-BR')}
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
                      {!template.isDefault && (
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
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum template TISS encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
