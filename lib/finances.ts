/*
 * Gestion financière : frais d'inscription, mensualités, factures et reçus,
 * salaires des enseignants et dépenses de l'école.
 *
 * Comme le reste de la démo, tout est gardé dans le navigateur (localStorage).
 * Les nouveaux enregistrements sont datés du jour de la démo (ECOLE.aujourdhui).
 *
 * Le bilan est fait "en caisse" : une somme compte dans le mois où elle a été
 * réellement encaissée ou payée (sa date), pas dans le mois qu'elle concerne.
 */

import {
  CLASSES,
  DEPENSES,
  ECOLE,
  ELEVES,
  FRAIS_DE_DEPART,
  PAIEMENTS,
  PAIEMENTS_SALAIRES,
  SALAIRES_DE_DEPART,
  type CategorieDepense,
  type Depense,
  type Eleve,
  type Inscription,
  type ModePaiement,
  type Paiement,
  type PaiementSalaire,
} from "./data";
import { moisLong } from "./format";
import { ecrireListe, lireEleves, lireListe, nouvelId } from "./stockage";

const CLE_PAIEMENTS = "daara-paiements";
const CLE_INSCRIPTIONS = "daara-inscriptions";
const CLE_FRAIS = "daara-frais";
const CLE_SALAIRES_BASE = "daara-salaires-base";
const CLE_PAIEMENTS_SALAIRES = "daara-paiements-salaires";
const CLE_DEPENSES = "daara-depenses";

export const MODES: ModePaiement[] = ["Wave", "Orange Money", "Espèces"];

export const CATEGORIES_DEPENSES: CategorieDepense[] = [
  "Loyer",
  "Électricité et eau",
  "Internet et abonnements",
  "Fournitures",
  "Communication",
  "Entretien",
  "Autre",
];

/** "2026-10-24" -> "2026-10" */
export function moisDeLaDate(date: string): string {
  return date.slice(0, 7);
}

/** Mensualité de la classe (FCFA). */
export function mensualiteDe(classeId: string): number {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return CLASSES[i].mensualite;
    }
  }
  return 0;
}

/** "12 500" -> 12500 ; renvoie NaN si ce n'est pas un nombre. */
export function lireMontant(texte: string): number {
  let chiffres = "";
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (c !== " " && c !== " " && c !== " ") {
      chiffres = chiffres + c;
    }
  }
  if (chiffres === "") {
    return NaN;
  }
  return Number(chiffres);
}

/* ============================================================
 * Frais d'inscription
 * ============================================================ */

export interface Frais {
  inscription: number;
  reinscription: number;
}

export function lireFrais(): Frais {
  const liste = lireListe<Frais>(CLE_FRAIS, [FRAIS_DE_DEPART]);
  if (liste.length === 0) {
    return { inscription: FRAIS_DE_DEPART.inscription, reinscription: FRAIS_DE_DEPART.reinscription };
  }
  return liste[0];
}

/**
 * Change le montant des frais. Les inscriptions pas encore payées
 * prennent le nouveau montant ; celles déjà payées ne changent pas.
 */
export function modifierFrais(frais: Frais) {
  ecrireListe(CLE_FRAIS, [frais]);

  const liste = lireInscriptions();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].montantPaye === 0) {
      if (liste[i].type === "inscription") {
        liste[i].montant = frais.inscription;
      } else {
        liste[i].montant = frais.reinscription;
      }
    }
  }
  ecrireListe(CLE_INSCRIPTIONS, liste);
}

/* ============================================================
 * Inscriptions
 * ============================================================ */

/** Vrai si c'est un élève des données de démonstration (id "e001", "e002"...). */
function numeroDemo(eleve: Eleve): number {
  if (eleve.id.length === 4 && eleve.id[0] === "e") {
    return Number(eleve.id.slice(1));
  }
  return 0;
}

/** Fabrique l'inscription de l'année pour un élève qui n'en a pas encore. */
function inscriptionDeDepart(eleve: Eleve, frais: Frais): Inscription {
  let type: "inscription" | "reinscription" = "reinscription";
  let montant = frais.reinscription;
  if (eleve.inscritEn >= 2026) {
    type = "inscription";
    montant = frais.inscription;
  }

  const inscription: Inscription = {
    id: "ins-" + eleve.id,
    eleveId: eleve.id,
    annee: ECOLE.annee,
    type: type,
    montant: montant,
    montantPaye: 0,
    datePaiement: "",
    mode: "Wave",
  };

  // Pour la démo : 3 élèves de départ sur 4 ont déjà payé, début octobre.
  const n = numeroDemo(eleve);
  if (n > 0 && n % 4 !== 0) {
    let jour = String(1 + (n % 12));
    if (jour.length < 2) {
      jour = "0" + jour;
    }
    inscription.montantPaye = montant;
    inscription.datePaiement = "2026-10-" + jour;
    inscription.mode = MODES[n % 3];
  }
  return inscription;
}

