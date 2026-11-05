"use client";

/*
 * Onglet "Dépenses de l'académie" : loyer, électricité, internet, fournitures...
 * On enregistre chaque dépense ; on voit le total du mois et la part de chaque catégorie.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ECOLE, type CategorieDepense, type Depense } from "@/lib/data";
import { CATEGORIES_DEPENSES, ajouterDepense, lireDepenses, lireMontant, moisDeLaDate, moisDisponibles, supprimerDepense } from "@/lib/finances";
import { dateCourte, fcfa, moisLong, pourcent } from "@/lib/format";
import { Icon } from "../Icon";
import { ListeDeChoix, type OptionDeChoix } from "../ListeDeChoix";
import { Modal } from "../Modal";
import { Bandeau, BoutonIcone, CarteChiffre, MessageErreur, OPTIONS_MODES, versMode } from "./outils";

const OPTIONS_CATEGORIES: OptionDeChoix[] = [];
for (let i = 0; i < CATEGORIES_DEPENSES.length; i++) {
  OPTIONS_CATEGORIES.push({ valeur: CATEGORIES_DEPENSES[i], texte: CATEGORIES_DEPENSES[i] });
}

/** Transforme le texte choisi en catégorie (sinon "Autre"). */
function versCategorie(valeur: string): CategorieDepense {
  for (let i = 0; i < CATEGORIES_DEPENSES.length; i++) {
    if (CATEGORIES_DEPENSES[i] === valeur) {
      return CATEGORIES_DEPENSES[i];
    }
  }
  return "Autre";
}

/** Le mois d'avant : "2026-10" -> "2026-09" ; "2026-01" -> "2025-12" */
function moisPrecedent(mois: string): string {
  let annee = Number(mois.slice(0, 4));
  let numero = Number(mois.slice(5, 7)) - 1;
  if (numero < 1) {
    numero = 12;
    annee = annee - 1;
  }
  let texte = String(numero);
  if (texte.length < 2) {
    texte = "0" + texte;
  }
  return annee + "-" + texte;
}

interface DepensesProps {
  onChange: () => void;
}

