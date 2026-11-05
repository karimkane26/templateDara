import { HISTORIQUE } from "@/lib/data";
import { compact, fcfa, moisCourt, pourcent } from "@/lib/format";

/** Barres attendu / encaissé sur 12 mois, en SVG pur (aucune librairie). */
export function EncaissementsChart() {
  const W = 640;
  const H = 240;
  const m = { top: 12, right: 8, bottom: 28, left: 44 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const max = Math.max(...HISTORIQUE.map((d) => d.attendu));
  const pas = max > 400_000 ? 100_000 : 50_000;
  const plafond = Math.ceil(max / pas) * pas;
  const ticks = Array.from({ length: plafond / pas + 1 }, (_, i) => i * pas);
  const y = (v: number) => m.top + ih - (v / plafond) * ih;

  const bande = iw / HISTORIQUE.length;
  const largeur = Math.min(26, bande * 0.56);
  const dernier = HISTORIQUE[HISTORIQUE.length - 1];
  const total = HISTORIQUE.reduce((s, d) => s + d.encaisse, 0);
  const totalAttendu = HISTORIQUE.reduce((s, d) => s + d.attendu, 0);

  return (
    <div className="px-5 pb-5">
      <p className="mb-4 text-sm text-muted">
        <span className="font-semibold text-ink tabular-nums">{fcfa(total)}</span> encaissés sur 12 mois, soit{" "}
        {pourcent(total, totalAttendu)} % de l&apos;attendu.
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[520px]" role="img" aria-label="Encaissements mensuels sur 12 mois">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={W - m.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)">
                {compact(t)}
              </text>
            </g>
          ))}

          {HISTORIQUE.map((d, i) => {
            const cx = m.left + bande * i + bande / 2;
            const estDernier = d === dernier;
            return (
              <g key={d.mois}>
                <title>{`${moisCourt(d.mois)} : ${fcfa(d.encaisse)} sur ${fcfa(d.attendu)}`}</title>
                <rect x={cx - largeur / 2} y={y(d.attendu)} width={largeur} height={y(0) - y(d.attendu)} rx="4" fill="var(--surface-2)" />
                <rect
                  x={cx - largeur / 2}
                  y={y(d.encaisse)}
                  width={largeur}
                  height={y(0) - y(d.encaisse)}
                  rx="4"
                  fill={estDernier ? "var(--ochre)" : "var(--primary)"}
                />
                <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={estDernier ? "var(--ink)" : "var(--muted)"} fontWeight={estDernier ? 600 : 400}>
                  {moisCourt(d.mois)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Encaissé</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-surface-2 ring-1 ring-line" />Attendu</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-ochre" />Mois en cours</span>
      </p>
    </div>
  );
}
