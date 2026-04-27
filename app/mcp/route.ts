import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { simulateTarif } from "@/lib/coherent";

const WIDGET_URI = "ui://leocare/quote.html";

const handler = createMcpHandler(async (server) => {
  // Fetch de la page widget Next.js pour la servir inline
  const widgetHtml = await fetch(`${baseURL}/quote`).then((r) => r.text());

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
            "openai/widgetDomain": baseURL,
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
}, {}, { basePath: "/mcp", maxDuration: 60 });

export const GET = handler;
export const POST = handler;
