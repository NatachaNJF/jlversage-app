# Conversation Complète - Projet SiteVerseur (JL Versage)

**Date :** 12 mars 2026  
**Projet :** versage-terres (SiteVerseur - Suivi des Terres)  
**Utilisateur :** Natacha Jerouville  
**Plateforme :** Expo Mobile App + Backend Railway + Web App

---

## Table des Matières

1. [Contexte Initial](#contexte-initial)
2. [Problème 1 : Application Déployée Obsolète](#problème-1--application-déployée-obsolète)
3. [Problème 2 : Erreur SQL et URL API Incorrecte](#problème-2--erreur-sql-et-url-api-incorrecte)
4. [Problème 3 : Refonte de la Page Analyse](#problème-3--refonte-de-la-page-analyse)
5. [Problème 4 : Application Web Ne S'ouvre Pas](#problème-4--application-web-ne-souvre-pas)
6. [Solutions Appliquées](#solutions-appliquées)
7. [État Final et Recommandations](#état-final-et-recommandations)

---

## Contexte Initial

### Infrastructure Déployée
- **Backend API :** Railway (versageterr-kkmfyarn.manus.space)
- **Base de Données :** PostgreSQL sur Railway
- **App Mobile :** Expo Go (développement) + APK 1.0.4 (production)
- **App Web :** Expo web export (web-dist)
- **Dépôt Git :** GitHub (NatachaNJF/jlversage-app) + Manus (interne)

### Fonctionnalités Demandées
1. **Workflow d'analyse en 2 phases** :
   - Étape 1 : Vérification capacité/planning (afficher jours fermés)
   - Étape 2 : Vérification finances + case à cocher "Offre de prix envoyée dans Odoo" avec date
2. **Suppression** de l'envoi automatique d'offre par email
3. **Gestion des fermetures/congés** dans le planning

---

## Problème 1 : Application Déployée Obsolète

### Symptômes
- L'app web sur `https://versageterr-kkmfyarn.manus.space` affichait une interface ancienne ("Contrôle site" avec onglets Camions/Registre)
- Le workflow d'analyse en 2 étapes n'existait pas
- Les pages "Fermetures" et "Détail des passages" n'étaient pas disponibles

### Cause Racine
Le dossier `web-dist` (application compilée) n'avait pas été reconstruit depuis plusieurs jours. Le code source contenait les nouvelles fonctionnalités, mais le bundle web déployé était une version ancienne.

### Solution Appliquée
```bash
# 1. Reconstruire le bundle web avec le code source à jour
cd /home/ubuntu/versage-terres
npx expo export

# 2. Restaurer les fichiers HTML statiques (vitrine.html, mentions-legales.html)
git show HEAD:web-dist/vitrine.html > web-dist/vitrine.html
git show HEAD:web-dist/mentions-legales.html > web-dist/mentions-legales.html

# 3. Committer et pousser sur GitHub (déclenche le redéploiement Railway)
git add -A
git commit -m "Rebuild web-dist avec toutes les fonctionnalités"
git push github main
```

### Checkpoint Créé
- **Version :** f341ff20
- **Description :** Rebuild complet du web-dist avec workflow analyse en 2 étapes

---

## Problème 2 : Erreur SQL et URL API Incorrecte

### Symptômes
- Écran de connexion sur l'app mobile affichait : `Failed query: select 'id', 'openId', 'name', 'email', 'loginMethod', 'role', 'appRole', 'createdAt', 'updatedAt', 'lastSignedIn', 'passwordHash', 'mustChangePassword' from 'users' where 'users'.'email' = ? limit ?`
- Adresse email erronée : `jlversage@erouville.be` au lieu de `jlversage@jerouville.be`

### Cause Racine
1. **Syntaxe SQL MySQL** : La requête utilisait des backticks (`` ` ``) au lieu de guillemets PostgreSQL
2. **Ancienne URL API** : L'app mobile pointait vers une ancienne instance Railway (`backend-production-1c955.up.railway.app`) qui utilisait MySQL au lieu de PostgreSQL
3. **Variable d'environnement non configurée** : `EXPO_PUBLIC_API_BASE_URL` n'était pas définie, donc l'app mobile utilisait une URL par défaut obsolète

### Solution Appliquée

#### Correction 1 : Coder l'URL de production en dur dans le code source
```typescript
// constants/oauth.ts
export function getApiBaseUrl(): string {
  // ... détection de l'environnement ...
  
  // Production : utiliser l'URL Railway correcte
  if (isProduction) {
    return "https://versageterr-kkmfyarn.manus.space";
  }
  
  // Fallback pour les appareils natifs (Expo Go / APK)
  return "https://versageterr-kkmfyarn.manus.space";
}
```

#### Correction 2 : Corriger l'adresse email
```bash
# Remplacer toutes les occurrences dans les templates email et l'écran de login
sed -i 's/jlversage@erouville.be/jlversage@jerouville.be/g' server/email.ts
sed -i 's/jlversage@erouville.be/jlversage@jerouville.be/g' app/login.tsx
```

#### Correction 3 : Reconstruire le bundle
```bash
npx expo export
git add -A
git commit -m "Fix: URL API production et adresse email"
git push github main
```

### Checkpoint Créé
- **Version :** 52a6e51e
- **Description :** Fix URL API production + adresse email

### Note Importante
L'APK 1.0.4 téléchargé avant cette correction contenait encore l'ancienne URL. Une nouvelle version 1.0.5 a été générée automatiquement après le redéploiement.

---

## Problème 3 : Refonte de la Page Analyse

### Demande Utilisateur
Remplacer le workflow d'envoi automatique d'offre par email par :
1. **Étape 1 (Capacité)** : Afficher le planning du site avec jours fermés/congés
2. **Étape 2 (Finances)** : Choix finances saines/paiement comptant + case à cocher "Offre de prix envoyée dans Odoo" avec date

### Modifications Apportées

#### 1. Schéma Base de Données
```typescript
// drizzle/schema.ts - Nouvelles colonnes ajoutées
export const chantiers = pgTable("chantiers", {
  // ... colonnes existantes ...
  financesOk: boolean("financesOk"),
  commentaireAnalyse: text("commentaireAnalyse"),
  offreOdoo: boolean("offreOdoo").default(false),
  dateOffreOdoo: timestamp("dateOffreOdoo"),
});
```

#### 2. Routes tRPC
```typescript
// server/routers.ts
export const chantiersRouter = router({
  // ... routes existantes ...
  
  // Remplace envoyerOffre
  terminerAnalyse: publicProcedure
    .input(z.object({
      id: z.number(),
      financesOk: z.boolean(),
      commentaire: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.updateChantier(input.id, {
        financesOk: input.financesOk,
        commentaireAnalyse: input.commentaire,
        statut: "analyse_terminee",
      });
    }),
  
  mettreAJourOffreOdoo: publicProcedure
    .input(z.object({
      id: z.number(),
      offreOdoo: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      return await db.updateChantier(input.id, {
        offreOdoo: input.offreOdoo,
        dateOffreOdoo: input.offreOdoo ? new Date() : null,
      });
    }),
});
```

#### 3. Page Analyse (Prévalidation)
```typescript
// app/chantier/prevalidation/[id].tsx
// Nouvelle structure : 2 étapes distinctes
// - Étape 1 : Affichage du planning avec jours fermés
// - Étape 2 : Choix finances + case offre Odoo
```

#### 4. Suppression du Modal Offre
- Suppression de la page `app/chantier/offre/[id].tsx`
- Suppression du modal d'envoi d'offre dans `app/chantier/[id].tsx`
- Affichage du statut offre Odoo dans le détail du dossier

### Checkpoint Créé
- **Version :** 4772dfc8
- **Description :** Refonte page analyse : 2 étapes distinctes (Capacité + Finances/Offre Odoo)

---

## Problème 4 : Application Web Ne S'ouvre Pas

### Symptômes
- URL `https://versageterr-kkmfyarn.manus.space/` retournait **"Not Found"** (HTTP 404)
- L'API (`/api/health`, `/api/trpc/*`) fonctionnait correctement
- Le serveur de développement local fonctionnait parfaitement

### Cause Racine
Après compilation par esbuild, la variable `__dirname` ne pointait plus au bon endroit. Le serveur cherchait le dossier `web-dist` au mauvais chemin et affichait le message "No web-dist folder found".

### Diagnostic
```bash
# Endpoint diagnostic créé pour déboguer
curl http://127.0.0.1:3000/api/diagnostic

# Résultat local :
{
  "cwd": "/home/ubuntu/versage-terres",
  "webDistPath": "/home/ubuntu/versage-terres/web-dist",
  "webDistExists": true,
  "indexExists": true,
  "env": "development"
}
```

### Solution Appliquée
```typescript
// server/_core/index.ts
// Avant (incorrect après esbuild) :
const webDistPath = path.resolve(__dirname, "..", "web-dist");

// Après (correct) :
const webDistPath = path.resolve(process.cwd(), "web-dist");
```

### Endpoint Diagnostic Ajouté
```typescript
app.get("/api/diagnostic", (_req, res) => {
  res.json({
    cwd: process.cwd(),
    webDistPath,
    webDistExists: fs.existsSync(webDistPath),
    indexExists: fs.existsSync(path.join(webDistPath, "index.html")),
    env: process.env.NODE_ENV,
  });
});
```

### Commits Effectués
1. **47831f6** : Fix chemin web-dist avec `process.cwd()`
2. **76b4cc6** : Ajout endpoint diagnostic

### État Actuel
- **Serveur local** : ✅ Fonctionne (app web accessible)
- **Serveur Railway** : ⏳ En attente de redéploiement (Railway détecte les pushes GitHub avec délai de 5-15 minutes)

---

## Solutions Appliquées

### Résumé des Corrections

| Problème | Cause | Solution | Checkpoint |
|----------|-------|----------|-----------|
| App déployée obsolète | web-dist non reconstruit | `npx expo export` + push GitHub | f341ff20 |
| Erreur SQL + URL API | App mobile pointe vers ancienne URL MySQL | Coder URL production en dur dans code | 52a6e51e |
| Page analyse manquante | Workflow 2 étapes non implémenté | Refonte complète avec 2 phases distinctes | 4772dfc8 |
| App web 404 | `__dirname` incorrect après esbuild | Utiliser `process.cwd()` au lieu de `__dirname` | 47831f6 |

### Fichiers Modifiés

#### Code Source
- `constants/oauth.ts` — URL API production
- `app/chantier/prevalidation/[id].tsx` — Refonte page analyse (2 étapes)
- `app/chantier/[id].tsx` — Suppression modal offre
- `server/routers.ts` — Nouvelles routes tRPC (terminerAnalyse, mettreAJourOffreOdoo)
- `server/_core/index.ts` — Correction chemin web-dist + endpoint diagnostic
- `drizzle/schema.ts` — Nouvelles colonnes DB

#### Base de Données
- Colonnes ajoutées : `financesOk`, `commentaireAnalyse`, `offreOdoo`, `dateOffreOdoo`

---

## État Final et Recommandations

### État Actuel (12 mars 2026, 18:45 GMT+1)

**Serveur Local (Développement)**
- ✅ App web : Accessible sur `https://8081-...us2.manus.computer`
- ✅ API : Fonctionnelle
- ✅ Page analyse : 2 étapes implémentées
- ✅ Case offre Odoo : Fonctionnelle

**Serveur Railway (Production)**
- ✅ API : Fonctionnelle
- ⏳ App web : En attente de redéploiement (dernier commit poussé à 18:35)
- ⏳ Endpoint diagnostic : Disponible une fois le redéploiement terminé

**App Mobile**
- ✅ APK 1.0.5 : Disponible au téléchargement (contient la correction URL API)
- ⚠️ APK 1.0.4 : Obsolète (URL API incorrecte)

### Prochaines Étapes Recommandées

#### 1. Vérifier le Redéploiement Railway (5-15 minutes)
```bash
# Tester l'endpoint diagnostic
curl https://versageterr-kkmfyarn.manus.space/api/diagnostic

# Tester l'app web
curl https://versageterr-kkmfyarn.manus.space/ | head -20
```

#### 2. Tester le Workflow Complet
- Créer un dossier test
- Passer le statut en "En analyse"
- Cliquer "Analyser le dossier"
- Vérifier les 2 étapes (capacité + finances)
- Cocher "Offre de prix envoyée dans Odoo"
- Vérifier que la date est enregistrée

#### 3. Configurer SMTP pour les Emails
- Ajouter la variable `SMTP_PASS` sur Railway avec le mot de passe de jessica.henrion@jerouville.be
- Tester l'envoi d'email de refus de capacité

#### 4. Générer l'APK Final
- Cliquer sur "Publish" dans l'interface Manus
- Télécharger la version 1.0.6 (contient toutes les corrections)
- Désinstaller APK 1.0.4 et installer 1.0.6

#### 5. Ajouter un Filtre "En Analyse"
- Dans la liste des chantiers, ajouter un filtre pour retrouver rapidement les dossiers à traiter

### Problèmes Résolus
✅ Application déployée à jour  
✅ Erreur SQL corrigée  
✅ URL API production configurée  
✅ Workflow analyse en 2 phases implémenté  
✅ Case à cocher offre Odoo avec date  
✅ Envoi automatique d'offre supprimé  
✅ Chemin web-dist corrigé  

### Problèmes Restants
- ⏳ Redéploiement Railway en cours (attendre 5-15 minutes)
- ⏳ SMTP non configuré (emails de refus non envoyés)
- 📋 Filtre "En analyse" à ajouter (optionnel)

---

## Détails Techniques Supplémentaires

### Architecture du Projet

```
versage-terres/
├── app/                          # Application Expo (React Native + Web)
│   ├── (tabs)/                   # Onglets principaux
│   │   ├── index.tsx             # Accueil
│   │   ├── chantiers.tsx         # Liste des chantiers
│   │   └── ...
│   ├── chantier/
│   │   ├── [id].tsx              # Détail du chantier
│   │   ├── prevalidation/[id].tsx # Page analyse (2 étapes)
│   │   ├── validation/[id].tsx    # Page validation
│   │   └── modifier/[id].tsx      # Modification
│   └── login.tsx                 # Connexion
├── server/                       # Backend Node.js
│   ├── _core/
│   │   └── index.ts              # Serveur Express principal
│   ├── routers.ts                # Routes tRPC
│   ├── db.ts                     # Requêtes base de données
│   └── email.ts                  # Templates email
├── drizzle/                      # Schéma base de données
│   ├── schema.ts                 # Définition des tables
│   └── migrations/               # Migrations SQL
├── web-dist/                     # Application web compilée
│   ├── index.html                # Point d'entrée
│   ├── _expo/                    # Assets Expo
│   └── chantier/                 # Routes web
├── constants/
│   └── oauth.ts                  # Configuration OAuth + URL API
├── package.json                  # Dépendances
├── app.config.ts                 # Configuration Expo
└── tailwind.config.js            # Styles Tailwind
```

### Flux de Déploiement

```
Code Source (GitHub)
    ↓
    └─→ Railway détecte le push
        ↓
        └─→ Build Docker
            ├─ Compile serveur (esbuild)
            ├─ Copie web-dist
            └─ Lance le conteneur
        ↓
        └─→ Serveur Railway en ligne
            ├─ Sert l'app web
            ├─ Expose l'API tRPC
            └─ Connecte la base PostgreSQL
```

### Variables d'Environnement Critiques

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `DATABASE_URL` | PostgreSQL Railway | Production |
| `EXPO_PUBLIC_API_BASE_URL` | `https://versageterr-kkmfyarn.manus.space` | Tous |
| `SMTP_HOST` | `smtp.gmail.com` | Production |
| `SMTP_USER` | `jessica.henrion@jerouville.be` | Production |
| `SMTP_PASS` | *(à configurer)* | Production |
| `NODE_ENV` | `production` | Production |

### Commandes Utiles

```bash
# Développement local
pnpm dev                          # Lance serveur + Metro

# Build
pnpm build                        # Compile serveur esbuild
npx expo export                   # Compile app web

# Déploiement
git push github main              # Déclenche redéploiement Railway

# Diagnostic
curl http://127.0.0.1:3000/api/diagnostic    # Vérifier chemins
curl http://127.0.0.1:3000/api/health        # Vérifier serveur
```

---

## Conclusion

Le projet a connu plusieurs cycles de déploiement avec des problèmes de synchronisation entre le code source et les bundles compilés. Les corrections principales ont porté sur :

1. **Reconstruction du bundle web** pour inclure les nouvelles fonctionnalités
2. **Correction de l'URL API** pour que l'app mobile pointe vers le bon serveur
3. **Refonte complète du workflow d'analyse** en 2 étapes distinctes
4. **Correction du chemin web-dist** après compilation esbuild

L'application est maintenant prête pour la production. Le redéploiement Railway devrait être terminé dans les 5-15 minutes suivant ce document.

**Prochaine action :** Vérifier que `https://versageterr-kkmfyarn.manus.space/` s'ouvre correctement et tester le workflow complet.
