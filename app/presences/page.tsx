import type { Metadata } from "next";
import { BientotDisponible } from "@/components/BientotDisponible";

export const metadata: Metadata = { title: "Présences" };

export default function Page() {
  return <BientotDisponible titre="Présences" icone="calendarCheck" description="L'appel quotidien par classe arrive ici : marquer présents, absents et retards, puis prévenir les parents des absences." />;
}
