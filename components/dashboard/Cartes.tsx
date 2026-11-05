import Link from "next/link";
import { CLASSES, PAIEMENTS, PRESENCE, classeDe, eleveParId, relances, repartitionModes, resteAPayer, statsClasse } from "@/lib/data";
import { dateCourte, fcfa, initiales, pourcent } from "@/lib/format";
import { Icon } from "../Icon";
import { Avatar, ModeLabel, Panel, StatutBadge } from "../ui";

export function PresenceDuJour() {
  const taux = pourcent(PRESENCE.presents, PRESENCE.total);
  const r = 34;
  const c = 2 * Math.PI * r;

  return (
    <Panel titre="Présence aujourd'hui" action={<Link href="/presences" className="text-xs font-semibold text-primary hover:underline">Faire l&apos;appel</Link>}>
      <div className="flex items-center gap-5 px-5 pb-4">
        <svg viewBox="0 0 84 84" className="size-[84px] shrink-0 -rotate-90" role="img" aria-label={`${taux} % de présence`}>
          <circle cx="42" cy="42" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
          <circle cx="42" cy="42" r={r} fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(taux / 100) * c} ${c}`} />
        </svg>
        <div>
          <p className="font-display text-3xl font-semibold tabular-nums">{taux} %</p>
          <p className="text-sm text-muted">
            {PRESENCE.presents} présents sur {PRESENCE.total}
          </p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-3">
        <p className="mb-2 text-xs font-medium text-muted">Absents ({PRESENCE.absents.length})</p>
        <ul className="flex flex-wrap gap-1.5">
          {PRESENCE.absents.map((e) => (
            <li key={e.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
              {e.prenom} {e.nom[0]}. <span className="text-muted">({classeDe(e).nom})</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function ModesPaiement() {
  const modes = repartitionModes();
  const total = modes.reduce((s, m) => s + m.montant, 0);
  const couleur: Record<string, string> = { Wave: "bg-wave", "Orange Money": "bg-orange-money", Espèces: "bg-muted" };

  return (
    <Panel titre="Comment les parents paient">
      <div className="px-5 pb-5">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {modes.map((m) => (
            <div key={m.mode} className={couleur[m.mode]} style={{ width: `${(m.montant / total) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-4 flex flex-col gap-2.5">
          {modes.map((m) => (
            <li key={m.mode} className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${couleur[m.mode]}`} />
                <ModeLabel mode={m.mode} />
                <span className="text-xs text-muted">{m.nombre} paiements</span>
              </span>
              <span className="font-semibold tabular-nums">{pourcent(m.montant, total)} %</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function Relances() {
  const liste = relances().slice(0, 6);
  const total = relances().length;

  return (
    <Panel
      titre="Parents à relancer"
      action={<Link href="/paiements?statut=retard" className="text-xs font-semibold text-primary hover:underline">Tout voir ({total})</Link>}
    >
      <ul className="divide-y divide-line border-t border-line">
        {liste.map((e) => {
          const reste = resteAPayer(e);
          const message = encodeURIComponent(
            `Assalamou aleykoum ${e.parent}. La mensualité d'octobre de ${e.prenom} (classe ${classeDe(e).nom}) n'est pas encore réglée : il reste ${fcfa(reste)}. Merci, Daara Al Falah.`,
          );
          return (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar texte={initiales(e.prenom, e.nom)} sexe={e.sexe} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {e.prenom} {e.nom}
                </p>
                <p className="truncate text-xs text-muted">
                  Reste {fcfa(reste)}, {e.parent}
                </p>
              </div>
              <a
                href={`https://wa.me/221${e.telephoneParent.replace(/\s/g, "")}?text=${message}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Relancer ${e.parent} sur WhatsApp`}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold hover:bg-surface-2"
              >
                <Icon name="message" size={14} />
                Relancer
              </a>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function PaiementsRecents() {
  const liste = PAIEMENTS.slice(0, 7);
  return (
    <Panel titre="Derniers paiements reçus" action={<Link href="/paiements" className="text-xs font-semibold text-primary hover:underline">Historique</Link>} className="lg:col-span-2">
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-5 py-2.5 font-medium">Élève</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Mode</th>
              <th className="px-3 py-2.5 text-right font-medium">Montant</th>
              <th className="px-5 py-2.5 text-right font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {liste.map((p) => {
              const e = eleveParId(p.eleveId)!;
              return (
                <tr key={p.id} className="hover:bg-surface-2/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar texte={initiales(e.prenom, e.nom)} sexe={e.sexe} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {e.prenom} {e.nom}
                        </p>
                        <p className="text-xs text-muted">Classe {classeDe(e).nom}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted">{dateCourte(p.date)}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><ModeLabel mode={p.mode} /></td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{fcfa(p.montant)}</td>
                  <td className="px-5 py-3 text-right"><StatutBadge statut={e.statutMois} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ProgressionClasses() {
  return (
    <Panel titre="Mémorisation par classe" action={<Link href="/classes" className="text-xs font-semibold text-primary hover:underline">Classes</Link>}>
      <ul className="flex flex-col gap-4 border-t border-line px-5 py-4">
        {CLASSES.map((c) => {
          const s = statsClasse(c);
          const debut = c.hizbDebut;
          const pct = c.hizbFin === debut ? 100 : Math.round(((s.hizbMoyen - debut) / (c.hizbFin - debut)) * 100);
          return (
            <li key={c.id}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">
                  {c.nom} <span className="font-normal text-muted">{c.niveau}</span>
                </p>
                <p className="text-xs tabular-nums text-muted">{s.effectif} élèves</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {c.hizbDebut === 0 ? "Lecture et premiers hizb" : `Hizb moyen ${s.hizbMoyen.toFixed(1).replace(".", ",")}`}, présence {s.presence} %
              </p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
