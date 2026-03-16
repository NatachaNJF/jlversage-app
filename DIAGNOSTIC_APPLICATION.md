# Diagnostic complet — Application SiteVerseur
**Date du diagnostic :** 12 mars 2026  
**Environnement testé :** Serveur local (dev) + Production Railway  
**Méthode :** Lecture du code source écran par écran + tests des endpoints tRPC + navigation dans l'interface web

---

## 1. État général de l'infrastructure

| Composant | État | Détail |
|-----------|------|--------|
| Serveur local (dev) | ✅ Fonctionnel | Port 3000, répond correctement |
| App web locale | ✅ Fonctionnel | https://8081-ikl8cpd0qks4xjqplb4qe-a9650aa5.us2.manus.computer |
| Serveur Railway (production) | ⚠️ Partiellement | API répond, mais page web retourne "Not Found" |
| Base de données (locale dev) | ✅ Fonctionnel | PostgreSQL via Drizzle ORM |
| Base de données (Railway prod) | ⚠️ Problème | La table `fermetures` génère une erreur SQL MySQL (backticks) |
| GitHub (déploiement) | ✅ Commité | Dernier push : 12 mars 2026 |
| APK Android disponible | ⚠️ Obsolète | Version 1.0.4 pointe vers ancienne URL Railway (MySQL) |

**Problème critique de déploiement :** Le serveur Railway ne sert pas les fichiers statiques (`web-dist`). La route `/` retourne "Not Found". L'API fonctionne mais l'interface web est inaccessible en production.

**Problème de base de données :** La route `fermetures.list` génère une erreur SQL avec syntaxe MySQL (backticks) sur le serveur local. Cela indique que la table `fermetures` n'existe pas encore dans la base de données locale, et que Drizzle utilise le mauvais driver.

---

## 2. Diagnostic écran par écran

### 2.1 Écran de connexion (`app/login.tsx`)

| Critère | État |
|---------|------|
| Lit la base | Non (formulaire local) |
| Écrit en base | Via `auth.login` (tRPC) |
| Fonctionne en local | ✅ Oui |
| Fonctionne en production | ❌ Non — Railway retourne "Not Found" |

**Problème :** L'adresse email affichée en bas de l'écran (`jlversage@erouville.be`) est encore l'ancienne version dans l'APK 1.0.4. Corrigée dans le code source mais pas encore dans l'APK publié.

**Problème connexion Jessica :** Le compte `jessica.henrion@jerouville.be` a `loginMethod = "microsoft"` — elle n'a pas de mot de passe défini. Elle ne peut donc pas se connecter avec email + mot de passe.

---

### 2.2 Tableau de bord (`app/(tabs)/index.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.list`, `incidents.list`, `stats.jour` |
| Écrit en base | Non |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |
| Fonctionne en production | ❌ Non — page inaccessible |

**Routes utilisées :**
- `trpc.chantiers.list` → ✅ Fonctionnel (2 chantiers en base)
- `trpc.incidents.list` → ✅ Fonctionnel (0 incidents)
- `trpc.stats.jour` → ✅ Fonctionnel (retourne totalCamions, acceptes, refuses, incidentsOuverts)

---

### 2.3 Onglet Chantiers (`app/(tabs)/chantiers.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.list` |
| Écrit en base | Non |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui — 2 chantiers affichés |
| Fonctionne en production | ❌ Non — page inaccessible |

**Filtres disponibles :** Tous, Demande, Offre, Validation, Autorisé, En cours, Vol. atteint, Refusé, Clôturé.

---

### 2.4 Détail d'un chantier (`app/chantier/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get`, `passages.listByChantier` |
| Écrit en base | ✅ Oui — `chantiers.update`, `chantiers.autoriser`, `chantiers.refuserAdmin`, `chantiers.cloturer`, `chantiers.delete`, `chantiers.confirmerAccordClient`, `chantiers.mettreAJourOffreOdoo` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |
| Fonctionne en production | ❌ Non — page inaccessible |

**Problème critique — Bouton "Passer en analyse" :** Le bouton utilise `window.confirm()` sur web. Le navigateur bloque `window.confirm()` dans les iframes et certains contextes. En pratique, sur le serveur local, le bouton fonctionne **uniquement si `window.confirm` n'est pas bloqué**. Sur mobile natif, `Alert.alert` est utilisé à la place.

**Workflow statuts :** Demande → Analyse → Offre → Documents → Validation → Autorisé → En cours → Clôturé / Refusé.

---

### 2.5 Nouveau chantier (`app/chantier/nouveau.tsx`)

