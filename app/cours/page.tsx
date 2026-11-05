import type { Metadata } from "next";
import { CoursView } from "@/components/CoursView";
import { PageHeader } from "@/components/elements";

export const metadata: Metadata = { title: "Cours en ligne" };

export default function CoursPage() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre="Cours en ligne" sousTitre="Emploi du temps des cours sur Google Meet" />
      <CoursView />
    </div>
  );
}
