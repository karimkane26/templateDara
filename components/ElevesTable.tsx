"use client";

/*
 * Tableau des élèves, avec une recherche et deux filtres (classe, statut de la mensualité).
 */

import { useEffect, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { CLASSES, ELEVES, MOT_DE_PASSE_PARENT, classeDe, resteAPayer, type Eleve } from "@/lib/data";
import { fcfa, initiales } from "@/lib/format";
import { chiffresSeulement, lireEleves, supprimerEleve } from "@/lib/stockage";
import { AjoutEleve } from "./AjoutEleve";
import { Icon } from "./Icon";
import { ListeDeChoix, type OptionDeChoix } from "./ListeDeChoix";
import { Avatar, StatutBadge } from "./elements";

const CHAMP = "h-10 rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";

// Les choix du filtre "Mensualité"
const OPTIONS_STATUT: OptionDeChoix[] = [
  { valeur: "tous", texte: "Toutes les mensualités" },
  { valeur: "paye", texte: "Payé" },
  { valeur: "partiel", texte: "Partiel" },
  { valeur: "impaye", texte: "Impayé" },
];

interface ElevesTableProps {
  rechercheInitiale?: string;
}

/** Vrai si l'élève correspond à la recherche et aux filtres choisis. */
function eleveCorrespond(eleve: Eleve, recherche: string, classe: string, statut: string): boolean {
  if (classe !== "toutes" && eleve.classeId !== classe) {
    return false;
  }
  if (statut !== "tous" && eleve.statutMois !== statut) {
    return false;
  }

  const texteCherche = recherche.trim().toLowerCase();
  if (texteCherche === "") {
    return true;
  }

  // On cherche dans le prénom, le nom, le parent, le matricule et le téléphone.
  const texteDeLEleve = (
    eleve.prenom + " " + eleve.nom + " " + eleve.parent + " " + eleve.matricule + " " + eleve.telephoneParent
  ).toLowerCase();

  return texteDeLEleve.includes(texteCherche);
}

export function ElevesTable(props: ElevesTableProps) {
  let rechercheDeDepart = "";
  if (props.rechercheInitiale) {
    rechercheDeDepart = props.rechercheInitiale;
  }

  const [recherche, setRecherche] = useState(rechercheDeDepart);
  const [classe, setClasse] = useState("toutes");
  const [statut, setStatut] = useState("tous");

  // La liste des élèves (relue dans le navigateur, car l'administrateur peut en ajouter)
  const [eleves, setEleves] = useState<Eleve[]>(ELEVES);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  // L'élève qu'on modifie (null = on ajoute un nouvel élève)
  const [eleveEnModification, setEleveEnModification] = useState<Eleve | null>(null);
  const [message, setMessage] = useState("");

  useEffect(function () {
    setEleves(lireEleves());
  }, []);

  function ouvrirAjout() {
    setMessage("");
    setEleveEnModification(null);
    setAjoutOuvert(true);
  }

  function ouvrirModification(eleve: Eleve) {
    setMessage("");
    setEleveEnModification(eleve);
    setAjoutOuvert(true);
  }

  function quandUnEleveEstModifie(eleve: Eleve) {
    setEleves(lireEleves());
    setAjoutOuvert(false);
    setMessage("La fiche de " + eleve.prenom + " " + eleve.nom + " (" + eleve.matricule + ") a été modifiée.");
  }

  function fermerAjout() {
    setAjoutOuvert(false);
  }

  function quandUnEleveEstAjoute(eleve: Eleve) {
    setEleves(lireEleves());
    setAjoutOuvert(false);
    setMessage(
      eleve.prenom + " " + eleve.nom + " a été inscrit (" + eleve.matricule + "). Le parent peut se connecter avec l'identifiant " +
        chiffresSeulement(eleve.telephoneParent) + " et son mot de passe (par défaut " + MOT_DE_PASSE_PARENT + ").",
    );
  }

  function supprimer(eleve: Eleve) {
    if (!window.confirm("Retirer " + eleve.prenom + " " + eleve.nom + " de la liste des élèves ?")) {
      return;
    }
    supprimerEleve(eleve.id);
    setEleves(lireEleves());
    setMessage(eleve.prenom + " " + eleve.nom + " a été retiré de la liste.");
  }

  function quandOnTapeLaRecherche(evenement: ChangeEvent<HTMLInputElement>) {
    setRecherche(evenement.target.value);
  }

  // 1. On garde seulement les élèves qui correspondent aux filtres.
  const elevesAffiches: Eleve[] = [];
  for (let i = 0; i < eleves.length; i++) {
    if (eleveCorrespond(eleves[i], recherche, classe, statut)) {
      elevesAffiches.push(eleves[i]);
    }
  }

  // 2. On fabrique la liste des classes pour le menu déroulant.
  const optionsClasses: OptionDeChoix[] = [{ valeur: "toutes", texte: "Toutes les classes" }];
  for (let i = 0; i < CLASSES.length; i++) {
    optionsClasses.push({ valeur: CLASSES[i].id, texte: "Classe " + CLASSES[i].nom });
  }

  // 3. On fabrique une ligne de tableau par élève.
  const lignes = [];
  for (let i = 0; i < elevesAffiches.length; i++) {
    const eleve = elevesAffiches[i];
    const classeDeLEleve = classeDe(eleve);

    // Colonne "Progression"
    let progression = null;
    if (eleve.hizbActuel === 0) {
      progression = <span className="text-muted">Lecture</span>;
    } else {
      const largeurBarre = (eleve.hizbActuel / 60) * 100 + "%";
      progression = (
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-primary" style={{ width: largeurBarre }} />
          </span>
          <span className="tabular-nums">Hizb {eleve.hizbActuel}</span>
        </span>
      );
    }

    // Présence en rouge si elle est en dessous de 85 %
    let stylePresence = "";
    if (eleve.tauxPresence < 85) {
      stylePresence = "font-semibold text-danger";
    }

    // "reste ..." sous le badge si l'élève n'a pas tout payé
    let reste = null;
    if (eleve.statutMois !== "paye") {
      reste = <p className="mt-1 text-xs text-muted tabular-nums">reste {fcfa(resteAPayer(eleve))}</p>;
    }

    lignes.push(
      <tr key={eleve.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar texte={initiales(eleve.prenom, eleve.nom)} sexe={eleve.sexe} />
            <div className="min-w-0">
              <p className="font-semibold">
                {eleve.prenom} {eleve.nom}
              </p>
              <p className="text-xs text-muted tabular-nums">{eleve.matricule}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">{classeDeLEleve.nom}</td>
        <td className="px-3 py-3 whitespace-nowrap">{progression}</td>
        <td className={"px-3 py-3 text-right tabular-nums " + stylePresence}>{eleve.tauxPresence} %</td>
        <td className="px-3 py-3">
          <p className="whitespace-nowrap">{eleve.parent}</p>
          <p className="text-xs whitespace-nowrap text-muted tabular-nums">{eleve.telephoneParent}</p>
        </td>
        <td className="px-3 py-3 text-right">
          <StatutBadge statut={eleve.statutMois} />
          {reste}
        </td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={function () {
              ouvrirModification(eleve);
            }}
            aria-label={"Modifier " + eleve.prenom + " " + eleve.nom}
            className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            onClick={function () {
              supprimer(eleve);
            }}
            aria-label={"Retirer " + eleve.prenom + " " + eleve.nom}
            className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="trash" size={16} />
          </button>
        </td>
      </tr>,
    );
  }

  // Message si aucun élève ne correspond
  let messageVide = null;
  if (elevesAffiches.length === 0) {
    messageVide = (
      <p className="px-5 py-10 text-center text-sm text-muted">
        Aucun élève ne correspond à ces filtres. Essayez un autre nom ou choisissez « Toutes les classes ».
      </p>
    );
  }

  // "1 élève affiché" ou "12 élèves affichés"
  let texteCompteur = elevesAffiches.length + " élève affiché sur " + eleves.length;
  if (elevesAffiches.length > 1) {
    texteCompteur = elevesAffiches.length + " élèves affichés sur " + eleves.length;
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={ouvrirAjout}>
          <Icon name="plus" />
          Ajouter un élève
        </Button>
      </div>

      {bandeau}

      <AjoutEleve
        ouvert={ajoutOuvert}
        eleve={eleveEnModification}
        onFermer={fermerAjout}
        onAjoute={quandUnEleveEstAjoute}
        onModifie={quandUnEleveEstModifie}
      />

    <section className="panel min-w-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative min-w-[200px] flex-1">
          <label htmlFor="filtre-eleve" className="sr-only">
            Rechercher
          </label>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            id="filtre-eleve"
            value={recherche}
            onChange={quandOnTapeLaRecherche}
            placeholder="Nom, parent, matricule ou téléphone"
            className={CHAMP + " w-full pl-10"}
          />
        </div>

        <ListeDeChoix id="filtre-classe" label="Classe" value={classe} onChange={setClasse} options={optionsClasses} className="w-48" />
        <ListeDeChoix id="filtre-statut" label="Mensualité" value={statut} onChange={setStatut} options={OPTIONS_STATUT} className="w-52" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Élève</th>
              <th className="px-3 py-3 font-medium">Classe</th>
              <th className="px-3 py-3 font-medium">Progression</th>
              <th className="px-3 py-3 text-right font-medium">Présence</th>
              <th className="px-3 py-3 font-medium">Parent</th>
              <th className="px-3 py-3 text-right font-medium">Octobre</th>
              <th className="px-5 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{lignes}</tbody>
        </table>
        {messageVide}
      </div>

      <p className="border-t border-line px-5 py-3 text-xs text-muted">{texteCompteur}</p>
    </section>
    </div>
  );
}
