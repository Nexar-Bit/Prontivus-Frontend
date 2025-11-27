"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Search,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  TestTube,
  Pill,
  Video,
  X,
  Download,
  Eye,
  Zap,
  MoreVertical,
  FileCheck,
  RefreshCw,
  ExternalLink,
  Shield,
  Plus,
} from "lucide-react";
import { PatientHeader, PatientSidebar, PatientMobileNav } from "@/components/patient/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { messagesApi, MessageThread, Message as ApiMessage } from "@/lib/messages-api";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFiles } from "@/lib/file-upload";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ptBR } from "date-fns/locale";

// Types
interface Attachment {
  id?: string;
  name: string;
  type: "image" | "document" | "pdf";
  url: string;
  size: number;
  thumbnail?: string;
}

interface MedicalContext {
  type: "prescription" | "test_result" | "appointment" | "question";
  referenceId?: string;
  metadata?: Record<string, any>;
}

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderType: "patient" | "provider" | "system";
  content: string;
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
  topic?: string;
  attachments?: Attachment[];
  medicalContext?: MedicalContext;
}

const quickResponses = [
  "Obrigado pela informação",
  "Preciso de mais detalhes",
  "Quando posso agendar?",
  "Entendido, obrigado",
  "Preciso cancelar minha consulta",
  "Gostaria de renovar minha receita",
  "Tenho uma dúvida sobre meus exames",
  "Preciso reagendar minha consulta",
  "Posso fazer uma pergunta médica?",
];

