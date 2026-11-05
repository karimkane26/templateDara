"use client";

/*
 * Liste déroulante construite avec le composant Select de shadcn/ui (components/ui/select.tsx).
 *
 * Utilisation :
 *   <ListeDeChoix id="cours-jour" value={jour} onChange={setJour} options={[{ valeur: "1", texte: "Lundi" }]} />
 *
 * "onChange" reçoit directement la valeur choisie (pas un événement).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface OptionDeChoix {
  valeur: string;
  texte: string;
}

interface ListeDeChoixProps {
  id: string;
  value: string;
  onChange: (valeur: string) => void;
  options: OptionDeChoix[];
  className?: string;
  label?: string; // texte lu par les lecteurs d'écran, s'il n'y a pas de <Label> visible
}

// Le Select de shadcn refuse la valeur "" : on la remplace par ce mot en interne.
const VALEUR_VIDE = "__aucune__";

function versSelect(valeur: string): string {
  if (valeur === "") {
    return VALEUR_VIDE;
  }
  return valeur;
}

function depuisSelect(valeur: string): string {
  if (valeur === VALEUR_VIDE) {
    return "";
  }
  return valeur;
}

export function ListeDeChoix(props: ListeDeChoixProps) {
  let largeur = "w-full";
  if (props.className) {
    largeur = props.className;
  }

  function quandOnChoisit(valeur: string) {
    props.onChange(depuisSelect(valeur));
  }

  const elements = [];
  for (let i = 0; i < props.options.length; i++) {
    const option = props.options[i];
    elements.push(
      <SelectItem key={option.valeur} value={versSelect(option.valeur)}>
        {option.texte}
      </SelectItem>,
    );
  }

  return (
    <Select value={versSelect(props.value)} onValueChange={quandOnChoisit}>
      <SelectTrigger id={props.id} aria-label={props.label} className={"h-10! bg-surface " + largeur}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{elements}</SelectContent>
    </Select>
  );
}
