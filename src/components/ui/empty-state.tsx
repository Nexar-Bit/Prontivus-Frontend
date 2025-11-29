import React from "react";
import { LucideIcon, Database, AlertCircle, Inbox, FileX } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /**
   * Icon to display. Defaults to Database icon.
   */
  icon?: LucideIcon;
  /**
   * Main title/message
   */
  title?: string;
  /**
   * Optional description/subtitle
   */
  description?: string;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Variant style
   */
  variant?: "default" | "database" | "filter" | "error";
  /**
   * Custom className
   */
  className?: string;
  /**
   * Show as card wrapper (default: true)
   */
  asCard?: boolean;
}

const variantConfig = {
  default: {
    icon: Inbox,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    borderColor: "border-l-blue-500",
    title: "Nenhum dado encontrado",
    description: "Não há dados disponíveis para exibição no momento.",
  },
  database: {
    icon: Database,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    borderColor: "border-l-amber-500",
    title: "Nenhum dado armazenado no banco de dados",
    description: "Não há dados cadastrados no banco de dados. Os dados aparecerão aqui quando forem adicionados ao sistema.",
  },
  filter: {
    icon: AlertCircle,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    borderColor: "border-l-blue-500",
    title: "Nenhum resultado encontrado",
    description: "Não há dados que correspondam aos filtros selecionados.",
  },
  error: {
    icon: FileX,
    iconColor: "text-red-600",
    iconBg: "bg-red-100",
    borderColor: "border-l-red-500",
    title: "Erro ao carregar dados",
    description: "Não foi possível carregar os dados do banco de dados.",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
  asCard = true,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const FinalIcon = Icon || config.icon;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;

  const content = (
    <div className={cn("py-12 text-center", className)}>
      <div
        className={cn(
          "p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center",
          config.iconBg
        )}
      >
        <FinalIcon className={cn("h-10 w-10", config.iconColor)} />
      </div>
      <p className={cn("font-medium mb-2", variant === "error" ? "text-red-600" : "text-gray-500")}>
        {finalTitle}
      </p>
      {finalDescription && (
        <p className="text-sm text-gray-400 mb-4">{finalDescription}</p>
      )}
      {action && (
        <Button
          variant="outline"
          className={cn(
            "border-blue-300 text-blue-700 hover:bg-blue-50",
            variant === "error" && "border-red-300 text-red-700 hover:bg-red-50"
          )}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  if (asCard) {
    return (
      <Card className={cn("border-l-4 bg-white/80 backdrop-blur-sm", config.borderColor)}>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return <div>{content}</div>;
}

