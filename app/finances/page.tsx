import type { Metadata } from "next";
import { PageHeader } from "@/components/elements";
import { GestionFinanciere } from "@/components/finances/GestionFinanciere";

export const metadata: Metadata = { title: "Gestion financière" };

// Ce qu'on peut trouver dans l'adresse : /finances?onglet=salaires
interface ParametresAdresse {
  onglet?: string;
}

interface FinancesPageProps {
  searchParams: Promise<ParametresAdresse>;
}

export default async function FinancesPage(props: FinancesPageProps) {
  const parametres = await props.searchParams;

  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Gestion financière" sousTitre="Inscriptions, paiements, factures et reçus, salaires et dépenses de l'école" />
      <GestionFinanciere key={parametres.onglet} ongletInitial={parametres.onglet} />
    </div>
  );
}
