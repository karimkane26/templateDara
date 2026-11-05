"use client";

/*
 * Page "Gestion financière" (administrateur) :
 *  - en haut, le bilan d'un mois : recettes, dépenses, solde, reste à encaisser ;
 *  - en dessous, un onglet par rubrique : inscriptions, paiements des élèves,
 *    factures et reçus, salaires des enseignants, dépenses.
 *
 * Quand un onglet enregistre quelque chose, il appelle "actualiser()" :
 * le compteur "version" augmente et le bilan est recalculé.
 */

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ECOLE } from "@/lib/data";
import { bilanDuMois, moisDisponibles, type Bilan } from "@/lib/finances";
import { fcfa, moisLong } from "@/lib/format";
import { ListeDeChoix, type OptionDeChoix } from "../ListeDeChoix";
import { PaiementsView } from "../PaiementsView";
import { Depenses } from "./Depenses";
import { FacturesRecus } from "./FacturesRecus";
import { Inscriptions } from "./Inscriptions";
import { CarteChiffre } from "./outils";
import { Salaires } from "./Salaires";

const BILAN_VIDE: Bilan = {
  mensualites: 0,
  inscriptions: 0,
  recettes: 0,
  salaires: 0,
  depenses: 0,
  totalDepenses: 0,
  solde: 0,
  resteAEncaisser: 0,
};

// Les onglets, dans l'ordre du menu
const ONGLETS = [
  { valeur: "inscriptions", texte: "Inscriptions et frais" },
  { valeur: "paiements", texte: "Paiements des élèves" },
  { valeur: "factures", texte: "Factures et reçus" },
  { valeur: "salaires", texte: "Salaires des enseignants" },
  { valeur: "depenses", texte: "Dépenses" },
];

interface GestionFinanciereProps {
  ongletInitial?: string;
}

export function GestionFinanciere(props: GestionFinanciereProps) {
  let ongletDeDepart = "inscriptions";
  for (let i = 0; i < ONGLETS.length; i++) {
    if (ONGLETS[i].valeur === props.ongletInitial) {
      ongletDeDepart = ONGLETS[i].valeur;
    }
  }

  const [onglet, setOnglet] = useState(ongletDeDepart);
  const [mois, setMois] = useState(ECOLE.moisEnCours);
  const [listeMois, setListeMois] = useState<string[]>([ECOLE.moisEnCours]);
  const [bilan, setBilan] = useState<Bilan>(BILAN_VIDE);
  const [version, setVersion] = useState(0);

  // On recalcule le bilan quand on change de mois ou quand un onglet a enregistré quelque chose
  useEffect(
    function () {
      setBilan(bilanDuMois(mois));
      setListeMois(moisDisponibles());
    },
    [mois, version],
  );

  function actualiser() {
    setVersion(version + 1);
  }

  const optionsMois: OptionDeChoix[] = [];
  for (let i = 0; i < listeMois.length; i++) {
    optionsMois.push({ valeur: listeMois[i], texte: moisLong(listeMois[i]) });
  }

  let couleurSolde: "vert" | "rouge" = "vert";
  let texteSolde = "Bénéfice du mois";
  if (bilan.solde < 0) {
    couleurSolde = "rouge";
    texteSolde = "Déficit du mois";
  }

  const declencheurs = [];
  for (let i = 0; i < ONGLETS.length; i++) {
    declencheurs.push(
      <TabsTrigger key={ONGLETS[i].valeur} value={ONGLETS[i].valeur} className="flex-none px-3">
        {ONGLETS[i].texte}
      </TabsTrigger>,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[17px] font-semibold">Bilan de</h2>
          <ListeDeChoix id="bilan-mois" label="Mois du bilan" value={mois} onChange={setMois} options={optionsMois} className="w-48" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CarteChiffre
            titre="Recettes"
            valeur={fcfa(bilan.recettes)}
            couleur="vert"
            detail={"Mensualités " + fcfa(bilan.mensualites) + " · Inscriptions " + fcfa(bilan.inscriptions)}
          />
          <CarteChiffre
            titre="Dépenses"
            valeur={fcfa(bilan.totalDepenses)}
            couleur="rouge"
            detail={"Salaires " + fcfa(bilan.salaires) + " · Autres " + fcfa(bilan.depenses)}
          />
          <CarteChiffre titre={texteSolde} valeur={fcfa(bilan.solde)} couleur={couleurSolde} detail="Recettes moins dépenses" />
          <CarteChiffre titre="Mensualités à encaisser" valeur={fcfa(bilan.resteAEncaisser)} couleur="ocre" detail={"Pour " + moisLong(mois)} />
        </div>
      </section>

      <Tabs value={onglet} onValueChange={setOnglet}>
        {/* Sur téléphone, les onglets défilent horizontalement */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <TabsList className="h-10!">{declencheurs}</TabsList>
        </div>

        <TabsContent value="inscriptions" className="mt-3">
          <Inscriptions onChange={actualiser} />
        </TabsContent>
        <TabsContent value="paiements" className="mt-3">
          <PaiementsView onPaiementEnregistre={actualiser} />
        </TabsContent>
        <TabsContent value="factures" className="mt-3">
          <FacturesRecus version={version} />
        </TabsContent>
        <TabsContent value="salaires" className="mt-3">
          <Salaires onChange={actualiser} />
        </TabsContent>
        <TabsContent value="depenses" className="mt-3">
          <Depenses onChange={actualiser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
