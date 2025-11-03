"use client";

/* eslint-disable react/forbid-dom-props */
import React from "react";
import {
  Users,
  Video,
  DollarSign,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Shield,
  Award,
  Clock,
  TrendingUp,
  FileText,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";

interface ForProvidersSectionProps {
  className?: string;
}

export function ForProvidersSection({ className }: ForProvidersSectionProps) {
  const [showContactForm, setShowContactForm] = React.useState(false);
  const [contactFormData, setContactFormData] = React.useState({
    name: "",
    email: "",
    clinic: "",
    phone: "",
    message: "",
  });

  const benefits = [
    {
      icon: Users,
      title: "Streamlined Patient Management",
      description: "Complete EHR interface with intelligent patient organization and quick access to records",
    },
    {
      icon: Video,
      title: "Telemedicine Platform",
      description: "Secure video consultations with integrated scheduling and patient communication",
    },
    {
      icon: DollarSign,
      title: "Medical Billing & TISS",
      description: "Automated billing with TISS compliance, insurance processing, and financial dashboard",
    },
    {
      icon: BarChart3,
      title: "Clinical Decision Support",
      description: "Data-driven insights and analytics to improve patient outcomes and practice efficiency",
    },
    {
      icon: MessageSquare,
      title: "Secure Communication",
      description: "HIPAA-compliant messaging platform for team coordination and patient communication",
    },
  ];

  const valuePropositions = [
    {
      metric: "40%",
      label: "Reduction in administrative workload",
      icon: TrendingUp,
    },
    {
      metric: "95%",
      label: "Patient satisfaction rate",
      icon: Award,
    },
    {
      metric: "100%",
      label: "HIPAA compliant",
      icon: Shield,
    },
    {
      metric: "24/7",
      label: "Platform availability",
      icon: Clock,
    },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Contact form submitted:", contactFormData);
    // Reset form
    setContactFormData({
      name: "",
      email: "",
      clinic: "",
      phone: "",
      message: "",
    });
    setShowContactForm(false);
    alert("Thank you for your inquiry! We'll contact you soon.");
  };

  return (
    <section id="providers" className={cn("py-20 lg:py-24 bg-white relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <MedicalPattern variant="circuit" intensity="medium" color="#0F4C75" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F4C75] mb-4">
            Built for Healthcare Professionals
          </h2>
          <p className="text-xl text-[#5D737E] max-w-2xl mx-auto">
            Streamline your practice operations and focus on what matters most - delivering exceptional
            patient care.
          </p>
        </div>

        {/* Main Content: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          {/* Left: Doctor Dashboard Mockup */}
          <div className="relative hidden lg:block order-2 lg:order-1">
            <ProviderDashboardMockup />
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-lg bg-[#FAFBFC] border border-gray-200 hover:border-[#0F4C75] hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#0F4C75]/10 rounded-lg flex items-center justify-center group-hover:bg-[#0F4C75]/20 transition-colors">
                        <Icon className="h-6 w-6 text-[#0F4C75]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F4C75] mb-1 group-hover:text-[#1B9AAA] transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-[#5D737E] text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Value Propositions Grid */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {valuePropositions.map((prop, index) => {
              const Icon = prop.icon;
              return (
                <Card
                  key={index}
                  className="text-center border-2 border-gray-200 hover:border-[#0F4C75] hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 bg-[#0F4C75]/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-[#0F4C75]" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-[#0F4C75] mb-2">{prop.metric}</div>
                    <div className="text-sm text-[#5D737E]">{prop.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mb-16">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <TrustBadge icon={Shield} label="HIPAA Compliant" />
            <TrustBadge icon={Award} label="ISO 27001 Certified" />
            <TrustBadge icon={FileText} label="TISS Standard" />
            <TrustBadge icon={Stethoscope} label="Medical Grade Security" />
          </div>
        </div>

        {/* Efficiency Visualization */}
        <div className="mb-16">
          <Card className="border-2 border-[#0F4C75]/20 bg-gradient-to-br from-white to-[#FAFBFC]">
            <CardHeader>
              <CardTitle className="text-2xl text-[#0F4C75] text-center">
                Measure Your Practice Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EfficiencyVisualization />
            </CardContent>
          </Card>
        </div>

        {/* Call-to-Action */}
        <div className="text-center">
          <div className="inline-block">
            <h3 className="text-2xl font-bold text-[#0F4C75] mb-6">
              Transform Your Practice Today
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                size="lg"
                className="bg-[#0F4C75] hover:bg-[#0F4C75]/90 text-white px-8 py-6 h-auto text-lg font-semibold"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/login";
                  }
                }}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#0F4C75] text-[#0F4C75] hover:bg-[#0F4C75]/5 px-8 py-6 h-auto text-lg font-semibold"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                View Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#1B9AAA] text-[#1B9AAA] hover:bg-[#1B9AAA]/5 px-8 py-6 h-auto text-lg font-semibold"
                onClick={() => setShowContactForm(true)}
              >
                Enterprise Inquiry
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-[#0F4C75]">Enterprise Inquiry</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContactForm(false)}
                    className="text-[#5D737E]"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F4C75] mb-2">Name *</label>
                      <Input
                        required
                        value={contactFormData.name}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, name: e.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F4C75] mb-2">Email *</label>
                      <Input
                        type="email"
                        required
                        value={contactFormData.email}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, email: e.target.value })
                        }
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0F4C75] mb-2">
                        Clinic/Hospital *
                      </label>
                      <Input
                        required
                        value={contactFormData.clinic}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, clinic: e.target.value })
                        }
                        placeholder="Clinic name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0F4C75] mb-2">Phone</label>
                      <Input
                        type="tel"
                        value={contactFormData.phone}
                        onChange={(e) =>
                          setContactFormData({ ...contactFormData, phone: e.target.value })
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0F4C75] mb-2">Message *</label>
                    <Textarea
                      required
                      value={contactFormData.message}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, message: e.target.value })
                      }
                      placeholder="Tell us about your practice needs..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1 bg-[#0F4C75] hover:bg-[#0F4C75]/90">
                      Send Inquiry
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

