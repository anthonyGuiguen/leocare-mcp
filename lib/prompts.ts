// Constantes partagées entre la description du tool (poids fort)
// et les instructions serveur (poids faible).
// Modifier ici répercute automatiquement dans les deux endroits.

export const FORMULES = `- **F1 — Tiers** : couverture responsabilité civile uniquement
- **F2 — Tiers+ Bris De Glace** : Tiers + bris de glace
- **F3 — Tiers+ Confort** : Tiers + bris de glace + vol & incendie avec garanties étendues
- **F4 — Tous risques** : couverture maximale`;

export const ACCROCHE = `👋 Bienvenue chez **Leocare**, l'assurance auto 100 % en ligne !
🚗 En moins de 2 minutes, je te donne une estimation de ta prime selon ton profil et la formule de ton choix.
C'est parti — juste 4 questions rapides 🎯

Quelle est ta date de naissance ? (ex : 15/03/1990)`;

export const QUESTIONS = {
  permis: `Et la date d'obtention de ton permis ? (ex : 20/06/2010)`,
  mec: `Quelle est la date de 1ère mise en circulation de ton véhicule ? (ex : 01/09/2018)`,
  formule: `Quelle formule t'intéresse ?\n${FORMULES}`,
};

export const OUTPUT_TEMPLATE = `"Pour ton profil, voici l'estimation Leocare en formule [nom formule] :

**[prix_mensuel] € / mois**, soit **[prix_annuel] € / an**.

*Cette estimation est indicative. Pour un tarif précis, clique sur le bouton ci-dessus.*

Tu veux essayer une autre formule ?"`;

export const INELIGIBLE_TEMPLATE = `Désolé, nous ne sommes pas en mesure de te proposer un tarif pour ce profil ([raison]).
Tu peux contacter Leocare directement : [Obtenir mon devis Leocare](https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance)`;
