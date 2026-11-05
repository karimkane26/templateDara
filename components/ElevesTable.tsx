"use client";

import { useMemo, useState } from "react";
import { CLASSES, ELEVES, classeDe, resteAPayer, type StatutPaiement } from "@/lib/data";
import { fcfa, initiales } from "@/lib/format";
import { Icon } from "./Icon";
import { Avatar, StatutBadge } from "./ui";

const champ =
  "h-10 rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";

export function ElevesTable({ rechercheInitiale = "" }: { rechercheInitiale?: string }) {
  const [q, setQ] = useState(rechercheInitiale);
  const [classe, setClasse] = useState("toutes");
  const [statut, setStatut] = useState<"tous" | StatutPaiement>("tous");

  const liste = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ELEVES.filter((e) => {
      if (classe !== "toutes" && e.classeId !== classe) return false;
      if (statut !== "tous" && e.statutMois !== statut) return false;
      if (!t) return true;
      return [e.prenom, e.nom, e.parent, e.matricule, e.telephoneParent].join(" ").toLowerCase().includes(t);
    });
  }, [q, classe, statut]);

  return (
    <section className="panel min-w-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative min-w-[200px] flex-1">
          <label htmlFor="filtre-eleve" className="sr-only">Rechercher</label>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            id="filtre-eleve"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, parent, matricule ou téléphone"
            className={`${champ} w-full pl-10`}
          />
        </div>
        <label htmlFor="filtre-classe" className="sr-only">Classe</label>
        <select id="filtre-classe" value={classe} onChange={(e) => setClasse(e.target.value)} className={champ}>
          <option value="toutes">Toutes les classes</option>
          {CLASSES.map((c) => (
            <option key={c.id} value={c.id}>Classe {c.nom}</option>
          ))}
        </select>
        <label htmlFor="filtre-statut" className="sr-only">Mensualité</label>
        <select id="filtre-statut" value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)} className={champ}>
          <option value="tous">Toutes les mensualités</option>
          <option value="paye">Payé</option>
          <option value="partiel">Partiel</option>
          <option value="impaye">Impayé</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Élève</th>
              <th className="px-3 py-3 font-medium">Classe</th>
              <th className="px-3 py-3 font-medium">Progression</th>
              <th className="px-3 py-3 text-right font-medium">Présence</th>
              <th className="px-3 py-3 font-medium">Parent</th>
              <th className="px-5 py-3 text-right font-medium">Octobre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {liste.map((e) => {
              const c = classeDe(e);
              return (
                <tr key={e.id} className="hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar texte={initiales(e.prenom, e.nom)} sexe={e.sexe} />
                      <div className="min-w-0">
                        <p className="font-semibold">{e.prenom} {e.nom}</p>
                        <p className="text-xs text-muted tabular-nums">{e.matricule}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{c.nom}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {e.hizbActuel === 0 ? (
                      <span className="text-muted">Lecture</span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${(e.hizbActuel / 60) * 100}%` }} />
                        </span>
                        <span className="tabular-nums">Hizb {e.hizbActuel}</span>
                      </span>
                    )}
                  </td>
                  <td className={`px-3 py-3 text-right tabular-nums ${e.tauxPresence < 85 ? "font-semibold text-danger" : ""}`}>{e.tauxPresence} %</td>
                  <td className="px-3 py-3">
                    <p className="whitespace-nowrap">{e.parent}</p>
                    <p className="text-xs whitespace-nowrap text-muted tabular-nums">{e.telephoneParent}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatutBadge statut={e.statutMois} />
                    {e.statutMois !== "paye" && <p className="mt-1 text-xs text-muted tabular-nums">reste {fcfa(resteAPayer(e))}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {liste.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted">
            Aucun élève ne correspond à ces filtres. Essayez un autre nom ou choisissez « Toutes les classes ».
          </p>
        )}
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted">
        {liste.length} élève{liste.length > 1 ? "s" : ""} affiché{liste.length > 1 ? "s" : ""} sur {ELEVES.length}
      </p>
    </section>
  );
}
