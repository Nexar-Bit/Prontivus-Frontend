# Component Migration Guide

Step-by-step guide for migrating individual components to the new design system.

## Quick Start

1. **Identify Component** - Check migration tracker for status
2. **Review New Design** - Understand new component API
3. **Create Feature Branch** - `git checkout -b migrate/component-name`
4. **Migrate Component** - Replace usage systematically
5. **Test Thoroughly** - Verify all functionality
6. **Update Tracker** - Mark as completed

## Migration Checklist

For each component migration:

### Pre-Migration
- [ ] Review component usage across codebase
- [ ] Check for dependencies on component
- [ ] Understand new component API
- [ ] Plan migration approach

### Migration
- [ ] Update component import
- [ ] Replace component usage
- [ ] Update props if API changed
- [ ] Test each usage location
- [ ] Verify styling matches design

### Post-Migration
- [ ] Run linter
- [ ] Test on multiple browsers
- [ ] Test mobile responsiveness
- [ ] Check accessibility
- [ ] Verify performance
- [ ] Update documentation
- [ ] Update migration tracker

## Common Migration Patterns

### Pattern 1: Direct Replacement

```tsx
// Before
import { Button } from "@/components/ui/button";
<Button variant="default">Click me</Button>

// After (same import, enhanced component)
import { Button } from "@/components/ui/button";
<Button variant="default">Click me</Button>
```

### Pattern 2: Component Enhancement

```tsx
// Before
import { Input } from "@/components/ui/input";
<Input placeholder="Enter text" />

// After (enhanced with medical styling)
import { Input } from "@/components/ui/input";
<Input placeholder="Enter text" className="medical-form-input" />
```

### Pattern 3: New Component Type

```tsx
// Before
import { Input } from "@/components/ui/input";
<Input type="text" />

// After (use medical-specific component)
import { MedicalInput } from "@/components/medical-forms/medical-input";
<MedicalInput label="Blood Pressure" medicalContext={{ unit: "mmHg" }} />
```

## Component-Specific Guides

### Button Migration

1. **Check Variants**
   - Verify variant names (should be compatible)
   - Test all variants: default, outline, secondary, ghost, destructive

2. **Update Styling**
   - Buttons automatically use new medical styling
   - Check hover states and active states

3. **Test Sizes**
   - Verify sm, md, lg sizes work correctly
   - Check icon buttons

### Input Migration

1. **Standard Inputs**
   - Most can stay as-is (auto-enhanced)
   - Add `medical-form-input` class for medical context

2. **Medical-Specific**
   - Consider using `MedicalInput` for medical data
   - Use `BloodPressureInput`, `TemperatureInput` for specialized fields

3. **Form Integration**
   - Wrap in `FormSection` for organization
   - Use `FormCard` for form containers

### Card Migration

1. **Standard Cards**
   - Add `medical-card` class for enhanced styling
   - Cards auto-updated with new spacing

2. **Medical Cards**
   - Use `medical-card` class
   - Add medical patterns if needed

## Testing Guidelines

### Visual Testing
- Compare before/after screenshots
- Check all breakpoints
- Verify color contrast
- Test dark mode if applicable

### Functional Testing
- All interactions work
- Forms submit correctly
- Navigation functions
- Data displays accurately

### Accessibility Testing
- Keyboard navigation works
- Screen reader compatibility
- Focus management
- ARIA labels correct

### Performance Testing
- No layout shifts
- Smooth animations
- Fast load times
- No memory leaks

## Rollback Procedure

If migration causes issues:

1. **Quick Rollback**
   ```bash
   git checkout HEAD -- path/to/component.tsx
   ```

2. **Full Rollback**
   ```bash
   git revert <commit-hash>
   ```

3. **Feature Flag Rollback**
   ```typescript
   setDesignFlag('component-name', false);
   ```

## Troubleshooting

### Common Issues

**Issue:** Styles not applying
- **Solution:** Check CSS imports, verify Tailwind config

**Issue:** Component API changed
- **Solution:** Review component props, update usage

**Issue:** Breaking changes
- **Solution:** Use feature flag to revert, fix incrementally

**Issue:** Performance regression
- **Solution:** Profile performance, optimize animations

## Getting Help

- Check migration tracker for component status
- Review MIGRATION_PLAN.md for overall strategy
- Consult design system documentation
- Ask team lead for guidance

## Progress Tracking

Update migration tracker after each component:

```typescript
import { updateMigrationStatus } from "@/lib/migration-tracker";

updateMigrationStatus("component-id", "completed", "Notes here");
```

View progress at: `/migration`