| Critère | État |
|---------|------|
| Lit la base | Non |
| Écrit en base | ✅ Oui — `chantiers.create` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.6 Modifier un chantier (`app/chantier/modifier/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get` |
| Écrit en base | ✅ Oui — `chantiers.update` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.7 Page Analyse — Phase 1 Capacité (`app/chantier/prevalidation/[id].tsx` — étape 1)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get`, `fermetures.list` |
| Écrit en base | ✅ Oui — `chantiers.refuserCapacite` (si refus) |
| AsyncStorage | Non |
| Fonctionne en local | ⚠️ Partiellement — s'affiche mais `fermetures.list` retourne erreur 500 |
| Fonctionne en production | ❌ Non — page inaccessible |

**Problème :** La section "Versages déjà prévus" s'affiche correctement. Mais la section "Jours de fermeture" ne charge pas car `fermetures.list` échoue avec une erreur SQL MySQL (la table `fermetures` n'existe pas ou le driver est incorrect).

**Ce qui fonctionne :** Les 2 boutons (Refuser / Capacité OK) sont présents et naviguent correctement.

---

### 2.8 Page Analyse — Phase 2 Finances & Offre (`app/chantier/prevalidation/[id].tsx` — étape 2)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get` |
| Écrit en base | ✅ Oui — `chantiers.terminerAnalyse` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui — interface correcte |
| Fonctionne en production | ❌ Non — page inaccessible |

**Ce qui est présent :**
- Choix "Finances saines" / "Finances non saines"
- Commentaire optionnel
- Case à cocher "Offre de prix envoyée dans Odoo"
- Bouton "Terminer l'analyse" (grisé si aucun choix finances)
- Bouton "Retour étape 1"

**Ce qui manque :** Le bouton "Terminer l'analyse" n'est pas visible dans le viewport (il est peut-être coupé en bas). À vérifier sur mobile.

---

### 2.9 Page Documents (`app/chantier/documents/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get`, `transporteurs.list` |
| Écrit en base | Non (mutations non définies dans ce fichier) |
| AsyncStorage | Non |
| Fonctionne en local | ⚠️ À vérifier |

---

### 2.10 Page Validation (`app/chantier/validation/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get` |
| Écrit en base | ✅ Oui — `chantiers.autoriser` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.11 Page Offre (`app/chantier/offre/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.get` |
| Écrit en base | Non (mutations non définies) |
| AsyncStorage | Non |
| Statut | ⚠️ Cette page existe encore dans le code mais n'est plus utilisée dans le workflow |

**Note :** Cette page devrait être supprimée ou redirigée. Elle n'est plus référencée depuis le détail chantier mais le fichier existe encore.

---

### 2.12 Onglet Camions (`app/(tabs)/camions.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `passages.listByDate`, `chantiers.list` |
| Écrit en base | Non |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.13 Nouveau passage / camion (`app/camion/nouveau.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.list` |
| Écrit en base | ✅ Oui — `passages.create` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.14 Détail d'un passage (`app/passage/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `passages.get` |
| Écrit en base | Non |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.15 Onglet Registre (`app/(tabs)/registre.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `passages.listByPeriod` |
| Écrit en base | Non |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

**Filtres disponibles :** Aujourd'hui, Cette semaine, Ce mois, Date libre. Filtre accepté/refusé.

---

### 2.16 Onglet Facturation (`app/(tabs)/facturation.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.list`, `stats.facturation` |
| Écrit en base | Non |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.17 Incident — Nouveau (`app/incident/nouveau.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `chantiers.list` |
| Écrit en base | ✅ Oui — `incidents.create` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.18 Incident — Détail (`app/incident/[id].tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `incidents.get` |
| Écrit en base | Non (mutations non définies) |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.19 Fermetures / Congés (`app/fermetures.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `fermetures.list` |
| Écrit en base | ✅ Oui — `fermetures.create`, `fermetures.delete` |
| AsyncStorage | Non |
| Fonctionne en local | ❌ Non — erreur 500 sur `fermetures.list` |
| Fonctionne en production | ❌ Non — page inaccessible + même erreur |

**Cause de l'erreur :** La requête SQL générée utilise la syntaxe MySQL (backticks `` ` ``) : `select \`id\`, \`dateDebut\`... from \`fermetures\``. Cela indique que la table `fermetures` n'existe pas dans la base de données locale, ou que le driver Drizzle utilise MySQL au lieu de PostgreSQL pour cette table.

---

### 2.20 Transporteurs (`app/transporteur/index.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `transporteurs.list` |
| Écrit en base | ✅ Oui — `transporteurs.create`, `transporteurs.update`, `transporteurs.delete` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

### 2.21 Utilisateurs (`app/(tabs)/utilisateurs.tsx`)

| Critère | État |
|---------|------|
| Lit la base | ✅ Oui — `users.list` |
| Écrit en base | ✅ Oui — `users.create`, `users.delete` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui — 5 utilisateurs en base |

---

### 2.22 Paramètres (`app/(tabs)/parametres.tsx`)

| Critère | État |
|---------|------|
| Lit la base | Non |
| Écrit en base | Via `auth.logout` |
| AsyncStorage | Non |
| Fonctionne en local | ✅ Oui |

---

## 3. Synthèse — Ce qui fonctionne vs ce qui ne fonctionne pas

### Ce qui fonctionne (en local)

- Connexion admin (`admin@jlversage.be`)
- Liste et détail des chantiers
- Création / modification de chantiers
- Passage en analyse (bouton "Passer en analyse")
- Page analyse Phase 1 (Capacité) — sauf les jours de fermeture
- Page analyse Phase 2 (Finances + Offre Odoo) — interface présente
- Saisie des passages (camions)
- Registre des passages avec filtres
- Facturation par chantier
- Incidents (création)
- Transporteurs (CRUD complet)
- Utilisateurs (liste, création, suppression)
- Déconnexion

### Ce qui ne fonctionne pas

| Problème | Cause | Priorité |
|----------|-------|----------|
| App web en production inaccessible | `web-dist` non servi par Railway | 🔴 Critique |
| `fermetures.list` erreur 500 | Table `fermetures` absente ou driver MySQL | 🔴 Critique |
| Connexion Jessica impossible | `loginMethod = "microsoft"`, pas de mot de passe | 🔴 Critique |
| APK 1.0.4 pointe vers ancienne URL (MySQL) | URL codée en dur dans l'ancien bundle | 🔴 Critique |
| Adresse email erronée dans APK 1.0.4 | `erouville.be` au lieu de `jerouville.be` | 🟡 Moyen |
| Page `offre/[id].tsx` encore présente | Fichier non supprimé après refonte | 🟢 Mineur |
| Bouton "Terminer l'analyse" coupé | Scroll nécessaire sur petits écrans | 🟡 Moyen |
| Envoi d'emails | SMTP non configuré (pas de `SMTP_PASS`) | 🟡 Moyen |

### Utilisation de la base de données

**Aucun écran n'utilise AsyncStorage** — tous les écrans lisent et écrivent via tRPC → PostgreSQL. C'est cohérent et correct.

**PostgreSQL fonctionne** pour toutes les tables sauf `fermetures` (erreur SQL MySQL).

---

## 4. Problème de déploiement Railway — Analyse détaillée

Le serveur Railway répond sur l'API (`/api/trpc/*`) mais retourne "Not Found" sur la route `/`. Le Dockerfile contient bien `COPY web-dist ./web-dist`, et le code source contient bien le dossier `web-dist` dans git.

**Hypothèse principale :** Railway reconstruit l'image Docker depuis le dernier commit GitHub, mais le build prend du temps. Le dernier push date du 12 mars 2026 à 15h30 environ. Si Railway n'a pas encore terminé le redéploiement, l'ancienne version (sans `web-dist`) tourne encore.

**Solution à tester :** Forcer un redéploiement manuel depuis le dashboard Railway, ou attendre la fin du build automatique.

---

## 5. Problème de la table `fermetures` — Analyse détaillée

L'erreur retournée est :
```
Failed query: select `id`, `dateDebut`, `dateFin`, `motif`, `createdAt` from `fermetures` order by `fermetures`.`dateDebut`
```

Les backticks (`` ` ``) sont la syntaxe MySQL, pas PostgreSQL. Cela signifie que Drizzle utilise le driver MySQL pour cette table. La cause probable est que la migration SQL qui crée la table `fermetures` n'a pas été exécutée, ou que la connexion à la base utilise le mauvais driver.

**À vérifier :** La fonction `runMigrations()` dans `server/db.ts` crée-t-elle bien la table `fermetures` ?

---

## 6. Recommandations (à valider avant correction)

1. **Priorité 1 — Déploiement Railway :** Forcer un redéploiement manuel depuis le dashboard Railway
2. **Priorité 2 — Table fermetures :** Vérifier `runMigrations()` et créer la table `fermetures` si absente
3. **Priorité 3 — Connexion Jessica :** Définir un mot de passe pour jessica.henrion@jerouville.be
4. **Priorité 4 — APK :** Publier la version 1.0.5 (déjà construite) pour remplacer la 1.0.4
5. **Priorité 5 — SMTP :** Configurer `SMTP_PASS` sur Railway pour activer les emails
6. **Priorité 6 — Nettoyage :** Supprimer `app/chantier/offre/[id].tsx` devenu inutile

---

*Diagnostic réalisé le 12 mars 2026 — Aucune modification apportée au code source.*
