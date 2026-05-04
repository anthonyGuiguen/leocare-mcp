# leocare-mcp

Serveur MCP (Model Context Protocol) pour la simulation tarifaire assurance auto **Leocare**. Déployé sur Vercel, connecté à ChatGPT et autres LLM compatibles MCP.

## Ce que ça fait

1. L'utilisateur donne sa **plaque d'immatriculation** → le serveur récupère automatiquement les infos du véhicule (marque, modèle, date de mise en circulation)
2. L'utilisateur confirme le véhicule puis répond à 4 questions : date de naissance, date de permis, date d'acquisition, formule souhaitée
3. Le serveur calcule une estimation de prime mensuelle et annuelle
4. Le résultat s'affiche dans un widget visuel directement dans le chat

## Stack

- **Next.js 15** — App Router, déployé sur Vercel
- **mcp-handler** — abstraction MCP Streamable HTTP
- **Zod** — validation des inputs

## Tools MCP exposés

| Tool | Description |
|---|---|
| `lookupVehicle` | Recherche un véhicule par plaque |
| `simulateCarInsurance` | Calcule une estimation de tarif |

## Variables d'environnement

Voir `.env.example` pour la liste complète.

## Lancer en local

```bash
npm install
cp .env.example .env.local
# Remplir les variables dans .env.local
npm run dev
```

Le serveur MCP est accessible sur `http://localhost:3000/mcp`.

## Déploiement

Déployé automatiquement sur Vercel à chaque push sur `main`.

