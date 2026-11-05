"use client";

/*
 * Espace de l'enseignant : son prochain cours, son emploi du temps (Google Meet)
 * et la liste des élèves de ses classes.
 */

import { useEffect, useState } from "react";
import { CLASSES, type Cours, type Eleve, type Enseignant } from "@/lib/data";
import { initiales } from "@/lib/format";
import { lireCours, lireEleves, lireEnseignants, lireSession, trouverEnseignant } from "@/lib/stockage";
import { Avatar } from "./elements";
import { EmploiDuTemps, ProchainCours } from "./EmploiDuTemps";

export function EspaceEnseignant() {
  const [enseignant, setEnseignant] = useState<Enseignant | null>(null);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(function () {
    const session = lireSession();
    const liste = lireEnseignants();
    setEnseignants(liste);
    setCharge(true);

    if (session === null) {
      return;
    }
    const moi = trouverEnseignant(liste, session.id);
    if (moi === undefined) {
      return; // compte supprimé par l'administrateur
    }
    setEnseignant(moi);

    // Mes cours : ceux dont je suis l'enseignant
    const tousLesCours = lireCours();
    const mesCours: Cours[] = [];
    for (let i = 0; i < tousLesCours.length; i++) {
      if (tousLesCours[i].enseignantId === moi.id) {
        mesCours.push(tousLesCours[i]);
      }
    }
    setCours(mesCours);

    // Mes élèves : ceux de mes classes
    const tousLesEleves = lireEleves();
    const mesEleves: Eleve[] = [];
    for (let i = 0; i < tousLesEleves.length; i++) {
      if (moi.classeIds.includes(tousLesEleves[i].classeId)) {
        mesEleves.push(tousLesEleves[i]);
      }
    }
    setEleves(mesEleves);
  }, []);

  if (!charge) {
    return null;
  }

  if (enseignant === null) {
    return <p className="panel p-5 text-sm text-muted">Ce compte enseignant n&apos;existe plus. Contactez l&apos;administration.</p>;
  }

  // Un tableau d'élèves par classe
  const blocsClasses = [];
  for (let c = 0; c < CLASSES.length; c++) {
    const classe = CLASSES[c];
    if (!enseignant.classeIds.includes(classe.id)) {
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
          <td className="px-3 py-3 whitespace-nowrap tabular-nums">{progression}</td>
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

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
      <div>
        <p className="text-sm text-muted">Espace enseignant</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
          Assalamou aleykoum, {enseignant.civilite} {enseignant.prenom}
        </h1>
      </div>

      <ProchainCours cours={cours} enseignants={enseignants} />
      <EmploiDuTemps cours={cours} enseignants={enseignants} />

      {blocsClasses}
      {messageAucuneClasse}
    </div>
  );
}
