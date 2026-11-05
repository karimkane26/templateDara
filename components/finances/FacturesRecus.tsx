"use client";

/*
 * Onglet "Factures et reçus".
 *  - Factures : pour un mois choisi, une facture par élève (mensualité + frais
 *    d'inscription s'ils ne sont pas réglés), avec ce qui est déjà payé et le reste.
 *  - Reçus : un reçu numéroté pour chaque somme encaissée.
 * Chaque document s'ouvre dans une fenêtre, s'imprime (ou s'enregistre en PDF)
 * et peut être envoyé au parent sur WhatsApp.
 */

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ECOLE, type Eleve, type Inscription, type Paiement } from "@/lib/data";
import { eleveDe, factureDe, lireInscriptions, lirePaiements, listeDesRecus, moisDisponibles, type Facture, type Recu } from "@/lib/finances";
import { dateCourte, fcfa, moisLong } from "@/lib/format";
import { lireEleves } from "@/lib/stockage";
import { Icon } from "../Icon";
import { ListeDeChoix, type OptionDeChoix } from "../ListeDeChoix";
import { DocumentFinancier, documentDepuisFacture, documentDepuisRecu, lienWhatsAppParent, type ContenuDocument } from "./DocumentFinancier";
import { BoutonIcone, CarteChiffre, PastilleEtat } from "./outils";

interface FacturesRecusProps {
  version: number; // change quand un paiement est ajouté ailleurs : on relit les données
}

