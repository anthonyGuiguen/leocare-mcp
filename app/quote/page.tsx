"use client";

import { useEffect, useState } from "react";

// Origines LLM autorisées à envoyer des postMessages au widget
const ALLOWED_ORIGINS = [
  "https://chatgpt.com",
  "https://chat.openai.com",
  "https://claude.ai",
  "https://copilot.microsoft.com",
  "https://leocare-mcp.vercel.app",
];

// URL de fallback si cta_url est absente ou invalide
const FALLBACK_CTA = "https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance";

function sanitizeCtaUrl(url: unknown): string {
  if (typeof url === "string" && url.startsWith("https://")) return url;
  return FALLBACK_CTA;
}

interface QuoteData {
  formule: string;
  prix_mensuel: number;
  prix_annuel: number;
  cta_url: string;
}

function extractQuoteData(msg: any): QuoteData | null {
  if (!msg || typeof msg !== "object") return null;

  // Tentative 1 : structuredContent direct
  const sc =
    msg.structuredContent ??
    msg.params?.structuredContent ??
    msg.params?.toolResult?.structuredContent ??
    msg.result?.structuredContent ??
    msg.data?.structuredContent;

  if (sc?.prix_annuel !== undefined) return sc as QuoteData;

  // Tentative 2 : les champs sont à la racine du message
  if (msg.prix_annuel !== undefined) return msg as QuoteData;

  // Tentative 3 : dans toolResult direct
  const tr = msg.toolResult ?? msg.params?.toolResult ?? msg.result;
  if (tr?.prix_annuel !== undefined) return tr as QuoteData;

  return null;
}

export default function QuotePage() {
  const [data, setData] = useState<QuoteData | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const debug = process.env.NEXT_PUBLIC_DEBUG_WIDGET === "true";

  useEffect(() => {
    // Tenter de récupérer depuis window.openai (SDK legacy)
    const openai = (window as any).openai;
    if (openai?.toolOutput) {
      const d = extractQuoteData(openai.toolOutput);
      if (d) { setData(d); return; }
    }

    function handleMessage(event: MessageEvent) {
      // Rejeter les messages provenant d'origines non autorisées
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;

      const msg = event.data;

      if (debug) {
        setDebugLog((prev) => [
          ...prev.slice(-10),
          JSON.stringify(msg).slice(0, 300),
        ]);
      }

      // Répondre au handshake ui/initialize quelle que soit la structure
      if (msg?.method === "ui/initialize" || msg?.type === "ui/initialize") {
        window.parent.postMessage(
          { jsonrpc: "2.0", id: msg.id ?? 1, result: {} },
          event.origin
        );
      }

      const extracted = extractQuoteData(msg);
      if (extracted) setData(extracted);
    }

    window.addEventListener("message", handleMessage);

    // Signaler que le widget est prêt
    window.parent.postMessage(
      { jsonrpc: "2.0", id: 1, method: "ui/ready", params: {} },
      "*"
    );

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px",
        margin: 0,
      }}
    >
      <div
        style={{
          background: "#1c1c1e",
          borderRadius: "16px",
          padding: "24px 20px 20px",
          width: "100%",
          maxWidth: "360px",
          color: "#fff",
        }}
      >
        {!data ? (
          <div
            style={{
              textAlign: "center",
              color: "#666",
              padding: "40px 0",
              fontSize: "14px",
            }}
          >
            Chargement de votre estimation…
          </div>
        ) : (
          <>
            <div
              style={{
                display: "inline-block",
                background: "#2c2c2e",
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "12px",
                color: "#aaa",
                marginBottom: "6px",
              }}
            >
              Ton estimation*
            </div>

            <div
              style={{
                fontSize: "48px",
                fontWeight: 800,
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              {data.prix_annuel} €
              <span style={{ fontSize: "22px", fontWeight: 400, color: "#888" }}>
                {" "}
                /an
              </span>
            </div>

            <div
              style={{
                fontSize: "15px",
                color: "#888",
                marginTop: "4px",
                marginBottom: "18px",
              }}
            >
              soit à partir de {data.prix_mensuel} € /mois
            </div>

            <div
              style={{
                background: "#2c2c2e",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}
              >
                Ta formule
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#aaa",
                  padding: "4px 0",
                }}
              >
                <span>Couverture</span>
                <span style={{ color: "#fff", fontWeight: 500 }}>
                  {data.formule}
                </span>
              </div>
            </div>

            <a
              href={sanitizeCtaUrl(data.cta_url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "#1d4ed8",
                color: "#fff",
                textAlign: "center",
                borderRadius: "10px",
                padding: "13px",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              Obtenir mon devis précis
            </a>

            <div
              style={{
                fontSize: "11px",
                color: "#555",
                marginTop: "12px",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              *Prix à partir de, basé sur un profil type. Le tarif définitif est
              calculé lors du devis en ligne.
            </div>
          </>
        )}
      </div>

      {/* Debug panel — visible uniquement en développement */}
      {debug && debugLog.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            background: "#111",
            borderRadius: "8px",
            padding: "10px",
            width: "100%",
            maxWidth: "360px",
            fontSize: "10px",
            color: "#0f0",
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>DEBUG postMessages:</strong>
          {debugLog.map((l, i) => (
            <div key={i} style={{ marginTop: "4px", borderTop: "1px solid #222", paddingTop: "4px" }}>
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
