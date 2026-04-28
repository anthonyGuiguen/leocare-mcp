import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,

  async headers() {
    return [
      {
        // Headers appliqués à toutes les routes
        source: "/:path*",
        headers: [
          // Empêche le sniffing de type MIME
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Ne pas envoyer le Referer vers des sites tiers
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Désactiver les API sensibles (caméra, micro, géoloc) non utilisées
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Forcer HTTPS pendant 1 an (Vercel gère déjà ça, mais bonne pratique)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // CSP : autoriser les fonts externes utilisées dans le widget inline
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // unsafe-inline nécessaire pour le widget HTML inline
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
              "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'", // remplace X-Frame-Options
            ].join("; "),
          },
        ],
      },
      {
        // La route /quote est un widget iframe — autoriser l'embed par les LLM connus
        // et assouplir la CSP pour les fonts
        source: "/quote",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
              "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors https://chatgpt.com https://chat.openai.com https://claude.ai https://copilot.microsoft.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
