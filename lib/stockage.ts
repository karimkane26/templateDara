/*
 * Stockage de la démo : élèves, parents, enseignants, enseignements, cours,
 * annonces et session de connexion.
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
  ANNONCES,
  COMPTE_ADMIN,
  COURS,
  ELEVES,
  ENSEIGNANTS,
  ENSEIGNEMENTS,
  MOT_DE_PASSE_PARENT,
  type Annonce,
  type Cours,
  type Eleve,
  type Enseignant,
  type Enseignement,
  type JourSemaine,
  type Parent,
  type PublicAnnonce,
  type Role,
} from "./data";

const CLE_ELEVES = "daara-eleves";
const CLE_PARENTS = "daara-parents";
const CLE_ENSEIGNANTS = "daara-enseignants";
const CLE_ENSEIGNEMENTS = "daara-enseignements";
const CLE_COURS = "daara-cours";
const CLE_ANNONCES = "daara-annonces";
const CLE_MDP_ADMIN = "daara-mdp-admin";
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

/**
 * Lit une liste enregistrée. S'il n'y a rien (premier lancement)
 * ou si le texte est abîmé, on renvoie une copie de la liste de départ.
 */
export function lireListe<T>(cle: string, listeDeDepart: T[]): T[] {
  const texte = lireTexte(cle);
  if (texte !== null) {
    try {
      return JSON.parse(texte);
    } catch (erreur) {
      // texte abîmé : on repart des données de départ
    }
  }

  const copie: T[] = [];
  for (let i = 0; i < listeDeDepart.length; i++) {
    copie.push(listeDeDepart[i]);
  }
  return copie;
}

/** Enregistre une liste dans le navigateur (sous forme de texte JSON). */
export function ecrireListe<T>(cle: string, liste: T[]) {
  ecrireTexte(cle, JSON.stringify(liste));
}

/** Fabrique un identifiant unique, par exemple "eleve-1730812345678". */
export function nouvelId(prefixe: string): string {
  // Date.now() + un petit nombre au hasard : deux ajouts dans la même milliseconde restent différents
  return prefixe + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
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

/** Date du jour au format "2026-10-26". */
export function aujourdhuiIso(): string {
  const d = new Date();
  let mois = String(d.getMonth() + 1);
  if (mois.length < 2) {
    mois = "0" + mois;
  }
  let jour = String(d.getDate());
  if (jour.length < 2) {
    jour = "0" + jour;
  }
  return d.getFullYear() + "-" + mois + "-" + jour;
}

/* ============================================================
 * Élèves
 * ============================================================ */

export function lireEleves(): Eleve[] {
  return lireListe(CLE_ELEVES, ELEVES);
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

  // Si ce parent n'a pas encore de fiche, lireParents() la crée automatiquement.
  lireParents();
  return eleve;
}

/** Modifie les informations d'un élève (le matricule et les paiements ne changent pas). */
export function modifierEleve(id: string, infos: NouvelEleve) {
  const liste = lireEleves();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].prenom = infos.prenom;
      liste[i].nom = infos.nom;
      liste[i].sexe = infos.sexe;
      liste[i].classeId = infos.classeId;
      liste[i].hizbActuel = infos.hizbActuel;
      liste[i].parent = infos.parent;
      liste[i].telephoneParent = infos.telephoneParent;
    }
  }
  enregistrerEleves(liste);
  lireParents();
}

/** L'enseignant met à jour le hizb où en est l'élève. */
export function modifierHizb(id: string, hizb: number) {
  const liste = lireEleves();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].hizbActuel = hizb;
    }
  }
  enregistrerEleves(liste);
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
 * Parents
 * ============================================================ */

/** "Moussa Diop" -> { prenom: "Moussa", nom: "Diop" } ; "Mame Diarra Fall" -> "Mame Diarra" / "Fall" */
function decouperNom(nomComplet: string): { prenom: string; nom: string } {
  const propre = nomComplet.trim();
  const morceaux = propre.split(" ");
  const nom = morceaux[morceaux.length - 1];
  const prenom = propre.slice(0, propre.length - nom.length).trim();
  return { prenom: prenom, nom: nom };
}

/** Cherche le parent qui a ce numéro (avec ou sans espaces). */
export function trouverParentParTelephone(liste: Parent[], telephone: string): Parent | undefined {
  const numero = chiffresSeulement(telephone);
  if (numero === "") {
    return undefined;
  }
  for (let i = 0; i < liste.length; i++) {
    if (chiffresSeulement(liste[i].telephone) === numero) {
      return liste[i];
    }
  }
  return undefined;
}

export function trouverParent(liste: Parent[], id: string): Parent | undefined {
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      return liste[i];
    }
  }
  return undefined;
}

