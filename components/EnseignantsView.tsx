"use client";

/*
 * Administrateur : liste des enseignants, ajout et suppression.
 * Chaque enseignant reçoit un identifiant et un mot de passe pour se connecter à son espace.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSES, COURS, ENSEIGNANTS, type Cours, type Enseignant } from "@/lib/data";
import { initiales } from "@/lib/format";
import { ajouterEnseignant, identifiantDejaPris, lireCours, lireEnseignants, supprimerEnseignant } from "@/lib/stockage";
import { Avatar } from "./elements";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

const CHAMP = "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";

/** ["alif", "ba"] -> "Alif, Ba" */
function nomsDesClasses(classeIds: string[]): string {
  let texte = "";
  for (let i = 0; i < CLASSES.length; i++) {
    if (classeIds.includes(CLASSES[i].id)) {
      if (texte !== "") {
        texte = texte + ", ";
      }
      texte = texte + CLASSES[i].nom;
    }
  }
  if (texte === "") {
    return "Aucune classe";
  }
  return texte;
}

/** Nombre de cours en ligne donnés par cet enseignant. */
function nombreDeCours(cours: Cours[], enseignantId: string): number {
  let total = 0;
  for (let i = 0; i < cours.length; i++) {
    if (cours[i].enseignantId === enseignantId) {
      total = total + 1;
    }
  }
  return total;
}

