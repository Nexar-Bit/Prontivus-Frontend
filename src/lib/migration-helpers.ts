/**
 * Migration Helper Utilities
 * Tools to assist with systematic component migration
 */

import React from "react";

/**
 * Check if new design system should be used
 */
export function shouldUseNewDesign(feature?: string): boolean {
  if (typeof window === "undefined") return true; // Default to new design on server
  
  // Check localStorage for feature flags
  const flags = localStorage.getItem("design-flags");
  if (flags) {
    try {
      const parsed = JSON.parse(flags);
      if (feature) {
        return parsed[feature] === true || parsed.all === true;
      }
      return parsed.all === true;
    } catch {
      return true; // Default to new design
    }
  }
  
  // Check environment variable
  return process.env.NEXT_PUBLIC_USE_NEW_DESIGN !== "false"; // Default to true
}

/**
 * Set feature flag
 */
export function setDesignFlag(feature: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  
  const flags = localStorage.getItem("design-flags");
  const parsed = flags ? JSON.parse(flags) : {};
  parsed[feature] = enabled;
  localStorage.setItem("design-flags", JSON.stringify(parsed));
}

/**
 * Component wrapper for gradual migration
 */
export function withMigrationWrapper<T extends React.ComponentType<any>>(
  OldComponent: T,
  NewComponent: T,
  featureFlag?: string
) {
  return React.forwardRef<any, React.ComponentPropsWithoutRef<T>>(
    (props, ref) => {
      const useNew = shouldUseNewDesign(featureFlag);
      
      if (useNew) {
        return React.createElement(NewComponent, { ref, ...props } as any);
      }
      
      return React.createElement(OldComponent, { ref, ...props } as any);
    }
  );
}

/**
 * Class name merger that respects migration state
 */
export function mergeClasses(
  oldClasses: string,
  newClasses: string,
  useNew: boolean
): string {
  return useNew ? newClasses : oldClasses;
}

/**
 * Find all usages of a component
 */
export function findComponentUsages(componentName: string): string[] {
  // This would integrate with AST parser in real implementation
  // For now, returns placeholder
  return [];
}

/**
 * Migration checklist generator
 */
export function generateMigrationChecklist(componentPath: string) {
  return [
    `Review ${componentPath}`,
    "Replace with new component",
    "Update imports",
    "Test functionality",
    "Check accessibility",
    "Verify mobile responsiveness",
    "Test with screen readers",
    "Check performance",
    "Update documentation",
    "Mark as complete in tracker",
  ];
}

