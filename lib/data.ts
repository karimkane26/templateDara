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
  actif?: boolean; // false = compte désactivé par l'administrateur (absent = actif)
}

/**
 * Un parent d'élève. Il est relié à ses enfants par son numéro de téléphone :
 * tous les élèves dont "telephoneParent" est ce numéro sont ses enfants.
 */
export interface Parent {
  id: string;
  prenom: string;
  nom: string;
  telephone: string; // format "77 412 35 08", sert d'identifiant de connexion
  email: string;
  adresse: string;
  motDePasse: string;
  actif: boolean; // false = le parent ne peut plus se connecter
}

/** Un enseignement (une matière) : Mémorisation, Tajwid, Langue arabe... */
export interface Enseignement {
  id: string;
  nom: string;
  description: string;
}

// Qui voit une annonce
export type PublicAnnonce = "tous" | "enseignants" | "parents";

/** Une annonce publiée par l'administration. */
export interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  date: string; // "2026-10-26"
  public: PublicAnnonce;
  importante: boolean; // affichée en couleur
}

/* ---------- Gestion financière ---------- */

/** Frais d'inscription (nouvel élève) ou de réinscription, une fois par année scolaire. */
export interface Inscription {
  id: string;
  eleveId: string;
  annee: string; // "2026–2027"
  type: "inscription" | "reinscription";
  montant: number; // FCFA à payer
  montantPaye: number; // FCFA déjà versés
  datePaiement: string; // "2026-10-03", ou "" si pas encore payé
  mode: ModePaiement;
}

/** Un salaire versé à un enseignant pour un mois. */
export interface PaiementSalaire {
  id: string;
  enseignantId: string;
  mois: string; // "2026-10" : le mois de travail payé
  date: string; // jour du versement
  montant: number;
  mode: ModePaiement;
  note: string;
}

export type CategorieDepense = "Loyer" | "Électricité et eau" | "Internet et abonnements" | "Fournitures" | "Communication" | "Entretien" | "Autre";

/** Une dépense de l'école (loyer, électricité, fournitures...). */
export interface Depense {
  id: string;
  date: string;
  categorie: CategorieDepense;
  libelle: string;
  montant: number;
  mode: ModePaiement;
}

// 1 = lundi, 2 = mardi ... 7 = dimanche
export type JourSemaine = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Un cours en ligne, qui revient chaque semaine le même jour à la même heure. */
export interface Cours {
  id: string;
  titre: string;
  classeId: string; // id d'une classe, ou "toutes" pour tous les élèves
  enseignantId: string;
  enseignementId?: string; // la matière enseignée (peut manquer sur les anciens cours)
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
  { id: "cours-1", titre: "Lecture et alphabet", classeId: "alif", enseignantId: "ens-1", enseignementId: "lecture", jour: 1, heureDebut: "09:00", heureFin: "10:00", lienMeet: "https://meet.google.com/abc-defg-hij" },
  { id: "cours-2", titre: "Lecture et alphabet", classeId: "alif", enseignantId: "ens-1", enseignementId: "lecture", jour: 4, heureDebut: "09:00", heureFin: "10:00", lienMeet: "https://meet.google.com/abc-defg-hij" },
  { id: "cours-3", titre: "Mémorisation, hizb 1 à 15", classeId: "ba", enseignantId: "ens-2", enseignementId: "memorisation", jour: 2, heureDebut: "09:00", heureFin: "10:30", lienMeet: "https://meet.google.com/kmn-pqrs-tuv" },
  { id: "cours-4", titre: "Révision, hizb 16 à 40", classeId: "ta", enseignantId: "ens-3", enseignementId: "memorisation", jour: 3, heureDebut: "16:00", heureFin: "17:30", lienMeet: "https://meet.google.com/wxy-zabc-def" },
  { id: "cours-5", titre: "Tajwid avancé", classeId: "tha", enseignantId: "ens-4", enseignementId: "tajwid", jour: 4, heureDebut: "16:00", heureFin: "17:30", lienMeet: "https://meet.google.com/ghi-jklm-nop" },
  { id: "cours-6", titre: "Causerie du samedi (toute l'école)", classeId: "toutes", enseignantId: "ens-4", enseignementId: "education", jour: 6, heureDebut: "10:00", heureFin: "11:00", lienMeet: "https://meet.google.com/qrs-tuvw-xyz" },
];

