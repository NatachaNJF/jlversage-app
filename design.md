# Design — SiteVerseur : Suivi des Terres

## Concept général

Application mobile de gestion et de suivi du versage des terres pour un site verseur (Transinne). Deux profils utilisateurs : **Gestionnaire** (bureau, gestion administrative et commerciale) et **Préposé** (sur site, contrôle des camions en temps réel).

---

## Palette de couleurs

| Rôle | Couleur | Hex |
|------|---------|-----|
| Primaire (terre/brun) | Brun terreux | `#7C5C3E` |
| Secondaire (vert site) | Vert forêt | `#3A6B35` |
| Fond | Blanc cassé | `#F8F5F0` |
| Surface | Blanc | `#FFFFFF` |
| Texte principal | Gris foncé | `#1C1C1E` |
| Texte secondaire | Gris moyen | `#6B6B6B` |
| Bordure | Gris clair | `#E0D9D0` |
| Succès | Vert | `#22C55E` |
| Avertissement | Amber | `#F59E0B` |
| Erreur/Refus | Rouge | `#EF4444` |
| Autorisé | Vert foncé | `#16A34A` |

---

## Liste des écrans

### Navigation principale (Tab Bar)

| Onglet | Icône | Profil |
|--------|-------|--------|
| Tableau de bord | `chart.bar.fill` | Gestionnaire |
| Chantiers | `folder.fill` | Gestionnaire |
| Camions | `truck.box.fill` | Préposé |
| Registre | `list.bullet.clipboard.fill` | Préposé |
| Paramètres | `gearshape.fill` | Tous |

---

### Écrans Gestionnaire

1. **Tableau de bord** — Vue synthétique : chantiers actifs, tonnages du jour, alertes en cours
2. **Liste des chantiers** — Tous les chantiers avec statut (En attente, Autorisé, En cours, Clôturé)
3. **Nouveau chantier / Demande de prix** — Formulaire : société cliente, localisation, volume, classe, période
4. **Détail chantier** — Infos complètes, documents Walterre, historique camions, tonnage cumulé vs annoncé
5. **Validation administrative** — Checklist : classe ≤ 2, certificat valide, rapport cohérent, régime compatible
6. **Remise de prix** — Prix/tonne, conditions, envoi confirmation
7. **Documents Walterre** — Upload et visualisation : certificat, rapport d'analyse, référence chantier
8. **Suivi des tonnages** — Graphique et tableau par chantier, alerte volume atteint
9. **Facturation** — Récapitulatif mensuel par chantier, tonnage accepté, montant

### Écrans Préposé

10. **Arrivée camion** — Formulaire rapide : bon Walterre, référence chantier, plaque, transporteur
11. **Contrôle visuel** — Checklist refus (déchets, gravats, plastique, odeur, couleur) + photo
12. **Enregistrement camion** — Date/heure auto, tonnage, accepté/refusé, motif, photo
13. **Registre du jour** — Liste des passages du jour avec statuts

### Écrans communs

14. **Incidents** — Liste et création d'incidents (camion refusé, suspicion post-déversement)
15. **Paramètres / Profil** — Choix du rôle, informations site, préférences

---

## Flux utilisateur principaux

### Flux Gestionnaire — Nouveau chantier

```
Tableau de bord → "+" Nouveau chantier
→ Formulaire demande de prix (société, localisation, volume, classe, période)
→ Analyse interne (classe ≤ 2 ? période OK ? logistique ?)
→ Remise de prix (prix/tonne, conditions)
→ Confirmation client
→ Demande documents Walterre (référence, certificat, rapport, volume, régime, transporteurs)
→ Validation administrative (checklist 5 points)
→ Statut = AUTORISÉ → notification préposé
```

### Flux Préposé — Arrivée camion

```
Onglet "Camions" → "Nouveau camion"
→ Contrôle administratif (bon Walterre, référence, plaque, correspondance chantier)
→ Contrôle visuel (checklist + photo)
→ Enregistrement (tonnage, accepté/refusé, motif si refus)
→ Registre mis à jour automatiquement
→ Si refus → incident créé + client notifié
→ Si volume atteint → chantier bloqué + client notifié
```

---

## Principes de design

- **Lisibilité terrain** : grandes zones tactiles (min 48px), texte lisible en plein soleil
- **Statuts visuels clairs** : badges colorés (AUTORISÉ = vert, EN ATTENTE = amber, REFUSÉ = rouge, CLÔTURÉ = gris)
- **Formulaires progressifs** : étapes numérotées pour les flux longs
- **Feedback immédiat** : confirmation visuelle après chaque action critique
- **Mode hors-ligne** : enregistrements locaux avec sync différée (AsyncStorage)
