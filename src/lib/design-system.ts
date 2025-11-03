/**
 * Prontivus Design System - Utility Functions
 * Helper functions for consistent design token usage
 */

import { designTokens, type DesignTokens } from './design-tokens';
import { colors, colorTokens } from './colors';

/**
 * Get spacing value from design tokens
 */
export function spacing(scale: keyof DesignTokens['spacing']): string {
  return designTokens.spacing[scale];
}

/**
 * Get typography font size
 */
export function fontSize(
  scale: keyof DesignTokens['typography']['fontSize']
): string {
  return designTokens.typography.fontSize[scale][0];
}

/**
 * Get border radius
 */
export function borderRadius(
  scale: keyof DesignTokens['borderRadius']
): string {
  return designTokens.borderRadius[scale];
}

/**
 * Get shadow value
 */
export function shadow(
  scale: keyof DesignTokens['shadows']
): string {
  return designTokens.shadows[scale];
}

/**
 * Design system constants for direct use in components
 */
export const ds = {
  spacing: designTokens.spacing,
  typography: designTokens.typography,
  borderRadius: designTokens.borderRadius,
  shadows: designTokens.shadows,
  layout: designTokens.layout,
  transitions: designTokens.transitions,
  zIndex: designTokens.zIndex,
  colors: colorTokens,
} as const;

/**
 * CSS class helpers for common medical design patterns
 * Uses 8px base unit spacing system
 */
export const designClasses = {
  // Container patterns - 24px padding
  container: 'max-w-[1280px] mx-auto px-6', // 24px padding
  containerPadding: 'px-6 py-6', // 24px padding
  containerContent: 'px-6 py-6 space-y-4', // 24px padding, 16px gap
  
  // Card patterns - Medical cards with 8px radius, 24px padding
  cardBase: 'bg-card rounded-lg border border-border shadow-md transition-all duration-200 hover:shadow-lg',
  cardPadding: 'p-6', // 24px
  medicalCard: 'medical-card', // Uses CSS class from globals.css
  cardElevated: 'bg-card rounded-lg border border-border shadow-lg',
  
  // Form patterns - 16px field gaps, 24px section gaps
  formField: 'space-y-2', // 8px gap
  formSection: 'space-y-6', // 24px gap
  formLabel: 'text-sm font-semibold text-foreground',
  formInput: 'h-10 rounded-lg border-2 px-3 transition-all duration-200 focus:ring-2 focus:ring-primary-accent',
  formTextarea: 'rounded-lg border-2 px-3 py-2 transition-all duration-200 focus:ring-2 focus:ring-primary-accent min-h-[80px]',
  
  // Button patterns - Medical-grade buttons
  buttonBase: 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2',
  buttonPrimary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm active:shadow-none active:scale-[0.98]',
  buttonSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm active:shadow-none active:scale-[0.98]',
  buttonAccent: 'bg-primary-accent text-primary-accent-foreground hover:opacity-90 shadow-sm active:shadow-none active:scale-[0.98]',
  buttonOutline: 'border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground shadow-sm active:shadow-none active:scale-[0.98]',
  buttonGhost: 'bg-transparent hover:bg-muted text-foreground',
  
  // Typography patterns - Inter font family
  heading1: 'text-4xl font-bold tracking-tight font-sans',
  heading2: 'text-3xl font-semibold tracking-tight font-sans',
  heading3: 'text-2xl font-semibold tracking-tight font-sans',
  heading4: 'text-xl font-semibold font-sans',
  heading5: 'text-lg font-semibold font-sans',
  heading6: 'text-base font-semibold font-sans',
  body: 'text-base font-normal font-sans leading-relaxed',
  bodySmall: 'text-sm font-normal font-sans leading-relaxed',
  bodyLarge: 'text-lg font-normal font-sans leading-relaxed',
  caption: 'text-xs text-muted-foreground font-sans',
  code: 'font-mono text-sm bg-muted px-1.5 py-0.5 rounded',
  
  // Medical-specific patterns
  medicalBadge: 'medical-badge', // Uses CSS class from globals.css
  vitalSignsCard: 'bg-card rounded-lg border border-border p-4 shadow-sm',
  statusIndicator: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm',
  
  // Spacing utilities - 8px base unit
  sectionSpacing: 'space-y-4', // 16px gap
  sectionSpacingLarge: 'space-y-6', // 24px gap
  sectionPadding: 'p-6', // 24px
  cardSpacing: 'gap-4', // 16px gap
  cardSpacingLarge: 'gap-6', // 24px gap
} as const;

export default ds;

