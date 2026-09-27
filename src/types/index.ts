export type ClasseType = '6e' | '5e' | '4e' | '3e' | '2nde' | '1ère' | 'Tle';

export const CLASSE_ORDER: Record<ClasseType, number> = {
  '6e': 1,
  '5e': 2,
  '4e': 3,
  '3e': 4,
  '2nde': 5,
  '1ère': 6,
  'Tle': 7,
};

export const CLASSES_LIST: ClasseType[] = ['6e', '5e', '4e', '3e', '2nde', '1ère', 'Tle'];

// Helper to get immediately lower class for the quiz
export function getQuizTargetLevel(classe: ClasseType): ClasseType {
  const index = CLASSES_LIST.indexOf(classe);
  if (index <= 0) {
    return '6e'; // 6e takes 6e level questions
  }
  return CLASSES_LIST[index - 1];
}

// Check if tutor can help a student: classe_demandeur <= classe_aidant
export function isEligibleToHelp(aidantClasse: ClasseType, demandeurClasse: ClasseType): boolean {
  return CLASSE_ORDER[demandeurClasse] <= CLASSE_ORDER[aidantClasse];
}

export const ECOLES_PARTENAIRES: string[] = [
  'Collège Sainte-Marie',
  'Lycée Condorcet',
  'Lycée Henri-IV',
  'Lycée Louis-le-Grand',
  'Collège Victor Hugo',
  'Cours Secondaire Protestant',
  'Collège Jean Moulin',
  'Lycée International',
  'Collège Moderne Cocody',
  'Lycée Classique',
];

export type RolePrefere = 'aide' | 'besoin' | 'les_deux';
export type StatutTuteur = 'actif' | 'suspendu';
export type KycDocType = 'carte_scolaire' | 'recu_inscription';

export interface User {
  id: string;
  nom: string;
  age: number | string;
  classe: ClasseType;
  ecole: string;
  role_prefere: RolePrefere;
  credits: number;
  quiz_valide_par_matiere: Record<string, boolean>;
  matieres_fortes?: string[]; // 2 selected subjects during onboarding
  kyc_soumis?: boolean;
  kyc_type?: KycDocType;
  kyc_document_uri?: string;
  note_moyenne: number;
  nb_sessions_donnees: number;
  nb_evaluations_negatives: number;
  consecutive_negatives?: number;
  statut_tuteur: StatutTuteur;
  created_at?: string;
}

export interface MatiereConfig {
  id: string;
  nom: string;
  coefficient: number; // 1.5 for Maths, Physique-Chimie, 1.0 for others
  icon?: string;
  color?: string;
  rubriques: string[];
}

export type ModeDemande = 'audio' | 'video';
export type StatutDemande = 'ouverte' | 'en_cours' | 'terminee' | 'annulee';

export interface PropositionAide {
  id: string;
  aidant_id: string;
  aidant_nom: string;
  aidant_classe: ClasseType;
  aidant_ecole: string;
  aidant_note: number;
  aidant_nb_sessions: number;
  duree_proposee_min: number; // Temps que le tuteur estime nécessaire pour expliquer
  message?: string;
  lien_video?: string;
  created_at: string;
}

export interface Demande {
  id: string;
  auteur_id: string;
  auteur_nom: string;
  auteur_classe: ClasseType;
  auteur_ecole: string;
  matiere: string;
  rubrique: string;
  rubrique_custom?: string;
  photo_uri?: string;
  description?: string;
  audio_uri?: string;
  audio_duration_sec?: number;
  classe_demandeur: ClasseType;
  mode: ModeDemande;
  presentiel: boolean; // filtre = meme ecole obligatoire si true
  statut: StatutDemande;
  duree_proposee?: number; // Défini par le tuteur choisi
  lien_video?: string; // Rempli par l'aidant choisi si mode = video
  aidant_id?: string;
  aidant_nom?: string;
  session_id?: string;
  propositions?: PropositionAide[]; // Candidatures des tuteurs proposant leur aide
  created_at: string;
}

export interface Session {
  id: string;
  demande_id: string;
  aidant_id: string;
  aidant_nom: string;
  demandeur_id: string;
  demandeur_nom: string;
  duree_min: number;
  matiere: string;
  mode: ModeDemande;
  lien_video?: string;
  audio_uri?: string;
  credits_verses: number;
  note_recue?: number; // 1-5
  commentaire?: string;
  date: string;
  statut: 'en_cours' | 'terminee';
}

export interface QuizQuestion {
  id: string;
  matiere: string;
  niveau_cible: ClasseType; // niveau immédiatement inférieur
  question: string;
  options: string[];
  bonne_reponse_index: number;
  explication?: string;
}

export interface MatieresData {
  matieres: MatiereConfig[];
}

export interface QuizBankData {
  questions: QuizQuestion[];
}
