import type { Metadata } from "next";
import { PageHeader } from "@/components/elements";
import { ParentsView } from "@/components/ParentsView";

export const metadata: Metadata = { title: "Parents" };

export default function ParentsPage() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Parents" sousTitre="Les parents d'élèves, leurs enfants et leurs accès à l'espace parent" />
      <ParentsView />
    </div>
  );
}