/**
 * Les inscriptions de l'année. Chaque élève inscrit a la sienne :
 * si un élève n'en a pas (élève ajouté entre-temps), on la crée.
 */
export function lireInscriptions(): Inscription[] {
  const liste = lireListe<Inscription>(CLE_INSCRIPTIONS, []);
  const eleves = lireEleves();
  const frais = lireFrais();
  let ajout = false;

  for (let i = 0; i < eleves.length; i++) {
    let trouve = false;
    for (let j = 0; j < liste.length; j++) {
      if (liste[j].eleveId === eleves[i].id && liste[j].annee === ECOLE.annee) {
        trouve = true;
        break;
      }
    }
    if (!trouve) {
      liste.push(inscriptionDeDepart(eleves[i], frais));
      ajout = true;
    }
  }

  if (ajout) {
    ecrireListe(CLE_INSCRIPTIONS, liste);
  }
  return liste;
}

/** Enregistre le paiement des frais d'inscription (en entier). */
export function encaisserInscription(id: string, mode: ModePaiement) {
  const liste = lireInscriptions();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].montantPaye = liste[i].montant;
      liste[i].datePaiement = ECOLE.aujourdhui;
      liste[i].mode = mode;
    }
  }
  ecrireListe(CLE_INSCRIPTIONS, liste);
}

/** Annule un paiement de frais enregistré par erreur. */
export function annulerInscription(id: string) {
  const liste = lireInscriptions();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].montantPaye = 0;
      liste[i].datePaiement = "";
    }
  }
  ecrireListe(CLE_INSCRIPTIONS, liste);
}

/** L'inscription de l'année d'un élève (undefined s'il n'en a pas). */
export function inscriptionDe(liste: Inscription[], eleveId: string): Inscription | undefined {
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].eleveId === eleveId && liste[i].annee === ECOLE.annee) {
      return liste[i];
    }
  }
  return undefined;
}

/* ============================================================
 * Paiements des mensualités
 * ============================================================ */

/** Pour trier les paiements : le plus récent d'abord. */
function comparerParDateDecroissante(a: { date: string; id: string }, b: { date: string; id: string }): number {
  if (a.date < b.date) return 1;
  if (a.date > b.date) return -1;
  if (a.id < b.id) return 1;
  return -1;
}

export function lirePaiements(): Paiement[] {
  const liste = lireListe(CLE_PAIEMENTS, PAIEMENTS);
  liste.sort(comparerParDateDecroissante);
  return liste;
}

export function ajouterPaiement(paiement: Paiement) {
  const liste = lirePaiements();
  liste.push(paiement);
  ecrireListe(CLE_PAIEMENTS, liste);
}

/** Total versé par un élève pour un mois de mensualité. */
export function payePourLeMois(paiements: Paiement[], eleveId: string, mois: string): number {
  let total = 0;
  for (let i = 0; i < paiements.length; i++) {
    if (paiements[i].eleveId === eleveId && paiements[i].mois === mois) {
      total = total + paiements[i].montant;
    }
  }
  return total;
}

/* ============================================================
 * Salaires des enseignants
 * ============================================================ */

export interface SalaireDeBase {
  enseignantId: string;
  montant: number;
}

export function lireSalairesDeBase(): SalaireDeBase[] {
  return lireListe(CLE_SALAIRES_BASE, SALAIRES_DE_DEPART);
}

/** Salaire mensuel prévu pour un enseignant (0 s'il n'est pas encore fixé). */
export function salaireDe(liste: SalaireDeBase[], enseignantId: string): number {
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].enseignantId === enseignantId) {
      return liste[i].montant;
    }
  }
  return 0;
}

export function definirSalaire(enseignantId: string, montant: number) {
  const liste = lireSalairesDeBase();
  let trouve = false;
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].enseignantId === enseignantId) {
      liste[i].montant = montant;
      trouve = true;
    }
  }
  if (!trouve) {
    liste.push({ enseignantId: enseignantId, montant: montant });
  }
  ecrireListe(CLE_SALAIRES_BASE, liste);
}

export function lirePaiementsSalaires(): PaiementSalaire[] {
  const liste = lireListe(CLE_PAIEMENTS_SALAIRES, PAIEMENTS_SALAIRES);
  liste.sort(comparerParDateDecroissante);
  return liste;
}

export interface NouveauPaiementSalaire {
  enseignantId: string;
  mois: string;
  montant: number;
  mode: ModePaiement;
  note: string;
}

export function ajouterPaiementSalaire(infos: NouveauPaiementSalaire) {
  const liste = lirePaiementsSalaires();
  liste.push({
    id: nouvelId("sal"),
    enseignantId: infos.enseignantId,
    mois: infos.mois,
    date: ECOLE.aujourdhui,
    montant: infos.montant,
    mode: infos.mode,
    note: infos.note,
  });
  ecrireListe(CLE_PAIEMENTS_SALAIRES, liste);
}

