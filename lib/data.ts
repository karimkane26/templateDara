/*
 * Données de démonstration.
 *
 * Les élèves et les paiements sont "inventés" par le programme, mais toujours
 * de la même façon : à chaque chargement on obtient exactement les mêmes données.
 *
 * Plus tard, on pourra remplacer ce fichier par des appels à une base de données
 * (Prisma, Supabase...) : il suffit de garder les mêmes types ci-dessous.
 */

/* ============================================================
 * 1. Les types (la "forme" de chaque donnée)
 * ============================================================ */

// "paye" = tout réglé, "partiel" = une partie seulement, "impaye" = rien reçu
export type StatutPaiement = "paye" | "partiel" | "impaye";

export type ModePaiement = "Wave" | "Orange Money" | "Espèces";

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  enseignant: string;
  mensualite: number; // en FCFA
  hizbDebut: number;
  hizbFin: number;
}

export interface Eleve {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  sexe: "M" | "F";
  classeId: string;
  parent: string;
  telephoneParent: string; // format "77 412 35 08"
  hizbActuel: number; // 0 = apprend encore à lire
  tauxPresence: number; // en % sur le mois
  presentAujourdhui: boolean;
  statutMois: StatutPaiement;
  payeMois: number; // FCFA versés pour le mois en cours
  inscritEn: number;
}

export interface Paiement {
  id: string;
  eleveId: string;
  mois: string; // "2026-10"
  date: string; // "2026-10-24"
  montant: number;
  mode: ModePaiement;
}

export interface MoisEncaissement {
  mois: string; // "2026-10"
  attendu: number;
  encaisse: number;
}

export interface Enseignant {
  id: string;
  civilite: string; // "Oustaz" ou "Oustaza"
  prenom: string;
  nom: string;
  telephone: string;
  classeIds: string[]; // classes dont il s'occupe
  identifiant: string; // pour se connecter
  motDePasse: string;
}

// 1 = lundi, 2 = mardi ... 7 = dimanche
export type JourSemaine = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Un cours en ligne, qui revient chaque semaine le même jour à la même heure. */
export interface Cours {
  id: string;
  titre: string;
  classeId: string; // id d'une classe, ou "toutes" pour tous les élèves
  enseignantId: string;
  jour: JourSemaine;
  heureDebut: string; // "09:00"
  heureFin: string; // "10:30"
  lienMeet: string; // "https://meet.google.com/abc-defg-hij"
}

// Les trois sortes de comptes
export type Role = "admin" | "enseignant" | "parent";

/* ============================================================
 * 2. Paramètres de l'école
 * ============================================================ */

export const ECOLE = {
  nom: "Daara Al Falah",
  nomArabe: "دارة الفلاح",
  ville: "Dakar, Parcelles Assainies",
  annee: "2026–2027",
  moisEnCours: "2026-10",
  aujourdhui: "2026-10-26",
};

// Utilisateur connecté
export const UTILISATEUR = {
  prenom: "Abdou",
  nom: "Diallo",
  role: "Administration",
  email: "admin@daara-alfalah.sn",
  telephone: "77 123 45 67",
};

/*
 * Comptes de démonstration.
 * ATTENTION : en démo, les mots de passe sont écrits en clair ici et gardés dans le navigateur.
 * Dans une vraie application, ils doivent être chiffrés et vérifiés par un serveur.
 */
export const COMPTE_ADMIN = {
  identifiant: "admin",
  motDePasse: "admin123",
};

// Les parents se connectent avec leur numéro de téléphone (sans espaces) et ce mot de passe.
export const MOT_DE_PASSE_PARENT = "1234";

