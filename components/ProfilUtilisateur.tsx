"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from "react";
import { UTILISATEUR } from "@/lib/data";
import { Icon, type IconName } from "./Icon";
import { Modal } from "./Modal";

type Profil = typeof UTILISATEUR;
type Fenetre = "profil" | "photo" | "motDePasse" | "deconnexion" | null;

const CLE_PROFIL = "profil";
const CLE_PHOTO = "photo-profil";
const TAILLE_PHOTO = 256;
const MDP_VIDE = { actuel: "", nouveau: "", confirmation: "" };

const LIENS: { id: Exclude<Fenetre, null>; label: string; icon: IconName }[] = [
  { id: "profil", label: "Mon profil", icon: "user" },
  { id: "photo", label: "Photo de profil", icon: "camera" },
  { id: "motDePasse", label: "Mot de passe", icon: "lock" },
  { id: "deconnexion", label: "Se déconnecter", icon: "logout" },
];

const CHAMP =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-primary focus:outline-none";
const BOUTON_PRIMAIRE =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-50";
const BOUTON_SECONDAIRE =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-2";

function lire(cle: string) {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string | null) {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
  } catch {}
}

function initiales(p: Profil) {
  return `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
}

/** Recadre l'image en carré et la réduit pour un stockage léger. */
function redimensionner(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const cote = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = TAILLE_PHOTO;
      canvas
        .getContext("2d")!
        .drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, TAILLE_PHOTO, TAILLE_PHOTO);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

function PhotoProfil({ photo, profil, taille }: { photo: string | null; profil: Profil; taille: string }) {
  if (photo) {
    return <img src={photo} alt="" className={`${taille} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${taille} grid shrink-0 place-items-center rounded-full bg-ochre-soft font-bold text-ochre`}>
      {initiales(profil)}
    </span>
  );
}

export function ProfilUtilisateur() {
  const [profil, setProfil] = useState<Profil>(UTILISATEUR);
  const [photo, setPhoto] = useState<string | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [fenetre, setFenetre] = useState<Fenetre>(null);
  const [message, setMessage] = useState<string | null>(null);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const enregistre = lire(CLE_PROFIL);
    if (enregistre) {
      try {
        setProfil({ ...UTILISATEUR, ...JSON.parse(enregistre) });
      } catch {}
    }
    setPhoto(lire(CLE_PHOTO));
  }, []);

  useEffect(() => {
    if (!menuOuvert) return;
    function clicExterieur(e: MouseEvent) {
      if (!zone.current?.contains(e.target as Node)) setMenuOuvert(false);
    }
    document.addEventListener("mousedown", clicExterieur);
    return () => document.removeEventListener("mousedown", clicExterieur);
  }, [menuOuvert]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2800);
    return () => clearTimeout(t);
  }, [message]);

  function ouvrir(id: Exclude<Fenetre, null>) {
    setMenuOuvert(false);
    setFenetre(id);
  }

  function fermer() {
    setFenetre(null);
  }

  function notifier(texte: string) {
    setFenetre(null);
    setMessage(texte);
  }

  return (
    <div ref={zone} className="relative mt-2">
      {menuOuvert && (
        <ul
          role="menu"
          className="panel absolute right-0 bottom-full left-0 mb-2 flex flex-col gap-0.5 p-1.5 shadow-lg"
        >
          {LIENS.map((lien) => (
            <li key={lien.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => ouvrir(lien.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  lien.id === "deconnexion"
                    ? "text-danger hover:bg-danger-soft"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon name={lien.icon} />
                {lien.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setMenuOuvert((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOuvert}
        className="flex w-full items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-line/60"
      >
        <PhotoProfil photo={photo} profil={profil} taille="size-9 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {profil.prenom} {profil.nom}
          </p>
          <p className="truncate text-xs text-muted">{profil.role}</p>
        </div>
        <Icon name="chevronUp" className={`text-muted transition-transform ${menuOuvert ? "" : "rotate-180"}`} />
      </button>

      <ModalProfil
        ouvert={fenetre === "profil"}
        profil={profil}
        onFermer={fermer}
        onEnregistrer={(p) => {
          setProfil(p);
          ecrire(CLE_PROFIL, JSON.stringify(p));
          notifier("Profil mis à jour");
        }}
      />
      <ModalPhoto
        ouvert={fenetre === "photo"}
        photo={photo}
        profil={profil}
        onFermer={fermer}
        onEnregistrer={(p) => {
          setPhoto(p);
          ecrire(CLE_PHOTO, p);
          notifier(p ? "Photo mise à jour" : "Photo supprimée");
        }}
      />
      <ModalMotDePasse ouvert={fenetre === "motDePasse"} onFermer={fermer} onValider={() => notifier("Mot de passe modifié")} />
      <Modal
        ouvert={fenetre === "deconnexion"}
        titre="Se déconnecter"
        onFermer={fermer}
        pied={
          <>
            <button type="button" onClick={fermer} className={BOUTON_SECONDAIRE}>
              Annuler
            </button>
            <button
              type="button"
              onClick={() => notifier("Vous êtes déconnecté")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              <Icon name="logout" />
              Se déconnecter
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Voulez-vous vraiment fermer la session de{" "}
          <strong className="text-ink">
            {profil.prenom} {profil.nom}
          </strong>{" "}
          ?
        </p>
      </Modal>

      {message && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-bg shadow-lg"
        >
          <Icon name="check" />
          {message}
        </div>
      )}
    </div>
  );
}

function ModalProfil({
  ouvert,
  profil,
  onFermer,
  onEnregistrer,
}: {
  ouvert: boolean;
  profil: Profil;
  onFermer: () => void;
  onEnregistrer: (p: Profil) => void;
}) {
  const [formData, setFormData] = useState<Profil>(profil);

  useEffect(() => {
    if (ouvert) setFormData(profil);
  }, [ouvert, profil]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onEnregistrer({ ...formData, prenom: formData.prenom.trim(), nom: formData.nom.trim() });
  };

  const valide = formData.prenom.trim() !== "" && formData.nom.trim() !== "";

  return (
    <Modal
      ouvert={ouvert}
      titre="Mon profil"
      onFermer={onFermer}
      pied={
        <>
          <button type="button" onClick={onFermer} className={BOUTON_SECONDAIRE}>
            Annuler
          </button>
          <button type="submit" form="form-profil" disabled={!valide} className={BOUTON_PRIMAIRE}>
            Enregistrer
          </button>
        </>
      }
    >
      <form id="form-profil" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Champ label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} required />
        <Champ label="Nom" name="nom" value={formData.nom} onChange={handleChange} required />
        <Champ label="Fonction" name="role" value={formData.role} onChange={handleChange} className="sm:col-span-2" />
        <Champ label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} className="sm:col-span-2" />
        <Champ label="Téléphone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} className="sm:col-span-2" />
      </form>
    </Modal>
  );
}

function ModalPhoto({
  ouvert,
  photo,
  profil,
  onFermer,
  onEnregistrer,
}: {
  ouvert: boolean;
  photo: string | null;
  profil: Profil;
  onFermer: () => void;
  onEnregistrer: (p: string | null) => void;
}) {
  const [apercu, setApercu] = useState<string | null>(photo);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ouvert) {
      setApercu(photo);
      setErreur(null);
    }
  }, [ouvert, photo]);

  async function choisirFichier(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    if (!fichier.type.startsWith("image/")) {
      setErreur("Choisissez un fichier image (JPG, PNG…).");
      return;
    }
    try {
      setApercu(await redimensionner(fichier));
      setErreur(null);
    } catch {
      setErreur("Impossible de lire cette image.");
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Photo de profil"
      onFermer={onFermer}
      pied={
        <>
          <button type="button" onClick={onFermer} className={BOUTON_SECONDAIRE}>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onEnregistrer(apercu)}
            disabled={apercu === photo}
            className={BOUTON_PRIMAIRE}
          >
            Enregistrer
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <PhotoProfil photo={apercu} profil={profil} taille="size-28 text-3xl" />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => champ.current?.click()} className={BOUTON_SECONDAIRE}>
            <Icon name="camera" />
            {apercu ? "Changer la photo" : "Choisir une photo"}
          </button>
          {apercu && (
            <button
              type="button"
              onClick={() => setApercu(null)}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              Retirer
            </button>
          )}
        </div>
        <input ref={champ} type="file" accept="image/*" onChange={choisirFichier} className="sr-only" tabIndex={-1} />
        {erreur ? (
          <p className="text-sm text-danger">{erreur}</p>
        ) : (
          <p className="text-center text-xs text-muted">L&apos;image est recadrée en carré et réduite automatiquement.</p>
        )}
      </div>
    </Modal>
  );
}

function ModalMotDePasse({ ouvert, onFermer, onValider }: { ouvert: boolean; onFermer: () => void; onValider: () => void }) {
  const [formData, setFormData] = useState(MDP_VIDE);

  useEffect(() => {
    if (ouvert) setFormData(MDP_VIDE);
  }, [ouvert]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const tropCourt = formData.nouveau !== "" && formData.nouveau.length < 8;
  const different = formData.confirmation !== "" && formData.confirmation !== formData.nouveau;
  const valide = formData.actuel !== "" && formData.nouveau.length >= 8 && formData.confirmation === formData.nouveau;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (valide) onValider();
  };

  return (
    <Modal
      ouvert={ouvert}
      titre="Mot de passe"
      onFermer={onFermer}
      pied={
        <>
          <button type="button" onClick={onFermer} className={BOUTON_SECONDAIRE}>
            Annuler
          </button>
          <button type="submit" form="form-mdp" disabled={!valide} className={BOUTON_PRIMAIRE}>
            Modifier
          </button>
        </>
      }
    >
      <form id="form-mdp" onSubmit={handleSubmit} className="grid gap-4">
        <Champ label="Mot de passe actuel" name="actuel" type="password" value={formData.actuel} onChange={handleChange} autoComplete="current-password" />
        <Champ
          label="Nouveau mot de passe"
          name="nouveau"
          type="password"
          value={formData.nouveau}
          onChange={handleChange}
          autoComplete="new-password"
          aide={tropCourt ? "8 caractères minimum." : undefined}
        />
        <Champ
          label="Confirmer le mot de passe"
          name="confirmation"
          type="password"
          value={formData.confirmation}
          onChange={handleChange}
          autoComplete="new-password"
          aide={different ? "Les mots de passe ne correspondent pas." : undefined}
        />
      </form>
    </Modal>
  );
}

function Champ({
  label,
  aide,
  className = "",
  ...props
}: { label: string; aide?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = `champ-${props.name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-muted">
        {label}
      </label>
      <input id={id} className={CHAMP} {...props} />
      {aide && <p className="mt-1 text-xs text-danger">{aide}</p>}
    </div>
  );
}
