import type { ReactNode } from "react";
import type { ModePaiement, StatutPaiement } from "@/lib/data";

const STATUT: Record<StatutPaiement, { label: string; cls: string }> = {
  paye: { label: "Payé", cls: "bg-primary-soft text-primary" },
  partiel: { label: "Partiel", cls: "bg-ochre-soft text-ochre" },
  impaye: { label: "Impayé", cls: "bg-danger-soft text-danger" },
};

export function StatutBadge({ statut }: { statut: StatutPaiement }) {
  const s = STATUT[statut];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

const MODE_CLS: Record<ModePaiement, string> = {
  Wave: "text-wave",
  "Orange Money": "text-orange-money",
  Espèces: "text-muted",
};

export function ModeLabel({ mode }: { mode: ModePaiement }) {
  return <span className={`text-sm font-medium ${MODE_CLS[mode]}`}>{mode}</span>;
}

export function Avatar({ texte, sexe }: { texte: string; sexe: "M" | "F" }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
        sexe === "F" ? "bg-ochre-soft text-ochre" : "bg-primary-soft text-primary"
      }`}
    >
      {texte}
    </span>
  );
}

export function Panel({
  titre,
  action,
  children,
  className = "",
}: {
  titre?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel flex min-w-0 flex-col ${className}`}>
      {titre && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="font-display text-[15px] font-semibold">{titre}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ titre, sousTitre, action }: { titre: string; sousTitre?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">{titre}</h1>
        {sousTitre && <p className="mt-1 text-sm text-muted">{sousTitre}</p>}
      </div>
      {action}
    </div>
  );
}
