# Medical Document Templates

Professional healthcare document templates with modern branding and security features for the Prontivus system.

## Components

### 1. PrescriptionTemplate
Professional prescription document with:
- Prontivus header with logo
- Patient information section
- Medication table with dosage, frequency, duration, and instructions
- Safety information and warnings
- Doctor digital signature section
- QR code for pharmacy verification
- Print-ready formatting

**Usage:**
```tsx
import { PrescriptionTemplate } from '@/components/documents';

<PrescriptionTemplate
  prescriptions={prescriptionsArray}
  patient={patient}
  doctor={doctor}
  clinicName="Prontivus - Clínica de Saúde"
  clinicAddress="Rua Exemplo, 123"
  clinicPhone="(11) 1234-5678"
  clinicCRM="CRM 123456"
  onPrint={() => window.print()}
  onDownload={() => {/* Generate PDF */}}
/>
```

### 2. MedicalCertificateTemplate
Professional medical certificate with:
- Security features (pattern backgrounds, anti-forgery borders)
- Patient information
- Certificate type (medical leave, fitness, medical exam, custom)
- Medical justification
- Validity period with visual timeline
- Doctor digital signature
- Security verification features

**Usage:**
```tsx
import { MedicalCertificateTemplate } from '@/components/documents';

<MedicalCertificateTemplate
  patient={patient}
  doctor={doctor}
  certificateType="medical_leave"
  justification="Paciente apresenta sintomas de gripe..."
  startDate={new Date()}
  endDate={addDays(new Date(), 3)}
  clinicName="Prontivus - Clínica de Saúde"
  clinicCRM="CRM 123456"
  onPrint={() => window.print()}
/>
```

### 3. LaboratoryRequestTemplate
Modern laboratory test ordering form with:
- Patient information
- Urgency level selector (routine, urgent, emergency)
- Common test panels (hematology, biochemistry, serology, urinalysis)
- Custom test search and addition
- Clinical reason textarea
- Selected tests summary
- Doctor signature section

**Usage:**
```tsx
import { LaboratoryRequestTemplate } from '@/components/documents';

<LaboratoryRequestTemplate
  patient={patient}
  doctor={doctor}
  clinicName="Prontivus - Clínica de Saúde"
  clinicCRM="CRM 123456"
  onPrint={() => window.print()}
/>
```

### 4. LabResultTemplate
Professional laboratory result report with:
- Patient information and collection/report dates
- Results table with status indicators (normal/abnormal/critical)
- Trend analysis with previous values
- Color-coded result values
- Doctor comments section
- Recommendations section
- Print-ready formatting

**Usage:**
```tsx
import { LabResultTemplate } from '@/components/documents';

<LabResultTemplate
  patient={patient}
  doctor={doctor}
  results={labResults}
  collectionDate={new Date()}
  reportDate={new Date()}
  laboratoryName="Laboratório Prontivus"
  doctorComments="Valores dentro da normalidade..."
  recommendations="Manter acompanhamento trimestral"
  onPrint={() => window.print()}
/>
```

## Design Features

### Visual Design
- **Color Scheme**: Medical blue (#0F4C75) with professional grays
- **Typography**: Clean, readable fonts with consistent hierarchy
- **Layout**: Clean white cards with subtle shadows and borders
- **Patterns**: Subtle medical patterns in document backgrounds

### Security Features
- Unique document IDs for verification
- QR codes for prescription verification
- Security borders on certificates
- Digital signature sections
- Verification URLs

### Print Optimization
All templates include print-specific CSS:
- Print action buttons hidden when printing
- Optimized page breaks
- Black text on white backgrounds for printing
- No shadows or colors in print mode

## Styling

Document-specific CSS classes are defined in `globals.css`:
- `.prescription-document` - Prescription template container
- `.certificate-document` - Certificate template container
- `.lab-request-document` - Lab request template container
- `.lab-result-document` - Lab result template container
- `.prescription-pattern` - Medical pattern background
- `.certificate-pattern` - Certificate security pattern
- `.certificate-security-border` - Anti-forgery border

## Integration

### Adding to Forms
Document templates can be integrated into consultation forms:

```tsx
// In prescription form
const handleGeneratePrescription = () => {
  const prescriptionsArray = prescriptions.map(p => ({
    ...p,
    // Transform data as needed
  }));
  
  // Navigate to prescription view or open modal
  router.push(`/medico/prescriptions/view/${prescriptionId}`);
};
```

### PDF Generation
For PDF generation, use libraries like:
- `react-pdf` / `@react-pdf/renderer`
- `jsPDF` with `html2canvas`
- Browser's print-to-PDF functionality

Example:
```tsx
const handleDownloadPDF = () => {
  window.print(); // Opens browser print dialog
  // Or use PDF library to generate downloadable file
};
```

## Best Practices

1. **Data Validation**: Ensure all required fields are present before rendering
2. **Error Handling**: Provide fallbacks for missing data
3. **Print Testing**: Test print layout on different browsers and paper sizes
4. **Accessibility**: Maintain readable fonts and contrast ratios
5. **Security**: Always include verification IDs and QR codes for important documents
6. **Localization**: Use `date-fns` with locale support for date formatting

## Future Enhancements

- PDF export functionality
- QR code image generation (currently placeholder)
- Digital signature integration
- Document versioning and history
- Template customization per clinic
- Multi-language support