// Provider Dashboard Mockup Component
function ProviderDashboardMockup() {
  return (
    <div className="relative">
      {/* Desktop Dashboard Frame */}
      <div className="relative bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
        {/* Browser Bar */}
        <div className="h-10 bg-[#0F4C75] flex items-center gap-2 px-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs text-white/80">Prontivus Dashboard</div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-4 bg-[#FAFBFC]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-[#0F4C75] text-sm">Dr. Maria Silva</div>
                <div className="text-xs text-[#5D737E]">Cardiologist</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-[#16C79A]/10 text-[#16C79A] rounded text-xs font-medium">
                12 Today
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Patients" value="284" trend="up" />
            <StatCard label="Today" value="12" />
            <StatCard label="Pending" value="3" trend="down" />
          </div>

          {/* Recent Patients Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="font-semibold text-[#0F4C75] text-sm mb-3">Today's Appointments</div>
            <div className="space-y-2">
              <PatientRow name="João Silva" time="09:00" status="confirmed" />
              <PatientRow name="Maria Santos" time="10:30" status="confirmed" />
              <PatientRow name="Pedro Oliveira" time="11:15" status="waiting" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-3">
            <ChartCard title="Revenue" />
            <ChartCard title="Patients" />
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#0F4C75]/20 rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#1B9AAA]/20 rounded-full blur-xl animate-pulse-slow" />
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <div className="text-xs text-[#5D737E] mb-1">{label}</div>
      <div className="flex items-center gap-1">
        <div className="text-lg font-bold text-[#0F4C75]">{value}</div>
        {trend === "up" && <TrendingUp className="h-3 w-3 text-[#16C79A]" />}
        {trend === "down" && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
      </div>
    </div>
  );
}

function PatientRow({
  name,
  time,
  status,
}: {
  name: string;
  time: string;
  status: "confirmed" | "waiting";
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-[#FAFBFC] rounded">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#1B9AAA]/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-[#1B9AAA]" />
        </div>
        <div>
          <div className="text-xs font-medium text-[#2D3748]">{name}</div>
          <div className="text-xs text-[#5D737E]">{time}</div>
        </div>
      </div>
      <div
        className={cn(
          "px-2 py-1 rounded text-xs",
          status === "confirmed"
            ? "bg-[#16C79A]/10 text-[#16C79A]"
            : "bg-yellow-100 text-yellow-700"
        )}
      >
        {status === "confirmed" ? "Confirmed" : "Waiting"}
      </div>
    </div>
  );
}

function ChartCard({ title }: { title: string }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200">
      <div className="text-xs font-semibold text-[#0F4C75] mb-2">{title}</div>
            <div className="flex items-end justify-between h-16 gap-1">
              {[45, 52, 48, 60, 55, 65, 58].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-[#0F4C75] to-[#1B9AAA] rounded-t"
                  style={{ height: `${height}%` } as React.CSSProperties}
                />
              ))}
            </div>
    </div>
  );
}

// Trust Badge Component
function TrustBadge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[#5D737E]">
      <div className="w-8 h-8 rounded-lg bg-[#0F4C75]/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-[#0F4C75]" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// Efficiency Visualization Component
function EfficiencyVisualization() {
  const metrics = [
    { label: "Admin Time", before: 40, after: 15 },
    { label: "Patient Care", before: 60, after: 85 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-[#0F4C75]">{metric.label}</span>
              <div className="flex gap-4 text-xs">
                <span className="text-[#5D737E]">Before: {metric.before}%</span>
                <span className="text-[#16C79A] font-semibold">After: {metric.after}%</span>
              </div>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              {/* Before bar */}
              <div
                className="absolute left-0 top-0 h-full bg-[#5D737E]"
                style={{ width: `${metric.before}%` } as React.CSSProperties}
              />
              {/* After bar */}
              <div
                className="absolute left-0 top-0 h-full bg-[#16C79A] opacity-80"
                style={{ width: `${metric.after}%` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-sm text-[#5D737E]">
        * Based on average data from Prontivus practices
      </div>
    </div>
  );
}

