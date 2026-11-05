import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Shell } from "@/components/Shell";
import { SCRIPT_THEME } from "@/components/ThemeToggle";
import { ECOLE } from "@/lib/data";
import "./globals.css";

// Les deux polices du site (titres et texte)
const policeTitres = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const policeTexte = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: ECOLE.nom, template: "%s · " + ECOLE.nom },
  description: "Gestion de l'école : élèves, mensualités, présences et classes.",
};

interface RootLayoutProps {
  children: ReactNode;
}

// Ce modèle entoure toutes les pages du site.
export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="fr" className={policeTitres.variable + " " + policeTexte.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="font-sans">
        <Shell>{props.children}</Shell>
      </body>
    </html>
  );
}
