# Mode d'emploi — SiteVerseur
## Application de suivi du versage des terres

---

## Table des matières

1. [Présentation générale](#1-présentation-générale)
2. [Accès à l'application](#2-accès-à-lapplication)
3. [Profils utilisateurs](#3-profils-utilisateurs)
4. [Guide du Gestionnaire](#4-guide-du-gestionnaire)
5. [Guide du Préposé](#5-guide-du-préposé)
6. [Workflow complet — les 11 étapes](#6-workflow-complet--les-11-étapes)
7. [Gestion des incidents](#7-gestion-des-incidents)
8. [Facturation et clôture](#8-facturation-et-clôture)
9. [Accès client — perspectives](#9-accès-client--perspectives)
10. [Points critiques à retenir](#10-points-critiques-à-retenir)

---

## 1. Présentation générale

**SiteVerseur** est une application mobile et web destinée à la gestion complète du versage des terres sur un site récepteur. Elle couvre l'intégralité du processus, depuis la réception d'une demande de prix jusqu'à la clôture et l'archivage du dossier, en passant par le contrôle en temps réel des camions sur site.

L'application est conçue pour deux types d'utilisateurs travaillant en complémentarité : le **gestionnaire** (responsable administratif) qui pilote les dossiers depuis son bureau ou son téléphone, et le **préposé** (agent sur site, entreprise Thiry) qui contrôle et enregistre chaque arrivée de camion en temps réel.

### Disponibilité

| Plateforme | Accès | Remarques |
|---|---|---|
| **iOS (iPhone/iPad)** | Via Expo Go (scan QR) | Accès complet, interface native optimisée |
| **Android** | Via Expo Go (scan QR) | Accès complet, interface native optimisée |
| **Navigateur web** | URL directe | Tableau de bord et gestion des dossiers accessibles depuis PC ou tablette |

> **Bonne nouvelle pour le responsable administratif :** l'intégralité du tableau de bord, des dossiers chantiers et du registre est consultable depuis un navigateur web ordinaire, sans installation. Il suffit d'ouvrir l'URL de l'application dans Chrome, Firefox ou Edge.

---

## 2. Accès à l'application

### Sur mobile (iOS ou Android)

1. Télécharger l'application **Expo Go** depuis l'App Store ou le Google Play Store.
2. Scanner le QR code fourni par votre administrateur (disponible dans le panneau de gestion).
3. L'application se charge directement dans Expo Go.

### Sur navigateur web

Ouvrir simplement l'URL de l'application dans n'importe quel navigateur moderne. Aucune installation n'est requise. L'interface s'adapte automatiquement à la taille de l'écran.

---

## 3. Profils utilisateurs

L'application propose deux profils distincts, configurables depuis l'écran **Paramètres** (onglet en bas à droite).

### Comment configurer son profil

1. Ouvrir l'onglet **Paramètres** (icône engrenage, en bas à droite).
2. Appuyer sur **Modifier le profil**.
3. Renseigner son **prénom/nom**, sélectionner son **rôle** (Gestionnaire ou Préposé), et indiquer le **nom du site**.
4. Appuyer sur **Enregistrer**.

> Il n'y a pas de système de mot de passe dans la version actuelle. Chaque utilisateur configure son profil sur son propre appareil. Le rôle sélectionné détermine les fonctionnalités affichées.

---

### Profil Gestionnaire (responsable administratif)

Le gestionnaire pilote l'ensemble des dossiers chantiers. Il dispose d'un accès complet à toutes les fonctionnalités de l'application.

| Fonctionnalité | Accès |
|---|---|
| Tableau de bord (stats, alertes, chantiers actifs) | ✅ Complet |
| Créer un nouveau dossier chantier | ✅ |
| Encoder la remise de prix | ✅ |
| Saisir les documents Walterre | ✅ |
| Valider administrativement un dossier | ✅ |
| Autoriser un chantier à livrer | ✅ |
| Consulter le registre des passages | ✅ |
| Gérer les incidents | ✅ |
| Clôturer un chantier | ✅ |
| Enregistrer une arrivée camion | ✅ (si besoin) |
| Paramètres et profil | ✅ |

**Usage typique :** le gestionnaire travaille principalement depuis son bureau (navigateur web) ou son téléphone. Il crée les dossiers, suit les tonnages, valide les documents et reçoit les alertes automatiques (volume atteint, dossier en attente).

---

### Profil Préposé (agent sur site — entreprise Thiry)

Le préposé est l'agent physiquement présent sur le site de versage. Son rôle est de contrôler chaque camion à l'arrivée et d'enregistrer le passage en temps réel.

| Fonctionnalité | Accès |
|---|---|
| Tableau de bord simplifié (stats du jour) | ✅ |
| Consulter la liste des chantiers autorisés | ✅ (lecture) |
| Enregistrer une arrivée camion (3 étapes) | ✅ Principal |
| Consulter le registre du jour | ✅ |
| Signaler un incident | ✅ |
| Créer/modifier un dossier chantier | ❌ (réservé gestionnaire) |
| Valider administrativement un dossier | ❌ (réservé gestionnaire) |
| Autoriser un chantier | ❌ (réservé gestionnaire) |

**Usage typique :** le préposé utilise l'application sur son smartphone, sur le terrain. À chaque arrivée de camion, il ouvre l'onglet **Camions**, appuie sur **Nouvelle arrivée** et suit les 3 étapes de contrôle.

---

## 4. Guide du Gestionnaire

### 4.1 Tableau de bord

L'écran d'accueil affiche en temps réel :

- Le nombre de camions passés aujourd'hui, le tonnage accepté, le nombre de refus et les incidents ouverts.
- Une **bannière d'alerte** orange si un ou plusieurs chantiers nécessitent une action (validation en attente, volume atteint).
- La liste des **chantiers actifs** avec leur barre de progression (tonnage accepté vs volume déclaré).
- Des **raccourcis rapides** vers les actions les plus fréquentes.

Le bouton **+** en haut à droite permet de créer un nouveau dossier chantier directement depuis le tableau de bord.

---

### 4.2 Créer un nouveau dossier chantier (Étape 1 — Demande de prix)

1. Appuyer sur **+** (tableau de bord) ou aller dans l'onglet **Chantiers** → **Nouveau chantier**.
2. Renseigner les informations de la **société cliente** : nom, adresse, numéro de TVA, e-mail, personne de contact, téléphone.
3. Renseigner les informations du **chantier** : localisation, contact chantier, téléphone chantier.
4. Indiquer le **volume estimé** (en tonnes), la **classe** (1 à 5), et la **période prévue** (dates de début et de fin).
5. Appuyer sur **Créer le dossier**. Le dossier est créé avec le statut **Demande reçue**.

---

### 4.3 Encoder la remise de prix (Étape 3)

Depuis le détail d'un chantier au statut "Demande reçue" ou "Analyse" :

1. Appuyer sur **Modifier / Valider** → onglet **Offre de prix**.
2. Saisir le **prix à la tonne** (€/T) et les **conditions d'acceptation**.
3. Enregistrer. Le statut passe à **Offre envoyée**.
4. Une fois la confirmation du client reçue (par mail ou directement), cocher **Confirmation client reçue**. Le statut passe à **Documents demandés**.

---

### 4.4 Saisir les documents Walterre (Étape 4)

Depuis le détail d'un chantier au statut "Documents demandés" :

1. Appuyer sur **Saisir les documents**.
2. Encoder la **référence chantier Walterre**, le **régime applicable**, le **volume déclaré** (T).
3. Indiquer si le **certificat de qualité** et le **rapport d'analyse** ont été reçus.
4. Ajouter les **transporteurs** autorisés (un par ligne).
5. Enregistrer. Le statut passe à **Validation en cours**.

---

### 4.5 Validation administrative et autorisation (Étape 5)

Depuis le détail d'un chantier au statut "Validation en cours" :

1. Appuyer sur **Modifier / Valider**.
2. Cocher chacun des 5 critères de validation :
   - Classe ≤ 2
   - Certificat de qualité valide
   - Rapport d'analyse cohérent
   - Régime Walterre compatible
   - Volume annoncé raisonnable
3. Si tous les critères sont validés, retourner sur le détail du chantier et appuyer sur **Autoriser le chantier**.
4. Confirmer l'autorisation. Le statut passe à **Autorisé** et la date d'autorisation est enregistrée.

> **Important :** sans cette étape, aucun camion ne doit être accepté sur le site. Le préposé voit le statut du chantier dans son application.

---

### 4.6 Suivi des tonnages (Étape 7)

Le suivi est automatique. À chaque passage de camion enregistré par le préposé :

- Le tonnage accepté s'ajoute au cumul du chantier.
- La barre de progression se met à jour dans le tableau de bord et le détail du chantier.
- Lorsque le tonnage accepté atteint ou dépasse le volume déclaré, le statut passe automatiquement à **Volume atteint** et une alerte apparaît dans le tableau de bord.

---

### 4.7 Filtrer et rechercher les chantiers

Dans l'onglet **Chantiers**, il est possible de filtrer par statut en appuyant sur les pastilles colorées en haut de l'écran (Tous, Actifs, En attente, Clôturés).

---

## 5. Guide du Préposé

### 5.1 Enregistrer une arrivée camion (Étapes 6.1, 6.2, 6.3)

L'enregistrement d'un camion se fait en **3 étapes successives**, accessibles depuis l'onglet **Camions** → bouton **Nouvelle arrivée**.

#### Étape 1 — Contrôle administratif

Vérifier et cocher :

- **Bon Walterre** présent et valide
- **Référence chantier** correcte
- **Plaque d'immatriculation** conforme
- **Correspondance** avec un chantier autorisé

Si une incohérence est détectée, appuyer sur **Refuser** et sélectionner le motif. Le passage est enregistré comme refusé.

#### Étape 2 — Contrôle visuel

Indiquer si le contrôle visuel est **conforme** ou non. En cas de non-conformité, cocher les anomalies constatées parmi :

- Déchets présents
- Gravats
- Plastique
- Odeur suspecte
- Mélange douteux
- Couleur anormale

Il est possible d'ajouter une **photo** depuis l'appareil photo ou la galerie.

#### Étape 3 — Enregistrement du tonnage

Renseigner :

- Le **chantier** concerné (sélection dans la liste des chantiers autorisés)
- La **plaque** du camion
- Le **transporteur**
- La **référence chantier**
- Le **tonnage** (en tonnes)
- La décision finale : **Accepté** ou **Refusé**
- En cas de refus : le **motif** et un **détail** éventuel

Appuyer sur **Enregistrer le passage**. Le registre est mis à jour instantanément.

---

### 5.2 Consulter le registre du jour

L'onglet **Registre** affiche tous les passages enregistrés, avec la possibilité de filtrer par date. Chaque passage indique la plaque, le chantier, le tonnage, l'heure et le résultat (accepté/refusé).

---

### 5.3 Signaler un incident

En cas de situation anormale (camion refusé, suspicion après déversement, autre) :

1. Aller dans l'onglet **Camions** ou **Registre** → bouton **Signaler un incident**.
2. Sélectionner le **type d'incident** et le **chantier** concerné.
3. Décrire la situation, ajouter une photo si nécessaire.
4. Indiquer si la **zone a été isolée** et si le **client a été informé**.
5. Enregistrer. L'incident apparaît dans le tableau de bord du gestionnaire.

---

## 6. Workflow complet — les 11 étapes

Le tableau suivant résume l'ensemble du processus et les responsabilités de chaque profil.

| Étape | Intitulé | Responsable | Statut dans l'app |
|---|---|---|---|
| 1 | Réception de la demande de prix | Gestionnaire | Demande reçue |
| 2 | Analyse interne (classe, période, logistique) | Gestionnaire | Analyse |
| 3 | Remise de prix + confirmation client | Gestionnaire | Offre envoyée |
| 4 | Demande et réception des documents Walterre | Gestionnaire | Documents demandés |
| 5 | Validation administrative (checklist 5 critères) | Gestionnaire | Validation en cours |
| 5b | Autorisation officielle du chantier | Gestionnaire | **Autorisé** |
| 6.1 | Contrôle administratif à l'arrivée du camion | Préposé | — |
| 6.2 | Contrôle visuel du chargement | Préposé | — |
| 6.3 | Enregistrement du passage (tonnage, photo) | Préposé | En cours |
| 7 | Suivi des tonnages cumulés | Automatique | Volume atteint (si seuil) |
| 8 | Gestion des incidents | Préposé + Gestionnaire | — |
| 9 | Facturation mensuelle | Gestionnaire | — |
| 10 | Clôture du chantier | Gestionnaire | Clôturé |
| 11 | Archivage du dossier | Gestionnaire | Clôturé |

---

## 7. Gestion des incidents

Deux types d'incidents sont prévus dans l'application.

**Cas 1 — Camion refusé :** le motif est enregistré, une photo peut être jointe, et le client peut être marqué comme informé. L'incident reste visible dans le tableau de bord jusqu'à sa résolution.

**Cas 2 — Suspicion après déversement :** l'incident est créé avec indication de l'isolation de la zone. Le dossier est documenté (description, photos) et reste ouvert jusqu'à résolution explicite par le gestionnaire.

Pour **résoudre un incident**, ouvrir son détail depuis l'onglet Registre ou le tableau de bord → appuyer sur **Marquer comme résolu**.

---

## 8. Facturation et clôture

### Facturation mensuelle

À la fin de chaque mois, le gestionnaire consulte le détail de chaque chantier actif. Le tonnage accepté cumulé est affiché dans la section **Suivi des tonnages**. Ce chiffre constitue la base de facturation (tonnage réel accepté × prix à la tonne convenu dans l'offre).

L'extrait du registre (onglet **Registre**, filtré par chantier et par mois) peut servir de pièce justificative jointe à la facture.

### Clôture d'un chantier

Un chantier peut être clôturé de deux façons :

- **Automatiquement** : lorsque le tonnage accepté atteint le volume déclaré, le statut passe à "Volume atteint". Le gestionnaire finalise la clôture manuellement.
- **Manuellement** : depuis le détail du chantier → bouton **Clôturer le chantier** (disponible pour les chantiers autorisés ou en cours).

Une fois clôturé, le dossier reste consultable en lecture seule dans l'onglet Chantiers (filtre "Clôturés").

---

## 9. Accès client — perspectives

La question de rendre l'application accessible aux clients est pertinente. Voici les options envisageables selon le niveau d'investissement souhaité.

| Option | Description | Avantages | Prérequis |
|---|---|---|---|
| **Vue lecture seule** | Le client reçoit un lien vers une page web affichant uniquement son dossier (statut, tonnage consommé, passages) | Simple, pas de compte à gérer | Développement d'une vue client dédiée |
| **Portail client web** | Un espace web séparé où le client peut soumettre une demande de prix, suivre son dossier et confirmer l'offre | Automatise la réception des demandes | Nécessite un site web + authentification |
| **Accès app complet** | Le client télécharge l'app avec un rôle "Client" limité à son propre dossier | Interface unifiée | Gestion des comptes et permissions |

> **Recommandation :** la solution la plus rapide à mettre en place est la **vue lecture seule via lien web**, qui permet au client de suivre l'avancement de son dossier sans aucune installation. Le portail client complet (formulaire de demande en ligne) nécessite la création d'un site web dédié, qui peut être développé dans une prochaine étape.

---

## 10. Points critiques à retenir

Ces trois règles fondamentales sont rappelées dans les spécifications du processus et doivent être respectées en toutes circonstances.

> **1. Aucun camion sans validation écrite.** Un chantier doit impérativement être au statut "Autorisé" dans l'application avant qu'un seul camion puisse être accepté sur le site. Le préposé voit ce statut en temps réel.

> **2. Registre tenu en temps réel.** Chaque passage de camion — accepté ou refusé — doit être enregistré immédiatement dans l'application par le préposé. Aucun enregistrement différé.

> **3. Refus assumé sans discussion.** En cas de non-conformité visuelle ou administrative, le refus est enregistré avec son motif et sa photo. Le client est informé. Il n'y a pas de dérogation possible sur le terrain.

---

*Document généré le 24 février 2026 — Application SiteVerseur v1.0*
