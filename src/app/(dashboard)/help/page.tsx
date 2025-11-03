"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  HelpCircle,
  Search,
  Keyboard,
  Settings,
} from "lucide-react";
import { ProntivusLogo } from "@/components/assets";
import Link from "next/link";

export default function HelpPage() {
  const helpSections = [
    {
      title: "Getting Started",
      icon: BookOpen,
      items: [
        "Welcome to Prontivus",
        "Navigation basics",
        "Dashboard overview",
        "User profile setup",
      ],
    },
    {
      title: "Patient Management",
      icon: FileText,
      items: [
        "Registering patients",
        "Viewing medical records",
        "Searching patients",
        "Managing appointments",
      ],
    },
    {
      title: "Clinical Features",
      icon: HelpCircle,
      items: [
        "Creating consultations",
        "SOAP notes",
        "Prescriptions",
        "ICD-10 coding",
      ],
    },
    {
      title: "System Settings",
      icon: Settings,
      items: [
        "User management",
        "Clinic configuration",
        "Module settings",
        "System preferences",
      ],
    },
  ];

  const quickLinks = [
    {
      title: "Keyboard Shortcuts",
      icon: Keyboard,
      description: "Learn time-saving shortcuts",
      href: "#shortcuts",
    },
    {
      title: "Video Tutorials",
      icon: Video,
      description: "Watch step-by-step guides",
      href: "#tutorials",
    },
    {
      title: "Contact Support",
      icon: MessageCircle,
      description: "Get help from our team",
      href: "#support",
    },
    {
      title: "Search Help",
      icon: Search,
      description: "Search help articles",
      href: "#search",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <ProntivusLogo variant="full" size="lg" />
          <h1 className="text-4xl font-bold text-[#0F4C75]">Help & Support</h1>
          <p className="text-lg text-[#5D737E] max-w-2xl mx-auto">
            Find answers to common questions and learn how to use Prontivus effectively
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.title}
                className="medical-card hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary-accent"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-[#0F4C75]/10 rounded-full flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-[#0F4C75]" />
                  </div>
                  <CardTitle className="text-lg text-[#0F4C75]">
                    {link.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-[#5D737E]">
                    {link.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="medical-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B9AAA]/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#1B9AAA]" />
                    </div>
                    <CardTitle className="text-xl text-[#0F4C75]">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-[#2D3748]"
                      >
                        <span className="text-[#1B9AAA] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-2xl text-[#0F4C75]">
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-[#0F4C75] mb-2">
                How do I register a new patient?
              </h3>
              <p className="text-[#5D737E]">
                Navigate to <strong>Secretaria → Pacientes</strong> and click
                the "Novo Paciente" button. Fill in the required information
                and save.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F4C75] mb-2">
                How do I schedule an appointment?
              </h3>
              <p className="text-[#5D737E]">
                Go to <strong>Secretaria → Agendamentos</strong>, select
                "Novo Agendamento", choose the patient and doctor, then select
                an available time slot.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F4C75] mb-2">
                Where can I view medical records?
              </h3>
              <p className="text-[#5D737E]">
                Open a patient profile from the patients list. All medical
                records, prescriptions, and test results are organized in tabs
                for easy access.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#0F4C75] mb-2">
                How do I create a prescription?
              </h3>
              <p className="text-[#5D737E]">
                During a consultation, use the prescription form to add
                medications. You can search for medications and add dosage
                instructions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="medical-card border-2 border-[#1B9AAA]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-[#1B9AAA]" />
              <CardTitle className="text-xl text-[#0F4C75]">
                Need More Help?
              </CardTitle>
            </div>
            <CardDescription>
              Contact our support team for additional assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" variant="default">
                Email Support
              </Button>
              <Button className="flex-1" variant="outline">
                Schedule Call
              </Button>
            </div>
            <p className="text-sm text-[#5D737E]">
              Support hours: Monday - Friday, 8:00 AM - 6:00 PM
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

