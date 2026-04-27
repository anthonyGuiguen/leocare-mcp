"use client";

export default function QuotePage() {
  return (
    <div id="leocare-quote" style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "transparent",
      display: "flex",
      justifyContent: "center",
      padding: "8px",
    }}>
      <div id="card" style={{
        background: "#1c1c1e",
        borderRadius: "16px",
        padding: "24px 20px 20px",
        width: "100%",
        maxWidth: "360px",
        color: "#fff",
      }}>
        <div style={{ textAlign: "center", color: "#666", padding: "40px 0", fontSize: "14px" }}>
          Chargement de votre estimation…
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          function render(data) {
            if (!data) return;
            var card = document.getElementById('card');
            card.innerHTML =
              '<div style="display:inline-block;background:#2c2c2e;border-radius:8px;padding:5px 12px;font-size:12px;color:#aaa;margin-bottom:6px">Ton estimation*</div>' +
              '<div style="font-size:48px;font-weight:800;line-height:1.1;color:#fff">' + data.prix_annuel + ' \u20ac<span style="font-size:22px;font-weight:400;color:#888"> /an</span></div>' +
              '<div style="font-size:15px;color:#888;margin-top:4px;margin-bottom:18px">soit \u00e0 partir de ' + data.prix_mensuel + ' \u20ac /mois</div>' +
              '<div style="background:#2c2c2e;border-radius:12px;padding:12px 16px;margin-bottom:16px">' +
                '<div style="font-weight:700;font-size:13px;margin-bottom:8px">Ta formule</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:13px;color:#aaa;padding:4px 0"><span>Couverture</span><span style="color:#fff;font-weight:500">' + data.formule + '</span></div>' +
              '</div>' +
              '<a href="' + data.cta_url + '" target="_blank" style="display:block;background:#1d4ed8;color:#fff;text-align:center;border-radius:10px;padding:13px;font-weight:700;font-size:15px;text-decoration:none">Obtenir mon devis pr\u00e9cis</a>' +
              '<div style="font-size:11px;color:#555;margin-top:12px;line-height:1.5;text-align:center">*Prix \u00e0 partir de, bas\u00e9 sur un profil type. Le tarif d\u00e9finitif est calcul\u00e9 lors du devis en ligne.</div>';
          }

          window.addEventListener('message', function(event) {
            if (event.source !== window.parent) return;
            var msg = event.data;
            if (!msg || msg.jsonrpc !== '2.0') return;
            if (msg.method === 'ui/initialize') {
              window.parent.postMessage({ jsonrpc: '2.0', id: msg.id, result: {} }, '*');
              var d = (msg.params && msg.params.toolResult && msg.params.toolResult.structuredContent)
                   || (msg.params && msg.params.structuredContent);
              if (d) render(d);
            }
            if (msg.method === 'ui/notifications/tool-result') {
              var d = msg.params && msg.params.structuredContent;
              if (d) render(d);
            }
          });

          if (window.openai && window.openai.toolOutput) render(window.openai.toolOutput);
          window.parent.postMessage({ jsonrpc: '2.0', id: 1, method: 'ui/ready', params: {} }, '*');
        })();
      ` }} />
    </div>
  );
}
