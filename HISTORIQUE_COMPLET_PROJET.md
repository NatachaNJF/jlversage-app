# Historique Complet du Projet SiteVerseur

**Projet :** versage-terres (SiteVerseur - Suivi des Terres)  
**Utilisateur :** Natacha Jerouville  
**Date de création :** Février 2026  
**Dernière mise à jour :** 12 mars 2026

---

## Table des Matières

1. [Historique Git Complet](#historique-git-complet)
2. [Todo.md - Demandes et Statuts](#todomd---demandes-et-statuts)
3. [Architecture et Infrastructure](#architecture-et-infrastructure)
4. [Contexte et Raison d'Être](#contexte-et-raison-dêtre)

---

## Historique Git Complet

### Commits Récents (12 mars 2026)

```
76b4cc6 | 2026-03-12 | add: endpoint diagnostic pour déboguer le chemin web-dist
47831f6 | 2026-03-12 | fix: utiliser process.cwd() au lieu de __dirname pour le chemin web-dist
4772dfc | 2026-03-12 | Checkpoint: Refonte page analyse : 2 étapes distinctes
cbe87cc | 2026-03-12 | refonte page analyse : 2 étapes (capacité + finances), case offre Odoo, suppression envoi offre auto
52a6e51 | 2026-03-12 | Checkpoint: Fix : URL API production codée en dur dans constants/oauth.ts
c1ce20f | 2026-03-12 | fix: URL API production codée en dur pour app native
f341ff2 | 2026-03-12 | Checkpoint: Fix critique : rebuild complet du web-dist
```

### Commits Importants (10-11 mars 2026)

```
ae4129e | 2026-03-10 | feat: détail passage avec photo + filtre acceptés/refusés dans registre
52cff54 | 2026-03-10 | Checkpoint: Fix critique : migration transporteurs corrigée
bc8a7bf | 2026-03-10 | fix: migration transporteurs avec mailConditionsEnvoye
e6d677e | 2026-03-10 | fix: compatibilité MySQL/TiDB pour les insertions
f31b0cc | 2026-03-10 | Checkpoint: Publication de toutes les évolutions
d2d92be | 2026-03-10 | fix: classe sans défaut dans modifier, libellés dates versage
a45e6a3 | 2026-03-10 | feat: refus classe>2 site vitrine, siteVersage, bonCommandeSigne, planningVersages, mail transporteur
e69639c | 2026-03-10 | feat: section témoignages site vitrine + écran pré-validation chantier
```

### Commits Fondamentaux (8-9 mars 2026)

```
e39e376 | 2026-03-09 | Checkpoint: Corrections majeures : authentification web, Alert.alert remplacé par window.confirm
aa82cd6 | 2026-03-09 | fix: auth web - utiliser localStorage token au lieu des cookies
1182304 | 2026-03-09 | fix: resetPassword met mustChangePassword=false au lieu de true
7368ee4 | 2026-03-09 | fix: supprimer import.meta.url - utiliser __dirname natif CJS
f560995 | 2026-03-09 | fix: pré-builder app web Expo et simplifier Dockerfile
b39c053 | 2026-03-08 | feat: déployer app web sur Railway - serveur Express sert API + app web Expo
```

### Commits Critiques (4-6 mars 2026)

```
664f39c | 2026-03-04 | Checkpoint v12 : Vérification et correction des bugs v11
5ccbe90 | 2026-03-04 | update: todo.md — bugs v11 corrigés et vérifiés
d6b24d9 | 2026-03-04 | fix: passages.create via tRPC, statut chantier, societeNom
7d7ecf5 | 2026-03-04 | Checkpoint: Correction critique : verifySession accepte tokens locaux
f6d4221 | 2026-03-04 | Checkpoint: v9 - Corrections login : token JWT retourné
```

### Commits Fondamentaux (Février 2026)

```
b39c053 | 2026-03-08 | feat: déployer app web sur Railway
b4fcaea | 2026-03-08 | fix: remettre chantiers.get en .query(), build CJS
1f18a20 | 2026-03-06 | fix: chantiers.get - changer .query() en .mutation()
```

---

## Todo.md - Demandes et Statuts

### ✅ Configuration & Base (Complété)
- Configurer la palette de couleurs (brun terreux, vert forêt)
- Configurer le thème dans theme.config.js
- Créer le store de données (AsyncStorage)
- Créer les types TypeScript partagés
- Configurer la navigation par onglets (5 onglets)
- Ajouter les icônes dans icon-symbol.tsx
- Créer le contexte global AppProvider
- Données de démonstration (3 chantiers, 2 passages)

### ✅ Écrans Gestionnaire (Complété)
- Tableau de bord (stats, chantiers actifs, alertes)
- Liste des chantiers avec filtres par statut
- Formulaire nouveau chantier / demande de prix
- Détail chantier (infos, documents, historique, tonnages)
- Validation administrative (checklist Walterre)
- Remise de prix
- Documents Walterre (référence, volumes, transporteurs)

### ✅ Écrans Préposé (Complété)
- Arrivée camion — contrôle administratif (étape 1)
- Arrivée camion — contrôle visuel (étape 2)
- Arrivée camion — enregistrement tonnage (étape 3)
- Liste des passages du jour (onglet Camions)
- Registre des passages (filtres par date)

### ✅ Branding (Complété)
- Générer le logo de l'application (camion benne sur fond vert)
- Configurer app.config.ts avec le nom et logo
- Mettre à jour les assets (icon, splash, favicon, android)

### ✅ Authentification & Fonctionnalités Avancées (Complété)
- Schéma DB : tables chantiers, passages, incidents, user_roles
- Migration vers backend tRPC
- Authentification email/mot de passe locale (sans OAuth Manus)
- Rôles gestionnaire/préposé gérés par admin
- Blocage des fonctionnalités selon rôle
- Écran de connexion
- Validation stricte champs
- Refus automatique si classe > 2
- Email automatique offre de prix
- Bouton refus + motif + email
- Blocage enregistrement camion si volume atteint
- Incidents : statuts Ouvert/En cours/Résolu
- Export facturation PDF/Excel

### ✅ Corrections Web (Complété)
- Corriger compatibilité web (APIs natives)
- Corriger les imports et rendu sur navigateur
- Ajouter écran gestion des utilisateurs
- Backend : procédure tRPC pour lister et modifier les rôles

### ✅ Gestion des Rôles (Complété)
- Premier utilisateur connecté reçoit automatiquement le rôle admin
- Le rôle admin est préservé lors des reconnexions
- Écran "En attente de rôle"
- Accès gestion utilisateurs pour gestionnaire
- Onglet Utilisateurs visible pour gestionnaire et admin

### ❌ Améliorations v6 — Gestion utilisateurs (EN ATTENTE)
- [ ] Email automatique à l'admin lors d'une nouvelle connexion
- [ ] Formulaire de création manuelle d'utilisateur
- [ ] Backend : procédure tRPC users.create
- [ ] Backend : email de notification à l'admin

### ✅ OAuth Mobile et Emails (Complété)
- Corriger le schéma OAuth pour Expo Go
- Corriger l'envoi d'email lors de la création manuelle d'utilisateur
- Vérifier la configuration du redirect_uri

### ✅ Suppression Utilisateurs (Complété)
- Corriger la suppression d'un utilisateur
- Permettre de supprimer son propre compte de test
- Corriger le bouton Supprimer

### ✅ Migration Auth Email/Mot de Passe (Complété)
- Remplacer OAuth Manus par login email + mot de passe
- Backend : route auth.login (bcrypt, JWT, cookie session)
- Backend : route auth.changePassword
- Backend : route users.create avec champ password
- Backend : route users.resetPassword
- Création automatique compte admin
- Écran login : formulaire email/mot de passe
- Écran login : changement de mot de passe obligatoire
- Écran utilisateurs : champ mot de passe
- Écran utilisateurs : bouton réinitialiser mot de passe
- Déploiement Railway

### ✅ Corrections v9 — Admin, Contact et Accès Web (Complété)
- Corriger le compte admin sur Railway
- Afficher l'email de contact jlversage@erouville.be
- ❌ Vérifier l'accès navigateur web (EN ATTENTE)

### ✅ Bugs v10 — 3 Corrections (Complété)
- Email de contact non cliquable (Linking.openURL mailto)
- Erreur 10001 "please login" sur mobile (verifySession pour appId vide)
- ❌ Connexion web admin ne fonctionne pas (EN ATTENTE)

### ✅ Bugs v11 — Chantier et Passages (Complété)
- Impossible de passer un chantier en statut "En analyse"
- Camion non enregistré lors d'un passage
- Vider les vieux chantiers de test

### ❌ Bugs v12 — Chantier Introuvable (EN ATTENTE)
- [ ] Chantier créé visible dans filtre "Tous" mais introuvable dans détail
- [ ] Problème de requête ou permissions lors de l'accès au chantier par ID

### ❌ Déploiement v13 — Mobile Natif et Web (EN ATTENTE)
- [ ] Corriger le bug du chantier introuvable
- [ ] Générer build APK pour Android
- [ ] Générer build IPA pour iOS
- [ ] Déployer l'app web sur Railway
- [ ] Tester flux complet

### ❌ Infrastructure v14 — Diagnostic Complet (EN ATTENTE)
- [ ] Vérifier l'état de tous les services Railway
- [ ] Vérifier que la base PostgreSQL est bien démarrée
- [ ] Vérifier les variables d'environnement
- [ ] Vérifier les logs de déploiement
- [ ] Vérifier que l'application arrive bien à se connecter à la base
- [ ] Corriger les erreurs et redéployer
- [ ] Configurer le serveur Express pour servir l'app web
- [ ] Fournir les URL publiques fonctionnelles
- [ ] Fournir les accès Railway et base de données

### ✅ Site Vitrine v20 (Complété)
- Corriger horaires : Lun-Ven 7h-16h, fermé le samedi
- Corriger email : jlversage@jerouville.be
- Corriger classes : seules classes 1 et 2 acceptées
- Supprimer la section témoignages
- Ajouter lien Google Maps
- Ajouter numéro de téléphone 061 23 03 40
- Ajouter page mentions légales

### ✅ Site Vitrine v21 — Google Maps (Complété)
- Mettre à jour le lien Google Maps

### ❌ DNS v22 — Configuration jlversage.be (EN ATTENTE)
- [ ] Configurer Railway pour accepter jlversage.be et www.jlversage.be
- [ ] Configurer Railway pour accepter app.jlversage.be
- [ ] Ajouter redirection / vers /vitrine.html

### ✅ Mail v23 — Configuration SMTP (Complété)
- Configurer SMTP avec jessica.henrion@jerouville.be
- Tester l'envoi d'email

### ✅ Fix v24 — Rebuild web-dist (Complété)
- Identifier que web-dist était obsolète
- Reconstruire le web-dist complet
- Corriger l'adresse email dans email.ts
- Corriger l'adresse email dans login.tsx
- Vérifier que vitrine.html et mentions-legales.html sont dans web-dist

### ✅ Fix v25 — URL API Production (Complété)
- Identifier que l'ancienne URL backend-production-1c955 était codée
- Coder l'URL de production en dur dans constants/oauth.ts
- Ajouter détection manus.space
- Rebuild web-dist

### ✅ Fix v26 — Refonte Page Analyse (Complété)
- Ajouter colonnes offreOdoo et dateOffreOdoo
- Ajouter migration SQL
- Ajouter route tRPC terminerAnalyse
- Refaire page prevalidation/[id].tsx : 2 phases
- Supprimer modal offre
- Nettoyer les références

---

## Architecture et Infrastructure

### Stack Technologique

| Composant | Technologie | Statut |
|-----------|-------------|--------|
| Frontend Mobile | React Native + Expo SDK 54 | ✅ |
| Frontend Web | Expo Web Export | ✅ |
| Backend | Node.js + Express + tRPC | ✅ |
| Base de Données | PostgreSQL (Railway) | ✅ |
| ORM | Drizzle ORM | ✅ |
| Authentification | Email + Mot de passe + JWT | ✅ |
| Emails | Nodemailer + SMTP | ✅ |
| Stockage | S3 (via Manus) | ✅ |
| Déploiement | Railway (GitHub) | ✅ |

### Infrastructure Déployée

```
GitHub (NatachaNJF/jlversage-app)
    ↓
    └─→ Railway (Webhook)
        ├─ Backend API : versageterr-kkmfyarn.manus.space
        ├─ App Web : versageterr-kkmfyarn.manus.space/
        └─ PostgreSQL Database
```

### Fichiers Clés

```
versage-terres/
├── app/                          # Application Expo (React Native + Web)
│   ├── (tabs)/                   # Onglets principaux
│   │   ├── index.tsx             # Accueil
│   │   ├── chantiers.tsx         # Liste des chantiers
│   │   ├── camions.tsx           # Passages du jour
│   │   ├── registre.tsx          # Registre complet
│   │   ├── facturation.tsx       # Export facturation
│   │   ├── parametres.tsx        # Paramètres utilisateur
│   │   └── utilisateurs.tsx      # Gestion utilisateurs (admin)
│   ├── chantier/
│   │   ├── [id].tsx              # Détail du chantier
│   │   ├── prevalidation/[id].tsx # Page analyse (2 étapes)
│   │   ├── validation/[id].tsx    # Page validation
│   │   ├── modifier/[id].tsx      # Modification
│   │   ├── documents/[id].tsx     # Documents Walterre
│   │   └── offre/[id].tsx         # Offre de prix
│   ├── camion/
│   │   ├── arrivee/[id].tsx       # Arrivée camion (3 étapes)
│   │   └── detail/[id].tsx        # Détail passage
│   ├── login.tsx                 # Connexion
│   ├── attente-role.tsx          # En attente de rôle
│   └── vitrine.tsx               # Site vitrine
├── server/                       # Backend Node.js
│   ├── _core/
│   │   └── index.ts              # Serveur Express principal
│   ├── routers.ts                # Routes tRPC
│   ├── db.ts                     # Requêtes base de données
│   ├── email.ts                  # Templates email
│   ├── oauth.ts                  # OAuth Manus
│   └── README.md                 # Documentation backend
├── drizzle/                      # Schéma base de données
│   ├── schema.ts                 # Définition des tables
│   └── migrations/               # Migrations SQL
├── web-dist/                     # Application web compilée
│   ├── index.html                # Point d'entrée
│   ├── vitrine.html              # Site vitrine
│   ├── mentions-legales.html     # Mentions légales
│   ├── _expo/                    # Assets Expo
│   └── chantier/                 # Routes web
├── constants/
│   └── oauth.ts                  # Configuration OAuth + URL API
├── package.json                  # Dépendances
├── app.config.ts                 # Configuration Expo
├── tailwind.config.js            # Styles Tailwind
├── todo.md                       # Demandes et statuts
└── CONVERSATION_COMPLETE.md      # Historique conversation
```

---

## Contexte et Raison d'Être

### Pourquoi Ce Projet ?

**SiteVerseur** est une application de suivi des versages de terres pour **JL Versage**, une entreprise belge spécialisée dans le traitement et la valorisation des terres.

### Problèmes Résolus

1. **Gestion manuelle des chantiers** → Application centralisée
2. **Suivi des passages de camions** → Registre numérique avec photos
3. **Validation administrative** → Workflow structuré avec checklist
4. **Facturation** → Export automatique PDF/Excel
5. **Communication transporteurs** → Emails automatiques
6. **Gestion des utilisateurs** → Rôles (admin, gestionnaire, préposé)

### Utilisateurs Cibles

1. **Admin** : Configuration, gestion utilisateurs, accès complet
2. **Gestionnaire** : Création chantiers, validation administrative, analyse financière
3. **Préposé** : Enregistrement passages, contrôles visuels/administratifs

### Workflow Principal

```
1. Demande de prix (site vitrine)
   ↓
2. Vérification classe (refus auto si > 2)
   ↓
3. Création chantier (gestionnaire)
   ↓
4. Analyse capacité (planning versages)
   ↓
5. Analyse financière (situation saine ou comptant)
   ↓
6. Envoi offre de prix
   ↓
7. Validation administrative (checklist Walterre)
   ↓
8. Enregistrement passages
