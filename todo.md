# SiteVerseur — TODO

## Configuration & Base

- [x] Configurer la palette de couleurs (brun terreux, vert forêt)
- [x] Configurer le thème dans theme.config.js
- [x] Créer le store de données (AsyncStorage) : chantiers, camions, registre
- [x] Créer les types TypeScript partagés
- [x] Configurer la navigation par onglets (5 onglets)
- [x] Ajouter les icônes dans icon-symbol.tsx
- [x] Créer le contexte global AppProvider
- [x] Données de démonstration (3 chantiers, 2 passages)

## Écrans Gestionnaire

- [x] Tableau de bord (stats, chantiers actifs, alertes)
- [x] Liste des chantiers avec filtres par statut
- [x] Formulaire nouveau chantier / demande de prix
- [x] Détail chantier (infos, documents, historique, tonnages)
- [x] Validation administrative (checklist Walterre)
- [x] Remise de prix
- [x] Documents Walterre (référence, volumes, transporteurs)

## Écrans Préposé

- [x] Arrivée camion — contrôle administratif (étape 1)
- [x] Arrivée camion — contrôle visuel (étape 2)
- [x] Arrivée camion — enregistrement tonnage (étape 3)
- [x] Liste des passages du jour (onglet Camions)
- [x] Registre des passages (filtres par date)

## Écrans communs

- [x] Nouvel incident (types, description, actions)
- [x] Détail incident (résolution, mise à jour)
- [x] Paramètres / Profil (choix rôle, nom, site)

## Branding

- [x] Générer le logo de l'application (camion benne sur fond vert)
- [x] Configurer app.config.ts avec le nom et logo
- [x] Mettre à jour les assets (icon, splash, favicon, android)

## Tests

- [x] Tests unitaires store (10 tests passés)

## Modifications v2 — Authentification & Fonctionnalités avancées

- [x] Schéma DB : tables chantiers, passages, incidents, user_roles
- [x] Migration vers backend tRPC (données partagées mobile + web)
- [x] Authentification Manus OAuth obligatoire (login/logout)
- [x] Rôles gestionnaire/préposé gérés par admin côté serveur
- [x] Blocage des fonctionnalités selon rôle côté backend (protectedProcedure)
- [x] Écran de connexion (login)
- [x] Validation stricte champs (email, téléphone belge, dates)
- [x] Refus automatique si classe > 2 (backend + email)
- [x] Email automatique offre de prix avec prix/tonne
- [x] Bouton refus à l'étape 5 validation + motif + email
- [x] Blocage enregistrement camion si volume atteint ou dépassé
- [x] Incidents : statuts Ouvert/En cours/Résolu + traçabilité
- [x] Export facturation PDF/Excel par chantier et par période
- [x] Envoi emails via serveur (nodemailer ou API)

## Corrections v3 — Navigateur & Gestion utilisateurs

- [x] Corriger compatibilité web (APIs natives non disponibles sur navigateur)
- [x] Corriger les imports et rendu sur navigateur
- [x] Ajouter écran gestion des utilisateurs (admin : liste, attribution rôle)
- [x] Backend : procédure tRPC pour lister et modifier les rôles utilisateurs

## Corrections v4 — Gestion des rôles

- [x] Premier utilisateur connecté reçoit automatiquement le rôle admin
- [x] Le rôle admin est préservé lors des reconnexions (ne pas écraser)
- [x] Écran "En attente de rôle" si l'utilisateur n'a pas encore de rôle attribué
- [x] Accès gestion utilisateurs pour gestionnaire (pas seulement admin système)
- [x] Onglet Utilisateurs visible pour gestionnaire et admin

## Améliorations v6 — Gestion utilisateurs

- [ ] Email automatique à l'admin lors d'une nouvelle connexion (nom + email du nouvel utilisateur)
- [ ] Formulaire de création manuelle d'utilisateur (nom, email, rôle) dans l'écran Utilisateurs
- [ ] Backend : procédure tRPC users.create pour créer un utilisateur manuellement
- [ ] Backend : email de notification à l'admin lors d'un nouvel upsertUser
