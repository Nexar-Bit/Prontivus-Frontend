"use client";

import React from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";

type ToastSeverity = "success" | "error" | "warning" | "info" | "urgent";

interface ToastOptions {
  title: string;
  description?: string;
  severity?: ToastSeverity;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useMedicalToast() {
  const showToast = (options: ToastOptions) => {
    const {
      title,
      description,
      severity = "info",
      duration = 4000,
      action,
    } = options;

    const severityConfig = {
      success: {
        icon: React.createElement(CheckCircle2, { className: "h-5 w-5 text-green-600" }),
        className: "border-green-200 bg-green-50 text-green-900",
      },
      error: {
        icon: React.createElement(XCircle, { className: "h-5 w-5 text-red-600" }),
        className: "border-red-200 bg-red-50 text-red-900",
      },
      warning: {
        icon: React.createElement(AlertCircle, { className: "h-5 w-5 text-yellow-600" }),
        className: "border-yellow-200 bg-yellow-50 text-yellow-900",
      },
      urgent: {
        icon: React.createElement(AlertCircle, { className: "h-5 w-5 text-red-600 animate-pulse" }),
        className: "border-red-500 bg-red-100 text-red-900 font-semibold",
      },
      info: {
        icon: React.createElement(Info, { className: "h-5 w-5 text-blue-600" }),
        className: "border-blue-200 bg-blue-50 text-blue-900",
      },
    };

    const config = severityConfig[severity];

    toast.success(title, {
      description,
      duration: severity === "urgent" ? 6000 : duration,
      className: config.className,
      icon: config.icon,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    });
  };

  return { showToast };
}

