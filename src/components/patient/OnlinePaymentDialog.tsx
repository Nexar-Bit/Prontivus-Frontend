"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { onlinePaymentApi, PaymentResponse } from "@/lib/online-payment-api";
import { toast } from "sonner";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

interface OnlinePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: number;
  appointmentId?: number;
  amount: number;
  description: string;
  onPaymentSuccess?: () => void;
}

export function OnlinePaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  appointmentId,
  amount,
  description,
  onPaymentSuccess,
}: OnlinePaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Card form fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    if (open && !paymentData) {
      // Reset state when dialog opens
      setPaymentData(null);
      setPaymentStatus("pending");
      setPaymentMethod("pix");
    }
  }, [open, paymentData]);

  // Poll payment status for PIX
  useEffect(() => {
    if (!paymentData || paymentMethod !== "pix" || paymentStatus !== "pending") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setCheckingStatus(true);
        const status = await onlinePaymentApi.getPaymentStatus(paymentData.transaction_id);
        setPaymentStatus(status.status);

        if (status.status === "paid" || status.status === "completed") {
          clearInterval(interval);
          toast.success("Pagamento confirmado!");
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
          setTimeout(() => {
            onOpenChange(false);
          }, 2000);
        } else if (status.status === "cancelled" || status.status === "failed") {
          clearInterval(interval);
          toast.error("Pagamento cancelado ou falhou");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        setCheckingStatus(false);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [paymentData, paymentMethod, paymentStatus, onPaymentSuccess, onOpenChange]);

  const handlePIXPayment = async () => {
    try {
      setLoading(true);
      const response = await onlinePaymentApi.createPIXPayment({
        amount,
        description,
        invoice_id: invoiceId,
        appointment_id: appointmentId,
      });

      setPaymentData(response);
      setPaymentStatus(response.status);
    } catch (error: any) {
      console.error("Error creating PIX payment:", error);
      toast.error("Erro ao criar pagamento PIX", {
        description: error?.message || error?.detail || "Não foi possível processar o pagamento",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would tokenize the card first
      // For now, we'll use a placeholder token
      const cardToken = "card_token_placeholder"; // Replace with real tokenization

      const response = await onlinePaymentApi.createCardPayment({
        amount,
        description,
        card_token: cardToken,
        installments,
        invoice_id: invoiceId,
        appointment_id: appointmentId,
      });

      setPaymentData(response);
      setPaymentStatus(response.status);

      if (response.status === "paid" || response.status === "completed") {
        toast.success("Pagamento realizado com sucesso!");
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error creating card payment:", error);
      toast.error("Erro ao processar pagamento", {
        description: error?.message || error?.detail || "Não foi possível processar o pagamento",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPIXCode = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      toast.success("Código PIX copiado!");
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamento Online</DialogTitle>
          <DialogDescription>
            Escolha o método de pagamento para {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {description}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!paymentData ? (
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "pix" | "card")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pix" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  PIX
                </TabsTrigger>
                <TabsTrigger value="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pix" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pagamento via PIX</CardTitle>
                    <CardDescription>
                      O pagamento via PIX é processado instantaneamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Você receberá um QR Code para escanear com o app do seu banco
                      </p>
                    </div>
                    <Button
                      onClick={handlePIXPayment}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Gerar QR Code PIX
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="card" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pagamento com Cartão</CardTitle>
                    <CardDescription>
                      Informe os dados do seu cartão de crédito ou débito
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Número do Cartão</Label>
                      <Input
                        id="card-number"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-name">Nome no Cartão</Label>
                      <Input
                        id="card-name"
                        placeholder="NOME COMO NO CARTÃO"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-expiry">Validade</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installments">Parcelas</Label>
                      <select
                        id="installments"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>
                            {num}x de {formatCurrency(amount / num)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={handleCardPayment}
                      disabled={loading || !cardNumber || !cardName || !cardExpiry || !cardCvv}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagar {formatCurrency(amount)}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              {paymentMethod === "pix" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>QR Code PIX</span>
                      <Badge
                        variant={
                          paymentStatus === "paid"
                            ? "default"
                            : paymentStatus === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className="flex items-center gap-1"
                      >
                        {paymentStatus === "paid" && <CheckCircle2 className="h-3 w-3" />}
                        {paymentStatus === "pending" && <Clock className="h-3 w-3" />}
                        {paymentStatus === "cancelled" && <XCircle className="h-3 w-3" />}
                        {paymentStatus === "paid"
                          ? "Pago"
                          : paymentStatus === "pending"
                          ? "Aguardando"
                          : "Cancelado"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Escaneie o QR Code com o app do seu banco para fazer o pagamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentData.qr_code_image ? (
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <img
                          src={paymentData.qr_code_image}
                          alt="QR Code PIX"
                          className="w-64 h-64"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <QrCode className="h-64 w-64 text-muted-foreground" />
                      </div>
                    )}
                    {paymentData.qr_code && (
                      <div className="space-y-2">
                        <Label>Código PIX (copiar e colar)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={paymentData.qr_code}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button variant="outline" onClick={copyPIXCode}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {paymentStatus === "pending" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {checkingStatus ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verificando pagamento...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            Aguardando confirmação do pagamento
                          </>
                        )}
                      </div>
                    )}
                    {paymentStatus === "paid" && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        Pagamento confirmado com sucesso!
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {paymentMethod === "card" && paymentData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Status do Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentStatus === "paid" || paymentStatus === "completed" ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Pagamento realizado com sucesso!</span>
                      </div>
                    ) : paymentStatus === "pending" ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="h-5 w-5" />
                        <span>Processando pagamento...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span>Pagamento falhou ou foi cancelado</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

