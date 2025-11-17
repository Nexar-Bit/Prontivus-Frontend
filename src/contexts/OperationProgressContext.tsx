"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";

interface OperationProgressContextType {
  isOperating: boolean;
  operationMessage: string | null;
  startOperation: (message: string) => void;
  endOperation: () => void;
}

const OperationProgressContext = createContext<OperationProgressContextType | undefined>(undefined);

export function OperationProgressProvider({ children }: { children: React.ReactNode }) {
  const [isOperating, setIsOperating] = useState(false);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);

  const startOperation = useCallback((message: string) => {
    setIsOperating(true);
    setOperationMessage(message);
  }, []);

  const endOperation = useCallback(() => {
    setIsOperating(false);
    setOperationMessage(null);
  }, []);

  return (
    <OperationProgressContext.Provider
      value={{
        isOperating,
        operationMessage,
        startOperation,
        endOperation,
      }}
    >
      {children}
    </OperationProgressContext.Provider>
  );
}

export function useOperationProgress() {
  const context = useContext(OperationProgressContext);
  if (context === undefined) {
    throw new Error("useOperationProgress must be used within an OperationProgressProvider");
  }
  return context;
}

