"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Check } from "lucide-react";
import { icd10Api, ICD10SearchResult } from "@/lib/icd10-api";
import { cn } from "@/lib/utils";

interface ICD10SearchProps {
  onSelect: (code: string, description: string) => void;
  placeholder?: string;
  className?: string;
}

export function ICD10Search({ onSelect, placeholder = "Buscar CID-10...", className }: ICD10SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ICD10SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await icd10Api.search(query);
        setResults(searchResults);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Error searching ICD-10:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (result: ICD10SearchResult) => {
    onSelect(result.code, result.description);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding to allow clicking on results
    setTimeout(() => {
      if (!resultsRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "chapter": return "bg-blue-100 text-blue-800";
      case "group": return "bg-green-100 text-green-800";
      case "category": return "bg-yellow-100 text-yellow-800";
      case "subcategory": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "chapter": return "Capítulo";
      case "group": return "Grupo";
      case "category": return "Categoria";
      case "subcategory": return "Subcategoria";
      default: return level;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {results.map((result, index) => (
              <div
                key={`${result.id}-${result.code}-${index}`}
                className={cn(
                  "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                  index === selectedIndex && "bg-muted"
                )}
                onClick={() => handleSelect(result)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono font-semibold text-primary">
                      {result.code}
                    </code>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getLevelColor(result.level))}
                    >
                      {getLevelLabel(result.level)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {result.description}
                  </p>
                </div>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isOpen && !isLoading && results.length === 0 && query && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-4 text-center text-muted-foreground">
            Nenhum resultado encontrado para "{query}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}
