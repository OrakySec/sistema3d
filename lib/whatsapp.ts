/**
 * Serviço de envio de mensagens WhatsApp via Evolution API.
 * Centraliza normalização de número e chamada HTTP.
 */

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;

/**
 * Normaliza número de telefone para o formato que a Evolution API aceita.
 * Aceita qualquer formato: (11) 99999-9999, 11999999999, +5511999999999, etc.
 * Sempre retorna: 5511999999999 (sem + ou espaços)
 */
export function normalizePhone(raw: string): string | null {
  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) return null;

  // Já tem código do país (começa com 55 e tem 12-13 dígitos)
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  // Número brasileiro com DDD (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Número sem DDD (8 ou 9 dígitos) — não é possível normalizar sem DDD
  return null;
}

/**
 * Substitui variáveis {{nome}}, {{valor}}, {{data}} etc. na mensagem.
 */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Envia mensagem de texto via Evolution API.
 * @returns true se enviado com sucesso, false caso contrário
 */
export async function sendWhatsAppMessage(params: {
  instanceName: string;
  phone:        string;
  message:      string;
}): Promise<boolean> {
  if (!EVO_URL || !EVO_KEY) {
    console.error("[whatsapp] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados");
    return false;
  }

  const number = normalizePhone(params.phone);
  if (!number) {
    console.error(`[whatsapp] Número inválido: "${params.phone}"`);
    return false;
  }

  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${params.instanceName}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({
        number,
        text: params.message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[whatsapp] Erro ao enviar para ${number}: ${res.status} ${body}`);
      return false;
    }

    console.log(`[whatsapp] Mensagem enviada para ${number}`);
    return true;
  } catch (err) {
    console.error(`[whatsapp] Exceção ao enviar para ${number}:`, err);
    return false;
  }
}

/**
 * Verifica se o horário atual está dentro do horário silencioso.
 */
export function isSilentHour(start: string, end: string): boolean {
  const now = new Date();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins   = sh * 60 + sm;
  const endMins     = eh * 60 + em;

  if (startMins <= endMins) {
    // Ex: 22:00 – 23:59 (sem virar meia-noite)
    return currentMins >= startMins && currentMins < endMins;
  } else {
    // Ex: 22:00 – 08:00 (vira meia-noite)
    return currentMins >= startMins || currentMins < endMins;
  }
}
