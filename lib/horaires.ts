/*
 * Calculs sur les horaires des cours : nom des jours, cours en direct, prochain cours.
 */

import type { Cours, JourSemaine } from "./data";

export const NOMS_DES_JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const JOURS: JourSemaine[] = [1, 2, 3, 4, 5, 6, 7];

/** "09:30" -> 570 (nombre de minutes depuis minuit) */
export function enMinutes(heure: string): number {
  const morceaux = heure.split(":");
  return Number(morceaux[0]) * 60 + Number(morceaux[1]);
}

/** "09:00" -> "9 h" ; "16:30" -> "16 h 30" */
export function heureLisible(heure: string): string {
  const morceaux = heure.split(":");
  const h = Number(morceaux[0]);
  const m = morceaux[1];
  if (m === "00") {
    return h + " h";
  }
  return h + " h " + m;
}

/** Jour de la semaine d'une date : 1 = lundi ... 7 = dimanche. */
export function jourDeLaSemaine(date: Date): JourSemaine {
  // getDay() de JavaScript donne 0 pour dimanche, 1 pour lundi... 6 pour samedi
  const jour = date.getDay();
  if (jour === 0) {
    return 7;
  }
  return jour as JourSemaine;
}

/** Vrai si le cours a lieu en ce moment. */
export function estEnCours(cours: Cours, maintenant: Date): boolean {
  if (cours.jour !== jourDeLaSemaine(maintenant)) {
    return false;
  }
  const minutes = maintenant.getHours() * 60 + maintenant.getMinutes();
  return minutes >= enMinutes(cours.heureDebut) && minutes < enMinutes(cours.heureFin);
}

/**
 * Nombre de minutes avant le début du cours (sa prochaine fois dans la semaine).
 * Renvoie 0 si le cours a lieu en ce moment.
 */
export function minutesAvantLeCours(cours: Cours, maintenant: Date): number {
  if (estEnCours(cours, maintenant)) {
    return 0;
  }

  const minutesDansLaSemaine = (jourDeLaSemaine(maintenant) - 1) * 24 * 60 + maintenant.getHours() * 60 + maintenant.getMinutes();
  const debutDuCours = (cours.jour - 1) * 24 * 60 + enMinutes(cours.heureDebut);

  let attente = debutDuCours - minutesDansLaSemaine;
  if (attente <= 0) {
    // Le cours de cette semaine est passé : on prend celui de la semaine prochaine.
    attente = attente + 7 * 24 * 60;
  }
  return attente;
}

/** Le cours qui commence le plus tôt (ou celui qui a lieu en ce moment). null s'il n'y a aucun cours. */
export function prochainCours(liste: Cours[], maintenant: Date): Cours | null {
  let meilleur: Cours | null = null;
  let meilleureAttente = 0;

  for (let i = 0; i < liste.length; i++) {
    const attente = minutesAvantLeCours(liste[i], maintenant);
    if (meilleur === null || attente < meilleureAttente) {
      meilleur = liste[i];
      meilleureAttente = attente;
    }
  }
  return meilleur;
}

/** 95 -> "dans 1 h 35" ; 3000 -> "dans 2 jours" */
export function attenteLisible(minutes: number): string {
  if (minutes === 0) {
    return "en ce moment";
  }
  if (minutes < 60) {
    return "dans " + minutes + " min";
  }
  if (minutes < 24 * 60) {
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    if (reste === 0) {
      return "dans " + heures + " h";
    }
    return "dans " + heures + " h " + reste;
  }
  const jours = Math.round(minutes / (24 * 60));
  if (jours === 1) {
    return "demain";
  }
  return "dans " + jours + " jours";
}

/** Pour trier les cours : lundi d'abord, puis par heure de début. */
export function comparerCours(a: Cours, b: Cours): number {
  if (a.jour !== b.jour) {
    return a.jour - b.jour;
  }
  return enMinutes(a.heureDebut) - enMinutes(b.heureDebut);
}
