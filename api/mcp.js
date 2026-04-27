import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { simulateTarif } from "./coherent.js";

const WIDGET_URI = "ui://leocare/quote.html";

// HTML du widget inliné directement (évite un fetch supplémentaire)
const WIDGET_HTML = `<!DOCTYPE html>
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
    card.innerHTML =
      '<div class="badge">Ton estimation*</div>' +
      '<div class="price-main">' + data.prix_annuel + ' \u20ac<span> /an</span></div>' +
      '<div class="price-monthly">soit \u00e0 partir de ' + data.prix_mensuel + ' \u20ac /mois</div>' +
      '<div class="profile">' +
        '<div class="profile-title">Ta formule</div>' +
        '<div class="profile-row"><span>Couverture</span><span>' + data.formule + '</span></div>' +
      '</div>' +
      '<a class="cta" href="' + data.cta_url + '" target="_blank">Obtenir mon devis pr\u00e9cis</a>' +
      '<div class="disclaimer">*Prix \u00e0 partir de, bas\u00e9 sur un profil type. Le tarif d\u00e9finitif est calcul\u00e9 lors du devis en ligne.</div>';
  }

  let msgId = 1;
  function sendToHost(method, params) {
    window.parent.postMessage({ jsonrpc: '2.0', id: msgId++, method, params }, '*');
  }

  window.addEventListener('message', function(event) {
    if (event.source !== window.parent) return;
    var msg = event.data;
    if (!msg || msg.jsonrpc !== '2.0') return;

    if (msg.method === 'ui/initialize') {
      window.parent.postMessage({ jsonrpc: '2.0', id: msg.id, result: {} }, '*');
      var data = (msg.params && msg.params.toolResult && msg.params.toolResult.structuredContent)
               || (msg.params && msg.params.structuredContent);
      if (data) render(data);
    }

    if (msg.method === 'ui/notifications/tool-result') {
      var data = msg.params && msg.params.structuredContent;
      if (data) render(data);
    }

    if (msg.method === 'ui/notifications/tool-input') {
      document.getElementById('card').innerHTML = '<div class="loading">Calcul en cours\u2026</div>';
    }
  });

  // Fallback ChatGPT extension
  if (window.openai && window.openai.toolOutput) {
    render(window.openai.toolOutput);
  }
  window.addEventListener('openai:set_globals', function(event) {
    var data = event.detail && event.detail.globals && event.detail.globals.toolOutput;
    if (data) render(data);
  });

  sendToHost('ui/ready', {});
</script>
</body>
</html>`;

function createServer() {
  const server = new McpServer(
    { name: "Leocare Assurance Auto", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  // Ressource widget avec ext-apps (MIME type correct + CSP)
  registerAppResource(
    server,
    "Leocare Quote Widget",
    WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: WIDGET_HTML,
          _meta: {
            ui: {
              prefersBorder: false,
              csp: {
                connectDomains: [
                  "https://excel.uat.eu.coherent.global",
                ],
              },
            },
          },
        },
      ],
    })
  );

  // Tool avec ext-apps + annotations requises
  registerAppTool(
    server,
    "simulateCarInsurance",
    {
      title: "Simuler un tarif assurance auto Leocare",
      description:
        "Calcule le tarif d'assurance auto Leocare à partir de la date de naissance, date de permis, date de première immatriculation et formule choisie (F1=Tiers, F2=Tiers+, F3=Tiers+ Confort, F4=Tous risques).",
      inputSchema: {
        date_naissance: z.string().describe("Date de naissance au format YYYY-MM-DD"),
        date_permis: z.string().describe("Date d'obtention du permis au format YYYY-MM-DD"),
        date_mec: z.string().describe("Date de première immatriculation au format YYYY-MM-DD"),
        numero_formule: z.enum(["F1", "F2", "F3", "F4"]).describe("Formule : F1=Tiers, F2=Tiers+, F3=Tiers+ Confort, F4=Tous risques"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Calcul du tarif en cours…",
        "openai/toolInvocation/invoked": "Tarif calculé.",
      },
    },
    async ({ date_naissance, date_permis, date_mec, numero_formule }) => {
      const result = await simulateTarif({ date_naissance, date_permis, date_mec, numero_formule });

      if (!result.eligible) {
        return {
          content: [{ type: "text", text: `Profil non éligible : ${result.message}` }],
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
            type: "text",
            text: `Formule ${result.formule} : à partir de ${result.prix_mensuel} €/mois (${result.prix_annuel} €/an).`,
          },
        ],
      };
    }
  );

  return server;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const server = createServer();
    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP handler error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
