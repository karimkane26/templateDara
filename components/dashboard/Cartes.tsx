/*
 * Les cartes du tableau de bord : présence du jour, modes de paiement,
 * parents à relancer, derniers paiements, mémorisation par classe.
 */

import Link from "next/link";
import { CLASSES, PAIEMENTS, PRESENCE, classeDe, eleveParId, relances, repartitionModes, resteAPayer, statsClasse } from "@/lib/data";
import { dateCourte, fcfa, initiales, pourcent } from "@/lib/format";
import { Icon } from "../Icon";
import { Avatar, ModeLabel, Panel, StatutBadge } from "../elements";

/* ============================================================
 * Présence aujourd'hui
 * ============================================================ */

export function PresenceDuJour() {
  const taux = pourcent(PRESENCE.presents, PRESENCE.total);

  // Le cercle : rayon et longueur du tour complet (périmètre = 2 × π × rayon)
  const rayon = 34;
  const perimetre = 2 * Math.PI * rayon;
  const longueurColoree = (taux / 100) * perimetre;

  // Liste des absents
  const absents = [];
  for (let i = 0; i < PRESENCE.absents.length; i++) {
    const eleve = PRESENCE.absents[i];
    absents.push(
      <li key={eleve.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
        {eleve.prenom} {eleve.nom[0]}. <span className="text-muted">({classeDe(eleve).nom})</span>
      </li>,
    );
  }

  const lien = (
    <Link href="/presences" className="text-xs font-semibold text-primary hover:underline">
      Faire l&apos;appel
    </Link>
  );

  return (
    <Panel titre="Présence aujourd'hui" action={lien}>
      <div className="flex items-center gap-5 px-5 pb-4">
        <svg viewBox="0 0 84 84" className="size-[84px] shrink-0 -rotate-90" role="img" aria-label={taux + " % de présence"}>
          <circle cx="42" cy="42" r={rayon} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
          <circle cx="42" cy="42" r={rayon} fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray={longueurColoree + " " + perimetre} />
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
        <ul className="flex flex-wrap gap-1.5">{absents}</ul>
      </div>
    </Panel>
  );
}

/* ============================================================
 * Comment les parents paient (Wave, Orange Money, espèces)
 * ============================================================ */

/** Couleur de fond associée à chaque mode de paiement. */
function couleurDuMode(mode: string): string {
  if (mode === "Wave") return "bg-wave";
  if (mode === "Orange Money") return "bg-orange-money";
  return "bg-muted";
}

export function ModesPaiement() {
  const modes = repartitionModes();

  let total = 0;
  for (let i = 0; i < modes.length; i++) {
    total = total + modes[i].montant;
  }

  // La barre découpée en morceaux, et la légende en dessous
  const morceauxDeBarre = [];
  const lignesLegende = [];

  for (let i = 0; i < modes.length; i++) {
    const m = modes[i];
    const couleur = couleurDuMode(m.mode);

    morceauxDeBarre.push(<div key={m.mode} className={couleur} style={{ width: (m.montant / total) * 100 + "%" }} />);

    lignesLegende.push(
      <li key={m.mode} className="flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className={"size-2.5 rounded-full " + couleur} />
          <ModeLabel mode={m.mode} />
          <span className="text-xs text-muted">{m.nombre} paiements</span>
        </span>
        <span className="font-semibold tabular-nums">{pourcent(m.montant, total)} %</span>
      </li>,
    );
  }

  return (
    <Panel titre="Comment les parents paient">
      <div className="px-5 pb-5">
        <div className="flex h-2.5 overflow-hidden rounded-full">{morceauxDeBarre}</div>
        <ul className="mt-4 flex flex-col gap-2.5">{lignesLegende}</ul>
      </div>
    </Panel>
  );
}

/* ============================================================
 * Parents à relancer (lien WhatsApp)
 * ============================================================ */

/** Enlève les espaces d'un numéro : "77 412 35 08" -> "774123508" */
function numeroSansEspaces(telephone: string): string {
  return telephone.split(" ").join("");
}

export function Relances() {
  const enRetard = relances();

  // On n'affiche que les 6 premiers
  let nombreAffiches = enRetard.length;
  if (nombreAffiches > 6) {
    nombreAffiches = 6;
  }

  const lignes = [];
  for (let i = 0; i < nombreAffiches; i++) {
    const eleve = enRetard[i];
    const reste = resteAPayer(eleve);

    // Message WhatsApp pré-rempli
    const message =
      "Assalamou aleykoum " + eleve.parent + ". La mensualité d'octobre de " + eleve.prenom +
      " (classe " + classeDe(eleve).nom + ") n'est pas encore réglée : il reste " + fcfa(reste) +
      ". Merci, Daara Al Falah.";
    const lienWhatsApp = "https://wa.me/221" + numeroSansEspaces(eleve.telephoneParent) + "?text=" + encodeURIComponent(message);

    lignes.push(
      <li key={eleve.id} className="flex items-center gap-3 px-5 py-3">
        <Avatar texte={initiales(eleve.prenom, eleve.nom)} sexe={eleve.sexe} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {eleve.prenom} {eleve.nom}
          </p>
          <p className="truncate text-xs text-muted">
            Reste {fcfa(reste)}, {eleve.parent}
          </p>
        </div>
        <a
          href={lienWhatsApp}
          target="_blank"
          rel="noreferrer"
          aria-label={"Relancer " + eleve.parent + " sur WhatsApp"}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold hover:bg-surface-2"
        >
          <Icon name="message" size={14} />
          Relancer
        </a>
      </li>,
    );
  }

  const lien = (
    <Link href="/paiements?statut=retard" className="text-xs font-semibold text-primary hover:underline">
      Tout voir ({enRetard.length})
    </Link>
  );

  return (
    <Panel titre="Parents à relancer" action={lien}>
      <ul className="divide-y divide-line border-t border-line">{lignes}</ul>
    </Panel>
  );
}

/* ============================================================
 * Derniers paiements reçus
 * ============================================================ */

export function PaiementsRecents() {
  // On affiche les 7 paiements les plus récents
  let nombreAffiches = PAIEMENTS.length;
  if (nombreAffiches > 7) {
    nombreAffiches = 7;
  }

  const lignes = [];
  for (let i = 0; i < nombreAffiches; i++) {
    const paiement = PAIEMENTS[i];
    const eleve = eleveParId(paiement.eleveId);
    if (eleve === undefined) {
      continue; // élève introuvable : on saute ce paiement
    }

    lignes.push(
      <tr key={paiement.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar texte={initiales(eleve.prenom, eleve.nom)} sexe={eleve.sexe} />
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {eleve.prenom} {eleve.nom}
              </p>
              <p className="text-xs text-muted">Classe {classeDe(eleve).nom}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-muted">{dateCourte(paiement.date)}</td>
        <td className="px-3 py-3 whitespace-nowrap">
          <ModeLabel mode={paiement.mode} />
        </td>
        <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{fcfa(paiement.montant)}</td>
        <td className="px-5 py-3 text-right">
          <StatutBadge statut={eleve.statutMois} />
        </td>
      </tr>,
    );
  }

  const lien = (
    <Link href="/paiements" className="text-xs font-semibold text-primary hover:underline">
      Historique
    </Link>
  );

  return (
    <Panel titre="Derniers paiements reçus" action={lien} className="lg:col-span-2">
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
          <tbody className="divide-y divide-line">{lignes}</tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ============================================================
 * Mémorisation par classe
 * ============================================================ */

export function ProgressionClasses() {
  const lignes = [];

  for (let i = 0; i < CLASSES.length; i++) {
    const classe = CLASSES[i];
    const stats = statsClasse(classe);

    // Où en est la classe, en % entre le premier et le dernier hizb du niveau
    let pourcentage = 100;
    if (classe.hizbFin !== classe.hizbDebut) {
      pourcentage = Math.round(((stats.hizbMoyen - classe.hizbDebut) / (classe.hizbFin - classe.hizbDebut)) * 100);
    }
    // On montre toujours un petit bout de barre (au moins 4 %)
    if (pourcentage < 4) {
      pourcentage = 4;
    }

    let texteNiveau = "";
    if (classe.hizbDebut === 0) {
      texteNiveau = "Lecture et premiers hizb";
    } else {
      // 12.345 -> "12,3"
      texteNiveau = "Hizb moyen " + stats.hizbMoyen.toFixed(1).replace(".", ",");
    }

    lignes.push(
      <li key={classe.id}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            {classe.nom} <span className="font-normal text-muted">{classe.niveau}</span>
          </p>
          <p className="text-xs tabular-nums text-muted">{stats.effectif} élèves</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary" style={{ width: pourcentage + "%" }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {texteNiveau}, présence {stats.presence} %
        </p>
      </li>,
    );
  }

  const lien = (
    <Link href="/classes" className="text-xs font-semibold text-primary hover:underline">
      Classes
    </Link>
  );

  return (
    <Panel titre="Mémorisation par classe" action={lien}>
      <ul className="flex flex-col gap-4 border-t border-line px-5 py-4">{lignes}</ul>
    </Panel>
  );
}
