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

## Corrections v7 — OAuth mobile et emails
- [x] Corriger le schéma OAuth pour Expo Go (exp:// → WebBrowser)
- [x] Corriger l'envoi d'email lors de la création manuelle d'utilisateur
- [x] Vérifier la configuration du redirect_uri dans constants/oauth.ts

## Correction suppression utilisateurs
- [x] Corriger la suppression d'un utilisateur dans l'écran Utilisateurs
- [x] Permettre de supprimer son propre compte de test (sauf le dernier admin)

## Correction bouton Supprimer utilisateur
- [x] Corriger le bouton Supprimer qui ne fait rien (Pressable + Alert + mutation)

## Migration v8 — Auth email/mot de passe locale (sans OAuth Manus)

- [x] Remplacer OAuth Manus par login email + mot de passe
- [x] Backend : route auth.login (bcrypt, JWT, cookie session)
- [x] Backend : route auth.changePassword (vérification ancien MDP)
- [x] Backend : route users.create avec champ password obligatoire
- [x] Backend : route users.resetPassword (admin/gestionnaire)
- [x] Création automatique compte admin au démarrage (admin@jlversage.be)
- [x] Écran login : formulaire email/mot de passe (sans bouton Manus)
- [x] Écran login : changement de mot de passe obligatoire à la première connexion
- [x] Écran utilisateurs : champ mot de passe dans formulaire de création
- [x] Écran utilisateurs : bouton réinitialiser mot de passe (🔑 MDP)
- [x] Déploiement Railway avec nouveau code

## Corrections v9 — Admin, contact et accès web

- [x] Corriger le compte admin sur Railway (admin@jlversage.be)
- [x] Afficher l'email de contact jlversage@erouville.be dans l'écran login
- [ ] Vérifier l'accès navigateur web pour la gestion des comptes

## Bugs v10 — 3 corrections urgentes
- [x] Email de contact non cliquable dans l'écran login (ajouter Linking.openURL mailto)
- [x] Erreur 10001 "please login" sur mobile après connexion (corriger verifySession pour appId vide)
- [ ] Connexion web admin ne fonctionne pas (cookie de session non accepté par le navigateur)

## Bugs v11 — Chantier et passages
- [x] Impossible de passer un chantier en statut "En analyse" (correction déjà dans commit d6b24d9)
- [x] Camion non enregistré lors d'un passage (utilise bien tRPC, fonctionne correctement)
- [x] Vider les vieux chantiers de test de la base Railway (supprimés)


## Bugs v12 — Chantier introuvable dans détail
- [ ] Chantier créé visible dans filtre "Tous" mais introuvable dans détail/documents Walterre
- [ ] Problème de requête ou permissions lors de l'accès au chantier par ID


## Déploiement v13 — Mobile natif et web
- [ ] Corriger le bug du chantier introuvable dans détail (requête GET tRPC)
- [ ] Générer build APK pour Android
- [ ] Générer build IPA pour iOS
- [ ] Déployer l'app web sur Railway
- [ ] Tester flux complet : création chantier → détail → documents Walterre


## Infrastructure v14 — Diagnostic complet et remise en état
- [ ] Vérifier l'état de tous les services Railway (app, site web, base PostgreSQL)
- [ ] Vérifier que la base PostgreSQL est bien démarrée et accessible
- [ ] Vérifier les variables d'environnement (DATABASE_URL, etc.)
- [ ] Vérifier les logs de déploiement et d'exécution
- [ ] Vérifier que l'application arrive bien à se connecter à la base
- [ ] Corriger les erreurs et redéployer si nécessaire
- [ ] Configurer le serveur Express pour servir l'app web (Expo web)
- [ ] Fournir les URL publiques fonctionnelles
- [ ] Fournir les accès Railway et base de données à Natacha

- [x] Site vitrine : section témoignages clients avec citations et photos
- [x] App mobile : écran pré-validation chantier (timing versage + finances saines) avant validation client
- [ ] Refus automatique classe > 2 depuis site vitrine (demandePublique.soumettre)
- [ ] Libellés "date de début du versage" et "date de fin du versage" dans la fiche chantier
- [ ] Classe sans valeur par défaut dans le formulaire de création
- [ ] Champ "versage à (site)" dans la fiche chantier
- [ ] Mail conditions d'accès au site pour les transporteurs (envoi automatique à la création)
- [ ] Coche "mail conditions envoyé" dans la table et l'interface transporteurs
- [ ] Coche "bon de commande signé" dans l'étape documents Walterre
- [ ] Tableau planning versages prévus par jour dans l'étape documents Walterre
- [x] Refus automatique classe > 2 depuis site vitrine (route demandePublique)
- [x] Libellés "Date de début du versage" et "Date de fin du versage" dans formulaire
- [x] Classe sans valeur par défaut dans formulaire création chantier
- [x] Champ "Versage à (site)" dans formulaire création chantier
- [x] Mail conditions d'accès au site envoyé automatiquement à la création d'un transporteur
- [x] Coche "Conditions envoyées" dans la liste des transporteurs
- [x] Coche "Bon de commande signé" dans l'écran documents Walterre
- [x] Tableau planning versages prévus par jour dans l'écran documents Walterre
- [x] Migrations base de données (siteVersage, bonCommandeSigne, planningVersages, mailConditionsEnvoye)

## Registre v15 — Détail passage et filtres
- [x] Filtre acceptés/refusés dans le registre (boutons Tous / Acceptés / Refusés)
- [x] Page de détail d'un passage (photo, motif refus, contrôles, anomalies)

## Analyse chantier v16 — Refonte workflow
- [x] Supprimer le champ "Versage à (site)" du formulaire de création chantier
- [x] Refondre l'écran d'analyse en 2 sous-étapes : 1) capacité de versage (planning), 2) analyse financière
- [x] Étape 1 analyse : afficher le planning des versages prévus, permettre de valider ou refuser la capacité
- [x] Si refus capacité : email de refus expliquant le motif (planning complet)
- [x] Étape 2 analyse : analyse financière (situation saine ou non)
- [x] Si situation saine : envoi offre de prix standard
- [x] Si situation non saine : envoi offre de prix avec condition paiement au comptant