function enregistrerParents(liste: Parent[]) {
  ecrireTexte(CLE_PARENTS, JSON.stringify(liste));
}

/**
 * Lit la liste des parents.
 * Si un élève a un numéro de parent qui n'a pas encore de fiche,
 * on crée la fiche automatiquement (mot de passe par défaut : MOT_DE_PASSE_PARENT).
 */
export function lireParents(): Parent[] {
  const liste = lireListe<Parent>(CLE_PARENTS, []);
  const eleves = lireEleves();
  let unParentAjoute = false;

  for (let i = 0; i < eleves.length; i++) {
    const eleve = eleves[i];
    if (trouverParentParTelephone(liste, eleve.telephoneParent) !== undefined) {
      continue; // ce parent a déjà sa fiche
    }
    const morceaux = decouperNom(eleve.parent);
    liste.push({
      id: "parent-" + chiffresSeulement(eleve.telephoneParent),
      prenom: morceaux.prenom,
      nom: morceaux.nom,
      telephone: eleve.telephoneParent,
      email: "",
      adresse: "",
      motDePasse: MOT_DE_PASSE_PARENT,
      actif: true,
    });
    unParentAjoute = true;
  }

  if (unParentAjoute) {
    enregistrerParents(liste);
  }
  return liste;
}

/** Les enfants d'un parent : les élèves qui ont son numéro de téléphone. */
export function enfantsDuParent(parent: Parent, eleves: Eleve[]): Eleve[] {
  const numero = chiffresSeulement(parent.telephone);
  const enfants: Eleve[] = [];
  for (let i = 0; i < eleves.length; i++) {
    if (chiffresSeulement(eleves[i].telephoneParent) === numero) {
      enfants.push(eleves[i]);
    }
  }
  return enfants;
}

export interface NouveauParent {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  motDePasse: string;
  actif: boolean;
}

/** Vrai si un autre parent (autre que "saufId") a déjà ce numéro. */
export function telephoneParentDejaPris(telephone: string, saufId: string): boolean {
  const existant = trouverParentParTelephone(lireParents(), telephone);
  return existant !== undefined && existant.id !== saufId;
}

export function ajouterParent(infos: NouveauParent): Parent {
  const liste = lireParents();
  const parent: Parent = {
    id: nouvelId("parent"),
    prenom: infos.prenom,
    nom: infos.nom,
    telephone: infos.telephone,
    email: infos.email,
    adresse: infos.adresse,
    motDePasse: infos.motDePasse,
    actif: infos.actif,
  };
  liste.push(parent);
  enregistrerParents(liste);
  return parent;
}

/**
 * Modifie un parent. Ses enfants sont mis à jour aussi :
 * nouveau nom du parent et nouveau numéro de téléphone.
 */
export function modifierParent(id: string, infos: NouveauParent) {
  const liste = lireParents();
  let ancienNumero = "";

  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      ancienNumero = chiffresSeulement(liste[i].telephone);
      liste[i].prenom = infos.prenom;
      liste[i].nom = infos.nom;
      liste[i].telephone = infos.telephone;
      liste[i].email = infos.email;
      liste[i].adresse = infos.adresse;
      liste[i].motDePasse = infos.motDePasse;
      liste[i].actif = infos.actif;
    }
  }
  enregistrerParents(liste);

  if (ancienNumero === "") {
    return; // parent introuvable
  }

  const eleves = lireEleves();
  for (let i = 0; i < eleves.length; i++) {
    if (chiffresSeulement(eleves[i].telephoneParent) === ancienNumero) {
      eleves[i].telephoneParent = infos.telephone;
      eleves[i].parent = infos.prenom + " " + infos.nom;
    }
  }
  enregistrerEleves(eleves);
}

/**
 * Supprime un parent. Refusé (renvoie false) s'il a encore des enfants inscrits :
 * il faut d'abord retirer ou changer de parent ces élèves.
 */
export function supprimerParent(id: string): boolean {
  const liste = lireParents();
  const parent = trouverParent(liste, id);
  if (parent === undefined) {
    return true;
  }
  if (enfantsDuParent(parent, lireEleves()).length > 0) {
    return false;
  }

  const resultat: Parent[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  enregistrerParents(resultat);
  return true;
}

/* ============================================================
 * Enseignants
 * ============================================================ */

export function lireEnseignants(): Enseignant[] {
  return lireListe(CLE_ENSEIGNANTS, ENSEIGNANTS);
}

function enregistrerEnseignants(liste: Enseignant[]) {
  ecrireTexte(CLE_ENSEIGNANTS, JSON.stringify(liste));
}

/** Vrai si cet identifiant de connexion est déjà pris par un autre compte (autre que "saufId"). */
export function identifiantDejaPris(identifiant: string, saufId?: string): boolean {
  if (identifiant === COMPTE_ADMIN.identifiant) {
    return true;
  }
  const liste = lireEnseignants();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].identifiant === identifiant && liste[i].id !== saufId) {
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
  actif: boolean;
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
    actif: infos.actif,
  };
  liste.push(enseignant);
  enregistrerEnseignants(liste);
  return enseignant;
}

