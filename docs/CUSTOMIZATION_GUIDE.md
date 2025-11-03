# Customization Guide for Clinics

Guide for customizing Prontivus design system for clinic-specific branding.

## Overview

Prontivus design system supports clinic-specific customizations while maintaining medical-grade standards and accessibility compliance.

---

## Allowed Customizations

### ✅ Safe to Customize

1. **Primary Brand Colors**
   - Clinic logo colors
   - Primary accent colors
   - Brand identity colors

2. **Logo & Branding**
   - Clinic logo
   - Tagline/name
   - Favicon/app icons

3. **Additional Styles**
   - Custom utility classes
   - Component variants
   - Custom animations

4. **Layout Adjustments**
   - Spacing preferences
   - Container widths
   - Grid configurations

---

## Color Customization

### Override Primary Colors

**Option 1: CSS Variables**

```css
/* Create clinic-custom.css */
:root {
  --primary: YOUR_COLOR_HUE YOUR_COLOR_SATURATION% YOUR_COLOR_LIGHTNESS%;
  --primary-foreground: 0 0% 98%;
  --primary-hover: YOUR_COLOR_HUE YOUR_COLOR_SATURATION% YOUR_COLOR_LIGHTNESS%;
  --primary-accent: YOUR_ACCENT_HUE YOUR_ACCENT_SATURATION% YOUR_ACCENT_LIGHTNESS%;
}
```

**Option 2: Tailwind Config**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#YOUR_COLOR',
          // ... shades
        }
      }
    }
  }
}
```

### Color Selection Guidelines

**Medical Context:**
- ✅ Blues, teals, greens (trust, calm)
- ✅ Avoid: Red (unless for critical alerts)
- ✅ Ensure 4.5:1 contrast ratio minimum
- ✅ Test with colorblind users

**Accessibility Check:**
```bash
# Test contrast ratios
- Primary on white: ≥ 7:1 (WCAG AAA)
- Primary text on background: ≥ 4.5:1 (WCAG AA)
```

---

## Logo Customization

### Replace Logo

**Using ProntivusLogo Component**

```tsx
import { ProntivusLogo } from "@/components/assets";

// Custom logo prop (if supported)
<ProntivusLogo 
  variant="full" 
  customLogo="/path/to/clinic-logo.svg"
/>
```

**Direct Replacement**

1. Add logo files:
   ```
   public/
     Logo/
       ClinicLogo.svg
       ClinicLogoHorizontal.svg
       ClinicIcon.svg
   ```

2. Update components:
   ```tsx
   <Image 
     src="/Logo/ClinicLogo.svg" 
     alt="Clinic Name"
     width={200}
     height={40}
   />
   ```

### Logo Requirements

- **Format**: SVG (preferred) or PNG
- **Size**: Multiple resolutions (16x16 to 512x512)
- **Aspect Ratio**: Maintain original
- **Colors**: Work on light/dark backgrounds

---

## Typography Customization

### Font Replacement

**Using Custom Font**

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'YourFont', system-ui, sans-serif;
}
```

**Guidelines:**
- ✅ Maintain readability (medical context)
- ✅ Ensure good character spacing
- ✅ Support multiple weights (400, 500, 600, 700)
- ✅ Test with screen readers

---

## Component Variants

### Custom Button Variants

```tsx
// Add to button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ... existing variants
        clinic: "bg-clinic-primary text-white hover:bg-clinic-primary-dark",
      }
    }
  }
);
```

### Custom Card Styles

```tsx
// Custom card variant
<Card className="clinic-card border-clinic-primary">
  {/* Content */}
</Card>
```

---

## Spacing Adjustments

### Adjust Base Unit (Advanced)

**Warning**: Only modify if absolutely necessary

```typescript
// design-tokens.ts
export const designTokens = {
  spacing: {
    base: 6, // Change from 8px to 6px
    // ... adjust values
  }
}
```

**Considerations:**
- Affects all spacing
- Requires full audit
- May impact accessibility (touch targets)
- Not recommended unless necessary

---

## Custom Utility Classes

### Add Clinic-Specific Utilities

```css
/* globals.css or clinic-custom.css */

/* Clinic color utilities */
.bg-clinic-primary { background-color: var(--clinic-primary); }
.text-clinic-primary { color: var(--clinic-primary); }

/* Clinic-specific patterns */
.clinic-pattern {
  background-image: url('/patterns/clinic-pattern.svg');
}

/* Custom animations */
@keyframes clinic-pulse {
  /* ... */
}
```

---

## Restricted Customizations

### ❌ Do Not Modify

1. **Core Accessibility Features**
   - Focus indicators
   - ARIA attributes
   - Keyboard navigation
   - Screen reader support

2. **Medical Standards**
   - Critical color meanings (red = critical)
   - Medical terminology
   - Standard medical workflows

3. **Performance Optimizations**
   - Code splitting
   - Lazy loading
   - Image optimization

4. **Security Features**
   - Authentication flows
   - Authorization checks
   - Data encryption

5. **Core Components**
   - Direct modification of UI components
   - Breaking component APIs
   - Removing functionality

---

## Implementation Steps

### 1. Planning

- [ ] Identify customization needs
- [ ] Review accessibility impact
- [ ] Plan implementation approach
- [ ] Create test plan

### 2. Development

```bash
# Create customization file
touch src/styles/clinic-custom.css

# Add customizations
# Update components as needed
```

### 3. Testing

- [ ] Visual consistency check
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Performance check

### 4. Documentation

- [ ] Document customizations
- [ ] Update component usage
- [ ] Create maintenance guide
- [ ] Note any limitations

---

## Best Practices

### 1. Maintain Consistency

- Use same colors throughout
- Consistent spacing
- Unified typography
- Cohesive component styles

### 2. Preserve Accessibility

- Test contrast ratios
- Verify keyboard navigation
- Check screen reader compatibility
- Maintain touch target sizes

### 3. Performance

- Optimize custom assets
- Minimize CSS additions
- Avoid heavy animations
- Test bundle size impact

### 4. Documentation

- Document all customizations
- Note rationale
- Update usage examples
- Create maintenance notes

---

## Testing Checklist

### Before Deploying Customizations

- [ ] Colors meet contrast requirements
- [ ] Logo displays correctly (all sizes)
- [ ] Components work with custom styles
- [ ] Mobile experience validated
- [ ] Accessibility standards maintained
- [ ] Performance impact assessed
- [ ] Cross-browser compatibility verified
- [ ] Documentation updated

---

## Support

**Customization Questions:**
- Design system team
- Technical documentation
- Component library reference

**Issues:**
- GitHub issues (tag: customization)
- Design system team
- Technical support

---

## Examples

### Example: Clinic Brand Color

```css
/* clinic-custom.css */
:root {
  --clinic-primary: 210 75% 35%; /* Custom blue */
  --clinic-primary-foreground: 0 0% 98%;
}

/* Usage */
.button-clinic {
  background-color: hsl(var(--clinic-primary));
  color: hsl(var(--clinic-primary-foreground));
}
```

### Example: Custom Logo

```tsx
// components/clinic/ClinicLogo.tsx
export function ClinicLogo() {
  return (
    <Image
      src="/Logo/ClinicLogo.svg"
      alt="Clinic Name"
      width={200}
      height={40}
      priority
    />
  );
}

// Usage
import { ClinicLogo } from "@/components/clinic/ClinicLogo";
<ClinicLogo />
```

---

**Last Updated**: 2024-01-01

