"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Edit, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface PDFTemplate {
  id: number;
  name: string;
  type: 'consultation' | 'prescription' | 'certificate';
  description: string;
  isDefault: boolean;
  createdAt: string;
}

interface PDFTemplatesProps {
  onTemplateSelect?: (template: PDFTemplate) => void;
  showActions?: boolean;
}

/**
 * PDF Templates Manager Component
 * For managing PDF templates (admin users)
 * 
 * Note: This is a placeholder component. Full template management
 * would require backend API endpoints for template CRUD operations.
 */
export function PDFTemplates({ onTemplateSelect, showActions = true }: PDFTemplatesProps) {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PDFTemplate | null>(null);

  // Default templates (would come from API in production)
  const defaultTemplates: PDFTemplate[] = [
    {
      id: 1,
      name: 'Relatório de Consulta Padrão',
      type: 'consultation',
      description: 'Modelo padrão para relatórios de consulta com SOAP completo',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Receita Médica Simples',
      type: 'prescription',
      description: 'Modelo simplificado para prescrições médicas',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Atestado Médico Padrão',
      type: 'certificate',
      description: 'Modelo padrão para atestados médicos',
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ];

  React.useEffect(() => {
    // In production, this would fetch from API
    setTemplates(defaultTemplates);
  }, []);

  const handleTemplateSelect = (template: PDFTemplate) => {
    onTemplateSelect?.(template);
    toast.success(`Template "${template.name}" selecionado`);
  };

  const handleDelete = (templateId: number) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success('Template excluído com sucesso');
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      consultation: 'default',
      prescription: 'secondary',
      certificate: 'outline',
    };
    
    const labels: Record<string, string> = {
      consultation: 'Consulta',
      prescription: 'Receita',
      certificate: 'Atestado',
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates de PDF</h2>
          <p className="text-muted-foreground">
            Gerencie os templates de documentos PDF do sistema
          </p>
        </div>
        {showActions && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </div>
                {template.isDefault && (
                  <Badge variant="outline" className="ml-2">
                    Padrão
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getTypeBadge(template.type)}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Usar
                  </Button>
                  
                  {showActions && !template.isDefault && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum template encontrado. Crie um novo template para começar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateDialog || editingTemplate !== null} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingTemplate(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Edite as informações do template de PDF'
                : 'Crie um novo template de PDF para documentos'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Relatório de Consulta Personalizado"
                defaultValue={editingTemplate?.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-type">Tipo</Label>
              <select
                id="template-type"
                aria-label="Tipo de template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={editingTemplate?.type}
              >
                <option value="consultation">Consulta</option>
                <option value="prescription">Receita</option>
                <option value="certificate">Atestado</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-description">Descrição</Label>
              <Textarea
                id="template-description"
                placeholder="Descreva o template..."
                defaultValue={editingTemplate?.description}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingTemplate(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success(
                  editingTemplate
                    ? 'Template atualizado com sucesso!'
                    : 'Template criado com sucesso!'
                );
                setShowCreateDialog(false);
                setEditingTemplate(null);
              }}
            >
              {editingTemplate ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

