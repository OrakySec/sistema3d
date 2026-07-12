import crypto from "crypto";

const PIXEL_ID = "1389875989686187";
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN!;
const API_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

function hash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashPhone(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export interface MetaUserData {
  email?:      string | null;
  phone?:      string | null;
  name?:       string | null;
  city?:       string | null;
  fbc?:        string | null; // _fbc cookie
  fbp?:        string | null; // _fbp cookie
  clientIp?:   string | null;
  userAgent?:  string | null;
}

export interface MetaEventParams {
  eventName:      string;
  eventId:        string;
  eventSourceUrl?: string;
  userData?:      MetaUserData;
  customData?:    Record<string, unknown>;
}

export async function sendConversionEvent(params: MetaEventParams): Promise<void> {
  const { eventName, eventId, eventSourceUrl, userData = {}, customData } = params;

  const nameParts = userData.name?.trim().split(" ") ?? [];

  const payload = {
    data: [
      {
        event_name:       eventName,
        event_time:       Math.floor(Date.now() / 1000),
        event_id:         eventId,
        event_source_url: eventSourceUrl,
        action_source:    "website",
        user_data: {
          em:                  hash(userData.email),
          ph:                  hashPhone(userData.phone),
          fn:                  hash(nameParts[0]),
          ln:                  hash(nameParts.slice(1).join(" ") || undefined),
          ct:                  hash(userData.city),
          country:             hash("br"),
          fbc:                 userData.fbc  ?? undefined,
          fbp:                 userData.fbp  ?? undefined,
          client_ip_address:   userData.clientIp   ?? undefined,
          client_user_agent:   userData.userAgent  ?? undefined,
        },
        ...(customData ? { custom_data: customData } : {}),
      },
    ],
  };

  try {
    await fetch(`${API_URL}?access_token=${ACCESS_TOKEN}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[meta-capi]", err);
  }
}