export const CLASSES: Classe[] = [
  { id: "alif", nom: "Alif", niveau: "Initiation à la lecture", enseignant: "Oustaz Mamadou Ndiaye", mensualite: 5000, hizbDebut: 0, hizbFin: 2 },
  { id: "ba", nom: "Ba", niveau: "Hizb 1 à 15", enseignant: "Oustaz Ibrahima Fall", mensualite: 7500, hizbDebut: 1, hizbFin: 15 },
  { id: "ta", nom: "Ta", niveau: "Hizb 16 à 40", enseignant: "Oustaza Aïssatou Sy", mensualite: 7500, hizbDebut: 16, hizbFin: 40 },
  { id: "tha", nom: "Tha", niveau: "Hizb 41 à 60", enseignant: "Oustaz Cheikh Diop", mensualite: 10000, hizbDebut: 41, hizbFin: 60 },
];

/* ============================================================
 * 3. Nombres "au hasard" (mais toujours les mêmes)
 * ============================================================ */

// La "graine" de départ. Avec la même graine, on obtient toujours la même suite de nombres.
let graine = 20261026;

/**
 * Renvoie un nombre à virgule entre 0 (inclus) et 1 (exclu).
 * La formule (appelée "mulberry32") n'a pas besoin d'être comprise :
 * elle mélange les bits de la graine pour donner un nombre qui a l'air aléatoire.
 */
