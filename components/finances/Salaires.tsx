"use client";

/*
 * Onglet "Salaires des enseignants".
 *  - le salaire mensuel de chaque enseignant (modifiable) ;
 *  - pour le mois choisi : ce qui a été versé, le reste, bouton "Payer" ;
 *  - les avances sont possibles : on peut verser une partie du salaire ;
 *  - fiche de paie imprimable et historique des versements.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ECOLE, type Enseignant, type PaiementSalaire } from "@/lib/data";
import {
  ajouterPaiementSalaire,
  definirSalaire,
  lireMontant,
  lirePaiementsSalaires,
  lireSalairesDeBase,
  moisDisponibles,
  salaireDe,
  salaireVerse,
  supprimerPaiementSalaire,
  type SalaireDeBase,
} from "@/lib/finances";
import { dateCourte, fcfa, initiales, moisLong } from "@/lib/format";
import { lireEnseignants, trouverEnseignant } from "@/lib/stockage";
import { Avatar } from "../elements";
import { ListeDeChoix, type OptionDeChoix } from "../ListeDeChoix";
import { Modal } from "../Modal";
import { DocumentFinancier, type ContenuDocument } from "./DocumentFinancier";
import { Bandeau, BoutonIcone, CarteChiffre, MessageErreur, OPTIONS_MODES, PastilleEtat, versMode } from "./outils";

/** "Oustaz Mamadou Ndiaye" */
function nomComplet(e: Enseignant): string {
  return e.civilite + " " + e.prenom + " " + e.nom;
}

/** Le mois qui suit : "2026-10" -> "2026-11" ; "2026-12" -> "2027-01" */
function moisSuivant(mois: string): string {
  let annee = Number(mois.slice(0, 4));
  let numero = Number(mois.slice(5, 7)) + 1;
  if (numero > 12) {
    numero = 1;
    annee = annee + 1;
  }
  let texte = String(numero);
  if (texte.length < 2) {
    texte = "0" + texte;
  }
  return annee + "-" + texte;
}

interface SalairesProps {
  onChange: () => void;
}

