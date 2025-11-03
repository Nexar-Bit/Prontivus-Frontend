# Prontivus Medical Icon System

A cohesive, professional medical icon system designed for healthcare applications. All icons maintain consistent 24x24px base size and 2px stroke width for visual harmony.

## Design Principles

- **Professional & Modern**: Medical symbolism without clichés
- **Consistent Styling**: Uniform 2px stroke width, rounded line caps
- **Medical Context**: Subtle medical identifiers integrated naturally
- **Accessible**: Proper ARIA attributes and semantic markup
- **Flexible**: Customizable size and stroke width

## Icon Library

### Core Medical Icons

| Icon | Component | Alias | Use Case |
|------|-----------|-------|----------|
| 👤 | `PatientProfileIcon` | `PatientIcon` | Patient profiles, user accounts |
| 🩺 | `StethoscopeIcon` | `ConsultationIcon` | Consultations, examinations |
| 📅 | `MedicalCalendarIcon` | `AppointmentIcon` | Appointments, scheduling |
| 📋 | `PrescriptionPadIcon` | `PrescriptionIcon` | Prescriptions, medications |
| 🧪 | `LaboratoryFlaskIcon` | `LabIcon` | Laboratory tests, exams |
| 💊 | `PharmacyBottleIcon` | `PharmacyIcon` | Pharmacy, medications |
| 💰 | `MedicalFinanceIcon` | `InsuranceIcon` | Finance, insurance, billing |
| 🔒 | `SecureLockIcon` | `PrivacyIcon` | Security, privacy, HIPAA |
| 📁 | `MedicalFileIcon` | `FileIcon` | Medical records, files |
| ❤️ | `MedicalHeartIcon` | `VitalSignsIcon` | Vital signs, health metrics |
| 📊 | `MedicalChartIcon` | `AnalyticsIcon` | Charts, analytics, reports |
| 📝 | `MedicalRecordIcon` | `RecordIcon` | Clinical records, notes |

## Usage

### Basic Import

```tsx
import { PatientProfileIcon, StethoscopeIcon } from '@/components/icons';

// Or use aliases
import { PatientIcon, ConsultationIcon } from '@/components/icons';
```

### Basic Usage

```tsx
// Default size (24x24px)
<PatientProfileIcon />

// Custom size
<PatientProfileIcon size={32} />

// Custom styling
<PatientProfileIcon className="text-primary" />

// With custom stroke width
<PatientProfileIcon strokeWidth={2.5} />
```

### With Buttons

```tsx
import { Button } from '@/components/ui/button';
import { StethoscopeIcon } from '@/components/icons';

<Button>
  <StethoscopeIcon className="h-4 w-4" />
  Consulta
</Button>
```

### In Lists/Menus

```tsx
import { MedicalCalendarIcon, PrescriptionPadIcon } from '@/components/icons';

<nav>
  <a href="/appointments">
    <MedicalCalendarIcon className="h-5 w-5" />
    Agendamentos
  </a>
  <a href="/prescriptions">
    <PrescriptionPadIcon className="h-5 w-5" />
    Prescrições
  </a>
</nav>
```

### With Design System Colors

```tsx
import { LaboratoryFlaskIcon } from '@/components/icons';

// Uses current text color
<LaboratoryFlaskIcon className="text-primary" />

// With hover state
<LaboratoryFlaskIcon className="text-muted-foreground hover:text-primary transition-colors" />
```

## Icon Props

All icons accept these props:

```typescript
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;      // Tailwind classes for styling
  size?: number;           // Icon size (default: 24)
  strokeWidth?: number;    // Stroke width (default: 2)
}
```

## Design Specifications

### Dimensions
- **Base Size**: 24x24px viewBox
- **Stroke Width**: 2px default
- **Line Caps**: Round (`stroke-linecap="round"`)
- **Line Joins**: Round (`stroke-linejoin="round"`)

### Styling
- **Fill**: None (outline style)
- **Stroke**: Current text color (inherits from parent)
- **Opacity**: Used for subtle details (20-80%)

### Medical Elements
- Medical identifiers are subtle and integrated
- Uses circles, crosses, and badges for medical context
- Maintains professional appearance

## Best Practices

### Size Guidelines
- **Small**: 16px (sm icons, badges)
- **Default**: 24px (standard use)
- **Large**: 32px (hero sections, cards)
- **Extra Large**: 48px (landing pages, feature highlights)

### Color Usage
```tsx
// Primary actions
<StethoscopeIcon className="text-primary" />

// Secondary actions
<MedicalCalendarIcon className="text-secondary" />

// Muted/inactive
<PrescriptionPadIcon className="text-muted-foreground" />

// Success states
<MedicalHeartIcon className="text-success" />

// Error/Alert states
<SecureLockIcon className="text-destructive" />
```

### Accessibility
All icons include:
- `aria-hidden="true"` (screen readers should read text, not icons)
- Proper semantic SVG structure
- Support for focus states when interactive

## Customization

### Extending Icons

You can extend icons with additional props:

```tsx
<PatientProfileIcon
  size={32}
  strokeWidth={2.5}
  className="text-primary hover:text-primary-accent transition-colors"
  onClick={() => handleClick()}
/>
```

### Creating Variants

Use the base icon system to create variants:

```tsx
const PatientProfileIconFilled = ({ ...props }) => (
  <PatientProfileIcon {...props} fill="currentColor" />
);
```

## Integration with Sidebar

```tsx
import { 
  PatientIcon, 
  AppointmentIcon, 
  ConsultationIcon,
  PrescriptionIcon 
} from '@/components/icons';

const menuItems = [
  { icon: PatientIcon, label: 'Pacientes', href: '/patients' },
  { icon: AppointmentIcon, label: 'Agendamentos', href: '/appointments' },
  { icon: ConsultationIcon, label: 'Consultas', href: '/consultations' },
  { icon: PrescriptionIcon, label: 'Prescrições', href: '/prescriptions' },
];
```

## Migration from Lucide Icons

Replace Lucide icons with medical icons:

```tsx
// Before
import { User, Calendar, Stethoscope } from 'lucide-react';

// After
import { PatientIcon, AppointmentIcon, ConsultationIcon } from '@/components/icons';
```

## Performance

- Icons are React components (not static SVGs)
- Minimal bundle size (SVG code only)
- No external dependencies (except React)
- Tree-shakeable exports

---

**Version**: 1.0.0  
**Last Updated**: January 2025

