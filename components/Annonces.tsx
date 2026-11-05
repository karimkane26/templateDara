"use client";

/*
 * Annonces de l'école.
 *  - AnnoncesView : l'administrateur publie et supprime les annonces (page /annonces).
 *  - ListeAnnonces : affichage des annonces dans l'espace enseignant et l'espace parent.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ANNONCES, type Annonce, type PublicAnnonce } from "@/lib/data";
import { dateCourte } from "@/lib/format";
import { ajouterAnnonce, lireAnnonces, supprimerAnnonce } from "@/lib/stockage";
import { Icon } from "./Icon";
import { ListeDeChoix, type OptionDeChoix } from "./ListeDeChoix";
import { Modal } from "./Modal";

// Les choix de la liste "Qui peut la voir ?"
const OPTIONS_PUBLIC: OptionDeChoix[] = [
  { valeur: "tous", texte: "Tout le monde (enseignants et parents)" },
  { valeur: "parents", texte: "Seulement les parents" },
  { valeur: "enseignants", texte: "Seulement les enseignants" },
];

/** "tous" -> "Tout le monde" ; "parents" -> "Parents" ; "enseignants" -> "Enseignants" */
function nomDuPublic(pourQui: PublicAnnonce): string {
  if (pourQui === "parents") {
    return "Parents";
  }
  if (pourQui === "enseignants") {
    return "Enseignants";
  }
  return "Tout le monde";
}

/* ============================================================
 * Une annonce (carte)
 * ============================================================ */

interface CarteAnnonceProps {
  annonce: Annonce;
  onSupprimer?: (annonce: Annonce) => void; // seulement pour l'administrateur
}

function CarteAnnonce(props: CarteAnnonceProps) {
  const annonce = props.annonce;

  let bordure = "border-line";
  let badgeImportant = null;
  if (annonce.importante) {
    bordure = "border-ochre";
    badgeImportant = <span className="rounded-full bg-ochre-soft px-2 py-0.5 text-[11px] font-bold text-ochre">Important</span>;
  }

  let boutonSupprimer = null;
  if (props.onSupprimer) {
    const supprimer = props.onSupprimer;
    boutonSupprimer = (
      <button
        type="button"
        onClick={function () {
          supprimer(annonce);
        }}
        aria-label={"Supprimer l'annonce " + annonce.titre}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
      >
        <Icon name="trash" size={16} />
      </button>
    );
  }

  return (
    <article className={"rounded-xl border-l-4 bg-surface-2/50 p-4 " + bordure}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {annonce.titre}
            {badgeImportant}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {dateCourte(annonce.date)} · Pour : {nomDuPublic(annonce.public)}
          </p>
        </div>
        {boutonSupprimer}
      </div>
      <p className="mt-2 text-sm whitespace-pre-line">{annonce.contenu}</p>
    </article>
  );
}

/* ============================================================
 * Liste des annonces dans les espaces enseignant et parent
 * ============================================================ */

interface ListeAnnoncesProps {
  annonces: Annonce[];
}

export function ListeAnnonces(props: ListeAnnoncesProps) {
  if (props.annonces.length === 0) {
    return null; // rien à afficher
  }

  const cartes = [];
  for (let i = 0; i < props.annonces.length; i++) {
    cartes.push(<CarteAnnonce key={props.annonces[i].id} annonce={props.annonces[i]} />);
  }

  return (
    <section className="panel p-4">
      <h2 className="mb-3 flex items-center gap-2 px-1 font-display text-[15px] font-semibold">
        <Icon name="megaphone" />
        Annonces de l&apos;école
      </h2>
      <div className="flex flex-col gap-3">{cartes}</div>
    </section>
  );
}

/* ============================================================
 * Page de l'administrateur
 * ============================================================ */

export function AnnoncesView() {
  const [annonces, setAnnonces] = useState<Annonce[]>(ANNONCES);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [pourQui, setPourQui] = useState("tous");
  const [importante, setImportante] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  useEffect(function () {
    setAnnonces(lireAnnonces());
  }, []);

  function ouvrirFormulaire() {
    setTitre("");
    setContenu("");
    setPourQui("tous");
    setImportante(false);
    setErreur("");
    setMessage("");
    setFormulaireOuvert(true);
  }

  function fermerFormulaire() {
    setFormulaireOuvert(false);
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();
    if (titre.trim() === "" || contenu.trim() === "") {
      setErreur("Le titre et le message sont obligatoires.");
      return;
    }

    let publicChoisi: PublicAnnonce = "tous";
    if (pourQui === "parents") {
      publicChoisi = "parents";
    } else if (pourQui === "enseignants") {
      publicChoisi = "enseignants";
    }

    ajouterAnnonce({ titre: titre.trim(), contenu: contenu.trim(), public: publicChoisi, importante: importante });
    setAnnonces(lireAnnonces());
    setFormulaireOuvert(false);
    setMessage("Annonce publiée. Elle est visible dans l'espace : " + nomDuPublic(publicChoisi).toLowerCase() + ".");
  }

  function supprimer(annonce: Annonce) {
    if (!window.confirm("Supprimer l'annonce « " + annonce.titre + " » ?")) {
      return;
    }
    supprimerAnnonce(annonce.id);
    setAnnonces(lireAnnonces());
    setMessage("Annonce supprimée.");
  }


  const cartes = [];
  for (let i = 0; i < annonces.length; i++) {
    cartes.push(<CarteAnnonce key={annonces[i].id} annonce={annonces[i]} onSupprimer={supprimer} />);
  }

  let messageVide = null;
  if (annonces.length === 0) {
    messageVide = <p className="panel p-5 text-sm text-muted">Aucune annonce publiée.</p>;
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={ouvrirFormulaire}>
          <Icon name="plus" />
          Publier une annonce
        </Button>
      </div>

      {bandeau}

      <div className="flex flex-col gap-3">{cartes}</div>
      {messageVide}

      <Modal
        ouvert={formulaireOuvert}
        titre="Publier une annonce"
        onFermer={fermerFormulaire}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFormulaire}>
              Annuler
            </Button>
            <Button type="submit" form="form-annonce" size="lg">
              Publier
            </Button>
          </>
        }
      >
        <form id="form-annonce" onSubmit={quandOnValide} className="grid gap-4">
          <div>
            <Label htmlFor="annonce-titre" className="mb-1.5 text-xs font-semibold text-muted">Titre</Label>
            <Input id="annonce-titre" value={titre} onChange={function (ev) { setTitre(ev.target.value); setErreur(""); }} placeholder="ex. Pas de cours vendredi" className="h-10 bg-surface" />
          </div>
          <div>
            <Label htmlFor="annonce-contenu" className="mb-1.5 text-xs font-semibold text-muted">Message</Label>
            <Textarea
              id="annonce-contenu"
              value={contenu}
              onChange={function (ev) {
                setContenu(ev.target.value);
                setErreur("");
              }}
              className="min-h-28 bg-surface"
            />
          </div>
          <div>
            <Label htmlFor="annonce-public" className="mb-1.5 text-xs font-semibold text-muted">Qui peut la voir ?</Label>
            <ListeDeChoix id="annonce-public" value={pourQui} onChange={setPourQui} options={OPTIONS_PUBLIC} />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="annonce-importante" checked={importante} onCheckedChange={setImportante} />
            <Label htmlFor="annonce-importante" className="text-sm font-normal">
              Annonce importante (mise en couleur)
            </Label>
          </div>
          {messageErreur}
        </form>
      </Modal>
    </div>
  );
}
