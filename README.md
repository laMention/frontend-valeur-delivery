# Valeur Delivery - Plateforme de Gestion de Livraisons

## 📋 Vue d'ensemble

Plateforme complète de gestion, attribution et suivi des livraisons pour les commerçants (e-commerçants et boutiques physiques).

## 🏗️ Architecture

### Frontend (React + TypeScript + TailwindCSS)
- **Architecture**: MVC (Models, Views, Controllers)
- **Framework**: React 19 + TypeScript
- **Styling**: TailwindCSS avec palette personnalisée (#a70000, #000000, #ffffff)
- **Routing**: React Router DOM
- **HTTP Client**: Axios avec interceptors JWT

### Backend (Laravel 12 API)
- **Architecture**: MVC + SOLID
- **Framework**: Laravel 12
- **Authentification**: Laravel Sanctum (JWT)
- **Base de données**: MySQL
- **RBAC**: Rôles et permissions

## 📁 Structure du Projet

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── common/          # Button, Input, Select, Badge, Card
│   │   └── layout/          # AdminLayout, Sidebar, Topbar
│   ├── controllers/         # Contrôleurs MVC frontend
│   ├── hooks/               # React hooks personnalisés
│   ├── models/              # Modèles TypeScript
│   ├── routes/              # Configuration des routes
│   ├── services/            # Services API
│   ├── utils/               # Utilitaires
│   └── views/               # Vues/Pages
│       ├── Dashboard.tsx
│       ├── Login.tsx
│       ├── users/
│       ├── orders/
│       ├── partners/
│       ├── couriers/
│       ├── assignments/
│       ├── reconciliation/
│       ├── pricing/
│       ├── labels/
│       ├── routes/
│       ├── notifications/
│       └── reporting/
```

### Backend (`backend/`)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # Contrôleurs API RESTful
│   │   ├── Requests/         # FormRequests de validation
│   │   └── Resources/        # API Resources JSON
│   ├── Models/               # Modèles Eloquent
│   ├── Policies/             # Policies RBAC
│   ├── Repositories/         # Repositories
│   └── Services/             # Services métier
├── routes/
│   └── api.php               # Routes API
└── database/
    └── migrations/           # Migrations DB
```

## 🚀 Installation

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
composer install
php artisan migrate
php artisan serve
```

## 🔑 Fonctionnalités Principales

### 1. Authentification & RBAC
- ✅ Login/Logout
- ✅ Gestion des rôles (Admin, Partner, Courier)
- ✅ Permissions basées sur les rôles

### 2. Gestion des Commandes
- ✅ CRUD complet
- ✅ Import/Export (CSV, Excel, PDF)
- ✅ Suivi des statuts
- ✅ Historique complet

### 3. Code-barres & Traçabilité
- ✅ Génération automatique
- ✅ Scan (caméra + lecteur USB)
- ✅ Journalisation des scans

### 4. Attribution & Livraisons
- ✅ Attribution manuelle/automatique
- ✅ Réassignation
- ✅ Suivi en temps réel

### 5. Géolocalisation
- ✅ Suivi GPS livreurs
- ✅ Cartographie
- ✅ Calcul de distances

### 6. Optimisation de Trajets
- ⚠️ Intégration Google Maps Directions API (à implémenter)
- ⚠️ Google OR-Tools (à implémenter)

### 7. Tarification Automatique
- ⚠️ Calcul basé sur distance/zone/véhicule (à implémenter)

### 8. Réconciliation
- ✅ Scan de réconciliation
- ⚠️ Statistiques et écarts (à compléter)

### 9. Étiquettes
- ✅ Génération
- ⚠️ Impression PDF (à implémenter)

### 10. Notifications
- ✅ Structure en place
- ⚠️ Intégration SMS/Email/Push (à implémenter)

### 11. Reporting
- ✅ Structure de base
- ⚠️ Graphiques et exports avancés (à implémenter)

## 📝 Notes d'Implémentation

### Services à Compléter

Les services suivants nécessitent une implémentation complète :

1. **RouteService**: Intégration Google Maps Directions API et OR-Tools
2. **PricingService**: Logique de calcul de tarification
3. **BarcodeService**: Génération d'images code-barres (QR Code/CODE128)
4. **LabelService**: Génération PDF d'étiquettes
5. **NotificationService**: Intégration SMS (ReactSMS) et Push (OneSignal/Firebase)
6. **ReportingService**: Graphiques et exports avancés
7. **OrderService**: Import/Export Excel/CSV complet

### Variables d'Environnement

**Frontend** (`.env`):
```
VITE_API_BASE_URL=http://localhost:8000/api
```

**Backend** (`.env`):
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=valeur_delivery
DB_USERNAME=root
DB_PASSWORD=

GOOGLE_MAPS_API_KEY=your_key_here
```

## 🎨 Palette de Couleurs

- **Primary Red**: `#a70000`
- **Black**: `#000000`
- **White**: `#ffffff`

## 📚 Documentation API

Les routes API sont définies dans `backend/routes/api.php`. Toutes les routes sont protégées par `auth:sanctum` sauf les routes d'authentification publiques.

### Endpoints Principaux

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/orders` - Liste des commandes
- `POST /api/orders` - Créer une commande
- `POST /api/assignments` - Attribuer une commande
- `POST /api/barcode/scan` - Scanner un code-barres
- `POST /api/routes/optimize` - Optimiser un itinéraire
- `GET /api/reporting/stats` - Statistiques

## 🔒 Sécurité

- Authentification JWT via Laravel Sanctum
- RBAC complet avec Policies
- Validation des données via FormRequests
- Protection CSRF
- Rate limiting (à configurer)

## 📦 Dépendances Principales

### Frontend
- react, react-dom
- react-router-dom
- axios
- tailwindcss

### Backend
- laravel/framework
- laravel/sanctum
- (à ajouter selon besoins: intervention/image, maatwebsite/excel, etc.)

## 🛠️ Prochaines Étapes

1. Implémenter les services manquants (voir section "Services à Compléter")
2. Ajouter les tests unitaires et d'intégration
3. Configurer les notifications (SMS, Email, Push)
4. Intégrer Google Maps API
5. Implémenter l'optimisation de trajets
6. Ajouter les graphiques de reporting
7. Configurer le déploiement

## 📄 Licence

Propriétaire - Valeur Delivery

