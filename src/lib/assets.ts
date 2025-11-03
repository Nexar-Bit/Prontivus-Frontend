/**
 * Asset Management System
 * Centralized asset paths and utilities for Prontivus
 */

export const ASSETS = {
  // Logos
  logo: {
    full: "/assets/images/logo/prontivus-full.svg",
    icon: "/assets/images/logo/prontivus-icon.svg",
    horizontal: "/Logo/Prontivus Horizontal Transparents.png",
    vertical: "/Logo/Logotipo em Fundo Transparente.png",
  },

  // Icons
  icons: {
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    androidIcon: "/android-chrome-192x192.png",
  },

  // Patterns
  patterns: {
    dots: "/assets/svg/patterns/dots.svg",
    grid: "/assets/svg/patterns/grid.svg",
    waves: "/assets/svg/patterns/waves.svg",
    circuit: "/assets/svg/patterns/circuit.svg",
    cells: "/assets/svg/patterns/cells.svg",
  },

  // Placeholders
  placeholders: {
    patient: "/assets/images/placeholders/patient-avatar.svg",
    doctor: "/assets/images/placeholders/doctor-avatar.svg",
    document: "/assets/images/placeholders/document.svg",
  },

  // Document Backgrounds
  documents: {
    prescription: "/assets/images/documents/prescription-bg.svg",
    certificate: "/assets/images/documents/certificate-bg.svg",
    report: "/assets/images/documents/report-bg.svg",
  },
} as const;

/**
 * Get optimized image sizes for responsive design
 */
export function getImageSizes(breakpoints: {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  default: string;
}): string {
  const parts: string[] = [];

  if (breakpoints.sm) parts.push(`(max-width: 640px) ${breakpoints.sm}`);
  if (breakpoints.md) parts.push(`(max-width: 768px) ${breakpoints.md}`);
  if (breakpoints.lg) parts.push(`(max-width: 1024px) ${breakpoints.lg}`);
  if (breakpoints.xl) parts.push(`(max-width: 1280px) ${breakpoints.xl}`);
  parts.push(breakpoints.default);

  return parts.join(", ");
}

/**
 * Generate favicon paths
 */
export function getFaviconPaths() {
  return {
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    android192: "/android-chrome-192x192.png",
    android512: "/android-chrome-512x512.png",
    favicon16: "/favicon-16x16.png",
    favicon32: "/favicon-32x32.png",
    safariPinnedTab: "/safari-pinned-tab.svg",
  };
}

