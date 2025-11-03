# Medical Micro-Interactions

Sophisticated animations and micro-interactions designed for healthcare applications with medical-themed timing and accessibility support.

## Components

### Loading States

#### HeartbeatLoader
Medical-themed heartbeat animation for loading states.

```tsx
import { HeartbeatLoader } from "@/components/animations";

<HeartbeatLoader size="md" color="primary" />
```

#### PulseLoader
Three-dot pulse animation for loading indicators.

```tsx
import { PulseLoader } from "@/components/animations";

<PulseLoader size="md" color="primary" />
```

#### MedicalSkeleton
Skeleton screens for various medical content types.

```tsx
import { MedicalSkeleton } from "@/components/animations";

<MedicalSkeleton type="patient-card" />
<MedicalSkeleton type="prescription" />
<MedicalSkeleton type="appointment" />
<MedicalSkeleton type="chart" />
<MedicalSkeleton type="table-row" />
```

### Success/Error States

#### SuccessCheckmark
Animated checkmark for successful actions.

```tsx
import { SuccessCheckmark } from "@/components/animations";

<SuccessCheckmark 
  size="md" 
  show={isSuccess}
  onAnimationComplete={() => console.log("Done!")}
/>
```

#### ErrorState
Medical-context appropriate error messages with recovery suggestions.

```tsx
import { ErrorState } from "@/components/animations";

<ErrorState
  title="Erro ao carregar dados"
  message="Não foi possível conectar ao servidor."
  severity="error"
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>
```

### Transitions & Animations

#### PageTransition
Smooth page entry animations.

```tsx
import { PageTransition } from "@/components/animations";

<PageTransition>
  <YourPageContent />
</PageTransition>
```

#### CardHover
Hover effects for cards with medical timing.

```tsx
import { CardHover } from "@/components/animations";

<CardHover hoverEffect="elevate">
  <Card>Content</Card>
</CardHover>
```

#### ListItemAnimation
Staggered animations for list items.

```tsx
import { ListItemAnimation } from "@/components/animations";

{items.map((item, index) => (
  <ListItemAnimation key={item.id} index={index}>
    <ListItem data={item} />
  </ListItemAnimation>
))}
```

#### ModalAnimation
Professional modal appearances.

```tsx
import { ModalAnimation } from "@/components/animations";

<ModalAnimation isOpen={isOpen}>
  <ModalContent />
</ModalAnimation>
```

### Medical-Specific Interactions

#### HeartbeatAlert
Heartbeat animation for critical alerts.

```tsx
import { HeartbeatAlert } from "@/components/animations";

<HeartbeatAlert severity="critical">
  <p>Paciente em estado crítico!</p>
</HeartbeatAlert>
```

#### PulseResult
Pulse effect for new test results.

```tsx
import { PulseResult } from "@/components/animations";

<PulseResult isNew={true} isAbnormal={false}>
  <TestResult data={result} />
</PulseResult>
```

#### TimelineScroll
Smooth scrolling for medical timelines.

```tsx
import { TimelineScroll } from "@/components/animations";

<TimelineScroll smoothScroll={true}>
  <TimelineContent />
</TimelineScroll>
```

#### DragDropAppointment
Drag-and-drop for appointment rescheduling.

```tsx
import { DragDropAppointment } from "@/components/animations";

<DragDropAppointment onDrop={handleDrop}>
  <AppointmentCard />
</DragDropAppointment>
```

## Toast Notifications

### useMedicalToast Hook

Medical-themed toast notifications with urgency colors.

```tsx
import { useMedicalToast } from "@/hooks/useToast";

const { showToast } = useMedicalToast();

// Success
showToast({
  title: "Prescrição salva",
  description: "Medicamentos registrados com sucesso.",
  severity: "success",
});

// Urgent
showToast({
  title: "Alerta crítico!",
  description: "Paciente necessita atenção imediata.",
  severity: "urgent",
  duration: 6000,
  action: {
    label: "Ver paciente",
    onClick: () => navigateToPatient(),
  },
});

// Error
showToast({
  title: "Erro ao salvar",
  description: "Verifique sua conexão e tente novamente.",
  severity: "error",
});
```

## Animation Timing

All animations use medical timing - calm, deliberate movements:

- **Fast**: 200ms (immediate feedback)
- **Standard**: 300ms (most transitions)
- **Slow**: 500ms (page transitions, modal appearances)

## Accessibility

All animations respect `prefers-reduced-motion`:

- Animations are disabled when user prefers reduced motion
- Essential transitions remain but use shorter durations
- No flashing or rapid movements

## Usage Examples

### Loading State with Skeleton

```tsx
{isLoading ? (
  <div className="space-y-4">
    <MedicalSkeleton type="patient-card" />
    <MedicalSkeleton type="patient-card" />
    <MedicalSkeleton type="patient-card" />
  </div>
) : (
  <PatientList patients={patients} />
)}
```

### Error with Retry

```tsx
{error ? (
  <ErrorState
    title="Erro ao carregar pacientes"
    message={error.message}
    severity="error"
    onRetry={refetch}
  />
) : (
  <PatientList patients={patients} />
)}
```

### Success Feedback

```tsx
const [showSuccess, setShowSuccess] = useState(false);

{showSuccess && (
  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
    <SuccessCheckmark 
      size="md"
      show={showSuccess}
      onAnimationComplete={() => setShowSuccess(false)}
    />
    <span>Dados salvos com sucesso!</span>
  </div>
)}
```

### Animated List

```tsx
<PageTransition>
  <div className="space-y-2">
    {patients.map((patient, index) => (
      <ListItemAnimation key={patient.id} index={index}>
        <CardHover hoverEffect="elevate">
          <PatientCard patient={patient} />
        </CardHover>
      </ListItemAnimation>
    ))}
  </div>
</PageTransition>
```

### Critical Alert

```tsx
<HeartbeatAlert severity="critical">
  <div>
    <h3 className="font-semibold">Alerta Crítico</h3>
    <p>Paciente requer atenção imediata</p>
  </div>
</HeartbeatAlert>
```

## CSS Classes

Additional utility classes available:

- `.medical-transition` - Standard medical timing (300ms)
- `.medical-transition-slow` - Slow medical timing (500ms)
- `.shimmer` - Progressive loading shimmer effect
- `.dragging` - Drag state styling
- `.drag-over` - Drop target styling

## Best Practices

1. **Use appropriate severity**: Use `urgent` only for critical medical alerts
2. **Respect reduced motion**: All animations automatically handle this
3. **Medical timing**: Use calm, deliberate movements (300-500ms)
4. **Loading states**: Always show skeleton screens, not just spinners
5. **Error recovery**: Always provide retry options
6. **Success feedback**: Show confirmation for important actions

## Performance

- Animations use CSS transforms for GPU acceleration
- List animations use Intersection Observer for performance
- Reduced motion preferences are respected
- Animations pause when tab is not visible

