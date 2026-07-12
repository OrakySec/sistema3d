"use client";

import Script from "next/script";

const PIXEL_ID = "1389875989686187";

export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1" width="1" style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

/** Dispara evento no pixel do browser E na Conversions API (server-side) simultaneamente. */
export async function trackEvent(
  eventName: string,
  customData?: Record<string, unknown>
) {
  const eventSourceUrl = typeof window !== "undefined" ? window.location.href : undefined;

  // 1. Chama CAPI e recebe o eventId para deduplicação
  let eventId: string | undefined;
  try {
    const res  = await fetch("/api/meta/event", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ eventName, eventSourceUrl, customData }),
    });
    const data = await res.json();
    eventId = data.eventId;
  } catch {}

  // 2. Dispara no pixel do browser com o mesmo eventId (deduplicação)
  if (typeof window !== "undefined" && typeof (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq === "function") {
    const fbq = (window as unknown as { fbq: (...a: unknown[]) => void }).fbq;
    fbq("track", eventName, customData ?? {}, eventId ? { eventID: eventId } : {});
  }
}
