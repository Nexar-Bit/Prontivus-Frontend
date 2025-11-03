"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, FileCode, Loader2, AlertCircle } from "lucide-react";
import { icd10Api } from "@/lib/icd10-api";

interface ICD10Code {
  code: string;
  description: string;
}

interface ICD10SearchProps {
  label?: string;
  value?: string;
  onChange?: (code: string, description: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function ICD10Search({
  label = "CID-10",
  value = "",
  onChange,
  error,
  required,
  placeholder = "Buscar código CID-10...",
  className,
}: ICD10SearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [codes, setCodes] = React.useState<ICD10Code[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCode, setSelectedCode] = React.useState<ICD10Code | null>(null);

  React.useEffect(() => {
    if (value) {
      // Try to find the selected code from cache or load it
      // For now, we'll just display the value
      setSelectedCode({ code: value, description: "" });
    }
  }, [value]);

  const searchCodes = React.useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setCodes([]);
        return;
      }

      setIsLoading(true);
      try {
        // Use the existing ICD10 API
        const results = await icd10Api.search(query);
        setCodes(
          results.slice(0, 10).map((item: any) => ({
            code: item.code,
            description: item.description || item.description_short || "",
          }))
        );
      } catch (error) {
        console.error("Error searching ICD-10 codes:", error);
        setCodes([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchCodes(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCodes]);

  const handleSelect = (code: ICD10Code) => {
    setSelectedCode(code);
    onChange?.(code.code, code.description);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-11 text-left font-normal rounded-lg border-2 transition-all",
              error
                ? "border-red-300 bg-red-50/50"
                : "border-gray-300 bg-white hover:border-gray-400 focus-visible:border-[#0F4C75]",
              !selectedCode && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileCode className="h-4 w-4 text-[#0F4C75] shrink-0" />
              {selectedCode ? (
                <span className="truncate">
                  <span className="font-medium">{selectedCode.code}</span> - {selectedCode.description}
                </span>
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar CID-10..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#0F4C75]" />
                </div>
              ) : codes.length === 0 && searchQuery ? (
                <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {codes.map((code) => (
                    <CommandItem
                      key={code.code}
                      value={`${code.code} ${code.description}`}
                      onSelect={() => handleSelect(code)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCode?.code === code.code
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#0F4C75]">
                            {code.code}
                          </span>
                          <span className="text-sm text-gray-600 truncate">
                            {code.description}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCode && (
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-700">
            <span className="font-medium">Selecionado:</span> {selectedCode.code} - {selectedCode.description}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

