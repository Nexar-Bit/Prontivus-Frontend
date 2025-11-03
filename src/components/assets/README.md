# Prontivus Medical Image Asset System

Comprehensive image asset system designed for premium healthcare platform appearance.

## Quick Start

```tsx
import { ProntivusLogo, MedicalAvatar, MedicalPattern } from "@/components/assets";

// Logo
<ProntivusLogo variant="full" size="lg" />

// Avatar
<MedicalAvatar name="Dr. Silva" role="doctor" size="lg" />

// Pattern Background
<MedicalPattern variant="dots" intensity="subtle" />
```

## Components

### ProntivusLogo
Medical-themed logo with integrated cross symbol.

**Props:**
- `variant`: `"full" | "icon" | "text"` - Logo style
- `size`: `"sm" | "md" | "lg" | "xl"` - Size
- `includeMedicalSymbol`: `boolean` - Include stethoscope accent
- `className`: Additional CSS classes

**Usage:**
```tsx
<ProntivusLogo variant="full" size="md" includeMedicalSymbol />
```

### MedicalAvatar
Professional avatars with role-based styling and fallbacks.

**Props:**
- `src`: Image URL (optional)
- `alt`: Alt text for accessibility
- `name`: Display name (for initials)
- `role`: `"doctor" | "patient" | "nurse" | "admin"` - Role-based colors
- `size`: `"sm" | "md" | "lg" | "xl"` - Size
- `showBadge`: Show role badge indicator
- `className`: Additional CSS classes

**Features:**
- Automatic initials generation
- Role-based color coding
- Badge indicators
- Accessibility support

### MedicalPattern
Abstract medical patterns for backgrounds.

**Variants:**
- `dots` - Subtle dot pattern (prescriptions)
- `grid` - Medical grid (reports)
- `waves` - Flowing waves (forms)
- `circuit` - Circuit board style (certificates)
- `cells` - Cellular pattern (scientific data)

**Intensities:**
- `subtle` - 3% opacity (subtle backgrounds)
- `medium` - 8% opacity (document headers)
- `strong` - 15% opacity (feature sections)

### DocumentBackground
Styled backgrounds for medical documents.

**Variants:**
- `prescription` - Dots pattern, subtle
- `certificate` - Circuit pattern, subtle
- `report` - Grid pattern, medium
- `form` - Waves pattern, subtle

### ChartBackground & DataVisualizationIcon
Assets for medical data visualization.

**Chart Types:**
- `line` - Line chart grid
- `bar` - Bar chart grid
- `pie` - Pie chart background
- `area` - Area chart grid

**Trend Icons:**
- `trend-up` - Green upward trend
- `trend-down` - Red downward trend
- `stable` - Gray stable line
- `peak` - Orange peak indicator
- `low` - Blue low indicator

### OptimizedImage
Next.js Image wrapper with medical defaults and optimization.

**Features:**
- Automatic optimization
- Lazy loading
- Responsive sizing
- Quality control
- Accessibility built-in

### NotificationBadge
Medical-themed notification badges with urgency colors.

**Variants:**
- `default` - Blue (standard notifications)
- `urgent` - Orange (time-sensitive)
- `critical` - Red with pulse (medical alerts)

### FormHeaderImage
Professional form headers with gradient and patterns.

**Variants:**
- `default` - Full gradient with logo
- `compact` - Horizontal gradient
- `minimal` - Simple logo + text

### ImagePlaceholder
Placeholder component while images load.

**Variants:**
- `patient` - Teal background
- `doctor` - Blue background
- `document` - Gray background
- `chart` - Light blue background
- `generic` - Default gray

## Asset Management

### Using Asset Paths

```tsx
import { ASSETS } from "@/lib/assets";

<img src={ASSETS.logo.full} alt="Prontivus Logo" />
<img src={ASSETS.placeholders.patient} alt="Patient placeholder" />
```

### Responsive Image Sizes

```tsx
import { getImageSizes } from "@/lib/assets";

const sizes = getImageSizes({
  sm: "100vw",
  md: "50vw",
  lg: "33vw",
  default: "25vw",
});

<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  sizes={sizes}
/>
```

## File Organization

```
public/
├── assets/
│   ├── images/
│   │   ├── logo/
│   │   ├── placeholders/
│   │   └── documents/
│   └── svg/
│       ├── patterns/
│       └── icons/
├── favicon.svg
├── favicon.ico
├── apple-touch-icon.png
└── manifest.json
```

## Best Practices

### Image Optimization

1. **Use SVG for logos and icons** - Scalable, lightweight
2. **WebP for photographs** - Better compression
3. **PNG for graphics** - When transparency needed
4. **JPG for photos** - When file size matters

### Performance

1. **Lazy load** - Use Next.js Image lazy loading
2. **Priority** - Mark above-fold images
3. **Sizes attribute** - Specify responsive sizes
4. **Quality** - Balance quality vs. file size

### Accessibility

1. **Alt text** - Always provide descriptive alt text
2. **Contrast** - Ensure text on images is readable
3. **Focus** - Make image links keyboard accessible
4. **ARIA** - Use role="img" for decorative images

### Medical Context

1. **Privacy** - Use placeholders for patient photos
2. **Professional** - Maintain medical aesthetic
3. **Consistency** - Use consistent colors and styles
4. **Urgency** - Color-code by medical urgency

## Favicon Generation

See `/scripts/generate-favicons.md` for detailed instructions on generating all required favicon formats from the base SVG.

## Examples

### Logo in Header
```tsx
<header className="p-4 bg-white shadow-sm">
  <ProntivusLogo variant="full" size="md" />
</header>
```

### Patient List with Avatars
```tsx
{patients.map(patient => (
  <div key={patient.id} className="flex items-center gap-3">
    <MedicalAvatar
      name={patient.name}
      role="patient"
      size="md"
    />
    <span>{patient.name}</span>
  </div>
))}
```

### Document with Background
```tsx
<DocumentBackground variant="prescription">
  <PrescriptionTemplate prescription={data} />
</DocumentBackground>
```

### Form with Header
```tsx
<FormHeaderImage
  title="New Patient Registration"
  subtitle="Complete all required fields"
  variant="default"
/>
<form>
  {/* Form fields */}
</form>
```

## Medical Aesthetic

All assets follow medical design principles:

- **Colors**: Medical blue (#0F4C75), trust teal (#1B9AAA), medical green (#16C79A)
- **Symbols**: Subtle cross, stethoscope accents
- **Typography**: Clean, professional fonts
- **Spacing**: Generous whitespace
- **Contrast**: High contrast for medical data

This creates a cohesive, premium healthcare platform appearance throughout the application.

