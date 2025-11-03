"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  HelpCircle,
  Phone,
  X,
  FileText,
  Calendar,
  TestTube,
  MessageCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PatientHeaderProps {
  className?: string;
  showSearch?: boolean;
  notificationCount?: number;
}

interface SearchResult {
  type: "record" | "appointment" | "test" | "message";
  title: string;
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PatientHeader({
  className,
  showSearch = true,
  notificationCount = 3,
}: PatientHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "P";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Mock search results - replace with actual API call
      const mockResults: SearchResult[] = [
        {
          type: "record",
          title: "Consulta - 15 de Janeiro",
          description: "Consulta de rotina com Dr. Maria Silva",
          date: "15/01/2024",
          icon: FileText,
        },
        {
          type: "appointment",
          title: "Consulta Agendada - 20 de Janeiro",
          description: "14:00 - Cardiologia",
          date: "20/01/2024",
          icon: Calendar,
        },
        {
          type: "test",
          title: "Hemograma Completo",
          description: "Resultados disponíveis",
          date: "12/01/2024",
          icon: TestTube,
        },
      ];
      setSearchResults(
        mockResults.filter(
          (result) =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description.toLowerCase().includes(query.toLowerCase())
        )
      );
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const handleEmergencyContact = () => {
    // Open emergency contact modal or dial number
    if (typeof window !== "undefined") {
      window.location.href = "tel:192";
    }
  };

  return (
    <header
      className={cn(
        "bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95",
        className
      )}
    >
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Patient Info & Greeting */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-12 w-12 border-2 border-[#0F4C75]/20 flex-shrink-0">
              <AvatarImage src={(user as any)?.avatar} alt={user?.username} />
              <AvatarFallback className="bg-[#0F4C75] text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg lg:text-xl font-bold text-[#0F4C75] truncate">
                {getGreeting()}, {user?.first_name || "Paciente"}! 👋
              </h1>
              <p className="text-sm text-gray-600 truncate">
                {user?.email || "Seu painel de saúde"}
              </p>
            </div>
          </div>

          {/* Center Section: Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar em registros médicos..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 h-10 border-2 border-gray-200 focus:border-[#0F4C75] rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Limpar busca"
                  title="Limpar busca"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {searchResults.map((result, index) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            // Navigate to result
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="h-10 w-10 rounded-lg bg-[#0F4C75]/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-[#0F4C75]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {result.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {result.date}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Search Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10"
                onClick={() => {
                  // Open mobile search
                }}
                aria-label="Buscar"
                title="Buscar"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10"
                  aria-label={`Notificações${notificationCount > 0 ? ` (${notificationCount} novas)` : ''}`}
                  title="Notificações"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {notificationCount > 0 && (
                    <Badge className="absolute top-0 right-0 h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-[10px] border-0">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-[#0F4C75]">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Mock notifications */}
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#1B9AAA]/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Nova mensagem do Dr. Silva
                        </p>
                        <p className="text-xs text-gray-600">Há 5 minutos</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#16C79A]/10 flex items-center justify-center flex-shrink-0">
                        <TestTube className="h-5 w-5 text-[#16C79A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Resultados de exames disponíveis
                        </p>
                        <p className="text-xs text-gray-600">Há 1 hora</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full border-[#1B9AAA] text-[#1B9AAA]"
                    onClick={() => router.push("/patient/notifications")}
                  >
                    Ver Todas as Notificações
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Emergency Help Button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={handleEmergencyContact}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="font-medium">Precisa de Ajuda?</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 text-red-600 hover:bg-red-50"
              onClick={handleEmergencyContact}
              aria-label="Emergency help"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

