"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Shield,
  Users,
  Stethoscope,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MedicalPattern } from "@/components/assets";
import { cn } from "@/lib/utils";

interface FAQ {
  id: number;
  category: "general" | "security" | "patients" | "providers";
  question: string;
  answer: string;
}

interface FAQSectionProps {
  className?: string;
}

export function FAQSection({ className }: FAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const faqs: FAQ[] = [
    // General Questions
    {
      id: 1,
      category: "general",
      question: "What is Prontivus?",
      answer:
        "Prontivus is a comprehensive healthcare management platform designed to connect patients, doctors, and clinics in one secure, intelligent system. It provides electronic health records (EHR), appointment scheduling, telemedicine, medical billing, and analytics to streamline healthcare operations and improve patient care.",
    },
    {
      id: 2,
      category: "general",
      question: "How does Prontivus differ from other healthcare platforms?",
      answer:
        "Prontivus offers a unified platform that combines patient management, clinical documentation, financial operations, and telemedicine in one system. Unlike traditional solutions, it provides real-time analytics, TISS compliance automation, and a modern user experience designed for both healthcare providers and patients. Our platform focuses on reducing administrative burden so healthcare professionals can focus on patient care.",
    },
    {
      id: 3,
      category: "general",
      question: "What types of healthcare facilities can use Prontivus?",
      answer:
        "Prontivus is suitable for various healthcare facilities including private clinics, medical practices, hospitals, diagnostic centers, and specialty care facilities. Our platform is scalable and can be customized to meet the specific needs of small practices to large healthcare networks.",
    },
    {
      id: 4,
      category: "general",
      question: "Is there a mobile app available?",
      answer:
        "Yes, Prontivus offers mobile applications for both iOS and Android devices. The mobile app allows patients to book appointments, access medical records, receive test results, and communicate with their healthcare providers. Healthcare professionals can also access key features on mobile devices for on-the-go patient management.",
    },
    // Security & Compliance
    {
      id: 5,
      category: "security",
      question: "Is my medical data secure?",
      answer:
        "Absolutely. Prontivus employs bank-level encryption, secure data centers with 24/7 monitoring, regular security audits, and follows industry best practices for healthcare data protection. All data is encrypted both in transit and at rest, and access is strictly controlled with multi-factor authentication and role-based permissions.",
    },
    {
      id: 6,
      category: "security",
      question: "Is Prontivus HIPAA compliant?",
      answer:
        "Yes, Prontivus is fully HIPAA compliant. We maintain comprehensive administrative, physical, and technical safeguards as required by HIPAA regulations. Our platform includes features such as audit logs, access controls, data encryption, and business associate agreements (BAAs) with all partners. We undergo regular compliance audits to ensure ongoing adherence to HIPAA standards.",
    },
    {
      id: 7,
      category: "security",
      question: "What security certifications does Prontivus have?",
      answer:
        "Prontivus maintains several security certifications including ISO 27001 (Information Security Management), SOC 2 Type II (Security, Availability, and Confidentiality), and GDPR compliance for international data protection. We also undergo regular penetration testing and security assessments to ensure the highest level of data protection.",
    },
    {
      id: 8,
      category: "security",
      question: "How is data backed up?",
      answer:
        "We perform automated daily backups with point-in-time recovery capabilities. Data is replicated across multiple geographically distributed data centers to ensure high availability and disaster recovery. Our backup retention policies comply with healthcare regulations and allow for quick recovery in case of any incidents.",
    },
    // For Patients
    {
      id: 9,
      category: "patients",
      question: "How do I book an appointment?",
      answer:
        "Booking an appointment is easy with Prontivus. Simply log into the patient portal or mobile app, navigate to the appointments section, select your preferred doctor or specialty, choose an available time slot, and confirm your appointment. You'll receive automatic reminders via email or SMS. You can also reschedule or cancel appointments directly through the platform.",
    },
    {
      id: 10,
      category: "patients",
      question: "Can I access my medical records?",
      answer:
        "Yes, patients have complete access to their medical records through the patient portal and mobile app. You can view test results, lab reports, prescriptions, visit summaries, immunization records, and your complete medical history. All records are available 24/7 and can be downloaded or shared securely with other healthcare providers as needed.",
    },
    {
      id: 11,
      category: "patients",
      question: "Can I have virtual consultations with my doctor?",
      answer:
        "Yes, Prontivus includes a secure telemedicine platform that allows you to have virtual consultations with your healthcare provider. You can schedule video appointments, participate in real-time consultations, and receive prescriptions digitally. The platform includes secure messaging for follow-up questions and is HIPAA-compliant.",
    },
    {
      id: 12,
      category: "patients",
      question: "How do I receive test results?",
      answer:
        "Test results are automatically uploaded to your patient portal as soon as they're available. You'll receive a notification (email or push notification on mobile) when new results are ready. Results include detailed information, reference ranges, and can be easily shared with other healthcare providers or downloaded for your records.",
    },
    {
      id: 13,
      category: "patients",
      question: "Is there a cost for patients to use Prontivus?",
      answer:
        "Prontivus is typically provided by your healthcare facility at no direct cost to patients. The patient portal and mobile app are free to use. Any fees for consultations, tests, or services are determined by your healthcare provider and are not related to using the Prontivus platform.",
    },
    // For Providers
    {
      id: 14,
      category: "providers",
      question: "How does implementation work?",
      answer:
        "Implementation typically takes 2-4 weeks depending on your practice size. Our process includes: initial consultation and requirements gathering, data migration from existing systems, system configuration and customization, staff training sessions, and a phased rollout with ongoing support. Our implementation team works closely with your staff to ensure a smooth transition with minimal disruption to operations.",
    },
    {
      id: 15,
      category: "providers",
      question: "What training is provided?",
      answer:
        "We provide comprehensive training including: initial onboarding sessions for all staff, role-specific training modules, video tutorials and documentation, live support during the transition period, and ongoing training for new features and staff members. Training is available in-person, via video calls, or through self-paced online courses.",
    },
    {
      id: 16,
      category: "providers",
      question: "Can I migrate data from my current system?",
      answer:
        "Yes, our team can help migrate patient data, medical records, appointment history, billing information, and other relevant data from most common healthcare systems. We perform data mapping, validation, and testing to ensure data integrity during migration. The migration process is carefully planned to minimize downtime and ensure all critical data is preserved.",
    },
    {
      id: 17,
      category: "providers",
      question: "How does billing and insurance processing work?",
      answer:
        "Prontivus includes automated billing features with TISS compliance for Brazilian healthcare standards. The system handles insurance claims submission, tracks payment status, manages outstanding balances, and generates financial reports. It supports multiple insurance providers and can automate claim submissions to reduce administrative work and speed up payment processing.",
    },
    {
      id: 18,
      category: "providers",
      question: "What kind of support is available?",
      answer:
        "We offer comprehensive support including: 24/7 email support for all users, priority phone support for Professional and Enterprise plans, dedicated account managers for larger practices, regular software updates and feature enhancements, comprehensive documentation and knowledge base, and community forums for sharing best practices.",
    },
    {
      id: 19,
      category: "providers",
      question: "Is there a trial period?",
      answer:
        "Yes, we offer a 30-day free trial with full access to all features. During the trial, you can explore the platform, import sample data, and test all functionality. No credit card is required to start the trial. Our team is available to assist with setup and answer any questions during your trial period.",
    },
    {
      id: 20,
      category: "providers",
      question: "Can Prontivus integrate with other systems?",
      answer:
        "Yes, Prontivus offers API integration capabilities to connect with laboratory systems, imaging systems, pharmacy systems, accounting software, and other healthcare applications. We also support HL7 and FHIR standards for interoperability. Our integration team can help set up custom integrations based on your specific needs.",
    },
  ];

  const categories = [
    { id: "general", label: "General", icon: HelpCircle, color: "text-[#0F4C75]" },
    { id: "security", label: "Security & Compliance", icon: Shield, color: "text-[#1B9AAA]" },
    { id: "patients", label: "For Patients", icon: Users, color: "text-[#16C79A]" },
    { id: "providers", label: "For Providers", icon: Stethoscope, color: "text-[#5D737E]" },
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [faqs, selectedCategory, searchQuery]);

  // Toggle individual FAQ
  const toggleFAQ = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Expand/collapse all
  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(filteredFAQs.map((faq) => faq.id)));
    }
    setExpandAll(!expandAll);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setExpandedItems(new Set());
    setExpandAll(false);
  };

  return (
    <section id="faq" className={cn("py-20 lg:py-24 bg-white relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <MedicalPattern variant="dots" intensity="subtle" color="#0F4C75" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#0F4C75] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-[#5D737E] max-w-2xl mx-auto">
            Everything you need to know about Prontivus and how it can benefit your healthcare
            practice
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5D737E]" />
            <Input
              type="search"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base border-2 border-gray-200 focus:border-[#0F4C75]"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                selectedCategory === null
                  ? "bg-[#0F4C75] text-white"
                  : "border-gray-300 text-[#2D3748] hover:bg-[#0F4C75]/5"
              )}
            >
              All Questions
            </Button>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2",
                    selectedCategory === category.id
                      ? "bg-[#0F4C75] text-white"
                      : "border-gray-300 text-[#2D3748] hover:bg-[#0F4C75]/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", selectedCategory === category.id ? "text-white" : category.color)} />
                  {category.label}
                </Button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#5D737E]">
              {filteredFAQs.length} question{filteredFAQs.length !== 1 ? "s" : ""} found
            </div>
            <div className="flex items-center gap-2">
              {(searchQuery || selectedCategory) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#5D737E]">
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="border-gray-300 text-[#2D3748]"
              >
                {expandAll ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Expand All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => {
              const category = categories.find((cat) => cat.id === faq.category);
              const CategoryIcon = category?.icon || HelpCircle;
              const isExpanded = expandedItems.has(faq.id);

              return (
                <Card
                  key={faq.id}
                  className={cn(
                    "medical-card border-2 transition-all duration-300",
                    isExpanded
                      ? "border-[#1B9AAA] shadow-lg"
                      : "border-gray-200 hover:border-[#1B9AAA]/50"
                  )}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleFAQ(faq.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleFAQ(faq.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                            category?.id === "general" && "bg-[#0F4C75]/10",
                            category?.id === "security" && "bg-[#1B9AAA]/10",
                            category?.id === "patients" && "bg-[#16C79A]/10",
                            category?.id === "providers" && "bg-[#5D737E]/10"
                          )}
                        >
                          <CategoryIcon className={cn("h-5 w-5", category?.color)} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-[#0F4C75] mb-1">{faq.question}</CardTitle>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              category?.id === "general" && "border-[#0F4C75] text-[#0F4C75]",
                              category?.id === "security" && "border-[#1B9AAA] text-[#1B9AAA]",
                              category?.id === "patients" && "border-[#16C79A] text-[#16C79A]",
                              category?.id === "providers" && "border-[#5D737E] text-[#5D737E]"
                            )}
                          >
                            {category?.label}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-[#5D737E] flex-shrink-0 transition-transform duration-300",
                          isExpanded && "transform rotate-180"
                        )}
                      />
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent
                      id={`faq-answer-${faq.id}`}
                      className="pt-0 pb-6 animate-fade-in"
                    >
                      <div className="pl-14">
                        <p className="text-[#5D737E] leading-relaxed">{faq.answer}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 text-[#5D737E] mx-auto mb-4" />
                <p className="text-lg font-medium text-[#0F4C75] mb-2">No FAQs found</p>
                <p className="text-[#5D737E]">
                  Try adjusting your search or filter criteria to find what you're looking for.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] text-white border-0">
            <CardContent className="p-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-white/90" />
              <h3 className="text-2xl font-bold mb-2">Still Have Questions?</h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Our support team is here to help. Contact us and we'll get back to you as soon as
                possible.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-[#0F4C75] hover:bg-white/90 px-8"
                  onClick={() => {
                    if (typeof document !== "undefined") {
                      const footer = document.querySelector("footer");
                      footer?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  Contact Support
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/help";
                    }
                  }}
                >
                  Visit Help Center
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

