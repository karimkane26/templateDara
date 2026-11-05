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
  ui.tsx              badges, panneaux, avatars
lib/
  data.ts             données de démonstration TYPÉES  <- à remplacer
  format.ts           formatage FCFA, dates en français
```

## Brancher une vraie base de données

Tout passe par `lib/data.ts`. Les types (`Eleve`, `Classe`, `Paiement`, `MoisEncaissement`) sont déjà définis :
garde-les et remplace les tableaux générés par des requêtes (Prisma + PostgreSQL/MySQL, Supabase…).

Dans `components/PaiementsView.tsx`, la fonction `enregistrer()` ajoute le paiement en mémoire seulement :
remplace-la par une Server Action ou un appel à une route `app/api/paiements/route.ts`.

## Personnaliser

- Nom de l'école, ville, année : objet `ECOLE` dans `lib/data.ts`
- Classes et mensualités : tableau `CLASSES` dans `lib/data.ts`
- Couleurs : variables en haut de `app/globals.css` (clair et sombre)