function aleatoire(): number {
  graine = graine | 0;
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Choisit un élément au hasard dans une liste de textes. */
function choisirDans(liste: string[]): string {
  const position = Math.floor(aleatoire() * liste.length);
  return liste[position];
}

/** Renvoie un nombre entier entre min et max (inclus). */
function nombreEntre(min: number, max: number): number {
  return min + Math.floor(aleatoire() * (max - min + 1));
}

/** Ajoute des zéros devant : (7, 3) -> "007" */
function avecZeros(n: number, longueur: number): string {
  let texte = String(n);
  while (texte.length < longueur) {
    texte = "0" + texte;
  }
  return texte;
}

/** Fabrique un numéro de téléphone sénégalais, par exemple "77 412 35 08". */
function inventerTelephone(): string {
  const prefixe = choisirDans(["77", "78", "76", "70"]);
  const bloc1 = nombreEntre(100, 999);
  const bloc2 = avecZeros(nombreEntre(0, 99), 2);
  const bloc3 = avecZeros(nombreEntre(0, 99), 2);
  return prefixe + " " + bloc1 + " " + bloc2 + " " + bloc3;
}

const PRENOMS_M = ["Moussa", "Mamadou", "Ibrahima", "Cheikh", "Abdoulaye", "Ousmane", "Modou", "Serigne", "Alioune", "Babacar", "Pape", "Saliou", "Amadou", "Assane", "Malick", "Elhadji"];
const PRENOMS_F = ["Aïssatou", "Fatou", "Mariama", "Khady", "Adja", "Ndèye", "Awa", "Coumba", "Seynabou", "Rokhaya", "Bineta", "Astou", "Sokhna", "Fatima", "Khadija", "Mame Diarra"];
const NOMS = ["Ndiaye", "Diop", "Fall", "Sow", "Ba", "Sy", "Gueye", "Diallo", "Faye", "Mbaye", "Sarr", "Cissé", "Kane", "Thiam", "Seck", "Niang", "Diouf", "Lô", "Mbengue", "Touré"];

/** Nombre d'élèves dans chaque classe. */
function effectifDeLaClasse(classeId: string): number {
  if (classeId === "alif") return 14;
  if (classeId === "ba") return 14;
  if (classeId === "ta") return 12;
  if (classeId === "tha") return 8;
  return 0;
}

/* ============================================================
 * 4. Fabrication des élèves et des paiements
 * ============================================================ */

// ATTENTION : l'ordre des appels à aleatoire() compte !
// Si on le change, on obtient d'autres élèves.

const eleves: Eleve[] = [];
const paiements: Paiement[] = [];
let numero = 0;

for (let c = 0; c < CLASSES.length; c++) {
  const classe = CLASSES[c];
  const effectif = effectifDeLaClasse(classe.id);

  for (let i = 0; i < effectif; i++) {
    numero = numero + 1;

    // Garçon ou fille
    let sexe: "M" | "F" = "F";
    if (aleatoire() < 0.55) {
      sexe = "M";
    }

    // Prénom et nom
    let prenom = "";
    if (sexe === "M") {
      prenom = choisirDans(PRENOMS_M);
    } else {
      prenom = choisirDans(PRENOMS_F);
    }
    const nom = choisirDans(NOMS);

    // Statut de la mensualité du mois
    const tirage = aleatoire();
    let statutMois: StatutPaiement = "impaye";
    if (tirage < 0.66) {
      statutMois = "paye";
    } else if (tirage < 0.82) {
      statutMois = "partiel";
    }

    // Montant déjà versé ce mois-ci
    let payeMois = 0;
    if (statutMois === "paye") {
      payeMois = classe.mensualite;
    } else if (statutMois === "partiel") {
      // 40 % ou 60 % de la mensualité, arrondi à 500 FCFA
      let proportion = 0.6;
      if (aleatoire() < 0.5) {
        proportion = 0.4;
      }
      payeMois = Math.round((classe.mensualite * proportion) / 500) * 500;
    }

    const id = "e" + avecZeros(numero, 3);

    // Le parent (père ou mère) porte le même nom de famille
    let prenomParent = "";
    if (aleatoire() < 0.6) {
      prenomParent = choisirDans(PRENOMS_M);
    } else {
      prenomParent = choisirDans(PRENOMS_F);
    }

    const telephoneParent = inventerTelephone();
    const hizbActuel = nombreEntre(classe.hizbDebut, classe.hizbFin);
    const tauxPresence = nombreEntre(76, 100);
    const presentAujourdhui = aleatoire() < 0.9;
    const inscritEn = nombreEntre(2021, 2026);

    const eleve: Eleve = {
      id: id,
      matricule: "DAF-" + avecZeros(numero, 3),
      prenom: prenom,
      nom: nom,
      sexe: sexe,
      classeId: classe.id,
      parent: prenomParent + " " + nom,
      telephoneParent: telephoneParent,
      hizbActuel: hizbActuel,
      tauxPresence: tauxPresence,
      presentAujourdhui: presentAujourdhui,
      statutMois: statutMois,
      payeMois: payeMois,
      inscritEn: inscritEn,
    };
    eleves.push(eleve);

    // Si l'élève a payé quelque chose, on crée le paiement correspondant
    if (payeMois > 0) {
      const tirageMode = aleatoire();
      let mode: ModePaiement = "Espèces";
      if (tirageMode < 0.48) {
        mode = "Wave";
      } else if (tirageMode < 0.78) {
        mode = "Orange Money";
      }

      const jour = nombreEntre(1, 26);

      const paiement: Paiement = {
        id: "p" + avecZeros(numero, 3),
        eleveId: id,
        mois: ECOLE.moisEnCours,
        date: "2026-10-" + avecZeros(jour, 2),
        montant: payeMois,
        mode: mode,
      };
      paiements.push(paiement);
    }
  }
}

/** Pour trier les paiements : le plus récent d'abord (puis par numéro, du plus grand au plus petit). */
function comparerPaiements(a: Paiement, b: Paiement): number {
  if (a.date < b.date) return 1;
  if (a.date > b.date) return -1;
  if (a.id < b.id) return 1;
  return -1;
}

paiements.sort(comparerPaiements);

export const ELEVES = eleves;
export const PAIEMENTS = paiements;

/* ============================================================
 * 5. Fonctions utiles
 * ============================================================ */

/** Trouve la classe d'un élève. */
export function classeDe(eleve: Eleve): Classe {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === eleve.classeId) {
      return CLASSES[i];
    }
  }
  // Ne devrait jamais arriver : chaque élève a une classe qui existe.
  return CLASSES[0];
}

/** Trouve un élève à partir de son id (renvoie undefined s'il n'existe pas). */
export function eleveParId(id: string): Eleve | undefined {
  for (let i = 0; i < ELEVES.length; i++) {
    if (ELEVES[i].id === id) {
      return ELEVES[i];
    }
  }
  return undefined;
}

