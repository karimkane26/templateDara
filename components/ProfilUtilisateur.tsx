"use client";

/*
 * Le bloc "utilisateur connecté" en bas de la barre latérale.
 * Un clic ouvre un petit menu : profil, photo, mot de passe, déconnexion.
 * Le profil et la photo sont gardés dans le navigateur (localStorage).
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UTILISATEUR } from "@/lib/data";
import { nomDuRole, seDeconnecter, type Session } from "@/lib/stockage";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

interface Profil {
  prenom: string;
  nom: string;
  role: string;
  email: string;
  telephone: string;
}

// Noms utilisés pour ranger les informations dans le navigateur
const CLE_PROFIL = "profil";
const CLE_PHOTO = "photo-profil";

// Taille de la photo une fois réduite (en pixels)
const TAILLE_PHOTO = 256;

/* ============================================================
 * Fonctions pour lire / écrire dans le navigateur
 * ============================================================ */

/** Lit une valeur enregistrée (renvoie null si rien n'est enregistré). */
function lireDansLeNavigateur(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch (erreur) {
    return null;
  }
}

/** Enregistre une valeur. Si la valeur est null, on efface. */
function ecrireDansLeNavigateur(cle: string, valeur: string | null) {
  try {
    if (valeur === null) {
      localStorage.removeItem(cle);
    } else {
      localStorage.setItem(cle, valeur);
    }
  } catch (erreur) {
    // Le navigateur refuse parfois (navigation privée) : on ignore.
  }
}

/** Le profil "par défaut" de la personne connectée. */
function profilDeDepart(session: Session): Profil {
  if (session.role === "admin") {
    return {
      prenom: UTILISATEUR.prenom,
      nom: UTILISATEUR.nom,
      role: UTILISATEUR.role,
      email: UTILISATEUR.email,
      telephone: UTILISATEUR.telephone,
    };
  }
  return {
    prenom: session.prenom,
    nom: session.nom,
    role: nomDuRole(session.role),
    email: "",
    telephone: "",
  };
}

/** Relit le profil enregistré pour ce compte. S'il n'y en a pas, on garde le profil par défaut. */
function chargerProfil(session: Session): Profil {
  const profil = profilDeDepart(session);

  const texte = lireDansLeNavigateur(CLE_PROFIL + "-" + session.id);
  if (texte === null) {
    return profil;
  }

  try {
    const enregistre = JSON.parse(texte);
    if (typeof enregistre.prenom === "string") profil.prenom = enregistre.prenom;
    if (typeof enregistre.nom === "string") profil.nom = enregistre.nom;
    if (typeof enregistre.role === "string") profil.role = enregistre.role;
    if (typeof enregistre.email === "string") profil.email = enregistre.email;
    if (typeof enregistre.telephone === "string") profil.telephone = enregistre.telephone;
  } catch (erreur) {
    // Texte abîmé : on garde le profil par défaut.
  }

  return profil;
}

/** "Abdou", "Diallo" -> "AD" */
function initialesDuProfil(profil: Profil): string {
  let resultat = "";
  if (profil.prenom.length > 0) resultat = resultat + profil.prenom[0];
  if (profil.nom.length > 0) resultat = resultat + profil.nom[0];
  return resultat.toUpperCase();
}

/**
 * Recadre l'image en carré et la réduit, pour qu'elle prenne peu de place.
 * Quand c'est fini, on appelle "quandCestFini" avec l'image (ou null si elle est illisible).
 */
function redimensionnerPhoto(fichier: File, quandCestFini: (photo: string | null) => void) {
  const adresse = URL.createObjectURL(fichier);
  const image = new Image();

  image.onload = function () {
    // On garde le plus grand carré possible, au centre de l'image.
    let cote = image.width;
    if (image.height < cote) {
      cote = image.height;
    }
    const departX = (image.width - cote) / 2;
    const departY = (image.height - cote) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = TAILLE_PHOTO;
    canvas.height = TAILLE_PHOTO;

    const dessin = canvas.getContext("2d");
    if (dessin === null) {
      URL.revokeObjectURL(adresse);
      quandCestFini(null);
      return;
    }
    dessin.drawImage(image, departX, departY, cote, cote, 0, 0, TAILLE_PHOTO, TAILLE_PHOTO);

    URL.revokeObjectURL(adresse);
    quandCestFini(canvas.toDataURL("image/jpeg", 0.85));
  };

  image.onerror = function () {
    URL.revokeObjectURL(adresse);
    quandCestFini(null);
  };

  image.src = adresse;
}

