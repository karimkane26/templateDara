import type { Metadata } from "next";
import { EspaceParent } from "@/components/EspaceParent";

export const metadata: Metadata = { title: "Espace parent" };

export default function EspaceParentPage() {
  return <EspaceParent />;
}
