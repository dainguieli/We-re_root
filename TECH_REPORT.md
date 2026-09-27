# 📋 Technical Inventory, AI Report & Architecture Blueprint — LinkUp

---

## 1. 🤖 Models & Artificial Intelligence (AI) Inventory

### 1.1. AI Systems & Developer Pair-Programming Models
| Component / Tool | Model / Technology | Provider | Role & Contribution |
| :--- | :--- | :--- | :--- |
| **Development & Architecture Assistant** | **Antigravity / Gemini Engine** | Google DeepMind | Conception architecturale, génération de code TypeScript/React Native, refactorings, implémentation des règles métier, résolution des types et synchronisation Git. |
| **Generative Vision Tools** | Procedural SVG Generation Engine | Built-in / In-App | Génération programmatique vectorielle des documents d'identité scolaire démo (Cartes d'élève, Certificats de scolarité). |

### 1.2. In-App AI vs Deterministic Logic (Honest Disclosure)
> [!IMPORTANT]
> **Transparence sur l'utilisation de l'IA dans l'application mobile en production :**
> L'application client **LinkUp** s'exécute de manière **100% autonome, locale et déterministe**.
> Aucun appel d'API LLM payant ou service d'inférence cloud n'est exécuté au runtime client. Cela garantit une **latence nulle**, un **fonctionnement offline-first**, un **coût d'infrastructure nul** et une **confidentialité totale des données des élèves mineurs**.

Les comportements "intelligents" de l'application sont assurés par des moteurs algorithmiques déterministes :
- **Agent de Simulation Tuteur (`simulateTutorProposition`)** : Agent de simulation mimant le comportement d'un tuteur certifié compatible (sélection d'un profil selon la hiérarchie de classe, estimation du temps d'explication et génération du message personnalisé).
- **Moteur de Modération & Suspension Automatique** : Surveillance algorithmique des évaluations des tuteurs ($3$ notes négatives consécutives $\le 2/5$ ou moyenne $< 2.5/5 \rightarrow$ suspension immédiate).
- **Moteur d'Éligibilité Hiérarchique** : Vérification matricielle des niveaux autorisés ($C_{demandeur} \le C_{aidant}$).
- **Moteur de Calcul de Crédits au Mérite (`calculateCreditsFromRating`)** : Modèle mathématique pondérant la note ($1$ à $5\bigstar$) par le coefficient de complexité de la matière ($1.0$ ou $1.5$).

### 1.3. NVIDIA Brev Declaration
> [!NOTE]
> **Statut NVIDIA Brev :**
> **NVIDIA Brev n'a PAS été utilisé** dans ce projet. Aucun conteneur cloud GPU, instance d'entraînement ou runtime Brev n'est impliqué. L'ensemble de la logique de build et d'exécution repose sur l'écosystème **Expo / Node.js**.

---

## 📊 2. Datasets & Structured Data Sources

| Dataset File | Format | Records / Entries | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `src/data/matieres.json` | JSON | 9 Matières, ~45 Leçons | Référentiel complet des matières scolaires (Maths, Physique-Chimie, Français, SVT, Histoire-Géo, Anglais, etc.), avec sous-chapitres du programme officiel, codes couleurs et coefficients multiplicateurs ($\times 1.0$ ou $\times 1.5$). |
| `src/data/quiz_bank.json` | JSON | ~30 QCMs calibrés | Banque de questions de certification pédagogique par matière et niveau cible ($N-1$, de la 6e à la Terminale), incluant distracteurs et explications de correction. |
| `src/data/seed_data.ts` | TypeScript | 5 Utilisateurs, 3 Demandes, 1 Session | Jeu de données initial de démonstration avec profils réalistes (`Awa Koffi`, `Lucas Martin`, `Sarah Benali`, `Thomas Dubois`, `Emma Leroy`) et historique pré-alimenté. |
| `ECOLES_PARTENAIRES` (`src/types/index.ts`) | Enum / Array | 10 Établissements | Liste des collèges et lycées partenaires pour le filtrage présentiel (*Collège Sainte-Marie, Lycée Condorcet, Henri-IV, Louis-le-Grand, etc.*). |
| `CRENEAUX_HORAIRES` (`src/types/index.ts`) | Array | 12 Plages d'1 heure | Créneaux de disponibilité horaire standardisés de `06h00 - 07h00` à `17h00 - 18h00`. |

---

## 🌐 3. APIs, Protocols & System Interfaces

| API / Protocol | Type | Source / Library | Usage in LinkUp |
| :--- | :--- | :--- | :--- |
| **AsyncStorage API** | Local Key-Value Persistence | `@react-native-async-storage/async-storage` | Persistance locale de la base de données (utilisateurs, demandes, sessions actives, évaluations, session utilisateur connectée). |
| **Animated API** | Native UI Animation Engine | `react-native` (`Animated`) | Moteur physique pour les transitions, modaux de succès (`SuccessModal`), compte à rebours, et micro-animations. |
| **Linking Protocol API** | Inter-App Deep Linking | `react-native` (`Linking`) | Ouverture fluide des passerelles de communication vidéo externes (*Google Meet, WhatsApp, Jitsi*). |
| **Audio Widget Interface** | Interactive Sound/Mic Component | `src/components/AudioWidget.tsx` | Enregistreur et visualiseur de notes vocales pour les demandes au format audio. |
| **Expo Router / App Navigation** | State-driven Navigation | Custom React Screen State | Routage optimisé sans dépendance lourde, assurant la navigation entre onboarding, tableau de bord, quiz et sessions. |

