"use client";

/*
 * Page Paiements : résumé du mois, formulaire "Enregistrer un paiement",
 * journal des paiements et liste des élèves en retard.
 *
 * Les nouveaux paiements sont enregistrés dans le navigateur (lib/finances.ts).
 * Plus tard, il faudra les envoyer à une base de données dans "enregistrerLePaiement".
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { CLASSES, ECOLE, ELEVES, PAIEMENTS, type Eleve, type ModePaiement, type Paiement, type StatutPaiement } from "@/lib/data";
import { ajouterPaiement, lirePaiements } from "@/lib/finances";
import { nouvelId } from "@/lib/stockage";
import { dateCourte, fcfa, initiales, moisLong, pourcent } from "@/lib/format";
import { Icon } from "./Icon";
import { ListeDeChoix, type OptionDeChoix } from "./ListeDeChoix";
import { Avatar, ModeLabel, StatutBadge } from "./elements";

const CHAMP = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none";
const MODES: ModePaiement[] = ["Wave", "Orange Money", "Espèces"];

/* ============================================================
 * Petites fonctions de calcul
 * ============================================================ */

/** Mensualité de la classe (en FCFA). */
function mensualiteDeLaClasse(classeId: string): number {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return CLASSES[i].mensualite;
    }
  }
  return 0;
}

/** Nom de la classe : "alif" -> "Alif". */
function nomDeLaClasse(classeId: string): string {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return CLASSES[i].nom;
    }
  }
  return "";
}

/** Trouve un élève à partir de son id. */
function trouverEleve(eleveId: string): Eleve {
  for (let i = 0; i < ELEVES.length; i++) {
    if (ELEVES[i].id === eleveId) {
      return ELEVES[i];
    }
  }
  // Ne devrait jamais arriver.
  return ELEVES[0];
}

/** Total versé par un élève pour le mois en cours. */
function totalPayeCeMois(paiements: Paiement[], eleveId: string): number {
  let total = 0;
  for (let i = 0; i < paiements.length; i++) {
    if (paiements[i].eleveId === eleveId && paiements[i].mois === ECOLE.moisEnCours) {
      total = total + paiements[i].montant;
    }
  }
  return total;
}

/** Ce qui reste à payer ce mois-ci (jamais négatif). */
function resteCeMois(paiements: Paiement[], eleve: Eleve): number {
  const reste = mensualiteDeLaClasse(eleve.classeId) - totalPayeCeMois(paiements, eleve.id);
  if (reste < 0) {
    return 0;
  }
  return reste;
}

/** "paye", "partiel" ou "impaye" selon ce que l'élève a versé. */
function statutCeMois(paiements: Paiement[], eleve: Eleve): StatutPaiement {
  const paye = totalPayeCeMois(paiements, eleve.id);
  if (paye >= mensualiteDeLaClasse(eleve.classeId)) {
    return "paye";
  }
  if (paye > 0) {
    return "partiel";
  }
  return "impaye";
}

/** Élèves qui n'ont pas tout payé, celui qui doit le plus en premier. */
function elevesEnRetard(paiements: Paiement[]): Eleve[] {
  const liste: Eleve[] = [];
  for (let i = 0; i < ELEVES.length; i++) {
    if (statutCeMois(paiements, ELEVES[i]) !== "paye") {
      liste.push(ELEVES[i]);
    }
  }

  function comparer(a: Eleve, b: Eleve): number {
    return resteCeMois(paiements, b) - resteCeMois(paiements, a);
  }
  liste.sort(comparer);

  return liste;
}

/** L'élève choisi par défaut dans le formulaire : le premier en retard. */
function eleveParDefaut(): string {
  const enRetard = elevesEnRetard(PAIEMENTS);
  if (enRetard.length > 0) {
    return enRetard[0].id;
  }
  return ELEVES[0].id;
}

/** Montant proposé par défaut : ce qui reste à payer pour l'élève par défaut. */
function montantParDefaut(): string {
  return String(resteCeMois(PAIEMENTS, trouverEleve(eleveParDefaut())));
}

