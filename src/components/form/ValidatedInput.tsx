"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type MaskFn = (value: string) => string;
type ValidateFn = (value: string) => boolean;

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  mask?: MaskFn;
  validate?: ValidateFn;
  tooltip?: string;
  value: string;
  onValueChange: (value: string) => void;
}

export default function ValidatedInput({ label, required, mask, validate, tooltip, value, onValueChange, className, ...rest }: Props) {
  const [touched, setTouched] = useState(false);
  const masked = useMemo(() => (mask ? mask(value) : value), [value, mask]);
  const isValid = useMemo(() => (validate ? validate(masked) : (!required || !!masked)), [masked, validate, required]);

  useEffect(() => {
    // ensure value stays masked
    if (mask && masked !== value) onValueChange(masked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masked]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onValueChange(mask ? mask(v) : v);
  }, [onValueChange, mask]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1">
        <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help">?</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Input
        {...rest}
        value={masked}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        className={cn(
          className,
          touched && !isValid ? "border-red-500 focus-visible:ring-red-500" : "",
          touched && isValid ? "border-green-500 focus-visible:ring-green-500" : "",
        )}
      />
      {touched && !isValid && (
        <div className="text-xs text-red-600 mt-1">Campo inválido</div>
      )}
      {touched && isValid && masked && (
        <div className="text-xs text-green-600 mt-1">Válido</div>
      )}
    </div>
  );
}


