/**
 * Component Audit Tool
 * Validates component design system usage, mobile responsiveness, accessibility, and performance
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const auditResults = {
  components: [],
  issues: [],
  warnings: [],
};

/**
 * Audit a single component
 */
function auditComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const componentName = path.basename(filePath, '.tsx');
  
  const audit = {
    name: componentName,
    path: filePath,
    designSystem: checkDesignSystemUsage(content),
    mobile: checkMobileResponsiveness(content),
    accessibility: checkAccessibility(content),
    performance: checkPerformance(content),
  };

  auditResults.components.push(audit);
  return audit;
}

/**
 * Check design system usage
 */
function checkDesignSystemUsage(content) {
  const checks = {
    usesMedicalColors: /(?:bg-|text-|border-)(?:primary|primary-accent|success|secondary)/.test(content),
    usesMedicalClasses: /medical-(?:card|form-input|transition|pattern)/.test(content),
    usesDesignTokens: /designTokens|colorTokens|designClasses/.test(content),
    usesRoundedLG: /rounded-lg/.test(content),
    usesBorder2: /border-2/.test(content),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;

  return {
    checks,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    compliant: score === maxScore,
  };
}

/**
 * Check mobile responsiveness
 */
function checkMobileResponsiveness(content) {
  const checks = {
    hasResponsiveClasses: /(?:sm:|md:|lg:|xl:)/.test(content),
    hasTouchTargets: /(?:min-h-\[44px\]|h-11|h-12)/.test(content),
    usesMobileBreakpoints: /@media|responsive/.test(content),
    avoidsFixedSizing: !/w-\[.*px\]|h-\[.*px\]/.test(content),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;

  return {
    checks,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    compliant: score >= 3, // At least 3/4 checks pass
  };
}

/**
 * Check accessibility
 */
function checkAccessibility(content) {
  const checks = {
    hasAriaLabels: /aria-(?:label|labelledby|describedby)/.test(content),
    hasRoles: /role=/.test(content),
    hasAltText: /alt=/.test(content),
    hasFocusStates: /(?:focus-visible|focus:)/.test(content),
    hasKeyboardNavigation: /(?:onKeyDown|tabIndex)/.test(content),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;

  return {
    checks,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    compliant: score >= 3, // At least 3/5 checks pass
  };
}

/**
 * Check performance
 */
function checkPerformance(content) {
  const checks = {
    usesMemo: /useMemo|React\.memo/.test(content),
    usesCallback: /useCallback/.test(content),
    avoidsInlineFunctions: !/onClick=\{[^}]*\([^)]*\)/.test(content),
    usesLazyLoading: /lazy|Suspense/.test(content),
    avoidsLargeImports: !/import.*\*/.test(content),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;

  return {
    checks,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    compliant: score >= 2, // At least 2/5 checks pass
  };
}

/**
 * Main audit function
 */
function auditComponents() {
  console.log('🔍 Starting component audit...\n');

  const componentFiles = glob.sync('src/components/**/*.tsx', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/__tests__/**'],
  });

  componentFiles.forEach(file => {
    auditComponent(file);
  });

  // Generate report
  console.log(`📊 Component Audit Results:\n`);
  console.log(`Components audited: ${auditResults.components.length}\n`);

  // Summary
  const designSystemCompliant = auditResults.components.filter(c => c.designSystem.compliant).length;
  const mobileCompliant = auditResults.components.filter(c => c.mobile.compliant).length;
  const a11yCompliant = auditResults.components.filter(c => c.accessibility.compliant).length;
  const perfCompliant = auditResults.components.filter(c => c.performance.compliant).length;

  console.log('📈 Compliance Summary:\n');
  console.log(`  Design System: ${designSystemCompliant}/${auditResults.components.length} (${Math.round(designSystemCompliant/auditResults.components.length*100)}%)`);
  console.log(`  Mobile: ${mobileCompliant}/${auditResults.components.length} (${Math.round(mobileCompliant/auditResults.components.length*100)}%)`);
  console.log(`  Accessibility: ${a11yCompliant}/${auditResults.components.length} (${Math.round(a11yCompliant/auditResults.components.length*100)}%)`);
  console.log(`  Performance: ${perfCompliant}/${auditResults.components.length} (${Math.round(perfCompliant/auditResults.components.length*100)}%)\n`);

  // Detailed results
  console.log('📋 Component Details:\n');
  auditResults.components.forEach(component => {
    console.log(`  ${component.name}:`);
    console.log(`    Design System: ${component.designSystem.percentage}%`);
    console.log(`    Mobile: ${component.mobile.percentage}%`);
    console.log(`    Accessibility: ${component.accessibility.percentage}%`);
    console.log(`    Performance: ${component.performance.percentage}%\n`);
  });

  return auditResults;
}

// Run if called directly
if (require.main === module) {
  auditComponents();
}

module.exports = { auditComponents };

