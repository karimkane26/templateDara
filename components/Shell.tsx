"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ECOLE, relances } from "@/lib/data";
import { Icon, type IconName } from "./Icon";
import { ProfilUtilisateur } from "./ProfilUtilisateur";
import { ThemeToggle } from "./ThemeToggle";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Tableau de bord", icon: "dashboard" },
  { href: "/eleves", label: "Élèves", icon: "users" },
  { href: "/paiements", label: "Paiements", icon: "wallet" },
  { href: "/classes", label: "Classes", icon: "book" },
  { href: "/presences", label: "Présences", icon: "calendarCheck" },
  { href: "/enseignants", label: "Enseignants", icon: "teacher" },
];

const nbRelances = relances().length;

export function Shell({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOuvert(false), [pathname]);

  const actif = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Barre latérale */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-line bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
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
            onClick={() => setOuvert(false)}
            aria-label="Fermer le menu"
            className="ml-auto grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3" aria-label="Navigation principale">
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={actif(item.href) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    actif(item.href) ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon name={item.icon} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/paiements" && nbRelances > 0 && (
                    <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-danger">
                      {nbRelances}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/parametres"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              actif("/parametres") ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon name="settings" />
            Paramètres
          </Link>
          <ProfilUtilisateur />
        </div>
      </aside>

      {ouvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Contenu */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setOuvert(true)}
              aria-label="Ouvrir le menu"
              className="grid size-10 place-items-center rounded-lg border border-line text-muted lg:hidden"
            >
              <Icon name="menu" />
            </button>

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

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/paiements?nouveau=1"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90 sm:px-4"
              >
                <Icon name="plus" />
                <span className="hidden sm:inline">Enregistrer un paiement</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