export function Salaires(props: SalairesProps) {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [salairesBase, setSalairesBase] = useState<SalaireDeBase[]>([]);
  const [versements, setVersements] = useState<PaiementSalaire[]>([]);
  const [listeMois, setListeMois] = useState<string[]>([ECOLE.moisEnCours]);
  const [mois, setMois] = useState(ECOLE.moisEnCours);
  const [message, setMessage] = useState("");

  // Fenêtre "Payer" (ou "Salaire mensuel") : l'enseignant concerné, null = fermée
  const [aPayer, setAPayer] = useState<Enseignant | null>(null);
  const [aRegler, setARegler] = useState<Enseignant | null>(null);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("Wave");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState("");

  const [document, setDocument] = useState<ContenuDocument | null>(null);

  function recharger() {
    setEnseignants(lireEnseignants());
    setSalairesBase(lireSalairesDeBase());
    setVersements(lirePaiementsSalaires());
    // On propose aussi le mois suivant, pour pouvoir payer à l'avance
    const liste = moisDisponibles();
    const suivant = moisSuivant(liste[0]);
    if (!liste.includes(suivant)) {
      liste.unshift(suivant);
    }
    setListeMois(liste);
  }

  useEffect(function () {
    recharger();
  }, []);

  /* ---------- Payer un salaire ---------- */

  function ouvrirPaiement(e: Enseignant) {
    let reste = salaireDe(salairesBase, e.id) - salaireVerse(versements, e.id, mois);
    if (reste < 0) {
      reste = 0;
    }
    setMontant(String(reste));
    setMode("Wave");
    setNote("");
    setErreur("");
    setMessage("");
    setAPayer(e);
  }

  function confirmerPaiement(evenement: FormEvent) {
    evenement.preventDefault();
    if (aPayer === null) {
      return;
    }
    const valeur = lireMontant(montant);
    if (!isFinite(valeur) || valeur <= 0) {
      setErreur("Indiquez un montant supérieur à 0 FCFA.");
      return;
    }
    ajouterPaiementSalaire({ enseignantId: aPayer.id, mois: mois, montant: valeur, mode: versMode(mode), note: note.trim() });
    setMessage(fcfa(valeur) + " versés à " + nomComplet(aPayer) + " pour " + moisLong(mois) + ".");
    setAPayer(null);
    recharger();
    props.onChange();
  }

  /* ---------- Fixer le salaire mensuel ---------- */

  function ouvrirReglage(e: Enseignant) {
    setMontant(String(salaireDe(salairesBase, e.id)));
    setErreur("");
    setMessage("");
    setARegler(e);
  }

  function confirmerReglage(evenement: FormEvent) {
    evenement.preventDefault();
    if (aRegler === null) {
      return;
    }
    const valeur = lireMontant(montant);
    if (!isFinite(valeur) || valeur < 0) {
      setErreur("Indiquez un montant valide (0 ou plus).");
      return;
    }
    definirSalaire(aRegler.id, valeur);
    setMessage("Salaire mensuel de " + nomComplet(aRegler) + " : " + fcfa(valeur) + ".");
    setARegler(null);
    recharger();
  }

  function supprimerVersement(v: PaiementSalaire) {
    if (!window.confirm("Supprimer ce versement de " + fcfa(v.montant) + " ? (à utiliser seulement en cas d'erreur)")) {
      return;
    }
    supprimerPaiementSalaire(v.id);
    recharger();
    props.onChange();
    setMessage("Versement supprimé.");
  }

  /** Fiche de paie du mois pour un enseignant : tous ses versements de ce mois. */
  function ouvrirFiche(e: Enseignant) {
    const lignes = [];
    for (let i = 0; i < versements.length; i++) {
      const v = versements[i];
      if (v.enseignantId === e.id && v.mois === mois) {
        let libelle = "Versement du " + dateCourte(v.date) + " (" + v.mode + ")";
        if (v.note !== "") {
          libelle = libelle + " · " + v.note;
        }
        lignes.push({ libelle: libelle, montant: v.montant });
      }
    }
    let numeroCourt = e.id;
    if (e.id.length > 8) {
      numeroCourt = e.id.slice(e.id.length - 6);
    }
    setDocument({
      type: "Fiche de paie",
      numero: "PAIE-" + mois + "-" + numeroCourt.toUpperCase(),
      date: ECOLE.aujourdhui,
      destinataire: nomComplet(e),
      sousDestinataire: "Salaire de " + moisLong(mois) + " · Salaire mensuel prévu : " + fcfa(salaireDe(salairesBase, e.id)) + " · Tél. " + e.telephone,
      lignes: lignes,
      total: salaireDe(salairesBase, e.id),
      paye: salaireVerse(versements, e.id, mois),
      mention: "L'enseignant reconnaît avoir reçu les sommes indiquées ci-dessus.",
    });
  }

  /* ---------- Tableau des enseignants ---------- */

  let masseSalariale = 0;
  let totalVerse = 0;
  const lignes = [];
  for (let i = 0; i < enseignants.length; i++) {
    const e = enseignants[i];
    const prevu = salaireDe(salairesBase, e.id);
    const verse = salaireVerse(versements, e.id, mois);
    masseSalariale = masseSalariale + prevu;
    totalVerse = totalVerse + verse;

    let reste = prevu - verse;
    if (reste < 0) {
      reste = 0;
    }

    let sexe: "M" | "F" = "M";
    if (e.civilite === "Oustaza") {
      sexe = "F";
    }

    let texteSalaire = <span className="tabular-nums">{fcfa(prevu)}</span>;
    if (prevu === 0) {
      texteSalaire = <span className="text-muted">À fixer</span>;
    }

    let boutonPayer = null;
    if (reste > 0 || prevu === 0) {
      boutonPayer = (
        <Button type="button" size="sm" onClick={function () { ouvrirPaiement(e); }}>
          Payer
        </Button>
      );
    }

    lignes.push(
      <tr key={e.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar texte={initiales(e.prenom, e.nom)} sexe={sexe} />
            <p className="font-semibold">{nomComplet(e)}</p>
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          <button type="button" onClick={function () { ouvrirReglage(e); }} title="Modifier le salaire mensuel" className="rounded-md px-2 py-1 hover:bg-surface-2">
            {texteSalaire}
          </button>
        </td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(verse)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(reste)}</td>
        <td className="px-3 py-3">
          <PastilleEtat paye={verse} total={prevu} />
        </td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          {boutonPayer}
          <BoutonIcone icone="printer" label="Fiche de paie" onClick={function () { ouvrirFiche(e); }} />
        </td>
      </tr>,
    );
  }

  /* ---------- Historique des versements ---------- */

  const lignesHistorique = [];
  for (let i = 0; i < versements.length; i++) {
    const v = versements[i];
    const e = trouverEnseignant(enseignants, v.enseignantId);
    let nom = "Enseignant supprimé";
    if (e !== undefined) {
      nom = nomComplet(e);
    }
    let details = v.mode;
    if (v.note !== "") {
      details = details + " · " + v.note;
    }
    lignesHistorique.push(
      <tr key={v.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-2.5 whitespace-nowrap">{dateCourte(v.date)}</td>
        <td className="px-3 py-2.5">{nom}</td>
        <td className="px-3 py-2.5 whitespace-nowrap">{moisLong(v.mois)}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{fcfa(v.montant)}</td>
        <td className="px-3 py-2.5 text-xs text-muted">{details}</td>
        <td className="px-5 py-2.5 text-right">
          <BoutonIcone icone="trash" label="Supprimer ce versement" danger={true} onClick={function () { supprimerVersement(v); }} />
        </td>
      </tr>,
    );
  }

  const optionsMois: OptionDeChoix[] = [];
  for (let i = 0; i < listeMois.length; i++) {
    optionsMois.push({ valeur: listeMois[i], texte: moisLong(listeMois[i]) });
  }

  // Fenêtre "Payer"
  let fenetrePaiement = null;
  if (aPayer !== null) {
    fenetrePaiement = (
      <Modal
        ouvert={true}
        titre={"Payer " + nomComplet(aPayer)}
        onFermer={function () { setAPayer(null); }}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={function () { setAPayer(null); }}>
              Annuler
            </Button>
            <Button type="submit" form="form-salaire" size="lg">
              Enregistrer le versement
            </Button>
          </>
        }
      >
        <form id="form-salaire" onSubmit={confirmerPaiement} className="grid gap-4">
          <p className="text-sm text-muted">
            Salaire de <strong className="text-ink">{moisLong(mois)}</strong>. Vous pouvez verser une partie seulement (avance).
          </p>
          <div>
            <Label htmlFor="salaire-montant" className="mb-1.5 text-xs font-semibold text-muted">Montant (FCFA)</Label>
            <Input id="salaire-montant" inputMode="numeric" value={montant} onChange={function (ev) { setMontant(ev.target.value); setErreur(""); }} className="h-10 bg-surface tabular-nums" />
          </div>
          <div>
            <Label htmlFor="salaire-mode" className="mb-1.5 text-xs font-semibold text-muted">Mode de paiement</Label>
            <ListeDeChoix id="salaire-mode" value={mode} onChange={setMode} options={OPTIONS_MODES} />
          </div>
          <div>
            <Label htmlFor="salaire-note" className="mb-1.5 text-xs font-semibold text-muted">Note (facultatif)</Label>
            <Input id="salaire-note" value={note} onChange={function (ev) { setNote(ev.target.value); }} placeholder="ex. Avance sur salaire, prime..." className="h-10 bg-surface" />
          </div>
          <MessageErreur message={erreur} />
        </form>
      </Modal>
    );
  }

  // Fenêtre "Salaire mensuel"
  let fenetreReglage = null;
  if (aRegler !== null) {
    fenetreReglage = (
      <Modal
        ouvert={true}
        titre={"Salaire de " + nomComplet(aRegler)}
        onFermer={function () { setARegler(null); }}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={function () { setARegler(null); }}>
              Annuler
            </Button>
            <Button type="submit" form="form-reglage" size="lg">
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="form-reglage" onSubmit={confirmerReglage} className="grid gap-4">
          <div>
            <Label htmlFor="reglage-montant" className="mb-1.5 text-xs font-semibold text-muted">Salaire mensuel (FCFA)</Label>
            <Input id="reglage-montant" inputMode="numeric" value={montant} onChange={function (ev) { setMontant(ev.target.value); setErreur(""); }} className="h-10 bg-surface tabular-nums" />
          </div>
          <MessageErreur message={erreur} />
        </form>
      </Modal>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="salaires-mois" className="text-sm font-semibold">Salaires de</Label>
        <ListeDeChoix id="salaires-mois" value={mois} onChange={setMois} options={optionsMois} className="w-48" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteChiffre titre="Masse salariale mensuelle" valeur={fcfa(masseSalariale)} detail={enseignants.length + " enseignants"} />
        <CarteChiffre titre={"Versé pour " + moisLong(mois)} valeur={fcfa(totalVerse)} couleur="vert" />
        <CarteChiffre titre="Reste à verser" valeur={fcfa(Math.max(masseSalariale - totalVerse, 0))} couleur="rouge" />
      </div>

      <Bandeau message={message} />

      <section className="panel min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Enseignant</th>
                <th className="px-3 py-3 text-right font-medium">Salaire mensuel</th>
                <th className="px-3 py-3 text-right font-medium">Versé</th>
                <th className="px-3 py-3 text-right font-medium">Reste</th>
                <th className="px-3 py-3 font-medium">État</th>
                <th className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">{lignes}</tbody>
          </table>
        </div>
      </section>

      <section className="panel min-w-0">
        <header className="px-5 pt-4 pb-3">
          <h2 className="font-display text-[15px] font-semibold">Historique des versements</h2>
        </header>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Enseignant</th>
                <th className="px-3 py-2.5 font-medium">Mois payé</th>
                <th className="px-3 py-2.5 text-right font-medium">Montant</th>
                <th className="px-3 py-2.5 font-medium">Détails</th>
                <th className="px-5 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">{lignesHistorique}</tbody>
          </table>
        </div>
      </section>

      {fenetrePaiement}
      {fenetreReglage}
      <DocumentFinancier document={document} onFermer={function () { setDocument(null); }} />
    </div>
  );
}
