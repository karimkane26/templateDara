import type { Metadata } from "next";
import { PageHeader } from "@/components/elements";
import { CLASSES, statsClasse } from "@/lib/data";
import { fcfa } from "@/lib/format";

export const metadata: Metadata = { title: "Classes" };

export default function ClassesPage() {
  // Une fiche par classe
  const fiches = [];

  for (let i = 0; i < CLASSES.length; i++) {
    const classe = CLASSES[i];
    const stats = statsClasse(classe);

    // Le nombre d'élèves en retard est en rouge s'il y en a au moins un
    let styleRetard = "";
    if (stats.enRetard > 0) {
      styleRetard = "text-danger";
    }

    fiches.push(
      <article key={classe.id} className="panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Classe {classe.nom}</h2>
            <p className="text-sm text-muted">{classe.niveau}</p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold tabular-nums">{stats.effectif} élèves</span>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Mensualité</dt>
            <dd className="font-semibold tabular-nums">{fcfa(classe.mensualite)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Présence</dt>
            <dd className="font-semibold tabular-nums">{stats.presence} %</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">En retard</dt>
            <dd className={"font-semibold tabular-nums " + styleRetard}>{stats.enRetard}</dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-line pt-4 text-sm">
          <span className="text-muted">Enseignant : </span>
          <span className="font-medium">{classe.enseignant}</span>
        </p>
      </article>,
    );
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Classes" sousTitre="Chaque classe regroupe les élèves par niveau de mémorisation." />
      <div className="grid gap-5 sm:grid-cols-2">{fiches}</div>
    </div>
  );
}
