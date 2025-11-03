/**
 * Prontivus Design System - Design Tokens
 * Medical-grade design system with 8px base unit spacing
 * WCAG 2.1 AA compliant for accessibility
 */

export const designTokens = {
  // Spacing scale (8px base unit)
  spacing: {
    0: '0',
    1: '0.5rem',   // 8px
    2: '1rem',     // 16px
    3: '1.5rem',   // 24px
    4: '2rem',     // 32px
    5: '2.5rem',   // 40px
    6: '3rem',     // 48px
    8: '4rem',     // 64px
    10: '5rem',    // 80px
    12: '6rem',    // 96px
    16: '8rem',    // 128px
    20: '10rem',   // 160px
    24: '12rem',   // 192px
  },
  
  // Typography - Inter for headings/body, JetBrains Mono for code
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0.01em' }],   // 14px
      base: ['1rem', { lineHeight: '1.625rem', letterSpacing: '0.01em' }],      // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],   // 18px
      xl: ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],     // 24px
      '3xl': ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.03em' }], // 36px
      '5xl': ['3rem', { lineHeight: '3.625rem', letterSpacing: '-0.03em' }],   // 48px
      '6xl': ['3.75rem', { lineHeight: '4.5rem', letterSpacing: '-0.04em' }],  // 60px
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },
  
  // Border radius - consistent 8px default
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    DEFAULT: '0.5rem', // 8px - consistent default
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',
  },
  
  // Shadows - subtle, professional
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(15 76 117 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(15 76 117 / 0.08), 0 1px 2px -1px rgb(15 76 117 / 0.08)',
    md: '0 4px 6px -1px rgb(15 76 117 / 0.08), 0 2px 4px -2px rgb(15 76 117 / 0.08)',
    lg: '0 10px 15px -3px rgb(15 76 117 / 0.1), 0 4px 6px -4px rgb(15 76 117 / 0.1)',
    xl: '0 20px 25px -5px rgb(15 76 117 / 0.12), 0 8px 10px -6px rgb(15 76 117 / 0.12)',
    '2xl': '0 25px 50px -12px rgb(15 76 117 / 0.15)',
    inner: 'inset 0 2px 4px 0 rgb(15 76 117 / 0.05)',
    // Medical-specific shadows
    medicalCard: '0 2px 8px 0 rgb(15 76 117 / 0.08)',
    elevated: '0 4px 12px 0 rgb(15 76 117 / 0.1)',
  },
  
  // Layout - 8px base unit system
  layout: {
    // Container
    containerPadding: '1.5rem',  // 24px
    containerMaxWidth: '1280px',
    sectionMargin: '1rem',       // 16px
    
    // Header
    headerHeight: '4rem',        // 64px
    headerPadding: '1.5rem',     // 24px
    
    // Sidebar
    sidebarWidth: '16rem',        // 256px
    sidebarCollapsedWidth: '4rem', // 64px
    sidebarPadding: '1rem',       // 16px
    
    // Content
    contentPadding: '1.5rem',     // 24px
    contentGap: '1rem',           // 16px
    
    // Cards
    cardPadding: '1.5rem',        // 24px
    cardGap: '1rem',              // 16px
    cardBorderRadius: '0.5rem',  // 8px
  },
  
  // Transitions - smooth, professional
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    // Medical-specific
    medical: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    hover: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Z-index scale - organized layering
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    overlay: 1040,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
    // Medical-specific
    medicalAlert: 1090,
    critical: 1100,
  },
  
  // Medical-specific tokens
  medical: {
    // Vitals display
    vitalSignsSpacing: '0.5rem', // 8px
    vitalSignsBorderRadius: '0.5rem', // 8px
    
    // Form spacing
    formFieldGap: '1rem',         // 16px
    formSectionGap: '1.5rem',     // 24px
    
    // Data table
    tableRowPadding: '0.75rem',   // 12px
    tableCellPadding: '0.75rem',  // 12px
    
    // Badge/status indicators
    badgePadding: '0.375rem 0.75rem', // 6px 12px
    badgeBorderRadius: '0.5rem',      // 8px
  },
  
  // Accessibility
  accessibility: {
    // Focus indicators (WCAG 2.1 AA)
    focusRingWidth: '2px',
    focusRingOffset: '2px',
    focusRingColor: 'rgba(27, 154, 170, 0.6)', // Trust Teal with opacity
    
    // Touch targets (minimum 44x44px for mobile)
    touchTargetMin: '2.75rem', // 44px
    
    // Text contrast (WCAG AA requires 4.5:1 for normal text)
    textContrastRatio: 4.5,
    largeTextContrastRatio: 3.0,
  },
} as const;

export type DesignTokens = typeof designTokens;
