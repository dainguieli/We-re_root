# 📋 Transparent AI & Tool Disclosure — LinkUp

> **Project Name** : LinkUp — Peer-to-Peer School Tutoring Mobile Application  
> **Repository** : [https://github.com/dainguieli/We-re_root.git](https://github.com/dainguieli/We-re_root.git)  
> **Framework** : React Native (Expo SDK 57) / TypeScript 5.x  
> **Date** : September 2026  

---

## 1. 🤖 Modèles & Rôle Réel de l'IA (Déclaration Transparente)

### 1.1. Assistant de Développement & Conception
- **Modèle Utilisé** : **Gemini / Antigravity Engine** (Google DeepMind).
- **Rôle & Contribution Réelle** :
  - Génération, refactoring et structuration du code source TypeScript et React Native.
  - Conception de l'architecture logicielle, des types stricts et des modèles de données (`User`, `Demande`, `PropositionAide`, `Session`).
  - Implémentation des règles métier (hiérarchie des classes, barème de calcul des crédits au mérite, moteur de modération).
  - Validation du typage (`npx tsc --noEmit`) et automatisation des commits Git.

### 1.2. Exécution Client en Production (In-App Runtime)
- **Déclaration d'Honnêteté** : L'application mobile en production fonctionne de manière **100% locale, autonome et déterministe**.
- **Aucun appel d'API LLM payant ou service d'inférence cloud n'est exécuté au runtime client.**
- **Bénéfices** :
  - **Latence zéro** : Fonctionnement instantané.
  - **Offline-First** : Résilience complète sans connexion Internet obligatoire pour la navigation.
  - **Coût d'infrastructure nul** : Aucune dépendance à des clés d'API payantes ou serveurs GPU.
  - **Protection des mineurs** : Respect total de la vie privée des élèves (aucune donnée personnelle envoyée à un LLM tiers).

### 1.3. Agents Déterministes & Moteurs Algorithmiques In-App
- **Agent de Simulation Tuteur (`simulateTutorProposition`)** : Agent déterministe mimant le comportement d'un tuteur certifié compatible (sélectionne un profil tuteur compatible avec la classe du demandeur, propose une durée estimée et un message d'aide pour les démos).
- **Moteur de Modération & Suspension Automatique** : Algorithme surveillant les évaluations post-session ($3$ notes négatives consécutives $\le 2/5$ ou moyenne $< 2.5/5 \rightarrow$ suspension automatique du tuteur).
- **Moteur de Calcul de Crédits au Mérite (`calculateCreditsFromRating`)** : Formule mathématique pondérant la note ($1$ à $5\bigstar$) par le coefficient de difficulté de la matière ($\times 1.0$ ou $\times 1.5$).
- **Moteur d'Éligibilité Hiérarchique des Classes** : Contrôle d'accès basé sur la règle $C_{demandeur} \le C_{aidant}$.

---

## 2. ⚡ Statut NVIDIA Brev

> [!NOTE]
> **Déclaration Officielle sur NVIDIA Brev :**
> **NVIDIA Brev n'a PAS été utilisé** dans ce projet.  
> Aucun conteneur GPU cloud, environnement d'inférence, voucher ou runtime NVIDIA Brev n'a été déployé. L'intégralité du cycle de build, de test et d'exécution repose sur l'environnement **Expo SDK / Node.js** standard.

---

## 📊 3. Jeux de Données & Référentiels

| Référentiel / Dataset | Fichier Source | Contenu & Rôle |
| :--- | :--- | :--- |
| **Matières & Programmes** | `src/data/matieres.json` | 9 matières scolaires, ~45 leçons officielles, codes couleurs hexadécimaux et coefficients multiplicateurs ($\times 1.0$ ou $\times 1.5$). |
| **Banque de Quiz Tuteurs N-1** | `src/data/quiz_bank.json` | ~30 QCMs pédagogiques étalonnés par classe et matière pour la certification des tuteurs. |
| **Données de Démonstration** | `src/data/seed_data.ts` | Profils types d'élèves (`Awa Koffi`, `Lucas Martin`, `Sarah Benali`, `Thomas Dubois`, `Emma Leroy`), demandes et sessions pré-configurées. |
| **Établissements Partenaires** | `ECOLES_PARTENAIRES` (`src/types/index.ts`) | Liste des 10 collèges et lycées partenaires pour le filtrage en présentiel. |
| **Créneaux Horaires Standardisés** | `CRENEAUX_HORAIRES` (`src/types/index.ts`) | 12 plages horaires d'1 heure (de `06h00 - 07h00` à `17h00 - 18h00`). |

---

## 🌐 4. APIs, Protocoles & Bibliothèques

- **Stockage Persistant Local** : `@react-native-async-storage/async-storage` (stockage local sécurisé sur l'appareil avec fallback mémoire).
- **Moteur d'Animations Physiques** : `react-native` (`Animated` API) pour les effets de ressort (*spring physics*), rotation d'étincelles et modal de validation (`SuccessModal.tsx`).
- **Passerelle de Deep Linking** : `react-native` (`Linking` API) pour le routage externe vers les visioconférences (*Google Meet, WhatsApp, Jitsi*).
- **Interface Audio Interactive** : `src/components/AudioWidget.tsx` pour l'enregistrement et la lecture des notes vocales.
- **Routage d'Écrans & State Management** : React Context API (`AppContext.tsx`) et état applicatif réactif.

---

## 🎨 5. Assets Générés & Identité Visuelle

- **Logo Officiel LinkUp** : `assets/logo.png` intégré dans l'en-tête (`TopBar.tsx`), les écrans de chargement et le profil.
- **Générateur Vectoriel SVG de Cartes Scolaires KYC** : `src/utils/kycDemoAssets.ts` générant dynamiquement des cartes d'élève et certificats d'inscription personnalisés (nom, classe, école, matricule, code-barres) en SVG Data URI.
- **Iconographie Standardisée** : `@expo/vector-icons` (`Ionicons`).
- **Médias Éducatifs de Démonstration** : Images d'exercices Unsplash Education.

---

## 🔒 6. Sécurité, Clés & Contraintes d'Accès

> [!CAUTION]
> **Conformité & Sécurité :**
> - **Aucune clé d'API, mot de passe, token secret ni code promotionnel/voucher n'est codé en dur dans le code source.**
> - Aucune transmission de données personnelles vers des serveurs tiers.
> - Stockage isolé dans le sandbox local de l'application mobile.

---

## 🔄 7. Mécanismes de Fallback & Résilience

1. **Fallback de Stockage** : En cas d'inaccessibilité temporaire d'AsyncStorage, un système de cache transparent en mémoire vive prévient tout plantage.
2. **Fallback Données de Démo** : Si la base locale est vide, elle s'auto-initialise avec le jeu de données prédéfini (`seed_data.ts`), avec possibilité de réinitialisation (*Reset*) à la demande.
3. **Fallback Simulation Tuteur** : Le demandeur peut simuler instantanément une offre tuteur via le bouton `⚡ Simuler une proposition de tuteur (Démo)`.
4. **Fallback Visioconférence** : Lien d'appel vidéo de secours provisionné par défaut si le tuteur n'en spécifie pas.

---
*Document de transparence et d'inventaire technique LinkUp — Synchronisé sur le dépôt GitHub.*