---

## 🎨 4. Generated Assets & Media Inventory

| Asset Name | Format | Location / Generator | Usage & Origin |
| :--- | :--- | :--- | :--- |
| **Logo Officiel LinkUp** | PNG (Haute résolution) | `assets/logo.png` | Logo de la marque intégré dans la TopBar, les bannières d'accueil et le profil. |
| **Carte Scolaire Démo SVG** | SVG Vectoriel Data URI | `src/utils/kycDemoAssets.ts` | Carte d'identité scolaire officielle générée dynamiquement avec le nom de l'élève, la classe, l'école, le numéro matricule et un code-barres. |
| **Certificat de Scolarité SVG** | SVG Vectoriel Data URI | `src/utils/kycDemoAssets.ts` | Reçu d'inscription / attestation scolaire officielle généré dynamiquement. |
| **Exercise Sample Photos** | Remote CDN URLs | Unsplash Education Library | Photos d'exercices pour la simulation d'attachements de devoirs. |
| **Icônes du Système** | Vector Icon Glyphs | `@expo/vector-icons` (`Ionicons`) | Iconographie standardisée pour matières, étoiles, statuts, minuteur et micros. |

---

## 🛠️ 5. Stack Technique Choisi & Justification

```
┌─────────────────────────────────────────────────────────────┐
│                       LinkUp Mobile                         │
├──────────────────────────────┬──────────────────────────────┤
│  Frontend / Application      │  React Native (Expo SDK 57)  │
│  Typage & Qualité de code    │  TypeScript 5.x (Strict)     │
│  Stockage & Persistance      │  AsyncStorage (Local-First)  │
│  Animation Engine            │  React Native Animated       │
│  Styles & Design Tokens      │  Custom Theme System         │
│  Contrôle de version         │  Git / GitHub (We-re_root)   │
└──────────────────────────────┴──────────────────────────────┘
```

### Rationale & Justifications :
1. **React Native avec Expo SDK 57** :
   - Déploiement cross-platform unifié (iOS, Android, Web) à partir d'un codebase unique.
   - Vitesse d'itération rapide et compatibilité mobile-first.
2. **TypeScript en Mode Strict** :
   - Sécurisation absolue des transitions d'états (`statut: 'ouverte' | 'en_cours' | 'terminee' | 'annulee'`).
   - Prévention des erreurs de calcul de crédits et d'éligibilité de classe lors de la compilation (`npx tsc --noEmit`).
3. **Architecture Local-First (`AsyncStorage`)** :
   - Indépendance vis-à-vis des pannes réseau.
   - Initialisation immédiate et démo prête à l'emploi sans configuration de serveur backend distant.
4. **Composants Découplés & Responsives** :
   - Interface responsive fluide s'adaptant des smartphones compacts aux tablettes et navigateurs web grand écran (largeur contenue de 720 à 760px).

---

## 🔒 6. Sécurité, Clés & Contraintes d'Accès

> [!CAUTION]
> **Règles de Sécurité Strictes :**
> - **Aucune clé d'API, aucun mot de passe, aucun token ni code promotionnel/voucher n'est codé en dur** dans le projet.
> - L'application fonctionne sans secret sensible côté client.
> - Les données utilisateur restent stockées sur l'espace d'application local de l'appareil (`AsyncStorage`).

---

## 🔄 7. Mécanismes de Fallback & Résilience

1. **Fallback de Stockage (`StorageService`)** :
   - Si `AsyncStorage` est temporairement indisponible (ex: environnement d'émulation SSR sans `window.localStorage`), un stockage en mémoire vive transparent prend le relais sans faire crasher l'application.
2. **Fallback Données de Démo (`seed_data.ts`)** :
   - Si la base locale est vierge ou corrompue, l'application s'auto-initialise avec le jeu d'utilisateurs et de questions prédéfini.
   - Bouton de réinitialisation de la base (*Reset*) disponible à tout moment dans le profil.
3. **Fallback Simulation Tuteur** :
   - Si aucun élève réel n'est connecté sur un appareil distinct, le demandeur peut utiliser le bouton `⚡ Simuler une proposition de tuteur (Démo)` pour tester le cycle complet (proposition, durée, acceptation, minuteur, notation).
4. **Fallback Liens Vidéo** :
   - Si l'aidant ne précise pas de lien vidéo personnalisé, un lien par défaut (`https://meet.google.com/linkup-aide`) est automatiquement provisionné.

---
*Rapport technique et inventaire certifiés pour le projet LinkUp.*
