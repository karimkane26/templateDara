"use client";

/*
 * Administrateur : les enseignements (matières) de l'école.
 * Chaque cours en ligne peut être rattaché à une matière.
 * Pour chaque matière, on voit les cours et les enseignants qui la donnent.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURS, ENSEIGNANTS, ENSEIGNEMENTS, type Cours, type Enseignant, type Enseignement } from "@/lib/data";
import { NOMS_DES_JOURS, heureLisible } from "@/lib/horaires";
import {
  ajouterEnseignement,
  lireCours,
  lireEnseignants,
  lireEnseignements,
  modifierEnseignement,
  supprimerEnseignement,
} from "@/lib/stockage";
import { nomDesEleves, nomEnseignant } from "./EmploiDuTemps";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

export function EnseignementsView() {
  const [enseignements, setEnseignements] = useState<Enseignement[]>(ENSEIGNEMENTS);
  const [cours, setCours] = useState<Cours[]>(COURS);
  const [enseignants, setEnseignants] = useState<Enseignant[]>(ENSEIGNANTS);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [idEnModification, setIdEnModification] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(function () {
    setEnseignements(lireEnseignements());
    setCours(lireCours());
    setEnseignants(lireEnseignants());
  }, []);

  function ouvrirAjout() {
    setIdEnModification("");
    setNom("");
    setDescription("");
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(enseignement: Enseignement) {
    setIdEnModification(enseignement.id);
    setNom(enseignement.nom);
    setDescription(enseignement.description);
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();
    if (nom.trim() === "") {
      setErreur("Donnez un nom à l'enseignement.");
      return;
    }

    const infos = { nom: nom.trim(), description: description.trim() };
    if (idEnModification === "") {
      ajouterEnseignement(infos);
      setMessage("Enseignement « " + infos.nom + " » ajouté. Vous pouvez maintenant le choisir pour un cours en ligne.");
    } else {
      modifierEnseignement(idEnModification, infos);
      setMessage("Enseignement « " + infos.nom + " » modifié.");
    }
    setEnseignements(lireEnseignements());
    setFormulaireOuvert(false);
  }

  function supprimer(enseignement: Enseignement) {
    if (!window.confirm("Supprimer l'enseignement « " + enseignement.nom + " » ? Ses cours resteront dans l'emploi du temps, sans matière.")) {
      return;
    }
    supprimerEnseignement(enseignement.id);
    setEnseignements(lireEnseignements());
    setMessage("Enseignement supprimé.");
  }

  /* ---------- Une carte par enseignement ---------- */

  const cartes = [];
  for (let i = 0; i < enseignements.length; i++) {
    const matiere = enseignements[i];

    // Les cours de cette matière, et les enseignants qui la donnent (sans doublon)
    const lignesCours = [];
    const nomsEnseignants: string[] = [];
    for (let c = 0; c < cours.length; c++) {
      const unCours = cours[c];
      if (unCours.enseignementId !== matiere.id) {
        continue;
      }
      lignesCours.push(
        <li key={unCours.id} className="flex flex-wrap justify-between gap-x-3 text-sm">
          <span className="font-medium">{unCours.titre}</span>
          <span className="text-xs text-muted">
            {NOMS_DES_JOURS[unCours.jour]} {heureLisible(unCours.heureDebut)} · {nomDesEleves(unCours.classeId)}
          </span>
        </li>,
      );
      const nomProf = nomEnseignant(enseignants, unCours.enseignantId);
      if (!nomsEnseignants.includes(nomProf)) {
        nomsEnseignants.push(nomProf);
      }
    }

    let blocCours = <p className="text-sm text-muted">Aucun cours en ligne pour cette matière.</p>;
    if (lignesCours.length > 0) {
      blocCours = <ul className="flex flex-col gap-1.5">{lignesCours}</ul>;
    }

    let texteEnseignants = "Aucun enseignant pour le moment";
    if (nomsEnseignants.length > 0) {
      texteEnseignants = nomsEnseignants.join(", ");
    }

    cartes.push(
      <article key={matiere.id} className="panel flex flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Icon name="layers" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold">{matiere.nom}</h2>
            <p className="mt-0.5 text-sm text-muted">{matiere.description}</p>
          </div>
          <button
            type="button"
            onClick={function () {
              ouvrirModification(matiere);
            }}
            aria-label={"Modifier " + matiere.nom}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            onClick={function () {
              supprimer(matiere);
            }}
            aria-label={"Supprimer " + matiere.nom}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
        <div className="mt-4 flex-1 border-t border-line pt-3">
          <p className="mb-2 text-xs font-semibold text-muted">
            {lignesCours.length} cours en ligne · {texteEnseignants}
          </p>
          {blocCours}
        </div>
      </article>,
    );
  }

  let messageVide = null;
  if (enseignements.length === 0) {
    messageVide = <p className="panel p-5 text-sm text-muted">Aucun enseignement. Cliquez sur « Ajouter un enseignement ».</p>;
  }

  let bandeau = null;
  if (message !== "") {
    bandeau = (
      <div role="status" className="flex items-center gap-3 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
        <Icon name="check" />
        <span className="flex-1">{message}</span>
      </div>
    );
  }

  let messageErreur = null;
  if (erreur !== "") {
    messageErreur = <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{erreur}</p>;
  }

  let titreFenetre = "Ajouter un enseignement";
  let texteBouton = "Ajouter";
  if (idEnModification !== "") {
    titreFenetre = "Modifier l'enseignement";
    texteBouton = "Enregistrer";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={ouvrirAjout}>
          <Icon name="plus" />
          Ajouter un enseignement
        </Button>
      </div>

      {bandeau}

      <div className="grid gap-4 md:grid-cols-2">{cartes}</div>
      {messageVide}

      <Modal
        ouvert={formulaireOuvert}
        titre={titreFenetre}
        onFermer={fermerFormulaire}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <Button type="submit" form="form-enseignement" size="lg">
              {texteBouton}
            </Button>
          </>
        }
      >
        <form id="form-enseignement" onSubmit={quandOnValide} className="grid gap-4">
          <div>
            <Label htmlFor="matiere-nom" className="mb-1.5 text-xs font-semibold text-muted">Nom</Label>
            <Input id="matiere-nom" value={nom} onChange={function (ev) { setNom(ev.target.value); setErreur(""); }} placeholder="ex. Tajwid" className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="matiere-description" className="mb-1.5 text-xs font-semibold text-muted">Description</Label>
            <Textarea
              id="matiere-description"
              value={description}
              onChange={function (ev) {
                setDescription(ev.target.value);
              }}
              placeholder="Ce que les élèves apprennent dans cette matière"
              className="min-h-24 bg-surface"
            />
          </div>
          {messageErreur}
        </form>
      </Modal>
    </div>
  );
}
