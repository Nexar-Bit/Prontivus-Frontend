"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePatientBadges } from "@/hooks/usePatientBadges";
import {
  Home,
  Calendar,
  Folder,
  Pill,
  TestTube,
  MessageCircle,
  CreditCard,
  Settings,
  FileText,
  Heart,
  Stethoscope,
  LogOut,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  section?: string;
}

interface PatientSidebarProps {
  className?: string;
  items?: NavigationItem[];
}

// Base navigation items without badges (badges will be added dynamically)
const baseNavigationItems: NavigationItem[] = [
  { label: "Início", icon: Home, href: "/patient/dashboard", section: "main" },
  { label: "Agendamentos", icon: Calendar, href: "/patient/appointments", section: "main" },
  { label: "Prontuário Médico", icon: Folder, href: "/patient/medical-records", section: "main" },
  { label: "Prescrições", icon: Pill, href: "/patient/prescriptions", section: "health" },
  { label: "Resultados de Exames", icon: TestTube, href: "/patient/test-results", section: "health" },
  { label: "Resumo de Saúde", icon: Heart, href: "/patient/health", section: "health" },
  { label: "Mensagens", icon: MessageCircle, href: "/patient/messages", section: "communication" },
  { label: "Anotações Clínicas", icon: FileText, href: "/patient/notes", section: "health" },
  { label: "Faturamento e Pagamentos", icon: CreditCard, href: "/patient/billing", section: "services" },
  { label: "Meus Médicos", icon: Stethoscope, href: "/patient/doctors", section: "services" },
  { label: "Configurações", icon: Settings, href: "/patient/settings", section: "settings" },
];

const sectionColors = {
  main: {
    hover: "hover:bg-blue-50/50 hover:text-blue-600",
    active: "bg-blue-600 text-white",
    icon: "text-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  health: {
    hover: "hover:bg-teal-50/50 hover:text-teal-600",
    active: "bg-teal-600 text-white",
    icon: "text-teal-500",
    badge: "bg-teal-100 text-teal-700",
  },
  communication: {
    hover: "hover:bg-green-50/50 hover:text-green-600",
    active: "bg-green-600 text-white",
    icon: "text-green-500",
    badge: "bg-green-100 text-green-700",
  },
  services: {
    hover: "hover:bg-purple-50/50 hover:text-purple-600",
    active: "bg-purple-600 text-white",
    icon: "text-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
  settings: {
    hover: "hover:bg-gray-50 hover:text-gray-700",
    active: "bg-gray-700 text-white",
    icon: "text-gray-500",
    badge: "bg-gray-100 text-gray-700",
  },
};

export function PatientSidebar({ className, items }: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: authLogout } = useAuth();
  const { badges } = usePatientBadges();

  // Merge base items with dynamic badges
  const navigationItems: NavigationItem[] = items || baseNavigationItems.map(item => {
    if (item.href === "/patient/appointments") {
      return { ...item, badge: badges.appointments > 0 ? badges.appointments : undefined };
    }
    if (item.href === "/patient/messages") {
      return { ...item, badge: badges.messages > 0 ? badges.messages : undefined };
    }
    return item;
  });

  const handleLogout = async () => {
    try {
      // Use the logout function from AuthContext which handles everything
      await authLogout();
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if API call fails
      router.push("/login");
    }
  };

  // Group items by section
  const groupedItems = navigationItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, NavigationItem[]>
  );

  const sectionLabels: Record<string, string> = {
    main: "Principal",
    health: "Saúde",
    communication: "Comunicação",
    services: "Serviços",
    settings: "Configurações",
  };

  const getSectionConfig = (section: string) => {
    return sectionColors[section as keyof typeof sectionColors] || sectionColors.main;
  };

  return (
    <aside
      className={cn(
        "w-64 bg-gradient-to-b from-white via-blue-50/30 to-white border-r border-blue-100/50 min-h-screen sticky top-0",
        "flex flex-col shadow-sm",
        className
      )}
    >
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([section, sectionItems]) => {
            const sectionConfig = getSectionConfig(section);
            return (
              <div key={section} className="space-y-1.5">
                {section !== "main" && (
                  <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <div className={cn(
                      "h-0.5 w-4 rounded-full",
                      section === "health" && "bg-teal-500",
                      section === "communication" && "bg-green-500",
                      section === "services" && "bg-purple-500",
                      section === "settings" && "bg-gray-500",
                      section === "main" && "bg-blue-500"
                    )} />
                    {sectionLabels[section] || section}
                  </h3>
                )}
                <ul className="space-y-1">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/patient/dashboard" && pathname.startsWith(item.href));
                    const itemSectionConfig = getSectionConfig(item.section || "main");

                    return (
                      <li key={`${item.section}-${item.label}-${item.href}`}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                            "text-sm font-medium",
                            "group relative",
                            isActive
                              ? cn(
                                  itemSectionConfig.active,
                                  "shadow-md shadow-blue-500/10"
                                )
                              : cn(
                                  "text-gray-700",
                                  itemSectionConfig.hover
                                )
                          )}
                        >
                          {/* Left accent bar for active state */}
                          {isActive && (
                            <div className="absolute left-0 top-1 bottom-1 w-1 bg-white rounded-r-full shadow-sm" />
                          )}
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200",
                              isActive
                                ? "bg-white/20"
                                : "bg-gray-50 group-hover:bg-white"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 flex-shrink-0 transition-all duration-200",
                                isActive
                                  ? "text-white"
                                  : cn("text-gray-500 group-hover:text-current", itemSectionConfig.icon)
                              )}
                            />
                          </div>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge
                              className={cn(
                                "ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-semibold",
                                isActive
                                  ? "bg-white/90 text-blue-600 shadow-sm"
                                  : itemSectionConfig.badge
                              )}
                            >
                              {item.badge > 99 ? "99+" : item.badge}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-blue-100/50 p-4 space-y-2 bg-white/80 backdrop-blur-sm">
        <Link
          href="/patient/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50/50 hover:text-blue-600 transition-all duration-200 group"
        >
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </div>
          <span>Precisa de Ajuda?</span>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
        >
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <LogOut className="h-4 w-4 text-red-500" />
          </div>
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}