/* ============================================================
 * Photo (ou initiales si pas de photo)
 * ============================================================ */

interface PhotoProfilProps {
  photo: string | null;
  profil: Profil;
  taille: string;
}

function PhotoProfil(props: PhotoProfilProps) {
  if (props.photo) {
    return <img src={props.photo} alt="" className={props.taille + " shrink-0 rounded-full object-cover"} />;
  }
  return (
    <span className={props.taille + " grid shrink-0 place-items-center rounded-full bg-ochre-soft font-bold text-ochre"}>
      {initialesDuProfil(props.profil)}
    </span>
  );
}

/* ============================================================
 * Composant principal
 * ============================================================ */

interface ProfilUtilisateurProps {
  session: Session; // la personne connectée
}

export function ProfilUtilisateur(props: ProfilUtilisateurProps) {
  const session = props.session;

  // Chaque compte a son profil et sa photo, rangés sous son propre nom dans le navigateur
  const cleProfil = CLE_PROFIL + "-" + session.id;
  const clePhoto = CLE_PHOTO + "-" + session.id;

  const [profil, setProfil] = useState<Profil>(profilDeDepart(session));
  const [photo, setPhoto] = useState<string | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  // Quelle fenêtre est ouverte : "profil", "photo", "motDePasse", "deconnexion" ou "" (aucune)
  const [fenetre, setFenetre] = useState("");
  const [message, setMessage] = useState("");

  // Au démarrage (et si on change de compte) : on relit le profil et la photo enregistrés.
  useEffect(
    function () {
      setProfil(chargerProfil(session));
      setPhoto(lireDansLeNavigateur(clePhoto));
    },
    [session, clePhoto],
  );

  // Quand le menu est ouvert, un clic ailleurs sur la page le referme.
  useEffect(
    function () {
      if (!menuOuvert) {
        return;
      }

      function quandOnCliqueQuelquePart(evenement: MouseEvent) {
        const zone = document.getElementById("zone-profil");
        const cible = evenement.target as Node;
        if (zone === null || !zone.contains(cible)) {
          setMenuOuvert(false);
        }
      }

      document.addEventListener("mousedown", quandOnCliqueQuelquePart);
      return function () {
        document.removeEventListener("mousedown", quandOnCliqueQuelquePart);
      };
    },
    [menuOuvert],
  );

  // Le petit message en bas à droite disparaît tout seul après 2,8 secondes.
  useEffect(
    function () {
      if (message === "") {
        return;
      }
      const minuteur = setTimeout(function () {
        setMessage("");
      }, 2800);
      return function () {
        clearTimeout(minuteur);
      };
    },
    [message],
  );

  function basculerMenu() {
    setMenuOuvert(!menuOuvert);
  }

  function ouvrirFenetre(nom: string) {
    setMenuOuvert(false);
    setFenetre(nom);
  }

  function fermerFenetre() {
    setFenetre("");
  }

  /** Ferme la fenêtre et affiche un message de confirmation. */
  function afficherMessage(texte: string) {
    setFenetre("");
    setMessage(texte);
  }

  function enregistrerProfil(nouveauProfil: Profil) {
    setProfil(nouveauProfil);
    ecrireDansLeNavigateur(cleProfil, JSON.stringify(nouveauProfil));
    afficherMessage("Profil mis à jour");
  }

  function enregistrerPhoto(nouvellePhoto: string | null) {
    setPhoto(nouvellePhoto);
    ecrireDansLeNavigateur(clePhoto, nouvellePhoto);
    if (nouvellePhoto) {
      afficherMessage("Photo mise à jour");
    } else {
      afficherMessage("Photo supprimée");
    }
  }

  function motDePasseModifie() {
    afficherMessage("Mot de passe modifié");
  }

  function deconnecter() {
    seDeconnecter();
    // On recharge complètement l'application sur la page de connexion.
    window.location.href = "/connexion";
  }

  // Le menu (liste de 4 boutons), seulement s'il est ouvert
  let menu = null;
  if (menuOuvert) {
    menu = (
      <ul role="menu" className="panel absolute right-0 bottom-full left-0 mb-2 flex flex-col gap-0.5 p-1.5 shadow-lg">
        <li>
          <button type="button" role="menuitem" onClick={function () { ouvrirFenetre("profil"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted hover:bg-surface-2 hover:text-ink">
            <Icon name="user" />
            Mon profil
          </button>
        </li>
        <li>
          <button type="button" role="menuitem" onClick={function () { ouvrirFenetre("photo"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted hover:bg-surface-2 hover:text-ink">
            <Icon name="camera" />
            Photo de profil
          </button>
        </li>
        <li>
          <button type="button" role="menuitem" onClick={function () { ouvrirFenetre("motDePasse"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted hover:bg-surface-2 hover:text-ink">
            <Icon name="lock" />
            Mot de passe
          </button>
        </li>
        <li>
          <button type="button" role="menuitem" onClick={function () { ouvrirFenetre("deconnexion"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-danger hover:bg-danger-soft">
            <Icon name="logout" />
            Se déconnecter
          </button>
        </li>
      </ul>
    );
  }

  // La flèche pointe vers le haut quand le menu est ouvert
  let rotationFleche = "rotate-180";
  if (menuOuvert) {
    rotationFleche = "";
  }

  // Message de confirmation en bas à droite
  let bulleMessage = null;
  if (message !== "") {
    bulleMessage = (
      <div role="status" className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-bg shadow-lg">
        <Icon name="check" />
        {message}
      </div>
    );
  }

  return (
    <div id="zone-profil" className="relative mt-2">
      {menu}

      <button
        type="button"
        onClick={basculerMenu}
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
        <Icon name="chevronUp" className={"text-muted transition-transform " + rotationFleche} />
      </button>

      <FenetreProfil ouvert={fenetre === "profil"} profil={profil} onFermer={fermerFenetre} onEnregistrer={enregistrerProfil} />
      <FenetrePhoto ouvert={fenetre === "photo"} photo={photo} profil={profil} onFermer={fermerFenetre} onEnregistrer={enregistrerPhoto} />
      <FenetreMotDePasse ouvert={fenetre === "motDePasse"} onFermer={fermerFenetre} onValider={motDePasseModifie} />

      <Modal
        ouvert={fenetre === "deconnexion"}
        titre="Se déconnecter"
        onFermer={fermerFenetre}
        pied={
          <>
            <Button type="button" variant="outline" size="lg" onClick={fermerFenetre}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" size="lg" onClick={deconnecter}>
              <Icon name="logout" />
              Se déconnecter
            </Button>
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

      {bulleMessage}
    </div>
  );
}

/* ============================================================
 * Fenêtre "Mon profil"
 * ============================================================ */

interface FenetreProfilProps {
  ouvert: boolean;
  profil: Profil;
  onFermer: () => void;
  onEnregistrer: (profil: Profil) => void;
}

function FenetreProfil(props: FenetreProfilProps) {
  // Une variable par champ du formulaire
  const [prenom, setPrenom] = useState(props.profil.prenom);
  const [nom, setNom] = useState(props.profil.nom);
  const [role, setRole] = useState(props.profil.role);
  const [email, setEmail] = useState(props.profil.email);
  const [telephone, setTelephone] = useState(props.profil.telephone);

  const ouvert = props.ouvert;
  const profil = props.profil;

  // À chaque ouverture, on remplit le formulaire avec le profil actuel.
  useEffect(
    function () {
      if (ouvert) {
        setPrenom(profil.prenom);
        setNom(profil.nom);
        setRole(profil.role);
        setEmail(profil.email);
        setTelephone(profil.telephone);
      }
    },
    [ouvert, profil],
  );

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();
    props.onEnregistrer({
      prenom: prenom.trim(),
      nom: nom.trim(),
      role: role,
      email: email,
      telephone: telephone,
    });
  }

  // Le prénom et le nom sont obligatoires
  let formulaireValide = true;
  if (prenom.trim() === "" || nom.trim() === "") {
    formulaireValide = false;
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Mon profil"
      onFermer={props.onFermer}
      pied={
        <>
          <Button type="button" variant="outline" size="lg" onClick={props.onFermer}>
            Annuler
          </Button>
          <Button type="submit" form="form-profil" size="lg" disabled={!formulaireValide}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="form-profil" onSubmit={quandOnValide} className="grid gap-4 sm:grid-cols-2">
        <Champ label="Prénom" name="prenom" value={prenom} onChange={setPrenom} required={true} />
        <Champ label="Nom" name="nom" value={nom} onChange={setNom} required={true} />
        <Champ label="Fonction" name="role" value={role} onChange={setRole} className="sm:col-span-2" />
        <Champ label="E-mail" name="email" type="email" value={email} onChange={setEmail} className="sm:col-span-2" />
        <Champ label="Téléphone" name="telephone" type="tel" value={telephone} onChange={setTelephone} className="sm:col-span-2" />
      </form>
    </Modal>
  );
}

/* ============================================================
 * Fenêtre "Photo de profil"
 * ============================================================ */

interface FenetrePhotoProps {
  ouvert: boolean;
  photo: string | null;
  profil: Profil;
  onFermer: () => void;
  onEnregistrer: (photo: string | null) => void;
}

function FenetrePhoto(props: FenetrePhotoProps) {
  // "apercu" = la photo choisie mais pas encore enregistrée
  const [apercu, setApercu] = useState<string | null>(props.photo);
  const [erreur, setErreur] = useState("");

  const ouvert = props.ouvert;
  const photo = props.photo;

  // À chaque ouverture, on repart de la photo actuelle.
  useEffect(
    function () {
      if (ouvert) {
        setApercu(photo);
        setErreur("");
      }
    },
    [ouvert, photo],
  );

  /** Clique sur le champ "fichier" caché, ce qui ouvre la boîte de choix de fichier. */
  function ouvrirChoixDeFichier() {
    const champ = document.getElementById("champ-photo");
    if (champ !== null) {
      champ.click();
    }
  }

  function quandOnChoisitUnFichier(evenement: ChangeEvent<HTMLInputElement>) {
    const fichiers = evenement.target.files;
    // On vide le champ pour pouvoir rechoisir le même fichier plus tard.
    let fichier = null;
    if (fichiers !== null && fichiers.length > 0) {
      fichier = fichiers[0];
    }
    evenement.target.value = "";

    if (fichier === null) {
      return;
    }
    if (!fichier.type.startsWith("image/")) {
      setErreur("Choisissez un fichier image (JPG, PNG…).");
      return;
    }

    redimensionnerPhoto(fichier, function (resultat) {
      if (resultat === null) {
        setErreur("Impossible de lire cette image.");
      } else {
        setApercu(resultat);
        setErreur("");
      }
    });
  }

  function retirerPhoto() {
    setApercu(null);
  }

  function enregistrer() {
    props.onEnregistrer(apercu);
  }

  let texteBoutonChoisir = "Choisir une photo";
  let boutonRetirer = null;
  if (apercu) {
    texteBoutonChoisir = "Changer la photo";
    boutonRetirer = (
      <Button type="button" variant="ghost" size="lg" onClick={retirerPhoto} className="text-danger hover:bg-danger-soft hover:text-danger">
        Retirer
      </Button>
    );
  }

  let texteSousLaPhoto = <p className="text-center text-xs text-muted">L&apos;image est recadrée en carré et réduite automatiquement.</p>;
  if (erreur !== "") {
    texteSousLaPhoto = <p className="text-sm text-danger">{erreur}</p>;
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Photo de profil"
      onFermer={props.onFermer}
      pied={
        <>
          <Button type="button" variant="outline" size="lg" onClick={props.onFermer}>
            Annuler
          </Button>
          <Button type="button" size="lg" onClick={enregistrer} disabled={apercu === photo}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <PhotoProfil photo={apercu} profil={props.profil} taille="size-28 text-3xl" />
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" size="lg" onClick={ouvrirChoixDeFichier}>
            <Icon name="camera" />
            {texteBoutonChoisir}
          </Button>
          {boutonRetirer}
        </div>
        <input id="champ-photo" type="file" accept="image/*" onChange={quandOnChoisitUnFichier} className="sr-only" tabIndex={-1} />
        {texteSousLaPhoto}
      </div>
    </Modal>
  );
}

/* ============================================================
 * Fenêtre "Mot de passe"
 * ============================================================ */

interface FenetreMotDePasseProps {
  ouvert: boolean;
  onFermer: () => void;
  onValider: () => void;
}

function FenetreMotDePasse(props: FenetreMotDePasseProps) {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const ouvert = props.ouvert;

  // À chaque ouverture, on vide les trois champs.
  useEffect(
    function () {
      if (ouvert) {
        setActuel("");
        setNouveau("");
        setConfirmation("");
      }
    },
    [ouvert],
  );

  // Messages d'aide sous les champs
  let aideNouveau = "";
  if (nouveau !== "" && nouveau.length < 8) {
    aideNouveau = "8 caractères minimum.";
  }

  let aideConfirmation = "";
  if (confirmation !== "" && confirmation !== nouveau) {
    aideConfirmation = "Les mots de passe ne correspondent pas.";
  }

  let formulaireValide = false;
  if (actuel !== "" && nouveau.length >= 8 && confirmation === nouveau) {
    formulaireValide = true;
  }

  function quandOnValide(evenement: FormEvent) {
    evenement.preventDefault();
    if (formulaireValide) {
      props.onValider();
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Mot de passe"
      onFermer={props.onFermer}
      pied={
        <>
          <Button type="button" variant="outline" size="lg" onClick={props.onFermer}>
            Annuler
          </Button>
          <Button type="submit" form="form-mdp" size="lg" disabled={!formulaireValide}>
            Modifier
          </Button>
        </>
      }
    >
      <form id="form-mdp" onSubmit={quandOnValide} className="grid gap-4">
        <Champ label="Mot de passe actuel" name="actuel" type="password" value={actuel} onChange={setActuel} autoComplete="current-password" />
        <Champ label="Nouveau mot de passe" name="nouveau" type="password" value={nouveau} onChange={setNouveau} autoComplete="new-password" aide={aideNouveau} />
        <Champ label="Confirmer le mot de passe" name="confirmation" type="password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" aide={aideConfirmation} />
      </form>
    </Modal>
  );
}

/* ============================================================
 * Un champ de formulaire avec son étiquette
 * ============================================================ */

interface ChampProps {
  label: string;
  name: string;
  value: string;
  onChange: (valeur: string) => void; // reçoit directement le texte tapé
  type?: string;
  required?: boolean;
  autoComplete?: string;
  aide?: string; // message d'erreur affiché en rouge sous le champ
  className?: string;
}

function Champ(props: ChampProps) {
  const id = "champ-" + props.name;

  let type = "text";
  if (props.type) {
    type = props.type;
  }

  // Message d'erreur sous le champ (et bordure rouge sur le champ)
  let aide = null;
  let aideVisible: boolean | undefined = undefined;
  if (props.aide) {
    aide = <p className="mt-1 text-xs text-danger">{props.aide}</p>;
    aideVisible = true;
  }

  function quandOnTape(evenement: ChangeEvent<HTMLInputElement>) {
    props.onChange(evenement.target.value);
  }

  return (
    <div className={props.className}>
      <Label htmlFor={id} className="mb-1.5 text-xs font-semibold text-muted">
        {props.label}
      </Label>
      <Input
        id={id}
        name={props.name}
        type={type}
        value={props.value}
        onChange={quandOnTape}
        required={props.required}
        autoComplete={props.autoComplete}
        aria-invalid={aideVisible}
        className="h-10 bg-surface"
      />
      {aide}
    </div>
  );
}
