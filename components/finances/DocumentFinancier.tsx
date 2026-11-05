"use client";

/*
 * Fenêtre qui montre un document à imprimer : reçu, facture ou fiche de paie.
 *
 * Le bouton "Imprimer" appelle window.print(). Dans app/globals.css, les règles
 * "@media print" cachent tout le reste de la page : seule la zone ".zone-impression"
 * sort sur le papier (ou dans le PDF si on choisit "Enregistrer en PDF").
 */

import { Button } from "@/components/ui/button";
import { CLASSES, ECOLE, type Eleve } from "@/lib/data";
import type { Facture, Recu } from "@/lib/finances";
import { dateLongue, fcfa } from "@/lib/format";
import { chiffresSeulement } from "@/lib/stockage";
import { Icon } from "../Icon";
import { Modal } from "../Modal";

export interface LigneDocument {
  libelle: string;
  montant: number;
}

export interface ContenuDocument {
  type: "Reçu" | "Facture" | "Fiche de paie";
  numero: string;
  date: string; // "2026-10-26"
  destinataire: string; // "Awa Diop, classe Ba (DAF-012)"
  sousDestinataire: string; // "Parent : Moussa Diop · 77 412 35 08"
  lignes: LigneDocument[];
  total: number;
  paye?: number; // pour une facture : déjà versé
  mode?: string; // "Wave", "Orange Money", "Espèces"
  mention: string; // phrase en bas du document
}

interface DocumentFinancierProps {
  document: ContenuDocument | null; // null = fenêtre fermée
  onFermer: () => void;
  lienWhatsApp?: string; // pour envoyer le document au parent
}

export function DocumentFinancier(props: DocumentFinancierProps) {
  const doc = props.document;

  function imprimer() {
    window.print();
  }

  if (doc === null) {
    return <Modal ouvert={false} titre="" onFermer={props.onFermer}>{null}</Modal>;
  }

  const lignes = [];
  for (let i = 0; i < doc.lignes.length; i++) {
    lignes.push(
      <tr key={i} className="border-b border-line">
        <td className="py-2 pr-3">{doc.lignes[i].libelle}</td>
        <td className="py-2 text-right tabular-nums">{fcfa(doc.lignes[i].montant)}</td>
      </tr>,
    );
  }

  // Pour une facture : déjà payé et reste à payer
  let lignesPaiement = null;
  if (doc.paye !== undefined) {
    let reste = doc.total - doc.paye;
    if (reste < 0) {
      reste = 0;
    }
    let couleurReste = "text-danger";
    if (reste === 0) {
      couleurReste = "text-primary";
    }
    lignesPaiement = (
      <>
        <tr>
          <td className="pt-2 pr-3 text-muted">Déjà payé</td>
          <td className="pt-2 text-right tabular-nums">{fcfa(doc.paye)}</td>
        </tr>
        <tr>
          <td className="pt-1 pr-3 font-semibold">Reste à payer</td>
          <td className={"pt-1 text-right font-semibold tabular-nums " + couleurReste}>{fcfa(reste)}</td>
        </tr>
      </>
    );
  }

  let ligneMode = null;
  if (doc.mode) {
    ligneMode = <p className="mt-3 text-sm">Payé par : <strong>{doc.mode}</strong></p>;
  }

  let boutonWhatsApp = null;
  if (props.lienWhatsApp) {
    boutonWhatsApp = (
      <a
        href={props.lienWhatsApp}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-sm font-semibold hover:bg-surface-2"
      >
        <Icon name="message" />
        WhatsApp
      </a>
    );
  }

  return (
    <Modal
      ouvert={true}
      titre={doc.type + " " + doc.numero}
      onFermer={props.onFermer}
      pied={
        <>
          {boutonWhatsApp}
          <Button type="button" size="lg" onClick={imprimer}>
            <Icon name="printer" />
            Imprimer / PDF
          </Button>
        </>
      }
    >
      <div className="zone-impression text-sm">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-3">
          <div>
            <p className="font-display text-lg font-semibold">{ECOLE.nom}</p>
            <p className="text-xs text-muted">{ECOLE.ville}</p>
            <p className="text-xs text-muted">Année {ECOLE.annee}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-base font-semibold uppercase">{doc.type}</p>
            <p className="text-xs tabular-nums">N° {doc.numero}</p>
            <p className="text-xs text-muted">{dateLongue(doc.date)}</p>
          </div>
        </header>

        <div className="py-3">
          <p className="font-semibold">{doc.destinataire}</p>
          <p className="text-xs text-muted">{doc.sousDestinataire}</p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-1.5 font-medium">Désignation</th>
              <th className="py-1.5 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {lignes}
            <tr>
              <td className="pt-3 pr-3 font-semibold">Total</td>
              <td className="pt-3 text-right font-display text-base font-semibold tabular-nums">{fcfa(doc.total)}</td>
            </tr>
            {lignesPaiement}
          </tbody>
        </table>

        {ligneMode}
        <p className="mt-4 border-t border-dashed border-line pt-3 text-xs text-muted">{doc.mention}</p>
        <p className="mt-6 text-right text-xs text-muted">Cachet et signature de l&apos;administration</p>
      </div>
    </Modal>
  );
}

/* ============================================================
 * Fabriquer le contenu d'un reçu ou d'une facture
 * ============================================================ */

/** "Awa Diop, classe Ba (DAF-012)" */
function nomCompletEleve(eleve: Eleve): string {
  let classe = "";
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === eleve.classeId) {
      classe = CLASSES[i].nom;
    }
  }
  return eleve.prenom + " " + eleve.nom + ", classe " + classe + " (" + eleve.matricule + ")";
}

export function documentDepuisRecu(recu: Recu, eleve: Eleve | undefined): ContenuDocument {
  let destinataire = "Élève retiré de la liste";
  let sousDestinataire = "";
  if (eleve !== undefined) {
    destinataire = nomCompletEleve(eleve);
    sousDestinataire = "Parent : " + eleve.parent + " · " + eleve.telephoneParent;
  }
  return {
    type: "Reçu",
    numero: recu.numero,
    date: recu.date,
    destinataire: destinataire,
    sousDestinataire: sousDestinataire,
    lignes: [{ libelle: recu.objet, montant: recu.montant }],
    total: recu.montant,
    mode: recu.mode,
    mention: "Nous confirmons avoir reçu cette somme. Merci pour votre confiance. Barakallahou fikoum.",
  };
}

export function documentDepuisFacture(facture: Facture): ContenuDocument {
  return {
    type: "Facture",
    numero: facture.numero,
    date: facture.mois + "-01",
    destinataire: nomCompletEleve(facture.eleve),
    sousDestinataire: "Parent : " + facture.eleve.parent + " · " + facture.eleve.telephoneParent,
    lignes: facture.lignes,
    total: facture.total,
    paye: facture.paye,
    mention: "Paiement possible par Wave, Orange Money ou en espèces à l'école. Merci de régler avant le 10 du mois.",
  };
}

/** Lien WhatsApp vers le parent, avec un message déjà écrit. */
export function lienWhatsAppParent(eleve: Eleve | undefined, message: string): string | undefined {
  if (eleve === undefined) {
    return undefined;
  }
  return "https://wa.me/221" + chiffresSeulement(eleve.telephoneParent) + "?text=" + encodeURIComponent(message);
}
