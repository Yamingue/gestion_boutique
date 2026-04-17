# Global Shop — Tching's Fils Multiservices

Outil de gestion de stock et de facturation développé pour **Tching's Fils Multiservices**, un revendeur de matériel électronique (répéteurs, mini UPS, kits solaires).

---

## Fonctionnalités

### Catalogue & Stock
- Fiche produit avec image, SKU, catégorie, prix (FCFA), stock actuel et seuil d'alerte
- Page **Alertes stock** avec niveaux Rupture / Critique / Faible et badge en temps réel dans la navigation
- Gestion des catégories (admin uniquement)

### Point de vente (POS)
- Interface caisse rapide : catalogue filtrable par catégorie et recherche, panier en temps réel
- Recherche client live avec dropdown, création d'un nouveau client sans quitter la vente (modal)
- Choix du statut de la facture à la création (En attente / Payée / Annulée)

### Facturation
- Numérotation automatique au format `FAC-AAAA-MM-NNN` (séquence mensuelle)
- Statuts : **En attente** → **Payée** → **Annulée** (avec ré-incrémentation du stock si annulation)
- Filtres avancés : recherche texte, vendeur, plage de dates, onglets statut
- Cartes de synthèse (total filtré, en attente, payées, annulées)
- **Export Excel** (.xlsx) avec 3 feuilles : récapitulatif, détail lignes, résumé par vendeur

### Impression
- Impression PDF (A4) depuis le navigateur
- Ticket thermique 80mm (imprimante de caisse)

### Réapprovisionnement
- Gestion des **fournisseurs** (coordonnées, historique commandes)
- Bon de commande fournisseur `CMD-AAAA-MM-NNN` avec lignes produits et prix d'achat
- Workflow : **En cours** → **Réceptionnée** (stock incrémenté automatiquement) ou **Annulée**
- Le stock n'est jamais modifié tant que la commande n'est pas réceptionnée

### Clients
- Fiche client (nom, téléphone, email, adresse)
- Historique des factures par client

### Gestion des accès
| Action | ADMIN | VENDEUR |
|--------|:-----:|:-------:|
| Créer / modifier / supprimer un produit | ✅ | ❌ |
| Créer un client | ✅ | ✅ |
| Modifier / supprimer un client | ✅ | ❌ |
| Créer une vente / facture | ✅ | ✅ |
| Changer le statut d'une facture (ses propres) | ✅ | ✅ |
| Changer le statut d'une facture déjà validée | ✅ | ❌ |
| Réapprovisionnement & fournisseurs | ✅ | ❌ |
| Catégories & utilisateurs | ✅ | ❌ |

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, Server Components) |
| Base de données | MariaDB (via Laragon) |
| ORM | Prisma 7 avec `@prisma/adapter-mariadb` |
| Auth | NextAuth v4 (credentials + JWT) |
| Styles | Tailwind CSS v4 |
| Export | ExcelJS |
| Process manager | PM2 |

---

## Prérequis

- [Node.js](https://nodejs.org) ≥ 20
- [Laragon](https://laragon.org) (Apache + MariaDB)
- PM2 installé globalement : `npm install -g pm2`

---

## Installation (développement)

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.production .env
# Éditer .env : DATABASE_PASSWORD, NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Créer la base de données dans phpMyAdmin ou :
# CREATE DATABASE IF NOT EXISTS globalshop;

# 4. Appliquer les migrations
npx prisma migrate deploy
npx prisma generate

# 5. Créer le premier utilisateur admin
npm run create-user -- admin@tchings.com "MotDePasse!" "Administrateur" ADMIN

# 6. Démarrer en développement
npm run dev
```

---

## Déploiement en production (bureau local, Laragon)

### Première installation

```bat
:: Construire le projet
npm run build

:: Démarrer l'application
scripts\demarrer-prod.bat

:: Installer le démarrage automatique au boot Windows
scripts\installer-demarrage-windows.bat
```

### Configuration Apache (Laragon)

1. Copier `scripts/apache-globalshop.conf` dans `C:\laragon\etc\apache2\sites-enabled\`
2. Activer les modules proxy dans `httpd.conf` :
   ```apache
   LoadModule proxy_module        modules/mod_proxy.so
   LoadModule proxy_http_module   modules/mod_proxy_http.so
   LoadModule headers_module      modules/mod_headers.so
   ```
3. Redémarrer Apache depuis le panneau Laragon

### Mettre à jour l'application

```bat
scripts\build-et-redemarrer.bat
```

### Commandes PM2

```bash
npm run start:prod    # Démarrer
npm run stop:prod     # Arrêter
npm run restart:prod  # Redémarrer
npm run logs:prod     # Voir les logs
pm2 monit             # Monitoring temps réel
```

### Accès depuis d'autres postes du réseau local

Dans `.env.production`, remplacer :
```
NEXTAUTH_URL=http://192.168.1.XX   # IP du bureau admin
```
Et dans `scripts/apache-globalshop.conf`, décommenter la ligne `ServerName 192.168.1.XX`.

---

## Structure du projet

```
global_shop/
├── app/
│   ├── (auth)/           # Page de connexion
│   ├── (dashboard)/      # Toutes les pages de l'app
│   │   ├── dashboard/    # Tableau de bord & KPI
│   │   ├── vente/        # Point de vente (POS)
│   │   ├── catalogue/    # Gestion produits
│   │   ├── alertes/      # Alertes de rupture de stock
│   │   ├── clients/      # Gestion clients
│   │   ├── factures/     # Facturation & export Excel
│   │   ├── reappro/      # Bons de commande fournisseurs
│   │   ├── fournisseurs/ # Gestion fournisseurs
│   │   ├── categories/   # Gestion catégories
│   │   └── utilisateurs/ # Gestion utilisateurs (admin)
│   ├── (print)/          # Pages impression (layout isolé)
│   └── api/              # Routes API (export Excel)
├── components/           # Composants partagés
├── lib/
│   ├── actions/          # Server Actions (mutations)
│   ├── auth.ts           # Configuration NextAuth
│   ├── enums.ts          # Enums Prisma safe (Client Components)
│   └── prisma.ts         # Client Prisma singleton
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── migrations/       # Historique des migrations
├── public/uploads/       # Images produits uploadées
├── scripts/              # Scripts de déploiement (.bat)
├── logs/                 # Logs PM2 (ignorés par git)
├── ecosystem.config.cjs  # Configuration PM2
└── .env.production       # Variables d'environnement de prod
```

---

## Couleurs de marque

| Couleur | Code |
|---------|------|
| Bleu principal | `#0057A8` |
| Orange accent | `#F47920` |
| Blanc | `#FFFFFF` |
