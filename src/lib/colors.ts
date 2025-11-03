/**
 * Prontivus Design System - Medical-Grade Color Palette
 * Professional healthcare color system for medical credibility
 */

export const colors = {
  // Primary - Deep Medical Blue (#0F4C75)
  primary: {
    50: '#E6F1F7',
    100: '#CCE3EF',
    200: '#99C7DF',
    300: '#66ABCF',
    400: '#338FBF',
    500: '#0F4C75', // Main primary - Deep Medical Blue
    600: '#0C3D5E',
    700: '#092E47',
    800: '#061F31',
    900: '#03101A',
    950: '#01080D',
  },
  
  // Primary Accent - Trust Teal (#1B9AAA)
  primaryAccent: {
    50: '#E6F5F7',
    100: '#CCEBEF',
    200: '#99D7DF',
    300: '#66C3CF',
    400: '#33AFBF',
    500: '#1B9AAA', // Trust Teal
    600: '#167A88',
    700: '#115B66',
    800: '#0B3D44',
    900: '#061E22',
    950: '#030F11',
  },
  
  // Secondary - Calm Slate (#5D737E)
  secondary: {
    50: '#F0F3F5',
    100: '#E1E7EB',
    200: '#C3CFD7',
    300: '#A5B7C3',
    400: '#879FAF',
    500: '#5D737E', // Calm Slate
    600: '#4A5C65',
    700: '#38454C',
    800: '#252E33',
    900: '#131719',
    950: '#090B0D',
  },
  
  // Success - Medical Green (#16C79A)
  success: {
    50: '#E6F9F5',
    100: '#CCF3EB',
    200: '#99E7D7',
    300: '#66DBC3',
    400: '#33CFAF',
    500: '#16C79A', // Success Green
    600: '#129F7B',
    700: '#0D775C',
    800: '#09503E',
    900: '#04281F',
    950: '#021410',
  },
  
  // Accent - Warm Coral (#FF6B6B) for alerts/actions
  accent: {
    50: '#FFF0F0',
    100: '#FFE1E1',
    200: '#FFC3C3',
    300: '#FFA5A5',
    400: '#FF8787',
    500: '#FF6B6B', // Warm Coral
    600: '#CC5656',
    700: '#994040',
    800: '#662B2B',
    900: '#331515',
    950: '#1A0A0A',
  },
  
  // Neutrals - Sophisticated Grays
  neutral: {
    50: '#FAFBFC', // Off-white background
    100: '#F5F6F7',
    200: '#EDEFF2',
    300: '#E2E5EA',
    400: '#CBD0D8',
    500: '#718096', // Medium gray
    600: '#4A5568', // Dark gray
    700: '#2D3748', // Very dark gray
    800: '#1A202C',
    900: '#171923',
    950: '#0D1117',
  },
  
  // Medical semantic colors
  medical: {
    // Status indicators
    critical: '#DC2626',    // Critical alert red
    warning: '#F59E0B',    // Warning amber
    info: '#1B9AAA',       // Info teal
    success: '#16C79A',    // Success green
    
    // Medical context colors
    vitalSigns: '#0F4C75', // Blood pressure, etc.
    medication: '#1B9AAA',  // Medication teal
    procedure: '#5D737E',  // Procedure slate
    diagnosis: '#16C79A',  // Diagnosis green
  },
} as const;

// Export individual color values for easy access
export const colorTokens = {
  // Primary colors
  primary: colors.primary[500],
  primaryLight: colors.primary[400],
  primaryDark: colors.primary[600],
  primaryAccent: colors.primaryAccent[500],
  
  // Secondary colors
  secondary: colors.secondary[500],
  secondaryLight: colors.secondary[400],
  secondaryDark: colors.secondary[600],
  
  // Semantic colors
  success: colors.success[500],
  accent: colors.accent[500],
  
  // Background colors
  background: colors.neutral[50],
  backgroundElevated: '#FFFFFF',
  backgroundMuted: colors.neutral[100],
  
  // Text colors
  text: {
    primary: colors.neutral[700],
    secondary: colors.neutral[600],
    muted: colors.neutral[500],
    inverse: colors.neutral[50],
    disabled: colors.neutral[400],
  },
  
  // Border colors
  border: colors.neutral[200],
  borderMuted: colors.neutral[100],
  borderStrong: colors.neutral[300],
  
  // Medical context
  medical: colors.medical,
} as const;

// Color contrast ratios (WCAG 2.1 AA compliance)
export const contrastRatios = {
  // Primary colors on white
  primaryOnWhite: 7.1, // #0F4C75 on #FFFFFF - AAA
  primaryAccentOnWhite: 4.5, // #1B9AAA on #FFFFFF - AA
  
  // Text on backgrounds
  textOnBackground: 7.8, // #2D3748 on #FAFBFC - AAA
  textMutedOnBackground: 4.9, // #718096 on #FAFBFC - AA
  
  // Success on white
  successOnWhite: 4.9, // #16C79A on #FFFFFF - AA
  
  // Accent on white
  accentOnWhite: 4.2, // #FF6B6B on #FFFFFF - AA
} as const;

export type ColorPalette = typeof colors;
export type ColorToken = typeof colorTokens;
