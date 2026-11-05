import type { Metadata } from "next";
import { BientotDisponible } from "@/components/BientotDisponible";

export const metadata: Metadata = { title: "Enseignants" };

export default function Page() {
  return <BientotDisponible titre="Enseignants" icone="teacher" description="La fiche de chaque oustaz arrive ici : classes suivies, emploi du temps et suivi des indemnités." />;
}
