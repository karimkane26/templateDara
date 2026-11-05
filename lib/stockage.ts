/*
 * Stockage de la démo : élèves, enseignants, cours et session de connexion.
 *
 * Tout est gardé dans le navigateur (localStorage). Au tout premier lancement,
 * on part des données de lib/data.ts.
 *
 * ATTENTION : c'est une démo. Chaque navigateur a ses propres données,
 * et n'importe qui peut les lire ou les modifier. Pour une vraie école,
 * il faudra remplacer ce fichier par une base de données sur un serveur.
 *
 * Ces fonctions ne marchent que dans le navigateur : on les appelle
 * dans un useEffect ou dans une action (clic, formulaire).
 */

import {
  COMPTE_ADMIN,
  COURS,
  ELEVES,
  ENSEIGNANTS,
  MOT_DE_PASSE_PARENT,
  type Cours,
  type Eleve,
  type Enseignant,
  type JourSemaine,
  type Role,
} from "./data";

const CLE_ELEVES = "daara-eleves";
const CLE_ENSEIGNANTS = "daara-enseignants";
const CLE_COURS = "daara-cours";
const CLE_SESSION = "daara-session";

/* ============================================================
 * Lire / écrire du texte dans le navigateur
 * ============================================================ */

function lireTexte(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch (erreur) {
    return null;
  }
}

function ecrireTexte(cle: string, valeur: string) {
  try {
    localStorage.setItem(cle, valeur);
  } catch (erreur) {
    // Le navigateur refuse (navigation privée, mémoire pleine) : on ignore.
  }
}

function effacer(cle: string) {
  try {
    localStorage.removeItem(cle);
  } catch (erreur) {
    // on ignore
  }
}

/** Fabrique un identifiant unique, par exemple "eleve-1730812345678". */
function nouvelId(prefixe: string): string {
  return prefixe + "-" + Date.now();
}

/** "77 412 35 08" -> "774123508" */
export function chiffresSeulement(telephone: string): string {
  let resultat = "";
  for (let i = 0; i < telephone.length; i++) {
    const caractere = telephone[i];
    if (caractere >= "0" && caractere <= "9") {
      resultat = resultat + caractere;
    }
  }
  return resultat;
}

/* ============================================================
 * Élèves
 * ============================================================ */

export function lireEleves(): Eleve[] {
  const texte = lireTexte(CLE_ELEVES);
  if (texte !== null) {
    try {
      return JSON.parse(texte);
    } catch (erreur) {
      // texte abîmé : on repart des données de départ
    }
  }

  // Premier lancement : copie de la liste de départ
  const copie: Eleve[] = [];
  for (let i = 0; i < ELEVES.length; i++) {
    copie.push(ELEVES[i]);
  }
  return copie;
}

function enregistrerEleves(liste: Eleve[]) {
  ecrireTexte(CLE_ELEVES, JSON.stringify(liste));
}

export interface NouvelEleve {
  prenom: string;
  nom: string;
  sexe: "M" | "F";
  classeId: string;
  hizbActuel: number;
  parent: string;
  telephoneParent: string;
}

/** Ajoute un élève et renvoie l'élève créé. */
export function ajouterEleve(infos: NouvelEleve): Eleve {
  const liste = lireEleves();

  // Le matricule suit le plus grand numéro déjà utilisé : DAF-049, DAF-050...
  let plusGrandNumero = 0;
  for (let i = 0; i < liste.length; i++) {
    const numero = Number(liste[i].matricule.replace("DAF-", ""));
    if (numero > plusGrandNumero) {
      plusGrandNumero = numero;
    }
  }
  let matricule = String(plusGrandNumero + 1);
  while (matricule.length < 3) {
    matricule = "0" + matricule;
  }

  const eleve: Eleve = {
    id: nouvelId("eleve"),
    matricule: "DAF-" + matricule,
    prenom: infos.prenom,
    nom: infos.nom,
    sexe: infos.sexe,
    classeId: infos.classeId,
    parent: infos.parent,
    telephoneParent: infos.telephoneParent,
    hizbActuel: infos.hizbActuel,
    tauxPresence: 100,
    presentAujourdhui: true,
    statutMois: "impaye",
    payeMois: 0,
    inscritEn: 2026,
  };

  liste.push(eleve);
  enregistrerEleves(liste);
  return eleve;
}