export function modifierEnseignant(id: string, infos: NouvelEnseignant) {
  const liste = lireEnseignants();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].civilite = infos.civilite;
      liste[i].prenom = infos.prenom;
      liste[i].nom = infos.nom;
      liste[i].telephone = infos.telephone;
      liste[i].classeIds = infos.classeIds;
      liste[i].identifiant = infos.identifiant;
      liste[i].motDePasse = infos.motDePasse;
      liste[i].actif = infos.actif;
    }
  }
  enregistrerEnseignants(liste);
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

/** Vrai si le compte n'a pas été désactivé (les anciens comptes sans "actif" sont actifs). */
export function enseignantActif(enseignant: Enseignant): boolean {
  return enseignant.actif !== false;
}

/* ============================================================
 * Enseignements (matières)
 * ============================================================ */

export function lireEnseignements(): Enseignement[] {
  return lireListe(CLE_ENSEIGNEMENTS, ENSEIGNEMENTS);
}

function enregistrerEnseignements(liste: Enseignement[]) {
  ecrireTexte(CLE_ENSEIGNEMENTS, JSON.stringify(liste));
}

export function trouverEnseignement(liste: Enseignement[], id: string | undefined): Enseignement | undefined {
  if (id === undefined) {
    return undefined;
  }
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      return liste[i];
    }
  }
  return undefined;
}

export interface NouvelEnseignement {
  nom: string;
  description: string;
}

export function ajouterEnseignement(infos: NouvelEnseignement): Enseignement {
  const liste = lireEnseignements();
  const enseignement: Enseignement = { id: nouvelId("matiere"), nom: infos.nom, description: infos.description };
  liste.push(enseignement);
  enregistrerEnseignements(liste);
  return enseignement;
}

export function modifierEnseignement(id: string, infos: NouvelEnseignement) {
  const liste = lireEnseignements();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].nom = infos.nom;
      liste[i].description = infos.description;
    }
  }
  enregistrerEnseignements(liste);
}

/** Supprime une matière. Les cours qui l'utilisaient restent, sans matière. */
export function supprimerEnseignement(id: string) {
  const liste = lireEnseignements();
  const resultat: Enseignement[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  enregistrerEnseignements(resultat);
}

/* ============================================================
 * Cours en ligne
 * ============================================================ */

export function lireCours(): Cours[] {
  return lireListe(CLE_COURS, COURS);
}

function enregistrerCours(liste: Cours[]) {
  ecrireTexte(CLE_COURS, JSON.stringify(liste));
}

export interface NouveauCours {
  titre: string;
  classeId: string;
  enseignantId: string;
  enseignementId: string;
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
    enseignementId: infos.enseignementId,
    jour: infos.jour,
    heureDebut: infos.heureDebut,
    heureFin: infos.heureFin,
    lienMeet: infos.lienMeet,
  };
  liste.push(cours);
  enregistrerCours(liste);
  return cours;
}

export function modifierCours(id: string, infos: NouveauCours) {
  const liste = lireCours();
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id === id) {
      liste[i].titre = infos.titre;
      liste[i].classeId = infos.classeId;
      liste[i].enseignantId = infos.enseignantId;
      liste[i].enseignementId = infos.enseignementId;
      liste[i].jour = infos.jour;
      liste[i].heureDebut = infos.heureDebut;
      liste[i].heureFin = infos.heureFin;
      liste[i].lienMeet = infos.lienMeet;
    }
  }
  enregistrerCours(liste);
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
 * Annonces
 * ============================================================ */

/** Pour trier les annonces : la plus récente d'abord. */
function comparerAnnonces(a: Annonce, b: Annonce): number {
  if (a.date < b.date) return 1;
  if (a.date > b.date) return -1;
  if (a.id < b.id) return 1;
  return -1;
}

export function lireAnnonces(): Annonce[] {
  const liste = lireListe(CLE_ANNONCES, ANNONCES);
  liste.sort(comparerAnnonces);
  return liste;
}

function enregistrerAnnonces(liste: Annonce[]) {
  ecrireTexte(CLE_ANNONCES, JSON.stringify(liste));
}

export interface NouvelleAnnonce {
  titre: string;
  contenu: string;
  public: PublicAnnonce;
  importante: boolean;
}

