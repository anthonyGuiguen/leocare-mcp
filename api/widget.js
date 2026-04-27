export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 8px;
  }
  .card {
    background: #1c1c1e;
    border-radius: 16px;
    padding: 24px 20px 20px;
    width: 100%;
    max-width: 360px;
    color: #fff;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 18px;
  }
  .badge {
    display: inline-block;
    background: #2c2c2e;
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    color: #aaa;
    margin-bottom: 6px;
  }
  .price-main {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    color: #fff;
  }
  .price-main span { font-size: 22px; font-weight: 400; color: #888; }
  .price-monthly {
    font-size: 15px;
    color: #888;
    margin-top: 4px;
    margin-bottom: 18px;
  }
  .profile {
    background: #2c2c2e;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  .profile-title { font-weight: 700; font-size: 13px; margin-bottom: 8px; }
  .profile-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #aaa;
    padding: 4px 0;
  }
  .profile-row span:last-child { color: #fff; font-weight: 500; }
  .cta {
    display: block;
    background: #1d4ed8;
    color: #fff;
    text-align: center;
    border-radius: 10px;
    padding: 13px;
    font-weight: 700;
    font-size: 15px;
    text-decoration: none;
    cursor: pointer;
    border: none;
    width: 100%;
  }
  .cta:hover { background: #1e40af; }
  .disclaimer {
    font-size: 11px;
    color: #555;
    margin-top: 12px;
    line-height: 1.5;
    text-align: center;
  }
  .loading {
    text-align: center;
    color: #666;
    padding: 40px 0;
    font-size: 14px;
  }
</style>
</head>
<body>
<div class="card" id="card">
  <div class="loading">Chargement de votre estimation…</div>
</div>

<script>
  function render(data) {
    if (!data) return;
    const card = document.getElementById('card');
    card.innerHTML = \`
      <div class="header">🚗 Assurance auto Leocare</div>
      <div class="badge">Ton estimation*</div>
      <div class="price-main">\${data.prix_annuel} €<span> /an</span></div>
      <div class="price-monthly">soit à partir de \${data.prix_mensuel} € /mois</div>
      <div class="profile">
        <div class="profile-title">Ta formule</div>
        <div class="profile-row"><span>Couverture</span><span>\${data.formule}</span></div>
      </div>
      <a class="cta" href="https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance" target="_blank">
        Obtenir mon devis précis
      </a>
      <div class="disclaimer">*Prix à partir de, basé sur un profil type. Le tarif définitif est calculé lors du devis en ligne.</div>
    \`;
  }

  // 1. Données via window.openai.toolOutput (Apps SDK legacy)
  if (window.openai && window.openai.toolOutput) {
    render(window.openai.toolOutput);
  }

  // 2. Données via openai:set_globals (Apps SDK event)
  window.addEventListener('openai:set_globals', (event) => {
    const data = event.detail?.globals?.toolOutput;
    if (data) render(data);
  }, { passive: true });

  // 3. Données via MCP Apps bridge (ui/notifications/tool-result)
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || msg.jsonrpc !== '2.0') return;
    if (msg.method !== 'ui/notifications/tool-result') return;
    const data = msg.params?.structuredContent;
    if (data) render(data);
  }, { passive: true });
</script>
</body>
</html>`);
}