export function supprimerPaiementSalaire(id: string) {
  const liste = lirePaiementsSalaires();
  const resultat: PaiementSalaire[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  ecrireListe(CLE_PAIEMENTS_SALAIRES, resultat);
}

/** Total déjà versé à un enseignant pour un mois de travail. */
export function salaireVerse(liste: PaiementSalaire[], enseignantId: string, mois: string): number {
  let total = 0;
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].enseignantId === enseignantId && liste[i].mois === mois) {
      total = total + liste[i].montant;
    }
  }
  return total;
}

/* ============================================================
 * Dépenses
 * ============================================================ */

export function lireDepenses(): Depense[] {
  const liste = lireListe(CLE_DEPENSES, DEPENSES);
  liste.sort(comparerParDateDecroissante);
  return liste;
}

export interface NouvelleDepense {
  date: string;
  categorie: CategorieDepense;
  libelle: string;
  montant: number;
  mode: ModePaiement;
}

export function ajouterDepense(infos: NouvelleDepense) {
  const liste = lireDepenses();
  liste.push({
    id: nouvelId("dep"),
    date: infos.date,
    categorie: infos.categorie,
    libelle: infos.libelle,
    montant: infos.montant,
    mode: infos.mode,
  });
  ecrireListe(CLE_DEPENSES, liste);
}

