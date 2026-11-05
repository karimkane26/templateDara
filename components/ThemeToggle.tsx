"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Theme = "light" | "dark";

function themeActuel(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(themeActuel()), []);

  function basculer() {
    const suivant: Theme = themeActuel() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = suivant;
    try {
      localStorage.setItem("theme", suivant);
    } catch {}
    setTheme(suivant);
  }

  const sombre = theme === "dark";
  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={sombre ? "Passer en thème clair" : "Passer en thème sombre"}
      className="grid size-10 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Icon name={sombre ? "sun" : "moon"} />
    </button>
  );
}

/** Script injecté dans <head> pour appliquer le thème avant l'affichage (évite le flash). */
export const SCRIPT_THEME = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
