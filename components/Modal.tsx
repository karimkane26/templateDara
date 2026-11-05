"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

/** Fenêtre modale simple : fond assombri, fermeture par Échap, clic extérieur ou bouton. */
export function Modal({
  ouvert,
  titre,
  onFermer,
  children,
  pied,
}: {
  ouvert: boolean;
  titre: string;
  onFermer: () => void;
  children: ReactNode;
  pied?: ReactNode;
}) {
  useEffect(() => {
    if (!ouvert) return;
    function clavier(e: KeyboardEvent) {
      if (e.key === "Escape") onFermer();
    }
    document.addEventListener("keydown", clavier);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", clavier);
      document.body.style.overflow = overflow;
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Fermer" onClick={onFermer} className="absolute inset-0 bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titre"
        className="panel relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col shadow-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="modal-titre" className="font-display text-[17px] font-semibold">
            {titre}
          </h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {pied && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{pied}</footer>}
      </div>
    </div>
  );
}