export function supprimerEleve(id: string) {
  const liste = lireEleves();
  const resultat: Eleve[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  enregistrerEleves(resultat);
}

/* ============================================================
 * Enseignants
 * ============================================================ */

export function lireEnseignants(): Enseignant[] {
  const texte = lireTexte(CLE_ENSEIGNANTS);
  if (texte !== null) {
    try {
      return JSON.parse(texte);
    } catch (erreur) {
      // on repart des données de départ
    }
  }

  const copie: Enseignant[] = [];
  for (let i = 0; i < ENSEIGNANTS.length; i++) {
    copie.push(ENSEIGNANTS[i]);
  }
  return copie;
}

function enregistrerEnseignants(liste: Enseignant[]) {
  ecrireTexte(CLE_ENSEIGNANTS, JSON.stringify(liste));
}

/** Vrai si cet identifiant de connexion est déjà pris par un autre compte. */
export function identifiantDejaPris(identifiant: string): boolean {
  if (identifiant === COMPTE_ADMIN.identifiant) {
    return true;
  }
  const liste = lireEnseignants();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].identifiant === identifiant) {
      return true;
    }
  }
  return false;
}

export interface NouvelEnseignant {
  civilite: string;
  prenom: string;
  nom: string;
  telephone: string;
  classeIds: string[];
  identifiant: string;
  motDePasse: string;
}

export function ajouterEnseignant(infos: NouvelEnseignant): Enseignant {
  const liste = lireEnseignants();
  const enseignant: Enseignant = {
    id: nouvelId("ens"),
    civilite: infos.civilite,
    prenom: infos.prenom,
    nom: infos.nom,
    telephone: infos.telephone,
    classeIds: infos.classeIds,
    identifiant: infos.identifiant,
    motDePasse: infos.motDePasse,
  };
  liste.push(enseignant);
  enregistrerEnseignants(liste);
  return enseignant;
}

export function supprimerEnseignant(id: string) {
  const liste = lireEnseignants();
  const resultat: Enseignant[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  enregistrerEnseignants(resultat);
}

/** Trouve un enseignant dans une liste (renvoie undefined s'il n'existe plus). */
export function trouverEnseignant(liste: Enseignant[], id: string): Enseignant | undefined {
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      return liste[i];
    }
  }
  return undefined;
}

/* ============================================================
 * Cours en ligne
 * ============================================================ */

export function lireCours(): Cours[] {
  const texte = lireTexte(CLE_COURS);
  if (texte !== null) {
    try {
      return JSON.parse(texte);
    } catch (erreur) {
      // on repart des données de départ
    }
  }

  const copie: Cours[] = [];
  for (let i = 0; i < COURS.length; i++) {
    copie.push(COURS[i]);
  }
  return copie;
}

function enregistrerCours(liste: Cours[]) {
  ecrireTexte(CLE_COURS, JSON.stringify(liste));
}

export interface NouveauCours {
  titre: string;
  classeId: string;
  enseignantId: string;
  jour: JourSemaine;
  heureDebut: string;
  heureFin: string;
  lienMeet: string;
}

export function ajouterCours(infos: NouveauCours): Cours {
  const liste = lireCours();
  const cours: Cours = {
    id: nouvelId("cours"),
    titre: infos.titre,
    classeId: infos.classeId,
    enseignantId: infos.enseignantId,
    jour: infos.jour,
    heureDebut: infos.heureDebut,
    heureFin: infos.heureFin,
    lienMeet: infos.lienMeet,
  };
  liste.push(cours);
  enregistrerCours(liste);
  return cours;
}

