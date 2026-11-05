import type { Metadata } from "next";
import { PageHeader } from "@/components/elements";
import { EnseignementsView } from "@/components/EnseignementsView";

export const metadata: Metadata = { title: "Enseignements" };

export default function EnseignementsPage() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Enseignements" sousTitre="Les matières enseignées à l'école et leurs cours en ligne" />
      <EnseignementsView />
    </div>
  );
}
