"use client";

import React from "react";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: "error" | "warning" | "info";
  className?: string;
}

export function ErrorState({
  title = "Algo deu errado",
  message = "Não foi possível carregar os dados. Por favor, tente novamente.",
  onRetry,
  onDismiss,
  severity = "error",
  className,
}: ErrorStateProps) {
  const severityConfig = {
    error: {
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-900",
    },
    warning: {
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-900",
    },
    info: {
      icon: AlertCircle,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-900",
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-6 animate-error-appear",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Icon className={cn("h-6 w-6 flex-shrink-0", config.iconColor)} />
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold mb-2", config.textColor)}>
            {title}
          </h3>
          <p className={cn("text-sm", config.textColor, "opacity-80")}>
            {message}
          </p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-4">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="gap-2"
                >
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

