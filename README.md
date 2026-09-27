# LinkUp — Plateforme Mobile de Tutorat entre Pairs 🎓

Application mobile React Native / Expo d'entraide scolaire entre élèves de la 6e à la Terminale, rémunérée en **crédits réciproques** de temps plutôt qu'en argent.

---

## 📱 Fonctionnalités Principales (MVP)

1. **Inscription simple & Profils élèves** :
   - Prénom, nom, âge, classe (de la 6e à la Terminale) et établissement scolaire.
   - Choix d'objectif : *J'ai besoin d'aide*, *Je veux aider*, ou *Les deux*.
   - Sélecteur de profil instantané en haut à droite pour tester et simuler les interactions entre plusieurs élèves (Lucas en 2nde, Sarah en 3e, Thomas en Tle, Emma en 4e).

2. **Système de Quiz de vérification de niveau** :
   - Pour devenir aidant sur une matière, l'élève valide un quiz de 3 questions portant sur le niveau immédiatement inférieur à sa classe (ex: élève de 2nde testé sur le niveau 3e).
   - Seuil de validation : 2/3 bonnes réponses minimum.
   - Banque de questions interactive avec explications pédagogiques instantanées.

3. **Demandes d'entraide ciblées** :
   - Sélection de matière et rubrique (avec option *Autre* et champ libre).
   - Format au choix : *Message écrit* ou *Appel vidéo* (Meet, WhatsApp, Jitsi).
   - Option *Présentiel* (filtre automatique réservé au même établissement).
   - Durée proposée (5 à 30 minutes) et ajout optionnel de photo de l'exercice.

4. **Filtrage intelligent pour les aidants** :
   - Matières validées au quiz uniquement.
   - Règle de classe : $\text{classe\_demandeur} \le \text{classe\_aidant}$.
   - Présentiel : même établissement scolaire uniquement.

5. **Prise en charge & Sessions en direct** :
   - Compte à rebours temps réel.
   - Accès direct au lien vidéo externe.
   - Marquer la session comme terminée avec virement automatique des crédits.

6. **Évaluation & Modération automatique** :
   - Notation post-session de 1 à 5 étoiles et commentaires.
   - Protection de la communauté : si moyenne < 2.5 ou 3 notes négatives consécutives ($\le 2$), le statut du tuteur passe en *suspendu*.

7. **Économie de crédits réciproques** :
   - $\text{crédits} = \text{durée\_min} \times \text{coefficient\_matière}$.
   - Matières dures (Mathématiques, Physique-Chimie) : coefficient $\times 1.5$.
   - Autres matières : coefficient $\times 1.0$.

---

## 🛠️ Stack Technique

- **Framework** : React Native avec Expo SDK 57
- **Langage** : TypeScript
- **Stockage local** : `@react-native-async-storage/async-storage` (100% local, persistant, avec fallback mémoire)
- **Composants UI** : Design tokens modernes, cartes avec élévation et ombrages doux, badges de statut, iconographie `@expo/vector-icons`

---

## 🚀 Démarrage rapide

```bash
# Lancer l'application avec Expo
npx expo start

# Lancer sur navigateur Web
npx expo start --web

# Lancer sur Android
npx expo start --android

# Lancer sur iOS (macOS requis)
npx expo start --ios
```

---

## 📂 Architecture des Dossiers

```
LinkUp/
├── src/
│   ├── components/       # Header, Badge, Button, Card, UserSwitcherModal
│   ├── context/          # AppContext (State management, stockage AsyncStorage, règles métier)
│   ├── data/
│   │   ├── matieres.json         # Config extensible des matières et rubriques
│   │   ├── quiz_questions.json   # Banque de questions de certification par niveau
│   │   └── seed_data.ts          # Données de démonstration initiales
│   ├── screens/
│   │   ├── RegisterScreen.tsx          # Écran 1: Inscription élève
│   │   ├── TutorOnboardingScreen.tsx   # Écran 2: Sélection matières & Quiz
│   │   ├── CreateDemandeScreen.tsx     # Écran 3: Création de demande
│   │   ├── DemandesListScreen.tsx      # Écran 4: Liste filtrée
│   │   ├── DemandeDetailScreen.tsx     # Écran 5: Détail & prise en charge
│   │   ├── ActiveSessionScreen.tsx     # Écran 6: Session en direct & chrono
│   │   ├── RatingScreen.tsx            # Écran 7: Notation post-session
│   │   └── ProfileScreen.tsx           # Écran 8: Profil, stats, historique
│   ├── services/
│   │   └── storage.ts                  # Service de persistance AsyncStorage
│   ├── theme/
│   │   └── colors.ts                   # Palette de couleurs et ombres
│   └── types/
│       └── index.ts                    # Définitions TypeScript (User, Demande, Session, etc.)
├── App.tsx                             # Point d'entrée et navigation
├── package.json
└── tsconfig.json
```
