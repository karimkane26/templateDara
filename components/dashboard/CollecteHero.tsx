/*
 * Le grand bloc en haut du tableau de bord : la collecte des mensualités du mois,
 * avec une petite case de couleur par élève.
 */

import Link from "next/link";
import { CLASSES, COLLECTE, ECOLE, ELEVES, resteAPayer, type Eleve } from "@/lib/data";
import { fcfa, moisLong, nombre, pourcent } from "@/lib/format";

/** Couleur de la case d'un élève selon son statut. */
function styleDeLaCase(eleve: Eleve): string {
  if (eleve.statutMois === "paye") {
    return "bg-primary";
  }
  if (eleve.statutMois === "partiel") {
    return "bg-ochre";
  }
  return "border-2 border-dashed border-danger/70 bg-danger-soft";
}

/** Situation de l'élève : "à jour" ou "reste 2 500 FCFA". */
function situationDeLEleve(eleve: Eleve): string {
  if (eleve.statutMois === "paye") {
    return "à jour";
  }
  return "reste " + fcfa(resteAPayer(eleve));
}

export function CollecteHero() {
  const taux = pourcent(COLLECTE.encaisse, COLLECTE.attendu);

  // Un groupe de cases par classe
  const groupes = [];
  for (let c = 0; c < CLASSES.length; c++) {
    const classe = CLASSES[c];

    const cases = [];
    for (let i = 0; i < ELEVES.length; i++) {
      const eleve = ELEVES[i];
      if (eleve.classeId !== classe.id) {
        continue; // cet élève n'est pas dans cette classe
      }

      const nomComplet = eleve.prenom + " " + eleve.nom;
      const situation = situationDeLEleve(eleve);
      cases.push(
        <li key={eleve.id}>
          {/* Info-bulle au survol de la souris */}
          <span title={nomComplet + " : " + situation} className={"block size-5 rounded-[5px] " + styleDeLaCase(eleve)} />
          {/* Texte lu par les lecteurs d'écran (invisible à l'écran) */}
          <span className="sr-only">{nomComplet + ", " + situation}</span>
        </li>,
      );
    }

    groupes.push(
      <div key={classe.id} className="min-w-0">
        <p className="mb-2 flex items-baseline justify-between gap-2 text-xs">
          <span className="font-semibold">Classe {classe.nom}</span>
          <span className="text-muted">{fcfa(classe.mensualite)} / mois</span>
        </p>
        <ul className="flex flex-wrap gap-1.5">{cases}</ul>
      </div>,
    );
  }

  return (
    <section className="panel overflow-hidden lg:col-span-2" aria-labelledby="collecte-titre">
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <h2 id="collecte-titre" className="text-sm font-medium text-muted">
            Mensualités de {moisLong(ECOLE.moisEnCours)}
          </h2>
          <p className="mt-2 font-display text-[40px] leading-none font-semibold tracking-tight tabular-nums sm:text-5xl">
            {nombre(COLLECTE.encaisse)}
            <span className="ml-2 text-lg font-medium text-muted sm:text-xl">/ {fcfa(COLLECTE.attendu)}</span>
          </p>
          <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2" role="img" aria-label={taux + " % collecté"}>
            <div className="h-full rounded-full bg-primary" style={{ width: taux + "%" }} />
          </div>
          <p className="mt-2 text-sm text-muted">
            <span className="font-semibold text-ink">{taux} % collecté</span>, il reste {fcfa(COLLECTE.reste)} à recevoir.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center md:w-[300px]">
          <div className="rounded-xl px-2 py-3 bg-primary-soft text-primary">
            <dt className="text-xs font-medium">Payé</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{COLLECTE.payes}</dd>
          </div>
          <div className="rounded-xl px-2 py-3 bg-ochre-soft text-ochre">
            <dt className="text-xs font-medium">Partiel</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{COLLECTE.partiels}</dd>
          </div>
          <div className="rounded-xl px-2 py-3 bg-danger-soft text-danger">
            <dt className="text-xs font-medium">Impayé</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{COLLECTE.impayes}</dd>
          </div>
        </dl>
      </div>

      {/* Une case par élève, regroupées par classe */}
      <div className="border-t border-line bg-surface-2/50 px-5 py-5 sm:px-6">
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{groupes}</div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] bg-primary" />À jour
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] bg-ochre" />Paiement partiel
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] border-2 border-dashed border-danger/70 bg-danger-soft" />Rien reçu
            </span>
          </p>
          <Link href="/paiements" className="font-semibold text-primary hover:underline">
            Voir le détail des paiements
          </Link>
        </div>
      </div>
    </section>
  );
}
