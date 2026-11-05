import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Shell } from "@/components/Shell";
import { SCRIPT_THEME } from "@/components/ThemeToggle";
import { ECOLE } from "@/lib/data";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: ECOLE.nom, template: `%s · ${ECOLE.nom}` },
  description: "Gestion de l'école : élèves, mensualités, présences et classes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="font-sans">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
