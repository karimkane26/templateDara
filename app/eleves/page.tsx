import type { Metadata } from "next";
import { ElevesTable } from "@/components/ElevesTable";
import { PageHeader } from "@/components/ui";
import { ELEVES } from "@/lib/data";

export const metadata: Metadata = { title: "Élèves" };

export default async function ElevesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Élèves" sousTitre={`${ELEVES.length} élèves inscrits cette année`} />
      <ElevesTable key={q ?? ""} rechercheInitiale={q ?? ""} />
    </div>
  );
}
