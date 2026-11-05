"use client";

/*
 * Espace du parent : les annonces, ses enfants, leur prochain cours et l'emploi du temps
 * de TOUS les cours en ligne (Google Meet), avec un filtre "Cours de mes enfants".
 */

import { useEffect, useState } from "react";
import { CLASSES, ECOLE, type Annonce, type Cours, type Eleve, type Enseignant, type Enseignement } from "@/lib/data";
import { fcfa, initiales, moisLong } from "@/lib/format";
import {
  annoncesPour,
  chiffresSeulement,
  enfantsDuParent,
  lireCours,
  lireEleves,
  lireEnseignants,
  lireEnseignements,
  lireParents,
  lireSession,
  trouverParent,
  trouverParentParTelephone,
  type Session,
} from "@/lib/stockage";
import { ListeAnnonces } from "./Annonces";
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
  const [tousLesCours, setTousLesCours] = useState<Cours[]>([]);
  const [mesCours, setMesCours] = useState<Cours[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [enseignements, setEnseignements] = useState<Enseignement[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);

  useEffect(function () {
    const sessionLue = lireSession();
    setSession(sessionLue);
    if (sessionLue === null) {
      return;
    }

    // 1. Ma fiche parent (les anciennes sessions gardaient le numéro de téléphone comme id)
    const parents = lireParents();
    let moi = trouverParent(parents, sessionLue.id);
    if (moi === undefined) {
      moi = trouverParentParTelephone(parents, chiffresSeulement(sessionLue.id));
    }

    // 2. Mes enfants : les élèves inscrits avec mon numéro de téléphone
    let mesEnfants: Eleve[] = [];
    if (moi !== undefined) {
      mesEnfants = enfantsDuParent(moi, lireEleves());
    }
    const mesClasses: string[] = [];
    for (let i = 0; i < mesEnfants.length; i++) {
      mesClasses.push(mesEnfants[i].classeId);
    }

    // 3. Tous les cours sont visibles ; "mes cours" = ceux des classes de mes enfants et ceux pour toute l'école
    const cours = lireCours();
    const coursDeMesEnfants: Cours[] = [];
    for (let i = 0; i < cours.length; i++) {
      const c = cours[i];
      if (c.classeId === "toutes" || mesClasses.includes(c.classeId)) {
        coursDeMesEnfants.push(c);
      }
    }

    setEnfants(mesEnfants);
    setTousLesCours(cours);
    setMesCours(coursDeMesEnfants);
    setEnseignants(lireEnseignants());
    setEnseignements(lireEnseignements());
    setAnnonces(annoncesPour("parent"));
  }, []);

  if (session === null) {
    return null;
  }

  const mesCoursIds: string[] = [];
  for (let i = 0; i < mesCours.length; i++) {
    mesCoursIds.push(mesCours[i].id);
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

      <ListeAnnonces annonces={annonces} />

      <ProchainCours cours={mesCours} enseignants={enseignants} />

      <section>
        <h2 className="mb-3 font-display text-[15px] font-semibold">{titreEnfants}</h2>
        <div className="grid gap-4 sm:grid-cols-2">{cartes}</div>
        {messageAucunEnfant}
      </section>

      <EmploiDuTemps cours={tousLesCours} enseignants={enseignants} enseignements={enseignements} mesCoursIds={mesCoursIds} libelleMesCours="Cours de mes enfants" />
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