export default function MessagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [currentThread, setCurrentThread] = useState<MessageThread | null>(null);
  // Ensure currentThread is always defined (no currentConversation reference)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showCreateThreadDialog, setShowCreateThreadDialog] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [newThreadTopic, setNewThreadTopic] = useState("");
  const [newThreadUrgent, setNewThreadUrgent] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [threadToArchive, setThreadToArchive] = useState<number | null>(null);
  const [archivedThreads, setArchivedThreads] = useState<MessageThread[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, urgent: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time message handlers
  const handleNewMessage = useCallback((message: any) => {
    // Only add message if it's for the current thread
    if (selectedThreadId && message.thread_id === selectedThreadId) {
      const mappedMessage: Message = {
        id: message.id,
        senderId: message.sender_id,
        senderName: message.sender_type === "patient" ? "Você" : currentThread?.provider_name || "Médico",
        senderType: message.sender_type,
        content: message.content || "",
        timestamp: parseISO(message.created_at),
        read: message.status === "read",
        urgent: currentThread?.is_urgent,
        topic: currentThread?.topic,
        attachments: message.attachments?.map((att: any, idx: number) => ({
          id: `${message.id}-${idx}`,
          name: att.name,
          type: att.type === "pdf" ? "pdf" : att.type === "image" ? "image" : "document",
          url: att.url,
          size: att.size || 0,
        })),
        medicalContext: message.medical_context ? {
          type: message.medical_context.type as any,
          referenceId: message.medical_context.reference_id,
        } : undefined,
      };
      
      setCurrentMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, mappedMessage];
      });
      
      // Update thread in list
      setThreads(prev => prev.map(t => {
        if (t.id === message.thread_id) {
          return {
            ...t,
            last_message_at: message.created_at,
            last_message: message.content?.substring(0, 100),
            unread_count: message.sender_type === "patient" ? t.unread_count : t.unread_count + 1,
          };
        }
        return t;
      }));
      
      // Update stats
      if (message.sender_type !== "patient") {
        setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
      }
    } else {
      // Message for a different thread - update thread list
      setThreads(prev => prev.map(t => {
        if (t.id === message.thread_id) {
          return {
            ...t,
            last_message_at: message.created_at,
            last_message: message.content?.substring(0, 100),
            unread_count: message.sender_type === "patient" ? t.unread_count : t.unread_count + 1,
          };
        }
        return t;
      }));
      
      // Update stats
      if (message.sender_type !== "patient") {
        setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
      }
    }
  }, [selectedThreadId, currentThread]);

  const handleThreadUpdate = useCallback((update: any) => {
    // Update thread in list
    setThreads(prev => prev.map(t => {
      if (t.id === update.thread_id) {
        return {
          ...t,
          ...update.thread,
        };
      }
      return t;
    }));
    
    // If current thread is updated, refresh it
    if (selectedThreadId === update.thread_id && currentThread) {
      setRefreshKey(prev => prev + 1);
    }
  }, [selectedThreadId, currentThread]);

  const handleMessageRead = useCallback((threadId: number, messageId: number) => {
    // Update message read status
    if (selectedThreadId === threadId) {
      setCurrentMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return { ...m, read: true };
        }
        return m;
      }));
    }
  }, [selectedThreadId]);

  // Set up real-time messaging
  const { connected, subscribeToThread, unsubscribeFromThread } = useRealtimeMessages(
    handleNewMessage,
    handleThreadUpdate,
    handleMessageRead
  );

  // Subscribe to thread when selected
  useEffect(() => {
    if (selectedThreadId && connected) {
      subscribeToThread(selectedThreadId);
      return () => {
        unsubscribeFromThread(selectedThreadId);
      };
    }
  }, [selectedThreadId, connected, subscribeToThread, unsubscribeFromThread]);

  // Load threads on mount and when refresh key changes
  useEffect(() => {
    loadThreads();
    loadDoctors();
    loadStats();
  }, [refreshKey]);

  // Load thread details when selected
  useEffect(() => {
    if (selectedThreadId) {
      loadThread(selectedThreadId);
    }
  }, [selectedThreadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const [activeData, archivedData] = await Promise.all([
        messagesApi.listThreads(false).catch(() => []),
        messagesApi.listThreads(true).catch(() => []),
      ]);
      setThreads(activeData);
      setArchivedThreads(archivedData);
      if (activeData.length > 0 && !selectedThreadId) {
        setSelectedThreadId(activeData[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load threads:", error);
      toast.error("Erro ao carregar conversas", {
        description: error?.message || error?.detail || "Não foi possível carregar suas conversas",
      });
      setThreads([]);
      setArchivedThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await api.get<any[]>(`/api/v1/users/doctors`);
      setDoctors(data);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      // Don't show error toast, just log it
    }
  };

  const loadStats = async () => {
    try {
      const activeThreads = await messagesApi.listThreads(false).catch(() => []);
      const total = activeThreads.length;
      const unread = activeThreads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
      const urgent = activeThreads.filter(t => t.is_urgent).length;
      setStats({ total, unread, urgent });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadThread = async (threadId: number) => {
    try {
      const thread = await messagesApi.getThread(threadId);
      setCurrentThread(thread);
      
      // Map API messages to UI format
      const mappedMessages: Message[] = (thread.messages || []).map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_type === "patient" ? "Você" : thread.provider_name,
        senderType: msg.sender_type,
        content: msg.content || "",
        timestamp: parseISO(msg.created_at),
        read: msg.status === "read",
        urgent: thread.is_urgent,
        topic: thread.topic,
        attachments: msg.attachments?.map((att, idx) => ({
          id: `${msg.id}-${idx}`,
          name: att.name,
          type: att.type === "pdf" ? "pdf" : att.type === "image" ? "image" : "document",
          url: att.url,
          size: att.size || 0,
        })),
        medicalContext: msg.medical_context ? {
          type: msg.medical_context.type as any,
          referenceId: msg.medical_context.reference_id,
        } : undefined,
      }));
      
      setCurrentMessages(mappedMessages);
      
      // Update thread in list
      setThreads(prev => prev.map(t => t.id === threadId ? thread : t));
    } catch (error: any) {
      console.error("Failed to load thread:", error);
      toast.error("Erro ao carregar conversa", {
        description: error?.message || "Não foi possível carregar a conversa",
      });
      setCurrentThread(null);
      setCurrentMessages([]);
    }
  };

  const filteredConversations = (showArchived ? archivedThreads : threads).filter((conv) =>
    conv.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateThread = async () => {
    if (!selectedDoctorId || !newThreadTopic.trim()) {
      toast.error("Por favor, selecione um médico e digite um assunto");
      return;
    }

    try {
      setCreatingThread(true);
      const newThread = await messagesApi.createThread({
        provider_id: selectedDoctorId,
        topic: newThreadTopic.trim(),
        is_urgent: newThreadUrgent,
      });
      
      setShowCreateThreadDialog(false);
      setSelectedDoctorId(null);
      setNewThreadTopic("");
      setNewThreadUrgent(false);
      setSelectedThreadId(newThread.id);
      setRefreshKey(prev => prev + 1);
      toast.success("Conversa criada com sucesso!");
    } catch (error: any) {
      console.error("Failed to create thread:", error);
      toast.error("Erro ao criar conversa", {
        description: error?.message || error?.detail || "Não foi possível criar a conversa",
      });
    } finally {
      setCreatingThread(false);
    }
  };

  const handleArchiveThread = async (threadId: number) => {
    try {
      await messagesApi.deleteThread(threadId);
      setShowArchiveDialog(false);
      setThreadToArchive(null);
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
        setCurrentThread(null);
        setCurrentMessages([]);
      }
      setRefreshKey(prev => prev + 1);
      toast.success("Conversa arquivada com sucesso!");
    } catch (error: any) {
      console.error("Failed to archive thread:", error);
      toast.error("Erro ao arquivar conversa", {
        description: error?.message || error?.detail || "Não foi possível arquivar a conversa",
      });
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && uploadedFiles.length === 0) || !selectedThreadId || sending) {
      if (!messageInput.trim() && uploadedFiles.length === 0) {
        toast.error("Por favor, digite uma mensagem ou anexe um arquivo");
      }
      return;
    }
    
    try {
      setSending(true);
      
      // Upload files first if needed
      let attachments = undefined;
      if (uploadedFiles.length > 0 && user) {
        try {
          const uploaded = await uploadFiles(uploadedFiles, user.id);
          attachments = uploaded.map(u => ({
            name: u.name,
            type: u.type,
            url: u.url,
            size: u.size,
          }));
        } catch (uploadError: any) {
          console.error("Failed to upload files:", uploadError);
          toast.error("Erro ao fazer upload dos arquivos", {
            description: uploadError.message || "Não foi possível fazer upload dos arquivos",
          });
          setSending(false);
          return;
        }
      }
      
      await messagesApi.sendMessage(selectedThreadId, {
        content: messageInput.trim() || "", // Allow empty content if attachments exist
        attachments,
      });
      
      setMessageInput("");
      setUploadedFiles([]);
      
      // Reload thread to get updated messages
      await loadThread(selectedThreadId);
      setRefreshKey(prev => prev + 1); // Refresh thread list and stats
      
      toast.success("Mensagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error("Erro ao enviar mensagem", {
        description: error?.message || error?.detail || "Não foi possível enviar a mensagem",
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Ontem";
    } else {
      return format(date, "dd/MM/yyyy");
    }
  };

  const getMessageBubbleStyle = (message: Message) => {
    if (message.urgent) {
      return "bg-yellow-100 border-yellow-300 border-2";
    }
    if (message.senderType === "system") {
      return "bg-gray-50 border border-gray-200";
    }
    if (message.senderType === "patient") {
      return "bg-blue-100 text-blue-900";
    }
    return "bg-gray-100 text-gray-900";
  };

  const getTopicIcon = (topic?: string) => {
    switch (topic) {
      case "Prescription Renewal":
        return <Pill className="h-4 w-4" />;
      case "Test Results":
        return <TestTube className="h-4 w-4" />;
      case "Appointment":
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PatientHeader showSearch notificationCount={3} />
      <PatientMobileNav />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 overflow-y-auto patient-content-scroll">
          {/* Conversation List Sidebar */}
          <div className="w-full lg:w-80 border-r border-gray-200 bg-white flex flex-col h-full">
            {/* Header with Stats and New Thread Button */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Mensagens</h2>
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      connected ? "bg-green-500" : "bg-gray-400"
                    )} title={connected ? "Conectado em tempo real" : "Desconectado"} />
                    <span className="text-xs text-gray-500">
                      {connected ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    title="Atualizar"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateThreadDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova
                  </Button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500">Não lidas</div>
                  <div className="text-lg font-bold text-blue-600">{stats.unread}</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500">Urgentes</div>
                  <div className="text-lg font-bold text-yellow-600">{stats.urgent}</div>
                </div>
              </div>

              {/* Tabs for Active/Archived */}
              <div className="flex gap-2">
                <Button
                  variant={!showArchived ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowArchived(false);
                    setSelectedThreadId(null);
                  }}
                >
                  Ativas
                </Button>
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowArchived(true);
                    setSelectedThreadId(null);
                  }}
                >
                  Arquivadas
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="h-5 w-5 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Carregando conversas...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">
                    {searchQuery ? "Nenhuma conversa encontrada" : showArchived ? "Nenhuma conversa arquivada" : "Nenhuma conversa ainda"}
                  </p>
                  {!searchQuery && !showArchived && (
                    <>
                      <p className="text-xs text-gray-400 mb-4">
                        Suas conversas com os provedores aparecerão aqui
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowCreateThreadDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Conversa
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedThreadId(conversation.id)}
                    className={cn(
                      "p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50/50 transition-colors",
                      selectedThreadId === conversation.id && "bg-blue-50 border-l-4 border-l-blue-500"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {conversation.provider_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.provider_name}
                          </h3>
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatMessageTime(parseISO(conversation.last_message_at))}
                            </span>
                          )}
                          {!conversation.last_message_at && conversation.created_at && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatMessageTime(parseISO(conversation.created_at))}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {conversation.topic && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {getTopicIcon(conversation.topic)}
                              <span>{conversation.topic}</span>
                            </div>
                          )}
                          {conversation.is_urgent && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0">
                              <Zap className="h-3 w-3 mr-1" />
                              Urgente
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate line-clamp-1">
                          {conversation.last_message ? (
                            conversation.last_message.length > 50 
                              ? conversation.last_message.substring(0, 50) + "..." 
                              : conversation.last_message
                          ) : "Nenhuma mensagem"}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conversation.unread_count} nova{conversation.unread_count > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col bg-white h-full">
            {currentThread ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {currentThread.provider_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {currentThread.provider_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {currentThread.provider_specialty || "Provedor"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentThread.topic && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getTopicIcon(currentThread.topic)}
                          {currentThread.topic}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setThreadToArchive(currentThread.id);
                          setShowArchiveDialog(true);
                        }}
                        title="Arquivar conversa"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
                  {currentMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium mb-2">Nenhuma mensagem ainda</p>
                      <p className="text-sm text-gray-400">Envie uma mensagem para começar a conversa</p>
                    </div>
                  ) : (
                    currentMessages.map((message, index) => {
                      const isPatient = message.senderType === "patient";
                      const isSystem = message.senderType === "system";
                      const showAvatar = index === 0 || currentMessages[index - 1].senderId !== message.senderId;
                      const showTimestamp =
                        index === 0 ||
                        Math.abs(
                          message.timestamp.getTime() -
                            currentMessages[index - 1].timestamp.getTime()
                        ) >
                          5 * 60 * 1000; // 5 minutes

                    return (
                      <div key={message.id}>
                        {showTimestamp && (
                          <div className="text-center mb-4">
                            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "flex gap-2",
                            isPatient && "flex-row-reverse",
                            isSystem && "justify-center"
                          )}
                        >
                          {!isSystem && showAvatar && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-[#1B9AAA] text-white text-xs">
                                {message.senderName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "flex flex-col max-w-[70%] lg:max-w-[60%]",
                              isPatient && "items-end",
                              isSystem && "items-center max-w-[90%]"
                            )}
                          >
                            {!isSystem && !isPatient && (
                              <span className="text-xs text-gray-500 mb-1 px-2">
                                {message.senderName}
                              </span>
                            )}
                            <div
                              className={cn(
                                "rounded-lg p-3 space-y-2",
                                getMessageBubbleStyle(message),
                                isSystem && "w-full"
                              )}
                            >
                              {message.urgent && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-300">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-xs font-semibold text-yellow-800">
                                    MENSAGEM URGENTE
                                  </span>
                                </div>
                              )}
                              {isSystem && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs font-semibold text-gray-700">
                                    {message.senderName}
                                  </span>
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                              {/* Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="space-y-2 mt-2">
                                  {message.attachments.map((attachment) => (
                                    <Card
                                      key={attachment.id}
                                      className="bg-white border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
                                      onClick={() => setPreviewAttachment(attachment)}
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className="relative">
                                            {attachment.type === "image" ? (
                                              <ImageIcon className="h-8 w-8 text-blue-600" />
                                            ) : attachment.type === "pdf" ? (
                                              <FileText className="h-8 w-8 text-red-600" />
                                            ) : (
                                              <FileText className="h-8 w-8 text-blue-600" />
                                            )}
                                            {attachment.type === "pdf" && (
                                              <div className="absolute -top-1 -right-1 bg-red-100 rounded-full p-0.5">
                                                <Shield className="h-3 w-3 text-red-600" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {attachment.name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <p className="text-xs text-gray-500">
                                                {(attachment.size / 1024).toFixed(1)} KB
                                              </p>
                                              {message.medicalContext?.type === "test_result" && (
                                                <Badge className="bg-green-100 text-green-700 text-xs">
                                                  Documento Médico
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle download
                                              }}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle download
                                              }}
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                        {attachment.thumbnail && attachment.type === "image" && (
                                          <div className="mt-2 rounded overflow-hidden border border-gray-200">
                                            <img
                                              src={attachment.thumbnail}
                                              alt={attachment.name}
                                              className="w-full h-32 object-cover"
                                            />
                                          </div>
                                        )}
                                        {attachment.type === "pdf" && message.medicalContext && (
                                          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                            <div className="flex items-center gap-2">
                                              <FileCheck className="h-4 w-4 text-blue-600" />
                                              <p className="text-xs text-blue-800">
                                                Documento médico verificado e seguro
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}

                              {/* Medical Context Badge & Actions */}
                              {message.medicalContext && (
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex items-center gap-1 w-fit"
                                  >
                                    {message.medicalContext.type === "prescription" && (
                                      <Pill className="h-3 w-3" />
                                    )}
                                    {message.medicalContext.type === "test_result" && (
                                      <TestTube className="h-3 w-3" />
                                    )}
                                    {message.medicalContext.type === "appointment" && (
                                      <Calendar className="h-3 w-3" />
                                    )}
                                    {message.medicalContext.type === "question" && (
                                      <MessageCircle className="h-3 w-3" />
                                    )}
                                    {message.medicalContext.type === "prescription" &&
                                      "Prescrição"}
                                    {message.medicalContext.type === "test_result" &&
                                      "Resultado de Exame"}
                                    {message.medicalContext.type === "appointment" && "Consulta"}
                                    {message.medicalContext.type === "question" && "Pergunta"}
                                  </Badge>
                                  
                                  {/* Medical Workflow Actions */}
                                  <div className="flex flex-wrap gap-2">
                                    {message.medicalContext.type === "prescription" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => {
                                          // Handle prescription renewal
                                        }}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Renovar Receita
                                      </Button>
                                    )}
                                    {message.medicalContext.type === "test_result" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => {
                                          // Navigate to test results
                                        }}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Ver Detalhes
                                      </Button>
                                    )}
                                    {message.medicalContext.type === "appointment" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => {
                                          // Navigate to appointments
                                        }}
                                      >
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Ver Consulta
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {!isSystem && (
                              <div className="flex items-center gap-1 mt-1 px-2">
                                {isPatient ? (
                                  message.read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-600" />
                                  ) : (
                                    <Check className="h-3 w-3 text-gray-400" />
                                  )
                                ) : (
                                  <Clock className="h-3 w-3 text-gray-400" />
                                )}
                                <span className="text-xs text-gray-400">
                                  {format(message.timestamp, "HH:mm")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  {/* Quick Responses */}
                  {showQuickResponses && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {quickResponses.map((response, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMessageInput(response);
                            setShowQuickResponses(false);
                          }}
                          className="text-xs"
                        >
                          {response}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* File Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-shrink-0"
                        >
                          <Paperclip className="h-5 w-5 text-gray-600" />
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                          aria-label="Upload file attachment"
                        />
                        <Textarea
                          placeholder="Digite sua mensagem..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="resize-none min-h-[60px] max-h-[120px]"
                          rows={2}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowQuickResponses(!showQuickResponses)}
                          className="flex-shrink-0"
                          title="Respostas rápidas"
                        >
                          <MessageCircle className="h-5 w-5 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                      disabled={(!messageInput.trim() && uploadedFiles.length === 0) || sending}
                    >
                      {sending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma conversa selecionada
                  </h3>
                  <p className="text-gray-500">
                    Selecione uma conversa da lista para começar
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Thread Dialog */}
      <Dialog open={showCreateThreadDialog} onOpenChange={setShowCreateThreadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Inicie uma nova conversa com um médico ou profissional de saúde
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selecionar Médico/Profissional
              </label>
              <Select
                value={selectedDoctorId?.toString() || ""}
                onValueChange={(value) => setSelectedDoctorId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um médico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      {doctor.first_name} {doctor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Assunto
              </label>
              <Input
                placeholder="Ex: Dúvida sobre prescrição, Resultado de exame, etc."
                value={newThreadTopic}
                onChange={(e) => setNewThreadTopic(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgent"
                checked={newThreadUrgent}
                onChange={(e) => setNewThreadUrgent(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="urgent" className="text-sm text-gray-700">
                Marcar como urgente
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateThreadDialog(false);
                  setSelectedDoctorId(null);
                  setNewThreadTopic("");
                  setNewThreadUrgent(false);
                }}
                disabled={creatingThread}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateThread}
                disabled={!selectedDoctorId || !newThreadTopic.trim() || creatingThread}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creatingThread ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Conversa"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar esta conversa? Você poderá desarquivá-la depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowArchiveDialog(false);
              setThreadToArchive(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => threadToArchive && handleArchiveThread(threadToArchive)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attachment Preview Dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewAttachment?.name}
            </DialogTitle>
            <DialogDescription>
              Documento médico seguro e verificado
            </DialogDescription>
          </DialogHeader>
          {previewAttachment && (
            <div className="space-y-4">
              {previewAttachment.type === "image" && previewAttachment.thumbnail && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={previewAttachment.thumbnail}
                    alt={previewAttachment.name}
                    className="w-full h-auto"
                  />
                </div>
              )}
              {previewAttachment.type === "pdf" && (
                <div className="border rounded-lg p-8 bg-gray-50 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Visualização de PDF disponível em breve
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>Documento seguro e verificado</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Tamanho: {(previewAttachment.size / 1024).toFixed(1)} KB
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

