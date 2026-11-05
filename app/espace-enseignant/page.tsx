import type { Metadata } from "next";
import { EspaceEnseignant } from "@/components/EspaceEnseignant";

export const metadata: Metadata = { title: "Espace enseignant" };

export default function EspaceEnseignantPage() {
  return <EspaceEnseignant />;
}