export function ajouterAnnonce(infos: NouvelleAnnonce): Annonce {
  const liste = lireAnnonces();
  const annonce: Annonce = {
    id: nouvelId("annonce"),
    titre: infos.titre,
    contenu: infos.contenu,
    date: aujourdhuiIso(),
    public: infos.public,
    importante: infos.importante,
  };
  liste.push(annonce);
  enregistrerAnnonces(liste);
  return annonce;
}

export function supprimerAnnonce(id: string) {
  const liste = lireAnnonces();
  const resultat: Annonce[] = [];
  for (let i = 0; i < liste.length; i++) {
    if (liste[i].id !== id) {
      resultat.push(liste[i]);
    }
  }
  enregistrerAnnonces(resultat);
}

/** Les annonces qu'un enseignant ou un parent a le droit de voir. */
export function annoncesPour(role: Role): Annonce[] {
  const toutes = lireAnnonces();
  if (role === "admin") {
    return toutes;
  }
  const resultat: Annonce[] = [];
  for (let i = 0; i < toutes.length; i++) {
    const pourQui = toutes[i].public;
    if (pourQui === "tous") {
      resultat.push(toutes[i]);
    } else if (pourQui === "enseignants" && role === "enseignant") {
      resultat.push(toutes[i]);
    } else if (pourQui === "parents" && role === "parent") {
      resultat.push(toutes[i]);
    }
  }
  return resultat;
}

/* ============================================================
 * Connexion
 * ============================================================ */

export interface Session {
  role: Role;
  id: string; // "admin", l'id de l'enseignant, ou l'id du parent
  prenom: string;
  nom: string;
}

/** Le mot de passe de l'administrateur (modifiable depuis "Mot de passe"). */
function motDePasseAdmin(): string {
  const enregistre = lireTexte(CLE_MDP_ADMIN);
  if (enregistre !== null && enregistre !== "") {
    return enregistre;
  }
  return COMPTE_ADMIN.motDePasse;
}

/**
 * Vérifie l'identifiant et le mot de passe.
 * Renvoie la session si c'est bon, ou null si c'est faux.
 */
export function seConnecter(identifiant: string, motDePasse: string): Session | null {
  const identifiantPropre = identifiant.trim();
  let session: Session | null = null;

  // 1. L'administrateur
  if (identifiantPropre === COMPTE_ADMIN.identifiant && motDePasse === motDePasseAdmin()) {
    session = { role: "admin", id: "admin", prenom: "Abdou", nom: "Diallo" };
  }

  // 2. Un enseignant (seulement si son compte est actif)
  if (session === null) {
    const enseignants = lireEnseignants();
    for (let i = 0; i < enseignants.length; i++) {
      const e = enseignants[i];
      if (e.identifiant === identifiantPropre && e.motDePasse === motDePasse && enseignantActif(e)) {
        session = { role: "enseignant", id: e.id, prenom: e.civilite + " " + e.prenom, nom: e.nom };
        break;
      }
    }
  }

  // 3. Un parent : son numéro de téléphone (avec ou sans espaces) et son mot de passe
  if (session === null) {
    const parent = trouverParentParTelephone(lireParents(), identifiantPropre);
    if (parent !== undefined && parent.actif && parent.motDePasse === motDePasse) {
      session = { role: "parent", id: parent.id, prenom: parent.prenom, nom: parent.nom };
    }
  }

  if (session !== null) {
    ecrireTexte(CLE_SESSION, JSON.stringify(session));
  }
  return session;
}

/**
 * Change le mot de passe de la personne connectée.
 * Renvoie "" si c'est fait, ou un message d'erreur.
 */
export function changerMotDePasse(session: Session, actuel: string, nouveau: string): string {
  if (session.role === "admin") {
    if (actuel !== motDePasseAdmin()) {
      return "Le mot de passe actuel est incorrect.";
    }
    ecrireTexte(CLE_MDP_ADMIN, nouveau);
    return "";
  }

  if (session.role === "enseignant") {
    const liste = lireEnseignants();
    for (let i = 0; i < liste.length; i++) {
      if (liste[i].id === session.id) {
        if (liste[i].motDePasse !== actuel) {
          return "Le mot de passe actuel est incorrect.";
        }
        liste[i].motDePasse = nouveau;
        enregistrerEnseignants(liste);
        return "";
      }
    }
    return "Compte introuvable.";
  }

  const parents = lireParents();
  for (let i = 0; i < parents.length; i++) {
    if (parents[i].id === session.id) {
      if (parents[i].motDePasse !== actuel) {
        return "Le mot de passe actuel est incorrect.";
      }
      parents[i].motDePasse = nouveau;
      enregistrerParents(parents);
      return "";
    }
  }
  return "Compte introuvable.";
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
