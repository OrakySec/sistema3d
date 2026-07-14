"use client";

import { useState, useEffect } from "react";

export function SupportButton() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      setHidden((e as CustomEvent<{ open: boolean }>).detail.open);
    }
    window.addEventListener("bottomnav:more", handler);
    return () => window.removeEventListener("bottomnav:more", handler);
  }, []);

  if (hidden) return null;

  return (
    <a
      href="https://wa.me/5581992321938"
      target="_blank"
      rel="noopener noreferrer"
      title="Suporte via WhatsApp"
      className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 md:bottom-6 md:right-6"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.1 1.504 5.83L.057 23.43a.5.5 0 0 0 .608.61l5.7-1.43A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.87 9.87 0 0 1-5.031-1.377l-.36-.214-3.733.936.998-3.638-.235-.374A9.86 9.86 0 0 1 2.1 12C2.1 6.533 6.533 2.1 12 2.1c5.468 0 9.9 4.432 9.9 9.9 0 5.467-4.432 9.9-9.9 9.9z"/>
      </svg>
    </a>
  );
}
