/**
 * TypeScript types for the application
 */

export enum UserRole {
  ADMIN = "admin",
  SECRETARY = "secretary",
  DOCTOR = "doctor",
  PATIENT = "patient",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  clinic_id: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
  is_active?: boolean;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
  is_active?: boolean;
  clinic_id: number;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: Gender;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
  is_active?: boolean;
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CHECKED_IN = "checked_in",
  IN_CONSULTATION = "in_consultation",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface Appointment {
  id: number;
  scheduled_datetime: string;
  status: AppointmentStatus;
  appointment_type?: string;
  notes?: string;
  reason?: string;
  diagnosis?: string;
  treatment_plan?: string;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  duration_minutes?: number;
  created_at: string;
  updated_at?: string;
  patient_name?: string;
  doctor_name?: string;
}

export interface AppointmentCreate {
  scheduled_datetime: string;
  appointment_type?: string;
  notes?: string;
  reason?: string;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
}

export interface AppointmentUpdate {
  scheduled_datetime?: string;
  appointment_type?: string;
  notes?: string;
  reason?: string;
  diagnosis?: string;
  treatment_plan?: string;
  patient_id?: number;
  doctor_id?: number;
}

export interface Doctor {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

// ==================== Financial Types ====================

export enum ServiceCategory {
  CONSULTATION = "consultation",
  PROCEDURE = "procedure",
  EXAM = "exam",
  MEDICATION = "medication",
  OTHER = "other"
}

export enum InvoiceStatus {
  DRAFT = "draft",
  ISSUED = "issued",
  PAID = "paid",
  CANCELLED = "cancelled"
}

export interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  code?: string;
  price: number;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceLine {
  id: number;
  service_item_id?: number;
  procedure_id?: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  total_price?: number; // Alias for line_total for backward compatibility
  description?: string;
  created_at: string;
  service_item?: ServiceItem;
  procedure?: {
    id: number;
    name: string;
  };
}

export interface Invoice {
  id: number;
  patient_id: number;
  appointment_id?: number;
  issue_date: string;
  due_date?: string;
  status: InvoiceStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  patient_name?: string;
  appointment_date?: string;
  doctor_name?: string;
  invoice_lines: InvoiceLine[];
  payments?: Payment[];
}

export interface ServiceItemCreate {
  name: string;
  description?: string;
  code?: string;
  price: number;
  category: ServiceCategory;
  is_active?: boolean;
}

export interface InvoiceLineCreate {
  service_item_id: number;
  quantity: number;
  unit_price: number;
  description?: string;
}

export interface InvoiceCreate {
  patient_id: number;
  appointment_id?: number;
  due_date?: string;
  notes?: string;
  service_items: InvoiceLineCreate[];
}

export interface InvoiceFromAppointmentCreate {
  appointment_id: number;
  service_items: InvoiceLineCreate[];
  due_date?: string;
  notes?: string;
}

// ==================== Inventory/Stock Types ====================

export enum ProductCategory {
  MEDICATION = "medication",
  MEDICAL_SUPPLY = "medical_supply",
  EQUIPMENT = "equipment",
  CONSUMABLE = "consumable",
  INSTRUMENT = "instrument",
  OTHER = "other"
}

export enum StockMovementType {
  IN = "in",
  OUT = "out",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer",
  EXPIRED = "expired",
  DAMAGED = "damaged"
}

export enum StockMovementReason {
  PURCHASE = "purchase",
  SALE = "sale",
  USAGE = "usage",
  RETURN = "return",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer",
  EXPIRED = "expired",
  DAMAGED = "damaged",
  THEFT = "theft",
  DONATION = "donation",
  OTHER = "other"
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: ProductCategory;
  supplier?: string;
  min_stock: number;
  current_stock: number;
  unit_price?: number;
  unit_of_measure: string;
  barcode?: string;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
  stock_status: string; // 'low', 'normal', 'out_of_stock'
}

export interface ProductCreate {
  name: string;
  description?: string;
  category: ProductCategory;
  supplier?: string;
  min_stock: number;
  current_stock?: number;
  unit_price?: number;
  unit_of_measure?: string;
  barcode?: string;
  is_active?: boolean;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  category?: ProductCategory;
  supplier?: string;
  min_stock?: number;
  unit_price?: number;
  unit_of_measure?: string;
  barcode?: string;
  is_active?: boolean;
}

export interface StockMovement {
  id: number;
  product_id: number;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  description?: string;
  related_id?: number;
  related_type?: string;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
  clinic_id: number;
  created_by?: number;
  timestamp: string;
  product_name?: string;
  creator_name?: string;
}

export interface StockMovementCreate {
  product_id: number;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  description?: string;
  related_id?: number;
  related_type?: string;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
}

export interface StockAdjustmentCreate {
  product_id: number;
  new_quantity: number;
  reason: StockMovementReason;
  description?: string;
  reference_number?: string;
}

export interface StockAdjustmentResponse {
  product_id: number;
  old_quantity: number;
  new_quantity: number;
  difference: number;
  movement_id: number;
  message: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  current_stock: number;
  min_stock: number;
  category: ProductCategory;
  days_until_out?: number;
}

export interface StockSummary {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_value: number;
  recent_movements: number;
  pending_alerts: number;
}

export enum UrgencyLevel {
  ROUTINE = "routine",
  URGENT = "urgent",
  EMERGENCY = "emergency",
}

export interface ClinicalRecord {
  id: number;
  appointment_id: number;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClinicalRecordCreate {
  appointment_id: number;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface ClinicalRecordUpdate {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface Prescription {
  id: number;
  clinical_record_id: number;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  issued_date: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PrescriptionCreate {
  clinical_record_id: number;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  is_active?: boolean;
}

export interface PrescriptionUpdate {
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  is_active?: boolean;
}

export interface ExamRequest {
  id: number;
  clinical_record_id: number;
  exam_type: string;
  description?: string;
  reason?: string;
  urgency: UrgencyLevel;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExamRequestCreate {
  clinical_record_id: number;
  exam_type: string;
  description?: string;
  reason?: string;
  urgency?: UrgencyLevel;
}

export interface ExamRequestUpdate {
  exam_type?: string;
  description?: string;
  reason?: string;
  urgency?: UrgencyLevel;
  is_completed?: boolean;
  completed_at?: string;
}

// ==================== Procedure Types ====================

export interface Procedure {
  id: number;
  name: string;
  description?: string;
  duration: number; // Duration in minutes
  cost: number;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
  procedure_products: ProcedureProduct[];
}

export interface ProcedureCreate {
  name: string;
  description?: string;
  duration?: number;
  cost?: number;
  is_active?: boolean;
}

export interface ProcedureUpdate {
  name?: string;
  description?: string;
  duration?: number;
  cost?: number;
  is_active?: boolean;
}

export interface ProcedureProduct {
  id: number;
  procedure_id: number;
  product_id: number;
  quantity_required: number;
  notes?: string;
  created_at: string;
  product_name?: string;
  product_unit_of_measure?: string;
}

export interface ProcedureProductCreate {
  product_id: number;
  quantity_required: number;
  notes?: string;
}

export interface ProcedureProductUpdate {
  quantity_required?: number;
  notes?: string;
}

export interface ProcedureWithProductsCreate {
  procedure: ProcedureCreate;
  products: ProcedureProductCreate[];
}

// ==================== Payment Types ====================

export enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  BANK_TRANSFER = "bank_transfer",
  PIX = "pix",
  CHECK = "check",
  INSURANCE = "insurance",
  OTHER = "other"
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number?: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
}

export interface PaymentCreate {
  invoice_id: number;
  amount: number;
  method: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface PaymentUpdate {
  amount?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  reference_number?: string;
  notes?: string;
}

// ==================== Insurance Plan Types ====================

export interface InsurancePlan {
  id: number;
  name: string;
  insurance_company: string;
  ans_registration: string;
  coverage_percentage: number;
  requires_preauth: boolean;
  max_annual_limit?: number;
  max_procedure_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InsurancePlanCreate {
  name: string;
  insurance_company: string;
  ans_registration: string;
  coverage_percentage: number;
  requires_preauth?: boolean;
  max_annual_limit?: number;
  max_procedure_limit?: number;
  is_active?: boolean;
}

export interface InsurancePlanUpdate {
  name?: string;
  insurance_company?: string;
  ans_registration?: string;
  coverage_percentage?: number;
  requires_preauth?: boolean;
  max_annual_limit?: number;
  max_procedure_limit?: number;
  is_active?: boolean;
}

// ==================== Pre-Authorization Types ====================

export enum PreAuthStatus {
  PENDING = "pending",
  APPROVED = "approved",
  DENIED = "denied",
  EXPIRED = "expired",
  CANCELLED = "cancelled"
}

export interface PreAuthRequest {
  id: number;
  patient_id: number;
  insurance_plan_id: number;
  procedure_code: string;
  procedure_description: string;
  requested_amount: number;
  approved_amount?: number;
  status: PreAuthStatus;
  request_date: string;
  response_date?: string;
  authorization_number?: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  patient_name?: string;
  insurance_plan_name?: string;
  creator_name?: string;
}

export interface PreAuthRequestCreate {
  patient_id: number;
  insurance_plan_id: number;
  procedure_code: string;
  procedure_description: string;
  requested_amount: number;
  notes?: string;
}

export interface PreAuthRequestUpdate {
  procedure_code?: string;
  procedure_description?: string;
  requested_amount?: number;
  approved_amount?: number;
  status?: PreAuthStatus;
  authorization_number?: string;
  valid_until?: string;
  notes?: string;
}

// ==================== Accounts Receivable Types ====================

export interface AccountsReceivableSummary {
  total_outstanding: number;
  current: number;
  days_31_60: number;
  days_61_90: number;
  over_90_days: number;
  total_invoices: number;
}

export interface AgingReportItem {
  invoice_id: number;
  patient_name: string;
  invoice_date: string;
  due_date?: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  status: string;
}

export interface AgingReport {
  summary: AccountsReceivableSummary;
  items: AgingReportItem[];
  generated_at: string;
}