"use client";

/*
 * Petits éléments réutilisés dans les onglets de la Gestion financière.
 */

import type { ReactNode } from "react";
import type { ModePaiement } from "@/lib/data";
import { MODES } from "@/lib/finances";
import { Icon } from "../Icon";
import type { OptionDeChoix } from "../ListeDeChoix";

/** Les choix "Wave / Orange Money / Espèces" pour une ListeDeChoix. */
export const OPTIONS_MODES: OptionDeChoix[] = [];
for (let i = 0; i < MODES.length; i++) {
  OPTIONS_MODES.push({ valeur: MODES[i], texte: MODES[i] });
}

/** Transforme le texte choisi dans la liste en ModePaiement. */
export function versMode(valeur: string): ModePaiement {
  if (valeur === "Orange Money") {
    return "Orange Money";
  }
  if (valeur === "Espèces") {
    return "Espèces";
  }
  return "Wave";
}

/* ---------- Bandeau vert de confirmation ---------- */

interface BandeauProps {
  message: string;
}

export function Bandeau(props: BandeauProps) {
  if (props.message === "") {
    return null;
  }
  return (
    <div role="status" className="flex items-center gap-3 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
      <Icon name="check" />
      <span className="flex-1">{props.message}</span>
    </div>
  );
}

/* ---------- Message d'erreur rouge dans un formulaire ---------- */

export function MessageErreur(props: BandeauProps) {
  if (props.message === "") {
    return null;
  }
  return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{props.message}</p>;
}

/* ---------- Carte avec un chiffre ---------- */

interface CarteChiffreProps {
  titre: string;
  valeur: string;
  detail?: ReactNode;
  couleur?: "vert" | "rouge" | "ocre"; // couleur du chiffre
}

export function CarteChiffre(props: CarteChiffreProps) {
  let couleur = "";
  if (props.couleur === "vert") {
    couleur = "text-primary";
  } else if (props.couleur === "rouge") {
    couleur = "text-danger";
  } else if (props.couleur === "ocre") {
    couleur = "text-ochre";
  }

  let detail = null;
  if (props.detail) {
    detail = <div className="mt-1 text-xs text-muted">{props.detail}</div>;
  }

  return (
    <div className="panel px-5 py-4">
      <p className="text-sm text-muted">{props.titre}</p>
      <p className={"mt-1 font-display text-2xl font-semibold tabular-nums " + couleur}>{props.valeur}</p>
      {detail}
    </div>
  );
}

/* ---------- Pastille d'état : "Payé", "Partiel", "À payer" ---------- */

interface PastilleProps {
  paye: number;
  total: number;
}

export function PastilleEtat(props: PastilleProps) {
  let texte = "À payer";
  let couleurs = "bg-danger-soft text-danger";
  if (props.total > 0 && props.paye >= props.total) {
    texte = "Payé";
    couleurs = "bg-primary-soft text-primary";
  } else if (props.paye > 0) {
    texte = "Partiel";
    couleurs = "bg-ochre-soft text-ochre";
  }
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap " + couleurs}>
      <span className="size-1.5 rounded-full bg-current" />
      {texte}
    </span>
  );
}

/* ---------- Petit bouton avec une icône seulement ---------- */

interface BoutonIconeProps {
  icone: string;
  label: string; // lu par les lecteurs d'écran
  onClick: () => void;
  danger?: boolean;
}

export function BoutonIcone(props: BoutonIconeProps) {
  let couleurs = "hover:bg-surface-2 hover:text-ink";
  if (props.danger) {
    couleurs = "hover:bg-danger-soft hover:text-danger";
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.label}
      title={props.label}
      className={"inline-grid size-9 place-items-center rounded-lg text-muted " + couleurs}
    >
      <Icon name={props.icone} size={16} />
    </button>
  );
}
