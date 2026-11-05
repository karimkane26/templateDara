/*
 * Graphique en barres : attendu / encaissé sur 12 mois.
 * Dessiné en SVG "à la main" (aucune librairie).
 */

import { HISTORIQUE } from "@/lib/data";
import { compact, fcfa, moisCourt, pourcent } from "@/lib/format";

// Taille du dessin (en unités SVG)
const LARGEUR = 640;
const HAUTEUR = 240;

// Marges autour de la zone des barres
const MARGE_HAUT = 12;
const MARGE_DROITE = 8;
const MARGE_BAS = 28;
const MARGE_GAUCHE = 44;

const LARGEUR_UTILE = LARGEUR - MARGE_GAUCHE - MARGE_DROITE;
const HAUTEUR_UTILE = HAUTEUR - MARGE_HAUT - MARGE_BAS;

export function EncaissementsChart() {
  // 1. On cherche le plus grand montant attendu, et on fait les totaux.
  let plusGrand = 0;
  let totalEncaisse = 0;
  let totalAttendu = 0;
  for (let i = 0; i < HISTORIQUE.length; i++) {
    if (HISTORIQUE[i].attendu > plusGrand) {
      plusGrand = HISTORIQUE[i].attendu;
    }
    totalEncaisse = totalEncaisse + HISTORIQUE[i].encaisse;
    totalAttendu = totalAttendu + HISTORIQUE[i].attendu;
  }

  // 2. On choisit l'écart entre deux lignes horizontales (50 000 ou 100 000 FCFA)
  //    et la valeur tout en haut du graphique (arrondie au-dessus).
  let pas = 50000;
  if (plusGrand > 400000) {
    pas = 100000;
  }
  const plafond = Math.ceil(plusGrand / pas) * pas;

  /** Transforme un montant en position verticale dans le dessin (0 FCFA = en bas). */
  function positionY(montant: number): number {
    return MARGE_HAUT + HAUTEUR_UTILE - (montant / plafond) * HAUTEUR_UTILE;
  }

  // 3. Les lignes horizontales avec leur montant à gauche
  const lignesHorizontales = [];
  for (let valeur = 0; valeur <= plafond; valeur = valeur + pas) {
    // La ligne du bas (0) est pleine, les autres sont en pointillés.
    let pointilles: string | undefined = "3 4";
    if (valeur === 0) {
      pointilles = undefined;
    }

    lignesHorizontales.push(
      <g key={valeur}>
        <line x1={MARGE_GAUCHE} x2={LARGEUR - MARGE_DROITE} y1={positionY(valeur)} y2={positionY(valeur)} stroke="var(--line)" strokeDasharray={pointilles} />
        <text x={MARGE_GAUCHE - 8} y={positionY(valeur)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)">
          {compact(valeur)}
        </text>
      </g>,
    );
  }

  // 4. Les barres, une par mois
  const largeurColonne = LARGEUR_UTILE / HISTORIQUE.length;
  let largeurBarre = largeurColonne * 0.56;
  if (largeurBarre > 26) {
    largeurBarre = 26;
  }

  const barres = [];
  for (let i = 0; i < HISTORIQUE.length; i++) {
    const mois = HISTORIQUE[i];
    const centre = MARGE_GAUCHE + largeurColonne * i + largeurColonne / 2;
    const gauche = centre - largeurBarre / 2;

    // Le dernier mois (mois en cours) est mis en valeur en ocre.
    let couleurBarre = "var(--primary)";
    let couleurTexte = "var(--muted)";
    let graisseTexte = 400;
    if (i === HISTORIQUE.length - 1) {
      couleurBarre = "var(--ochre)";
      couleurTexte = "var(--ink)";
      graisseTexte = 600;
    }

    const infoBulle = moisCourt(mois.mois) + " : " + fcfa(mois.encaisse) + " sur " + fcfa(mois.attendu);

    barres.push(
      <g key={mois.mois}>
        <title>{infoBulle}</title>
        {/* Barre grise : ce qui était attendu */}
        <rect x={gauche} y={positionY(mois.attendu)} width={largeurBarre} height={positionY(0) - positionY(mois.attendu)} rx="4" fill="var(--surface-2)" />
        {/* Barre de couleur : ce qui a été encaissé */}
        <rect x={gauche} y={positionY(mois.encaisse)} width={largeurBarre} height={positionY(0) - positionY(mois.encaisse)} rx="4" fill={couleurBarre} />
        <text x={centre} y={HAUTEUR - 8} textAnchor="middle" fontSize="11" fill={couleurTexte} fontWeight={graisseTexte}>
          {moisCourt(mois.mois)}
        </text>
      </g>,
    );
  }

  return (
    <div className="px-5 pb-5">
      <p className="mb-4 text-sm text-muted">
        <span className="font-semibold text-ink tabular-nums">{fcfa(totalEncaisse)}</span> encaissés sur 12 mois, soit{" "}
        {pourcent(totalEncaisse, totalAttendu)} % de l&apos;attendu.
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={"0 0 " + LARGEUR + " " + HAUTEUR} className="h-auto w-full min-w-[520px]" role="img" aria-label="Encaissements mensuels sur 12 mois">
          {lignesHorizontales}
          {barres}
        </svg>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" />
          Encaissé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-surface-2 ring-1 ring-line" />
          Attendu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-ochre" />
          Mois en cours
        </span>
      </p>
    </div>
  );
}
