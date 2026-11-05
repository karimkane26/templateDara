import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { CLASSES, statsClasse } from "@/lib/data";
import { fcfa } from "@/lib/format";

export const metadata: Metadata = { title: "Classes" };

export default function ClassesPage() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Classes" sousTitre="Chaque classe regroupe les élèves par niveau de mémorisation." />
      <div className="grid gap-5 sm:grid-cols-2">
        {CLASSES.map((c) => {
          const s = statsClasse(c);
          return (
            <article key={c.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold">Classe {c.nom}</h2>
                  <p className="text-sm text-muted">{c.niveau}</p>
                </div>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold tabular-nums">{s.effectif} élèves</span>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Mensualité</dt>
                  <dd className="font-semibold tabular-nums">{fcfa(c.mensualite)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Présence</dt>
                  <dd className="font-semibold tabular-nums">{s.presence} %</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">En retard</dt>
                  <dd className={`font-semibold tabular-nums ${s.enRetard > 0 ? "text-danger" : ""}`}>{s.enRetard}</dd>
                </div>
              </dl>
              <p className="mt-5 border-t border-line pt-4 text-sm">
                <span className="text-muted">Enseignant : </span>
                <span className="font-medium">{c.enseignant}</span>
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
