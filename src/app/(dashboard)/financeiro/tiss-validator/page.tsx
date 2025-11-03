"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileCode,
  Download,
  Eye
} from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  xmlContent?: string;
}

export default function TissValidatorPage() {
  const [xmlContent, setXmlContent] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validateTissXml = async () => {
    if (!xmlContent.trim()) {
      toast.error("Por favor, cole o conteúdo XML para validar");
      return;
    }

    setLoading(true);
    try {
      // Basic XML validation
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const parseError = xmlDoc.getElementsByTagName("parsererror");
      
      const errors: string[] = [];
      const warnings: string[] = [];

      if (parseError.length > 0) {
        errors.push("XML malformado: " + parseError[0].textContent);
      }

      // TISS-specific validations
      const rootElement = xmlDoc.documentElement;
      if (rootElement.tagName !== "ans:mensagemTISS") {
        errors.push("Elemento raiz deve ser 'ans:mensagemTISS'");
      }

      // Check required elements
      const requiredElements = [
        "ans:cabecalho",
        "ans:prestadorParaOperadora",
        "ans:operadoraParaPrestador"
      ];

      for (const elementName of requiredElements) {
        const element = xmlDoc.getElementsByTagName(elementName);
        if (element.length === 0) {
          errors.push(`Elemento obrigatório ausente: ${elementName}`);
        }
      }

      // Check TISS version
      const versaoElement = xmlDoc.getElementsByTagName("ans:versaoPadrao");
      if (versaoElement.length > 0) {
        const version = versaoElement[0].textContent;
        if (version !== "3.03.00") {
          warnings.push(`Versão TISS ${version} detectada. Versão recomendada: 3.03.00`);
        }
      }

      // Check CNPJ format
      const cnpjElements = xmlDoc.getElementsByTagName("ans:cnpj");
      for (let i = 0; i < cnpjElements.length; i++) {
        const cnpj = cnpjElements[i].textContent;
        if (cnpj && !/^\d{14}$/.test(cnpj.replace(/\D/g, ""))) {
          warnings.push(`CNPJ com formato inválido: ${cnpj}`);
        }
      }

      // Check CPF format
      const cpfElements = xmlDoc.getElementsByTagName("ans:cpf");
      for (let i = 0; i < cpfElements.length; i++) {
        const cpf = cpfElements[i].textContent;
        if (cpf && !/^\d{11}$/.test(cpf.replace(/\D/g, ""))) {
          warnings.push(`CPF com formato inválido: ${cpf}`);
        }
      }

      const isValid = errors.length === 0;
      
      setValidationResult({
        isValid,
        errors,
        warnings,
        xmlContent
      });

      if (isValid) {
        toast.success("XML TISS válido!");
      } else {
        toast.error(`XML TISS inválido: ${errors.length} erro(s) encontrado(s)`);
      }

    } catch (error: any) {
      toast.error("Erro ao validar XML", {
        description: error.message
      });
      setValidationResult({
        isValid: false,
        errors: ["Erro ao processar XML: " + error.message],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlContent(content);
      };
      reader.readAsText(file);
    }
  };

  const downloadXml = () => {
    if (!validationResult?.xmlContent) return;
    
    const blob = new Blob([validationResult.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiss_validated.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const previewXml = () => {
    if (!validationResult?.xmlContent) return;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>TISS XML Preview</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h2>TISS XML Preview</h2>
            <pre>${validationResult.xmlContent}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validador TISS XML</h1>
          <p className="text-muted-foreground">
            Valide arquivos TISS XML contra o padrão 3.03.00
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Entrada XML
            </CardTitle>
            <CardDescription>
              Cole o conteúdo XML ou faça upload de um arquivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                Upload de Arquivo
              </label>
              <Input
                id="file-upload"
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="mb-4"
              />
            </div>
            
            <div>
              <label htmlFor="xml-content" className="block text-sm font-medium mb-2">
                Conteúdo XML
              </label>
              <Textarea
                id="xml-content"
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                placeholder="Cole o conteúdo XML TISS aqui..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={validateTissXml} 
              disabled={loading || !xmlContent.trim()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "Validando..." : "Validar XML"}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult ? (
                validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )
              ) : (
                <FileCode className="h-5 w-5" />
              )}
              Resultado da Validação
            </CardTitle>
            <CardDescription>
              {validationResult ? (
                validationResult.isValid ? "XML válido" : "XML inválido"
              ) : (
                "Execute a validação para ver os resultados"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validationResult ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                    {validationResult.isValid ? "Válido" : "Inválido"}
                  </Badge>
                  {validationResult.warnings.length > 0 && (
                    <Badge variant="secondary">
                      {validationResult.warnings.length} Aviso(s)
                    </Badge>
                  )}
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Erros ({validationResult.errors.length})
                    </h4>
                    <ul className="space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Avisos ({validationResult.warnings.length})
                    </h4>
                    <ul className="space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                {validationResult.isValid && (
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={previewXml}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button variant="outline" onClick={downloadXml}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma validação executada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar o Validador TISS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Upload ou Cole XML</h4>
              <p className="text-muted-foreground">
                Você pode fazer upload de um arquivo XML ou colar o conteúdo diretamente no campo de texto.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Validação Automática</h4>
              <p className="text-muted-foreground">
                O validador verifica a estrutura XML, elementos obrigatórios, formatos de CNPJ/CPF e versão TISS.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Resultados</h4>
              <p className="text-muted-foreground">
                Erros impedem o uso do XML, enquanto avisos indicam possíveis problemas que devem ser revisados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
