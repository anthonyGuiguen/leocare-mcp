import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { simulateTarif } from "./coherent.js";

const WIDGET_URI = "ui://leocare/quote.html";

function createServer() {
  const server = new McpServer(
    { name: "Leocare Assurance Auto", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  // Widget resource
  server.registerResource("quote-widget", WIDGET_URI, {}, async () => {
    const widgetUrl = `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "https://leocare-mcp.vercel.app"}/widget`;
    const html = await fetch(widgetUrl).then((r) => r.text()).catch(() => "<p>Erreur widget</p>");
    return {
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: "text/html;profile=mcp-app",
          text: html,
          _meta: { ui: { prefersBorder: false } },
        },
      ],
    };
  });

  // Data tool — récupère le tarif
  server.registerTool(
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
      _meta: {
        "openai/outputTemplate": WIDGET_URI,
        ui: { resourceUri: WIDGET_URI },
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

    // Passer req/res natifs + body déjà parsé par Vercel
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP handler error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
