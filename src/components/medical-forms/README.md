# Medical Forms Design System

A comprehensive, healthcare-focused form design system for Prontivus with medical-grade aesthetics and accessibility.

## Components

### FormCard
Container component for grouping related form fields with medical styling.

```tsx
<FormCard
  title="Informações Médicas"
  icon={Activity}
  variant="medical"
>
  {/* Form content */}
</FormCard>
```

### FormSection
Organized sections within forms with collapsible support.

```tsx
<FormSection
  title="Dados Básicos"
  icon={User}
  required
>
  {/* Form fields */}
</FormSection>
```

### MedicalInput
Enhanced input field with medical context and validation.

```tsx
<MedicalInput
  label="Pressão Arterial"
  required
  medicalContext={{
    normalRange: "90-120/60-80",
    unit: "mmHg",
    critical: false,
  }}
  error={errors.bloodPressure}
  hint="Medir após 5 minutos de repouso"
/>
```

### BloodPressureInput
Specialized input for blood pressure with normal range validation.

```tsx
<BloodPressureInput
  value={{ systolic: "120", diastolic: "80" }}
  onChange={(value) => handleChange(value)}
  error={errors.bloodPressure}
/>
```

### TemperatureInput
Temperature input with Celsius/Fahrenheit support and normal range indicators.

```tsx
<TemperatureInput
  value="36.5"
  onChange={(value) => handleChange(value)}
  unit="celsius"
/>
```

### VitalSignsInput
Complete vital signs collection component.

```tsx
<VitalSignsInput
  values={{
    bloodPressure: { systolic: "120", diastolic: "80" },
    temperature: "36.5",
    heartRate: "72",
    respiratoryRate: "16",
    oxygenSaturation: "98",
    weight: "70",
    height: "170",
  }}
  onChange={(field, value) => handleChange(field, value)}
/>
```

### ICD10Search
Typeahead search for ICD-10 codes.

```tsx
<ICD10Search
  label="CID-10"
  value={selectedCode}
  onChange={(code, description) => handleSelect(code, description)}
  required
/>
```

### StepIndicator
Multi-step form progress indicator.

```tsx
<StepIndicator
  steps={[
    { label: "Dados Pessoais", description: "Informações básicas" },
    { label: "Histórico", description: "Histórico clínico" },
    { label: "Exame", description: "Exame físico" },
  ]}
  currentStep={2}
/>
```

## Design Principles

### Accessibility
- **Large Tap Targets**: Minimum 44x44px for touch interfaces
- **High Contrast**: WCAG 2.1 AA compliant color ratios
- **Keyboard Navigation**: Full keyboard support with focus indicators
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Reduced Motion**: Respects prefers-reduced-motion

### Medical Context
- **Normal Range Indicators**: Visual indicators for vital signs
- **Critical Field Highlighting**: Red borders for critical inputs
- **Real-time Validation**: Immediate feedback for data entry
- **Medical Units**: Proper units display (mmHg, °C, bpm, etc.)

### Visual Design
- **Clean Cards**: White backgrounds with subtle shadows
- **Medical Icons**: Contextual icons for each section
- **Color Coding**: 
  - Blue: Medical data
  - Green: Normal values
  - Red: Critical/abnormal values
  - Orange: Warnings/alerts
- **Progressive Disclosure**: Collapsible sections for complex forms

## Usage Examples

### Basic Form Structure

```tsx
<FormCard title="Paciente" icon={User}>
  <FormSection title="Dados Pessoais" icon={User}>
    <MedicalInput
      label="Nome"
      required
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  </FormSection>
</FormCard>
```

### Multi-Step Form

```tsx
<StepIndicator
  steps={steps}
  currentStep={currentStep}
/>

{currentStep === 1 && <Step1Form />}
{currentStep === 2 && <Step2Form />}
```

### Vital Signs Form

```tsx
<VitalSignsInput
  values={vitals}
  onChange={(field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  }}
  errors={errors}
/>
```

## Styling

All forms use the medical design system:
- Primary color: `#0F4C75` (Medical blue)
- Success: `#16C79A` (Medical green)
- Error: `#FF6B6B` (Warm coral)
- Border radius: `8px`
- Spacing: `8px` base unit

## Future Enhancements

- Voice input integration
- Body chart for symptom location
- Medication picker with interactions
- Drag-and-drop document upload
- Advanced search and filter

