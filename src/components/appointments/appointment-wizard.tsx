"use client";

import * as React from "react";
import { Patient, Doctor, AppointmentCreate } from "@/lib/types";
import { StepIndicator } from "@/components/medical-forms/step-indicator";
import { FormCard } from "@/components/medical-forms/form-card";
import { PatientSelector } from "./patient-selector";
import { TimeSlotSelector } from "./time-slot-selector";
import { Button } from "@/components/ui/button";
import { MedicalInput } from "@/components/medical-forms/medical-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar as CalendarIcon,
  Stethoscope,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { appointmentsApi } from "@/lib/appointments-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AppointmentWizardProps {
  doctors: Doctor[];
  recentPatients?: Patient[];
  defaultDate?: Date;
  clinicId: number;
  onSubmit: (data: AppointmentCreate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type AppointmentType = 'consultation' | 'procedure' | 'follow-up' | 'emergency';
type PaymentMethod = "cash" | "credit_card" | "debit_card" | "bank_transfer" | "pix" | "check" | "insurance" | "other";

const steps = [
  { label: "Paciente", description: "Selecione o paciente" },
  { label: "Médico", description: "Escolha o médico e horário" },
  { label: "Detalhes", description: "Tipo e informações" },
  { label: "Confirmar", description: "Revise e confirme" },
];

const appointmentTypes = [
  { value: 'consultation', label: 'Consulta Geral', icon: Stethoscope },
  { value: 'procedure', label: 'Procedimento', icon: Stethoscope },
  { value: 'follow-up', label: 'Retorno', icon: CalendarIcon },
  { value: 'emergency', label: 'Emergência', icon: AlertCircle },
];

export function AppointmentWizard({
  doctors,
  recentPatients = [],
  defaultDate,
  clinicId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AppointmentWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedDate, setSelectedDate] = React.useState<Date>(defaultDate || new Date());
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = React.useState<Doctor | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string>("");
  const [appointmentType, setAppointmentType] = React.useState<AppointmentType>('consultation');
  const [notes, setNotes] = React.useState("");
  const [urgent, setUrgent] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | "">("");
  const [consultationPrice, setConsultationPrice] = React.useState<string>("");
  const [createInvoice, setCreateInvoice] = React.useState(false);
  const [doctorProcedures, setDoctorProcedures] = React.useState<Array<{
    id: number;
    name: string;
    description?: string;
    code?: string;
    price: number;
    category: string;
    type: string;
  }>>([]);
  const [loadingProcedures, setLoadingProcedures] = React.useState(false);
  const [selectedProcedure, setSelectedProcedure] = React.useState<number | null>(null);
  const [patientHistory, setPatientHistory] = React.useState<{
    last_appointment_date?: string;
    last_appointment_type?: string;
    returns_count_this_month: number;
    returns_count_total: number;
    last_consultation_date?: string;
    suggested_date?: string;
    message?: string;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // Load patient history when patient is selected
  React.useEffect(() => {
    if (selectedPatient?.id) {
      loadPatientHistory(selectedPatient.id);
    } else {
      setPatientHistory(null);
    }
  }, [selectedPatient?.id, selectedDoctor?.id]);

  const loadPatientHistory = async (patientId: number) => {
    try {
      setLoadingHistory(true);
      const history = await appointmentsApi.getPatientHistory(patientId, selectedDoctor?.id);
      setPatientHistory(history);
      
      // Update suggested date if available
      if (history.suggested_date) {
        const suggested = new Date(history.suggested_date);
        setSelectedDate(suggested);
      }
    } catch (error) {
      console.error("Failed to load patient history:", error);
      setPatientHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load doctor procedures when doctor is selected
  React.useEffect(() => {
    if (selectedDoctor?.id) {
      loadDoctorProcedures(selectedDoctor.id);
    } else {
      setDoctorProcedures([]);
      setSelectedProcedure(null);
    }
  }, [selectedDoctor?.id]);

  const loadDoctorProcedures = async (doctorId: number) => {
    try {
      setLoadingProcedures(true);
      const procedures = await appointmentsApi.getDoctorProcedures(doctorId);
      setDoctorProcedures(procedures);
    } catch (error) {
      console.error("Failed to load doctor procedures:", error);
      setDoctorProcedures([]);
    } finally {
      setLoadingProcedures(false);
    }
  };

  // Mock doctor schedule - replace with API
  const doctorSchedule = React.useMemo(() => {
    if (!selectedDoctor) return null;
    
    return {
      doctorId: selectedDoctor.id,
      doctorName: `Dr(a). ${selectedDoctor.first_name} ${selectedDoctor.last_name}`,
      slots: [], // Will be populated from API
      breakStart: "12:00",
      breakEnd: "13:00",
    };
  }, [selectedDoctor]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedPatient;
      case 2:
        return !!selectedDoctor && !!selectedTime;
      case 3:
        return !!appointmentType;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const appointmentData: AppointmentCreate = {
      patient_id: selectedPatient.id,
      doctor_id: selectedDoctor.id,
      clinic_id: clinicId,
      scheduled_datetime: appointmentDate.toISOString(),
      appointment_type: appointmentType,
      notes: notes || undefined,
      consultation_price: (() => {
        // Use selected procedure price if available, otherwise use consultation price or doctor's fee
        if (selectedProcedure) {
          const procedure = doctorProcedures.find(p => p.id === selectedProcedure);
          return procedure ? procedure.price : (consultationPrice ? parseFloat(consultationPrice) : (selectedDoctor?.consultation_fee || undefined));
        }
        return consultationPrice ? parseFloat(consultationPrice) : (selectedDoctor?.consultation_fee || undefined);
      })(),
      payment_method: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
      create_invoice: createInvoice,
    };

    try {
      await onSubmit(appointmentData);
    } catch (error) {
      throw error;
    }
  };

  // Get suggested follow-up date (30 days from appointment)
  const suggestedFollowUp = React.useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const followUpDate = new Date(appointmentDate);
    followUpDate.setDate(followUpDate.getDate() + 30);
    return followUpDate;
  }, [selectedDate, selectedTime]);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card className="medical-card">
        <CardContent className="pt-6">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[500px]">
        {/* Step 1: Patient Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <FormCard
              title="Selecione o Paciente"
              icon={User}
              variant="medical"
            >
              <PatientSelector
                value={selectedPatient || undefined}
                onChange={setSelectedPatient}
                recentPatients={recentPatients}
              />
            </FormCard>
            
            {/* Patient History Notification */}
            {selectedPatient && (
              <div className="space-y-2">
                {loadingHistory ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Carregando histórico...</AlertTitle>
                    <AlertDescription>Buscando informações sobre as últimas consultas do paciente.</AlertDescription>
                  </Alert>
                ) : patientHistory?.message ? (
                  <Alert className={patientHistory.returns_count_this_month > 1 ? "border-orange-500 bg-orange-50" : ""}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Histórico do Paciente</AlertTitle>
                    <AlertDescription className="whitespace-pre-line">
                      {patientHistory.message}
                      {patientHistory.returns_count_this_month > 1 && (
                        <div className="mt-2 font-semibold text-orange-700">
                          ⚠️ Requer aprovação médica para múltiplos retornos no mesmo mês.
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Doctor & Time Selection */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <FormCard
              title="Selecione o Médico"
              icon={Stethoscope}
              variant="medical"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left",
                      selectedDoctor?.id === doctor.id
                        ? "border-[#0F4C75] bg-[#0F4C75]/5 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#0F4C75]/10 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-[#0F4C75]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          Dr(a). {doctor.first_name} {doctor.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(doctor as any).specialty || "Clínico Geral"}
                        </p>
                      </div>
                      {selectedDoctor?.id === doctor.id && (
                        <CheckCircle2 className="h-5 w-5 text-[#0F4C75]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </FormCard>

            {selectedDoctor && (
              <>
                {/* Procedures Picklist */}
                {doctorProcedures.length > 0 && (
                  <FormCard
                    title="Procedimentos Disponíveis"
                    icon={Stethoscope}
                    variant="medical"
                  >
                    {loadingProcedures ? (
                      <div className="text-center py-4 text-gray-500">Carregando procedimentos...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {doctorProcedures.map((procedure) => (
                          <button
                            key={procedure.id}
                            type="button"
                            onClick={() => setSelectedProcedure(procedure.id)}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all text-left",
                              selectedProcedure === procedure.id
                                ? "border-[#0F4C75] bg-[#0F4C75]/5"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{procedure.name}</p>
                                {procedure.description && (
                                  <p className="text-xs text-gray-500 mt-1">{procedure.description}</p>
                                )}
                                {procedure.code && (
                                  <p className="text-xs text-gray-400 mt-1">Código: {procedure.code}</p>
                                )}
                              </div>
                              <div className="ml-4 text-right">
                                <p className="font-semibold text-[#0F4C75]">
                                  R$ {procedure.price.toFixed(2).replace('.', ',')}
                                </p>
                                {selectedProcedure === procedure.id && (
                                  <CheckCircle2 className="h-4 w-4 text-[#0F4C75] mt-1 ml-auto" />
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </FormCard>
                )}

                {doctorSchedule && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1">
                      <FormCard title="Selecione a Data" icon={CalendarIcon}>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="rounded-lg border"
                        />
                      </FormCard>
                    </div>
                    <div className="lg:col-span-2">
                      <TimeSlotSelector
                        date={selectedDate}
                        schedule={doctorSchedule}
                        selectedTime={selectedTime}
                        onTimeSelect={setSelectedTime}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Appointment Details */}
        {currentStep === 3 && (
          <FormCard
            title="Detalhes da Consulta"
            icon={CalendarIcon}
            variant="medical"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Consulta <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {appointmentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setAppointmentType(type.value as AppointmentType)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          appointmentType === type.value
                            ? "border-[#0F4C75] bg-[#0F4C75]/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn(
                            "h-5 w-5",
                            appointmentType === type.value ? "text-[#0F4C75]" : "text-gray-400"
                          )} />
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
                  className="min-h-[100px] rounded-lg border-2"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-red-200 bg-red-50/30">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 rounded"
                />
                <label htmlFor="urgent" className="text-sm font-medium text-red-700 cursor-pointer">
                  Marcar como urgente
                </label>
              </div>

              {/* Payment Information */}
              {selectedDoctor && (
                <div className="space-y-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50/30">
                  <h3 className="font-semibold text-gray-900">Informações de Pagamento</h3>
                  
                  {selectedDoctor.consultation_fee && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Valor da Consulta (R$)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={consultationPrice || selectedDoctor.consultation_fee}
                          onChange={(e) => setConsultationPrice(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#0F4C75] focus:outline-none"
                          placeholder={selectedDoctor.consultation_fee?.toString() || "0.00"}
                        />
                        <span className="text-sm text-gray-500">
                          (Padrão: R$ {selectedDoctor.consultation_fee?.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Método de Pagamento
                    </label>
                    <Select 
                      value={paymentMethod} 
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod | "")}
                    >
                      <SelectTrigger className="rounded-lg border-2">
                        <SelectValue placeholder="Selecione o método de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                        <SelectItem value="insurance">Convênio</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="create_invoice"
                      checked={createInvoice}
                      onChange={(e) => setCreateInvoice(e.target.checked)}
                      className="h-4 w-4 text-[#0F4C75] focus:ring-[#0F4C75] rounded"
                    />
                    <label htmlFor="create_invoice" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Criar fatura automaticamente
                    </label>
                  </div>
                </div>
              )}
            </div>
          </FormCard>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <FormCard
            title="Confirmar Agendamento"
            icon={CheckCircle2}
            variant="highlighted"
          >
            <div className="space-y-4">
              {/* Appointment Summary */}
              <div className="space-y-3">
                <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Paciente</p>
                      <p className="font-semibold text-gray-900">
                        {selectedPatient?.first_name} {selectedPatient?.last_name}
                      </p>
                      {selectedPatient?.cpf && (
                        <p className="text-sm text-gray-600">CPF: {selectedPatient.cpf}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Médico</p>
                      <p className="font-semibold text-gray-900">
                        Dr(a). {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                      </p>
                      {selectedDoctor?.consultation_fee && (
                        <p className="text-sm text-gray-600">
                          Taxa padrão: R$ {selectedDoctor.consultation_fee.toFixed(2)}
                        </p>
                      )}
                      {(selectedDoctor as any)?.specialty && (
                        <p className="text-sm text-gray-600">{(selectedDoctor as any).specialty}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data e Hora</p>
                      <p className="font-semibold text-gray-900">
                        {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-gray-600">{selectedTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tipo</p>
                      <Badge className="bg-[#0F4C75] text-white">
                        {appointmentTypes.find(t => t.value === appointmentType)?.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {(consultationPrice || selectedDoctor?.consultation_fee || paymentMethod) && (
                  <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                    <h4 className="font-semibold text-gray-900 mb-3">Informações de Pagamento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(consultationPrice || selectedDoctor?.consultation_fee) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Valor da Consulta</p>
                          <p className="font-semibold text-green-700 text-lg">
                            R$ {(consultationPrice ? parseFloat(consultationPrice) : selectedDoctor?.consultation_fee || 0).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {paymentMethod && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Método de Pagamento</p>
                          <p className="font-semibold text-gray-900">
                            {paymentMethod === "cash" && "Dinheiro"}
                            {paymentMethod === "credit_card" && "Cartão de Crédito"}
                            {paymentMethod === "debit_card" && "Cartão de Débito"}
                            {paymentMethod === "pix" && "PIX"}
                            {paymentMethod === "bank_transfer" && "Transferência Bancária"}
                            {paymentMethod === "check" && "Cheque"}
                            {paymentMethod === "insurance" && "Convênio"}
                            {paymentMethod === "other" && "Outro"}
                          </p>
                        </div>
                      )}
                      {createInvoice && (
                        <div className="col-span-2">
                          <Badge className="bg-blue-500 text-white">
                            Fatura será criada automaticamente
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {urgent && (
                  <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="font-semibold text-red-700">Consulta Urgente</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-up Suggestion */}
              {appointmentType === 'consultation' && suggestedFollowUp && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 mb-1">
                        Sugestão de Retorno
                      </p>
                      <p className="text-sm text-green-700">
                        Agendar retorno para: {format(suggestedFollowUp, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormCard>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? "Cancelar" : "Voltar"}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < 4 && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="bg-[#0F4C75] hover:bg-[#0F4C75]/90 gap-2"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {currentStep === 4 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#0F4C75] hover:bg-[#0F4C75]/90 gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Agendando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Agendamento
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

