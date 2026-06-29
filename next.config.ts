import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para Docker multi-stage build
  output: "standalone",

  // Permitir imagens do MinIO e outros domínios externos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.seudominio.com.br",
      },
    ],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
