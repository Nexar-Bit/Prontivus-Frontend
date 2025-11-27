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
// Modern icons from lucide-react
import {
  LayoutDashboard,
  CalendarCheck,
  PillBottle,
  TestTube,
  Activity,
  NotebookPen,
  MessagesSquare,
  CreditCard,
  UserCircle,
  LogOut,
  HelpCircle,
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
// Simplified menu structure matching the requirements
const baseNavigationItems: NavigationItem[] = [
  { label: "Início", icon: LayoutDashboard, href: "/patient/dashboard", section: "main" },
  { label: "Agendamentos", icon: CalendarCheck, href: "/patient/appointments", section: "main" },
  { label: "Histórico de Medicações", icon: PillBottle, href: "/patient/prescriptions", section: "health" },
  { label: "Resultados Exames", icon: TestTube, href: "/patient/test-results", section: "health" },
  { label: "Resumo de Saúde", icon: Activity, href: "/patient/health", section: "health" },
  { label: "Notas da Clínica", icon: NotebookPen, href: "/patient/notes", section: "health" },
  { label: "Mensagens", icon: MessagesSquare, href: "/patient/messages", section: "communication" },
  { label: "Pagamentos", icon: CreditCard, href: "/patient/billing", section: "services" },
  { label: "Perfil", icon: UserCircle, href: "/patient/profile", section: "settings" },
];

const sectionColors = {
  main: {
    hover: "hover:bg-blue-500/40 hover:text-white",
    active: "bg-blue-500 text-white",
    icon: "text-blue-200",
    badge: "bg-blue-400/30 text-white",
  },
  health: {
    hover: "hover:bg-blue-500/40 hover:text-white",
    active: "bg-blue-500 text-white",
    icon: "text-blue-200",
    badge: "bg-blue-400/30 text-white",
  },
  communication: {
    hover: "hover:bg-blue-500/40 hover:text-white",
    active: "bg-blue-500 text-white",
    icon: "text-blue-200",
    badge: "bg-blue-400/30 text-white",
  },
  services: {
    hover: "hover:bg-blue-500/40 hover:text-white",
    active: "bg-blue-500 text-white",
    icon: "text-blue-200",
    badge: "bg-blue-400/30 text-white",
  },
  settings: {
    hover: "hover:bg-blue-500/40 hover:text-white",
    active: "bg-blue-500 text-white",
    icon: "text-blue-200",
    badge: "bg-blue-400/30 text-white",
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
        "w-72 bg-gradient-to-b from-blue-600 via-blue-600 to-blue-700 border-r border-blue-800/50 h-full",
        "flex flex-col shadow-lg",
        className
      )}
    >
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar py-6 px-5">
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([section, sectionItems]) => {
            const sectionConfig = getSectionConfig(section);
            return (
              <div key={section} className="space-y-1.5">
                {section !== "main" && (
                  <h3 className="px-5 py-2.5 text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2.5">
                    <div className={cn(
                      "h-1 w-6 rounded-full bg-gradient-to-r from-blue-300 to-blue-400 shadow-sm",
                      section === "health" && "from-blue-300 to-blue-400",
                      section === "communication" && "from-blue-300 to-blue-400",
                      section === "services" && "from-blue-300 to-blue-400",
                      section === "settings" && "from-blue-300 to-blue-400",
                      section === "main" && "from-blue-300 to-blue-400"
                    )} />
                    <span>
                      {sectionLabels[section] || section}
                    </span>
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
                            "flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300",
                            "text-sm font-medium",
                            "group relative",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            isActive
                              ? cn(
                                  itemSectionConfig.active,
                                  "shadow-lg shadow-blue-400/30 ring-1 ring-blue-300/30"
                                )
                              : cn(
                                  "text-blue-100",
                                  itemSectionConfig.hover,
                                  "hover:shadow-md"
                                )
                          )}
                        >
                          {/* Left accent bar for active state */}
                          {isActive && (
                            <div className="absolute left-0 top-1 bottom-1 w-1.5 bg-white rounded-r-full shadow-lg shadow-blue-300/40" />
                          )}
                          <div
                            className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 relative",
                              "group-hover:scale-110",
                              isActive
                                ? "bg-gradient-to-br from-white/30 to-white/10 shadow-lg shadow-blue-400/30 ring-2 ring-white/30"
                                : "bg-gradient-to-br from-blue-500/30 to-blue-500/20 group-hover:from-blue-500/50 group-hover:to-blue-500/40 shadow-sm group-hover:shadow-md"
                            )}
                          >
                            {/* Subtle glow effect for active state */}
                            {isActive && (
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                            )}
                            <Icon
                              className={cn(
                                "h-5 w-5 flex-shrink-0 transition-all duration-300 relative z-10",
                                isActive
                                  ? "text-white drop-shadow-sm"
                                  : "text-blue-200 group-hover:text-white group-hover:scale-110"
                              )}
                            />
                          </div>
                          <span className={cn("flex-1", isActive ? "text-white" : "text-blue-100")}>{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge
                              className={cn(
                                "ml-auto min-w-[22px] h-6 flex items-center justify-center px-2 text-xs font-bold rounded-full transition-all duration-300",
                                "shadow-sm group-hover:scale-110",
                                isActive
                                  ? "bg-white/95 text-blue-600 shadow-md ring-1 ring-blue-200/50"
                                  : cn(
                                      "bg-blue-400/40 text-white",
                                      "group-hover:shadow-md"
                                    )
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
      <div className="border-t border-blue-800/50 px-5 py-5 space-y-2 bg-blue-700/50 backdrop-blur-sm">
        <Link
          href="/patient/help"
          className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium text-blue-100 hover:bg-blue-500/40 hover:text-white transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/40 to-blue-500/30 flex items-center justify-center group-hover:from-blue-500/60 group-hover:to-blue-500/50 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110">
            <HelpCircle className="h-5 w-5 text-blue-100 group-hover:text-white transition-all duration-300" />
          </div>
          <span>Precisa de Ajuda?</span>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-5 py-3 h-auto text-sm font-medium text-blue-100 hover:bg-red-500/30 hover:text-white transition-all duration-300 rounded-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/30 to-red-500/20 flex items-center justify-center group-hover:from-red-500/50 group-hover:to-red-500/40 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110">
            <LogOut className="h-5 w-5 text-red-200 group-hover:text-white transition-all duration-300" />
          </div>
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}

