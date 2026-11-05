"use client";

/*
 * Emploi du temps de la semaine (cours en ligne sur Google Meet)
 * et carte "Prochain cours". Utilisés par l'administrateur, les enseignants et les parents.
 */

import { useEffect, useState } from "react";
import { CLASSES, type Cours, type Enseignant, type Enseignement } from "@/lib/data";
import { JOURS, NOMS_DES_JOURS, attenteLisible, comparerCours, estEnCours, heureLisible, minutesAvantLeCours, prochainCours } from "@/lib/horaires";
import { trouverEnseignant, trouverEnseignement } from "@/lib/stockage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "./Icon";

/* ---------- Petites fonctions ---------- */

/** "alif" -> "Classe Alif" ; "toutes" -> "Toutes les classes" */
export function nomDesEleves(classeId: string): string {
  if (classeId === "toutes") {
    return "Toutes les classes";
  }
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return "Classe " + CLASSES[i].nom;
    }
  }
  return "Classe inconnue";
}

/** "Oustaz Mamadou Ndiaye", ou "Non attribué" si l'enseignant a été supprimé. */
export function nomEnseignant(enseignants: Enseignant[], id: string): string {
  const enseignant = trouverEnseignant(enseignants, id);
  if (enseignant === undefined) {
    return "Non attribué";
  }
  return enseignant.civilite + " " + enseignant.prenom + " " + enseignant.nom;
}

/**
 * Renvoie l'heure actuelle, mise à jour toutes les minutes.
 * Vaut null au tout premier affichage (on ne connaît l'heure qu'une fois dans le navigateur).
 */
function useMaintenant(): Date | null {
  const [maintenant, setMaintenant] = useState<Date | null>(null);

  useEffect(function () {
    setMaintenant(new Date());
    const minuteur = setInterval(function () {
      setMaintenant(new Date());
    }, 60 * 1000);
    return function () {
      clearInterval(minuteur);
    };
  }, []);

  return maintenant;
}

/** Bouton vert "Rejoindre sur Google Meet" (s'ouvre dans un nouvel onglet). */
function BoutonMeet(props: { lien: string; enDirect: boolean }) {
  let style = "border border-line hover:bg-surface-2";
  if (props.enDirect) {
    style = "bg-primary text-primary-ink hover:opacity-90";
  }
  return (
    <a
      href={props.lien}
      target="_blank"
      rel="noreferrer"
      className={"inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold " + style}
    >
      <Icon name="video" size={16} />
      Rejoindre sur Google Meet
    </a>
  );
}

/* ============================================================
 * Carte "Prochain cours"
 * ============================================================ */

interface ProchainCoursProps {
  cours: Cours[];
  enseignants: Enseignant[];
}

export function ProchainCours(props: ProchainCoursProps) {
  const maintenant = useMaintenant();

  if (props.cours.length === 0) {
    return (
      <section className="panel p-5">
        <p className="text-sm text-muted">Aucun cours en ligne n&apos;est prévu pour le moment.</p>
      </section>
    );
  }

  if (maintenant === null) {
    return <section className="panel h-[132px]" />;
  }

  const cours = prochainCours(props.cours, maintenant);
  if (cours === null) {
    return null;
  }

  const attente = minutesAvantLeCours(cours, maintenant);
  const enDirect = attente === 0;

  let etiquette = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold">
      <Icon name="clock" size={14} />
      Prochain cours, {attenteLisible(attente)}
    </span>
  );
  if (enDirect) {
    etiquette = (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
        <span className="size-2 animate-pulse rounded-full bg-danger" />
        En direct maintenant
      </span>
    );
  }

  return (
    <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        {etiquette}
        <h2 className="mt-2 font-display text-xl font-semibold">{cours.titre}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {NOMS_DES_JOURS[cours.jour]} de {heureLisible(cours.heureDebut)} à {heureLisible(cours.heureFin)} · {nomDesEleves(cours.classeId)} ·{" "}
          {nomEnseignant(props.enseignants, cours.enseignantId)}
        </p>
      </div>
      <BoutonMeet lien={cours.lienMeet} enDirect={enDirect} />
    </section>
  );
}


/* ============================================================
 * Emploi du temps de la semaine
 * ============================================================ */

interface EmploiDuTempsProps {
  cours: Cours[];
  enseignants: Enseignant[];
  enseignements?: Enseignement[]; // pour afficher la matière de chaque cours
  onModifier?: (cours: Cours) => void; // seulement pour l'administrateur
  onSupprimer?: (coursId: string) => void; // seulement pour l'administrateur
  /**
   * Ids des cours qui concernent la personne connectée.
   * Si on le donne, un bouton permet de choisir entre "Mes cours" et "Tous les cours".
   * Tous les cours restent visibles par tout le monde.
   */
  mesCoursIds?: string[];
  libelleMesCours?: string; // ex. "Mes cours" ou "Cours de mes enfants"
}

