"use client";

/*
 * Bouton soleil / lune pour passer du thème clair au thème sombre.
 * Le choix est gardé dans le navigateur (localStorage).
 */

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Renvoie "dark" ou "light" selon le thème affiché en ce moment. */
function themeActuel(): string {
  const themeChoisi = document.documentElement.dataset.theme;
  if (themeChoisi === "light" || themeChoisi === "dark") {
    return themeChoisi;
  }

  // Aucun choix enregistré : on suit le réglage de l'ordinateur / du téléphone.
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeToggle() {
  // Au premier affichage (côté serveur) on ne connaît pas encore le thème.
  const [theme, setTheme] = useState("");

  useEffect(function () {
    setTheme(themeActuel());
  }, []);

  function basculer() {
    let nouveauTheme = "dark";
    if (themeActuel() === "dark") {
      nouveauTheme = "light";
    }

    document.documentElement.dataset.theme = nouveauTheme;
    try {
      localStorage.setItem("theme", nouveauTheme);
    } catch (erreur) {
      // Le navigateur refuse parfois d'enregistrer (navigation privée) : ce n'est pas grave.
    }
    setTheme(nouveauTheme);
  }

  let texteDuBouton = "Passer en thème sombre";
  let icone = "moon";
  if (theme === "dark") {
    texteDuBouton = "Passer en thème clair";
    icone = "sun";
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={texteDuBouton}
      className="grid size-10 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Icon name={icone} />
    </button>
  );
}

/** Petit script placé dans <head> pour appliquer le thème avant l'affichage (évite un "flash" blanc). */
export const SCRIPT_THEME =
  'try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}';
