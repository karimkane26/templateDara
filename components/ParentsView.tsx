"use client";

/*
 * Administrateur : gestion des parents d'élèves.
 * Un parent est relié à ses enfants par son numéro de téléphone.
 * Il se connecte à son espace avec ce numéro et son mot de passe.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MOT_DE_PASSE_PARENT, type Eleve, type Parent } from "@/lib/data";
import { initiales } from "@/lib/format";
import {
  ajouterParent,
  chiffresSeulement,
  enfantsDuParent,
  lireEleves,
  lireParents,
  modifierParent,
  supprimerParent,
  telephoneParentDejaPris,
} from "@/lib/stockage";
import { Avatar } from "./elements";
import { nomDesEleves } from "./EmploiDuTemps";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

const CHAMP_RECHERCHE = "h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-10 text-sm focus:border-primary focus:outline-none";

/** Pour trier les parents par nom, puis par prénom. */
function comparerParents(a: Parent, b: Parent): number {
  const texteA = (a.nom + " " + a.prenom).toLowerCase();
  const texteB = (b.nom + " " + b.prenom).toLowerCase();
  if (texteA < texteB) return -1;
  if (texteA > texteB) return 1;
  return 0;
}

export function ParentsView() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [recherche, setRecherche] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [message, setMessage] = useState("");
  const [idEnModification, setIdEnModification] = useState("");

  // Champs du formulaire
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [actif, setActif] = useState(true);
  const [erreur, setErreur] = useState("");

  /** Relit les parents et les élèves enregistrés. */
  function recharger() {
    const liste = lireParents();
    liste.sort(comparerParents);
    setParents(liste);
    setEleves(lireEleves());
  }

  useEffect(function () {
    recharger();
  }, []);

  function ouvrirAjout() {
    setIdEnModification("");
    setPrenom("");
    setNom("");
    setTelephone("");
    setEmail("");
    setAdresse("");
    setMotDePasse(MOT_DE_PASSE_PARENT);
    setActif(true);
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function ouvrirModification(parent: Parent) {
    setIdEnModification(parent.id);
    setPrenom(parent.prenom);
    setNom(parent.nom);
    setTelephone(parent.telephone);
    setEmail(parent.email);
    setAdresse(parent.adresse);
    setMotDePasse(parent.motDePasse);
    setActif(parent.actif);
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();

    if (prenom.trim() === "" || nom.trim() === "") {
      setErreur("Le prénom et le nom sont obligatoires.");
      return;
    }
    // Un numéro sénégalais a 9 chiffres (77 123 45 67)
    if (chiffresSeulement(telephone).length !== 9) {
      setErreur("Le téléphone doit avoir 9 chiffres, par exemple 77 123 45 67.");
      return;
    }
    if (telephoneParentDejaPris(telephone, idEnModification)) {
      setErreur("Un autre parent a déjà ce numéro de téléphone.");
      return;
    }
    if (motDePasse.length < 4) {
      setErreur("Le mot de passe doit faire au moins 4 caractères.");
      return;
    }

    const infos = {
      prenom: prenom.trim(),
      nom: nom.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      adresse: adresse.trim(),
      motDePasse: motDePasse,
      actif: actif,
    };

    if (idEnModification === "") {
      ajouterParent(infos);
      setMessage(
        infos.prenom + " " + infos.nom + " a été ajouté. Identifiant : " + chiffresSeulement(infos.telephone) + ", mot de passe : " + motDePasse +
          ". Inscrivez ses enfants avec ce numéro sur la page Élèves.",
      );
    } else {
      modifierParent(idEnModification, infos);
      setMessage("Les informations de " + infos.prenom + " " + infos.nom + " ont été modifiées (ses enfants aussi).");
    }

    recharger();
    setFormulaireOuvert(false);
  }

  function basculerActif(parent: Parent) {
    modifierParent(parent.id, {
      prenom: parent.prenom,
      nom: parent.nom,
      telephone: parent.telephone,
      email: parent.email,
      adresse: parent.adresse,
      motDePasse: parent.motDePasse,
      actif: !parent.actif,
    });
    recharger();
    if (parent.actif) {
      setMessage("Le compte de " + parent.prenom + " " + parent.nom + " est désactivé : il ne peut plus se connecter.");
    } else {
      setMessage("Le compte de " + parent.prenom + " " + parent.nom + " est réactivé.");
    }
  }

  function supprimer(parent: Parent) {
    if (!window.confirm("Supprimer la fiche de " + parent.prenom + " " + parent.nom + " ?")) {
      return;
    }
    const supprime = supprimerParent(parent.id);
    if (!supprime) {
      setMessage(
        parent.prenom + " " + parent.nom + " a encore des enfants inscrits. Retirez-les ou changez leur parent sur la page Élèves, ou désactivez plutôt son compte.",
      );
      return;
    }
    recharger();
    setMessage("Fiche de " + parent.prenom + " " + parent.nom + " supprimée.");
  }

  function quandOnTapeLaRecherche(evenement: ChangeEvent<HTMLInputElement>) {
    setRecherche(evenement.target.value);
  }

  /* ---------- Lignes du tableau ---------- */

  const texteCherche = recherche.trim().toLowerCase();
  const lignes = [];
  let nombreActifs = 0;

  for (let i = 0; i < parents.length; i++) {
    const p = parents[i];
    if (p.actif) {
      nombreActifs = nombreActifs + 1;
    }

    const enfants = enfantsDuParent(p, eleves);

    // Recherche dans le nom, le téléphone et les prénoms des enfants
    let texteDuParent = p.prenom + " " + p.nom + " " + p.telephone + " " + chiffresSeulement(p.telephone);
    for (let e = 0; e < enfants.length; e++) {
      texteDuParent = texteDuParent + " " + enfants[e].prenom + " " + enfants[e].nom;
    }
    if (texteCherche !== "" && !texteDuParent.toLowerCase().includes(texteCherche)) {
      continue;
    }

    // Liste des enfants : "Awa (Classe Ba)"
    const listeEnfants = [];
    for (let e = 0; e < enfants.length; e++) {
      listeEnfants.push(
        <li key={enfants[e].id}>
          {enfants[e].prenom} <span className="text-muted">({nomDesEleves(enfants[e].classeId)})</span>
        </li>,
      );
    }
    let colonneEnfants = <ul className="flex flex-col gap-0.5">{listeEnfants}</ul>;
    if (enfants.length === 0) {
      colonneEnfants = <span className="text-muted">Aucun enfant inscrit</span>;
    }

    let texteEtat = "Actif";
    let styleEtat = "bg-primary-soft text-primary";
    if (!p.actif) {
      texteEtat = "Désactivé";
      styleEtat = "bg-danger-soft text-danger";
    }

    // Lien WhatsApp pour contacter le parent (indicatif du Sénégal : 221)
    const lienWhatsApp = "https://wa.me/221" + chiffresSeulement(p.telephone);

    lignes.push(
      <tr key={p.id} className="align-top hover:bg-surface-2/60">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar texte={initiales(p.prenom, p.nom)} sexe="M" />
            <div className="min-w-0">
              <p className="font-semibold">
                {p.prenom} {p.nom}
              </p>
              <p className="text-xs text-muted">{p.email}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <p className="tabular-nums">{p.telephone}</p>
          <a href={lienWhatsApp} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">
            WhatsApp
          </a>
        </td>
        <td className="px-3 py-3">{colonneEnfants}</td>
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={function () {
              basculerActif(p);
            }}
            title="Cliquer pour activer / désactiver le compte"
            className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + styleEtat}
          >
            {texteEtat}
          </button>
        </td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={function () {
              ouvrirModification(p);
            }}
            aria-label={"Modifier " + p.prenom + " " + p.nom}
            className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="edit" size={16} />
          </button>
          <button
            type="button"
            onClick={function () {
              supprimer(p);
            }}
            aria-label={"Supprimer " + p.prenom + " " + p.nom}
            className="inline-grid size-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
          >
            <Icon name="trash" size={16} />
          </button>
        </td>
      </tr>,
    );
  }

  let messageVide = null;
  if (lignes.length === 0) {
    messageVide = <p className="px-5 py-10 text-center text-sm text-muted">Aucun parent ne correspond à cette recherche.</p>;
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

  let titreFenetre = "Ajouter un parent";
  let texteBouton = "Ajouter";
  let aideTelephone = "Ce numéro sert d'identifiant pour se connecter. Les élèves inscrits avec ce numéro sont ses enfants.";
  if (idEnModification !== "") {
    titreFenetre = "Modifier le parent";
    texteBouton = "Enregistrer";
    aideTelephone = "Si vous changez le numéro, il est aussi changé sur la fiche de ses enfants.";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {parents.length} parents, dont {nombreActifs} avec un compte actif
        </p>
        <Button type="button" size="lg" onClick={ouvrirAjout}>
          <Icon name="plus" />
          Ajouter un parent
        </Button>
      </div>

      {bandeau}

      <section className="panel min-w-0">
        <div className="border-b border-line p-4">
          <div className="relative max-w-md">
            <label htmlFor="filtre-parent" className="sr-only">
              Rechercher un parent
            </label>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              id="filtre-parent"
              value={recherche}
              onChange={quandOnTapeLaRecherche}
              placeholder="Nom, téléphone ou prénom d'un enfant"
              className={CHAMP_RECHERCHE}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Parent</th>
                <th className="px-3 py-3 font-medium">Téléphone</th>
                <th className="px-3 py-3 font-medium">Enfants</th>
                <th className="px-3 py-3 font-medium">Compte</th>
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
        titre={titreFenetre}
        onFermer={fermerFormulaire}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <Button type="submit" form="form-parent" size="lg">
              {texteBouton}
            </Button>
          </>
        }
      >
        <form id="form-parent" onSubmit={quandOnValide} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="parent-prenom" className="mb-1.5 text-xs font-semibold text-muted">Prénom</Label>
            <Input id="parent-prenom" value={prenom} onChange={function (ev) { setPrenom(ev.target.value); setErreur(""); }} className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="parent-nom" className="mb-1.5 text-xs font-semibold text-muted">Nom</Label>
            <Input id="parent-nom" value={nom} onChange={function (ev) { setNom(ev.target.value); setErreur(""); }} className="h-10 bg-surface" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="parent-tel" className="mb-1.5 text-xs font-semibold text-muted">Téléphone</Label>
            <Input id="parent-tel" type="tel" value={telephone} onChange={function (ev) { setTelephone(ev.target.value); setErreur(""); }} placeholder="77 123 45 67" className="h-10 bg-surface" />
            <p className="mt-1.5 text-xs text-muted">{aideTelephone}</p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="parent-email" className="mb-1.5 text-xs font-semibold text-muted">E-mail (facultatif)</Label>
            <Input id="parent-email" type="email" value={email} onChange={function (ev) { setEmail(ev.target.value); }} className="h-10 bg-surface" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="parent-adresse" className="mb-1.5 text-xs font-semibold text-muted">Adresse (facultatif)</Label>
            <Input id="parent-adresse" value={adresse} onChange={function (ev) { setAdresse(ev.target.value); }} placeholder="ex. Parcelles Assainies, Unité 15" className="h-10 bg-surface" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="parent-mdp" className="mb-1.5 text-xs font-semibold text-muted">Mot de passe</Label>
            <Input id="parent-mdp" value={motDePasse} onChange={function (ev) { setMotDePasse(ev.target.value); setErreur(""); }} autoComplete="off" className="h-10 bg-surface" />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch id="parent-actif" checked={actif} onCheckedChange={setActif} />
            <Label htmlFor="parent-actif" className="text-sm font-normal">
              Compte actif (peut se connecter à l&apos;espace parent)
            </Label>
          </div>
          <div className="sm:col-span-2">{messageErreur}</div>
        </form>
      </Modal>
    </div>
  );
}
