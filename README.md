# Daara — gestion d'école coranique

Tableau de bord Next.js (App Router) + Tailwind CSS v4, en français, montants en FCFA.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

## Ce qui est inclus

| Page | Contenu |
| --- | --- |
| `/` Tableau de bord | Collecte des mensualités du mois (une case par élève), présence du jour, modes de paiement (Wave, Orange Money, espèces), encaissements sur 12 mois, parents à relancer sur WhatsApp, derniers paiements, mémorisation par classe |
| `/eleves` | Liste des élèves avec recherche, filtre par classe et par statut de mensualité |
| `/paiements` | Résumé du mois, formulaire « Enregistrer un paiement », journal des paiements, liste des élèves en retard avec bouton « Encaisser » |
| `/classes` | Une fiche par classe (Alif, Ba, Ta, Tha) |
| `/presences`, `/enseignants`, `/parametres` | Pages prêtes à remplir |

Thème clair / sombre (bouton en haut à droite, mémorisé dans le navigateur), menu latéral repliable sur mobile.

## Structure

```
app/                  pages (App Router)
  globals.css         couleurs, polices, thème sombre (tokens CSS)
components/
  Shell.tsx           barre latérale + barre du haut
  dashboard/          blocs du tableau de bord
  ElevesTable.tsx     tableau filtrable des élèves
  PaiementsView.tsx   formulaire + journal + retards
  Icon.tsx            icônes SVG (aucune dépendance)
  elements.tsx        badges, panneaux, avatars
  Modal.tsx           fenêtre modale (basée sur le Dialog de shadcn/ui)
  ui/                 composants shadcn/ui (button, dialog, input, label, badge, card, table, tabs)
lib/
  data.ts             données de démonstration TYPÉES  <- à remplacer
  format.ts           formatage FCFA, dates en français
  utils.ts            fonction cn() utilisée par shadcn/ui
```

## shadcn/ui

Les composants de [shadcn/ui](https://ui.shadcn.com/) sont copiés dans `components/ui/` : on peut les modifier librement.
Pour en ajouter un autre :

```bash
npx shadcn@latest add select
```

Leurs couleurs (`background`, `foreground`, `border`, `muted-foreground`…) sont reliées à notre palette dans `app/globals.css`.
Attention : chez nous `muted` est une couleur de **texte**. Si un nouveau composant shadcn utilise `bg-muted`,
remplacer par `bg-surface-2`. Vérifier aussi que l'import est bien `from "@/lib/utils"` (l'outil écrit parfois `from "cn"`).

Les fichiers de `components/ui/` gardent le style de shadcn (plus avancé). Le reste du projet garde le style simple décrit plus haut.

## Comptes et cours en ligne (démo)

Page `/connexion`, trois sortes de comptes :

| Compte | Identifiant | Mot de passe | Ce qu'il voit |
| --- | --- | --- | --- |
| Administrateur | `admin` | `admin123` | Tout : tableau de bord, élèves, paiements, enseignants, cours en ligne |
| Enseignant | ex. `mndiaye` | `1234` | Son espace : prochain cours, emploi du temps Google Meet, élèves de ses classes |
| Parent | son téléphone, ex. `767321482` | `1234` | Son espace : ses enfants, prochain cours, emploi du temps Google Meet |

L'administrateur ajoute des enseignants (`/enseignants`), des élèves (`/eleves`) et des cours (`/cours`).
Un cours a un jour, une heure et un lien Google Meet (créé à la main sur meet.google.com). Il est visible par
les parents des élèves de la classe choisie, ou par tous si on choisit « Toutes les classes ».

**Attention, c'est une démo** : les données et les mots de passe sont gardés dans le navigateur
(`lib/stockage.ts`). Chaque navigateur a ses propres données, et ce n'est pas sécurisé.
Pour une vraie école, il faut remplacer `lib/stockage.ts` par une base de données et une vraie connexion côté serveur.

## Style du code

Le code est écrit de façon simple et procédurale, pour être facile à lire quand on débute :

- des boucles `for` plutôt que `.map()`, `.filter()` ou `.reduce()` ;
- des `if / else` plutôt que des ternaires (`a ? b : c`) ;
- des fonctions nommées (`function fermerMenu() {...}`) plutôt que des fonctions fléchées ;
- dans les composants, `props.titre` plutôt que la déstructuration `{ titre }` ;
- les morceaux d'affichage sont préparés dans des variables avant le `return`, puis assemblés.

## Brancher une vraie base de données

Tout passe par `lib/data.ts`. Les types (`Eleve`, `Classe`, `Paiement`, `MoisEncaissement`) sont déjà définis :
garde-les et remplace les tableaux générés par des requêtes (Prisma + PostgreSQL/MySQL, Supabase…).

Dans `components/PaiementsView.tsx`, la fonction `enregistrerLePaiement()` ajoute le paiement en mémoire seulement :
remplace-la par une Server Action ou un appel à une route `app/api/paiements/route.ts`.

## Personnaliser

- Nom de l'école, ville, année : objet `ECOLE` dans `lib/data.ts`
- Classes et mensualités : tableau `CLASSES` dans `lib/data.ts`
- Couleurs : variables en haut de `app/globals.css` (clair et sombre)
