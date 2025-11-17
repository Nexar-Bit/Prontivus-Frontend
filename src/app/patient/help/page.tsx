"use client";

import React, { useState, useEffect } from "react";
import { PatientHeader, PatientSidebar, PatientMobileNav } from "@/components/patient/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HelpArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views?: number;
  helpful_count?: number;
  created_at: string;
}

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at?: string;
}

export default function PatientHelpPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("articles");
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium" as SupportTicket["priority"],
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Load help articles and tickets
  useEffect(() => {
    loadData();
  }, [refreshKey, selectedCategory]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load help articles
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);
        const url = `/api/v1/support/articles${params.toString() ? `?${params.toString()}` : ''}`;
        const articlesData = await api.get<HelpArticle[]>(url);
        setArticles(articlesData);
      } catch (error: any) {
        console.error("Failed to load articles:", error);
        toast.error("Erro ao carregar artigos", {
          description: error?.message || error?.detail || "Não foi possível carregar os artigos de ajuda",
        });
        setArticles([]);
      }

      // Load categories
      try {
        const categoriesData = await api.get<string[]>("/api/v1/support/articles/categories");
        setCategories(categoriesData);
      } catch (error: any) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      }

      // Load support tickets
      try {
        const ticketsData = await api.get<SupportTicket[]>("/api/v1/support/tickets");
        setTickets(ticketsData);
      } catch (error: any) {
        console.error("Failed to load tickets:", error);
        setTickets([]);
      }
    } catch (error: any) {
      console.error("Failed to load help data:", error);
      toast.error("Erro ao carregar dados", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSubmittingTicket(true);
      await api.post<SupportTicket>("/api/v1/support/tickets", ticketForm);
      
      toast.success("Ticket de suporte criado com sucesso!", {
        description: "Nossa equipe entrará em contato em breve.",
      });
      setShowTicketForm(false);
      setTicketForm({ subject: "", description: "", priority: "medium" });
      
      // Reload tickets
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Failed to create ticket:", error);
      toast.error("Erro ao criar ticket", {
        description: error?.message || error?.detail || "Não foi possível criar o ticket. Tente novamente.",
      });
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleMarkHelpful = async (articleId: number) => {
    try {
      await api.post(`/api/v1/support/articles/${articleId}/helpful`);
      toast.success("Obrigado pelo feedback!");
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Failed to mark article as helpful:", error);
      toast.error("Erro ao registrar feedback", {
        description: error?.message || error?.detail || "Não foi possível registrar seu feedback",
      });
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery && !selectedCategory) return true;
    const query = searchQuery?.toLowerCase() || "";
    const matchesSearch = !query || (
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.tags.some((tag) => tag.toLowerCase().includes(query))
    );
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "Aberto";
      case "in_progress":
        return "Em Andamento";
      case "resolved":
        return "Resolvido";
      case "closed":
        return "Fechado";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch={false} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Central de Ajuda</h1>
              <p className="text-[#5D737E]">Encontre respostas para suas dúvidas ou entre em contato com nosso suporte</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                toast.success('Dados atualizados!');
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="medical-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#1B9AAA]/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-[#1B9AAA]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F4C75]">Chat ao Vivo</h3>
                    <p className="text-sm text-[#5D737E]">Disponível 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#16C79A]/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-[#16C79A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F4C75]">Telefone</h3>
                    <p className="text-sm text-[#5D737E]">(11) 3000-0000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#0F4C75]/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-[#0F4C75]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F4C75]">E-mail</h3>
                    <p className="text-sm text-[#5D737E]">suporte@prontivus.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="medical-card mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Pesquisar artigos de ajuda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="articles" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Artigos de Ajuda
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Meus Tickets
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles" className="space-y-6">
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                  className={selectedCategory === "" ? "bg-[#0F4C75] text-white" : ""}
                >
                  Todos
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-[#0F4C75] text-white" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Articles List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C75] mx-auto"></div>
                  <p className="mt-4 text-[#5D737E]">Carregando artigos...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-[#5D737E]">Nenhum artigo encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="medical-card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg text-[#0F4C75] pr-4">
                            {article.title}
                          </CardTitle>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                        {article.views !== undefined && (
                          <span className="text-xs text-gray-500">
                            {article.views} visualizações
                          </span>
                        )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[#5D737E] line-clamp-2">
                          {article.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Support Tickets Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[#0F4C75]">Meus Tickets de Suporte</h2>
                <Button
                  onClick={() => setShowTicketForm(true)}
                  className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Novo Ticket
                </Button>
              </div>

              {tickets.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-[#5D737E] mb-4">Você ainda não tem tickets de suporte</p>
                    <Button
                      onClick={() => setShowTicketForm(true)}
                      className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                    >
                      Criar Primeiro Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="medical-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-[#0F4C75] mb-2">
                              {ticket.subject}
                            </CardTitle>
                            <div className="flex gap-2 mb-2">
                              <Badge className={getStatusColor(ticket.status)}>
                                {getStatusLabel(ticket.status)}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {getPriorityLabel(ticket.priority)}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#5D737E] line-clamp-2">
                              {ticket.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Criado em {format(parseISO(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                          {ticket.updated_at && (
                            <span>Atualizado em {format(parseISO(ticket.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Article Detail Dialog */}
          {selectedArticle && (
            <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-[#0F4C75] mb-2">
                    {selectedArticle.title}
                  </DialogTitle>
                  <DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedArticle.category}</Badge>
                      {selectedArticle.views !== undefined && (
                        <span className="text-xs text-gray-500">
                          {selectedArticle.views} visualizações
                        </span>
                      )}
                      {(selectedArticle as any).helpful_count !== undefined && (
                        <span className="text-xs text-gray-500">
                          {(selectedArticle as any).helpful_count} pessoas acharam útil
                        </span>
                      )}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="text-[#5D737E] whitespace-pre-line">{selectedArticle.content}</p>
                  </div>
                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-[#0F4C75] mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <DialogFooter className="pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (selectedArticle) {
                          handleMarkHelpful(selectedArticle.id);
                        }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Foi Útil
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedArticle(null);
                        setShowTicketForm(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Preciso de Mais Ajuda
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Create Ticket Dialog */}
          <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-[#0F4C75]">Criar Ticket de Suporte</DialogTitle>
                <DialogDescription>
                  Descreva seu problema ou dúvida e nossa equipe entrará em contato
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ticket-subject" className="text-sm font-medium text-[#0F4C75]">
                    Assunto
                  </Label>
                  <Input
                    id="ticket-subject"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                    placeholder="Ex: Problema ao agendar consulta"
                  />
                </div>
                <div>
                  <Label htmlFor="ticket-description" className="text-sm font-medium text-[#0F4C75]">
                    Descrição
                  </Label>
                  <Textarea
                    id="ticket-description"
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, description: e.target.value })
                    }
                    placeholder="Descreva detalhadamente seu problema ou dúvida..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="ticket-priority" className="text-sm font-medium text-[#0F4C75]">
                    Prioridade
                  </Label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value) =>
                      setTicketForm({
                        ...ticketForm,
                        priority: value as SupportTicket["priority"],
                      })
                    }
                  >
                    <SelectTrigger id="ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTicketForm(false);
                    setTicketForm({ subject: "", description: "", priority: "medium" });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                  onClick={handleCreateTicket}
                  disabled={!ticketForm.subject.trim() || !ticketForm.description.trim() || submittingTicket}
                >
                  {submittingTicket ? "Enviando..." : "Enviar Ticket"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