export function FacturesRecus(props: FacturesRecusProps) {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [recus, setRecus] = useState<Recu[]>([]);
  const [listeMois, setListeMois] = useState<string[]>([ECOLE.moisEnCours]);

  const [mois, setMois] = useState(ECOLE.moisEnCours);
  const [seulementImpayees, setSeulementImpayees] = useState(false);
  const [recherche, setRecherche] = useState("");

  const [document, setDocument] = useState<ContenuDocument | null>(null);
  const [lienWhatsApp, setLienWhatsApp] = useState<string | undefined>(undefined);

  const version = props.version;
  useEffect(
    function () {
      setEleves(lireEleves());
      setPaiements(lirePaiements());
      setInscriptions(lireInscriptions());
      setRecus(listeDesRecus());
      setListeMois(moisDisponibles());
    },
    [version],
  );

  function ouvrirFacture(facture: Facture) {
    setDocument(documentDepuisFacture(facture));
    let texte = "Assalamou aleykoum. " + ECOLE.nom + " : facture " + facture.numero + " de " + moisLong(facture.mois) + ", total " + fcfa(facture.total) + ".";
    if (facture.reste > 0) {
      texte = texte + " Reste à payer : " + fcfa(facture.reste) + " (Wave, Orange Money ou espèces). Merci.";
    } else {
      texte = texte + " Tout est réglé, merci.";
    }
    setLienWhatsApp(lienWhatsAppParent(facture.eleve, texte));
  }

  function ouvrirRecu(recu: Recu) {
    const eleve = eleveDe(eleves, recu.eleveId);
    setDocument(documentDepuisRecu(recu, eleve));
    setLienWhatsApp(lienWhatsAppParent(eleve, "Assalamou aleykoum. " + ECOLE.nom + " : reçu " + recu.numero + ", " + recu.objet + ", " + fcfa(recu.montant) + ". Merci."));
  }

  function fermerDocument() {
    setDocument(null);
  }

  const texteCherche = recherche.trim().toLowerCase();

  /** Vrai si l'élève correspond à la recherche. */
  function correspond(eleve: Eleve | undefined): boolean {
    if (texteCherche === "") {
      return true;
    }
    if (eleve === undefined) {
      return false;
    }
    return (eleve.prenom + " " + eleve.nom + " " + eleve.matricule + " " + eleve.parent).toLowerCase().includes(texteCherche);
  }

  /* ---------- Factures du mois ---------- */

  let totalFacture = 0;
  let totalPaye = 0;
  let nombreImpayees = 0;
  const lignesFactures = [];
  for (let i = 0; i < eleves.length; i++) {
    const facture = factureDe(eleves[i], mois, paiements, inscriptions);
    totalFacture = totalFacture + facture.total;
    totalPaye = totalPaye + facture.paye;
    if (facture.reste > 0) {
      nombreImpayees = nombreImpayees + 1;
    }

    if (seulementImpayees && facture.reste === 0) continue;
    if (!correspond(facture.eleve)) continue;

    lignesFactures.push(
      <tr key={facture.numero} className="hover:bg-surface-2/60">
        <td className="px-5 py-3 font-mono text-xs">{facture.numero}</td>
        <td className="px-3 py-3">
          <p className="font-semibold">
            {facture.eleve.prenom} {facture.eleve.nom}
          </p>
          <p className="text-xs text-muted">{facture.eleve.parent}</p>
        </td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(facture.total)}</td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(facture.reste)}</td>
        <td className="px-3 py-3">
          <PastilleEtat paye={facture.paye} total={facture.total} />
        </td>
        <td className="px-5 py-3 text-right">
          <BoutonIcone icone="printer" label={"Voir la facture " + facture.numero} onClick={function () { ouvrirFacture(facture); }} />
        </td>
      </tr>,
    );
  }

  /* ---------- Reçus ---------- */

  const lignesRecus = [];
  for (let i = 0; i < recus.length; i++) {
    const recu = recus[i];
    const eleve = eleveDe(eleves, recu.eleveId);
    if (!correspond(eleve)) continue;

    let nom = "Élève retiré";
    if (eleve !== undefined) {
      nom = eleve.prenom + " " + eleve.nom;
    }

    lignesRecus.push(
      <tr key={recu.numero} className="hover:bg-surface-2/60">
        <td className="px-5 py-3 font-mono text-xs">{recu.numero}</td>
        <td className="px-3 py-3 whitespace-nowrap">{dateCourte(recu.date)}</td>
        <td className="px-3 py-3 font-semibold">{nom}</td>
        <td className="px-3 py-3">{recu.objet}</td>
        <td className="px-3 py-3 text-right tabular-nums">{fcfa(recu.montant)}</td>
        <td className="px-3 py-3 text-xs text-muted">{recu.mode}</td>
        <td className="px-5 py-3 text-right">
          <BoutonIcone icone="printer" label={"Voir le reçu " + recu.numero} onClick={function () { ouvrirRecu(recu); }} />
        </td>
      </tr>,
    );
  }

  const optionsMois: OptionDeChoix[] = [];
  for (let i = 0; i < listeMois.length; i++) {
    optionsMois.push({ valeur: listeMois[i], texte: moisLong(listeMois[i]) });
  }

  let videFactures = null;
  if (lignesFactures.length === 0) {
    videFactures = <p className="px-5 py-10 text-center text-sm text-muted">Aucune facture ne correspond.</p>;
  }
  let videRecus = null;
  if (lignesRecus.length === 0) {
    videRecus = <p className="px-5 py-10 text-center text-sm text-muted">Aucun reçu ne correspond.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <Tabs defaultValue="factures">
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="factures" className="px-4">Factures</TabsTrigger>
            <TabsTrigger value="recus" className="px-4">Reçus ({recus.length})</TabsTrigger>
          </TabsList>
          <div className="relative min-w-52 flex-1">
            <label htmlFor="doc-recherche" className="sr-only">Rechercher un élève</label>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <Input id="doc-recherche" value={recherche} onChange={function (ev) { setRecherche(ev.target.value); }} placeholder="Nom, matricule ou parent" className="h-10 bg-surface pl-10" />
          </div>
        </div>

        <TabsContent value="factures" className="mt-3 flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <CarteChiffre titre={"Total facturé, " + moisLong(mois)} valeur={fcfa(totalFacture)} />
            <CarteChiffre titre="Déjà payé" valeur={fcfa(totalPaye)} couleur="vert" />
            <CarteChiffre titre="Factures non soldées" valeur={String(nombreImpayees)} couleur="rouge" detail={"Reste " + fcfa(totalFacture - totalPaye)} />
          </div>
          <section className="panel min-w-0">
            <div className="flex flex-wrap items-center gap-4 border-b border-line p-4">
              <ListeDeChoix id="facture-mois" label="Mois" value={mois} onChange={setMois} options={optionsMois} className="w-48" />
              <div className="flex items-center gap-2">
                <Switch id="facture-impayees" checked={seulementImpayees} onCheckedChange={setSeulementImpayees} />
                <Label htmlFor="facture-impayees" className="text-sm font-normal">Seulement les factures non soldées</Label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-5 py-3 font-medium">N° facture</th>
                    <th className="px-3 py-3 font-medium">Élève</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-right font-medium">Reste</th>
                    <th className="px-3 py-3 font-medium">État</th>
                    <th className="px-5 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">{lignesFactures}</tbody>
              </table>
              {videFactures}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="recus" className="mt-3">
          <section className="panel min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="px-5 py-3 font-medium">N° reçu</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Élève</th>
                    <th className="px-3 py-3 font-medium">Objet</th>
                    <th className="px-3 py-3 text-right font-medium">Montant</th>
                    <th className="px-3 py-3 font-medium">Mode</th>
                    <th className="px-5 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">{lignesRecus}</tbody>
              </table>
              {videRecus}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <DocumentFinancier document={document} onFermer={fermerDocument} lienWhatsApp={lienWhatsApp} />
    </div>
  );
}
