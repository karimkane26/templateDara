const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** 12500 -> "12 500" (espace fine insécable, identique serveur et navigateur) */
export function nombre(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 12500 -> "12 500 FCFA" */
export function fcfa(n: number): string {
  return `${nombre(n)} FCFA`;
}

/** 1250000 -> "1,25 M" ; 850000 -> "850 k" */
export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(".", ",").replace(/,?0+$/, "")} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
}

/** "2026-10-24" -> "24 oct." */
export function dateCourte(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MOIS_COURTS[m - 1]}`;
}

/** "2026-10" -> "octobre 2026" */
export function moisLong(isoMois: string): string {
  const [y, m] = isoMois.split("-").map(Number);
  return `${MOIS_LONGS[m - 1]} ${y}`;
}

export function moisCourt(isoMois: string): string {
  const [, m] = isoMois.split("-").map(Number);
  return MOIS_COURTS[m - 1];
}

export function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

export function pourcent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** "2026-10-26" -> "Lundi 26 octobre 2026" */
export function dateLongue(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const jour = JOURS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${jour[0].toUpperCase()}${jour.slice(1)} ${d} ${MOIS_LONGS[m - 1]} ${y}`;
}
