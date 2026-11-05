/**
 * Données de démonstration.
 * Tout est généré de façon déterministe (même résultat à chaque chargement)
 * et typé pour être remplacé plus tard par des appels à une API ou une base
 * de données (Prisma, Supabase, etc.) : il suffit de garder les mêmes types.
 */

export type StatutPaiement = "paye" | "partiel" | "impaye";
export type ModePaiement = "Wave" | "Orange Money" | "Espèces";

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  enseignant: string;
  mensualite: number; // FCFA
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
  hizbActuel: number; // 0 = apprentissage de la lecture
  tauxPresence: number; // % sur le mois
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

/* ---------- Paramètres de l'école ---------- */

export const ECOLE = {
  nom: "Daara Al Falah",
  nomArabe: "دارة الفلاح",
  ville: "Dakar, Parcelles Assainies",
  annee: "2026–2027",
  moisEnCours: "2026-10",
  aujourdhui: "2026-10-26",
};

/* ---------- Utilisateur connecté ---------- */

export const UTILISATEUR = {
  prenom: "Abdou",
  nom: "Diallo",
  role: "Administration",
  email: "admin@daara-alfalah.sn",
  telephone: "77 123 45 67",
};

export const CLASSES: Classe[] = [
  { id: "alif", nom: "Alif", niveau: "Initiation à la lecture", enseignant: "Oustaz Mamadou Ndiaye", mensualite: 5000, hizbDebut: 0, hizbFin: 2 },
  { id: "ba", nom: "Ba", niveau: "Hizb 1 à 15", enseignant: "Oustaz Ibrahima Fall", mensualite: 7500, hizbDebut: 1, hizbFin: 15 },
  { id: "ta", nom: "Ta", niveau: "Hizb 16 à 40", enseignant: "Oustaza Aïssatou Sy", mensualite: 7500, hizbDebut: 16, hizbFin: 40 },
  { id: "tha", nom: "Tha", niveau: "Hizb 41 à 60", enseignant: "Oustaz Cheikh Diop", mensualite: 10000, hizbDebut: 41, hizbFin: 60 },
];

/* ---------- Générateur déterministe ---------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261026);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const entre = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const PRENOMS_M = ["Moussa", "Mamadou", "Ibrahima", "Cheikh", "Abdoulaye", "Ousmane", "Modou", "Serigne", "Alioune", "Babacar", "Pape", "Saliou", "Amadou", "Assane", "Malick", "Elhadji"];
const PRENOMS_F = ["Aïssatou", "Fatou", "Mariama", "Khady", "Adja", "Ndèye", "Awa", "Coumba", "Seynabou", "Rokhaya", "Bineta", "Astou", "Sokhna", "Fatima", "Khadija", "Mame Diarra"];
const NOMS = ["Ndiaye", "Diop", "Fall", "Sow", "Ba", "Sy", "Gueye", "Diallo", "Faye", "Mbaye", "Sarr", "Cissé", "Kane", "Thiam", "Seck", "Niang", "Diouf", "Lô", "Mbengue", "Touré"];
const EFFECTIFS: Record<string, number> = { alif: 14, ba: 14, ta: 12, tha: 8 };

function telephone(): string {
  const p = pick(["77", "78", "76", "70"]);
  return `${p} ${entre(100, 999)} ${String(entre(0, 99)).padStart(2, "0")} ${String(entre(0, 99)).padStart(2, "0")}`;
}

const eleves: Eleve[] = [];
const paiements: Paiement[] = [];
let n = 0;

for (const classe of CLASSES) {
  for (let i = 0; i < EFFECTIFS[classe.id]; i++) {
    n++;
    const sexe = rand() < 0.55 ? "M" : "F";
    const prenom = pick(sexe === "M" ? PRENOMS_M : PRENOMS_F);
    const nom = pick(NOMS);
    const r = rand();
    const statutMois: StatutPaiement = r < 0.66 ? "paye" : r < 0.82 ? "partiel" : "impaye";
    const payeMois =
      statutMois === "paye" ? classe.mensualite : statutMois === "partiel" ? Math.round((classe.mensualite * (rand() < 0.5 ? 0.4 : 0.6)) / 500) * 500 : 0;
    const id = `e${String(n).padStart(3, "0")}`;

    eleves.push({
      id,
      matricule: `DAF-${String(n).padStart(3, "0")}`,
      prenom,
      nom,
      sexe,
      classeId: classe.id,
      parent: `${pick(rand() < 0.6 ? PRENOMS_M : PRENOMS_F)} ${nom}`,
      telephoneParent: telephone(),
      hizbActuel: entre(classe.hizbDebut, classe.hizbFin),
      tauxPresence: entre(76, 100),
      presentAujourdhui: rand() < 0.9,
      statutMois,
      payeMois,
      inscritEn: entre(2021, 2026),
    });

    if (payeMois > 0) {
      const m = rand();
      paiements.push({
        id: `p${String(n).padStart(3, "0")}`,
        eleveId: id,
        mois: ECOLE.moisEnCours,
        date: `2026-10-${String(entre(1, 26)).padStart(2, "0")}`,
        montant: payeMois,
        mode: m < 0.48 ? "Wave" : m < 0.78 ? "Orange Money" : "Espèces",
      });
    }
  }
}

paiements.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));

export const ELEVES = eleves;
export const PAIEMENTS = paiements;

/* ---------- Agrégats ---------- */

