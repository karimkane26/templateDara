"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CLASSES,
  ECOLE,
  ELEVES,
  PAIEMENTS,
  type ModePaiement,
  type Paiement,
  type StatutPaiement,
} from "@/lib/data";
import { dateCourte, fcfa, initiales, moisLong, pourcent } from "@/lib/format";
import { Icon } from "./Icon";
import { Avatar, ModeLabel, StatutBadge } from "./ui";

const champ = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";
const MODES: ModePaiement[] = ["Wave", "Orange Money", "Espèces"];
const mensualite = (classeId: string) => CLASSES.find((c) => c.id === classeId)!.mensualite;

type Onglet = "journal" | "retard";

export function PaiementsView({ formulaireOuvert = false, ongletInitial = "journal" }: { formulaireOuvert?: boolean; ongletInitial?: Onglet }) {
  // État local de démonstration : à remplacer par un appel API (server action, route handler…)
  const [paiements, setPaiements] = useState<Paiement[]>(PAIEMENTS);
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial);
  const [mode, setMode] = useState<"tous" | ModePaiement>("tous");
  const [formulaire, setFormulaire] = useState(formulaireOuvert);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const payeParEleve = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of paiements) if (p.mois === ECOLE.moisEnCours) m.set(p.eleveId, (m.get(p.eleveId) ?? 0) + p.montant);
    return m;
  }, [paiements]);

  const statutDe = (eleveId: string, classeId: string): StatutPaiement => {
    const paye = payeParEleve.get(eleveId) ?? 0;
    return paye >= mensualite(classeId) ? "paye" : paye > 0 ? "partiel" : "impaye";
  };

  const attendu = ELEVES.reduce((s, e) => s + mensualite(e.classeId), 0);
  const encaisse = [...payeParEleve.values()].reduce((s, v) => s + v, 0);
  const enRetard = ELEVES.filter((e) => statutDe(e.id, e.classeId) !== "paye").sort(
    (a, b) => mensualite(b.classeId) - (payeParEleve.get(b.id) ?? 0) - (mensualite(a.classeId) - (payeParEleve.get(a.id) ?? 0)),
  );
  const journal = paiements.filter((p) => mode === "tous" || p.mode === mode);

  /* ---------- Formulaire ---------- */
  const [eleveId, setEleveId] = useState(enRetard[0]?.id ?? ELEVES[0].id);
  const eleveChoisi = ELEVES.find((e) => e.id === eleveId)!;
  const resteChoisi = Math.max(0, mensualite(eleveChoisi.classeId) - (payeParEleve.get(eleveId) ?? 0));
  const [montant, setMontant] = useState(String(resteChoisi));
  const [modeNouveau, setModeNouveau] = useState<ModePaiement>("Wave");
  const [erreur, setErreur] = useState<string | null>(null);

  function choisirEleve(id: string) {
    setEleveId(id);
    const e = ELEVES.find((x) => x.id === id)!;
    setMontant(String(Math.max(0, mensualite(e.classeId) - (payeParEleve.get(id) ?? 0))));
    setErreur(null);
  }

  function enregistrer(ev: FormEvent) {
    ev.preventDefault();
    const valeur = Number(montant.replace(/\s/g, ""));
    if (!Number.isFinite(valeur) || valeur <= 0) {
      setErreur("Indiquez un montant supérieur à 0 FCFA.");
      return;
    }
    setPaiements((liste) => [
      { id: `n${Date.now()}`, eleveId, mois: ECOLE.moisEnCours, date: ECOLE.aujourdhui, montant: valeur, mode: modeNouveau },
      ...liste,
    ]);
    setConfirmation(`Paiement enregistré : ${fcfa(valeur)} pour ${eleveChoisi.prenom} ${eleveChoisi.nom}.`);
    setFormulaire(false);
    setOnglet("journal");
    setErreur(null);
  }

  const eleveDe = (id: string) => ELEVES.find((e) => e.id === id)!;
  const classeNom = (classeId: string) => CLASSES.find((c) => c.id === classeId)!.nom;

  return (
    <div className="flex flex-col gap-5">
      {/* Résumé */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Encaissé", valeur: fcfa(encaisse), detail: `${pourcent(encaisse, attendu)} % de l'attendu` },
          { label: "Reste à recevoir", valeur: fcfa(attendu - encaisse), detail: `${enRetard.length} élèves concernés` },
          { label: "Attendu ce mois", valeur: fcfa(attendu), detail: `${ELEVES.length} élèves inscrits` },
        ].map((s) => (
          <div key={s.label} className="panel px-5 py-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{s.valeur}</p>
            <p className="mt-0.5 text-xs text-muted">{s.detail}</p>
          </div>
        ))}
      </div>

      {confirmation && (
        <div role="status" className="flex items-center gap-3 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
          <Icon name="check" />
          <span className="flex-1">{confirmation}</span>
          <button type="button" onClick={() => setConfirmation(null)} aria-label="Masquer le message" className="grid size-7 place-items-center rounded-md hover:bg-surface/50">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Formulaire d'enregistrement */}
      {formulaire ? (
        <form onSubmit={enregistrer} className="panel p-5" aria-labelledby="form-titre">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="form-titre" className="font-display text-[15px] font-semibold">Enregistrer un paiement</h2>
            <button type="button" onClick={() => setFormulaire(false)} className="text-sm font-medium text-muted hover:text-ink">
              Annuler
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="pay-eleve" className="mb-1.5 block text-xs font-medium text-muted">Élève</label>
              <select id="pay-eleve" value={eleveId} onChange={(e) => choisirEleve(e.target.value)} className={champ}>
                {[...ELEVES]
                  .sort((a, b) => a.prenom.localeCompare(b.prenom, "fr"))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.prenom} {e.nom} (classe {classeNom(e.classeId)})
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-xs text-muted">
                {resteChoisi > 0 ? `Reste ${fcfa(resteChoisi)} pour ${moisLong(ECOLE.moisEnCours)}` : "Mensualité déjà réglée ce mois-ci"}
              </p>
            </div>
            <div>
              <label htmlFor="pay-montant" className="mb-1.5 block text-xs font-medium text-muted">Montant (FCFA)</label>
              <input
                id="pay-montant"
                inputMode="numeric"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                aria-invalid={erreur ? true : undefined}
                aria-describedby={erreur ? "pay-erreur" : undefined}
                className={`${champ} tabular-nums ${erreur ? "border-danger" : ""}`}
              />
              {erreur && <p id="pay-erreur" className="mt-1.5 text-xs text-danger">{erreur}</p>}
            </div>
            <fieldset>
              <legend className="mb-1.5 block text-xs font-medium text-muted">Mode</legend>
              <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
                {MODES.map((m) => (
                  <label key={m} className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-xs font-semibold ${modeNouveau === m ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
                    <input type="radio" name="mode" value={m} checked={modeNouveau === m} onChange={() => setModeNouveau(m)} className="sr-only" />
                    {m === "Orange Money" ? "OM" : m}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink hover:opacity-90">
              <Icon name="check" />
              Enregistrer le paiement
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setFormulaire(true);
            setConfirmation(null);
          }}
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-dashed border-primary/60 px-4 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          <Icon name="plus" />
          Enregistrer un paiement
        </button>
      )}

      {/* Onglets */}
      <section className="panel min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div role="tablist" aria-label="Vue" className="flex gap-1 rounded-lg bg-surface-2 p-1">
            {(
              [
                ["journal", `Journal (${paiements.length})`],
                ["retard", `En retard (${enRetard.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={onglet === id}
                onClick={() => setOnglet(id)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${onglet === id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {onglet === "journal" && (
            <>
              <label htmlFor="filtre-mode" className="sr-only">Mode de paiement</label>
              <select id="filtre-mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="h-9 rounded-lg border border-line bg-surface px-3 text-sm">
                <option value="tous">Tous les modes</option>
                {MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          {onglet === "journal" ? (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Élève</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Mois réglé</th>
                  <th className="px-3 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {journal.map((p) => {
                  const e = eleveDe(p.eleveId);
                  return (
                    <tr key={p.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar texte={initiales(e.prenom, e.nom)} sexe={e.sexe} />
                          <div className="min-w-0">
                            <p className="font-semibold">{e.prenom} {e.nom}</p>
                            <p className="text-xs text-muted">Classe {classeNom(e.classeId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted">{dateCourte(p.date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{moisLong(p.mois)}</td>
                      <td className="px-3 py-3 whitespace-nowrap"><ModeLabel mode={p.mode} /></td>
                      <td className="px-5 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{fcfa(p.montant)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Élève</th>
                  <th className="px-3 py-3 font-medium">Parent</th>
                  <th className="px-3 py-3 text-right font-medium">Reste</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {enRetard.map((e) => {
                  const reste = mensualite(e.classeId) - (payeParEleve.get(e.id) ?? 0);
                  return (
                    <tr key={e.id} className="hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar texte={initiales(e.prenom, e.nom)} sexe={e.sexe} />
                          <div className="min-w-0">
                            <p className="font-semibold">{e.prenom} {e.nom}</p>
                            <p className="text-xs text-muted">Classe {classeNom(e.classeId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="whitespace-nowrap">{e.parent}</p>
                        <p className="text-xs whitespace-nowrap text-muted tabular-nums">{e.telephoneParent}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{fcfa(reste)}</td>
                      <td className="px-3 py-3"><StatutBadge statut={statutDe(e.id, e.classeId)} /></td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            choisirEleve(e.id);
                            setFormulaire(true);
                            setConfirmation(null);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-ink hover:opacity-90"
                        >
                          Encaisser
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {onglet === "journal" && journal.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted">Aucun paiement avec ce mode. Choisissez « Tous les modes » pour tout afficher.</p>
          )}
          {onglet === "retard" && enRetard.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted">Tous les élèves sont à jour pour {moisLong(ECOLE.moisEnCours)}.</p>
          )}
        </div>
      </section>
    </div>
  );
}
