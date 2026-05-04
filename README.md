# leocare-mcp

[![Vercel](https://deploy-badge.vercel.app/vercel/leocare-mcp)](https://leocare-mcp.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![License](https://img.shields.io/badge/license-Proprietary-red)

Serveur MCP (Model Context Protocol) pour la simulation tarifaire assurance auto **Leocare**. Connecte ChatGPT et autres LLM compatibles MCP au moteur de tarification Leocare.

## Quick Start

### 1. Ajouter le connecteur dans ChatGPT

Dans ChatGPT, ajoute un nouveau connecteur MCP avec l'URL :

```
https://leocare-mcp.vercel.app/mcp
```

### 2. Utiliser

Lance une conversation et dis simplement :

> "Je veux une simulation d'assurance auto Leocare"

Le LLM va :
1. Te demander ta **plaque d'immatriculation**
2. Identifier ton véhicule automatiquement et te demander confirmation
3. Te poser 4 questions (date de naissance, permis, acquisition, formule)
4. Afficher ton estimation dans un widget visuel

## Compatibilité

| LLM | Support |
|-----|---------|
| ChatGPT (chatgpt.com) | ✅ Supporté |
| Claude (claude.ai) | ✅ Supporté |
| Copilot | ✅ Supporté |

## Tools

| Tool | Description |
|------|-------------|
| `lookupVehicle` | Recherche un véhicule par plaque d'immatriculation |
| `simulateCarInsurance` | Calcule une estimation de tarif assurance auto |

## Lancer en local

```bash
npm install
cp .env.example .env.local
# Remplir les variables dans .env.local
npm run dev
```

Serveur disponible sur `http://localhost:3000/mcp`.

## Variables d'environnement

Voir `.env.example` pour la liste complète des variables à configurer.

## Déploiement

Déployé automatiquement sur Vercel à chaque push sur `main`.
