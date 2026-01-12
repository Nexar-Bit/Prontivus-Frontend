"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatAssistantProps {
  className?: string;
  systemPrompt?: string;
  placeholder?: string;
  title?: string;
}

export function AIChatAssistant({
  className,
  systemPrompt = "You are a helpful customer service assistant for a healthcare management system called Prontivus. Help users with questions about using the system, finding features, troubleshooting issues, and general support. Be friendly, professional, and concise. If you cannot answer a question, suggest creating a support ticket.",
  placeholder = "Digite sua pergunta...",
  title = "Assistente de IA",
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [checkingAi, setCheckingAi] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if AI is enabled when component mounts
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        const config = await api.get<{
          enabled: boolean;
          ai_module_enabled?: boolean;
          warning?: string;
        }>("/api/v1/ai-config");
        
        setAiEnabled(config.enabled && (config.ai_module_enabled ?? true));
      } catch (error: any) {
        console.error("Failed to check AI status:", error);
        // If endpoint doesn't exist or user doesn't have access, assume disabled
        setAiEnabled(false);
      } finally {
        setCheckingAi(false);
      }
    };

    checkAiStatus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Build conversation context
      const context = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call AI chat endpoint
      const response = await api.post<{
        response: string;
        tokens_used: number;
        response_time_ms: number;
      }>("/api/v1/ai/chat", {
        message: userMessage.content,
        context: context.length > 0 ? context : undefined,
        system_prompt: systemPrompt,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI chat error:", error);
      
      let errorMessage = "Erro ao conectar com o assistente de IA.";
      
      if (error?.response?.status === 403) {
        errorMessage = "Limite de tokens excedido ou IA não configurada. Entre em contato com o administrador.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Serviço de IA não encontrado. Verifique se a IA está configurada.";
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error("Erro no Assistente de IA", {
        description: errorMessage,
      });

      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Desculpe, ocorreu um erro: ${errorMessage}. Por favor, tente novamente ou crie um ticket de suporte para obter ajuda.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Don't show if AI is not enabled or still checking
  if (checkingAi || aiEnabled === false) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
          size="lg"
          title="Abrir Assistente de IA"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-96", className)}>
      <Card className="shadow-2xl border-2 border-[#0F4C75]">
        <CardHeader className="pb-3 bg-gradient-to-r from-[#0F4C75] to-[#1B9AAA] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0">
              {/* Messages Area */}
              <div className="h-96 p-4 overflow-y-auto" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Bot className="h-12 w-12 text-[#1B9AAA] mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Olá! Sou seu assistente de IA.
                    </p>
                    <p className="text-xs text-gray-500">
                      Como posso ajudá-lo hoje?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-[#1B9AAA] flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 max-w-[80%]",
                            message.role === "user"
                              ? "bg-[#0F4C75] text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {message.role === "user" && (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-3 justify-start">
                        <div className="h-8 w-8 rounded-full bg-[#1B9AAA] flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#1B9AAA]" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="flex-1">{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setError(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t p-3 bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                    onClick={clearChat}
                  >
                    Limpar conversa
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
