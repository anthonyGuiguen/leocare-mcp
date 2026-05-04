const VEHICLES_API = "https://apis.leocare.eu/api-frontoffice/api/v1/cars/vehicles";

export interface Vehicle {
  id: string;
  summary: string;
  make: { id: string; label: string };
  model: { id: string; label: string; makeId: string };
  version: { id: string; label: string; modelId: string };
  sraClass: string;
  sraGroup: string;
  registrationDate: string; // JJ/MM/AAAA — date 1ère mise en circulation
  registrationNumber: string;
  annee: string;
  fiscalPower: string;
}

export interface VehicleLookupResult {
  found: boolean;
  vehicles?: Vehicle[];
  message?: string;
}

/**
 * Recherche les véhicules correspondant à une plaque d'immatriculation.
 * Retourne un tableau — souvent 1 résultat, parfois plusieurs versions.
 */
export async function lookupVehicleByPlate(registrationNumber: string): Promise<VehicleLookupResult> {
  const url = `${VEHICLES_API}?registrationNumber=${encodeURIComponent(registrationNumber.toUpperCase().replace(/\s/g, ""))}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    console.error("[vehicles] fetch error", err);
    throw new Error("Le service de recherche de véhicule est temporairement indisponible.");
  }

  if (response.status === 404) {
    return { found: false, message: "Aucun véhicule trouvé pour cette plaque." };
  }

  if (!response.ok) {
    console.error(`[vehicles] HTTP ${response.status}`);
    throw new Error("Le service de recherche de véhicule est temporairement indisponible.");
  }

  const data: Vehicle[] = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    return { found: false, message: "Aucun véhicule trouvé pour cette plaque." };
  }

  return { found: true, vehicles: data };
}

/**
 * Convertit la registrationDate (JJ/MM/AAAA) en YYYY-MM-DD pour Coherent.
 */
export function parseRegistrationDate(registrationDate: string): string {
  const parts = registrationDate.split("/");
  if (parts.length !== 3) return registrationDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Calcule l'âge du véhicule en années à partir de la date de MEC (JJ/MM/AAAA).
 */
function getVehicleAge(registrationDate: string): number {
  const parts = registrationDate.split("/");
  if (parts.length !== 3) return 0;
  const mec = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  return Math.floor((today.getTime() - mec.getTime()) / (365.25 * 24 * 3600 * 1000));
}

/**
 * Recommande une formule selon l'âge du véhicule et l'âge du conducteur.
 * Algorithme issu du front Leocare (sans CRM).
 *
 * Âge véhicule  | Âge conducteur | Formule
 * 0-7 ans       | tous           | F3
 * 8-10 ans      | tous           | F3
 * 11-16 ans     | 18-29 ans      | F2
 * 11-16 ans     | 30-34 ans      | F1
 * 11-16 ans     | 35+ ans        | F2
 * 17+ ans       | tous           | F1
 */
export function recommendFormule(registrationDate: string, driverAge: number): {
  formule: "F1" | "F2" | "F3";
  reason: string;
} {
  const vehicleAge = getVehicleAge(registrationDate);

  if (vehicleAge <= 10) {
    return {
      formule: "F3",
      reason: `Ton véhicule a ${vehicleAge} an${vehicleAge > 1 ? "s" : ""} — un véhicule récent mérite une bonne protection. Je te recommande la formule **F3 — Tiers+ Confort**.`,
    };
  }

  if (vehicleAge < 17) {
    if (driverAge >= 18 && driverAge <= 29) {
      return {
        formule: "F2",
        reason: `Ton véhicule a ${vehicleAge} ans et tu es un jeune conducteur — je te recommande la formule **F2 — Tiers+ Bris De Glace**, un bon équilibre prix/protection.`,
      };
    }
    if (driverAge >= 30 && driverAge <= 34) {
      return {
        formule: "F1",
        reason: `Ton véhicule a ${vehicleAge} ans — je te recommande la formule **F1 — Tiers**, suffisante pour ce profil.`,
      };
    }
    // 35+
    return {
      formule: "F2",
      reason: `Ton véhicule a ${vehicleAge} ans — je te recommande la formule **F2 — Tiers+ Bris De Glace**, un bon équilibre pour ce profil.`,
    };
  }

  // 17+ ans
  return {
    formule: "F1",
    reason: `Ton véhicule a ${vehicleAge} ans — je te recommande la formule **F1 — Tiers**, la plus adaptée à un véhicule ancien.`,
  };
}
