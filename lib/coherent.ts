const COHERENT_URL = process.env.COHERENT_API_URL as string;
if (!COHERENT_URL) throw new Error("COHERENT_API_URL environment variable is not set");

const SYNTHETIC_KEY = process.env.COHERENT_SYNTHETIC_KEY as string;
if (!SYNTHETIC_KEY) throw new Error("COHERENT_SYNTHETIC_KEY environment variable is not set");

const VALID_FORMULES = ["F1", "F2", "F3", "F4"] as const;
type NumeroFormule = typeof VALID_FORMULES[number];

const FORMULE_MAP: Record<NumeroFormule, string> = {
  F1: "Tiers",
  F2: "Tiers+ Bris De Glace",
  F3: "Tiers+ Confort",
  F4: "Tous risques",
};

export interface TarifResult {
  eligible: boolean;
  reason?: "exclusion" | "error";
  formule?: string;
  prix_mensuel?: number;
  prix_annuel?: number;
  message?: string;
}

export async function simulateTarif(params: {
  date_naissance: string;
  date_permis: string;
  date_mec: string;
  numero_formule: string;
}): Promise<TarifResult> {
  const { date_naissance, date_permis, date_mec, numero_formule } = params;

  if (!(VALID_FORMULES as readonly string[]).includes(numero_formule)) {
    throw new Error(`numero_formule invalide : "${numero_formule}". Valeurs autorisées : ${VALID_FORMULES.join(", ")}`);
  }
  const formule = numero_formule as NumeroFormule;

  const today = new Date().toISOString().slice(0, 10);

  const body = {
    request_data: {
      inputs: {
        anciennete_crm50_cp: 5,
        assistance: "Tarif Forfaitaire MONDIAL - 30 KM",
        boite_vitesse: "M",
        canal: "ALEOC999999",
        carrosserie: "BERLINE",
        classe_sra: "A",
        conduite_accompagnee: "Non",
        contenu_equipement: "Non",
        CRM_cp: 0.5,
        csp: "Salarié",
        date_acquisition: date_mec,
        date_effet: today,
        date_mec: date_mec,
        date_naissance_cp: date_naissance,
        date_permis_cp: date_permis,
        departement: 75,
        energie: "ES",
        forfait_km: "Non",
        fractionnement: "ANNUEL",
        franchise_bdg: "Standard",
        franchise_vidta: "Standard",
        garantie_gpc: "300 K€ - AIPP 15%",
        groupe_sra: 20,
        impayes: "Non",
        indemn_renforcee: "Non",
        marque: "VOLKSWAGEN",
        mode_acquisition: "Comptant/Crédit",
        nb_cond: 1,
        nb_mois_assu_cp: 60,
        numero_formule: formule,
        sin_bdg: 0, sin_corp_nr: 0, sin_corp_resp: 0,
        sin_inc: 0, sin_mat_nr: 0, sin_mat_resp: 0, sin_vol: 0,
        type_parking: "Sans garage",
        usage: "Déplacements privés, trajet travail",
        zone_bdg: 2,
        zone_rcvidom: 6,
      },
    },
    request_meta: {
      version_id: "3bdeb9de-ba23-4458-bccc-4e9eb7efff73",
      transaction_date: null,
      call_purpose: "Leocare GPT simulation",
      source_system: "leocare-mcp",
      correlation_id: `mcp-${Date.now()}`,
      requested_output: null,
      service_category: "All",
      excel_file_writer: null,
      xreport_options: null,
    },
  };

  const response = await fetch(COHERENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-synthetic-key": SYNTHETIC_KEY!,
      "x-tenant-name": "leocare",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    // Log interne uniquement — ne jamais exposer le détail au client
    console.error(`[coherent] HTTP ${response.status}`, errText);
    throw new Error("Le service de tarification est temporairement indisponible. Merci de réessayer.");
  }

  const data = await response.json();
  const outputs = data?.response_data?.outputs ?? {};
  const etat: string = outputs.etat_du_profil ?? "";

  // Détection des exclusions métier : champs exclusion_* non vides
  const exclusions: string[] = Object.entries(outputs)
    .filter(([key, val]) => key.startsWith("exclusion_") && val !== "" && val !== null && val !== undefined)
    .map(([key]) => key.replace("exclusion_", ""));

  if (exclusions.length > 0 || !etat.includes("OK")) {
    console.error("[coherent] profil exclu", { etat, exclusions });
    return {
      eligible: false,
      reason: "exclusion",
      message: "PROFIL_EXCLU",
    };
  }

  const prixAnnuelRaw: number | null = outputs.TTC_final_si_etat_OK ?? outputs.TTC_final ?? null;
  const prixAnnuel = prixAnnuelRaw !== null ? Math.round(prixAnnuelRaw * 100) / 100 : null;
  const htFinal: number | null = outputs.HT_final ?? null;

  // Prime mensuelle = (TTC_final + frais FCA (13% du HT_final) + commissionnement (6% du TTC_final)) / 12
  const prixMensuel =
    prixAnnuel !== null && htFinal !== null
      ? Math.round(((prixAnnuel + htFinal * 0.13 + prixAnnuel * 0.06) / 12) * 100) / 100
      : null;

  return {
    eligible: true,
    formule: FORMULE_MAP[formule],
    prix_mensuel: prixMensuel ?? undefined,
    prix_annuel: prixAnnuel ?? undefined,
  };
}
