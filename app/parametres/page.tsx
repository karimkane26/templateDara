import type { Metadata } from "next";
import { BientotDisponible } from "@/components/BientotDisponible";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return <BientotDisponible titre="Paramètres" icone="settings" description="Réglez ici le nom de l'école, l'année scolaire, les classes et le montant des mensualités." />;
}
