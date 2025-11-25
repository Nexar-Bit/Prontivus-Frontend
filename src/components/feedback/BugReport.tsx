"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bug, Upload, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface BugReportProps {
  feature?: string;
  onReportSubmitted?: () => void;
}

export function BugReport({ feature, onReportSubmitted }: BugReportProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + screenshots.length > 3) {
      toast.error('Máximo de 3 screenshots');
      return;
    }
    setScreenshots([...screenshots, ...files]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Preencha título e descrição');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('steps', steps);
      if (feature) {
        formData.append('feature', feature);
      }
      formData.append('browser', navigator.userAgent);
      formData.append('url', window.location.href);
      formData.append('timestamp', new Date().toISOString());

      screenshots.forEach((file, index) => {
        formData.append(`screenshot_${index}`, file);
      });

      await api.post('/api/v1/feedback/bug-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Relatório enviado com sucesso! Obrigado.');
      setOpen(false);
      setTitle('');
      setDescription('');
      setSteps('');
      setScreenshots([]);
      onReportSubmitted?.();
    } catch (error: any) {
      console.error('Bug report error:', error);
      toast.error('Erro ao enviar relatório. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700">
          <Bug className="h-3 w-3 mr-1" />
          Reportar Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Problema</DialogTitle>
          <DialogDescription>
            Ajude-nos a melhorar reportando problemas encontrados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Problema *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: PDF não gera ao clicar no botão"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema em detalhes..."
              rows={4}
              required
            />
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <Label htmlFor="steps">Passos para Reproduzir</Label>
            <Textarea
              id="steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Clique em...&#10;2. Preencha...&#10;3. Erro ocorre quando..."
              rows={4}
            />
          </div>

          {/* Screenshots */}
          <div className="space-y-2">
            <Label>Screenshots (máx. 3)</Label>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={screenshots.length >= 3}
                className="cursor-pointer"
              />
              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {screenshots.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        aria-label={`Remover screenshot ${index + 1}`}
                        title={`Remover screenshot ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auto-filled info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Navegador: {navigator.userAgent.split(' ')[0]}</p>
            <p>URL: {window.location.href}</p>
            {feature && <p>Funcionalidade: {feature}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enviando...' : 'Enviar Relatório'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