export function EmploiDuTemps(props: EmploiDuTempsProps) {
  const maintenant = useMaintenant();
  // "tous" = tous les cours de l'école ; "miens" = seulement ceux qui me concernent
  const [filtre, setFiltre] = useState("tous");

  let enseignements: Enseignement[] = [];
  if (props.enseignements) {
    enseignements = props.enseignements;
  }

  // On garde les cours à afficher, puis on les trie : lundi d'abord, puis par heure
  const coursTries: Cours[] = [];
  for (let i = 0; i < props.cours.length; i++) {
    const c = props.cours[i];
    if (filtre === "miens" && props.mesCoursIds && !props.mesCoursIds.includes(c.id)) {
      continue;
    }
    coursTries.push(c);
  }
  coursTries.sort(comparerCours);

  // Un bloc par jour qui a au moins un cours
  const blocsJours = [];
  for (let j = 0; j < JOURS.length; j++) {
    const jour = JOURS[j];

    const lignes = [];
    for (let i = 0; i < coursTries.length; i++) {
      const cours = coursTries[i];
      if (cours.jour !== jour) {
        continue;
      }

      let enDirect = false;
      if (maintenant !== null) {
        enDirect = estEnCours(cours, maintenant);
      }

      let badgeDirect = null;
      if (enDirect) {
        badgeDirect = <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">En direct</span>;
      }

      // Petite étiquette "Pour moi" sur les cours qui me concernent
      let badgeMoi = null;
      if (props.mesCoursIds && props.mesCoursIds.includes(cours.id)) {
        badgeMoi = <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">Pour moi</span>;
      }

      // Nom de la matière, s'il y en a une
      let texteMatiere = "";
      const matiere = trouverEnseignement(enseignements, cours.enseignementId);
      if (matiere !== undefined) {
        texteMatiere = matiere.nom + " · ";
      }

      let boutonModifier = null;
      if (props.onModifier) {
        const modifier = props.onModifier;
        const coursAModifier = cours;
        boutonModifier = (
          <button
            type="button"
            onClick={function () {
              modifier(coursAModifier);
            }}
            aria-label={"Modifier le cours " + cours.titre}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="edit" size={16} />
          </button>
        );
      }

      let boutonSupprimer = null;
      if (props.onSupprimer) {
        const supprimer = props.onSupprimer;
        const id = cours.id;
        boutonSupprimer = (
          <button
            type="button"
            onClick={function () {
              supprimer(id);
            }}
            aria-label={"Supprimer le cours " + cours.titre}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="trash" size={16} />
          </button>
        );
      }

      lignes.push(
        <li key={cours.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
          <p className="w-28 shrink-0 text-sm font-semibold tabular-nums">
            {heureLisible(cours.heureDebut)} – {heureLisible(cours.heureFin)}
          </p>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {cours.titre}
              {badgeDirect}
              {badgeMoi}
            </p>
            <p className="text-xs text-muted">
              {texteMatiere}
              {nomDesEleves(cours.classeId)} · {nomEnseignant(props.enseignants, cours.enseignantId)}
            </p>
          </div>
          <BoutonMeet lien={cours.lienMeet} enDirect={enDirect} />
          {boutonModifier}
          {boutonSupprimer}
        </li>,
      );
    }

    if (lignes.length === 0) {
      continue; // pas de cours ce jour-là
    }

    blocsJours.push(
      <div key={jour}>
        <h3 className="border-b border-line bg-surface-2/50 px-5 py-2 text-xs font-semibold tracking-wide text-muted uppercase">{NOMS_DES_JOURS[jour]}</h3>
        <ul className="divide-y divide-line">{lignes}</ul>
      </div>,
    );
  }

  let contenu = <div>{blocsJours}</div>;
  if (blocsJours.length === 0) {
    contenu = <p className="px-5 py-10 text-center text-sm text-muted">Aucun cours dans l&apos;emploi du temps.</p>;
  }

  // Les deux boutons "Tous les cours" / "Mes cours" (seulement si on a donné mesCoursIds)
  let choixFiltre = null;
  if (props.mesCoursIds) {
    let libelleMiens = "Mes cours";
    if (props.libelleMesCours) {
      libelleMiens = props.libelleMesCours;
    }

    // Onglets shadcn/ui : Radix gère le clavier (flèches) et l'accessibilité tout seul
    choixFiltre = (
      <Tabs value={filtre} onValueChange={setFiltre}>
        <TabsList aria-label="Cours affichés">
          <TabsTrigger value="tous" className="px-3 text-xs font-semibold">
            Tous les cours ({props.cours.length})
          </TabsTrigger>
          <TabsTrigger value="miens" className="px-3 text-xs font-semibold">
            {libelleMiens} ({props.mesCoursIds.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );
  }

  return (
    <section className="panel min-w-0 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="font-display text-[15px] font-semibold">Emploi du temps de la semaine</h2>
        {choixFiltre}
      </header>
      <div className="border-t border-line">{contenu}</div>
    </section>
  );
}
