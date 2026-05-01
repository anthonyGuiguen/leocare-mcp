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
