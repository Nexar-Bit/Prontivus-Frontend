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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  Clock,
  Calendar,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface TissAutomation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: 'daily' | 'weekly' | 'monthly' | 'invoice_created' | 'appointment_completed';
  triggerTime?: string; // For scheduled triggers
  triggerDay?: number; // For weekly/monthly triggers
  conditions: {
    status?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    minAmount?: number;
    maxAmount?: number;
  };
  actions: {
    generateTissXml: boolean;
    sendEmail: boolean;
    emailRecipients: string[];
    emailTemplate?: string;
  };
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_TYPES = {
  'daily': 'Diário',
  'weekly': 'Semanal',
  'monthly': 'Mensal',
  'invoice_created': 'Ao criar fatura',
  'appointment_completed': 'Ao concluir consulta'
};

const TRIGGER_DAYS = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado'
};

export default function TissAutomationPage() {
  const [automations, setAutomations] = useState<TissAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<TissAutomation | null>(null);
  const [formData, setFormData] = useState<Partial<TissAutomation>>({
    name: "",
    description: "",
    isActive: true,
    triggerType: "daily",
    triggerTime: "09:00",
    conditions: {
      status: ["issued"],
      dateRange: {
        start: "",
        end: ""
      }
    },
    actions: {
      generateTissXml: true,
      sendEmail: false,
      emailRecipients: [],
      emailTemplate: ""
    },
    runCount: 0,
    successCount: 0,
    errorCount: 0
  });

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      // Load from localStorage (in a real app, this would be from the backend)
      const savedAutomations = localStorage.getItem('tiss-automations');
      if (savedAutomations) {
        setAutomations(JSON.parse(savedAutomations));
      } else {
        // Load default automations
        const defaultAutomations: TissAutomation[] = [
          {
            id: "1",
            name: "Geração Diária TISS",
            description: "Gera TISS XML para todas as faturas emitidas no dia anterior",
            isActive: true,
            triggerType: "daily",
            triggerTime: "08:00",
            conditions: {
              status: ["issued"],
              dateRange: {
                start: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                end: new Date(Date.now() - 86400000).toISOString().split('T')[0]
              }
            },
            actions: {
              generateTissXml: true,
              sendEmail: true,
              emailRecipients: ["financeiro@clinica.com"],
              emailTemplate: "Relatório diário de TISS XML gerados"
            },
            lastRun: new Date(Date.now() - 3600000).toISOString(),
            nextRun: new Date(Date.now() + 3600000).toISOString(),
            runCount: 15,
            successCount: 14,
            errorCount: 1,
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "2",
            name: "TISS ao Concluir Consulta",
            description: "Gera TISS XML automaticamente quando uma consulta é concluída",
            isActive: true,
            triggerType: "appointment_completed",
            conditions: {
              status: ["issued"]
            },
            actions: {
              generateTissXml: true,
              sendEmail: false,
              emailRecipients: []
            },
            lastRun: new Date(Date.now() - 7200000).toISOString(),
            runCount: 8,
            successCount: 8,
            errorCount: 0,
            createdAt: new Date(Date.now() - 1728000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        setAutomations(defaultAutomations);
        localStorage.setItem('tiss-automations', JSON.stringify(defaultAutomations));
      }
    } catch (error: any) {
      toast.error("Erro ao carregar automações TISS", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      let updatedAutomations;
      
      if (editingAutomation) {
        // Update existing automation
        updatedAutomations = automations.map(automation => 
          automation.id === editingAutomation.id 
            ? { 
                ...automation, 
                ...formData,
                updatedAt: new Date().toISOString()
              } 
            : automation
        );
      } else {
        // Add new automation
        const { id, ...formDataWithoutId } = formData as TissAutomation;
        const newAutomation: TissAutomation = {
          id: Date.now().toString(),
          ...formDataWithoutId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedAutomations = [...automations, newAutomation];
      }
      
      setAutomations(updatedAutomations);
      localStorage.setItem('tiss-automations', JSON.stringify(updatedAutomations));
      
      toast.success(editingAutomation ? "Automação TISS atualizada!" : "Automação TISS criada!");
      setIsDialogOpen(false);
      setEditingAutomation(null);
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao salvar automação TISS", {
        description: error.message
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
      triggerType: "daily",
      triggerTime: "09:00",
      conditions: {
        status: ["issued"],
        dateRange: {
          start: "",
          end: ""
        }
      },
      actions: {
        generateTissXml: true,
        sendEmail: false,
        emailRecipients: [],
        emailTemplate: ""
      },
      runCount: 0,
      successCount: 0,
      errorCount: 0
    });
  };

  const handleEdit = (automation: TissAutomation) => {
    setEditingAutomation(automation);
    setFormData(automation);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta automação TISS?")) {
      try {
        const updatedAutomations = automations.filter(automation => automation.id !== id);
        setAutomations(updatedAutomations);
        localStorage.setItem('tiss-automations', JSON.stringify(updatedAutomations));
        toast.success("Automação TISS excluída!");
      } catch (error: any) {
        toast.error("Erro ao excluir automação TISS", {
          description: error.message
        });
      }
    }
  };

  const handleToggleActive = (id: string) => {
    const updatedAutomations = automations.map(automation => 
      automation.id === id 
        ? { ...automation, isActive: !automation.isActive, updatedAt: new Date().toISOString() }
        : automation
    );
    setAutomations(updatedAutomations);
    localStorage.setItem('tiss-automations', JSON.stringify(updatedAutomations));
    
    const automation = automations.find(a => a.id === id);
    toast.success(`Automação ${automation?.isActive ? 'pausada' : 'ativada'}!`);
  };

  const handleRunNow = (id: string) => {
    // Simulate running automation
    const updatedAutomations = automations.map(automation => 
      automation.id === id 
        ? { 
            ...automation, 
            lastRun: new Date().toISOString(),
            runCount: automation.runCount + 1,
            successCount: automation.successCount + 1,
            updatedAt: new Date().toISOString()
          }
        : automation
    );
    setAutomations(updatedAutomations);
    localStorage.setItem('tiss-automations', JSON.stringify(updatedAutomations));
    
    toast.success("Automação executada com sucesso!");
  };

  const getStatusBadge = (automation: TissAutomation) => {
    if (!automation.isActive) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Pause className="h-3 w-3" />
          Pausada
        </Badge>
      );
    }
    
    const successRate = automation.runCount > 0 ? (automation.successCount / automation.runCount) * 100 : 100;
    
    if (successRate >= 90) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Ativa
        </Badge>
      );
    } else if (successRate >= 70) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Com Avisos
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Com Erros
        </Badge>
      );
    }
  };

  const filteredAutomations = automations.filter(automation =>
    automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    automation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    automation.triggerType.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Automação TISS XML</h1>
          <p className="text-muted-foreground">
            Configure automações para geração automática de arquivos TISS XML
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAutomation ? "Editar Automação TISS" : "Nova Automação TISS"}
              </DialogTitle>
              <DialogDescription>
                {editingAutomation ? "Atualize as configurações da automação" : "Configure uma nova automação para TISS XML"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Automação</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Geração Diária TISS"
                  />
                </div>
                <div>
                  <Label htmlFor="triggerType">Tipo de Disparo</Label>
                  <Select
                    value={formData.triggerType || "daily"}
                    onValueChange={(value) => setFormData({...formData, triggerType: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIGGER_TYPES).map(([code, name]) => (
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
                  placeholder="Descrição da automação"
                  rows={2}
                />
              </div>

              {(formData.triggerType === 'daily' || formData.triggerType === 'weekly' || formData.triggerType === 'monthly') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="triggerTime">Horário</Label>
                    <Input
                      id="triggerTime"
                      type="time"
                      value={formData.triggerTime || "09:00"}
                      onChange={(e) => setFormData({...formData, triggerTime: e.target.value})}
                    />
                  </div>
                  {(formData.triggerType === 'weekly' || formData.triggerType === 'monthly') && (
                    <div>
                      <Label htmlFor="triggerDay">Dia</Label>
                      <Select
                        value={formData.triggerDay?.toString() || "1"}
                        onValueChange={(value) => setFormData({...formData, triggerDay: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRIGGER_DAYS).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Condições</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="generateTissXml"
                      checked={formData.actions?.generateTissXml || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        actions: {
                          ...formData.actions!,
                          generateTissXml: e.target.checked
                        }
                      })}
                    />
                    <Label htmlFor="generateTissXml">Gerar TISS XML</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={formData.actions?.sendEmail || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        actions: {
                          ...formData.actions!,
                          sendEmail: e.target.checked
                        }
                      })}
                    />
                    <Label htmlFor="sendEmail">Enviar por Email</Label>
                  </div>
                </div>
              </div>

              {formData.actions?.sendEmail && (
                <div>
                  <Label htmlFor="emailRecipients">Destinatários (separados por vírgula)</Label>
                  <Input
                    id="emailRecipients"
                    value={formData.actions?.emailRecipients?.join(', ') || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions!,
                        emailRecipients: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                      }
                    })}
                    placeholder="email1@exemplo.com, email2@exemplo.com"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingAutomation ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automações</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.reduce((sum, a) => sum + a.runCount, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.length > 0 ? 
                Math.round((automations.reduce((sum, a) => sum + a.successCount, 0) / 
                automations.reduce((sum, a) => sum + a.runCount, 0)) * 100) || 0 : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar automações por nome, descrição ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automações TISS ({filteredAutomations.length})</CardTitle>
          <CardDescription>
            Lista de automações configuradas para TISS XML
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Execução</TableHead>
                <TableHead>Execuções</TableHead>
                <TableHead>Taxa Sucesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{automation.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {automation.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {TRIGGER_TYPES[automation.triggerType]}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(automation)}</TableCell>
                  <TableCell>
                    {automation.lastRun ? 
                      new Date(automation.lastRun).toLocaleString('pt-BR') : 
                      'Nunca executada'
                    }
                  </TableCell>
                  <TableCell>{automation.runCount}</TableCell>
                  <TableCell>
                    {automation.runCount > 0 ? 
                      Math.round((automation.successCount / automation.runCount) * 100) : 0}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(automation.id)}
                        title={automation.isActive ? "Pausar" : "Ativar"}
                      >
                        {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunNow(automation.id)}
                        title="Executar agora"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(automation)}
                        title="Editar automação"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(automation.id)}
                        title="Excluir automação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredAutomations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma automação TISS encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
