import type { Metadata } from "next";
import { PageHeader } from "@/components/elements";
import { EnseignantsView } from "@/components/EnseignantsView";

export const metadata: Metadata = { title: "Enseignants" };

export default function EnseignantsPage() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Enseignants" sousTitre="Les oustaz de l'école et leurs accès à l'espace enseignant" />
      <EnseignantsView />
    </div>
  );
}
