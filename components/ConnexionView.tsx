"use client";

/*
 * Page de connexion : un seul formulaire pour l'administrateur, les enseignants et les parents.
 */

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPTE_ADMIN, ECOLE, ELEVES, ENSEIGNANTS, MOT_DE_PASSE_PARENT } from "@/lib/data";
import { accueilDuRole, chiffresSeulement, seConnecter } from "@/lib/stockage";
import { ThemeToggle } from "./ThemeToggle";

export function ConnexionView() {
  const router = useRouter();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  function quandOnTapeLIdentifiant(evenement: ChangeEvent<HTMLInputElement>) {
    setIdentifiant(evenement.target.value);
    setErreur("");
  }

  function quandOnTapeLeMotDePasse(evenement: ChangeEvent<HTMLInputElement>) {
    setMotDePasse(evenement.target.value);
    setErreur("");
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();

    const session = seConnecter(identifiant, motDePasse);
    if (session === null) {
      setErreur("Identifiant ou mot de passe incorrect.");
      return;
    }

    // Chacun arrive sur sa page : tableau de bord, espace enseignant ou espace parent
    router.push(accueilDuRole(session.role));
  }

  /** Remplit le formulaire avec un compte de démonstration. */
  function remplir(id: string, mdp: string) {
    setIdentifiant(id);
    setMotDePasse(mdp);
    setErreur("");
  }

  // Comptes de démonstration proposés sous le formulaire
  const exempleEnseignant = ENSEIGNANTS[0];
  const exempleParent = chiffresSeulement(ELEVES[0].telephoneParent);

  let messageErreur = null;
  if (erreur !== "") {
    messageErreur = (
      <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
        {erreur}
      </p>
    );
  }

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary font-display text-3xl leading-none text-primary-ink">د</span>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">{ECOLE.nom}</h1>
          <p className="mt-1 text-sm text-muted">Connectez-vous pour accéder à votre espace</p>
        </div>

        <form onSubmit={quandOnValide} className="panel flex flex-col gap-4 p-5">
          <div>
            <Label htmlFor="connexion-identifiant" className="mb-1.5 text-xs font-semibold text-muted">
              Identifiant ou téléphone du parent
            </Label>
            <Input
              id="connexion-identifiant"
              value={identifiant}
              onChange={quandOnTapeLIdentifiant}
              autoComplete="username"
              placeholder="ex. 774123508"
              required={true}
              className="h-10 bg-surface"
            />
          </div>
          <div>
            <Label htmlFor="connexion-mdp" className="mb-1.5 text-xs font-semibold text-muted">
              Mot de passe
            </Label>
            <Input
              id="connexion-mdp"
              type="password"
              value={motDePasse}
              onChange={quandOnTapeLeMotDePasse}
              autoComplete="current-password"
              required={true}
              className="h-10 bg-surface"
            />
          </div>
          {messageErreur}
          <Button type="submit" size="lg" className="w-full">
            Se connecter
          </Button>
        </form>

        <div className="mt-5 rounded-xl border border-dashed border-line p-4 text-sm">
          <p className="mb-2 text-xs font-semibold text-muted">Comptes de démonstration (cliquez pour remplir)</p>
          <ul className="flex flex-col gap-1">
            <li>
              <button type="button" onClick={function () { remplir(COMPTE_ADMIN.identifiant, COMPTE_ADMIN.motDePasse); }} className="w-full rounded-md px-2 py-1.5 text-left hover:bg-surface-2">
                <span className="font-semibold">Administrateur</span>
                <span className="text-muted"> · {COMPTE_ADMIN.identifiant} / {COMPTE_ADMIN.motDePasse}</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={function () { remplir(exempleEnseignant.identifiant, exempleEnseignant.motDePasse); }} className="w-full rounded-md px-2 py-1.5 text-left hover:bg-surface-2">
                <span className="font-semibold">Enseignant</span>
                <span className="text-muted"> · {exempleEnseignant.identifiant} / {exempleEnseignant.motDePasse}</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={function () { remplir(exempleParent, MOT_DE_PASSE_PARENT); }} className="w-full rounded-md px-2 py-1.5 text-left hover:bg-surface-2">
                <span className="font-semibold">Parent</span>
                <span className="text-muted"> · {exempleParent} / {MOT_DE_PASSE_PARENT}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
