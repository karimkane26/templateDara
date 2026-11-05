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
| `/finances` Gestion financière | Bilan du mois (recettes, dépenses, solde) et 5 onglets : inscriptions et frais, paiements des élèves, factures et reçus (imprimables, envoi WhatsApp), salaires des enseignants, dépenses de l'école |
| `/classes` | Une fiche par classe (Alif, Ba, Ta, Tha) |
| `/presences`, `/parametres` | Pages prêtes à remplir |

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
  ui/                 composants shadcn/ui (button, dialog, input, label, badge, card, table, tabs,
                      select, textarea, switch, checkbox, alert)
  ListeDeChoix.tsx    liste déroulante simple, basée sur le Select de shadcn/ui
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

Ce que gère l'administrateur :

| Page | Ce qu'on y fait |
| --- | --- |
| `/eleves` | Ajouter, **modifier** (classe, hizb, parent) et retirer un élève |
| `/enseignants` | Ajouter, **modifier**, **désactiver** (ne peut plus se connecter) et supprimer un enseignant |
| `/parents` | Fiche de chaque parent (téléphone, e-mail, adresse, mot de passe), ses enfants, lien WhatsApp, désactivation |
| `/enseignements` | Les matières (Mémorisation, Tajwid, Langue arabe…) et les cours en ligne de chacune |
| `/cours` | Ajouter, **modifier** et supprimer un cours Google Meet (jour, heure, classe, enseignant, matière) |
| `/annonces` | Publier une annonce pour tout le monde, seulement les parents ou seulement les enseignants |

Un cours a un jour, une heure et un lien Google Meet (créé à la main sur meet.google.com).
**Tous les cours sont visibles par tout le monde** : dans son espace, chaque enseignant et chaque parent voit
l'emploi du temps complet, avec un bouton pour n'afficher que « Mes cours » / « Cours de mes enfants ».
Les annonces apparaissent en haut de l'espace enseignant et de l'espace parent.

Un parent est relié à ses enfants par son **numéro de téléphone** : quand on inscrit un élève avec le numéro
d'un parent déjà connu, son nom est rempli tout seul et l'élève s'ajoute à ses enfants. Si l'administrateur
change le numéro d'un parent, ses enfants sont mis à jour aussi.

L'enseignant peut mettre à jour le hizb de ses élèves (clic sur la colonne « Progression »).
Chacun peut changer son mot de passe (menu du profil > Mot de passe).

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

## Gestion financière

Page `/finances` (menu « Gestion financière », administrateur seulement). Le code est dans `lib/finances.ts`
(données et calculs) et `components/finances/` (un fichier par onglet).

| Onglet | Ce qu'on y fait |
| --- | --- |
| Inscriptions et frais | Fixer les frais d'inscription et de réinscription, encaisser les frais de chaque élève, inscrire un nouvel élève |
| Paiements des élèves | Les mensualités (même écran que `/paiements`) : les paiements sont maintenant **enregistrés** dans le navigateur |
| Factures et reçus | Une facture par élève et par mois (mensualité + frais d'inscription non réglés), un reçu numéroté `REC-2026-0001` pour chaque encaissement |
| Salaires des enseignants | Salaire mensuel de chacun, versements (avances possibles), fiche de paie, historique |
| Dépenses | Loyer, électricité, internet, fournitures… avec la répartition par catégorie et la comparaison au mois précédent |

Le bilan est fait « en caisse » : une somme compte dans le mois où elle a été réellement encaissée ou payée.
Les nouveaux enregistrements sont datés du jour de la démo (`ECOLE.aujourdhui`).

Reçus, factures et fiches de paie s'ouvrent dans une fenêtre avec un bouton **Imprimer / PDF** :
les règles `@media print` de `app/globals.css` n'impriment que le document. Choisir « Enregistrer en PDF »
dans la fenêtre d'impression pour obtenir un fichier à envoyer.