export function supprimerCours(id: string) {
  const liste = lireCours();
  const resultat: Cours[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  enregistrerCours(resultat);
}

/** Vrai si le lien ressemble à un lien Google Meet. */
export function estUnLienMeet(lien: string): boolean {
  return lien.startsWith("https://meet.google.com/") && lien.length > "https://meet.google.com/".length;
}

/* ============================================================
 * Connexion
 * ============================================================ */

export interface Session {
  role: Role;
  id: string; // "admin", l'id de l'enseignant, ou le téléphone du parent (chiffres)
  prenom: string;
  nom: string;
}

/**
 * Vérifie l'identifiant et le mot de passe.
 * Renvoie la session si c'est bon, ou null si c'est faux.
 */
export function seConnecter(identifiant: string, motDePasse: string): Session | null {
  const identifiantPropre = identifiant.trim();
  let session: Session | null = null;

  // 1. L'administrateur
  if (identifiantPropre === COMPTE_ADMIN.identifiant && motDePasse === COMPTE_ADMIN.motDePasse) {
    session = { role: "admin", id: "admin", prenom: "Abdou", nom: "Diallo" };
  }

  // 2. Un enseignant
  if (session === null) {
    const enseignants = lireEnseignants();
    for (let i = 0; i < enseignants.length; i++) {
      const e = enseignants[i];
      if (e.identifiant === identifiantPropre && e.motDePasse === motDePasse) {
        session = { role: "enseignant", id: e.id, prenom: e.civilite + " " + e.prenom, nom: e.nom };
        break;
      }
    }
  }

  // 3. Un parent : son numéro de téléphone (avec ou sans espaces)
  if (session === null && motDePasse === MOT_DE_PASSE_PARENT) {
    const numero = chiffresSeulement(identifiantPropre);
    const eleves = lireEleves();
    for (let i = 0; i < eleves.length; i++) {
      if (numero !== "" && chiffresSeulement(eleves[i].telephoneParent) === numero) {
        // eleves[i].parent = "Moussa Diop" -> prénom "Moussa", nom "Diop"
        const morceaux = eleves[i].parent.split(" ");
        const nom = morceaux[morceaux.length - 1];
        const prenom = eleves[i].parent.slice(0, eleves[i].parent.length - nom.length).trim();
        session = { role: "parent", id: numero, prenom: prenom, nom: nom };
        break;
      }
    }
  }

  if (session !== null) {
    ecrireTexte(CLE_SESSION, JSON.stringify(session));
  }
  return session;
}

/** Renvoie la personne connectée, ou null si personne ne l'est. */
export function lireSession(): Session | null {
  const texte = lireTexte(CLE_SESSION);
  if (texte === null) {
    return null;
  }
  try {
    return JSON.parse(texte);
  } catch (erreur) {
    return null;
  }
}

export function seDeconnecter() {
  effacer(CLE_SESSION);
}

/** Page d'accueil de chaque rôle. */
export function accueilDuRole(role: Role): string {
  if (role === "enseignant") {
    return "/espace-enseignant";
  }
  if (role === "parent") {
    return "/espace-parent";
  }
  return "/";
}

/** Vrai si ce rôle a le droit de voir cette page. */
export function pageAutorisee(role: Role, chemin: string): boolean {
  if (role === "enseignant") {
    return chemin.startsWith("/espace-enseignant");
  }
  if (role === "parent") {
    return chemin.startsWith("/espace-parent");
  }
  // L'administrateur voit tout, sauf les espaces enseignant et parent
  return !chemin.startsWith("/espace-");
}

/** Texte affiché sous le nom : "Administration", "Enseignant", "Parent d'élève". */
export function nomDuRole(role: Role): string {
  if (role === "enseignant") {
    return "Enseignant";
  }
  if (role === "parent") {
    return "Parent d'élève";
  }
  return "Administration";
}
