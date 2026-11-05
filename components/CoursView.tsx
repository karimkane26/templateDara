"use client";

/*
 * Administrateur : gestion des cours en ligne (Google Meet).
 * Chaque cours revient chaque semaine. Il est visible par les parents des élèves de la classe
 * (ou par tout le monde si on choisit "Toutes les classes") et par l'enseignant.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSES, COURS, ENSEIGNANTS, type Cours, type Enseignant, type JourSemaine } from "@/lib/data";
import { JOURS, NOMS_DES_JOURS, enMinutes } from "@/lib/horaires";
import { ajouterCours, estUnLienMeet, lireCours, lireEnseignants, supprimerCours } from "@/lib/stockage";
import { EmploiDuTemps } from "./EmploiDuTemps";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

const CHAMP = "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";

export function CoursView() {
  const [cours, setCours] = useState<Cours[]>(COURS);
  const [enseignants, setEnseignants] = useState<Enseignant[]>(ENSEIGNANTS);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [message, setMessage] = useState("");

  // Champs du formulaire
  const [titre, setTitre] = useState("");
  const [classeId, setClasseId] = useState("toutes");
  const [enseignantId, setEnseignantId] = useState("");
  const [jour, setJour] = useState("1");
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("10:00");
  const [lienMeet, setLienMeet] = useState("");
  const [erreur, setErreur] = useState("");

  // Au démarrage : on lit les cours et les enseignants enregistrés dans le navigateur.
  useEffect(function () {
    setCours(lireCours());
    setEnseignants(lireEnseignants());
  }, []);

  function ouvrirFormulaire() {
    setTitre("");
    setClasseId("toutes");
    if (enseignants.length > 0) {
      setEnseignantId(enseignants[0].id);
    } else {
      setEnseignantId("");
    }
    setJour("1");
    setHeureDebut("09:00");
    setHeureFin("10:00");
    setLienMeet("");
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();

    // Vérifications, une par une
    if (titre.trim() === "") {
      setErreur("Donnez un titre au cours.");
      return;
    }
    if (enseignantId === "") {
      setErreur("Ajoutez d'abord un enseignant (page Enseignants).");
      return;
    }
    if (enMinutes(heureFin) <= enMinutes(heureDebut)) {
      setErreur("L'heure de fin doit être après l'heure de début.");
      return;
    }
    const lien = lienMeet.trim();
    if (!estUnLienMeet(lien)) {
      setErreur("Le lien doit commencer par https://meet.google.com/");
      return;
    }

    ajouterCours({
      titre: titre.trim(),
      classeId: classeId,
      enseignantId: enseignantId,
      jour: Number(jour) as JourSemaine,
      heureDebut: heureDebut,
      heureFin: heureFin,
      lienMeet: lien,
    });

    setCours(lireCours());
    setFormulaireOuvert(false);
    setMessage("Cours « " + titre.trim() + " » ajouté. Il est maintenant visible par les élèves concernés.");
  }

  function supprimer(id: string) {
    if (!window.confirm("Supprimer ce cours de l'emploi du temps ?")) {
      return;
    }
    supprimerCours(id);
    setCours(lireCours());
    setMessage("Cours supprimé.");
  }

  /* ---------- Listes pour les menus déroulants ---------- */

  const optionsClasses = [<option key="toutes" value="toutes">Toutes les classes</option>];
  for (let i = 0; i < CLASSES.length; i++) {
    optionsClasses.push(
      <option key={CLASSES[i].id} value={CLASSES[i].id}>
        Classe {CLASSES[i].nom}
      </option>,
    );
  }

  const optionsEnseignants = [];
  for (let i = 0; i < enseignants.length; i++) {
    const e = enseignants[i];
    optionsEnseignants.push(
      <option key={e.id} value={e.id}>
        {e.civilite} {e.prenom} {e.nom}
      </option>,
    );
  }

  const optionsJours = [];
  for (let i = 0; i < JOURS.length; i++) {
    optionsJours.push(
      <option key={JOURS[i]} value={String(JOURS[i])}>
        {NOMS_DES_JOURS[JOURS[i]]}
      </option>,
    );
  }

  /* ---------- Morceaux d'affichage ---------- */

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

  /**
   * Fabrique la fonction "onChange" d'un champ.
   * changer(setTitre) donne une fonction qui, à chaque frappe, range le texte dans "titre"
   * et efface le message d'erreur. Ça évite d'écrire 7 fonctions presque identiques.
   */
  function changer(setter: (valeur: string) => void) {
    return function (evenement: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
      setter(evenement.target.value);
      setErreur("");
    };
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Créez la réunion sur <span className="font-medium text-ink">meet.google.com</span>, copiez son lien, puis ajoutez le cours ici. Les parents et
          l&apos;enseignant le verront dans leur espace.
        </p>
        <Button type="button" size="lg" onClick={ouvrirFormulaire}>
          <Icon name="plus" />
          Ajouter un cours
        </Button>
      </div>

      {bandeau}

      <EmploiDuTemps cours={cours} enseignants={enseignants} onSupprimer={supprimer} />

      <Modal
        ouvert={formulaireOuvert}
        titre="Ajouter un cours en ligne"
        onFermer={fermerFormulaire}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <Button type="submit" form="form-cours" size="lg">
              Ajouter le cours
            </Button>
          </>
        }
      >
        <form id="form-cours" onSubmit={quandOnValide} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cours-titre" className="mb-1.5 text-xs font-semibold text-muted">Titre du cours</Label>
            <Input id="cours-titre" value={titre} onChange={changer(setTitre)} placeholder="ex. Mémorisation, hizb 1 à 15" className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="cours-classe" className="mb-1.5 text-xs font-semibold text-muted">Pour qui ?</Label>
            <select id="cours-classe" value={classeId} onChange={changer(setClasseId)} className={CHAMP}>
              {optionsClasses}
            </select>
          </div>
          <div>
            <Label htmlFor="cours-enseignant" className="mb-1.5 text-xs font-semibold text-muted">Enseignant</Label>
            <select id="cours-enseignant" value={enseignantId} onChange={changer(setEnseignantId)} className={CHAMP}>
              {optionsEnseignants}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cours-jour" className="mb-1.5 text-xs font-semibold text-muted">Jour (chaque semaine)</Label>
            <select id="cours-jour" value={jour} onChange={changer(setJour)} className={CHAMP}>
              {optionsJours}
            </select>
          </div>
          <div>
            <Label htmlFor="cours-debut" className="mb-1.5 text-xs font-semibold text-muted">Début</Label>
            <Input id="cours-debut" type="time" value={heureDebut} onChange={changer(setHeureDebut)} className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="cours-fin" className="mb-1.5 text-xs font-semibold text-muted">Fin</Label>
            <Input id="cours-fin" type="time" value={heureFin} onChange={changer(setHeureFin)} className="h-10 bg-surface" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cours-lien" className="mb-1.5 text-xs font-semibold text-muted">Lien Google Meet</Label>
            <Input
              id="cours-lien"
              type="url"
              value={lienMeet}
              onChange={changer(setLienMeet)}
              placeholder="https://meet.google.com/abc-defg-hij"
              className="h-10 bg-surface"
            />
          </div>
          <div className="sm:col-span-2">{messageErreur}</div>
        </form>
      </Modal>
    </div>
  );
}
