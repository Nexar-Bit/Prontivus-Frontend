/**
 * Design System Linting Tool
 * Validates CSS, design tokens, colors, typography, and spacing consistency
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const issues = [];
const warnings = [];

// Design token definitions from design-tokens.ts
const DESIGN_TOKENS = {
  colors: {
    primary: '#0F4C75',
    primaryAccent: '#1B9AAA',
    secondary: '#5D737E',
    success: '#16C79A',
    accent: '#FF6B6B',
  },
  spacing: {
    base: 8, // 8px base unit
    values: [0, 8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192],
  },
  borderRadius: {
    default: '0.5rem', // 8px
    sm: '0.25rem', // 4px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui'],
      mono: ['JetBrains Mono', 'Fira Code'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
};

/**
 * Check for hardcoded colors that should use design tokens
 */
function checkColorUsage(content, filePath) {
  const hardcodedColors = [
    { pattern: /#[0-9A-Fa-f]{6}/g, name: 'hex colors' },
    { pattern: /rgb\([^)]+\)/g, name: 'rgb colors' },
    { pattern: /rgba\([^)]+\)/g, name: 'rgba colors' },
  ];

  hardcodedColors.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
      // Allow specific approved colors
      const allowedColors = ['#0F4C75', '#1B9AAA', '#5D737E', '#16C79A', '#FF6B6B', '#FAFBFC', '#FFFFFF', '#000000'];
      matches.forEach(match => {
        if (!allowedColors.includes(match)) {
          warnings.push({
            file: filePath,
            type: 'color',
            message: `Hardcoded ${name} found: ${match}. Consider using design tokens.`,
          });
        }
      });
    }
  });
}

/**
 * Check spacing consistency (8px base unit)
 */
function checkSpacing(content, filePath) {
  const spacingPattern = /(?:p|m|gap|space)-(\d+)/g;
  const matches = content.matchAll(spacingPattern);
  
  matches.forEach(match => {
    const value = parseInt(match[1]);
    if (value % 8 !== 0 && value !== 0) {
      warnings.push({
        file: filePath,
        type: 'spacing',
        message: `Spacing value ${value}px not aligned to 8px base unit. Use multiples of 8.`,
      });
    }
  });
}

/**
 * Check typography consistency
 */
function checkTypography(content, filePath) {
  // Check for hardcoded font sizes
  const fontSizePattern = /font-size:\s*([^;]+);/g;
  const matches = content.matchAll(fontSizePattern);
  
  matches.forEach(match => {
    const size = match[1].trim();
    if (!size.includes('rem') && !size.includes('var(')) {
      warnings.push({
        file: filePath,
        type: 'typography',
        message: `Hardcoded font size: ${size}. Use design token scale.`,
      });
    }
  });
}

/**
 * Check for deprecated design patterns
 */
function checkDeprecatedPatterns(content, filePath) {
  const deprecated = [
    { pattern: /rounded-sm|rounded-md(?!\w)/g, message: 'Use rounded-lg instead of rounded-sm/md' },
    { pattern: /border\s/g, message: 'Use border-2 for consistency' },
    { pattern: /shadow-sm(?!\w)/g, message: 'Consider using medical shadow variants' },
  ];

  deprecated.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      warnings.push({
        file: filePath,
        type: 'deprecated',
        message,
      });
    }
  });
}

/**
 * Check component structure
 */
function checkComponentStructure(content, filePath) {
  // Check for missing medical classes
  if (filePath.includes('/ui/') && !content.includes('medical-')) {
    const componentName = path.basename(filePath, '.tsx');
    if (['button', 'input', 'card', 'select', 'textarea'].includes(componentName)) {
      warnings.push({
        file: filePath,
        type: 'component',
        message: `Component ${componentName} should use medical-* classes for consistency.`,
      });
    }
  }
}

/**
 * Main linting function
 */
function lintDesignSystem() {
  console.log('🔍 Starting design system linting...\n');

  const files = glob.sync('src/**/*.{tsx,ts,css}', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/__tests__/**'],
  });

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    checkColorUsage(content, file);
    checkSpacing(content, file);
    checkTypography(content, file);
    checkDeprecatedPatterns(content, file);
    checkComponentStructure(content, file);
  });

  // Report results
  console.log(`📊 Linting Results:\n`);
  console.log(`Files checked: ${files.length}`);
  console.log(`Warnings found: ${warnings.length}\n`);

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(warning => {
      console.log(`  [${warning.type}] ${warning.file}`);
      console.log(`    ${warning.message}\n`);
    });
  } else {
    console.log('✅ No design system issues found!\n');
  }

  return warnings.length === 0;
}

// Run if called directly
if (require.main === module) {
  const success = lintDesignSystem();
  process.exit(success ? 0 : 1);
}

module.exports = { lintDesignSystem };

