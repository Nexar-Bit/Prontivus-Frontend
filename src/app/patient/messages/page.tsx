"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { PatientHeader, PatientSidebar, PatientMobileNav } from "@/components/patient/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { messagesApi, MessageThread, Message as ApiMessage } from "@/lib/messages-api";
import { useAuth } from "@/contexts/AuthContext";

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

  // Load threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

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
      const data = await messagesApi.listThreads(false);
      setThreads(data);
      if (data.length > 0 && !selectedThreadId) {
        setSelectedThreadId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (threadId: number) => {
    try {
      const thread = await messagesApi.getThread(threadId);
      setCurrentThread(thread);
      
      // Map API messages to UI format
      const mappedMessages: Message[] = thread.messages.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_type === "patient" ? "Você" : thread.provider_name,
        senderType: msg.sender_type,
        content: msg.content,
        timestamp: parseISO(msg.created_at),
        read: msg.status === "read",
        urgent: thread.is_urgent,
        topic: thread.topic,
        attachments: msg.attachments?.map((att, idx) => ({
          id: String(idx),
          name: att.name,
          type: att.type === "pdf" ? "pdf" : att.type === "image" ? "image" : "document",
          url: att.url,
          size: att.size,
        })),
        medicalContext: msg.medical_context ? {
          type: msg.medical_context.type as any,
          referenceId: msg.medical_context.reference_id,
        } : undefined,
      }));
      
      setCurrentMessages(mappedMessages);
      
      // Update thread in list
      setThreads(prev => prev.map(t => t.id === threadId ? thread : t));
    } catch (error) {
      console.error("Failed to load thread:", error);
    }
  };

  const filteredConversations = threads.filter((conv) =>
    conv.provider_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && uploadedFiles.length === 0) || !selectedThreadId || sending) return;
    
    try {
      setSending(true);
      
      // TODO: Upload files first if needed
      const attachments = uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "document",
        url: "#", // TODO: Upload and get URL
        size: file.size,
      })) : undefined;
      
      await messagesApi.sendMessage(selectedThreadId, {
        content: messageInput.trim(),
        attachments,
      });
      
      setMessageInput("");
      setUploadedFiles([]);
      
      // Reload thread to get updated messages
      await loadThread(selectedThreadId);
      await loadThreads(); // Refresh thread list
    } catch (error) {
      console.error("Failed to send message:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50/30">
      <PatientHeader showSearch notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 flex h-[calc(100vh-80px)]">
          {/* Conversation List Sidebar */}
          <div className="w-full lg:w-80 border-r border-gray-200 bg-white flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
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
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Carregando...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Nenhuma conversa encontrada</div>
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
                          {conversation.last_message || "Nenhuma mensagem"}
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
          <div className="flex-1 flex flex-col bg-white">
            {currentThread ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
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
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {currentMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">Nenhuma mensagem ainda</div>
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
                <div className="p-4 border-t border-gray-200 bg-white">
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
                      <Send className="h-4 w-4" />
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

