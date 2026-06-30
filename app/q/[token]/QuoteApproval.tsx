"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, Zap,
  MapPin, MessageCircle, CreditCard, AlertTriangle, Loader2,
} from "lucide-react";

// ─── Tipos espelhando a resposta da API ──────────────────────

interface QuoteVersion {
  id: string;
  label: string;
  description?: string;
  totalPrice: number;
}

interface QuoteData {
  id: string;
  publicToken: string;
  pieceName: string;
  description?: string;
  filamentGrams: number;
  printHours: number;
  totalPrice: number;
  status: string;
  expiresAt?: string;
  paymentLinkUrl?: string;
  versions: QuoteVersion[];
  filament?: { name: string; type: string; colorHex?: string };
  printer?: { name: string };
  client?: { name: string };
  user: {
    businessName?: string;
    name?: string;
    city?: string;
    image?: string;
    infinitypayHandle?: string;
    settings?: {
      paymentLinkEnabled: boolean;
      paymentDepositPercent: number;
    };
  };
}

// ─── Countdown ───────────────────────────────────────────────

function useCountdown(expiresAt?: string) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining === null) return null;

  const days    = Math.floor(remaining / 86400000);
  const hours   = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return { days, hours, minutes, seconds, expired: remaining === 0 };
}

// ─── Componentes auxiliares ───────────────────────────────────

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-warning/20 bg-warning-subtle px-3 py-2 min-w-[52px]">
      <span className="font-display text-xl font-bold text-warning tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function BRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Componente principal ────────────────────────────────────

type ActionState = "idle" | "loading" | "approved" | "rejected" | "error" | "expired";

interface QuoteApprovalProps {
  token: string;
  initialData: QuoteData | null;
  initialError?: string;
}

