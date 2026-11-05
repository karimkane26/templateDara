"use client";

/*
 * Administrateur : fenêtre "Ajouter un élève" (ou "Modifier l'élève" si on lui donne un élève).
 * Le parent pourra ensuite se connecter avec son numéro de téléphone.
 * Si le numéro est celui d'un parent déjà enregistré, son nom est rempli automatiquement.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSES, type Eleve, type Parent } from "@/lib/data";
import { ajouterEleve, chiffresSeulement, lireParents, modifierEleve, trouverParentParTelephone } from "@/lib/stockage";
import { ListeDeChoix, type OptionDeChoix } from "./ListeDeChoix";
import { Modal } from "./Modal";

interface AjoutEleveProps {
  ouvert: boolean;
  onFermer: () => void;
  onAjoute: (eleve: Eleve) => void; // appelé une fois l'élève enregistré
  eleve?: Eleve | null; // si on le donne : on modifie cet élève au lieu d'en ajouter un
  onModifie?: (eleve: Eleve) => void; // appelé une fois la modification enregistrée
}

/** Le premier hizb du niveau de la classe (0 pour la classe Alif). */
function hizbDeDepart(classeId: string): number {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return CLASSES[i].hizbDebut;
    }
  }
  return 0;
}

export function AjoutEleve(props: AjoutEleveProps) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [sexe, setSexe] = useState("M");
  const [classeId, setClasseId] = useState(CLASSES[0].id);
  const [parent, setParent] = useState("");
  const [telephone, setTelephone] = useState("");
  const [hizb, setHizb] = useState("0");
  const [erreur, setErreur] = useState("");
  const [parents, setParents] = useState<Parent[]>([]);

  const ouvert = props.ouvert;
  let eleveAModifier: Eleve | null = null;
  if (props.eleve) {
    eleveAModifier = props.eleve;
  }

  // À chaque ouverture : on vide le formulaire, ou on le remplit avec l'élève à modifier.
  useEffect(
    function () {
      if (!ouvert) {
        return;
      }
      setParents(lireParents());
      setErreur("");
      if (eleveAModifier !== null) {
        setPrenom(eleveAModifier.prenom);
        setNom(eleveAModifier.nom);
        setSexe(eleveAModifier.sexe);
        setClasseId(eleveAModifier.classeId);
        setParent(eleveAModifier.parent);
        setTelephone(eleveAModifier.telephoneParent);
        setHizb(String(eleveAModifier.hizbActuel));
      } else {
        setPrenom("");
        setNom("");
        setSexe("M");
        setClasseId(CLASSES[0].id);
        setParent("");
        setTelephone("");
        setHizb(String(hizbDeDepart(CLASSES[0].id)));
      }
    },
    [ouvert, eleveAModifier],
  );

  // Le parent déjà enregistré avec ce numéro (s'il existe)
  let parentConnu: Parent | undefined = undefined;
  if (chiffresSeulement(telephone).length === 9) {
    parentConnu = trouverParentParTelephone(parents, telephone);
  }

  function quandOnTapeLeTelephone(evenement: ChangeEvent<HTMLInputElement>) {
    const numero = evenement.target.value;
    setTelephone(numero);
    setErreur("");

    // Numéro d'un parent connu : on remplit son nom automatiquement
    if (chiffresSeulement(numero).length === 9) {
      const trouve = trouverParentParTelephone(parents, numero);
      if (trouve !== undefined) {
        setParent(trouve.prenom + " " + trouve.nom);
      }
    }
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();

    if (prenom.trim() === "" || nom.trim() === "") {
      setErreur("Le prénom et le nom de l'élève sont obligatoires.");
      return;
    }
    if (parent.trim() === "") {
      setErreur("Indiquez le nom du parent.");
      return;
    }
    // Un numéro sénégalais a 9 chiffres (77 123 45 67)
    if (chiffresSeulement(telephone).length !== 9) {
      setErreur("Le téléphone du parent doit avoir 9 chiffres, par exemple 77 123 45 67.");
      return;
    }

    const hizbChoisi = Number(hizb);
    if (!Number.isInteger(hizbChoisi) || hizbChoisi < 0 || hizbChoisi > 60) {
      setErreur("Le hizb doit être un nombre entier entre 0 et 60.");
      return;
    }

    let sexeChoisi: "M" | "F" = "M";
    if (sexe === "F") {
      sexeChoisi = "F";
    }

    const infos = {
      prenom: prenom.trim(),
      nom: nom.trim(),
      sexe: sexeChoisi,
      classeId: classeId,
      hizbActuel: hizbChoisi,
      parent: parent.trim(),
      telephoneParent: telephone.trim(),
    };

    if (eleveAModifier !== null) {
      modifierEleve(eleveAModifier.id, infos);
      if (props.onModifie) {
        props.onModifie(eleveAModifier);
      }
      return;
    }

    const eleve = ajouterEleve(infos);
    props.onAjoute(eleve);
  }

  const optionsClasses: OptionDeChoix[] = [];
  for (let i = 0; i < CLASSES.length; i++) {
    optionsClasses.push({ valeur: CLASSES[i].id, texte: "Classe " + CLASSES[i].nom + " (" + CLASSES[i].niveau + ")" });
  }

  const optionsSexe: OptionDeChoix[] = [
    { valeur: "M", texte: "Garçon" },
    { valeur: "F", texte: "Fille" },
  ];

  let messageErreur = null;
  if (erreur !== "") {
    messageErreur = <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{erreur}</p>;
  }

  function quandOnChoisitLaClasse(valeur: string) {
    setClasseId(valeur);
    // Pour un nouvel élève, on propose le premier hizb du niveau de la classe
    if (eleveAModifier === null) {
      setHizb(String(hizbDeDepart(valeur)));
    }
  }

  let titreFenetre = "Ajouter un élève";
  let texteBouton = "Ajouter l'élève";
  if (eleveAModifier !== null) {
    titreFenetre = "Modifier l'élève";
    texteBouton = "Enregistrer";
  }

  // Petit texte sous le téléphone
  let aideTelephone = "Ce numéro sert d'identifiant au parent pour se connecter à son espace.";
  if (parentConnu !== undefined) {
    aideTelephone = "Parent déjà enregistré : " + parentConnu.prenom + " " + parentConnu.nom + ". L'élève sera ajouté à ses enfants.";
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={titreFenetre}
      onFermer={props.onFermer}
      pied={
        <>
          <Button type="button" variant="outline" size="lg" onClick={props.onFermer}>
            Annuler
          </Button>
          <Button type="submit" form="form-eleve" size="lg">
            {texteBouton}
          </Button>
        </>
      }
    >
      <form id="form-eleve" onSubmit={quandOnValide} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="eleve-prenom" className="mb-1.5 text-xs font-semibold text-muted">Prénom</Label>
          <Input id="eleve-prenom" value={prenom} onChange={function (ev) { setPrenom(ev.target.value); }} className="h-10 bg-surface" />
        </div>
        <div>
          <Label htmlFor="eleve-nom" className="mb-1.5 text-xs font-semibold text-muted">Nom</Label>
          <Input id="eleve-nom" value={nom} onChange={function (ev) { setNom(ev.target.value); }} className="h-10 bg-surface" />
        </div>
        <div>
          <Label htmlFor="eleve-sexe" className="mb-1.5 text-xs font-semibold text-muted">Sexe</Label>
          <ListeDeChoix id="eleve-sexe" value={sexe} onChange={setSexe} options={optionsSexe} />
        </div>
        <div>
          <Label htmlFor="eleve-classe" className="mb-1.5 text-xs font-semibold text-muted">Classe</Label>
          <ListeDeChoix id="eleve-classe" value={classeId} onChange={quandOnChoisitLaClasse} options={optionsClasses} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eleve-hizb" className="mb-1.5 text-xs font-semibold text-muted">Hizb actuel (0 = apprend à lire)</Label>
          <Input id="eleve-hizb" type="number" min={0} max={60} value={hizb} onChange={function (ev) { setHizb(ev.target.value); setErreur(""); }} className="h-10 bg-surface" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eleve-tel" className="mb-1.5 text-xs font-semibold text-muted">Téléphone du parent</Label>
          <Input id="eleve-tel" type="tel" value={telephone} onChange={quandOnTapeLeTelephone} placeholder="77 123 45 67" className="h-10 bg-surface" />
          <p className="mt-1.5 text-xs text-muted">{aideTelephone}</p>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eleve-parent" className="mb-1.5 text-xs font-semibold text-muted">Nom du parent</Label>
          <Input id="eleve-parent" value={parent} onChange={function (ev) { setParent(ev.target.value); }} placeholder="ex. Moussa Diop" className="h-10 bg-surface" />
        </div>
        <div className="sm:col-span-2">{messageErreur}</div>
      </form>
    </Modal>
  );
}