/* ============================================================
 * 10. Enseignements (matières) et annonces de départ
 * ============================================================ */

export const ENSEIGNEMENTS: Enseignement[] = [
  { id: "lecture", nom: "Lecture et alphabet", description: "Apprendre les lettres arabes et lire le Coran (classe Alif)." },
  { id: "memorisation", nom: "Mémorisation du Coran", description: "Apprentissage par cœur des hizb et révisions régulières." },
  { id: "tajwid", nom: "Tajwid", description: "Les règles de récitation du Coran." },
  { id: "arabe", nom: "Langue arabe", description: "Vocabulaire, grammaire et conversation." },
  { id: "education", nom: "Éducation islamique", description: "Fiqh, sira du Prophète (PSL) et bonnes manières." },
];

export const ANNONCES: Annonce[] = [
  {
    id: "annonce-1",
    titre: "Bienvenue sur l'espace en ligne",
    contenu: "Les cours en ligne ont lieu sur Google Meet. Cliquez sur « Rejoindre sur Google Meet » à l'heure du cours. Pensez à activer votre micro et votre caméra.",
    date: "2026-10-20",
    public: "tous",
    importante: false,
  },
  {
    id: "annonce-2",
    titre: "Réunion des parents samedi 31 octobre",
    contenu: "Une réunion d'information aura lieu à 10 h à l'école, et en direct sur Google Meet pour ceux qui ne peuvent pas se déplacer.",
    date: "2026-10-24",
    public: "parents",
    importante: true,
  },
];

/* ============================================================
 * 11. Gestion financière : valeurs de départ
 * (l'administrateur peut tout modifier depuis la page Gestion financière)
 * ============================================================ */

// Frais payés une fois par année scolaire
export const FRAIS_DE_DEPART = {
  inscription: 10000, // nouvel élève
  reinscription: 5000, // élève déjà inscrit l'année d'avant
};

// Salaire mensuel de chaque enseignant (FCFA)
export const SALAIRES_DE_DEPART: { enseignantId: string; montant: number }[] = [
  { enseignantId: "ens-1", montant: 75000 },
  { enseignantId: "ens-2", montant: 80000 },
  { enseignantId: "ens-3", montant: 80000 },
  { enseignantId: "ens-4", montant: 100000 },
];

export const PAIEMENTS_SALAIRES: PaiementSalaire[] = [
  { id: "sal-1", enseignantId: "ens-1", mois: "2026-09", date: "2026-09-30", montant: 75000, mode: "Wave", note: "" },
  { id: "sal-2", enseignantId: "ens-2", mois: "2026-09", date: "2026-09-30", montant: 80000, mode: "Wave", note: "" },
  { id: "sal-3", enseignantId: "ens-3", mois: "2026-09", date: "2026-09-30", montant: 80000, mode: "Orange Money", note: "" },
  { id: "sal-4", enseignantId: "ens-4", mois: "2026-09", date: "2026-09-30", montant: 100000, mode: "Espèces", note: "" },
  { id: "sal-5", enseignantId: "ens-2", mois: "2026-10", date: "2026-10-25", montant: 40000, mode: "Wave", note: "Avance sur salaire" },
];

export const DEPENSES: Depense[] = [
  { id: "dep-1", date: "2026-09-01", categorie: "Loyer", libelle: "Loyer du local, septembre", montant: 150000, mode: "Wave" },
  { id: "dep-2", date: "2026-09-12", categorie: "Électricité et eau", libelle: "Facture Senelec", montant: 23500, mode: "Orange Money" },
  { id: "dep-3", date: "2026-10-01", categorie: "Loyer", libelle: "Loyer du local, octobre", montant: 150000, mode: "Wave" },
  { id: "dep-4", date: "2026-10-05", categorie: "Internet et abonnements", libelle: "Box internet + Google Workspace", montant: 28000, mode: "Wave" },
  { id: "dep-5", date: "2026-10-09", categorie: "Fournitures", libelle: "Corans, ardoises et cahiers", montant: 42000, mode: "Espèces" },
  { id: "dep-6", date: "2026-10-14", categorie: "Électricité et eau", libelle: "Facture Senelec", montant: 21000, mode: "Orange Money" },
  { id: "dep-7", date: "2026-10-20", categorie: "Communication", libelle: "Crédit téléphone pour les relances", montant: 5000, mode: "Espèces" },
];
