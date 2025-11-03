# Design System Usage Guidelines

Complete guide for using the Prontivus medical design system correctly.

## Quick Start

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MedicalInput } from "@/components/medical-forms/medical-input";

// Use medical color classes
<div className="bg-primary text-white">...</div>

// Use medical spacing (8px base unit)
<div className="p-6 space-y-4">...</div>

// Use medical components
<MedicalInput label="Patient Name" />
```

---

## Color System

### Primary Colors

**Medical Blue (#0F4C75)**
```tsx
// Background
<div className="bg-primary">...</div>

// Text
<span className="text-primary">...</div>

// Border
<div className="border-primary">...</div>
```

**Trust Teal (#1B9AAA)**
```tsx
<div className="bg-primary-accent text-white">...</div>
```

**When to Use:**
- Primary actions
- Medical data
- Headers and titles
- Important information

### Secondary Colors

**Calm Slate (#5D737E)**
```tsx
<div className="bg-secondary text-white">...</div>
```

**Success Green (#16C79A)**
```tsx
<div className="bg-success text-white">...</div>
```

**Warm Coral (#FF6B6B)**
```tsx
<div className="bg-accent text-white">...</div>
```

### Neutral Colors

**Backgrounds**
```tsx
<div className="bg-[#FAFBFC]">Main background</div>
<div className="bg-white">Card backgrounds</div>
<div className="bg-gray-100">Muted backgrounds</div>
```

**Text Colors**
```tsx
<p className="text-[#2D3748]">Primary text</p>
<p className="text-[#5D737E]">Secondary text</p>
<p className="text-[#718096]">Muted text</p>
```

### Medical Context Colors

```tsx
// Status indicators
<span className="text-[#DC2626]">Critical</span>
<span className="text-[#F59E0B]">Warning</span>
<span className="text-[#1B9AAA]">Info</span>
<span className="text-[#16C79A]">Success</span>
```

### ❌ Don't Do

```tsx
// Don't use hardcoded colors
<div className="bg-[#123456]">...</div>

// Don't use non-medical colors
<div className="bg-purple-500">...</div>

// Don't mix color systems
<div className="bg-blue-500">...</div>
```

---

## Typography

### Font Families

**Sans Serif (Body)**
```tsx
<p className="font-sans">Inter font family</p>
```

**Monospace (Code/Data)**
```tsx
<code className="font-mono">JetBrains Mono</code>
```

### Font Sizes

```tsx
<p className="text-xs">12px - Small labels</p>
<p className="text-sm">14px - Body small</p>
<p className="text-base">16px - Body default</p>
<p className="text-lg">18px - Body large</p>
<p className="text-xl">20px - Small headings</p>
<p className="text-2xl">24px - Section headings</p>
<p className="text-3xl">30px - Page titles</p>
<p className="text-4xl">36px - Display headings</p>
```

### Font Weights

```tsx
<p className="font-normal">400 - Body text</p>
<p className="font-medium">500 - Emphasized text</p>
<p className="font-semibold">600 - Headings</p>
<p className="font-bold">700 - Strong emphasis</p>
```

### Heading Hierarchy

```tsx
<h1 className="text-4xl font-bold text-[#0F4C75]">Page Title</h1>
<h2 className="text-2xl font-semibold text-[#0F4C75]">Section</h2>
<h3 className="text-xl font-semibold text-[#0F4C75]">Subsection</h3>
<h4 className="text-lg font-medium text-[#2D3748]">Card Title</h4>
```

### ❌ Don't Do

```tsx
// Don't use arbitrary font sizes
<p className="text-[13px]">...</p>

// Don't skip heading levels
<h1>Title</h1>
<h3>Subtitle</h3> {/* Missing h2 */}

// Don't use non-system fonts
<p className="font-comic">...</p>
```

---

## Spacing System

### 8px Base Unit

All spacing uses multiples of 8px:

```tsx
// Padding
<div className="p-2">16px padding</div>
<div className="p-3">24px padding</div>
<div className="p-4">32px padding</div>
<div className="p-6">48px padding</div>

// Margin
<div className="m-2">16px margin</div>
<div className="m-3">24px margin</div>
<div className="m-4">32px margin</div>

// Gap
<div className="gap-2">16px gap</div>
<div className="gap-4">32px gap</div>
<div className="gap-6">48px gap</div>
```

### Common Patterns

**Card Padding**
```tsx
<Card className="p-6">Card content</Card>
```

**Section Spacing**
```tsx
<div className="space-y-4">
  <Section1 />
  <Section2 />
</div>
```

**Form Fields**
```tsx
<div className="space-y-2">
  <Label />
  <Input />
