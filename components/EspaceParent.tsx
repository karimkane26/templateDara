"use client";

/*
 * Espace du parent : ses enfants, leur prochain cours et l'emploi du temps
 * des cours en ligne (Google Meet) de leurs classes.
 */

import { useEffect, useState } from "react";
import { CLASSES, ECOLE, type Cours, type Eleve, type Enseignant } from "@/lib/data";
import { fcfa, initiales, moisLong } from "@/lib/format";
import { chiffresSeulement, lireCours, lireEleves, lireEnseignants, lireSession, type Session } from "@/lib/stockage";
import { Avatar, StatutBadge } from "./elements";
import { EmploiDuTemps, ProchainCours, nomDesEleves } from "./EmploiDuTemps";

/** Mensualité restant à payer pour cet élève (0 s'il est à jour). */
function resteDeLEleve(eleve: Eleve, mensualite: number): number {
  const reste = mensualite - eleve.payeMois;
  if (reste < 0) {
    return 0;
  }
  return reste;
}

export function EspaceParent() {
  const [session, setSession] = useState<Session | null>(null);
  const [enfants, setEnfants] = useState<Eleve[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);

  useEffect(function () {
    const sessionLue = lireSession();
    setSession(sessionLue);
    if (sessionLue === null) {
      return;
    }

    // 1. Les enfants : élèves dont le téléphone du parent est celui du compte
    const tousLesEleves = lireEleves();
    const mesEnfants: Eleve[] = [];
    const mesClasses: string[] = [];
    for (let i = 0; i < tousLesEleves.length; i++) {
      if (chiffresSeulement(tousLesEleves[i].telephoneParent) === sessionLue.id) {
        mesEnfants.push(tousLesEleves[i]);
        mesClasses.push(tousLesEleves[i].classeId);
      }
    }

    // 2. Les cours visibles : ceux de leurs classes, et ceux pour "toutes les classes"
    const tousLesCours = lireCours();
    const mesCours: Cours[] = [];
    for (let i = 0; i < tousLesCours.length; i++) {
      const c = tousLesCours[i];
      if (c.classeId === "toutes" || mesClasses.includes(c.classeId)) {
        mesCours.push(c);
      }
    }

    setEnfants(mesEnfants);
    setCours(mesCours);
    setEnseignants(lireEnseignants());
  }, []);

  if (session === null) {
    return null;
  }

  // Une carte par enfant
  const cartes = [];
  for (let i = 0; i < enfants.length; i++) {
    const enfant = enfants[i];

    let progression = "Apprentissage de la lecture";
    if (enfant.hizbActuel > 0) {
      progression = "Hizb " + enfant.hizbActuel + " sur 60";
    }

    const mensualite = mensualiteDeLaClasse(enfant.classeId);
    let texteMensualite = "Mensualité de " + moisLong(ECOLE.moisEnCours) + " réglée";
    if (enfant.statutMois !== "paye") {
      texteMensualite = "Reste " + fcfa(resteDeLEleve(enfant, mensualite)) + " pour " + moisLong(ECOLE.moisEnCours);
    }

    cartes.push(
      <article key={enfant.id} className="panel p-5">
        <div className="flex items-center gap-3">
          <Avatar texte={initiales(enfant.prenom, enfant.nom)} sexe={enfant.sexe} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              {enfant.prenom} {enfant.nom}
            </h3>
            <p className="text-xs text-muted">
              {nomDesEleves(enfant.classeId)} · {enfant.matricule}
            </p>
          </div>
          <StatutBadge statut={enfant.statutMois} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Mémorisation</dt>
            <dd className="font-semibold">{progression}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Présence ce mois</dt>
            <dd className="font-semibold tabular-nums">{enfant.tauxPresence} %</dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{texteMensualite}</p>
      </article>,
    );
  }

  let messageAucunEnfant = null;
  if (enfants.length === 0) {
    messageAucunEnfant = (
      <p className="panel p-5 text-sm text-muted">Aucun élève n&apos;est rattaché à ce numéro. Contactez l&apos;administration de l&apos;école.</p>
    );
  }

  let titreEnfants = "Mon enfant";
  if (enfants.length > 1) {
    titreEnfants = "Mes enfants";
  }

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
      <div>
        <p className="text-sm text-muted">Espace parent</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
          Assalamou aleykoum, {session.prenom} {session.nom}
        </h1>
      </div>

      <ProchainCours cours={cours} enseignants={enseignants} />

      <section>
        <h2 className="mb-3 font-display text-[15px] font-semibold">{titreEnfants}</h2>
        <div className="grid gap-4 sm:grid-cols-2">{cartes}</div>
        {messageAucunEnfant}
      </section>

      <EmploiDuTemps cours={cours} enseignants={enseignants} />
    </div>
  );
}

/** Mensualité de la classe, en FCFA. */
function mensualiteDeLaClasse(classeId: string): number {
  for (let i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].id === classeId) {
      return CLASSES[i].mensualite;
    }
  }
  return 0;
}