## Emails v17 — Mise à jour textes
- [x] Email 1 : refus classe — ajouter invitation à recontacter si classe 1 ou 2
- [x] Email 2 : refus capacité — préciser "si d'autres dates sont possibles"
- [x] Email 3 : offre de prix — conditions détaillées en dur (Walterre, refus matériaux, classes 1-2, prix 9€/t avec réductions)
- [x] Email 4 : offre comptant — ajouter "avant de décharger sur le site"
- [x] Email 5 : autorisation — remettre les conditions détaillées (refus matériaux, classes 1-2)
- [x] Email 7 : volume atteint — préciser qu'il faut un nouveau bon de transport Walterre

## Planning v18 — Congés et fermetures
- [x] Corriger horaires email transporteur : lun-ven 07h-16h, pas de samedi, dernier dépôt 15h45
- [x] Ajouter gestion des congés/fermetures dans le planning de versages (tableau des jours bloqués)
- [ ] Afficher les jours fermés dans l'écran d'analyse étape 1 (capacité)
- [ ] Bloquer les passages ce jour-là dans l'app préposé si le site est fermé

## Workflow v19 — Correction déclenchement analyse
- [x] Déplacer l'écran analyse 2 étapes du statut validation_admin vers le statut analyse
- [x] Supprimer l'ancienne modal d'offre directe au statut analyse
- [x] Simplifier validation_admin : bouton "Autoriser" direct (sans les 2 étapes)

## Site vitrine v20 — Corrections
- [x] Corriger horaires : Lun-Ven 7h-16h, fermé le samedi
- [x] Corriger email : jlversage@jerouville.be
- [x] Corriger classes : seules classes 1 et 2 acceptées (chiffre clé "2 classes" et tableau)
- [x] Supprimer la section témoignages
- [x] Ajouter lien Google Maps (placeholder en attendant l'adresse exacte)
- [x] Ajouter numéro de téléphone 061 23 03 40 (demandez Jessica)
- [x] Ajouter page mentions légales (Jérouville, BE413825754, Quartier Haynol 1, 6800 Libramont-Chevigny)

## Site vitrine v21 — Google Maps
- [x] Mettre à jour le lien Google Maps avec l'adresse exacte du site de versage