export function classeDe(eleve: Eleve): Classe {
  return CLASSES.find((c) => c.id === eleve.classeId)!;
}

export function eleveParId(id: string): Eleve | undefined {
  return ELEVES.find((e) => e.id === id);
}

export function resteAPayer(eleve: Eleve): number {
  return classeDe(eleve).mensualite - eleve.payeMois;
}

const attenduMois = ELEVES.reduce((s, e) => s + classeDe(e).mensualite, 0);
const encaisseMois = ELEVES.reduce((s, e) => s + e.payeMois, 0);

export const COLLECTE = {
  attendu: attenduMois,
  encaisse: encaisseMois,
  reste: attenduMois - encaisseMois,
  payes: ELEVES.filter((e) => e.statutMois === "paye").length,
  partiels: ELEVES.filter((e) => e.statutMois === "partiel").length,
  impayes: ELEVES.filter((e) => e.statutMois === "impaye").length,
};

export const PRESENCE = {
  presents: ELEVES.filter((e) => e.presentAujourdhui).length,
  total: ELEVES.length,
  absents: ELEVES.filter((e) => !e.presentAujourdhui),
};

export function repartitionModes(): { mode: ModePaiement; montant: number; nombre: number }[] {
  const modes: ModePaiement[] = ["Wave", "Orange Money", "Espèces"];
  return modes.map((mode) => {
    const liste = PAIEMENTS.filter((p) => p.mode === mode);
    return { mode, montant: liste.reduce((s, p) => s + p.montant, 0), nombre: liste.length };
  });
}

/** Élèves en retard, du plus gros reste à payer au plus petit */
export function relances(): Eleve[] {
  return ELEVES.filter((e) => e.statutMois !== "paye").sort((a, b) => resteAPayer(b) - resteAPayer(a));
}

/** Historique sur 12 mois (le dernier mois vient des données réelles ci-dessus) */
const TAUX = [0.93, 0.9, 0.95, 0.88, 0.84, 0.79, 0.9, 0.92, 0.86, 0.81, 0.89];
const CROISSANCE = [0.81, 0.83, 0.85, 0.85, 0.88, 0.9, 0.9, 0.92, 0.94, 0.96, 0.98];
const MOIS_HISTO = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

export const HISTORIQUE: MoisEncaissement[] = [
  ...MOIS_HISTO.map((mois, i) => {
    const attendu = Math.round((attenduMois * CROISSANCE[i]) / 500) * 500;
    return { mois, attendu, encaisse: Math.round((attendu * TAUX[i]) / 500) * 500 };
  }),
  { mois: ECOLE.moisEnCours, attendu: attenduMois, encaisse: encaisseMois },
];

export function statsClasse(classe: Classe) {
  const liste = ELEVES.filter((e) => e.classeId === classe.id);
  const hizbMoyen = liste.reduce((s, e) => s + e.hizbActuel, 0) / (liste.length || 1);
  const presence = Math.round(liste.reduce((s, e) => s + e.tauxPresence, 0) / (liste.length || 1));
  const enRetard = liste.filter((e) => e.statutMois !== "paye").length;
  return { effectif: liste.length, hizbMoyen, presence, enRetard };
}
