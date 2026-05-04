# leocare-mcp

Serveur MCP (Model Context Protocol) pour la simulation tarifaire assurance auto **Leocare**. Déployé sur Vercel, connecté à ChatGPT et autres LLM compatibles MCP.

## Ce que ça fait

1. L'utilisateur donne sa **plaque d'immatriculation** → le serveur récupère automatiquement les infos du véhicule (marque, modèle, date de mise en circulation, classe SRA, groupe SRA)
2. L'utilisateur confirme le véhicule puis répond à 4 questions : date de naissance, date de permis, date d'acquisition, formule souhaitée
3. Le serveur appelle l'API **Coherent Spark** et retourne une estimation de prime mensuelle et annuelle
4. Le résultat s'affiche dans un widget visuel directement dans le chat

## Stack

- **Next.js 15** — App Router, déployé sur Vercel
- **mcp-handler** — abstraction MCP Streamable HTTP
- **Upstash Redis** — rate limiting hybride (session ID / IP)
- **Coherent Spark** — moteur de tarification assurance
- **Zod** — validation des inputs

## Tools MCP exposés

| Tool | Description |
|---|---|
| `lookupVehicle` | Recherche un véhicule par plaque via l'API Leocare |
| `simulateCarInsurance` | Calcule une estimation de tarif via Coherent Spark |

## Variables d'environnement

Voir `.env.example` pour la liste complète.

| Variable | Obligatoire | Description |
|---|---|---|
| `COHERENT_API_URL` | ✅ | URL de l'API Coherent Spark |
| `COHERENT_SYNTHETIC_KEY` | ✅ | Clé d'authentification Coherent |
| `UPSTASH_REDIS_REST_URL` | ✅ | URL Redis Upstash (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Token Redis Upstash |
| `OPENAI_DOMAIN_CHALLENGE` | ✅ | Token de vérification domaine OpenAI |
| `COHERENT_VERSION_ID` | — | Version du modèle Coherent (fallback sur valeur par défaut) |
| `NEXT_PUBLIC_DEBUG_WIDGET` | — | Activer le panel debug du widget (`true` uniquement en dev) |

## Lancer en local

```bash
npm install
cp .env.example .env.local
# Remplir les variables dans .env.local
npm run dev
```

Le serveur MCP est accessible sur `http://localhost:3000/mcp`.

## Déploiement

Le projet est déployé automatiquement sur Vercel à chaque push sur `main`.

URL de production : `https://leocare-mcp.vercel.app/mcp`

## Rate limiting

30 requêtes POST `/mcp` par heure, par session MCP (fallback sur IP si pas de `Mcp-Session-Id`). Géré via Upstash Redis avec sliding window.

## Sécurité

- CORS restreint aux origines connues (ChatGPT, Claude)
- Headers HTTP sécurité (CSP, HSTS, X-Content-Type-Options…)
- Validation stricte des inputs (dates, formule via whitelist)
- Aucune donnée personnelle conservée
