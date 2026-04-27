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
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:transparent;display:flex;flex-direction:column;align-items:center;padding:8px;min-height:100vh}
  .card{background:#1c1c1e;border-radius:16px;padding:24px 20px 20px;width:100%;max-width:360px;color:#fff}
  .loading{text-align:center;color:#666;padding:40px 0;font-size:14px}
  .badge{display:inline-block;background:#2c2c2e;border-radius:8px;padding:5px 12px;font-size:12px;color:#aaa;margin-bottom:6px}
  .price{font-size:48px;font-weight:800;line-height:1.1;color:#fff}
  .price span{font-size:22px;font-weight:400;color:#888}
  .sub{font-size:15px;color:#888;margin-top:4px;margin-bottom:18px}
  .box{background:#2c2c2e;border-radius:12px;padding:12px 16px;margin-bottom:16px}
  .box-title{font-weight:700;font-size:13px;margin-bottom:8px}
  .row{display:flex;justify-content:space-between;font-size:13px;color:#aaa;padding:4px 0}
  .row strong{color:#fff;font-weight:500}
  .cta{display:block;background:#1d4ed8;color:#fff;text-align:center;border-radius:10px;padding:13px;font-weight:700;font-size:15px;text-decoration:none}
  .legal{font-size:11px;color:#555;margin-top:12px;line-height:1.5;text-align:center}
  #debug{margin-top:12px;background:#111;border-radius:8px;padding:10px;width:100%;max-width:360px;font-size:10px;color:#0f0;word-break:break-all;white-space:pre-wrap;display:none}
</style>
</head>
<body>
<div class="card" id="card">
  <div class="loading" id="loading">Chargement de votre estimation…</div>
  <div id="content" style="display:none">
    <div class="badge">Ton estimation*</div>
    <div class="price"><span id="annual"></span> €<span> /an</span></div>
    <div class="sub">soit à partir de <span id="monthly"></span> € /mois</div>
    <div class="box">
      <div class="box-title">Ta formule</div>
      <div class="row"><span>Couverture</span><strong id="formule"></strong></div>
    </div>
    <a id="cta" class="cta" href="#" target="_blank" rel="noopener noreferrer">Obtenir mon devis précis</a>
    <div class="legal">*Prix à partir de, basé sur un profil type. Le tarif définitif est calculé lors du devis en ligne.</div>
  </div>
</div>
<div id="debug"></div>
<script>
var shown = false;
var dbg = null;

function log(label, val){
  if(!dbg) dbg = document.getElementById('debug');
  dbg.style.display = 'block';
  dbg.textContent += '['+label+'] '+JSON.stringify(val).slice(0,500)+'\\n---\\n';
}

function show(d){
  if(shown) return;
  if(!d || d.prix_annuel===undefined) return;
  shown = true;
  document.getElementById('annual').textContent = d.prix_annuel;
  document.getElementById('monthly').textContent = d.prix_mensuel;
  document.getElementById('formule').textContent = d.formule;
  document.getElementById('cta').href = d.cta_url || '#';
  document.getElementById('loading').style.display='none';
  document.getElementById('content').style.display='block';
}

function extract(msg){
  if(!msg||typeof msg!=='object') return null;
  // Chercher structuredContent partout
  var candidates = [
    msg.structuredContent,
    msg.params&&msg.params.structuredContent,
    msg.params&&msg.params.toolResult&&msg.params.toolResult.structuredContent,
    msg.result&&msg.result.structuredContent,
    msg.result&&msg.result.toolResult&&msg.result.toolResult.structuredContent,
    msg.data&&msg.data.structuredContent,
    msg.toolResult&&msg.toolResult.structuredContent,
  ];
  for(var i=0;i<candidates.length;i++){
    if(candidates[i]&&candidates[i].prix_annuel!==undefined) return candidates[i];
  }
  if(msg.prix_annuel!==undefined) return msg;
  var tr = msg.toolResult||(msg.params&&msg.params.toolResult)||msg.result;
  if(tr&&tr.prix_annuel!==undefined) return tr;
  return null;
}

// 1. Vérifier URL params (?data=...)
try{
  var params = new URLSearchParams(window.location.search);
  var raw = params.get('data');
  if(raw){ var pd = JSON.parse(decodeURIComponent(raw)); log('urlparam',pd); show(pd); }
}catch(e){}

// 2. Vérifier window.name
try{
  if(window.name){ var wn = JSON.parse(window.name); log('window.name',wn); show(extract(wn)||wn); }
}catch(e){}

// 3. Vérifier window.openai (SDK legacy)
try{
  var oi = window.openai;
  if(oi){ log('window.openai',oi); if(oi.toolOutput) show(extract(oi.toolOutput)||oi.toolOutput); }
}catch(e){}

// 4. Écouter TOUS les postMessages
window.addEventListener('message',function(e){
  var msg = e.data;
  log('postmsg',msg);
  // Répondre au handshake si nécessaire
  if(msg&&msg.method&&msg.id!==undefined){
    window.parent.postMessage({jsonrpc:'2.0',id:msg.id,result:{}},'*');
  }
  var d = extract(msg);
  if(d) show(d);
});

// 5. Essayer de demander le contexte avec plusieurs méthodes candidates
var reqId = 100;
var methods = ['ui/getContext','ui/context','getContext','context/get','ui/toolResult','getToolResult'];
methods.forEach(function(m){
  window.parent.postMessage({jsonrpc:'2.0',id:reqId++,method:m,params:{}},'*');
});
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
