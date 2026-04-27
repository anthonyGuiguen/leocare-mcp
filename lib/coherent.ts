const COHERENT_URL =
  "https://excel.uat.eu.coherent.global/leocare/api/v3/folders/Tarification%20CMAM/services/Calculette%20CMAM%20V2%20-%20version%20Coherent/execute";

const FORMULE_MAP: Record<string, string> = {
  F1: "Tiers",
  F2: "Tiers+ Bris De Glace",
  F3: "Tiers+ Confort",
  F4: "Tous risques",
};

export interface TarifResult {
  eligible: boolean;
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
  const SYNTHETIC_KEY = process.env.COHERENT_SYNTHETIC_KEY;
  const today = new Date().toISOString().slice(0, 10);

  const body = {
    request_data: {
      inputs: {
        anciennete_crm50_cp: 5,
        anciennete_crm50_cs: 0,
        assistance: "Tarif Forfaitaire MONDIAL - 30 KM",
        boite_vitesse: "M",
        canal: "ALEOC999999",
        carrosserie: "BERLINE",
        classe_sra: "F",
        conduite_accompagnee: "Non",
        contenu_equipement: "Non",
        CRM_cp: 0.5,
        crm_cs: 1,
        csp: "Salarié",
        date_acquisition: date_mec,
        date_effet: today,
        date_mec,
        date_naissance_cp: date_naissance,
        date_naissance_cs: date_naissance,
        date_permis_cp: date_permis,
        date_permis_cs: date_permis,
        departement: 75,
        energie: "ES",
        forfait_km: "Non",
        fractionnement: "MENSUEL",
        franchise_bdg: "Rachat total",
        franchise_vidta: "Rachat total",
        garantie_gpc: "500 K€ - AIPP 15%",
        groupe_sra: 28,
        impayes: "Non",
        indemn_renforcee: "Non",
        marque: "RENAULT",
        mode_acquisition: "Comptant/Crédit",
        nb_cond: 1,
        nb_mois_assu_cp: 60,
        nb_mois_assu_cs: 60,
        numero_formule,
        sin_bdg: 0, sin_corp_nr: 0, sin_corp_resp: 0,
        sin_inc: 0, sin_mat_nr: 0, sin_mat_resp: 0, sin_vol: 0,
        type_parking: "Sans garage",
        usage: "Déplacements privés, trajet travail",
        zone_bdg: 2,
        zone_rcvidom: 11,
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
    throw new Error(`Erreur API Coherent ${response.status} : ${errText}`);
  }

  const data = await response.json();
  const outputs = data?.response_data?.outputs ?? {};
  const etat: string = outputs.etat_du_profil ?? "";

  if (!etat.includes("OK")) {
    return { eligible: false, message: `Profil non éligible : ${etat}` };
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
    formule: FORMULE_MAP[numero_formule],
    prix_mensuel: prixMensuel ?? undefined,
    prix_annuel: prixAnnuel ?? undefined,
  };
}