/** Ce qu'il reste à payer à un élève pour le mois en cours. */
export function resteAPayer(eleve: Eleve): number {
  return classeDe(eleve).mensualite - eleve.payeMois;
}

/* ============================================================
 * 6. Totaux du mois
 * ============================================================ */

let attenduMois = 0;
let encaisseMois = 0;
let nombrePayes = 0;
let nombrePartiels = 0;
let nombreImpayes = 0;
let nombrePresents = 0;
const absents: Eleve[] = [];

for (let i = 0; i < ELEVES.length; i++) {
  const eleve = ELEVES[i];

  attenduMois = attenduMois + classeDe(eleve).mensualite;
  encaisseMois = encaisseMois + eleve.payeMois;

  if (eleve.statutMois === "paye") {
    nombrePayes = nombrePayes + 1;
  } else if (eleve.statutMois === "partiel") {
    nombrePartiels = nombrePartiels + 1;
  } else {
    nombreImpayes = nombreImpayes + 1;
  }

  if (eleve.presentAujourdhui) {
    nombrePresents = nombrePresents + 1;
  } else {
    absents.push(eleve);
  }
}

export const COLLECTE = {
  attendu: attenduMois,
  encaisse: encaisseMois,
  reste: attenduMois - encaisseMois,
  payes: nombrePayes,
  partiels: nombrePartiels,
  impayes: nombreImpayes,
};

export const PRESENCE = {
  presents: nombrePresents,
  total: ELEVES.length,
  absents: absents,
};

export interface RepartitionMode {
  mode: ModePaiement;
  montant: number;
  nombre: number;
}

/** Combien a été payé par Wave, par Orange Money et en espèces. */
export function repartitionModes(): RepartitionMode[] {
  const modes: ModePaiement[] = ["Wave", "Orange Money", "Espèces"];
  const resultat: RepartitionMode[] = [];

  for (let m = 0; m < modes.length; m++) {
    let montant = 0;
    let nombre = 0;

    for (let p = 0; p < PAIEMENTS.length; p++) {
      if (PAIEMENTS[p].mode === modes[m]) {
        montant = montant + PAIEMENTS[p].montant;
        nombre = nombre + 1;
      }
    }

    resultat.push({ mode: modes[m], montant: montant, nombre: nombre });
  }

  return resultat;
}

/** Pour trier les élèves : celui qui doit le plus d'argent d'abord. */
function comparerParResteDecroissant(a: Eleve, b: Eleve): number {
  return resteAPayer(b) - resteAPayer(a);
}

/** Élèves en retard de paiement, du plus gros reste à payer au plus petit. */
export function relances(): Eleve[] {
  const liste: Eleve[] = [];
  for (let i = 0; i < ELEVES.length; i++) {
    if (ELEVES[i].statutMois !== "paye") {
      liste.push(ELEVES[i]);
    }
  }
  liste.sort(comparerParResteDecroissant);
  return liste;
}

/* ============================================================
 * 7. Historique sur 12 mois
 * (les 11 premiers mois sont inventés, le dernier vient des vraies données ci-dessus)
 * ============================================================ */

const TAUX = [0.93, 0.9, 0.95, 0.88, 0.84, 0.79, 0.9, 0.92, 0.86, 0.81, 0.89];
const CROISSANCE = [0.81, 0.83, 0.85, 0.85, 0.88, 0.9, 0.9, 0.92, 0.94, 0.96, 0.98];
const MOIS_HISTO = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

const historique: MoisEncaissement[] = [];

for (let i = 0; i < MOIS_HISTO.length; i++) {
  const attendu = Math.round((attenduMois * CROISSANCE[i]) / 500) * 500;
  const encaisse = Math.round((attendu * TAUX[i]) / 500) * 500;
  historique.push({ mois: MOIS_HISTO[i], attendu: attendu, encaisse: encaisse });
}

historique.push({ mois: ECOLE.moisEnCours, attendu: attenduMois, encaisse: encaisseMois });

