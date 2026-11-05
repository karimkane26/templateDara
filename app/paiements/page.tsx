import type { Metadata } from "next";
import { PaiementsView } from "@/components/PaiementsView";
import { PageHeader } from "@/components/ui";
import { ECOLE } from "@/lib/data";
import { moisLong } from "@/lib/format";

export const metadata: Metadata = { title: "Paiements" };

export default async function PaiementsPage({ searchParams }: { searchParams: Promise<{ nouveau?: string; statut?: string }> }) {
  const { nouveau, statut } = await searchParams;
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Paiements" sousTitre={`Mensualités de ${moisLong(ECOLE.moisEnCours)}`} />
      <PaiementsView key={`${nouveau}-${statut}`} formulaireOuvert={nouveau === "1"} ongletInitial={statut === "retard" ? "retard" : "journal"} />
    </div>
  );
}
