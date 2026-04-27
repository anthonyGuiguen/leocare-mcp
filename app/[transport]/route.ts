import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { simulateTarif } from "@/lib/coherent";

const WIDGET_URI = "ui://leocare/quote.html";

function buildWidgetHtml(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    background:linear-gradient(160deg,#5B4FCF 0%,#7C6FE0 100%);
    display:flex;flex-direction:column;align-items:center;
    padding:20px 12px 24px;min-height:100vh;
  }
  .header{text-align:center;margin-bottom:20px;color:#fff}
  .header-label{font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-bottom:6px}
  .header-formule{font-size:26px;font-weight:800;line-height:1.1}
  .card{background:#fff;border-radius:20px;padding:24px 20px 20px;width:100%;max-width:380px;color:#1a1a2e}
  .loading{text-align:center;color:#888;padding:48px 0;font-size:14px}

  /* Prix */
  .price-block{text-align:center;padding-bottom:18px;border-bottom:1px solid #f0f0f0;margin-bottom:18px}
  .a-partir{display:inline-block;background:#e8f5f0;color:#00A887;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:20px;padding:3px 10px;margin-bottom:10px}
  .price-main{font-size:44px;font-weight:800;color:#5B4FCF;line-height:1}
  .price-main span{font-size:18px;font-weight:500;color:#888;margin-left:4px}
  .price-annual{font-size:14px;color:#888;margin-top:6px}
  .price-annual strong{color:#5B4FCF;font-weight:600}

  /* Récap */
  .recap-title{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#aaa;margin-bottom:10px}
  .recap-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}
  .recap-item{background:#f7f7fb;border-radius:10px;padding:10px 12px}
  .recap-item-label{font-size:10px;color:#aaa;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
  .recap-item-value{font-size:13px;font-weight:700;color:#1a1a2e}

  /* CTA */
  .cta{
    display:block;background:#3D2FA0;color:#fff;
    text-align:center;border-radius:50px;padding:15px;
    font-weight:700;font-size:15px;text-decoration:none;
    transition:opacity .15s;
  }
  .cta:hover{opacity:.9}
  .legal{font-size:10px;color:#bbb;margin-top:12px;line-height:1.5;text-align:center}
</style>
</head>
<body>
<div class="header">
  <div class="header-label">Ton estimation</div>
  <div class="header-formule" id="h-formule"></div>
</div>
<div class="card">
  <div class="loading" id="loading">Chargement de votre estimation…</div>
  <div id="content" style="display:none">

    <div class="price-block">
      <div><span class="a-partir">À partir de</span></div>
      <div class="price-main"><span id="monthly"></span> €<span>/mois</span></div>
      <div class="price-annual">soit <strong><span id="annual"></span> €</strong> par an</div>
    </div>

    <div class="recap-title">Ton profil</div>
    <div class="recap-grid">
      <div class="recap-item">
        <div class="recap-item-label">Date de naissance</div>
        <div class="recap-item-value" id="r-naissance"></div>
      </div>
      <div class="recap-item">
        <div class="recap-item-label">Permis obtenu</div>
        <div class="recap-item-value" id="r-permis"></div>
      </div>
      <div class="recap-item" style="grid-column:1/-1">
        <div class="recap-item-label">1ère immatriculation</div>
        <div class="recap-item-value" id="r-mec"></div>
      </div>
    </div>

    <a id="cta" class="cta" href="#" target="_blank" rel="noopener noreferrer">Obtenir mon devis précis →</a>
    <div class="legal">*Tarif indicatif, non contractuel. Le tarif définitif est calculé lors du devis en ligne.</div>
  </div>
</div>
<script>
var shown = false;

function fmt(iso){
  if(!iso) return '—';
  var p = iso.split('-');
  if(p.length!==3) return iso;
  return p[2]+'/'+p[1]+'/'+p[0];
}

function show(d, input){
  if(shown) return;
  if(!d || d.prix_annuel===undefined) return;
  shown = true;
  document.getElementById('h-formule').textContent = d.formule || '';
  document.getElementById('monthly').textContent = d.prix_mensuel;
  document.getElementById('annual').textContent = d.prix_annuel;
  document.getElementById('cta').href = d.cta_url || '#';
  if(input){
    document.getElementById('r-naissance').textContent = fmt(input.date_naissance);
    document.getElementById('r-permis').textContent = fmt(input.date_permis);
    document.getElementById('r-mec').textContent = fmt(input.date_mec);
  }
  document.getElementById('loading').style.display='none';
  document.getElementById('content').style.display='block';
}

function check(){
  try{
    var oi = window.openai;
    if(oi && oi.toolOutput && oi.toolOutput.prix_annuel !== undefined){
      show(oi.toolOutput, oi.toolInput);
      return;
    }
  }catch(e){}
  setTimeout(check, 300);
}

check();
</script>
</body>
</html>`;
}

const handler = createMcpHandler(async (server) => {
  const widgetHtml = buildWidgetHtml();

  server.registerResource(
    "leocare-quote-widget",
    WIDGET_URI,
    {
      title: "Leocare Quote Widget",
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": "Carte de tarification assurance auto Leocare",
        "openai/widgetPrefersBorder": false,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: widgetHtml,
          _meta: {
            "openai/widgetDescription": "Carte de tarification assurance auto Leocare",
            "openai/widgetPrefersBorder": false,
          },
        },
      ],
    })
  );

  server.registerTool(
    "simulateCarInsurance",
    {
      title: "Simuler un tarif assurance auto Leocare",
      description:
        "Calcule le tarif d'assurance auto Leocare à partir de la date de naissance, date de permis, date de première immatriculation et formule choisie (F1=Tiers, F2=Tiers+, F3=Tiers+ Confort, F4=Tous risques).",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: {
        date_naissance: z.string().describe("Date de naissance au format YYYY-MM-DD"),
        date_permis: z.string().describe("Date d'obtention du permis au format YYYY-MM-DD"),
        date_mec: z.string().describe("Date de première immatriculation au format YYYY-MM-DD"),
        numero_formule: z.string().describe(
          "Formule : F1=Tiers, F2=Tiers+, F3=Tiers+ Confort, F4=Tous risques"
        ),
      } as any,
      _meta: {
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Calcul du tarif en cours…",
        "openai/toolInvocation/invoked": "Tarif calculé.",
        "openai/widgetAccessible": false,
        "openai/resultCanProduceWidget": true,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async ({ date_naissance, date_permis, date_mec, numero_formule }: any) => {
      const result = await simulateTarif({ date_naissance, date_permis, date_mec, numero_formule });

      if (!result.eligible) {
        return {
          content: [{ type: "text" as const, text: `Profil non éligible : ${result.message}` }],
        };
      }

      return {
        structuredContent: {
          formule: result.formule,
          prix_mensuel: result.prix_mensuel,
          prix_annuel: result.prix_annuel,
          cta_url: "https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance",
        },
        content: [
          {
            type: "text" as const,
            text: `Formule ${result.formule} : à partir de ${result.prix_mensuel} €/mois (${result.prix_annuel} €/an).`,
          },
        ],
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/resultCanProduceWidget": true,
        },
      };
    }
  );
}, {}, { basePath: "", maxDuration: 60 });

export const GET = handler;
export const POST = handler;
