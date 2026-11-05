"use client";

/*
 * Le "cadre" de l'application : la barre latérale (menu) à gauche
 * et la barre du haut (recherche, thème, bouton de paiement).
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ECOLE, relances } from "@/lib/data";
import { accueilDuRole, lireSession, pageAutorisee, type Session } from "@/lib/stockage";
import { Icon } from "./Icon";
import { ProfilUtilisateur } from "./ProfilUtilisateur";
import { ThemeToggle } from "./ThemeToggle";

interface LienMenu {
  href: string;
  label: string;
  icon: string;
}

// Un menu différent pour chaque sorte de compte
const MENU_ADMIN: LienMenu[] = [
  { href: "/", label: "Tableau de bord", icon: "dashboard" },
  { href: "/eleves", label: "Élèves", icon: "users" },
  { href: "/paiements", label: "Paiements", icon: "wallet" },
  { href: "/classes", label: "Classes", icon: "book" },
  { href: "/presences", label: "Présences", icon: "calendarCheck" },
  { href: "/enseignants", label: "Enseignants", icon: "teacher" },
  { href: "/cours", label: "Cours en ligne", icon: "video" },
];

const MENU_ENSEIGNANT: LienMenu[] = [{ href: "/espace-enseignant", label: "Mon espace", icon: "home" }];

const MENU_PARENT: LienMenu[] = [{ href: "/espace-parent", label: "Mon espace", icon: "home" }];

// Nombre d'élèves en retard de paiement (affiché en rouge à côté de "Paiements")
const nombreDeRelances = relances().length;

const LIEN_ACTIF = "bg-primary-soft text-primary";
const LIEN_INACTIF = "text-muted hover:bg-surface-2 hover:text-ink";

interface ShellProps {
  children: ReactNode;
}

export function Shell(props: ShellProps) {
  // Sur téléphone, le menu est caché : "menuOuvert" dit s'il est affiché.
  const [menuOuvert, setMenuOuvert] = useState(false);
  const pageActuelle = usePathname();
  const router = useRouter();

  // La personne connectée (null = personne). "verifie" passe à true une fois la session lue.
  const [session, setSession] = useState<Session | null>(null);
  const [verifie, setVerifie] = useState(false);

  // À chaque changement de page : on referme le menu et on vérifie qui est connecté.
  useEffect(
    function () {
      setMenuOuvert(false);

      const sessionLue = lireSession();
      setSession(sessionLue);
      setVerifie(true);

      if (pageActuelle === "/connexion") {
        return;
      }
      if (sessionLue === null) {
        // Personne n'est connecté : direction la page de connexion
        router.replace("/connexion");
      } else if (!pageAutorisee(sessionLue.role, pageActuelle)) {
        // Page interdite pour ce compte : on le renvoie vers son espace
        router.replace(accueilDuRole(sessionLue.role));
      }
    },
    [pageActuelle, router],
  );

  // La page de connexion s'affiche seule, sans menu.
  if (pageActuelle === "/connexion") {
    return <>{props.children}</>;
  }

  // Tant qu'on ne sait pas qui est connecté (ou si la page est interdite), on attend.
  if (!verifie || session === null || !pageAutorisee(session.role, pageActuelle)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="text-sm text-muted">Chargement…</p>
      </div>
    );
  }

  const estAdmin = session.role === "admin";

  let menu = MENU_ADMIN;
  if (session.role === "enseignant") {
    menu = MENU_ENSEIGNANT;
  } else if (session.role === "parent") {
    menu = MENU_PARENT;
  }

  function ouvrirMenu() {
    setMenuOuvert(true);
  }

  function fermerMenu() {
    setMenuOuvert(false);
  }

  /** Vrai si le lien correspond à la page affichée. */
  function estLaPageActuelle(href: string): boolean {
    if (href === "/") {
      return pageActuelle === "/";
    }
    return pageActuelle.startsWith(href);
  }

  // On fabrique les liens du menu un par un.
  const liens = [];
  for (let i = 0; i < menu.length; i++) {
    const lien = menu[i];
    const actif = estLaPageActuelle(lien.href);

    let couleurs = LIEN_INACTIF;
    let ariaCurrent: "page" | undefined = undefined;
    if (actif) {
      couleurs = LIEN_ACTIF;
      ariaCurrent = "page";
    }

    // Pastille rouge avec le nombre de retards, seulement sur "Paiements"
    let pastille = null;
    if (lien.href === "/paiements" && nombreDeRelances > 0) {
      pastille = (
        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-danger">
          {nombreDeRelances}
        </span>
      );
    }

    liens.push(
      <li key={lien.href}>
        <Link
          href={lien.href}
          aria-current={ariaCurrent}
          className={"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " + couleurs}
        >
          <Icon name={lien.icon} />
          <span className="flex-1">{lien.label}</span>
          {pastille}
        </Link>
      </li>,
    );
  }

  // Lien "Paramètres" : seulement pour l'administrateur
  let lienParametres = null;
  if (estAdmin) {
    let couleursParametres = LIEN_INACTIF;
    if (estLaPageActuelle("/parametres")) {
      couleursParametres = LIEN_ACTIF;
    }
    lienParametres = (
      <Link
        href="/parametres"
        className={"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " + couleursParametres}
      >
        <Icon name="settings" />
        Paramètres
      </Link>
    );
  }

  // Recherche d'élève et bouton "Enregistrer un paiement" : seulement pour l'administrateur
  let rechercheGlobale = <div className="flex-1" />;
  let boutonPaiement = null;
  if (estAdmin) {
    rechercheGlobale = (
      // La recherche envoie vers /eleves?q=...
      <form action="/eleves" role="search" className="relative min-w-0 flex-1 sm:max-w-sm">
        <label htmlFor="recherche-globale" className="sr-only">
          Rechercher un élève
        </label>
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          id="recherche-globale"
          name="q"
          type="search"
          placeholder="Rechercher un élève, un parent…"
          className="h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-10 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </form>
    );
    boutonPaiement = (
      <Link
        href="/paiements?nouveau=1"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90 sm:px-4"
      >
        <Icon name="plus" />
        <span className="hidden sm:inline">Enregistrer un paiement</span>
      </Link>
    );
  }

  // Position de la barre latérale sur téléphone : visible ou cachée à gauche
  let positionBarreLaterale = "-translate-x-full";
  if (menuOuvert) {
    positionBarreLaterale = "translate-x-0";
  }

  // Fond sombre derrière le menu, sur téléphone
  let fondSombre = null;
  if (menuOuvert) {
    fondSombre = (
      <button type="button" aria-label="Fermer le menu" onClick={fermerMenu} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />
    );
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Barre latérale */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 " +
          positionBarreLaterale
        }
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-6">
          <span className="grid size-11 place-items-center rounded-xl bg-primary font-display text-2xl leading-none text-primary-ink">
            د
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[17px] font-semibold leading-tight">{ECOLE.nom}</p>
            <p className="text-xs text-muted">Année {ECOLE.annee}</p>
          </div>
          <button
            type="button"
            onClick={fermerMenu}
            aria-label="Fermer le menu"
            className="ml-auto grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3" aria-label="Navigation principale">
          <ul className="flex flex-col gap-0.5">{liens}</ul>
        </nav>

        <div className="border-t border-line p-3">
          {lienParametres}
          <ProfilUtilisateur session={session} />
        </div>
      </aside>

      {fondSombre}

      {/* Contenu de la page */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={ouvrirMenu}
              aria-label="Ouvrir le menu"
              className="grid size-10 place-items-center rounded-lg border border-line text-muted lg:hidden"
            >
              <Icon name="menu" />
            </button>

            {rechercheGlobale}

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              {boutonPaiement}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{props.children}</main>
      </div>
    </div>
  );
}
