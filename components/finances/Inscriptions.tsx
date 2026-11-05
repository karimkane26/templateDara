"use client";

/*
 * Onglet "Inscriptions et frais d'inscription".
 *  - montant des frais (inscription d'un nouvel élève, réinscription) ;
 *  - pour chaque élève : frais payés ou non, bouton "Encaisser", reçu ;
 *  - bouton "Nouvelle inscription" qui ouvre le formulaire d'ajout d'élève.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLASSES, ECOLE, type Eleve, type Inscription } from "@/lib/data";
import {
  annulerInscription,
  eleveDe,
  encaisserInscription,
  lireFrais,
  lireInscriptions,
  lireMontant,
  listeDesRecus,
  modifierFrais,
} from "@/lib/finances";
import { dateCourte, fcfa, initiales } from "@/lib/format";
import { lireEleves } from "@/lib/stockage";
import { AjoutEleve } from "../AjoutEleve";
import { Avatar } from "../elements";
import { Icon } from "../Icon";
import { ListeDeChoix, type OptionDeChoix } from "../ListeDeChoix";
import { Modal } from "../Modal";
import { DocumentFinancier, documentDepuisRecu, lienWhatsAppParent, type ContenuDocument } from "./DocumentFinancier";
import { Bandeau, BoutonIcone, CarteChiffre, MessageErreur, OPTIONS_MODES, PastilleEtat, versMode } from "./outils";

const OPTIONS_FILTRE: OptionDeChoix[] = [
  { valeur: "tous", texte: "Tous les élèves" },
  { valeur: "apayer", texte: "Frais à payer" },
  { valeur: "paye", texte: "Frais payés" },
];

function nomDeLaClasse(classeId: string): string {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return CLASSES[i].nom;
    }
  }
  return "";
}

interface InscriptionsProps {
  onChange: () => void; // prévient la page pour mettre le bilan à jour
}

export function Inscriptions(props: InscriptionsProps) {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState("");

  // Montant des frais (formulaire en haut)
  const [fraisInscription, setFraisInscription] = useState("");
  const [fraisReinscription, setFraisReinscription] = useState("");
  const [erreurFrais, setErreurFrais] = useState("");

  // Fenêtre "Encaisser" : l'inscription choisie (null = fermée) et le mode de paiement
  const [aEncaisser, setAEncaisser] = useState<Inscription | null>(null);
  const [mode, setMode] = useState("Wave");

  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [document, setDocument] = useState<ContenuDocument | null>(null);
  const [lienWhatsApp, setLienWhatsApp] = useState<string | undefined>(undefined);

  function recharger() {
    setInscriptions(lireInscriptions());
    setEleves(lireEleves());
  }

  useEffect(function () {
    recharger();
    const frais = lireFrais();
    setFraisInscription(String(frais.inscription));
    setFraisReinscription(String(frais.reinscription));
  }, []);

  function enregistrerFrais(evenement: FormEvent) {
    evenement.preventDefault();
    const inscription = lireMontant(fraisInscription);
    const reinscription = lireMontant(fraisReinscription);
    if (!isFinite(inscription) || !isFinite(reinscription) || inscription < 0 || reinscription < 0) {
      setErreurFrais("Indiquez des montants valides (0 ou plus).");
      return;
    }
    modifierFrais({ inscription: inscription, reinscription: reinscription });
    setErreurFrais("");
    recharger();
    props.onChange();
    setMessage("Frais enregistrés. Les élèves qui n'ont pas encore payé doivent maintenant ces montants.");
  }

  function ouvrirEncaissement(inscription: Inscription) {
    setMode("Wave");
    setAEncaisser(inscription);
  }

  function fermerEncaissement() {
    setAEncaisser(null);
  }

  function confirmerEncaissement() {
    if (aEncaisser === null) {
      return;
    }
    encaisserInscription(aEncaisser.id, versMode(mode));
    const eleve = eleveDe(eleves, aEncaisser.eleveId);
    let nom = "l'élève";
    if (eleve !== undefined) {
      nom = eleve.prenom + " " + eleve.nom;
    }
    setMessage("Frais de " + fcfa(aEncaisser.montant) + " encaissés pour " + nom + ". Le reçu est disponible.");
    setAEncaisser(null);
    recharger();
    props.onChange();
  }

  function annuler(inscription: Inscription) {
    if (!window.confirm("Annuler le paiement de ces frais ? (à utiliser seulement en cas d'erreur)")) {
      return;
    }
    annulerInscription(inscription.id);
    recharger();
    props.onChange();
    setMessage("Paiement des frais annulé.");
  }

  /** Ouvre le reçu des frais d'inscription de cet élève. */
  function voirRecu(inscription: Inscription) {
    const recus = listeDesRecus();
    for (let i = 0; i < recus.length; i++) {
      const r = recus[i];
      if (r.eleveId === inscription.eleveId && r.objet.startsWith("Frais") && r.date === inscription.datePaiement) {
        const eleve = eleveDe(eleves, inscription.eleveId);
        setDocument(documentDepuisRecu(r, eleve));
        setLienWhatsApp(lienWhatsAppParent(eleve, "Assalamou aleykoum. " + ECOLE.nom + " : reçu " + r.numero + ", " + r.objet + ", " + fcfa(r.montant) + ". Merci."));
        return;
      }
    }
  }

  function fermerDocument() {
    setDocument(null);
  }

  function quandUnEleveEstAjoute(eleve: Eleve) {
    setAjoutOuvert(false);
    recharger();
    props.onChange();
    setMessage(eleve.prenom + " " + eleve.nom + " est inscrit (" + eleve.matricule + "). Ses frais d'inscription apparaissent dans la liste, à encaisser.");
  }

  /* ---------- Calculs et lignes ---------- */

  let attendu = 0;
  let encaisse = 0;
  let nombreAPayer = 0;
  const texteCherche = recherche.trim().toLowerCase();
  const lignes = [];

  for (let i = 0; i < inscriptions.length; i++) {
    const ins = inscriptions[i];
    if (ins.annee !== ECOLE.annee) {
      continue;
    }
    const eleve = eleveDe(eleves, ins.eleveId);
    if (eleve === undefined) {
      continue; // élève retiré de la liste
    }

    attendu = attendu + ins.montant;
    encaisse = encaisse + ins.montantPaye;
    const estPaye = ins.montantPaye >= ins.montant;
    if (!estPaye) {
      nombreAPayer = nombreAPayer + 1;
    }

    // Filtres
    if (filtre === "paye" && !estPaye) continue;
    if (filtre === "apayer" && estPaye) continue;
    const texte = (eleve.prenom + " " + eleve.nom + " " + eleve.matricule + " " + eleve.parent).toLowerCase();
    if (texteCherche !== "" && !texte.includes(texteCherche)) continue;

    let typeTexte = "Réinscription";
    if (ins.type === "inscription") {
      typeTexte = "Nouvelle inscription";
    }

    let datePaiement = <span className="text-muted">—</span>;
    let actions = (
      <Button type="button" size="sm" onClick={function () { ouvrirEncaissement(ins); }}>
        Encaisser
      </Button>
    );
    if (estPaye) {
      datePaiement = (
        <span>
          {dateCourte(ins.datePaiement)} <span className="text-xs text-muted">· {ins.mode}</span>
        </span>
      );
      actions = (
        <>
          <BoutonIcone icone="printer" label="Voir le reçu" onClick={function () { voirRecu(ins); }} />
          <BoutonIcone icone="close" label="Annuler ce paiement" danger={true} onClick={function () { annuler(ins); }} />
        </>
      );
    }

    lignes.push(
      <tr key={ins.id} className="hover:bg-surface-2/60">
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <Avatar texte={initiales(eleve.prenom, eleve.nom)} sexe={eleve.sexe} />
            <div className="min-w-0">
              <p className="font-semibold">
                {eleve.prenom} {eleve.nom}
              </p>
              <p className="text-xs text-muted tabular-nums">
                {eleve.matricule} · Classe {nomDeLaClasse(eleve.classeId)}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">{typeTexte}</td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(ins.montant)}</td>
        <td className="px-3 py-3">
          <PastilleEtat paye={ins.montantPaye} total={ins.montant} />
        </td>
        <td className="px-3 py-3 whitespace-nowrap">{datePaiement}</td>
        <td className="px-5 py-3 text-right whitespace-nowrap">{actions}</td>
      </tr>,
    );
  }

  let messageVide = null;
  if (lignes.length === 0) {
    messageVide = <p className="px-5 py-10 text-center text-sm text-muted">Aucun élève ne correspond à ces filtres.</p>;
  }

  // Fenêtre "Encaisser les frais"
  let fenetreEncaissement = null;
  if (aEncaisser !== null) {
    const eleve = eleveDe(eleves, aEncaisser.eleveId);
    let nom = "";
    if (eleve !== undefined) {
      nom = eleve.prenom + " " + eleve.nom;
    }
    let typeDeFrais = "Frais de réinscription";
    if (aEncaisser.type === "inscription") {
      typeDeFrais = "Frais d'inscription";
    }
    fenetreEncaissement = (
      <Modal
        ouvert={true}
        titre="Encaisser les frais"
        onFermer={fermerEncaissement}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerEncaissement}>
              Annuler
            </Button>
            <Button type="button" size="lg" onClick={confirmerEncaissement}>
              Encaisser {fcfa(aEncaisser.montant)}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <p className="text-sm">
            {typeDeFrais} {aEncaisser.annee} pour <strong>{nom}</strong> :{" "}
            <strong className="tabular-nums">{fcfa(aEncaisser.montant)}</strong>
          </p>
          <div>
            <Label htmlFor="ins-mode" className="mb-1.5 text-xs font-semibold text-muted">Mode de paiement</Label>
            <ListeDeChoix id="ins-mode" value={mode} onChange={setMode} options={OPTIONS_MODES} />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <CarteChiffre titre="Frais encaissés" valeur={fcfa(encaisse)} couleur="vert" detail={"sur " + fcfa(attendu) + " attendus"} />
        <CarteChiffre titre="Reste à encaisser" valeur={fcfa(attendu - encaisse)} couleur="rouge" />
        <CarteChiffre titre="Élèves qui n'ont pas payé" valeur={String(nombreAPayer)} detail={"Année " + ECOLE.annee} />
      </div>

      <form onSubmit={enregistrerFrais} className="panel flex flex-wrap items-end gap-4 p-4">
        <div className="w-full sm:w-48">
          <Label htmlFor="frais-inscription" className="mb-1.5 text-xs font-semibold text-muted">Frais d&apos;inscription (FCFA)</Label>
          <Input id="frais-inscription" inputMode="numeric" value={fraisInscription} onChange={function (ev) { setFraisInscription(ev.target.value); }} className="h-10 bg-surface tabular-nums" />
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="frais-reinscription" className="mb-1.5 text-xs font-semibold text-muted">Frais de réinscription (FCFA)</Label>
          <Input id="frais-reinscription" inputMode="numeric" value={fraisReinscription} onChange={function (ev) { setFraisReinscription(ev.target.value); }} className="h-10 bg-surface tabular-nums" />
        </div>
        <Button type="submit" variant="outline" size="lg">
          Enregistrer les frais
        </Button>
        <div className="flex-1" />
        <Button type="button" size="lg" onClick={function () { setMessage(""); setAjoutOuvert(true); }}>
          <Icon name="plus" />
          Nouvelle inscription
        </Button>
        <div className="w-full">
          <MessageErreur message={erreurFrais} />
        </div>
      </form>

      <Bandeau message={message} />

      <section className="panel min-w-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-52 flex-1">
            <label htmlFor="ins-recherche" className="sr-only">Rechercher un élève</label>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <Input id="ins-recherche" value={recherche} onChange={function (ev) { setRecherche(ev.target.value); }} placeholder="Nom, matricule ou parent" className="h-10 bg-surface pl-10" />
          </div>
          <ListeDeChoix id="ins-filtre" label="Filtrer" value={filtre} onChange={setFiltre} options={OPTIONS_FILTRE} className="w-48" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Élève</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 text-right font-medium">Frais</th>
                <th className="px-3 py-3 font-medium">État</th>
                <th className="px-3 py-3 font-medium">Payé le</th>
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

      {fenetreEncaissement}
      <AjoutEleve ouvert={ajoutOuvert} onFermer={function () { setAjoutOuvert(false); }} onAjoute={quandUnEleveEstAjoute} />
      <DocumentFinancier document={document} onFermer={fermerDocument} lienWhatsApp={lienWhatsApp} />
    </div>
  );
}
