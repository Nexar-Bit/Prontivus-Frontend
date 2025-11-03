# Design Quality Checklist

Quick reference checklist for ensuring design system quality.

## Pre-Commit Checklist

### Design System Compliance
- [ ] No hardcoded colors (use design tokens)
- [ ] Spacing uses 8px base unit
- [ ] Typography uses design system scale
- [ ] Borders use `border-2`
- [ ] Rounded corners use `rounded-lg`
- [ ] Components use `medical-*` classes

### Component Quality
- [ ] Uses medical color palette
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] ARIA labels present
- [ ] Focus states visible
- [ ] Error states handled

### Code Quality
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Design linting passes
- [ ] Component audit passes

---

## Pre-PR Checklist

### Visual
- [ ] Design matches mockups/specs
- [ ] Consistent with existing design
- [ ] Mobile view tested
- [ ] Tablet view tested
- [ ] Desktop view tested
- [ ] Dark mode (if applicable)

### Functionality
- [ ] All features work
- [ ] Error handling works
- [ ] Loading states work
- [ ] Empty states work
- [ ] Edge cases handled

### Accessibility
- [ ] Screen reader tested
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Alt text present
- [ ] ARIA attributes correct

### Performance
- [ ] No performance regressions
- [ ] Bundle size acceptable
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Code splitting used

### Documentation
- [ ] Component documented
- [ ] Props documented
- [ ] Usage examples added
- [ ] Accessibility notes added

---

## Pre-Release Checklist

### Quality Gates
- [ ] Design linting: 0 warnings
- [ ] Component audit: 90%+ compliance
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Performance: Core Web Vitals pass
- [ ] Tests: All passing

### Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### User Testing
- [ ] Healthcare professionals tested
- [ ] Patient portal tested
- [ ] Accessibility users tested
- [ ] Feedback incorporated

### Documentation
- [ ] Usage guide updated
- [ ] Migration guide (if needed)
- [ ] Release notes prepared
- [ ] Team notified

---

## Quick Commands

```bash
# Run all quality checks
npm run quality:check

# Design linting only
npm run design:lint

# Component audit only
npm run component:audit

# Full build with analysis
npm run perf:analyze
```

---

## Issue Severity

### Critical (Block Release)
- Accessibility violations
- Security issues
- Breaking functionality
- Data loss risks

### High (Fix Before Release)
- Major UX issues
- Performance degradation
- Cross-browser failures
- Mobile breakage

### Medium (Fix Soon)
- Minor UX issues
- Design inconsistencies
- Documentation gaps
- Minor bugs

### Low (Backlog)
- Nice-to-have improvements
- Documentation enhancements
- Minor optimizations

---

**Last Updated**: 2024-01-01

