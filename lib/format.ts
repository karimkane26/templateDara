/*
 * Petites fonctions pour afficher les nombres et les dates en français.
 */

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Espace fine insécable (entre les milliers) et espace insécable (avant "FCFA").
// On les utilise pour que le nombre ne soit jamais coupé en fin de ligne.
const ESPACE_FINE = " ";
const ESPACE_INSECABLE = " ";

/** 12500 -> "12 500" */
export function nombre(n: number): string {
  const texte = String(Math.round(n));
  let resultat = "";
  let chiffresDansLeGroupe = 0;

  // On lit les chiffres de droite à gauche et on ajoute une espace tous les 3 chiffres.
  for (let i = texte.length - 1; i >= 0; i--) {
    const caractere = texte[i];
    if (chiffresDansLeGroupe === 3 && caractere !== "-") {
      resultat = ESPACE_FINE + resultat;
      chiffresDansLeGroupe = 0;
    }
    resultat = caractere + resultat;
    chiffresDansLeGroupe = chiffresDansLeGroupe + 1;
  }

  return resultat;
}

/** 12500 -> "12 500 FCFA" */
export function fcfa(n: number): string {
  return nombre(n) + ESPACE_INSECABLE + "FCFA";
}

/** 1250000 -> "1,25 M" ; 850000 -> "850 k" */
export function compact(n: number): string {
  if (n >= 1000000) {
    let texte = (n / 1000000).toFixed(2); // par exemple "1.50"
    texte = texte.replace(".", ","); // "1,50"

    // On enlève les zéros inutiles à la fin : "1,50" -> "1,5" ; "2,00" -> "2"
    while (texte.endsWith("0")) {
      texte = texte.slice(0, texte.length - 1);
    }
    if (texte.endsWith(",")) {
      texte = texte.slice(0, texte.length - 1);
    }
    return texte + " M";
  }

  if (n >= 1000) {
    return Math.round(n / 1000) + " k";
  }

  return String(n);
}

/** "2026-10-24" -> "24 oct." */
export function dateCourte(iso: string): string {
  const morceaux = iso.split("-");
  const mois = Number(morceaux[1]);
  const jour = Number(morceaux[2]);
  return jour + " " + MOIS_COURTS[mois - 1];
}

/** "2026-10" -> "octobre 2026" */
export function moisLong(isoMois: string): string {
  const morceaux = isoMois.split("-");
  const annee = Number(morceaux[0]);
  const mois = Number(morceaux[1]);
  return MOIS_LONGS[mois - 1] + " " + annee;
}

/** "2026-10" -> "oct." */
export function moisCourt(isoMois: string): string {
  const morceaux = isoMois.split("-");
  const mois = Number(morceaux[1]);
  return MOIS_COURTS[mois - 1];
}

/** ("Moussa", "Diop") -> "MD" */
export function initiales(prenom: string, nom: string): string {
  let resultat = "";
  if (prenom.length > 0) {
    resultat = resultat + prenom[0];
  }
  if (nom.length > 0) {
    resultat = resultat + nom[0];
  }
  return resultat.toUpperCase();
}

/** (25, 100) -> 25 ; renvoie 0 si le total vaut 0 */
export function pourcent(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

/** "2026-10-26" -> "Lundi 26 octobre 2026" */
export function dateLongue(iso: string): string {
  const morceaux = iso.split("-");
  const annee = Number(morceaux[0]);
  const mois = Number(morceaux[1]);
  const jour = Number(morceaux[2]);

  // On demande à JavaScript quel jour de la semaine c'est (0 = dimanche).
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  const nomDuJour = JOURS[date.getUTCDay()];

  // Majuscule sur la première lettre : "lundi" -> "Lundi"
  const nomDuJourMajuscule = nomDuJour[0].toUpperCase() + nomDuJour.slice(1);

  return nomDuJourMajuscule + " " + jour + " " + MOIS_LONGS[mois - 1] + " " + annee;
}
