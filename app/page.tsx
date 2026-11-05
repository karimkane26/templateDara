import { CollecteHero } from "@/components/dashboard/CollecteHero";
import { EncaissementsChart } from "@/components/dashboard/EncaissementsChart";
import { ModesPaiement, PaiementsRecents, PresenceDuJour, ProgressionClasses, Relances } from "@/components/dashboard/Cartes";
import { Panel } from "@/components/elements";
import { CLASSES, ELEVES, ECOLE } from "@/lib/data";
import { dateLongue } from "@/lib/format";

export default function TableauDeBord() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{dateLongue(ECOLE.aujourdhui)}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-[28px]">Assalamou aleykoum</h1>
        </div>
        <p className="text-sm text-muted" dir="auto">
          <span className="font-display text-base text-ink" lang="ar">{ECOLE.nomArabe}</span>
          <span className="mx-2 text-line">|</span>
          {ELEVES.length} élèves, {CLASSES.length} classes
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <CollecteHero />
        <div className="flex flex-col gap-5">
          <PresenceDuJour />
          <ModesPaiement />
        </div>

        <Panel titre="Encaissements mensuels" className="lg:col-span-2">
          <EncaissementsChart />
        </Panel>
        <Relances />

        <PaiementsRecents />
        <ProgressionClasses />
      </div>
    </div>
  );
}