export function Depenses(props: DepensesProps) {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [listeMois, setListeMois] = useState<string[]>([ECOLE.moisEnCours]);
  const [mois, setMois] = useState(ECOLE.moisEnCours);
  const [message, setMessage] = useState("");

  // Formulaire
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [date, setDate] = useState(ECOLE.aujourdhui);
  const [categorie, setCategorie] = useState("Fournitures");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("Wave");
  const [erreur, setErreur] = useState("");

  function recharger() {
    setDepenses(lireDepenses());
    setListeMois(moisDisponibles());
  }

  useEffect(function () {
    recharger();
  }, []);

  function ouvrirFormulaire() {
    setDate(ECOLE.aujourdhui);
    setCategorie("Fournitures");
    setLibelle("");
    setMontant("");
    setMode("Wave");
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();
    if (libelle.trim() === "") {
      setErreur("Décrivez la dépense (ex. Facture Senelec).");
      return;
    }
    const valeur = lireMontant(montant);
    if (!isFinite(valeur) || valeur <= 0) {
      setErreur("Indiquez un montant supérieur à 0 FCFA.");
      return;
    }
    if (date === "") {
      setErreur("Indiquez la date de la dépense.");
      return;
    }
    ajouterDepense({ date: date, categorie: versCategorie(categorie), libelle: libelle.trim(), montant: valeur, mode: versMode(mode) });
    setFormulaireOuvert(false);
    setMois(moisDeLaDate(date)); // on affiche le mois de la dépense ajoutée
    recharger();
    props.onChange();
    setMessage("Dépense enregistrée : " + libelle.trim() + ", " + fcfa(valeur) + ".");
  }

  function supprimer(d: Depense) {
    if (!window.confirm("Supprimer la dépense « " + d.libelle + " » (" + fcfa(d.montant) + ") ?")) {
      return;
    }
    supprimerDepense(d.id);
    recharger();
    props.onChange();
    setMessage("Dépense supprimée.");
  }

  /* ---------- Calculs du mois choisi ---------- */

  let total = 0;
  const totalParCategorie: number[] = [];
  for (let c = 0; c < CATEGORIES_DEPENSES.length; c++) {
    totalParCategorie.push(0);
  }

  const lignes = [];
  for (let i = 0; i < depenses.length; i++) {
    const d = depenses[i];
    if (moisDeLaDate(d.date) !== mois) {
      continue;
    }
    total = total + d.montant;
    for (let c = 0; c < CATEGORIES_DEPENSES.length; c++) {
      if (CATEGORIES_DEPENSES[c] === d.categorie) {
        totalParCategorie[c] = totalParCategorie[c] + d.montant;
      }
    }

    lignes.push(
      <tr key={d.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-3 whitespace-nowrap">{dateCourte(d.date)}</td>
        <td className="px-3 py-3 font-medium">{d.libelle}</td>
        <td className="px-3 py-3">
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">{d.categorie}</span>
        </td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(d.montant)}</td>
        <td className="px-3 py-3 text-xs text-muted">{d.mode}</td>
        <td className="px-5 py-3 text-right">
          <BoutonIcone icone="trash" label={"Supprimer " + d.libelle} danger={true} onClick={function () { supprimer(d); }} />
        </td>
      </tr>,
    );
  }

  // Barres "part de chaque catégorie"
  const barres = [];
  let plusGrosse = "";
  let montantPlusGros = 0;
  for (let c = 0; c < CATEGORIES_DEPENSES.length; c++) {
    const montantCategorie = totalParCategorie[c];
    if (montantCategorie === 0) {
      continue;
    }
    if (montantCategorie > montantPlusGros) {
      montantPlusGros = montantCategorie;
      plusGrosse = CATEGORIES_DEPENSES[c];
    }
    const part = pourcent(montantCategorie, total);
    barres.push(
      <li key={CATEGORIES_DEPENSES[c]}>
        <div className="flex justify-between gap-3 text-sm">
          <span>{CATEGORIES_DEPENSES[c]}</span>
          <span className="tabular-nums">
            {fcfa(montantCategorie)} <span className="text-xs text-muted">· {part} %</span>
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-ochre" style={{ width: part + "%" }} />
        </div>
      </li>,
    );
  }

  let blocCategories = <p className="text-sm text-muted">Aucune dépense ce mois-ci.</p>;
  if (barres.length > 0) {
    blocCategories = <ul className="flex flex-col gap-3">{barres}</ul>;
  }

  let messageVide = null;
  if (lignes.length === 0) {
    messageVide = <p className="px-5 py-10 text-center text-sm text-muted">Aucune dépense enregistrée pour {moisLong(mois)}.</p>;
  }

  const optionsMois: OptionDeChoix[] = [];
  for (let i = 0; i < listeMois.length; i++) {
    optionsMois.push({ valeur: listeMois[i], texte: moisLong(listeMois[i]) });
  }

  // Comparaison avec le mois d'avant
  const precedent = moisPrecedent(mois);
  let totalPrecedent = 0;
  for (let i = 0; i < depenses.length; i++) {
    if (moisDeLaDate(depenses[i].date) === precedent) {
      totalPrecedent = totalPrecedent + depenses[i].montant;
    }
  }
  let texteEvolution = "Pas de dépense ce mois-là";
  if (totalPrecedent > 0) {
    const ecart = total - totalPrecedent;
    if (ecart > 0) {
      texteEvolution = "Ce mois-ci : " + fcfa(ecart) + " de plus";
    } else if (ecart < 0) {
      texteEvolution = "Ce mois-ci : " + fcfa(-ecart) + " de moins";
    } else {
      texteEvolution = "Pareil que ce mois-ci";
    }
  }

  let detailPlusGrosse = "—";
  if (plusGrosse !== "") {
    detailPlusGrosse = plusGrosse;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="depenses-mois" className="text-sm font-semibold">Dépenses de</Label>
        <ListeDeChoix id="depenses-mois" value={mois} onChange={setMois} options={optionsMois} className="w-48" />
        <div className="flex-1" />
        <Button type="button" size="lg" onClick={ouvrirFormulaire}>
          <Icon name="plus" />
          Ajouter une dépense
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteChiffre titre={"Total des dépenses, " + moisLong(mois)} valeur={fcfa(total)} couleur="rouge" detail={lignes.length + " dépenses"} />
        <CarteChiffre titre="Plus gros poste" valeur={detailPlusGrosse} detail={fcfa(montantPlusGros)} />
        <CarteChiffre titre={"Mois précédent (" + moisLong(precedent) + ")"} valeur={fcfa(totalPrecedent)} detail={texteEvolution} />
      </div>

      <Bandeau message={message} />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="panel min-w-0 lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Dépense</th>
                  <th className="px-3 py-3 font-medium">Catégorie</th>
                  <th className="px-3 py-3 text-right font-medium">Montant</th>
                  <th className="px-3 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">{lignes}</tbody>
            </table>
            {messageVide}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 font-display text-[15px] font-semibold">Répartition par catégorie</h2>
          {blocCategories}
        </section>
      </div>

      <Modal
        ouvert={formulaireOuvert}
        titre="Ajouter une dépense"
        onFermer={function () { setFormulaireOuvert(false); }}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={function () { setFormulaireOuvert(false); }}>
              Annuler
            </Button>
            <Button type="submit" form="form-depense" size="lg">
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="form-depense" onSubmit={quandOnValide} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="depense-libelle" className="mb-1.5 text-xs font-semibold text-muted">Dépense</Label>
            <Input id="depense-libelle" value={libelle} onChange={function (ev) { setLibelle(ev.target.value); setErreur(""); }} placeholder="ex. Facture Senelec" className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="depense-categorie" className="mb-1.5 text-xs font-semibold text-muted">Catégorie</Label>
            <ListeDeChoix id="depense-categorie" value={categorie} onChange={setCategorie} options={OPTIONS_CATEGORIES} />
          </div>
          <div>
            <Label htmlFor="depense-date" className="mb-1.5 text-xs font-semibold text-muted">Date</Label>
            <Input id="depense-date" type="date" value={date} onChange={function (ev) { setDate(ev.target.value); setErreur(""); }} className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="depense-montant" className="mb-1.5 text-xs font-semibold text-muted">Montant (FCFA)</Label>
            <Input id="depense-montant" inputMode="numeric" value={montant} onChange={function (ev) { setMontant(ev.target.value); setErreur(""); }} className="h-10 bg-surface tabular-nums" />
          </div>
          <div>
            <Label htmlFor="depense-mode" className="mb-1.5 text-xs font-semibold text-muted">Payé par</Label>
            <ListeDeChoix id="depense-mode" value={mode} onChange={setMode} options={OPTIONS_MODES} />
          </div>
          <div className="sm:col-span-2">
            <MessageErreur message={erreur} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
