"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePatientBadges } from "@/hooks/usePatientBadges";
import {
  Home,
  CalendarDays,
  FolderOpen,
  MessageCircle,
  Menu,
  X,
  Pill,
  FlaskConical,
  Wallet,
  Settings2,
  FileText,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { NavigationItem } from "./PatientSidebar";

interface PatientMobileNavProps {
  items?: NavigationItem[];
}

const baseMobileNavItems: NavigationItem[] = [
  { label: "Dashboard", icon: Home, href: "/patient/dashboard" },
  { label: "Appointments", icon: CalendarDays, href: "/patient/appointments" },
  { label: "Records", icon: FolderOpen, href: "/patient/medical-records" },
  { label: "Messages", icon: MessageCircle, href: "/patient/messages" },
];

const baseNavigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: Home, href: "/patient/dashboard", section: "main" },
  { label: "Appointments", icon: CalendarDays, href: "/patient/appointments", section: "main" },
  { label: "Medical Records", icon: FolderOpen, href: "/patient/medical-records", section: "main" },
  { label: "Prescriptions", icon: Pill, href: "/patient/prescriptions", section: "health" },
  { label: "Test Results", icon: FlaskConical, href: "/patient/test-results", section: "health" },
  { label: "Health Summary", icon: HeartPulse, href: "/patient/health", section: "health" },
  { label: "Messages", icon: MessageCircle, href: "/patient/messages", section: "communication" },
  { label: "Clinical Notes", icon: FileText, href: "/patient/notes", section: "health" },
  { label: "Billing & Payments", icon: Wallet, href: "/patient/billing", section: "services" },
  { label: "My Doctors", icon: Stethoscope, href: "/patient/doctors", section: "services" },
  { label: "Settings", icon: Settings2, href: "/patient/settings", section: "settings" },
];

export function PatientMobileNav({ items }: PatientMobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { badges } = usePatientBadges();

  // Merge items with dynamic badges
  const mobileNavItems = baseMobileNavItems.map(item => {
    if (item.href === "/patient/appointments") {
      return { ...item, badge: badges.appointments > 0 ? badges.appointments : undefined };
    }
    if (item.href === "/patient/messages") {
      return { ...item, badge: badges.messages > 0 ? badges.messages : undefined };
    }
    return item;
  });

  // Default items if not provided - merge with dynamic badges
  const allItems = items || baseNavigationItems.map(item => {
    if (item.href === "/patient/appointments") {
      return { ...item, badge: badges.appointments > 0 ? badges.appointments : undefined };
    }
    if (item.href === "/patient/messages") {
      return { ...item, badge: badges.messages > 0 ? badges.messages : undefined };
    }
    return item;
  });

  const sectionLabels: Record<string, string> = {
    main: "Principal",
    health: "Saúde",
    communication: "Comunicação",
    services: "Serviços",
    settings: "Configurações",
  };

  const groupedItems = allItems.reduce(
    (acc, item) => {
      const section = item.section || "main";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, NavigationItem[]>
  );

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
        <div className="grid grid-cols-4 h-[64px]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/patient/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={`mobile-${item.label}-${item.href}`}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-h-[44px] relative",
                  "transition-colors duration-200",
                  isActive ? "text-[#0F4C75]" : "text-gray-600"
                )}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-[#1B9AAA] text-[10px] text-white border-0">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F4C75] rounded-b-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hamburger Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-40 h-11 w-11 bg-white border border-gray-200 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b border-gray-200 px-6 py-4">
            <SheetTitle className="text-xl font-bold text-[#0F4C75]">Navegação</SheetTitle>
          </SheetHeader>
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
                        <li key={`${item.section}-${item.label}-${item.href}`}>
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                              "text-sm font-medium min-h-[44px]",
                              isActive
                                ? "bg-[#0F4C75] text-white"
                                : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                            )}
                            <Icon
                              className={cn(
                                "h-6 w-6 flex-shrink-0",
                                isActive ? "text-white" : "text-gray-600"
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
          <div className="border-t border-gray-200 p-4">
            <Link
              href="/patient/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 min-h-[44px]"
            >
              <MessageCircle className="h-6 w-6 text-gray-400" />
              <span>Precisa de Ajuda?</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

