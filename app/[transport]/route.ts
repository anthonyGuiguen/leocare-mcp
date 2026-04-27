import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { simulateTarif } from "@/lib/coherent";

const WIDGET_URI = "ui://leocare/quote.html";

function buildWidgetHtml(): string {
  const ICON_SVG = `<svg width="36" height="36" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#lci)"><rect width="60" height="60" fill="#6F43D5"/></g><path fill-rule="evenodd" clip-rule="evenodd" d="M45.1533 39.5781C42.8933 40.2901 40.2463 40.7311 38.2453 40.7311C31.9343 40.7311 27.5273 36.4021 27.5273 30.2031C27.5273 23.9521 31.9263 19.7521 38.4733 19.7521C40.5383 19.7521 43.0353 20.1481 44.8353 20.7611L45.7303 21.0661L44.9703 25.2451L43.8303 24.9541C41.9243 24.4681 40.0273 24.1901 38.6263 24.1901C34.8103 24.1901 32.3453 26.5651 32.3453 30.2411C32.3453 33.8941 34.6913 36.2561 38.3213 36.2561C39.6693 36.2561 41.8933 35.8901 44.1263 35.3031L45.2603 35.0041L46.0873 39.2841L45.1533 39.5781ZM27.0003 13.0001L20.6613 37.0091C20.2263 37.0511 19.8303 37.0731 19.4883 37.0731C18.8223 37.0731 18.1993 36.9961 17.6223 36.8491C17.3883 36.7911 17.1593 36.7161 16.9463 36.6031C15.5503 35.8681 15.0003 33.5281 15.0003 31.0001V13.0001H10.0003V31.0001C10.0003 36.2921 12.2643 40.7151 16.3933 41.7471C17.3173 41.9621 18.3043 42.0551 19.3353 42.0591L17.3153 49.7541L50.0003 44.0001V13.0001H27.0003Z" fill="white"/><defs><clipPath id="lci"><rect width="60" height="60" fill="white"/></clipPath></defs></svg>`;
  const ICON_BIRTHDAY = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3.81818C7.3352 3.81818 7.65668 3.68409 7.8937 3.44541C8.13073 3.20673 8.26389 2.883 8.26389 2.54545C8.26389 2.30364 8.20069 2.08091 8.08062 1.89L7 0L5.91937 1.89C5.79931 2.08091 5.73611 2.30364 5.73611 2.54545C5.73611 3.24545 6.30486 3.81818 7 3.81818ZM10.7917 5.72727H7.63194V4.45455H6.36806V5.72727H3.20833C2.15931 5.72727 1.3125 6.58 1.3125 7.63636V13.3636C1.3125 13.7136 1.59687 14 1.94444 14H12.0556C12.4031 14 12.6875 13.7136 12.6875 13.3636V7.63636C12.6875 6.58 11.8407 5.72727 10.7917 5.72727ZM11.4236 12.7273H2.57639V10.8182C3.14514 10.8182 3.68861 10.5827 4.09306 10.1818L4.78819 9.49454L5.45806 10.1818C6.2859 11.0091 7.72674 11.0027 8.54826 10.1818L9.23076 9.49454L9.90694 10.1818C10.3114 10.5827 10.8549 10.8182 11.4236 10.8182V12.7273ZM11.4236 9.86364C11.1076 9.86364 10.7917 9.73636 10.5705 9.50091L9.21181 8.14545L7.87208 9.50091C7.40444 9.97182 6.58924 9.97182 6.1216 9.50091L4.78819 8.14545L3.42319 9.50091C3.20833 9.73 2.89236 9.86364 2.57639 9.86364V7.63636C2.57639 7.28636 2.86076 7 3.20833 7H10.7917C11.1392 7 11.4236 7.28636 11.4236 7.63636V9.86364Z" fill="#58627C"/></svg>`;
  const ICON_CALENDAR = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#cal)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.099 1.1665C10.099 0.743661 9.75618 0.400879 9.33334 0.400879C8.91049 0.400879 8.56771 0.743661 8.56771 1.1665V1.56753H5.43229V1.1665C5.43229 0.743661 5.08951 0.400879 4.66666 0.400879C4.24382 0.400879 3.90104 0.743661 3.90104 1.1665V1.56753H2.91667C1.84949 1.56753 0.984375 2.43264 0.984375 3.49982V11.6665C0.984375 12.7337 1.84949 13.5988 2.91667 13.5988H11.0833C12.1505 13.5988 13.0156 12.7337 13.0156 11.6665V3.49982C13.0156 2.43264 12.1505 1.56753 11.0833 1.56753H10.099V1.1665ZM11.4844 5.06753V3.49982C11.4844 3.27833 11.3048 3.09878 11.0833 3.09878H10.099V3.49984C10.099 3.92268 9.75618 4.26546 9.33334 4.26546C8.91049 4.26546 8.56771 3.92268 8.56771 3.49984V3.09878H5.43229V3.49984C5.43229 3.92268 5.08951 4.26546 4.66666 4.26546C4.24382 4.26546 3.90104 3.92268 3.90104 3.49984V3.09878H2.91667C2.69518 3.09878 2.51562 3.27833 2.51562 3.49982V5.06753H11.4844ZM2.51562 6.59878H11.4844V11.6665C11.4844 11.888 11.3048 12.0675 11.0833 12.0675H2.91667C2.69518 12.0675 2.51562 11.888 2.51562 11.6665V6.59878Z" fill="#58627C"/></g><defs><clipPath id="cal"><rect width="14" height="14" fill="white"/></clipPath></defs></svg>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Paytone+One&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  html{background:#6F43D6}
  body{font-family:'Satoshi',sans-serif;background:linear-gradient(160deg,#6F43D6 0%,#8B6BE0 100%);display:flex;flex-direction:column;align-items:center;padding:28px 16px 32px;min-height:100vh;width:100%}
  .tagline{font-family:'Paytone One',sans-serif;font-size:20px;color:#fff;text-align:center;margin-bottom:12px;max-width:400px;width:100%;padding:0 8px}
  .card{background:#fff;border-radius:24px;padding:20px;width:100%;max-width:400px;color:#2E374D;box-shadow:0 8px 32px rgba(0,0,0,.18)}
  .card-header{position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
  .card-icon{position:absolute;left:0;width:40px;height:40px;border-radius:50%;overflow:hidden;padding:2px;background:#6F43D5}
  .card-title{font-family:'Paytone One',sans-serif;font-size:24px;color:#2E374D;text-align:center}
  .price-block{text-align:center;padding-bottom:8px;margin-bottom:8px}
  .price-main{font-family:'Satoshi',sans-serif;font-size:20px;font-weight:900;color:#6F43D6;line-height:1}
  .price-main .unit{font-family:'Satoshi',sans-serif;font-size:16px;font-weight:500;color:#2E374D;margin-left:2px}
  .price-annual{font-family:'Satoshi',sans-serif;font-size:12px;font-weight:500;color:#58627C;margin-top:8px}
  .recap-title{font-family:'Satoshi',sans-serif;font-size:18px;font-weight:900;color:#2E374D;margin-bottom:8px}
  .recap-subcard{border:1px solid #E8E8EF;border-radius:16px;padding:0 16px;margin-bottom:24px}
  .recap-row{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F5}
  .recap-row:last-child{border-bottom:none}
  .recap-icon{flex-shrink:0;width:20px;display:flex;align-items:center;justify-content:center;padding-top:2px}
  .recap-row-label{font-family:'Satoshi',sans-serif;font-size:14px;font-weight:900;color:#58627C;margin-bottom:2px}
  .recap-row-value{font-family:'Satoshi',sans-serif;font-size:16px;font-weight:500;color:#2E374D}
  .cta{display:block;background:#6F43D6;color:#fff;text-align:center;border-radius:50px;padding:16px;font-family:'Satoshi',sans-serif;font-weight:700;font-size:16px;text-decoration:none;transition:opacity .15s}
  .cta:hover{opacity:.88}
  .legal{font-family:'Satoshi',sans-serif;font-size:10px;color:#58627C;margin-top:14px;line-height:1.6;text-align:center}
  .legal a{color:#6F43D6;text-decoration:underline}
  /* Skeleton */
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  .sk{background:linear-gradient(90deg,#F0F0F5 25%,#E4E4EC 50%,#F0F0F5 75%);background-size:800px 100%;animation:shimmer 1.5s infinite linear;border-radius:6px}
  .sk-circle{width:40px;height:40px;border-radius:50%}
  .sk-title{height:24px;width:55%}
  .sk-price{height:28px;width:50%}
  .sk-annual{height:14px;width:65%}
  .sk-section{height:20px;width:35%}
  .sk-icon{width:14px;height:14px}
  .sk-label{height:12px;width:55%}
  .sk-value{height:16px;width:40%}
  .sk-cta{height:52px;width:100%;border-radius:50px}
</style>
</head>
<body>
<div class="tagline">Votre bolide assuré à partir de...</div>
<div class="card">
  <div id="loading">
    <div style="display:flex;flex-direction:column;align-items:center;padding:12px 0 8px;gap:20px">
      <div style="display:flex;align-items:center;gap:12px;width:100%"><div class="sk sk-circle"></div><div class="sk sk-title"></div></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%"><div class="sk sk-price"></div><div class="sk sk-annual"></div></div>
      <div class="sk sk-section" style="align-self:flex-start"></div>
      <div style="border:1px solid #E8E8EF;border-radius:16px;padding:0 16px;width:100%">
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F5"><div class="sk sk-icon"></div><div style="display:flex;flex-direction:column;gap:6px;flex:1"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F5"><div class="sk sk-icon"></div><div style="display:flex;flex-direction:column;gap:6px;flex:1"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0"><div class="sk sk-icon"></div><div style="display:flex;flex-direction:column;gap:6px;flex:1"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
      </div>
      <div class="sk sk-cta"></div>
    </div>
  </div>
  <div id="content" style="display:none">

    <div class="card-header">
      <div class="card-icon">${ICON_SVG}</div>
      <div class="card-title" id="h-formule"></div>
    </div>

    <div class="price-block">
      <div class="price-main"><span id="monthly"></span> €<span class="unit">/mois</span></div>
      <div class="price-annual">Payez annuellement, <span id="annual"></span> €</div>
    </div>

    <div class="recap-title">Ton profil</div>
    <div class="recap-subcard">
      <div class="recap-row">
        <div class="recap-icon">${ICON_BIRTHDAY}</div>
        <div><div class="recap-row-label">Date de naissance</div><div class="recap-row-value" id="r-naissance"></div></div>
      </div>
      <div class="recap-row">
        <div class="recap-icon">${ICON_CALENDAR}</div>
        <div><div class="recap-row-label">Permis obtenu le</div><div class="recap-row-value" id="r-permis"></div></div>
      </div>
      <div class="recap-row">
        <div class="recap-icon">${ICON_CALENDAR}</div>
        <div><div class="recap-row-label">Date de mise en circulation</div><div class="recap-row-value" id="r-mec"></div></div>
      </div>
    </div>

    <a id="cta" class="cta" href="https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance" target="_blank" rel="noopener noreferrer">Obtenir mon devis précis</a>
    <div class="legal">*Cette estimation est indicative, avec des compléments générés par IA. Pour un tarif précis et personnalisé, merci de réaliser un devis sur <a href="https://leocare.eu" target="_blank" rel="noopener noreferrer">leocare.eu</a>.</div>

  </div>
</div>
<script>
var shown=false;
function fmt(iso){if(!iso)return'—';var p=iso.split('-');return p.length!==3?iso:p[2]+'/'+p[1]+'/'+p[0];}
function show(d,input){
  if(shown)return;
  if(!d||d.prix_annuel===undefined)return;
  shown=true;
  document.getElementById('h-formule').textContent=d.formule||'';
  document.getElementById('monthly').textContent=d.prix_mensuel;
  document.getElementById('annual').textContent=d.prix_annuel;
  if(input){
    document.getElementById('r-naissance').textContent=fmt(input.date_naissance);
    document.getElementById('r-permis').textContent=fmt(input.date_permis);
    document.getElementById('r-mec').textContent=fmt(input.date_mec);
  }
  document.getElementById('loading').style.display='none';
  document.getElementById('content').style.display='block';
}
function check(){
  try{var oi=window.openai;if(oi&&oi.toolOutput&&oi.toolOutput.prix_annuel!==undefined){show(oi.toolOutput,oi.toolInput);return;}}catch(e){}
  setTimeout(check,300);
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
        `Calcule une estimation de tarif d'assurance auto Leocare.

APPELER UNIQUEMENT quand les 4 paramètres sont collectés et validés — jamais avant.

VALIDATION AVANT APPEL :
- Toutes les dates doivent être dans le passé
- date_permis doit être postérieure à date_naissance + 16 ans minimum
- Convertir les dates saisies en JJ/MM/AAAA vers le format YYYY-MM-DD

FORMULES :
- F1 = Tiers, F2 = Tiers+, F3 = Tiers+ Confort, F4 = Tous risques`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: {
        date_naissance: z.string().describe("Date de naissance au format YYYY-MM-DD"),
        date_permis: z.string().describe("Date d'obtention du permis au format YYYY-MM-DD"),
        date_mec: z.string().describe("Date de première immatriculation au format YYYY-MM-DD"),
        numero_formule: z.string().describe(
          "Formule : F1=Tiers, F2=Tiers+, F3=Tiers+ Confort, F4=Tous risques"
        ),
      } as any,
      outputSchema: {
        type: "object",
        properties: {
          formule:      { type: "string", description: "Nom commercial de la formule choisie" },
          prix_mensuel: { type: "number", description: "Prix mensuel TTC en euros" },
          prix_annuel:  { type: "number", description: "Prix annuel TTC en euros" },
        },
        required: ["formule", "prix_mensuel", "prix_annuel"],
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
}, {
  instructions: `Tu es l'assistant Leocare, une néo-assurance auto française 100% en ligne.

COMPORTEMENT GÉNÉRAL :
- Ton décontracté, moderne et bienveillant — tu tutoies l'utilisateur
- Réponds toujours en français
- Pose les questions une par une, dans l'ordre, sans en sauter
- Ne demande jamais le nom, prénom ou email
- Ne donne pas de conseils juridiques ou financiers
- Si l'utilisateur pose une question hors sujet, réponds brièvement et ramène-le au fil de la simulation
- En cas de profil non éligible, sois empathique et oriente vers leocare.eu sans détails techniques

FLOW DE SIMULATION :
1. Accueille chaleureusement et demande la date de naissance (JJ/MM/AAAA)
2. Demande la date d'obtention du permis (JJ/MM/AAAA)
3. Demande la date de 1ère mise en circulation du véhicule (JJ/MM/AAAA)
4. Présente les 4 formules et demande laquelle l'intéresse :
   - Tiers (F1) : responsabilité civile uniquement
   - Tiers+ (F2) : + bris de glace, vol, incendie
   - Tiers+ Confort (F3) : + catastrophes naturelles, effets personnels
   - Tous risques (F4) : couverture maximale
5. Appelle immédiatement simulateCarInsurance avec les 4 paramètres
6. Après l'estimation, invite à cliquer sur le bouton pour un devis précis et propose de recalculer avec une autre formule si souhaité`,
}, { basePath: "", maxDuration: 60 });

export const GET = handler;
export const POST = handler;
