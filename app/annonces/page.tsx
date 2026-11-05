import type { Metadata } from "next";
import { AnnoncesView } from "@/components/Annonces";
import { PageHeader } from "@/components/elements";

export const metadata: Metadata = { title: "Annonces" };

export default function AnnoncesPage() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader titre="Annonces" sousTitre="Messages affichés dans l'espace des enseignants et des parents" />
      <AnnoncesView />
    </div>
  );
}
