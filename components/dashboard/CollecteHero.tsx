import Link from "next/link";
import { CLASSES, COLLECTE, ECOLE, ELEVES, classeDe, resteAPayer } from "@/lib/data";
import { fcfa, moisLong, nombre, pourcent } from "@/lib/format";

const CASE: Record<string, string> = {
  paye: "bg-primary",
  partiel: "bg-ochre",
  impaye: "border-2 border-dashed border-danger/70 bg-danger-soft",
};

/** Élément fort du tableau de bord : la collecte du mois, élève par élève. */
export function CollecteHero() {
  const taux = pourcent(COLLECTE.encaisse, COLLECTE.attendu);

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
          <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${taux} % collecté`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${taux}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">
            <span className="font-semibold text-ink">{taux} % collecté</span>, il reste {fcfa(COLLECTE.reste)} à recevoir.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center md:w-[300px]">
          {[
            { label: "Payé", valeur: COLLECTE.payes, cls: "bg-primary-soft text-primary" },
            { label: "Partiel", valeur: COLLECTE.partiels, cls: "bg-ochre-soft text-ochre" },
            { label: "Impayé", valeur: COLLECTE.impayes, cls: "bg-danger-soft text-danger" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl px-2 py-3 ${s.cls}`}>
              <dt className="text-xs font-medium">{s.label}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{s.valeur}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Une case par élève, regroupées par classe */}
      <div className="border-t border-line bg-surface-2/50 px-5 py-5 sm:px-6">
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {CLASSES.map((classe) => {
            const liste = ELEVES.filter((e) => e.classeId === classe.id);
            return (
              <div key={classe.id} className="min-w-0">
                <p className="mb-2 flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-semibold">Classe {classe.nom}</span>
                  <span className="text-muted">{fcfa(classe.mensualite)} / mois</span>
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {liste.map((e) => (
                    <li key={e.id}>
                      <span
                        title={`${e.prenom} ${e.nom}${e.statutMois === "paye" ? " : à jour" : ` : reste ${fcfa(resteAPayer(e))}`}`}
                        className={`block size-5 rounded-[5px] ${CASE[e.statutMois]}`}
                      />
                      <span className="sr-only">
                        {e.prenom} {e.nom}, {e.statutMois === "paye" ? "à jour" : `reste ${fcfa(classeDe(e).mensualite - e.payeMois)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-primary" />À jour</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-ochre" />Paiement partiel</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] border-2 border-dashed border-danger/70 bg-danger-soft" />Rien reçu</span>
          </p>
          <Link href="/paiements" className="font-semibold text-primary hover:underline">
            Voir le détail des paiements
          </Link>
        </div>
      </div>
    </section>
  );
}