export const HISTORIQUE = historique;

/* ============================================================
 * 8. Statistiques d'une classe
 * ============================================================ */

export interface StatsClasse {
  effectif: number;
  hizbMoyen: number;
  presence: number;
  enRetard: number;
}

export function statsClasse(classe: Classe): StatsClasse {
  let effectif = 0;
  let totalHizb = 0;
  let totalPresence = 0;
  let enRetard = 0;

  for (let i = 0; i < ELEVES.length; i++) {
    const eleve = ELEVES[i];
    if (eleve.classeId === classe.id) {
      effectif = effectif + 1;
      totalHizb = totalHizb + eleve.hizbActuel;
      totalPresence = totalPresence + eleve.tauxPresence;
      if (eleve.statutMois !== "paye") {
        enRetard = enRetard + 1;
      }
    }
  }

  // On évite de diviser par 0 si la classe est vide
  let diviseur = effectif;
  if (diviseur === 0) {
    diviseur = 1;
  }

  return {
    effectif: effectif,
    hizbMoyen: totalHizb / diviseur,
    presence: Math.round(totalPresence / diviseur),
    enRetard: enRetard,
  };
}

/* ============================================================
 * 9. Enseignants et cours en ligne de départ
 * (l'administrateur peut en ajouter ou en supprimer depuis l'application)
 * ============================================================ */

export const ENSEIGNANTS: Enseignant[] = [
  { id: "ens-1", civilite: "Oustaz", prenom: "Mamadou", nom: "Ndiaye", telephone: "77 501 22 10", classeIds: ["alif"], identifiant: "mndiaye", motDePasse: "1234" },
  { id: "ens-2", civilite: "Oustaz", prenom: "Ibrahima", nom: "Fall", telephone: "78 640 18 33", classeIds: ["ba"], identifiant: "ifall", motDePasse: "1234" },
  { id: "ens-3", civilite: "Oustaza", prenom: "Aïssatou", nom: "Sy", telephone: "76 212 47 05", classeIds: ["ta"], identifiant: "asy", motDePasse: "1234" },
  { id: "ens-4", civilite: "Oustaz", prenom: "Cheikh", nom: "Diop", telephone: "70 388 90 61", classeIds: ["tha"], identifiant: "cdiop", motDePasse: "1234" },
];

// Les liens Meet ci-dessous sont des exemples : l'administrateur doit les remplacer par de vrais liens.
export const COURS: Cours[] = [
  { id: "cours-1", titre: "Lecture et alphabet", classeId: "alif", enseignantId: "ens-1", jour: 1, heureDebut: "09:00", heureFin: "10:00", lienMeet: "https://meet.google.com/abc-defg-hij" },
  { id: "cours-2", titre: "Lecture et alphabet", classeId: "alif", enseignantId: "ens-1", jour: 4, heureDebut: "09:00", heureFin: "10:00", lienMeet: "https://meet.google.com/abc-defg-hij" },
  { id: "cours-3", titre: "Mémorisation, hizb 1 à 15", classeId: "ba", enseignantId: "ens-2", jour: 2, heureDebut: "09:00", heureFin: "10:30", lienMeet: "https://meet.google.com/kmn-pqrs-tuv" },
  { id: "cours-4", titre: "Révision, hizb 16 à 40", classeId: "ta", enseignantId: "ens-3", jour: 3, heureDebut: "16:00", heureFin: "17:30", lienMeet: "https://meet.google.com/wxy-zabc-def" },
  { id: "cours-5", titre: "Tajwid avancé", classeId: "tha", enseignantId: "ens-4", jour: 4, heureDebut: "16:00", heureFin: "17:30", lienMeet: "https://meet.google.com/ghi-jklm-nop" },
  { id: "cours-6", titre: "Causerie du samedi (toute l'école)", classeId: "toutes", enseignantId: "ens-4", jour: 6, heureDebut: "10:00", heureFin: "11:00", lienMeet: "https://meet.google.com/qrs-tuvw-xyz" },
];
