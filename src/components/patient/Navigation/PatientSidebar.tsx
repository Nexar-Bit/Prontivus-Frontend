"use client";

import React from "react";
import Link from "next/link";
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
  User,
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
  { label: "Dashboard", icon: Home, href: "/patient/dashboard", section: "main" },
  { label: "Appointments", icon: Calendar, href: "/patient/appointments", section: "main" },
  { label: "Medical Records", icon: Folder, href: "/patient/medical-records", section: "main" },
  { label: "Prescriptions", icon: Pill, href: "/patient/prescriptions", section: "health" },
  { label: "Test Results", icon: TestTube, href: "/patient/test-results", section: "health" },
  { label: "Health Summary", icon: Heart, href: "/patient/health", section: "health" },
  { label: "Messages", icon: MessageCircle, href: "/patient/messages", section: "communication" },
  { label: "Clinical Notes", icon: FileText, href: "/patient/notes", section: "health" },
  { label: "Billing & Payments", icon: CreditCard, href: "/patient/billing", section: "services" },
  { label: "My Doctors", icon: Stethoscope, href: "/patient/doctors", section: "services" },
  { label: "Profile", icon: User, href: "/portal/profile", section: "settings" },
  { label: "Settings", icon: Settings, href: "/patient/settings", section: "settings" },
];

const sectionColors = {
  main: "hover:bg-[#0F4C75]/5 hover:text-[#0F4C75]",
  health: "hover:bg-[#16C79A]/5 hover:text-[#16C79A]",
  communication: "hover:bg-[#1B9AAA]/5 hover:text-[#1B9AAA]",
  services: "hover:bg-[#5D737E]/5 hover:text-[#5D737E]",
  settings: "hover:bg-gray-50 hover:text-gray-700",
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

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0",
        "flex flex-col",
        className
      )}
    >
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([section, sectionItems]) => (
            <div key={section} className="space-y-1">
              {section !== "main" && (
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {sectionLabels[section] || section}
                </h3>
              )}
              <ul className="space-y-1">
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/patient/dashboard" && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                          "text-sm font-medium",
                          "group relative",
                          isActive
                            ? "bg-[#0F4C75] text-white shadow-sm"
                            : cn(
                                "text-gray-700",
                                sectionColors[(item.section || "main") as keyof typeof sectionColors]
                              )
                        )}
                      >
                        {/* Left accent bar for active state */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                        )}
                        <Icon
                          className={cn(
                            "h-6 w-6 flex-shrink-0 transition-transform duration-200",
                            isActive ? "text-white" : "text-gray-600 group-hover:text-current",
                            "group-hover:scale-110"
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <Badge
                            className={cn(
                              "ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5",
                              isActive
                                ? "bg-white text-[#0F4C75]"
                                : "bg-[#1B9AAA] text-white"
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
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        <Link
          href="/patient/help"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0F4C75] transition-all duration-200 group"
        >
          <MessageCircle className="h-6 w-6 text-gray-400 group-hover:text-[#0F4C75] transition-colors" />
          <span>Precisa de Ajuda?</span>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 px-4 py-3 h-auto text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-6 w-6" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}

