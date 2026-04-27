"use client";

import { useEffect, useState } from "react";

interface QuoteData {
  formule: string;
  prix_mensuel: number;
  prix_annuel: number;
  cta_url: string;
}

export default function QuotePage() {
  const [data, setData] = useState<QuoteData | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== "2.0") return;

      if (msg.method === "ui/initialize") {
        // Répondre au handshake
        window.parent.postMessage({ jsonrpc: "2.0", id: msg.id, result: {} }, "*");
        const d =
          msg.params?.toolResult?.structuredContent ??
          msg.params?.structuredContent;
        if (d) setData(d);
      }

      if (msg.method === "ui/notifications/tool-result") {
        const d = msg.params?.structuredContent;
        if (d) setData(d);
      }
    }

    window.addEventListener("message", handleMessage);

    // Fallback Apps SDK legacy
    const openai = (window as any).openai;
    if (openai?.toolOutput) setData(openai.toolOutput);

    // Signaler que le widget est prêt
    window.parent.postMessage({ jsonrpc: "2.0", id: 1, method: "ui/ready", params: {} }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "transparent",
      display: "flex",
      justifyContent: "center",
      padding: "8px",
      margin: 0,
    }}>
      <div style={{
        background: "#1c1c1e",
        borderRadius: "16px",
        padding: "24px 20px 20px",
        width: "100%",
        maxWidth: "360px",
        color: "#fff",
      }}>
        {!data ? (
          <div style={{ textAlign: "center", color: "#666", padding: "40px 0", fontSize: "14px" }}>
            Chargement de votre estimation…
          </div>
        ) : (
          <>
            <div style={{
              display: "inline-block", background: "#2c2c2e", borderRadius: "8px",
              padding: "5px 12px", fontSize: "12px", color: "#aaa", marginBottom: "6px",
            }}>
              Ton estimation*
            </div>

            <div style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.1, color: "#fff" }}>
              {data.prix_annuel} €
              <span style={{ fontSize: "22px", fontWeight: 400, color: "#888" }}> /an</span>
            </div>

            <div style={{ fontSize: "15px", color: "#888", marginTop: "4px", marginBottom: "18px" }}>
              soit à partir de {data.prix_mensuel} € /mois
            </div>

            <div style={{
              background: "#2c2c2e", borderRadius: "12px",
              padding: "12px 16px", marginBottom: "16px",
            }}>
              <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>Ta formule</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#aaa", padding: "4px 0" }}>
                <span>Couverture</span>
                <span style={{ color: "#fff", fontWeight: 500 }}>{data.formule}</span>
              </div>
            </div>

            <a
              href={data.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", background: "#1d4ed8", color: "#fff",
                textAlign: "center", borderRadius: "10px", padding: "13px",
                fontWeight: 700, fontSize: "15px", textDecoration: "none",
              }}
            >
              Obtenir mon devis précis
            </a>

            <div style={{
              fontSize: "11px", color: "#555", marginTop: "12px",
              lineHeight: 1.5, textAlign: "center",
            }}>
              *Prix à partir de, basé sur un profil type. Le tarif définitif est calculé lors du devis en ligne.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
