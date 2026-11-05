"use client";

/*
 * Administrateur : fenêtre "Ajouter un élève".
 * Le parent pourra ensuite se connecter avec son numéro de téléphone.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSES, type Eleve } from "@/lib/data";
import { ajouterEleve, chiffresSeulement } from "@/lib/stockage";
import { Modal } from "./Modal";

const CHAMP = "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";

interface AjoutEleveProps {
  ouvert: boolean;
  onFermer: () => void;
  onAjoute: (eleve: Eleve) => void; // appelé une fois l'élève enregistré
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
  const [erreur, setErreur] = useState("");

  const ouvert = props.ouvert;

  // À chaque ouverture, on vide le formulaire.
  useEffect(
    function () {
      if (ouvert) {
        setPrenom("");
        setNom("");
        setSexe("M");
        setClasseId(CLASSES[0].id);
        setParent("");
        setTelephone("");
        setErreur("");
      }
    },
    [ouvert],
  );

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

    let sexeChoisi: "M" | "F" = "M";
    if (sexe === "F") {
      sexeChoisi = "F";
    }

    const eleve = ajouterEleve({
      prenom: prenom.trim(),
      nom: nom.trim(),
      sexe: sexeChoisi,
      classeId: classeId,
      hizbActuel: hizbDeDepart(classeId),
      parent: parent.trim(),
      telephoneParent: telephone.trim(),
    });

    props.onAjoute(eleve);
  }

  const optionsClasses = [];
  for (let i = 0; i < CLASSES.length; i++) {
    optionsClasses.push(
      <option key={CLASSES[i].id} value={CLASSES[i].id}>
        Classe {CLASSES[i].nom} ({CLASSES[i].niveau})
      </option>,
    );
  }

  let messageErreur = null;
  if (erreur !== "") {
    messageErreur = <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{erreur}</p>;
  }

  function quandOnChoisitLeSexe(evenement: ChangeEvent<HTMLSelectElement>) {
    setSexe(evenement.target.value);
  }

  function quandOnChoisitLaClasse(evenement: ChangeEvent<HTMLSelectElement>) {
    setClasseId(evenement.target.value);
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Ajouter un élève"
      onFermer={props.onFermer}
      pied={
        <>
          <Button type="button" variant="outline" size="lg" onClick={props.onFermer}>
            Annuler
          </Button>
          <Button type="submit" form="form-eleve" size="lg">
            Ajouter l&apos;élève
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
          <select id="eleve-sexe" value={sexe} onChange={quandOnChoisitLeSexe} className={CHAMP}>
            <option value="M">Garçon</option>
            <option value="F">Fille</option>
          </select>
        </div>
        <div>
          <Label htmlFor="eleve-classe" className="mb-1.5 text-xs font-semibold text-muted">Classe</Label>
          <select id="eleve-classe" value={classeId} onChange={quandOnChoisitLaClasse} className={CHAMP}>
            {optionsClasses}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eleve-parent" className="mb-1.5 text-xs font-semibold text-muted">Nom du parent</Label>
          <Input id="eleve-parent" value={parent} onChange={function (ev) { setParent(ev.target.value); }} placeholder="ex. Moussa Diop" className="h-10 bg-surface" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eleve-tel" className="mb-1.5 text-xs font-semibold text-muted">Téléphone du parent</Label>
          <Input id="eleve-tel" type="tel" value={telephone} onChange={function (ev) { setTelephone(ev.target.value); }} placeholder="77 123 45 67" className="h-10 bg-surface" />
          <p className="mt-1.5 text-xs text-muted">Ce numéro sert d&apos;identifiant au parent pour se connecter à son espace.</p>
        </div>
        <div className="sm:col-span-2">{messageErreur}</div>
      </form>
    </Modal>
  );
}
