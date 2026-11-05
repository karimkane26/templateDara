"use client";

/*
 * Fenêtre modale, construite avec le composant Dialog de shadcn/ui (components/ui/dialog.tsx).
 *
 * Le Dialog s'occupe tout seul de :
 *  - fermer avec la touche Échap ou un clic sur le fond sombre ;
 *  - bloquer le défilement de la page derrière ;
 *  - garder le focus du clavier à l'intérieur de la fenêtre.
 */

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "./Icon";

interface ModalProps {
  ouvert: boolean;
  titre: string;
  onFermer: () => void;
  children: ReactNode;
  pied?: ReactNode;
}

export function Modal(props: ModalProps) {
  // Le Dialog nous prévient quand il veut s'ouvrir (true) ou se fermer (false).
  function quandLEtatChange(estOuvert: boolean) {
    if (!estOuvert) {
      props.onFermer();
    }
  }

  let pied = null;
  if (props.pied) {
    pied = <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{props.pied}</footer>;
  }

  return (
    <Dialog open={props.ouvert} onOpenChange={quandLEtatChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex max-h-[calc(100dvh-2rem)] max-w-md flex-col gap-0 rounded-[14px] bg-surface p-0 shadow-xl sm:max-w-md"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <DialogTitle className="font-display text-[17px] font-semibold">{props.titre}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer" className="text-muted hover:text-ink">
              <Icon name="close" />
            </Button>
          </DialogClose>
        </header>
        <div className="overflow-y-auto px-5 py-4">{props.children}</div>
        {pied}
      </DialogContent>
    </Dialog>
  );
}