export function QuoteApproval({ token, initialData, initialError }: QuoteApprovalProps) {
  const [quote, setQuote]               = useState<QuoteData | null>(initialData);
  const [action, setAction]             = useState<ActionState>(
    initialData?.status === "APPROVED" ? "approved"
    : initialData?.status === "REJECTED" ? "rejected"
    : initialData?.status === "EXPIRED" ? "expired"
    : "idle"
  );
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [rejectReason, setRejectReason]       = useState("");
  const [showRejectForm, setShowRejectForm]   = useState(false);
  const [paymentUrl, setPaymentUrl]           = useState<string | null>(quote?.paymentLinkUrl ?? null);
  const [loadingPayment, setLoadingPayment]   = useState(false);
  const [paymentError, setPaymentError]       = useState<string | null>(null);

  async function handlePayment() {
    setLoadingPayment(true);
    setPaymentError(null);
    try {
      const res  = await fetch(`/api/q/${token}/payment`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        setPaymentUrl(data.url);
        window.open(data.url, "_blank");
      } else {
        setPaymentError(data.error ?? "Erro ao gerar link.");
      }
    } catch {
      setPaymentError("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingPayment(false);
    }
  }

  const countdown = useCountdown(quote?.expiresAt);
  const isExpired = countdown?.expired || quote?.status === "EXPIRED";

  // Preço da versão selecionada ou principal
  const displayPrice = selectedVersion
    ? quote?.versions.find((v) => v.id === selectedVersion)?.totalPrice ?? quote?.totalPrice ?? 0
    : quote?.totalPrice ?? 0;

  const approve = useCallback(async () => {
    setAction("loading");
    try {
      const res = await fetch(`/api/q/${token}/approve`, { method: "POST" });
      if (!res.ok && res.status !== 200) {
        const body = await res.json();
        if (body.error?.includes("expirou")) { setAction("expired"); return; }
        setAction("error"); return;
      }
      setAction("approved");
    } catch {
      setAction("error");
    }
  }, [token]);

  const reject = useCallback(async () => {
    setAction("loading");
    try {
      await fetch(`/api/q/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setAction("rejected");
    } catch {
      setAction("error");
    }
  }, [token, rejectReason]);

  // ── Tela de erro 404 ──────────────────────────────────────
  if (initialError || !quote) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-error/30 bg-error-subtle mb-6">
          <XCircle className="h-8 w-8 text-error" />
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Link não encontrado</h1>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Este link de orçamento não existe ou foi removido. Entre em contato com o maker para solicitar um novo link.
        </p>
      </div>
    );
  }

  const maker = quote.user.businessName ?? quote.user.name ?? "Maker 3D";
  const depositPercent = quote.user.settings?.paymentDepositPercent ?? 50;
  const depositValue   = displayPrice * (depositPercent / 100);
  const showPayment    = !!(quote.user.settings?.paymentLinkEnabled && quote.user.infinitypayHandle);

  // ── Tela de sucesso — aprovado ────────────────────────────
  if (action === "approved") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border border-success/30 mb-6 animate-fade-in">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary">Orçamento aprovado!</h1>
        <p className="mt-3 text-text-secondary max-w-sm">
          Ótimo! <strong>{maker}</strong> já recebeu sua confirmação e vai entrar em contato em breve para combinar os detalhes.
        </p>
        <div className="mt-6 rounded-xl border border-success/20 bg-success-subtle px-6 py-4">
          <p className="text-xs text-text-muted">Valor aprovado</p>
          <p className="font-display text-3xl font-bold text-success">{BRL(displayPrice)}</p>
        </div>

        {showPayment && (
          <div className="mt-6 w-full max-w-sm">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-text-primary mb-1">Adiantar entrada</p>
              <p className="text-xs text-text-muted mb-4">
                Garanta sua vaga na fila pagando {depositPercent}% agora ({BRL(depositValue)}).
              </p>
              {paymentError && (
                <p className="mb-3 text-xs text-error">{paymentError}</p>
              )}
              {paymentUrl ? (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-success py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  <CreditCard className="h-4 w-4" />
                  Pagar entrada — {BRL(depositValue)}
                </a>
              ) : (
                <button
                  onClick={handlePayment}
                  disabled={loadingPayment}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-success py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loadingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {loadingPayment ? "Gerando link..." : `Pagar entrada — ${BRL(depositValue)}`}
                </button>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => { setAction("idle"); }}
          className="mt-4 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Ver orçamento novamente
        </button>
      </div>
    );
  }

  // ── Tela de recusado ──────────────────────────────────────
  if (action === "rejected") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 border border-error/30 mb-6">
          <XCircle className="h-8 w-8 text-error" />
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Orçamento recusado</h1>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Tudo bem! Sua resposta foi enviada para <strong>{maker}</strong>. Caso queira negociar, entre em contato diretamente.
        </p>
      </div>
    );
  }

  // ── Tela de expirado ──────────────────────────────────────
  if (action === "expired" || isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 border border-warning/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Orçamento expirado</h1>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          O prazo de aprovação deste orçamento encerrou. Entre em contato com <strong>{maker}</strong> para solicitar um novo.
        </p>
      </div>
    );
  }

  // ── Tela principal ────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">

      {/* Header do maker */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-text-primary">{maker}</p>
            {quote.user.city && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3" />
                {quote.user.city}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Orçamento para</p>
          <p className="text-sm font-semibold text-text-primary">{quote.client?.name ?? "Você"}</p>
        </div>
      </div>

      {/* Countdown */}
      {quote.expiresAt && countdown && !countdown.expired && (
        <div className="mb-6 rounded-xl border border-warning/20 bg-warning-subtle p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-text-primary">Este orçamento expira em</p>
            </div>
            <div className="flex gap-2">
              {countdown.days > 0 && <CountdownBox value={countdown.days}    label="dias" />}
              <CountdownBox value={countdown.hours}   label="horas" />
              <CountdownBox value={countdown.minutes} label="min" />
              <CountdownBox value={countdown.seconds} label="seg" />
            </div>
          </div>
        </div>
      )}

      {/* Card principal */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden mb-5">

        {/* Cabeçalho da peça */}
        <div className="border-b border-border p-6">
          <h1 className="font-display text-2xl font-bold text-text-primary">{quote.pieceName}</h1>
          {quote.description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{quote.description}</p>
          )}

          {/* Tags técnicas */}
          <div className="mt-4 flex flex-wrap gap-2">
            {quote.filament && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-hover px-3 py-1 text-xs text-text-secondary">
                {quote.filament.colorHex && (
                  <span className="h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: quote.filament.colorHex }} />
                )}
                {quote.filament.name}
              </span>
            )}
            {quote.printer && (
              <span className="rounded-full border border-border bg-surface-hover px-3 py-1 text-xs text-text-secondary">
                🖨️ {quote.printer.name}
              </span>
            )}
            <span className="rounded-full border border-border bg-surface-hover px-3 py-1 text-xs text-text-secondary">
              ⏱ {quote.printHours}h de impressão
            </span>
            <span className="rounded-full border border-border bg-surface-hover px-3 py-1 text-xs text-text-secondary">
              ⚖️ {quote.filamentGrams}g de filamento
            </span>
          </div>
        </div>

        {/* Versões (se houver) */}
        {quote.versions.length > 0 && (
          <div className="border-b border-border p-6">
            <p className="mb-3 text-sm font-semibold text-text-primary">Escolha uma versão</p>
            <div className="grid gap-3">
              {/* Versão principal */}
              <button
                onClick={() => setSelectedVersion(null)}
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                  selectedVersion === null
                    ? "border-primary bg-primary-subtle"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">Básico</p>
                  <p className="text-xs text-text-muted">Versão padrão</p>
                </div>
                <p className={`font-display text-xl font-bold ${selectedVersion === null ? "text-primary" : "text-text-primary"}`}>
                  {BRL(quote.totalPrice)}
                </p>
              </button>
              {/* Versões adicionais */}
              {quote.versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    selectedVersion === v.id
                      ? "border-primary bg-primary-subtle"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{v.label}</p>
                    {v.description && <p className="text-xs text-text-muted">{v.description}</p>}
                  </div>
                  <p className={`font-display text-xl font-bold ${selectedVersion === v.id ? "text-primary" : "text-text-primary"}`}>
                    {BRL(v.totalPrice)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preço e detalhamento */}
        <div className="p-6">
          {/* Total */}
          <div className="mb-6 rounded-2xl gradient-primary p-6 text-center shadow-glow">
            <p className="text-sm font-medium text-white/70">Valor total</p>
            <p className="mt-1 font-display text-4xl font-bold text-white">{BRL(displayPrice)}</p>
            {showPayment && (
              <p className="mt-2 text-xs text-white/70">
                Entrada de {depositPercent}%: {BRL(depositValue)}
              </p>
            )}
          </div>

          {/* Botões de ação */}
          {!showRejectForm ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={approve}
                disabled={action === "loading"}
                className="flex h-14 items-center justify-center gap-3 rounded-xl gradient-primary text-base font-bold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {action === "loading" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Aprovar orçamento
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRejectForm(true)}
                disabled={action === "loading"}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-medium text-text-secondary transition-colors hover:border-error/40 hover:text-error disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Recusar
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p className="mb-2 text-sm font-medium text-text-primary">
                Por que está recusando? <span className="text-text-muted font-normal">(opcional)</span>
              </p>
              <textarea
                rows={3}
                placeholder="Ex: Valor acima do esperado, prazo não serve, quero alterar o material..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mb-3 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Cancelar
                </button>
                <button
                  onClick={reject}
                  disabled={action === "loading"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {action === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar recusa"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted">
        <p>
          Dúvidas? Entre em contato com{" "}
          <span className="font-medium text-text-secondary">{maker}</span>
          {" "}via{" "}
          <button className="inline-flex items-center gap-1 text-primary hover:underline">
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </button>
        </p>
        <p className="mt-2 opacity-60">Gerado por 3D Print Manager</p>
      </div>
    </div>
  );
}
