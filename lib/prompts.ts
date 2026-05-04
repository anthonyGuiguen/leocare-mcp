// Constantes partagées entre la description du tool (poids fort)
// et les instructions serveur (poids faible).
// Modifier ici répercute automatiquement dans les deux endroits.

export const FORMULES = `- **F1 — Tiers** : couverture responsabilité civile uniquement
- **F2 — Tiers+ Bris De Glace** : Tiers + bris de glace
- **F3 — Tiers+ Confort** : Tiers + bris de glace + vol & incendie avec garanties étendues
- **F4 — Tous risques** : couverture maximale`;

export const ACCROCHE = `👋 Bienvenue chez **Leocare**, l'assurance auto 100 % en ligne !
🚗 En moins de 2 minutes, je te donne une estimation de ta prime selon ton profil et la formule de ton choix.
C'est parti — on commence par ton véhicule 🎯

Quelle est la plaque d'immatriculation de ton véhicule ? (ex : FA-110-LG)`;

export const QUESTIONS = {
  confirmVehicle: (summary: string) => `J'ai trouvé : **${summary}**. C'est bien ton véhicule ?`,
  chooseVehicle: (summaries: string[]) => `J'ai trouvé plusieurs véhicules pour cette plaque :\n${summaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nLequel est le tien ?`,
  naissance: `Quelle est ta date de naissance ? (ex : 15/03/1990)`,
  permis: `Et la date d'obtention de ton permis ? (ex : 20/06/2010)`,
  formule: `Tu veux choisir toi-même ta formule d'assurance entre :
${FORMULES}
ou que je te recommande la plus adaptée à ton profil ?`,
};

export const OUTPUT_TEMPLATE = `"Pour ton profil, voici l'estimation Leocare en formule [nom formule] :

**[prix_mensuel] € / mois**, soit **[prix_annuel] € / an**.

*Cette estimation est indicative. Pour un tarif précis, clique sur le bouton ci-dessus.*

Tu veux essayer une autre formule ?"`;

export const INELIGIBLE_TEMPLATE = `Désolé, nous ne sommes pas en mesure de te proposer un tarif pour ce profil ([raison]).
Tu peux contacter Leocare directement : [Obtenir mon devis Leocare](https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance)`;

export const EXCLUDED_TEMPLATE = `Avec les données que tu m'as fournies, je ne suis malheureusement pas en mesure de générer une estimation par ici.
Mais bonne nouvelle : notre application peut aller plus loin et trouver la formule qui te correspond !
👉 [Faire mon devis sur Leocare](https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance)`;

export const VEHICLE_NOT_FOUND_TEMPLATE = `Je n'ai pas trouvé de véhicule pour cette plaque. Tu peux vérifier la plaque et réessayer, ou faire ton devis directement sur notre app :
👉 [Faire mon devis sur Leocare](https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance)`;