export function supprimerDepense(id: string) {
  const liste = lireDepenses();
  const resultat: Depense[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  ecrireListe(CLE_DEPENSES, resultat);
}

/* ============================================================
 * Bilan d'un mois
 * ============================================================ */

export interface Bilan {
  mensualites: number; // encaissé
  inscriptions: number; // encaissé
  recettes: number;
  salaires: number; // payé
  depenses: number; // payé
  totalDepenses: number;
  solde: number; // recettes - dépenses
  resteAEncaisser: number; // mensualités du mois pas encore payées
}

export function bilanDuMois(mois: string): Bilan {
  let mensualites = 0;
  const paiements = lirePaiements();
  for (let i = 0; i < paiements.length; i++) {
    if (moisDeLaDate(paiements[i].date) === mois) {
      mensualites = mensualites + paiements[i].montant;
    }
  }

  let inscriptions = 0;
  const listeInscriptions = lireInscriptions();
  for (let i = 0; i < listeInscriptions.length; i++) {
    const ins = listeInscriptions[i];
    if (ins.datePaiement !== "" && moisDeLaDate(ins.datePaiement) === mois) {
      inscriptions = inscriptions + ins.montantPaye;
    }
  }

  let salaires = 0;
  const listeSalaires = lirePaiementsSalaires();
  for (let i = 0; i < listeSalaires.length; i++) {
    if (moisDeLaDate(listeSalaires[i].date) === mois) {
      salaires = salaires + listeSalaires[i].montant;
    }
  }

  let depenses = 0;
  const listeDepenses = lireDepenses();
  for (let i = 0; i < listeDepenses.length; i++) {
    if (moisDeLaDate(listeDepenses[i].date) === mois) {
      depenses = depenses + listeDepenses[i].montant;
    }
  }

  // Ce que les élèves doivent encore pour la mensualité de ce mois
  let resteAEncaisser = 0;
  const eleves = lireEleves();
  for (let i = 0; i < eleves.length; i++) {
    const reste = mensualiteDe(eleves[i].classeId) - payePourLeMois(paiements, eleves[i].id, mois);
    if (reste > 0) {
      resteAEncaisser = resteAEncaisser + reste;
    }
  }

  const recettes = mensualites + inscriptions;
  const totalDepenses = salaires + depenses;
  return {
    mensualites: mensualites,
    inscriptions: inscriptions,
    recettes: recettes,
    salaires: salaires,
    depenses: depenses,
    totalDepenses: totalDepenses,
    solde: recettes - totalDepenses,
    resteAEncaisser: resteAEncaisser,
  };
}

/** Les mois qui ont au moins une opération, du plus récent au plus ancien. */
export function moisDisponibles(): string[] {
  const mois: string[] = [ECOLE.moisEnCours];

  function ajouter(date: string) {
    if (date === "") {
      return;
    }
    const m = moisDeLaDate(date);
    if (!mois.includes(m)) {
      mois.push(m);
    }
  }

  const paiements = lirePaiements();
  for (let i = 0; i < paiements.length; i++) ajouter(paiements[i].date);
  const inscriptions = lireInscriptions();
  for (let i = 0; i < inscriptions.length; i++) ajouter(inscriptions[i].datePaiement);
  const salaires = lirePaiementsSalaires();
  for (let i = 0; i < salaires.length; i++) ajouter(salaires[i].date);
  const depenses = lireDepenses();
  for (let i = 0; i < depenses.length; i++) ajouter(depenses[i].date);

  mois.sort();
  mois.reverse();
  return mois;
}

/* ============================================================
 * Reçus et factures
 * ============================================================ */

export interface Recu {
  numero: string; // "REC-2026-0001"
  date: string;
  eleveId: string;
  objet: string; // "Mensualité d'octobre 2026", "Frais d'inscription 2026–2027"
  montant: number;
  mode: ModePaiement;
}

/** "octobre 2026" -> "d'octobre 2026" ; "mars 2026" -> "de mars 2026" */
function deMois(mois: string): string {
  const texte = moisLong(mois);
  const voyelles = "aeiouyéè";
  if (voyelles.includes(texte[0])) {
    return "d'" + texte;
  }
  return "de " + texte;
}

/**
 * Un reçu pour chaque somme encaissée (mensualités et frais d'inscription).
 * Les numéros suivent l'ordre des dates : le premier encaissement a le numéro 0001.
 * Le résultat est trié du plus récent au plus ancien.
 */
export function listeDesRecus(): Recu[] {
  const recus: Recu[] = [];

  const paiements = lirePaiements();
  for (let i = 0; i < paiements.length; i++) {
    const p = paiements[i];
    recus.push({ numero: p.id, date: p.date, eleveId: p.eleveId, objet: "Mensualité " + deMois(p.mois), montant: p.montant, mode: p.mode });
  }

  const inscriptions = lireInscriptions();
  for (let i = 0; i < inscriptions.length; i++) {
    const ins = inscriptions[i];
    if (ins.montantPaye > 0) {
      let objet = "Frais de réinscription " + ins.annee;
      if (ins.type === "inscription") {
        objet = "Frais d'inscription " + ins.annee;
      }
      recus.push({ numero: ins.id, date: ins.datePaiement, eleveId: ins.eleveId, objet: objet, montant: ins.montantPaye, mode: ins.mode });
    }
  }

  // Tri du plus ancien au plus récent pour donner les numéros
  function comparerCroissant(a: Recu, b: Recu): number {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    if (a.numero < b.numero) return -1;
    return 1;
  }
  recus.sort(comparerCroissant);

  for (let i = 0; i < recus.length; i++) {
    let rang = String(i + 1);
    while (rang.length < 4) {
      rang = "0" + rang;
    }
    recus[i].numero = "REC-" + recus[i].date.slice(0, 4) + "-" + rang;
  }

  recus.reverse();
  return recus;
}

export interface LigneFacture {
  libelle: string;
  montant: number;
}

export interface Facture {
  numero: string; // "FAC-2026-10-DAF-001"
  mois: string;
  eleve: Eleve;
  lignes: LigneFacture[];
  total: number;
  paye: number;
  reste: number;
}

/**
 * La facture du mois d'un élève : sa mensualité, plus les frais d'inscription
 * s'ils ne sont pas encore réglés.
 */
export function factureDe(eleve: Eleve, mois: string, paiements: Paiement[], inscriptions: Inscription[]): Facture {
  const lignes: LigneFacture[] = [];
  let classeNom = "";
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === eleve.classeId) {
      classeNom = CLASSES[i].nom;
    }
  }

  const mensualite = mensualiteDe(eleve.classeId);
  lignes.push({ libelle: "Mensualité " + deMois(mois) + " (classe " + classeNom + ")", montant: mensualite });
  let total = mensualite;
  let paye = payePourLeMois(paiements, eleve.id, mois);

  const ins = inscriptionDe(inscriptions, eleve.id);
  if (ins !== undefined && ins.montantPaye < ins.montant) {
    let libelle = "Frais de réinscription " + ins.annee;
    if (ins.type === "inscription") {
      libelle = "Frais d'inscription " + ins.annee;
    }
    lignes.push({ libelle: libelle, montant: ins.montant });
    total = total + ins.montant;
    paye = paye + ins.montantPaye;
  }

  let reste = total - paye;
  if (reste < 0) {
    reste = 0;
  }

  return {
    numero: "FAC-" + mois + "-" + eleve.matricule,
    mois: mois,
    eleve: eleve,
    lignes: lignes,
    total: total,
    paye: paye,
    reste: reste,
  };
}

/** Trouve un élève dans la liste enregistrée, ou dans les données de départ. */
export function eleveDe(eleves: Eleve[], id: string): Eleve | undefined {
  for (let i = 0; i < eleves.length; i++) {
    if (eleves[i].id === id) {
      return eleves[i];
    }
  }
  for (let i = 0; i < ELEVES.length; i++) {
    if (ELEVES[i].id === id) {
      return ELEVES[i];
    }
  }
  return undefined;
}
