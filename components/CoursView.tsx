"use client";

/*
 * Administrateur : gestion des cours en ligne (Google Meet).
 * Chaque cours revient chaque semaine. Tout le monde (enseignants et parents) voit l'emploi du temps
 * complet ; chacun peut aussi n'afficher que les cours qui le concernent.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSES, COURS, ENSEIGNANTS, ENSEIGNEMENTS, type Cours, type Enseignant, type Enseignement, type JourSemaine } from "@/lib/data";
import { JOURS, NOMS_DES_JOURS, enMinutes } from "@/lib/horaires";
import { ajouterCours, estUnLienMeet, lireCours, lireEnseignants, lireEnseignements, modifierCours, supprimerCours } from "@/lib/stockage";
import { EmploiDuTemps } from "./EmploiDuTemps";
import { Icon } from "./Icon";
import { ListeDeChoix, type OptionDeChoix } from "./ListeDeChoix";
import { Modal } from "./Modal";


export function CoursView() {
  const [cours, setCours] = useState<Cours[]>(COURS);
  const [enseignants, setEnseignants] = useState<Enseignant[]>(ENSEIGNANTS);
  const [enseignements, setEnseignements] = useState<Enseignement[]>(ENSEIGNEMENTS);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [message, setMessage] = useState("");
  // Id du cours qu'on modifie, ou "" quand on en ajoute un nouveau
  const [idEnModification, setIdEnModification] = useState("");

  // Champs du formulaire
  const [titre, setTitre] = useState("");
  const [classeId, setClasseId] = useState("toutes");
  const [enseignantId, setEnseignantId] = useState("");
  const [enseignementId, setEnseignementId] = useState("");
  const [jour, setJour] = useState("1");
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("10:00");
  const [lienMeet, setLienMeet] = useState("");
  const [erreur, setErreur] = useState("");

  // Au démarrage : on lit les cours et les enseignants enregistrés dans le navigateur.
  useEffect(function () {
    setCours(lireCours());
    setEnseignants(lireEnseignants());
    setEnseignements(lireEnseignements());
  }, []);

  function ouvrirFormulaire() {
    setIdEnModification("");
    setTitre("");
    setClasseId("toutes");
    if (enseignants.length > 0) {
      setEnseignantId(enseignants[0].id);
    } else {
      setEnseignantId("");
    }
    setEnseignementId("");
    setJour("1");
    setHeureDebut("09:00");
    setHeureFin("10:00");
    setLienMeet("");
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  /** Ouvre le formulaire rempli avec les informations du cours, pour le modifier. */
  function ouvrirModification(cours: Cours) {
    setIdEnModification(cours.id);
    setTitre(cours.titre);
    setClasseId(cours.classeId);
    setEnseignantId(cours.enseignantId);
    if (cours.enseignementId) {
      setEnseignementId(cours.enseignementId);
    } else {
      setEnseignementId("");
    }
    setJour(String(cours.jour));
    setHeureDebut(cours.heureDebut);
    setHeureFin(cours.heureFin);
    setLienMeet(cours.lienMeet);
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

    const infos = {
      titre: titre.trim(),
      classeId: classeId,
      enseignantId: enseignantId,
      enseignementId: enseignementId,
      jour: Number(jour) as JourSemaine,
      heureDebut: heureDebut,
      heureFin: heureFin,
      lienMeet: lien,
    };

    if (idEnModification === "") {
      ajouterCours(infos);
      setMessage("Cours « " + infos.titre + " » ajouté. Il est maintenant visible par tous les enseignants et les parents.");
    } else {
      modifierCours(idEnModification, infos);
      setMessage("Cours « " + infos.titre + " » modifié.");
    }

    setCours(lireCours());
    setFormulaireOuvert(false);
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

  const optionsClasses: OptionDeChoix[] = [{ valeur: "toutes", texte: "Toutes les classes" }];
  for (let i = 0; i < CLASSES.length; i++) {
    optionsClasses.push({ valeur: CLASSES[i].id, texte: "Classe " + CLASSES[i].nom });
  }

  const optionsEnseignants: OptionDeChoix[] = [];
  for (let i = 0; i < enseignants.length; i++) {
    const e = enseignants[i];
    optionsEnseignants.push({ valeur: e.id, texte: e.civilite + " " + e.prenom + " " + e.nom });
  }

  const optionsEnseignements: OptionDeChoix[] = [{ valeur: "", texte: "Aucune matière" }];
  for (let i = 0; i < enseignements.length; i++) {
    optionsEnseignements.push({ valeur: enseignements[i].id, texte: enseignements[i].nom });
  }

  // Titre de la fenêtre et texte du bouton : ajout ou modification
  let titreFenetre = "Ajouter un cours en ligne";
  let texteBouton = "Ajouter le cours";
  if (idEnModification !== "") {
    titreFenetre = "Modifier le cours";
    texteBouton = "Enregistrer";
  }

  const optionsJours: OptionDeChoix[] = [];
  for (let i = 0; i < JOURS.length; i++) {
    optionsJours.push({ valeur: String(JOURS[i]), texte: NOMS_DES_JOURS[JOURS[i]] });
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
    return function (evenement: ChangeEvent<HTMLInputElement>) {
      setter(evenement.target.value);
      setErreur("");
    };
  }


  /** Pareil pour une liste déroulante : la valeur choisie arrive directement (pas un événement). */
  function choisir(setter: (valeur: string) => void) {
    return function (valeur: string) {
      setter(valeur);
      setErreur("");
    };
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Créez la réunion sur <span className="font-medium text-ink">meet.google.com</span>, copiez son lien, puis ajoutez le cours ici. Tous les
          enseignants et tous les parents le verront dans leur espace.
        </p>
        <Button type="button" size="lg" onClick={ouvrirFormulaire}>
          <Icon name="plus" />
          Ajouter un cours
        </Button>
      </div>

      {bandeau}

      <EmploiDuTemps cours={cours} enseignants={enseignants} enseignements={enseignements} onModifier={ouvrirModification} onSupprimer={supprimer} />

      <Modal
        ouvert={formulaireOuvert}
        titre={titreFenetre}
        onFermer={fermerFormulaire}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <Button type="submit" form="form-cours" size="lg">
              {texteBouton}
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
            <ListeDeChoix id="cours-classe" value={classeId} onChange={choisir(setClasseId)} options={optionsClasses} />
          </div>
          <div>
            <Label htmlFor="cours-enseignant" className="mb-1.5 text-xs font-semibold text-muted">Enseignant</Label>
            <ListeDeChoix id="cours-enseignant" value={enseignantId} onChange={choisir(setEnseignantId)} options={optionsEnseignants} />
          </div>
          <div>
            <Label htmlFor="cours-matiere" className="mb-1.5 text-xs font-semibold text-muted">Enseignement (matière)</Label>
            <ListeDeChoix id="cours-matiere" value={enseignementId} onChange={choisir(setEnseignementId)} options={optionsEnseignements} />
          </div>
          <div>
            <Label htmlFor="cours-jour" className="mb-1.5 text-xs font-semibold text-muted">Jour (chaque semaine)</Label>
            <ListeDeChoix id="cours-jour" value={jour} onChange={choisir(setJour)} options={optionsJours} />
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
