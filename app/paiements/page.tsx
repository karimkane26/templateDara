import type { Metadata } from "next";
import { PaiementsView } from "@/components/PaiementsView";
import { PageHeader } from "@/components/elements";
import { ECOLE } from "@/lib/data";
import { moisLong } from "@/lib/format";

export const metadata: Metadata = { title: "Paiements" };

// Ce qu'on peut trouver dans l'adresse : /paiements?nouveau=1 ou /paiements?statut=retard
interface ParametresAdresse {
  nouveau?: string;
  statut?: string;
}

interface PaiementsPageProps {
  searchParams: Promise<ParametresAdresse>;
}

export default async function PaiementsPage(props: PaiementsPageProps) {
  const parametres = await props.searchParams;

  // ?nouveau=1 -> le formulaire est ouvert dès l'arrivée
  let formulaireOuvert = false;
  if (parametres.nouveau === "1") {
    formulaireOuvert = true;
  }

  // ?statut=retard -> on arrive directement sur l'onglet "En retard"
  let onglet = "journal";
  if (parametres.statut === "retard") {
    onglet = "retard";
  }

  // La "key" force React à recréer le composant quand l'adresse change.
  const cle = parametres.nouveau + "-" + parametres.statut;

  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Paiements" sousTitre={"Mensualités de " + moisLong(ECOLE.moisEnCours)} />
      <PaiementsView key={cle} formulaireOuvert={formulaireOuvert} ongletInitial={onglet} />
    </div>
  );
}