export function EnseignantsView() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>(ENSEIGNANTS);
  const [cours, setCours] = useState<Cours[]>(COURS);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [message, setMessage] = useState("");

  // Champs du formulaire
  const [civilite, setCivilite] = useState("Oustaz");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [classeIds, setClasseIds] = useState<string[]>([]);
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    setEnseignants(lireEnseignants());
    setCours(lireCours());
  }, []);

  function ouvrirFormulaire() {
    setCivilite("Oustaz");
    setPrenom("");
    setNom("");
    setTelephone("");
    setClasseIds([]);
    setIdentifiant("");
    setMotDePasse("");
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
  }

  /** Coche ou décoche une classe. */
  function basculerClasse(id: string) {
    const nouvelleListe: string[] = [];
    let etaitCochee = false;
    for (let i = 0; i < classeIds.length; i++) {
      if (classeIds[i] === id) {
        etaitCochee = true; // on ne la remet pas : elle est décochée
      } else {
        nouvelleListe.push(classeIds[i]);
      }
    }
    if (!etaitCochee) {
      nouvelleListe.push(id);
    }
    setClasseIds(nouvelleListe);
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();

    if (prenom.trim() === "" || nom.trim() === "") {
      setErreur("Le prénom et le nom sont obligatoires.");
      return;
    }
    if (identifiant.trim() === "") {
      setErreur("Choisissez un identifiant de connexion.");
      return;
    }
    if (identifiant.includes(" ")) {
      setErreur("L'identifiant ne doit pas contenir d'espace.");
      return;
    }
    if (identifiantDejaPris(identifiant.trim())) {
      setErreur("Cet identifiant est déjà utilisé. Choisissez-en un autre.");
      return;
    }
    if (motDePasse.length < 4) {
      setErreur("Le mot de passe doit faire au moins 4 caractères.");
      return;
    }

    ajouterEnseignant({
      civilite: civilite,
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
      classeIds: classeIds,
      identifiant: identifiant.trim(),
      motDePasse: motDePasse,
    });

    setEnseignants(lireEnseignants());
    setFormulaireOuvert(false);
    setMessage(
      civilite + " " + prenom.trim() + " " + nom.trim() + " a été ajouté. Identifiant : " + identifiant.trim() + ", mot de passe : " + motDePasse + ".",
    );
  }

  function supprimer(enseignant: Enseignant) {
    const question = "Supprimer " + enseignant.civilite + " " + enseignant.prenom + " " + enseignant.nom + " ? Ses cours resteront dans l'emploi du temps, sans enseignant.";
    if (!window.confirm(question)) {
      return;
    }
    supprimerEnseignant(enseignant.id);
    setEnseignants(lireEnseignants());
    setMessage("Enseignant supprimé.");
  }

  /* ---------- Lignes du tableau ---------- */

  const lignes = [];
  for (let i = 0; i < enseignants.length; i++) {
    const e = enseignants[i];

    // Couleur de l'avatar : "Oustaza" = femme, "Oustaz" = homme
    let sexe: "M" | "F" = "M";
    if (e.civilite === "Oustaza") {
      sexe = "F";
    }

    lignes.push(
      <tr key={e.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar texte={initiales(e.prenom, e.nom)} sexe={sexe} />
            <div className="min-w-0">
              <p className="font-semibold">
                {e.civilite} {e.prenom} {e.nom}
              </p>
              <p className="text-xs text-muted tabular-nums">{e.telephone}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3">{nomsDesClasses(e.classeIds)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{nombreDeCours(cours, e.id)}</td>
        <td className="px-3 py-3 font-mono text-xs">{e.identifiant}</td>
        <td className="px-5 py-3 text-right">
          <button
            type="button"
            onClick={function () {
              supprimer(e);
            }}
            aria-label={"Supprimer " + e.prenom + " " + e.nom}
            className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="trash" size={16} />
          </button>
        </td>
      </tr>,
    );
  }

  let messageVide = null;
  if (enseignants.length === 0) {
    messageVide = <p className="px-5 py-10 text-center text-sm text-muted">Aucun enseignant. Cliquez sur « Ajouter un enseignant ».</p>;
  }

  // Cases à cocher pour les classes
  const casesClasses = [];
  for (let i = 0; i < CLASSES.length; i++) {
    const classe = CLASSES[i];
    const id = classe.id;
    casesClasses.push(
      <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={classeIds.includes(id)}
          onChange={function () {
            basculerClasse(id);
          }}
          className="accent-[var(--primary)]"
        />
        {classe.nom}
      </label>,
    );
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

  function quandOnChoisitLaCivilite(evenement: ChangeEvent<HTMLSelectElement>) {
    setCivilite(evenement.target.value);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={ouvrirFormulaire}>
          <Icon name="plus" />
          Ajouter un enseignant
        </Button>
      </div>

      {bandeau}

      <section className="panel min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Enseignant</th>
                <th className="px-3 py-3 font-medium">Classes</th>
                <th className="px-3 py-3 text-right font-medium">Cours en ligne</th>
                <th className="px-3 py-3 font-medium">Identifiant</th>
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

      <Modal
        ouvert={formulaireOuvert}
        titre="Ajouter un enseignant"
        onFermer={fermerFormulaire}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <Button type="submit" form="form-enseignant" size="lg">
              Ajouter
            </Button>
          </>
        }
      >
        <form id="form-enseignant" onSubmit={quandOnValide} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="ens-civilite" className="mb-1.5 text-xs font-semibold text-muted">Civilité</Label>
            <select id="ens-civilite" value={civilite} onChange={quandOnChoisitLaCivilite} className={CHAMP}>
              <option value="Oustaz">Oustaz</option>
              <option value="Oustaza">Oustaza</option>
            </select>
          </div>
          <div>
            <Label htmlFor="ens-prenom" className="mb-1.5 text-xs font-semibold text-muted">Prénom</Label>
            <Input id="ens-prenom" value={prenom} onChange={function (ev) { setPrenom(ev.target.value); }} className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="ens-nom" className="mb-1.5 text-xs font-semibold text-muted">Nom</Label>
            <Input id="ens-nom" value={nom} onChange={function (ev) { setNom(ev.target.value); }} className="h-10 bg-surface" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ens-tel" className="mb-1.5 text-xs font-semibold text-muted">Téléphone</Label>
            <Input id="ens-tel" type="tel" value={telephone} onChange={function (ev) { setTelephone(ev.target.value); }} placeholder="77 123 45 67" className="h-10 bg-surface" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-xs font-semibold text-muted">Classes</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{casesClasses}</div>
          </fieldset>
          <div>
            <Label htmlFor="ens-identifiant" className="mb-1.5 text-xs font-semibold text-muted">Identifiant de connexion</Label>
            <Input id="ens-identifiant" value={identifiant} onChange={function (ev) { setIdentifiant(ev.target.value); }} placeholder="ex. mndiaye" autoComplete="off" className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="ens-mdp" className="mb-1.5 text-xs font-semibold text-muted">Mot de passe</Label>
            <Input id="ens-mdp" value={motDePasse} onChange={function (ev) { setMotDePasse(ev.target.value); }} autoComplete="off" className="h-10 bg-surface" />
          </div>
          <div className="sm:col-span-2">{messageErreur}</div>
        </form>
      </Modal>
    </div>
  );
}
