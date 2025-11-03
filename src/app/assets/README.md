# Prontivus Medical Image Asset System

Comprehensive image asset system for premium healthcare platform appearance.

## Asset Organization

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
├── favicon.ico
├── favicon.svg
├── apple-touch-icon.png
└── manifest.json
```

## Components

### ProntivusLogo
Medical-themed logo with integrated cross symbol.

```tsx
import { ProntivusLogo } from "@/components/assets";

<ProntivusLogo variant="full" size="lg" includeMedicalSymbol />
<ProntivusLogo variant="icon" size="md" />
<ProntivusLogo variant="text" size="sm" />
```

**Variants:**
- `full` - Icon + text (default)
- `icon` - Medical cross symbol only
- `text` - Text only

**Sizes:** `sm`, `md`, `lg`, `xl`

### MedicalAvatar
Professional avatars with role-based styling.

```tsx
import { MedicalAvatar } from "@/components/assets";

<MedicalAvatar
  name="Dr. João Silva"
  role="doctor"
  size="lg"
  showBadge
/>
```

**Roles:** `doctor`, `patient`, `nurse`, `admin`

**Features:**
- Initials fallback
- Role-based colors
- Badge indicators
- Accessibility support

### MedicalPattern
Abstract medical patterns for backgrounds.

```tsx
import { MedicalPattern } from "@/components/assets";

<MedicalPattern variant="dots" intensity="subtle" />
```

**Variants:**
- `dots` - Subtle dot pattern
- `grid` - Medical grid
- `waves` - Flowing waves
- `circuit` - Circuit board style
- `cells` - Cellular pattern

**Intensities:** `subtle`, `medium`, `strong`

### DocumentBackground
Styled backgrounds for medical documents.

```tsx
import { DocumentBackground } from "@/components/assets";

<DocumentBackground variant="prescription">
  <DocumentContent />
</DocumentBackground>
```

**Variants:** `prescription`, `certificate`, `report`, `form`

### ChartBackground & DataVisualizationIcon
Assets for data visualization.

```tsx
import { ChartBackground, DataVisualizationIcon } from "@/components/assets";

<ChartBackground type="line" />
<DataVisualizationIcon type="trend-up" size={32} />
```

### OptimizedImage
Next.js Image wrapper with medical defaults.

```tsx
import { OptimizedImage } from "@/components/assets";

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Medical illustration"
  width={800}
  height={600}
  quality={85}
/>
```

### NotificationBadge
Medical-themed notification badges.

```tsx
import { NotificationBadge } from "@/components/assets";

<NotificationBadge
  count={5}
  variant="urgent"
  maxCount={99}
/>
```

### FormHeaderImage
Professional form headers.

```tsx
import { FormHeaderImage } from "@/components/assets";

<FormHeaderImage
  title="Patient Registration"
  subtitle="Complete the form to register a new patient"
  variant="default"
/>
```

## Asset Management

### Using Asset Paths

```tsx
import { ASSETS } from "@/lib/assets";

<Image src={ASSETS.logo.full} alt="Prontivus Logo" />
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
```

## Favicon & App Icons

### Favicon Generation

Favicon is provided as SVG and should be converted to:
- `favicon.ico` (16x16, 32x32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `safari-pinned-tab.svg`

### iOS App Icons

Generate from base icon:
- 180x180 (iPhone)
- 1024x1024 (App Store)

### Android App Icons

Generate from base icon:
- 192x192 (mdpi)
- 512x512 (xxxhdpi)

## Image Optimization Guidelines

1. **Format Selection:**
   - SVG for logos, icons, patterns
   - WebP for photos (with PNG fallback)
   - PNG for graphics with transparency
   - JPG for photographs

2. **Sizing:**
   - Logo: Multiple sizes (24px to 512px)
   - Avatars: 32px, 48px, 64px, 96px, 128px
   - Document headers: 1200px width max
   - Charts: Responsive, up to 800px

3. **Quality:**
   - Medical documents: 95-100%
   - UI images: 85%
   - Backgrounds: 75%

4. **Lazy Loading:**
   - Use Next.js Image lazy loading
   - Prioritize above-fold images
   - Use `priority` prop for critical images

## Accessibility

### Alt Text Guidelines

- **Descriptive**: "Prontivus logo with medical cross symbol"
- **Functional**: "Close menu" for buttons
- **Decorative**: Empty alt for decorative images
- **Contextual**: Include relevant medical context

### Color Contrast

- All text on images: WCAG AA minimum
- Icons: 3:1 contrast ratio
- Medical symbols: High visibility

## Performance

### Loading Strategy

1. **Critical Path:**
   - Logo (priority)
   - Above-fold images (priority)
   - Favicon

2. **Deferred:**
   - Background patterns
   - Decorative images
   - Below-fold content

3. **Progressive:**
   - Skeleton screens during load
   - Placeholder avatars
   - Lazy loading

### Caching

- Static assets: Long-term cache
- User-generated: Short-term cache
- CDN for production deployment

## Brand Guidelines

### Colors

- **Primary**: #0F4C75 (Medical Blue)
- **Accent**: #1B9AAA (Trust Teal)
- **Success**: #16C79A (Medical Green)
- **Alert**: #FF3B30 (Critical Red)

### Typography

- **Logo**: Bold, clean sans-serif
- **Tagline**: Regular weight, smaller size
- **Medical Symbols**: Subtle integration

### Medical Symbolism

- Cross: Primary medical identifier
- Stethoscope: Subtle accent
- Heart: Vital signs, health
- Shield: Security, privacy

## Usage Examples

### Logo in Header

```tsx
<header>
  <ProntivusLogo variant="full" size="md" />
</header>
```

### Patient Avatar

```tsx
<MedicalAvatar
  src={patient.photo}
  name={patient.name}
  role="patient"
  size="lg"
/>
```

### Document Template

```tsx
<DocumentBackground variant="prescription">
  <PrescriptionTemplate data={prescription} />
</DocumentBackground>
```

### Chart with Background

```tsx
<div className="relative">
  <ChartBackground type="line" />
  <LineChart data={data} />
</div>
```

## Best Practices

1. **Always provide alt text** for accessibility
2. **Use appropriate formats** for each asset type
3. **Optimize file sizes** without losing quality
4. **Provide fallbacks** for missing images
5. **Test across devices** and screen sizes
6. **Maintain consistency** in medical aesthetic
7. **Respect privacy** in patient imagery (use placeholders)

## Future Enhancements

- AI-generated medical illustrations
- Dynamic chart assets
- Custom pattern generator
- Brand asset download portal
- Image compression automation

