/*
 * Petits éléments d'interface réutilisés partout : badges, avatars, panneaux, titres.
 */

import type { ReactNode } from "react";
import type { ModePaiement, StatutPaiement } from "@/lib/data";

/* ---------- Badge "Payé / Partiel / Impayé" ---------- */

interface StatutBadgeProps {
  statut: StatutPaiement;
}

export function StatutBadge(props: StatutBadgeProps) {
  let texte = "";
  let couleurs = "";

  if (props.statut === "paye") {
    texte = "Payé";
    couleurs = "bg-primary-soft text-primary";
  } else if (props.statut === "partiel") {
    texte = "Partiel";
    couleurs = "bg-ochre-soft text-ochre";
  } else {
    texte = "Impayé";
    couleurs = "bg-danger-soft text-danger";
  }

  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold " + couleurs}>
      <span className="size-1.5 rounded-full bg-current" />
      {texte}
    </span>
  );
}

/* ---------- Nom du mode de paiement, en couleur ---------- */

interface ModeLabelProps {
  mode: ModePaiement;
}

export function ModeLabel(props: ModeLabelProps) {
  let couleur = "text-muted";
  if (props.mode === "Wave") {
    couleur = "text-wave";
  } else if (props.mode === "Orange Money") {
    couleur = "text-orange-money";
  }

  return <span className={"text-sm font-medium " + couleur}>{props.mode}</span>;
}

/* ---------- Rond avec les initiales ---------- */

interface AvatarProps {
  texte: string;
  sexe: "M" | "F";
}

export function Avatar(props: AvatarProps) {
  let couleurs = "bg-primary-soft text-primary";
  if (props.sexe === "F") {
    couleurs = "bg-ochre-soft text-ochre";
  }

  return (
    <span className={"grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold " + couleurs}>
      {props.texte}
    </span>
  );
}

/* ---------- Panneau (carte blanche avec un titre) ---------- */

interface PanelProps {
  titre?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel(props: PanelProps) {
  let classesEnPlus = "";
  if (props.className) {
    classesEnPlus = props.className;
  }

  // L'en-tête n'est affiché que si on a donné un titre
  let entete = null;
  if (props.titre) {
    entete = (
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="font-display text-[15px] font-semibold">{props.titre}</h2>
        {props.action}
      </header>
    );
  }

  return (
    <section className={"panel flex min-w-0 flex-col " + classesEnPlus}>
      {entete}
      {props.children}
    </section>
  );
}

/* ---------- Titre de page ---------- */

interface PageHeaderProps {
  titre: string;
  sousTitre?: string;
  action?: ReactNode;
}

export function PageHeader(props: PageHeaderProps) {
  let sousTitre = null;
  if (props.sousTitre) {
    sousTitre = <p className="mt-1 text-sm text-muted">{props.sousTitre}</p>;
  }

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">{props.titre}</h1>
        {sousTitre}
      </div>
      {props.action}
    </div>
  );
}
