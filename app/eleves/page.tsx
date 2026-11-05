import type { Metadata } from "next";
import { ElevesTable } from "@/components/ElevesTable";
import { PageHeader } from "@/components/elements";

export const metadata: Metadata = { title: "Élèves" };

// Ce qu'on peut trouver dans l'adresse : /eleves?q=Diop
interface ParametresAdresse {
  q?: string;
}

interface ElevesPageProps {
  searchParams: Promise<ParametresAdresse>;
}

export default async function ElevesPage(props: ElevesPageProps) {
  const parametres = await props.searchParams;

  // Texte tapé dans la barre de recherche du haut (vide s'il n'y en a pas)
  let recherche = "";
  if (parametres.q) {
    recherche = parametres.q;
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Élèves" sousTitre="Élèves inscrits cette année, et comptes des parents" />
      <ElevesTable key={recherche} rechercheInitiale={recherche} />
    </div>
  );
}
