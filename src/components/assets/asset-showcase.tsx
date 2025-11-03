"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ProntivusLogo,
  MedicalAvatar,
  MedicalPattern,
  DocumentBackground,
  ChartBackground,
  DataVisualizationIcon,
  NotificationBadge,
  FormHeaderImage,
} from "./index";

export function AssetShowcase() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-[#0F4C75]">
        Prontivus Asset System Showcase
      </h1>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Variations</CardTitle>
          <CardDescription>Prontivus logo in different variants and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Full Logo</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <ProntivusLogo variant="full" size="sm" />
              <ProntivusLogo variant="full" size="md" />
              <ProntivusLogo variant="full" size="lg" />
              <ProntivusLogo variant="full" size="xl" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Icon Only</h3>
            <div className="flex items-center gap-4">
              <ProntivusLogo variant="icon" size="sm" />
              <ProntivusLogo variant="icon" size="md" />
              <ProntivusLogo variant="icon" size="lg" />
              <ProntivusLogo variant="icon" size="xl" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Text Only</h3>
            <div className="flex items-center gap-4">
              <ProntivusLogo variant="text" size="sm" />
              <ProntivusLogo variant="text" size="md" />
              <ProntivusLogo variant="text" size="lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Avatars</CardTitle>
          <CardDescription>Role-based avatars with medical styling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">By Role</h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <MedicalAvatar name="Dr. Silva" role="doctor" size="lg" showBadge />
                <p className="text-sm mt-2">Doctor</p>
              </div>
              <div className="text-center">
                <MedicalAvatar name="Maria" role="patient" size="lg" showBadge />
                <p className="text-sm mt-2">Patient</p>
              </div>
              <div className="text-center">
                <MedicalAvatar name="Ana" role="nurse" size="lg" showBadge />
                <p className="text-sm mt-2">Nurse</p>
              </div>
              <div className="text-center">
                <MedicalAvatar name="Admin" role="admin" size="lg" showBadge />
                <p className="text-sm mt-2">Admin</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">By Size</h3>
            <div className="flex items-center gap-4">
              <MedicalAvatar name="Test" role="doctor" size="sm" />
              <MedicalAvatar name="Test" role="doctor" size="md" />
              <MedicalAvatar name="Test" role="doctor" size="lg" />
              <MedicalAvatar name="Test" role="doctor" size="xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patterns Section */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Patterns</CardTitle>
          <CardDescription>Abstract medical patterns for backgrounds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {(["dots", "grid", "waves", "circuit", "cells"] as const).map((variant) => (
              <div key={variant} className="relative h-32 rounded-lg border overflow-hidden">
                <MedicalPattern variant={variant} intensity="medium" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium bg-white/80 px-2 py-1 rounded">
                    {variant}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Backgrounds */}
      <Card>
        <CardHeader>
          <CardTitle>Document Backgrounds</CardTitle>
          <CardDescription>Styled backgrounds for medical documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["prescription", "certificate", "report", "form"] as const).map((variant) => (
            <div key={variant} className="relative h-24 rounded-lg border overflow-hidden">
              <DocumentBackground variant={variant}>
                <div className="p-4">
                  <p className="font-semibold capitalize">{variant} Template</p>
                </div>
              </DocumentBackground>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chart Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Chart & Data Visualization</CardTitle>
          <CardDescription>Assets for medical data visualization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Trend Icons</h3>
            <div className="flex items-center gap-4">
              <DataVisualizationIcon type="trend-up" size={32} />
              <DataVisualizationIcon type="trend-down" size={32} />
              <DataVisualizationIcon type="stable" size={32} />
              <DataVisualizationIcon type="peak" size={32} />
              <DataVisualizationIcon type="low" size={32} />
            </div>
          </div>
          <div className="relative h-48 rounded-lg border overflow-hidden">
            <ChartBackground type="line" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium">Chart Grid Background</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Badges</CardTitle>
          <CardDescription>Medical-themed notification indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <NotificationBadge count={5} variant="default" />
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <NotificationBadge count={12} variant="urgent" />
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <NotificationBadge count={99} variant="critical" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Headers */}
      <Card>
        <CardHeader>
          <CardTitle>Form Headers</CardTitle>
          <CardDescription>Professional form header designs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormHeaderImage
            title="Patient Registration"
            subtitle="Complete patient information form"
            variant="default"
          />
          <FormHeaderImage
            title="Quick Entry"
            subtitle="Rapid data entry form"
            variant="compact"
          />
          <FormHeaderImage
            title="Minimal Form"
            variant="minimal"
          />
        </CardContent>
      </Card>
    </div>
  );
}

