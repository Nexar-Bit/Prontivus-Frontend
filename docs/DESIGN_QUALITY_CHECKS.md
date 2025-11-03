# Design Quality Checks & Validation

Comprehensive guide for maintaining design system quality and consistency in Prontivus.

## Table of Contents

1. [Design Linting](#design-linting)
2. [Component Audit](#component-audit)
3. [Accessibility Verification](#accessibility-verification)
4. [Performance Assessment](#performance-assessment)
5. [Cross-Browser Testing](#cross-browser-testing)
6. [User Testing Preparation](#user-testing-preparation)

---

## Design Linting

### Automated Checks

Run design system linting:

```bash
npm run design:lint
# or
node scripts/design-lint.js
```

### What It Checks

#### Color Usage
- ✅ Hardcoded colors are flagged
- ✅ Approved colors: Primary (#0F4C75), Accent (#1B9AAA), etc.
- ✅ Recommendation to use CSS variables or design tokens

#### Spacing Consistency
- ✅ All spacing must use 8px base unit
- ✅ Values checked: padding, margin, gap, spacing
- ✅ Warns on non-standard values (e.g., 7px, 13px)

#### Typography
- ✅ Font sizes must use rem units
- ✅ Must align with typography scale
- ✅ Font families: Inter (sans), JetBrains Mono (mono)

#### Border Radius
- ✅ Default: `rounded-lg` (8px)
- ✅ Avoid: `rounded-sm`, `rounded-md`
- ✅ Use: `rounded-lg`, `rounded-xl`, `rounded-2xl`

#### Border Width
- ✅ Standard: `border-2` (2px)
- ✅ Avoid: `border` (1px default)

### Manual Checklist

Before committing:

- [ ] All colors use design tokens or CSS variables
- [ ] All spacing aligns to 8px base unit
- [ ] Typography uses design system scale
- [ ] Borders use `border-2`
- [ ] Rounded corners use `rounded-lg` as default
- [ ] Shadows use medical shadow variants
- [ ] Components use `medical-*` classes

---

## Component Audit

### Run Component Audit

```bash
npm run component:audit
# or
node scripts/component-audit.js
```

### Audit Criteria

#### Design System Usage (Must score 100%)
- ✅ Uses medical color palette
- ✅ Uses `medical-*` utility classes
- ✅ References design tokens
- ✅ Uses `rounded-lg` consistently
- ✅ Uses `border-2` consistently

#### Mobile Responsiveness (Must score ≥75%)
- ✅ Has responsive breakpoint classes
- ✅ Touch targets ≥44px (WCAG)
- ✅ Mobile-first approach
- ✅ Avoids fixed pixel sizing

#### Accessibility (Must score ≥60%)
- ✅ ARIA labels present
- ✅ Semantic HTML roles
- ✅ Alt text for images
- ✅ Focus states defined
- ✅ Keyboard navigation support

#### Performance (Must score ≥40%)
- ✅ Uses React.memo where appropriate
- ✅ useCallback for event handlers
- ✅ Avoids inline function definitions
- ✅ Lazy loading for heavy components
- ✅ Tree-shakeable imports

### Component Scorecard

Each component receives a scorecard:

```
Component: Button
├── Design System: 100% ✅
├── Mobile: 85% ✅
├── Accessibility: 80% ✅
└── Performance: 60% ✅
```

---

## Accessibility Verification

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Text on background**: Minimum 4.5:1 ratio
- **Large text**: Minimum 3:1 ratio
- **Interactive elements**: 4.5:1 ratio

**Test Tools:**
- Chrome DevTools Accessibility panel
- WAVE browser extension
- axe DevTools

#### Keyboard Navigation
- ✅ All interactive elements keyboard accessible
- ✅ Tab order is logical
- ✅ Focus indicators visible (2px ring)
- ✅ Skip links for main content

#### Screen Reader Support
- ✅ Semantic HTML elements
- ✅ ARIA labels where needed
- ✅ Live regions for dynamic content
- ✅ Proper heading hierarchy (h1 → h2 → h3)

#### Touch Targets
- ✅ Minimum 44x44px for mobile
- ✅ Adequate spacing between targets
- ✅ No overlap of interactive elements

### Testing Checklist

- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify color contrast ratios
- [ ] Check focus indicators on all elements
- [ ] Validate ARIA attributes
- [ ] Test with high contrast mode

---

## Performance Assessment

### Metrics to Monitor

#### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

#### Bundle Size
- **Initial bundle**: < 200KB gzipped
- **Total bundle**: < 500KB gzipped
- **Code splitting**: Route-based

#### Runtime Performance
- **60fps animations**: Smooth transitions
- **Memory usage**: < 50MB for typical page
- **API response**: < 500ms average

### Performance Testing

```bash
# Build and analyze bundle
npm run build
npm run analyze

# Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

### Optimization Checklist

- [ ] Images optimized (WebP with fallbacks)
- [ ] Code splitting implemented
- [ ] Lazy loading for below-fold content
- [ ] Memoization for expensive computations
- [ ] Debouncing for search/input
- [ ] Virtual scrolling for long lists
- [ ] Tree-shaking unused code

---

## Cross-Browser Testing

### Supported Browsers

| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | Latest 2 versions | High |
| Firefox | Latest 2 versions | High |
| Safari | Latest 2 versions | High |
| Edge | Latest 2 versions | Medium |
| Mobile Safari | iOS 14+ | High |
| Chrome Mobile | Android 10+ | High |

### Testing Matrix

For each component/page:

- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Edge Desktop
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Tablet (iPad)
- [ ] Small mobile (< 375px)

### Common Issues to Check

- ✅ CSS Grid/Flexbox compatibility
- ✅ CSS custom properties (variables)
- ✅ JavaScript ES6+ features
- ✅ Touch event handling
- ✅ Viewport units (vh/vw)
- ✅ Backdrop filters
- ✅ CSS animations

---

## User Testing Preparation

### Healthcare Professional Feedback

#### Test Scenarios

1. **Patient Registration**
   - Register new patient
   - Verify required fields
   - Test error handling

2. **Appointment Scheduling**
   - Create appointment
   - View calendar
   - Reschedule/cancel

3. **Medical Records**
   - View patient history
   - Add new record
   - Search/filter records

4. **Prescription Management**
   - Create prescription
   - View active prescriptions
   - Print prescription

#### Feedback Collection

- **Observation**: Watch users complete tasks
- **Questions**: Post-task interview
- **Metrics**: Time to complete, error rate
- **Satisfaction**: SUS (System Usability Scale)

### Patient Usability Testing

#### Test Scenarios

1. **Portal Login**
   - Login process
   - Password recovery
   - Two-factor authentication

2. **View Medical Records**
   - Access records
   - Understand information
   - Download/print

3. **Appointment Booking**
   - Find available slots
   - Book appointment
   - Receive confirmation

#### Success Criteria

- ✅ 90%+ task completion rate
- ✅ < 30 seconds for common tasks
- ✅ < 5% error rate
- ✅ SUS score > 70

### Accessibility Testing

#### Test Groups

1. **Screen Reader Users** (NVDA/JAWS/VoiceOver)
2. **Keyboard-Only Users**
3. **Low Vision Users** (zoom, high contrast)
4. **Motor Impairment** (switch control, voice)

#### Compliance Standards

- **WCAG 2.1 Level AA**: Minimum requirement
- **WCAG 2.1 Level AAA**: Where achievable
- **Section 508**: For US healthcare compliance

---

## Documentation Requirements

### Component Documentation

Each component must include:

1. **Usage Examples**
   ```tsx
   <Component prop1="value" />
   ```

2. **Props Documentation**
   - Type definitions
   - Default values
   - Required vs optional

3. **Accessibility Notes**
   - ARIA requirements
   - Keyboard shortcuts
   - Screen reader notes

4. **Design Guidelines**
   - When to use
   - When not to use
   - Variations available

### Design System Guidelines

- **Color Usage**: When to use each color
- **Typography Scale**: Heading hierarchy
- **Spacing System**: 8px base unit examples
- **Component Patterns**: Common use cases

### Customization Guidelines

For clinic-specific customizations:

1. **Brand Colors**: How to override primary
2. **Logo Replacement**: Steps to update
3. **Layout Adjustments**: Safe modifications
4. **Feature Flags**: What can be toggled

### Maintenance Procedures

1. **Regular Audits**: Monthly component reviews
2. **Design System Updates**: Versioning strategy
3. **Breaking Changes**: Migration guides
4. **Deprecation Policy**: Timeline and notices

---

## Quality Gates

### Before Production

- [ ] Design linting passes (0 warnings)
- [ ] Component audit: 90%+ compliance
- [ ] Accessibility: WCAG 2.1 AA verified
- [ ] Performance: Core Web Vitals pass
- [ ] Cross-browser: All priority browsers tested
- [ ] User testing: SUS score > 70
- [ ] Documentation: All components documented

### Continuous Monitoring

- Weekly design linting
- Monthly component audits
- Quarterly accessibility reviews
- Performance monitoring in production

---

## Quick Reference

### Commands

```bash
# Design linting
npm run design:lint

# Component audit
npm run component:audit

# Full quality check
npm run quality:check

# Accessibility audit
npm run a11y:check

# Performance analysis
npm run perf:analyze
```

### Resources

- **Design System**: `/DESIGN_SYSTEM.md`
- **Migration Guide**: `/MIGRATION_GUIDE.md`
- **Component Library**: `/src/components`
- **Design Tokens**: `/src/lib/design-tokens.ts`

---

**Last Updated**: 2024-01-01