</div>
```

**Container Padding**
```tsx
<div className="container mx-auto px-6 py-6">
  Content
</div>
```

### ❌ Don't Do

```tsx
// Don't use non-standard spacing
<div className="p-[13px]">...</div>
<div className="gap-[7px]">...</div>
<div className="m-1.5">...</div>
```

---

## Component Usage

### Buttons

```tsx
import { Button } from "@/components/ui/button";

// Primary action
<Button variant="default">Save</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// With icon
<Button>
  <Plus className="mr-2" />
  Add Patient
</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card className="medical-card">
  <CardHeader>
    <CardTitle>Patient Information</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Forms

```tsx
import { MedicalInput } from "@/components/medical-forms/medical-input";
import { FormCard, FormSection } from "@/components/medical-forms";

<FormCard title="Patient Registration">
  <FormSection title="Basic Information">
    <MedicalInput label="Name" required />
    <MedicalInput label="Email" type="email" />
  </FormSection>
</FormCard>
```

### Tables

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Date</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>2024-01-01</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Medical-Specific Components

### Medical Input

```tsx
import { MedicalInput } from "@/components/medical-forms/medical-input";

<MedicalInput
  label="Blood Pressure"
  medicalContext={{
    normalRange: "90-120/60-80",
    unit: "mmHg",
    critical: false,
  }}
  error={errors.bloodPressure}
  hint="Measure after 5 minutes rest"
/>
```

### Vital Signs Input

```tsx
import { VitalSignsInput } from "@/components/medical-forms/vital-signs-input";

<VitalSignsInput
  values={vitals}
  onChange={handleChange}
  errors={errors}
/>
```

### ICD-10 Search

```tsx
import { ICD10Search } from "@/components/medical-forms/icd10-search";

<ICD10Search
  label="Diagnosis"
  value={selectedCode}
  onSelect={handleSelect}
/>
```

---

## Layout Patterns

### Page Layout

```tsx
<div className="min-h-screen bg-[#FAFBFC]">
  <AppHeader />
  <div className="container mx-auto px-6 py-6">
    <h1 className="text-3xl font-bold text-[#0F4C75] mb-6">
      Page Title
    </h1>
    <div className="space-y-6">
      {/* Content */}
    </div>
  </div>
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

### Split Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>Left content</div>
  <div>Right content</div>
</div>
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus:

```tsx
<Button className="focus-visible:ring-2 focus-visible:ring-primary-accent">
  Click me
</Button>
```

### ARIA Labels

```tsx
<button aria-label="Close dialog">
  <X />
</button>

<img src="..." alt="Patient photo" />

<form aria-labelledby="patient-form">
  ...
</form>
```

### Keyboard Navigation

- ✅ All interactive elements keyboard accessible
- ✅ Logical tab order
- ✅ Skip links for main content
- ✅ Keyboard shortcuts documented

---

## Customization Guidelines

### Clinic Branding

**Color Override**
```css
/* Override primary color */
:root {
  --primary: YOUR_CLINIC_COLOR;
}
```

**Logo Replacement**
```tsx
// Use ProntivusLogo component with custom logo
<ProntivusLogo variant="full" customLogo="/path/to/logo.svg" />
```

### Safe Modifications

✅ **Allowed:**
- Primary color override
- Logo replacement
- Additional utility classes
- Component variants

❌ **Not Allowed:**
- Breaking component APIs
- Removing accessibility features
- Changing spacing base unit
- Modifying core components directly

---

## Common Mistakes

### ❌ Avoid These

1. **Hardcoded Colors**
   ```tsx
   <div className="bg-[#123456]">Bad</div>
   <div className="bg-primary">Good</div>
   ```

2. **Non-Standard Spacing**
   ```tsx
   <div className="p-[13px]">Bad</div>
   <div className="p-3">Good (24px)</div>
   ```

3. **Missing Medical Classes**
   ```tsx
   <Card>Bad</Card>
   <Card className="medical-card">Good</Card>
   ```

4. **Inconsistent Borders**
   ```tsx
   <div className="border">Bad</div>
   <div className="border-2">Good</div>
   ```

5. **Wrong Border Radius**
   ```tsx
   <div className="rounded-md">Bad</div>
   <div className="rounded-lg">Good</div>
   ```

---

## Resources

- **Design Tokens**: `/src/lib/design-tokens.ts`
- **Colors**: `/src/lib/colors.ts`
- **Component Library**: `/src/components`
- **Migration Guide**: `/MIGRATION_GUIDE.md`

---

**Last Updated**: 2024-01-01