/** "12 500" -> "12500" (enlève tous les espaces, y compris les espaces insécables). */
function enleverLesEspaces(texte: string): string {
  let resultat = "";
  for (let i = 0; i < texte.length; i++) {
    const caractere = texte[i];
    // trim() renvoie "" si le caractère est une espace (normale, insécable, tabulation...)
    if (caractere.trim() !== "") {
      resultat = resultat + caractere;
    }
  }
  return resultat;
}

/** Pour trier les élèves par prénom (ordre alphabétique français). */
function comparerParPrenom(a: Eleve, b: Eleve): number {
  return a.prenom.localeCompare(b.prenom, "fr");
}

/* ============================================================
 * Le composant
 * ============================================================ */

interface PaiementsViewProps {
  formulaireOuvert?: boolean;
  ongletInitial?: string; // "journal" ou "retard"
  onPaiementEnregistre?: () => void; // pour que la page Gestion financière mette son bilan à jour
}

export function PaiementsView(props: PaiementsViewProps) {
  let ongletDeDepart = "journal";
  if (props.ongletInitial === "retard") {
    ongletDeDepart = "retard";
  }

  let formulaireDeDepart = false;
  if (props.formulaireOuvert === true) {
    formulaireDeDepart = true;
  }

  // Liste des paiements (au départ ceux de lib/data.ts, puis ceux enregistrés dans le navigateur)
  const [paiements, setPaiements] = useState(PAIEMENTS);

  useEffect(function () {
    setPaiements(lirePaiements());
  }, []);
  // Onglet affiché : "journal" ou "retard"
  const [onglet, setOnglet] = useState(ongletDeDepart);
  // Filtre du journal : "tous", "Wave", "Orange Money" ou "Espèces"
  const [filtreMode, setFiltreMode] = useState("tous");
  // Le formulaire est-il affiché ?
  const [formulaireVisible, setFormulaireVisible] = useState(formulaireDeDepart);
  // Message vert affiché après un enregistrement ("" = pas de message)
  const [confirmation, setConfirmation] = useState("");

  // Champs du formulaire
  const [eleveId, setEleveId] = useState(eleveParDefaut());
  const [montant, setMontant] = useState(montantParDefaut());
  const [modeChoisi, setModeChoisi] = useState<ModePaiement>("Wave");
  const [erreur, setErreur] = useState("");

  /* ---------- Calculs ---------- */

  let attendu = 0;
  let encaisse = 0;
  for (let i = 0; i < ELEVES.length; i++) {
    attendu = attendu + mensualiteDeLaClasse(ELEVES[i].classeId);
    encaisse = encaisse + totalPayeCeMois(paiements, ELEVES[i].id);
  }

  const enRetard = elevesEnRetard(paiements);

  // Paiements à afficher dans le journal (selon le filtre)
  const journal: Paiement[] = [];
  for (let i = 0; i < paiements.length; i++) {
    if (filtreMode === "tous" || paiements[i].mode === filtreMode) {
      journal.push(paiements[i]);
    }
  }

  const eleveChoisi = trouverEleve(eleveId);
  const resteEleveChoisi = resteCeMois(paiements, eleveChoisi);

  /* ---------- Actions ---------- */

  /** Quand on choisit un élève, on propose le montant qui lui reste à payer. */
  function choisirEleve(id: string) {
    setEleveId(id);
    setMontant(String(resteCeMois(paiements, trouverEleve(id))));
    setErreur("");
  }

  function ouvrirFormulaire() {
    setFormulaireVisible(true);
    setConfirmation("");
  }

  function fermerFormulaire() {
    setFormulaireVisible(false);
  }

  function masquerConfirmation() {
    setConfirmation("");
  }

  /** Bouton "Encaisser" d'un élève en retard : on remplit le formulaire pour lui. */
  function encaisserPour(id: string) {
    choisirEleve(id);
    setFormulaireVisible(true);
    setConfirmation("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function quandOnTapeLeMontant(evenement: ChangeEvent<HTMLInputElement>) {
    setMontant(evenement.target.value);
  }

  function afficherJournal() {
    setOnglet("journal");
  }

  function afficherRetards() {
    setOnglet("retard");
  }

  function enregistrerLePaiement(evenement: FormEvent) {
    evenement.preventDefault();

    // On enlève les espaces ("12 500" -> "12500") puis on transforme en nombre.
    const valeur = Number(enleverLesEspaces(montant));
    if (!isFinite(valeur) || valeur <= 0) {
      setErreur("Indiquez un montant supérieur à 0 FCFA.");
      return;
    }

    const nouveauPaiement: Paiement = {
      id: nouvelId("p"),
      eleveId: eleveId,
      mois: ECOLE.moisEnCours,
      date: ECOLE.aujourdhui,
      montant: valeur,
      mode: modeChoisi,
    };

    // On l'enregistre dans le navigateur, puis on relit la liste (le plus récent en premier).
    ajouterPaiement(nouveauPaiement);
    setPaiements(lirePaiements());
    if (props.onPaiementEnregistre) {
      props.onPaiementEnregistre();
    }

    setConfirmation("Paiement enregistré : " + fcfa(valeur) + " pour " + eleveChoisi.prenom + " " + eleveChoisi.nom + ".");
    setFormulaireVisible(false);
    setOnglet("journal");
    setErreur("");
  }

  /* ---------- Morceaux d'affichage ---------- */

  // 1. Les trois cartes du résumé
  const resume = (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="panel px-5 py-4">
        <p className="text-sm text-muted">Encaissé</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{fcfa(encaisse)}</p>
        <p className="mt-0.5 text-xs text-muted">{pourcent(encaisse, attendu)} % de l&apos;attendu</p>
      </div>
      <div className="panel px-5 py-4">
        <p className="text-sm text-muted">Reste à recevoir</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{fcfa(attendu - encaisse)}</p>
        <p className="mt-0.5 text-xs text-muted">{enRetard.length} élèves concernés</p>
      </div>
      <div className="panel px-5 py-4">
        <p className="text-sm text-muted">Attendu ce mois</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{fcfa(attendu)}</p>
        <p className="mt-0.5 text-xs text-muted">{ELEVES.length} élèves inscrits</p>
      </div>
    </div>
  );

  // 2. Le message vert de confirmation
  let messageConfirmation = null;
  if (confirmation !== "") {
    messageConfirmation = (
      <div role="status" className="flex items-center gap-3 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
        <Icon name="check" />
        <span className="flex-1">{confirmation}</span>
        <button type="button" onClick={masquerConfirmation} aria-label="Masquer le message" className="grid size-7 place-items-center rounded-md hover:bg-surface/50">
          <Icon name="close" size={16} />
        </button>
      </div>
    );
  }

  // 3. Le formulaire (ou le bouton pour l'ouvrir)
  let zoneFormulaire = null;
  if (formulaireVisible) {
    // Liste des élèves triés par prénom
    const elevesTries: Eleve[] = [];
    for (let i = 0; i < ELEVES.length; i++) {
      elevesTries.push(ELEVES[i]);
    }
    elevesTries.sort(comparerParPrenom);

    const optionsEleves: OptionDeChoix[] = [];
    for (let i = 0; i < elevesTries.length; i++) {
      const eleve = elevesTries[i];
      optionsEleves.push({ valeur: eleve.id, texte: eleve.prenom + " " + eleve.nom + " (classe " + nomDeLaClasse(eleve.classeId) + ")" });
    }

    let texteReste = "Mensualité déjà réglée ce mois-ci";
    if (resteEleveChoisi > 0) {
      texteReste = "Reste " + fcfa(resteEleveChoisi) + " pour " + moisLong(ECOLE.moisEnCours);
    }

    let messageErreur = null;
    let bordureMontant = "";
    let montantInvalide: boolean | undefined = undefined;
    let idMessageErreur: string | undefined = undefined;
    if (erreur !== "") {
      montantInvalide = true;
      idMessageErreur = "pay-erreur";
      messageErreur = (
        <p id="pay-erreur" className="mt-1.5 text-xs text-danger">
          {erreur}
        </p>
      );
      bordureMontant = "border-danger";
    }

    // Les trois boutons "Wave / OM / Espèces"
    const boutonsModes = [];
    for (let i = 0; i < MODES.length; i++) {
      const mode = MODES[i];

      let style = "text-muted";
      if (modeChoisi === mode) {
        style = "bg-surface text-ink shadow-sm";
      }

      let texte: string = mode;
      if (mode === "Orange Money") {
        texte = "OM";
      }

      boutonsModes.push(
        <label key={mode} className={"flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-xs font-semibold " + style}>
          <input
            type="radio"
            name="mode"
            value={mode}
            checked={modeChoisi === mode}
            onChange={function () {
              setModeChoisi(mode);
            }}
            className="sr-only"
          />
          {texte}
        </label>,
      );
    }

    zoneFormulaire = (
      <form onSubmit={enregistrerLePaiement} className="panel p-5" aria-labelledby="form-titre">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="form-titre" className="font-display text-[15px] font-semibold">
            Enregistrer un paiement
          </h2>
          <button type="button" onClick={fermerFormulaire} className="text-sm font-medium text-muted hover:text-ink">
            Annuler
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="pay-eleve" className="mb-1.5 block text-xs font-medium text-muted">
              Élève
            </label>
            <ListeDeChoix id="pay-eleve" value={eleveId} onChange={choisirEleve} options={optionsEleves} />
            <p className="mt-1.5 text-xs text-muted">{texteReste}</p>
          </div>
          <div>
            <label htmlFor="pay-montant" className="mb-1.5 block text-xs font-medium text-muted">
              Montant (FCFA)
            </label>
            <input
              id="pay-montant"
              inputMode="numeric"
              value={montant}
              onChange={quandOnTapeLeMontant}
              aria-invalid={montantInvalide}
              aria-describedby={idMessageErreur}
              className={CHAMP + " tabular-nums " + bordureMontant}
            />
            {messageErreur}
          </div>
          <fieldset>
            <legend className="mb-1.5 block text-xs font-medium text-muted">Mode</legend>
            <div className="flex gap-1 rounded-lg bg-surface-2 p-1">{boutonsModes}</div>
          </fieldset>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink hover:opacity-90">
            <Icon name="check" />
            Enregistrer le paiement
          </button>
        </div>
      </form>
    );
  } else {
    zoneFormulaire = (
      <button
        type="button"
        onClick={ouvrirFormulaire}
        className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-dashed border-primary/60 px-4 text-sm font-semibold text-primary hover:bg-primary-soft"
      >
        <Icon name="plus" />
        Enregistrer un paiement
      </button>
    );
  }

  // 4. Les deux onglets
  const ONGLET_ACTIF = "bg-surface text-ink shadow-sm";
  const ONGLET_INACTIF = "text-muted hover:text-ink";

  let styleJournal = ONGLET_INACTIF;
  let styleRetard = ONGLET_INACTIF;
  if (onglet === "journal") {
    styleJournal = ONGLET_ACTIF;
  } else {
    styleRetard = ONGLET_ACTIF;
  }

  // Le filtre par mode n'apparaît que dans l'onglet "Journal"
  let filtre = null;
  if (onglet === "journal") {
    const optionsModes: OptionDeChoix[] = [{ valeur: "tous", texte: "Tous les modes" }];
    for (let i = 0; i < MODES.length; i++) {
      optionsModes.push({ valeur: MODES[i], texte: MODES[i] });
    }

    filtre = <ListeDeChoix id="filtre-mode" label="Mode de paiement" value={filtreMode} onChange={setFiltreMode} options={optionsModes} className="w-44" />;
  }

  // 5. Le tableau affiché (journal ou retards)
  let tableau = null;
  let messageVide = null;

  if (onglet === "journal") {
    const lignes = [];
    for (let i = 0; i < journal.length; i++) {
      const paiement = journal[i];
      const eleve = trouverEleve(paiement.eleveId);

      lignes.push(
        <tr key={paiement.id} className="hover:bg-surface-2/60">
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar texte={initiales(eleve.prenom, eleve.nom)} sexe={eleve.sexe} />
              <div className="min-w-0">
                <p className="font-semibold">
                  {eleve.prenom} {eleve.nom}
                </p>
                <p className="text-xs text-muted">Classe {nomDeLaClasse(eleve.classeId)}</p>
              </div>
            </div>
          </td>
          <td className="px-3 py-3 whitespace-nowrap text-muted">{dateCourte(paiement.date)}</td>
          <td className="px-3 py-3 whitespace-nowrap">{moisLong(paiement.mois)}</td>
          <td className="px-3 py-3 whitespace-nowrap">
            <ModeLabel mode={paiement.mode} />
          </td>
          <td className="px-5 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{fcfa(paiement.montant)}</td>
        </tr>,
      );
    }

    tableau = (
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-5 py-3 font-medium">Élève</th>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Mois réglé</th>
            <th className="px-3 py-3 font-medium">Mode</th>
            <th className="px-5 py-3 text-right font-medium">Montant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{lignes}</tbody>
      </table>
    );

    if (journal.length === 0) {
      messageVide = <p className="px-5 py-10 text-center text-sm text-muted">Aucun paiement avec ce mode. Choisissez « Tous les modes » pour tout afficher.</p>;
    }
  } else {
    const lignes = [];
    for (let i = 0; i < enRetard.length; i++) {
      const eleve = enRetard[i];
      const id = eleve.id;

      lignes.push(
        <tr key={eleve.id} className="hover:bg-surface-2/60">
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar texte={initiales(eleve.prenom, eleve.nom)} sexe={eleve.sexe} />
              <div className="min-w-0">
                <p className="font-semibold">
                  {eleve.prenom} {eleve.nom}
                </p>
                <p className="text-xs text-muted">Classe {nomDeLaClasse(eleve.classeId)}</p>
              </div>
            </div>
          </td>
          <td className="px-3 py-3">
            <p className="whitespace-nowrap">{eleve.parent}</p>
            <p className="text-xs whitespace-nowrap text-muted tabular-nums">{eleve.telephoneParent}</p>
          </td>
          <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{fcfa(resteCeMois(paiements, eleve))}</td>
          <td className="px-3 py-3">
            <StatutBadge statut={statutCeMois(paiements, eleve)} />
          </td>
          <td className="px-5 py-3 text-right whitespace-nowrap">
            <button
              type="button"
              onClick={function () {
                encaisserPour(id);
              }}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-ink hover:opacity-90"
            >
              Encaisser
            </button>
          </td>
        </tr>,
      );
    }

    tableau = (
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-5 py-3 font-medium">Élève</th>
            <th className="px-3 py-3 font-medium">Parent</th>
            <th className="px-3 py-3 text-right font-medium">Reste</th>
            <th className="px-3 py-3 font-medium">Statut</th>
            <th className="px-5 py-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{lignes}</tbody>
      </table>
    );

    if (enRetard.length === 0) {
      messageVide = <p className="px-5 py-10 text-center text-sm text-muted">Tous les élèves sont à jour pour {moisLong(ECOLE.moisEnCours)}.</p>;
    }
  }

  /* ---------- Assemblage de la page ---------- */

  return (
    <div className="flex flex-col gap-5">
      {resume}
      {messageConfirmation}
      {zoneFormulaire}

      <section className="panel min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div role="tablist" aria-label="Vue" className="flex gap-1 rounded-lg bg-surface-2 p-1">
            <button
              role="tab"
              type="button"
              aria-selected={onglet === "journal"}
              onClick={afficherJournal}
              className={"rounded-md px-3 py-1.5 text-sm font-semibold " + styleJournal}
            >
              Journal ({paiements.length})
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={onglet === "retard"}
              onClick={afficherRetards}
              className={"rounded-md px-3 py-1.5 text-sm font-semibold " + styleRetard}
            >
              En retard ({enRetard.length})
            </button>
          </div>
          {filtre}
        </div>

        <div className="overflow-x-auto">
          {tableau}
          {messageVide}
        </div>
      </section>
    </div>
  );
}
