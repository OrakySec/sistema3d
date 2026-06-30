"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Trash2, Smartphone, RotateCcw } from "lucide-react";
import Image from "next/image";

type Status = "idle" | "loading" | "qrcode" | "connected" | "error";

export function WhatsAppConnect() {
  const [status, setStatus]     = useState<Status>("idle");
  const [qrcode, setQrcode]     = useState<string | null>(null);
  const [polling, setPolling]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => { checkStatus(); }, []);

  // Polling de status quando QR Code está exibido
  useEffect(() => {
    if (status !== "qrcode") return;
    setPolling(true);
    const id = setInterval(async () => {
      try {
        const res  = await fetch("/api/whatsapp/instance");
        const data = await res.json();
        if (data.status === "connected") {
          setStatus("connected");
          setQrcode(null);
          clearInterval(id);
          setPolling(false);
        }
      } catch {}
    }, 3000);
    return () => { clearInterval(id); setPolling(false); };
  }, [status]);

  const checkStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const res  = await fetch("/api/whatsapp/instance");
      const data = await res.json();
      if (data.status === "connected") setStatus("connected");
      else setStatus("idle");
    } catch {
      setStatus("idle");
    }
  }, []);

  async function handleConnect() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res  = await fetch("/api/whatsapp/instance", { method: "POST" });
      const data = await res.json();

      if (data.error) { setErrorMsg(data.error); setStatus("error"); return; }

      if (data.qrcode) {
        setQrcode(data.qrcode);
        setStatus("qrcode");
      } else {
        // Instância já existe, busca QR Code
        await fetchQR();
      }
    } catch {
      setErrorMsg("Não foi possível conectar ao servidor.");
      setStatus("error");
    }
  }

  async function fetchQR() {
    setStatus("loading");
    try {
      const res  = await fetch("/api/whatsapp/qrcode");
      const data = await res.json();
      if (data.qrcode) {
        setQrcode(data.qrcode);
        setStatus("qrcode");
      } else if (data.state === "open") {
        setStatus("connected");
      } else {
        setErrorMsg("Não foi possível obter o QR Code. Use 'Resetar instância' e tente novamente.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Erro ao buscar QR Code.");
      setStatus("error");
    }
  }

  async function handleReset() {
    if (!confirm("Isso vai apagar a instância atual e criar uma nova. Continuar?")) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      // Deleta instância atual
      await fetch("/api/whatsapp/instance", { method: "DELETE" });
      // Cria nova instância
      const res  = await fetch("/api/whatsapp/instance", { method: "POST" });
      const data = await res.json();
      if (data.qrcode) {
        setQrcode(data.qrcode);
        setStatus("qrcode");
      } else {
        await fetchQR();
      }
    } catch {
      setErrorMsg("Erro ao resetar instância.");
      setStatus("error");
    }
  }

  async function handleDisconnect() {
    if (!confirm("Desconectar o WhatsApp? Você precisará escanear o QR Code novamente.")) return;
    setStatus("loading");
    await fetch("/api/whatsapp/instance", { method: "DELETE" });
    setQrcode(null);
    setStatus("idle");
  }

  // ── Conectado ─────────────────────────────────────────────────
  if (status === "connected") {
    return (
      <div className="rounded-xl border border-success/30 bg-success-subtle p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">WhatsApp conectado</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-text-muted">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 rounded-lg border border-error/30 bg-error-subtle px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  // ── QR Code ───────────────────────────────────────────────────
  if (status === "qrcode" && qrcode) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Escaneie o QR Code</p>
            <p className="text-xs text-text-muted">
              WhatsApp → Dispositivos Vinculados → Vincular dispositivo
            </p>
          </div>
          <div className="flex items-center gap-2">
            {polling && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Aguardando...
              </div>
            )}
            <button
              onClick={fetchQR}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Novo QR
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="rounded-xl border border-border bg-white p-3">
            <Image src={qrcode} alt="QR Code WhatsApp" width={220} height={220} unoptimized />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          O QR Code expira em 60 segundos. Clique em "Novo QR" se expirar.
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Erro ──────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="rounded-xl border border-error/30 bg-error-subtle p-5">
        <div className="flex items-center gap-3 mb-2">
          <XCircle className="h-5 w-5 text-error shrink-0" />
          <p className="text-sm font-semibold text-text-primary">Erro na conexão</p>
        </div>
        {errorMsg && <p className="mb-4 text-xs text-text-secondary">{errorMsg}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatus("idle"); setErrorMsg(null); }}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-subtle px-4 py-2 text-sm font-medium text-warning hover:bg-warning/20 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar instância
          </button>
        </div>
      </div>
    );
  }

  // ── Idle — não conectado ──────────────────────────────────────
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover">
            <Smartphone className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Status da conexão</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-error" />
              <span className="text-xs text-text-muted">Não conectado</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Conectar WhatsApp
        </button>
      </div>
      <div className="mt-4 rounded-lg bg-surface-hover px-4 py-3 text-xs text-text-muted">
        Um QR Code será exibido aqui. Escaneie com o WhatsApp do celular em
        Configurações → Dispositivos Vinculados → Vincular dispositivo.
      </div>
    </div>
  );
}
