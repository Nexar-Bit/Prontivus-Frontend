"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Shield,
  Users,
  Stethoscope,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";

interface FAQ {
  id: number;
  category: "general" | "security" | "patients" | "providers";
  question: string;
  answer: string;
}

interface FAQSectionProps {
  className?: string;
}

export function FAQSection({ className }: FAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const faqs: FAQ[] = [
    // General Questions
    {
      id: 1,
      category: "general",
      question: "O que é o Prontivus?",
      answer:
        "O Prontivus é uma plataforma completa de gestão em saúde que conecta pacientes, médicos e clínicas em um sistema seguro e inteligente. Oferece PEP, agendamentos, telemedicina, faturamento e análises para otimizar operações e melhorar o cuidado.",
    },
    {
      id: 2,
      category: "general",
      question: "Como o Prontivus se diferencia de outras plataformas?",
      answer:
        "O Prontivus unifica gestão de pacientes, documentação clínica, operações financeiras e telemedicina em um só sistema, com análises em tempo real, automação TISS e experiência moderna para profissionais e pacientes, reduzindo a carga administrativa.",
    },
    {
      id: 3,
      category: "general",
      question: "Que tipos de instituições podem usar o Prontivus?",
      answer:
        "Clínicas, consultórios, hospitais, centros de diagnóstico e especialidades. A plataforma é escalável e personalizável para pequenos consultórios até grandes redes.",
    },
    {
      id: 4,
      category: "general",
      question: "Existe aplicativo móvel?",
      answer:
        "Sim, para iOS e Android. Pacientes podem agendar, acessar prontuário e resultados, e se comunicar com a equipe. Profissionais acessam recursos essenciais no celular.",
    },
    // Security & Compliance
    {
      id: 5,
      category: "security",
      question: "Meus dados estão seguros?",
      answer:
        "Sim. Criptografia de nível bancário, datacenters seguros com monitoramento 24/7, auditorias regulares e boas práticas. Dados criptografados em trânsito e em repouso; acesso com MFA e permissões por perfil.",
    },
    {
      id: 6,
      category: "security",
      question: "O Prontivus é compatível com HIPAA?",
      answer:
        "Sim. Mantemos salvaguardas administrativas, físicas e técnicas exigidas, com trilhas de auditoria, controles de acesso, criptografia e BAAs com parceiros.",
    },
    {
      id: 7,
      category: "security",
      question: "Quais certificações de segurança o Prontivus possui?",
      answer:
        "ISO 27001, SOC 2 Tipo II e conformidade com GDPR. Realizamos testes de intrusão e avaliações periódicas.",
    },
    {
      id: 8,
      category: "security",
      question: "Como são feitos os backups?",
      answer:
        "Backups diários automatizados com recuperação point-in-time e replicação geográfica para alta disponibilidade e DR, conforme regulatório.",
    },
    // For Patients
    {
      id: 9,
      category: "patients",
      question: "Como agendo uma consulta?",
      answer:
        "Acesse o portal/app, vá em Consultas, escolha médico/especialidade, selecione um horário e confirme. Enviamos lembretes por e-mail/SMS. Reagende ou cancele pela plataforma.",
    },
    {
      id: 10,
      category: "patients",
      question: "Posso acessar meu prontuário?",
      answer:
        "Sim, com acesso a resultados, laudos, prescrições, resumos, vacinas e histórico completo 24/7, com download e compartilhamento seguro.",
    },
    {
      id: 11,
      category: "patients",
      question: "Posso fazer consultas virtuais?",
      answer:
        "Sim. Agende vídeo-consultas, participe em tempo real e receba prescrições digitais, com mensagens seguras e conformidade HIPAA.",
    },
    {
      id: 12,
      category: "patients",
      question: "Como recebo os resultados de exames?",
      answer:
        "São disponibilizados no portal assim que prontos, com notificação. Incluem detalhes e valores de referência, com compartilhamento/download.",
    },
    {
      id: 13,
      category: "patients",
      question: "Há custo para pacientes usarem o Prontivus?",
      answer:
        "Geralmente disponibilizado pela instituição, sem custo direto ao paciente. Taxas de consultas/exames são do prestador, não da plataforma.",
    },
    // For Providers
    {
      id: 14,
      category: "providers",
      question: "Como funciona a implantação?",
      answer:
        "Em média 2–4 semanas, com levantamento, migração de dados, configuração, treinamento e rollout por fases com suporte contínuo.",
    },
    {
      id: 15,
      category: "providers",
      question: "Que treinamentos são oferecidos?",
      answer:
        "Onboarding para todos, trilhas por perfil, vídeos e documentação, suporte na transição e atualização contínua. Presencial ou remoto.",
    },
    {
      id: 16,
      category: "providers",
      question: "Posso migrar dados do sistema atual?",
      answer:
        "Sim. Migramos pacientes, prontuários, histórico de consultas, faturamento etc., com mapeamento, validação e testes para integridade.",
    },
    {
      id: 17,
      category: "providers",
      question: "Como funciona faturamento e convênios?",
      answer:
        "Faturamento automatizado com conformidade TISS, envio de guias, acompanhamento de pagamentos, saldos e relatórios; suporte a vários convênios.",
    },
    {
      id: 18,
      category: "providers",
      question: "Que suporte está disponível?",
      answer:
        "Suporte por e-mail 24/7, atendimento prioritário para planos superiores, gerente dedicado, atualizações contínuas e base de conhecimento.",
    },
    {
      id: 19,
      category: "providers",
      question: "Há período de teste?",
      answer:
        "Sim, 30 dias gratuitos com acesso completo. Explore a plataforma, importe dados de exemplo e teste recursos sem cartão de crédito.",
    },
    {
      id: 20,
      category: "providers",
      question: "O Prontivus integra com outros sistemas?",
      answer:
        "Sim, via API com laboratórios, imagem, farmácia, contabilidade e outros. Suporte a HL7 e FHIR. Fazemos integrações sob demanda.",
    },
  ];

  const categories = [
    { id: "general", label: "Geral", icon: HelpCircle, color: "text-[#0F4C75]" },
    { id: "security", label: "Segurança & Conformidade", icon: Shield, color: "text-[#1B9AAA]" },
    { id: "patients", label: "Para Pacientes", icon: Users, color: "text-[#16C79A]" },
    { id: "providers", label: "Para Profissionais", icon: Stethoscope, color: "text-[#5D737E]" },
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [faqs, selectedCategory, searchQuery]);

  // Toggle individual FAQ
  const toggleFAQ = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Expand/collapse all
  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(filteredFAQs.map((faq) => faq.id)));
    }
    setExpandAll(!expandAll);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setExpandedItems(new Set());
    setExpandAll(false);
  };

  return (
    <section id="faq" className={cn("py-20 lg:py-24 bg-white relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <MedicalPattern variant="dots" intensity="subtle" color="#0F4C75" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F4C75] mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-xl text-[#5D737E] max-w-2xl mx-auto">
            Tudo o que você precisa saber sobre o Prontivus e como ele pode beneficiar sua clínica
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5D737E]" />
            <Input
              type="search"
              placeholder="Buscar perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base border-2 border-gray-200 focus:border-[#0F4C75]"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                selectedCategory === null
                  ? "bg-[#0F4C75] text-white"
                  : "border-gray-300 text-[#2D3748] hover:bg-[#0F4C75]/5"
              )}
            >
              Todas
            </Button>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2",
                    selectedCategory === category.id
                      ? "bg-[#0F4C75] text-white"
                      : "border-gray-300 text-[#2D3748] hover:bg-[#0F4C75]/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", selectedCategory === category.id ? "text-white" : category.color)} />
                  {category.label}
                </Button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#5D737E]">
              {filteredFAQs.length} pergunta{filteredFAQs.length !== 1 ? "s" : ""} encontrada{filteredFAQs.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              {(searchQuery || selectedCategory) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#5D737E]">
                  Limpar filtros
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="border-gray-300 text-[#2D3748]"
              >
                {expandAll ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Recolher todas
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Expandir todas
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const category = categories.find((cat) => cat.id === faq.category);
              const CategoryIcon = category?.icon || HelpCircle;
              const isExpanded = expandedItems.has(faq.id);

              return (
                <Card
                  key={faq.id}
                  className={cn(
                    "medical-card border-2 transition-all duration-300",
                    isExpanded
                      ? "border-[#1B9AAA] shadow-lg"
                      : "border-gray-200 hover:border-[#1B9AAA]/50"
                  )}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleFAQ(faq.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleFAQ(faq.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                            category?.id === "general" && "bg-[#0F4C75]/10",
                            category?.id === "security" && "bg-[#1B9AAA]/10",
                            category?.id === "patients" && "bg-[#16C79A]/10",
                            category?.id === "providers" && "bg-[#5D737E]/10"
                          )}
                        >
                          <CategoryIcon className={cn("h-5 w-5", category?.color)} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-[#0F4C75] mb-1">{faq.question}</CardTitle>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              category?.id === "general" && "border-[#0F4C75] text-[#0F4C75]",
                              category?.id === "security" && "border-[#1B9AAA] text-[#1B9AAA]",
                              category?.id === "patients" && "border-[#16C79A] text-[#16C79A]",
                              category?.id === "providers" && "border-[#5D737E] text-[#5D737E]"
                            )}
                          >
                            {category?.label}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-[#5D737E] flex-shrink-0 transition-transform duration-300",
                          isExpanded && "transform rotate-180"
                        )}
                      />
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent
                      id={`faq-answer-${faq.id}`}
                      className="pt-0 pb-6 animate-fade-in"
                    >
                      <div className="pl-14">
                        <p className="text-[#5D737E] leading-relaxed">{faq.answer}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 text-[#5D737E] mx-auto mb-4" />
                <p className="text-lg font-medium text-[#0F4C75] mb-2">Nenhuma pergunta encontrada</p>
                <p className="text-[#5D737E]">
                  Tente ajustar sua busca ou filtros para encontrar o que precisa.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] text-white border-0">
            <CardContent className="p-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-white/90" />
              <h3 className="text-2xl font-bold mb-2">Ainda tem dúvidas?</h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Nosso time de suporte está aqui para ajudar. Fale conosco e retornaremos o quanto antes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-[#0F4C75] hover:bg-white/90 px-8"
                  onClick={() => {
                    if (typeof document !== "undefined") {
                      const footer = document.querySelector("footer");
                      footer?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  Falar com suporte
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/help";
                    }
                  }}
                >
                  Ir para a Central de Ajuda
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

