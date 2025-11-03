"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProntivusLogo } from "@/components/assets";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface HeaderProps {
  className?: string;
}

export function LandingHeader({ className }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Track scroll position for header styling
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);

      // Update active section based on scroll position
      const sections = ["features", "patients", "providers", "pricing", "faq"];
      const scrollPosition = window.scrollY + 100;

      let foundSection = null;
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            foundSection = section;
            break;
          }
        }
      }

      // Set active section or null if at top
      if (window.scrollY < 100) {
        setActiveSection(null);
      } else {
        setActiveSection(foundSection);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle smooth scroll to section
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: "Home", href: "#", id: "home", isHome: true },
    { label: "Features", href: "#features", id: "features" },
    { label: "For Patients", href: "#patients", id: "patients" },
    { label: "For Providers", href: "#providers", id: "providers" },
    { label: "Pricing", href: "#pricing", id: "pricing" },
  ];

  const isLandingPage = pathname === "/";

  if (!isLandingPage) {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/98 backdrop-blur-md shadow-lg border-b border-gray-200/50"
          : "bg-white/95 backdrop-blur-sm border-b border-gray-200/30",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center space-x-3 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="transition-transform duration-200 group-hover:scale-105">
              <ProntivusLogo variant="full" size="md" includeMedicalSymbol />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-[#1B9AAA] tracking-wide">
                Cuidado Inteligente
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              // Only check active state after component has mounted on client
              // This ensures consistent rendering between server and client
              const isActive = mounted
                ? (item.isHome && activeSection === null) ||
                  (!item.isHome && activeSection === item.id)
                : false;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (item.isHome) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      handleNavClick(e, item.id);
                    }
                  }}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:text-[#1B9AAA] hover:bg-[#1B9AAA]/5",
                    isActive
                      ? "text-[#1B9AAA] bg-[#1B9AAA]/10"
                      : "text-[#2D3748]"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1B9AAA] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className={cn(
                "text-[#0F4C75] hover:text-[#1B9AAA] hover:bg-[#1B9AAA]/5",
                "transition-all duration-200 font-medium"
              )}
            >
              Login
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className={cn(
                "bg-[#0F4C75] hover:bg-[#0F4C75]/90 text-white",
                "shadow-md hover:shadow-lg transition-all duration-200",
                "font-semibold px-6"
              )}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2 text-[#0F4C75] hover:bg-[#0F4C75]/5 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[320px] sm:w-[400px] bg-white border-l border-gray-200"
            >
              <SheetHeader className="pb-6 border-b border-gray-200">
                <SheetTitle className="flex items-center space-x-3">
                  <ProntivusLogo variant="full" size="sm" includeMedicalSymbol />
                  <div className="text-xs font-medium text-[#1B9AAA]">
                    Cuidado Inteligente
                  </div>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col mt-6 space-y-2">
                {navItems.map((item) => {
                  // Only check active state after component has mounted on client
                  // This ensures consistent rendering between server and client
                  const isActive = mounted
                    ? (item.isHome && activeSection === null) ||
                      (!item.isHome && activeSection === item.id)
                    : false;

                  return (
                    <SheetClose key={item.id} asChild>
                      <a
                        href={item.href}
                        onClick={(e) => {
                          if (item.isHome) {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          } else {
                            handleNavClick(e, item.id);
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "px-4 py-3 text-base font-medium rounded-lg transition-all duration-200",
                          "hover:bg-[#1B9AAA]/10 hover:text-[#1B9AAA]",
                          isActive
                            ? "text-[#1B9AAA] bg-[#1B9AAA]/10 font-semibold"
                            : "text-[#2D3748]"
                        )}
                      >
                        {item.label}
                      </a>
                    </SheetClose>
                  );
                })}

                <div className="pt-6 mt-6 border-t border-gray-200 space-y-3">
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-[#0F4C75] text-[#0F4C75] hover:bg-[#0F4C75]/5"
                      onClick={() => {
                        router.push("/login");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Login
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      className="w-full bg-[#0F4C75] hover:bg-[#0F4C75]/90 text-white font-semibold"
                      onClick={() => {
                        router.push("/login");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active section indicator line */}
      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F4C75] via-[#1B9AAA] to-[#0F4C75] opacity-20" />
      )}
    </header>
  );
}

