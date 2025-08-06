This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



##### Menus du dashboard d’administration ####
1. Tableau de bord

KPIs : alertes actives/expirées, répartition par catégorie, heatmap

Filtres : période, zone, catégorie

Actions rapides : créer alerte, aller à modération, envoyer diffusion

2. Signalements

Liste + fiche détail + carte

Actions : valider, rejeter, éditer, prolonger, fusionner, archiver, diffuser

Actions en lot : validation, rejet, archivage, export CSV

3. Carte & Zones

Vue cartographique avec couches d’alertes

Dessin de zones, création de règles automatiques, simulation de rayons

4. Modération

File d’attente des alertes en attente de validation

Score communautaire, duplication, historique signalant

Actions : valider, rejeter, demander complément, assigner

5. Utilisateurs

Gestion des comptes, rôles, réputation

Historique signalements, actions modération

Blocage, avertissement, ajustement réputation

6. Diffusion & Bots

Paramètres des canaux WhatsApp, Telegram, Push app

Règles d’automatisation

Journal des messages entrants bots et statut

7. Notifications & Templates

Création/édition de modèles pour app/bots

Segmentation par zone, catégorie

Programmation de campagnes, journal d’envoi

8. Statistiques

Volume par catégorie/zone/période

Délais de validation, taux de fausses alertes

Export CSV/Excel et vues enregistrées

9. Journal & Sécurité

Audit des actions admin/modérateurs

Gestion RGPD : consentement, suppression, anonymisation

Alertes de sécurité

10. Paramètres

Configuration catégories, expirations, réputation

Rôles & permissions

Intégrations API externes

Stockage fichiers et tâches planifiées