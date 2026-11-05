"use client";

/*
 * Espace de l'enseignant : annonces, son prochain cours, l'emploi du temps
 * de TOUS les cours en ligne (Google Meet), avec un filtre "Mes cours",
 * et la liste des élèves de ses classes (il peut mettre à jour leur hizb).
 */

import { useEffect, useState } from "react";
import { CLASSES, type Annonce, type Cours, type Eleve, type Enseignant, type Enseignement } from "@/lib/data";
import { initiales } from "@/lib/format";
import {
  annoncesPour,
  lireCours,
  lireEleves,
  lireEnseignants,
  lireEnseignements,
  lireSession,
  modifierHizb,
  trouverEnseignant,
} from "@/lib/stockage";
import { ListeAnnonces } from "./Annonces";
import { Avatar } from "./elements";
import { EmploiDuTemps, ProchainCours } from "./EmploiDuTemps";
import { Icon } from "./Icon";

export function EspaceEnseignant() {
  const [enseignant, setEnseignant] = useState<Enseignant | null>(null);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [tousLesCours, setTousLesCours] = useState<Cours[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [message, setMessage] = useState("");
  const [charge, setCharge] = useState(false);

  /** Relit les élèves de mes classes. */
  function chargerMesEleves(moi: Enseignant) {
    const tousLesEleves = lireEleves();
    const mesEleves: Eleve[] = [];
    for (let i = 0; i < tousLesEleves.length; i++) {
      if (moi.classeIds.includes(tousLesEleves[i].classeId)) {
        mesEleves.push(tousLesEleves[i]);
      }
    }
    setEleves(mesEleves);
  }

  useEffect(function () {
    const session = lireSession();
    const liste = lireEnseignants();
    setEnseignants(liste);
    setEnseignements(lireEnseignements());
    setTousLesCours(lireCours());
    setAnnonces(annoncesPour("enseignant"));
    setCharge(true);

    if (session === null) {
      return;
    }
    const moi = trouverEnseignant(liste, session.id);
    if (moi === undefined) {
      return; // compte supprimé par l'administrateur
    }
    setEnseignant(moi);
    chargerMesEleves(moi);
  }, []);

  if (!charge) {
    return null;
  }

  if (enseignant === null) {
    return <p className="panel p-5 text-sm text-muted">Ce compte enseignant n&apos;existe plus. Contactez l&apos;administration.</p>;
  }

  const moi = enseignant;

  // Mes cours : ceux dont je suis l'enseignant (les autres restent visibles dans l'emploi du temps)
  const mesCours: Cours[] = [];
  const mesCoursIds: string[] = [];
  for (let i = 0; i < tousLesCours.length; i++) {
    if (tousLesCours[i].enseignantId === moi.id) {
      mesCours.push(tousLesCours[i]);
      mesCoursIds.push(tousLesCours[i].id);
    }
  }

  /** Demande le nouveau hizb de l'élève et l'enregistre. */
  function mettreAJourHizb(eleve: Eleve) {
    const reponse = window.prompt(
      "Hizb actuel de " + eleve.prenom + " " + eleve.nom + " (0 = apprend encore à lire, 60 = Coran complet) :",
      String(eleve.hizbActuel),
    );
    if (reponse === null) {
      return; // l'enseignant a cliqué sur "Annuler"
    }
    const hizb = Number(reponse);
    if (!Number.isInteger(hizb) || hizb < 0 || hizb > 60) {
      setMessage("Le hizb doit être un nombre entier entre 0 et 60.");
      return;
    }
    modifierHizb(eleve.id, hizb);
    chargerMesEleves(moi);
    setMessage("Progression de " + eleve.prenom + " " + eleve.nom + " mise à jour : hizb " + hizb + ".");
  }

  // Un tableau d'élèves par classe
  const blocsClasses = [];
  for (let c = 0; c < CLASSES.length; c++) {
    const classe = CLASSES[c];
    if (!moi.classeIds.includes(classe.id)) {
      continue; // pas une de mes classes
    }

    const lignes = [];
    for (let i = 0; i < eleves.length; i++) {
      const eleve = eleves[i];
      if (eleve.classeId !== classe.id) {
        continue;
      }

      let progression = "Lecture";
      if (eleve.hizbActuel > 0) {
        progression = "Hizb " + eleve.hizbActuel;
      }

      let stylePresence = "";
      if (eleve.tauxPresence < 85) {
        stylePresence = "font-semibold text-danger";
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
          <td className="px-3 py-3 whitespace-nowrap tabular-nums">
            <button
              type="button"
              onClick={function () {
                mettreAJourHizb(eleve);
              }}
              title="Mettre à jour la progression"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-surface-2"
            >
              {progression}
              <Icon name="edit" size={14} className="text-muted" />
            </button>
          </td>
          <td className={"px-3 py-3 text-right tabular-nums " + stylePresence}>{eleve.tauxPresence} %</td>
          <td className="px-5 py-3">
            <p className="whitespace-nowrap">{eleve.parent}</p>
            <p className="text-xs whitespace-nowrap text-muted tabular-nums">{eleve.telephoneParent}</p>
          </td>
        </tr>,
      );
    }

    blocsClasses.push(
      <section key={classe.id} className="panel min-w-0">
        <header className="flex items-baseline justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="font-display text-[15px] font-semibold">Classe {classe.nom}</h2>
          <p className="text-xs text-muted">
            {lignes.length} élèves · {classe.niveau}
          </p>
        </header>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Élève</th>
                <th className="px-3 py-2.5 font-medium">Progression</th>
                <th className="px-3 py-2.5 text-right font-medium">Présence</th>
                <th className="px-5 py-2.5 font-medium">Parent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">{lignes}</tbody>
          </table>
        </div>
      </section>,
    );
  }

  let messageAucuneClasse = null;
  if (blocsClasses.length === 0) {
    messageAucuneClasse = <p className="panel p-5 text-sm text-muted">Aucune classe ne vous est encore attribuée.</p>;
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
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
      <div>
        <p className="text-sm text-muted">Espace enseignant</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
          Assalamou aleykoum, {moi.civilite} {moi.prenom}
        </h1>
      </div>

      <ListeAnnonces annonces={annonces} />

      <ProchainCours cours={mesCours} enseignants={enseignants} />
      <EmploiDuTemps cours={tousLesCours} enseignants={enseignants} enseignements={enseignements} mesCoursIds={mesCoursIds} libelleMesCours="Mes cours" />

      {bandeau}
      {blocsClasses}
      {messageAucuneClasse}
    </div>
  );
}
