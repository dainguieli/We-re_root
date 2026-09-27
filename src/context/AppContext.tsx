import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Demande,
  Session,
  MatiereConfig,
  ClasseType,
  RolePrefere,
  StatutTuteur,
  ModeDemande,
  KycDocType,
  PropositionAide,
  isEligibleToHelp,
  calculateCreditsFromRating,
} from '../types';
import matieresJson from '../data/matieres.json';
import { SEED_USERS, SEED_DEMANDES, SEED_SESSIONS } from '../data/seed_data';
import { StorageService } from '../services/storage';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  demandes: Demande[];
  sessions: Session[];
  activeSession: Session | null;
  pendingRatingSession: Session | null;
  matieres: MatiereConfig[];
  currentMode: 'aide' | 'besoin';
  
  // Actions
  setCurrentMode: (mode: 'aide' | 'besoin') => void;
  registerUser: (data: {
    nom: string;
    age: number | string;
    classe: ClasseType;
    ecole: string;
    role_prefere?: RolePrefere;
    matieres_fortes?: string[];
    kyc_soumis?: boolean;
    kyc_type?: KycDocType;
    kyc_document_uri?: string;
  }) => Promise<User>;
  updateUserRolePrefere: (role: RolePrefere) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  validateQuizForMatiere: (matiereNom: string) => Promise<void>;
  createDemande: (data: {
    matiere: string;
    rubrique: string;
    rubrique_custom?: string;
    photo_uri?: string;
    description?: string;
    audio_uri?: string;
    audio_duration_sec?: number;
    creneau_horaire?: string;
    mode: ModeDemande;
    presentiel: boolean;
    duree_proposee?: number;
  }) => Promise<Demande>;
  proposeAide: (
    demandeId: string,
    dureeMin: number,
    message?: string,
    lienVideo?: string
  ) => Promise<PropositionAide>;
  acceptProposition: (demandeId: string, propositionId: string) => Promise<Session>;
  simulateTutorProposition: (
    demandeId: string,
    customTutor?: Partial<PropositionAide>
  ) => Promise<PropositionAide>;
  takeDemande: (demandeId: string, duree: number, lienVideo?: string) => Promise<Session>;
  completeSession: (sessionId: string) => Promise<void>;
  submitRating: (sessionId: string, rating: number, commentaire?: string) => Promise<void>;
  cancelDemande: (demandeId: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
  getFilteredDemandesForCurrentUser: () => Demande[];
  calculateCreditsForMatiere: (matiereNom: string, dureeMin: number) => number;
  calculateCreditsFromRatingForMatiere: (matiereNom: string, rating: number) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(SEED_USERS[0] ?? null);
  const [users, setUsers] = useState<User[]>(() => [...SEED_USERS]);
  const [demandes, setDemandes] = useState<Demande[]>(() => [...SEED_DEMANDES]);
  const [sessions, setSessions] = useState<Session[]>(() => [...SEED_SESSIONS]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [pendingRatingSession, setPendingRatingSession] = useState<Session | null>(null);
  const [currentMode, setCurrentMode] = useState<'aide' | 'besoin'>('besoin');

  const matieres: MatiereConfig[] = useMemo(() => matieresJson.matieres, []);

  // Initialize storage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await StorageService.initStorage();
        setUsers(data.users);
        setDemandes(data.demandes);
        setSessions(data.sessions);
        setCurrentUser(data.currentUser);
        setActiveSession(data.activeSession);
        setPendingRatingSession(data.pendingRatingSession);
        
        if (data.currentUser) {
          if (data.currentUser.role_prefere === 'aide') {
            setCurrentMode('aide');
          } else {
            setCurrentMode('besoin');
          }
        }
      } catch (err) {
        console.error('Failed to init storage', err);
      }
    }
    loadData();
  }, []);

  const calculateCreditsForMatiere = (matiereNom: string, dureeMin: number): number => {
    const mat = matieres.find((m) => m.nom.toLowerCase() === matiereNom.toLowerCase());
    const coeff = mat ? mat.coefficient : 1.0;
    return Math.round(dureeMin * coeff * 10) / 10;
  };

  const calculateCreditsFromRatingForMatiere = (matiereNom: string, rating: number): number => {
    const mat = matieres.find((m) => m.nom.toLowerCase() === matiereNom.toLowerCase());
    const coeff = mat ? mat.coefficient : 1.0;
    return calculateCreditsFromRating(rating, coeff);
  };

  const registerUser = async (data: {
    nom: string;
    age: number | string;
    classe: ClasseType;
    ecole: string;
    role_prefere?: RolePrefere;
    matieres_fortes?: string[];
    kyc_soumis?: boolean;
    kyc_type?: KycDocType;
    kyc_document_uri?: string;
  }): Promise<User> => {
    const role = data.role_prefere || 'les_deux';
    const newUser: User = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      nom: data.nom.trim(),
      age: Number(data.age) || 15,
      classe: data.classe,
      ecole: data.ecole.trim(),
      role_prefere: role,
      credits: 20, // initial welcome bonus credits
      quiz_valide_par_matiere: {},
      matieres_fortes: data.matieres_fortes || [],
      kyc_soumis: data.kyc_soumis ?? true,
      kyc_type: data.kyc_type || 'carte_scolaire',
      kyc_document_uri: data.kyc_document_uri,
      note_moyenne: 5.0,
      nb_sessions_donnees: 0,
      nb_evaluations_negatives: 0,
      consecutive_negatives: 0,
      statut_tuteur: 'actif',
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setCurrentMode(role === 'aide' ? 'aide' : 'besoin');

    await StorageService.saveUsers(updatedUsers);
    await StorageService.saveCurrentUser(newUser);
    return newUser;
  };

  const updateUserRolePrefere = async (role: RolePrefere): Promise<void> => {
    if (!currentUser) return;
    const updated = { ...currentUser, role_prefere: role };
    setCurrentUser(updated);
    const updatedUsers = users.map((u) => (u.id === updated.id ? updated : u));
    setUsers(updatedUsers);
    await StorageService.saveCurrentUser(updated);
    await StorageService.saveUsers(updatedUsers);
  };

  const switchUser = async (userId: string): Promise<void> => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setCurrentMode(found.role_prefere === 'aide' ? 'aide' : 'besoin');
      await StorageService.saveCurrentUser(found);
    }
  };

  const validateQuizForMatiere = async (matiereNom: string): Promise<void> => {
    if (!currentUser) return;
    const updatedQuiz = {
      ...currentUser.quiz_valide_par_matiere,
      [matiereNom]: true,
    };
    const updatedUser: User = {
      ...currentUser,
      quiz_valide_par_matiere: updatedQuiz,
    };

    setCurrentUser(updatedUser);
    const updatedUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    await StorageService.saveCurrentUser(updatedUser);
    await StorageService.saveUsers(updatedUsers);
  };

  const createDemande = async (data: {
    matiere: string;
    rubrique: string;
    rubrique_custom?: string;
    photo_uri?: string;
    description?: string;
    audio_uri?: string;
    audio_duration_sec?: number;
    creneau_horaire?: string;
    mode: ModeDemande;
    presentiel: boolean;
    duree_proposee?: number;
  }): Promise<Demande> => {
    if (!currentUser) throw new Error('Utilisateur non connecté');

    const newDemande: Demande = {
      id: `demande_${Date.now()}`,
      auteur_id: currentUser.id,
      auteur_nom: currentUser.nom,
      auteur_classe: currentUser.classe,
      auteur_ecole: currentUser.ecole,
      matiere: data.matiere,
      rubrique: data.rubrique,
      rubrique_custom: data.rubrique_custom,
      photo_uri: data.photo_uri,
      description: data.description,
      audio_uri: data.audio_uri,
      audio_duration_sec: data.audio_duration_sec,
      classe_demandeur: currentUser.classe,
      creneau_horaire: data.creneau_horaire,
      mode: data.mode,
      presentiel: data.presentiel,
      statut: 'ouverte',
      duree_proposee: data.duree_proposee,
      propositions: [],
      created_at: new Date().toISOString(),
    };

    const updated = [newDemande, ...demandes];
    setDemandes(updated);
    await StorageService.saveDemandes(updated);
    return newDemande;
  };

  const proposeAide = async (
    demandeId: string,
    dureeMin: number,
    message?: string,
    lienVideo?: string
  ): Promise<PropositionAide> => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    const targetDemande = demandes.find((d) => d.id === demandeId);
    if (!targetDemande) throw new Error('Demande introuvable');
    if (targetDemande.statut !== 'ouverte') throw new Error('Cette demande n\'est plus disponible');

    const newProposition: PropositionAide = {
      id: `prop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      aidant_id: currentUser.id,
      aidant_nom: currentUser.nom,
      aidant_classe: currentUser.classe,
      aidant_ecole: currentUser.ecole,
      aidant_note: currentUser.note_moyenne || 5.0,
      aidant_nb_sessions: currentUser.nb_sessions_donnees || 0,
      duree_proposee_min: dureeMin,
      message: message?.trim(),
      lien_video: lienVideo?.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedDemandes = demandes.map((d) => {
      if (d.id === demandeId) {
        const existingProps = d.propositions || [];
        const filtered = existingProps.filter((p) => p.aidant_id !== currentUser.id);
        return {
          ...d,
          propositions: [...filtered, newProposition],
        };
      }
      return d;
    });

    setDemandes(updatedDemandes);
    await StorageService.saveDemandes(updatedDemandes);
    return newProposition;
  };

  const acceptProposition = async (
    demandeId: string,
    propositionId: string
  ): Promise<Session> => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    const targetDemande = demandes.find((d) => d.id === demandeId);
    if (!targetDemande) throw new Error('Demande introuvable');
    if (targetDemande.statut !== 'ouverte') throw new Error('Cette demande est déjà prise en charge');

    const prop = (targetDemande.propositions || []).find((p) => p.id === propositionId);
    if (!prop) throw new Error('Proposition de tuteur introuvable');

    const duration = prop.duree_proposee_min;
    const creditsGain = calculateCreditsForMatiere(targetDemande.matiere, duration);

    const newSession: Session = {
      id: `session_${Date.now()}`,
      demande_id: targetDemande.id,
      aidant_id: prop.aidant_id,
      aidant_nom: prop.aidant_nom,
      demandeur_id: targetDemande.auteur_id,
      demandeur_nom: targetDemande.auteur_nom,
      duree_min: duration,
      matiere: targetDemande.matiere,
      mode: targetDemande.mode,
      lien_video: prop.lien_video || targetDemande.lien_video,
      audio_uri: targetDemande.audio_uri,
      credits_verses: creditsGain,
      date: new Date().toISOString(),
      statut: 'en_cours',
    };

    const updatedDemandes: Demande[] = demandes.map((d) =>
      d.id === demandeId
        ? {
            ...d,
            statut: 'en_cours',
            aidant_id: prop.aidant_id,
            aidant_nom: prop.aidant_nom,
            duree_proposee: duration,
            session_id: newSession.id,
            lien_video: prop.lien_video || d.lien_video,
          }
        : d
    );

    const updatedSessions = [newSession, ...sessions];
    setDemandes(updatedDemandes);
    setSessions(updatedSessions);
    setActiveSession(newSession);

    await StorageService.saveDemandes(updatedDemandes);
    await StorageService.saveSessions(updatedSessions);
    await StorageService.saveActiveSession(newSession);

    return newSession;
  };

  const simulateTutorProposition = async (
    demandeId: string,
    customTutor?: Partial<PropositionAide>
  ): Promise<PropositionAide> => {
    const targetDemande = demandes.find((d) => d.id === demandeId);
    if (!targetDemande) throw new Error('Demande introuvable');

    const candidateTutor =
      users.find((u) => u.id !== targetDemande.auteur_id && isEligibleToHelp(u.classe, targetDemande.classe_demandeur)) ||
      users.find((u) => u.id === 'user_thomas_tle') || {
        id: 'user_thomas_tle',
        nom: 'Thomas Dubois',
        classe: 'Tle' as ClasseType,
        ecole: 'Lycée Henri IV',
        note_moyenne: 4.9,
        nb_sessions_donnees: 8,
      };

    const newProposition: PropositionAide = {
      id: `prop_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      aidant_id: customTutor?.aidant_id || candidateTutor.id,
      aidant_nom: customTutor?.aidant_nom || candidateTutor.nom,
      aidant_classe: (customTutor?.aidant_classe || candidateTutor.classe) as ClasseType,
      aidant_ecole: customTutor?.aidant_ecole || candidateTutor.ecole,
      aidant_note: customTutor?.aidant_note || candidateTutor.note_moyenne || 4.9,
      aidant_nb_sessions: customTutor?.aidant_nb_sessions || candidateTutor.nb_sessions_donnees || 8,
      duree_proposee_min: customTutor?.duree_proposee_min || 15,
      message: customTutor?.message || "Salut ! Je maîtrise bien ce sujet, je peux t'expliquer en 15 min chrono.",
      lien_video: targetDemande.mode === 'video' ? 'https://meet.google.com/linkup-tutor' : undefined,
      created_at: new Date().toISOString(),
    };

    const updatedDemandes = demandes.map((d) => {
      if (d.id === demandeId) {
        const existing = (d.propositions || []).filter((p) => p.aidant_id !== newProposition.aidant_id);
        return {
          ...d,
          propositions: [...existing, newProposition],
        };
      }
      return d;
    });

    setDemandes(updatedDemandes);
    await StorageService.saveDemandes(updatedDemandes);
    return newProposition;
  };

  const takeDemande = async (
    demandeId: string,
    duree: number,
    lienVideo?: string
  ): Promise<Session> => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    const prop = await proposeAide(demandeId, duree, undefined, lienVideo);
    return acceptProposition(demandeId, prop.id);
  };

  const completeSession = async (sessionId: string): Promise<void> => {
    const sessionToComplete = sessions.find((s) => s.id === sessionId) || activeSession;
    if (!sessionToComplete) return;

    const completedSession: Session = {
      ...sessionToComplete,
      statut: 'terminee',
    };

    const updatedSessions = sessions.map((s) => (s.id === sessionId ? completedSession : s));
    const updatedDemandes = demandes.map((d) =>
      d.id === completedSession.demande_id ? { ...d, statut: 'terminee' as const } : d
    );

    setSessions(updatedSessions);
    setDemandes(updatedDemandes);
    setActiveSession(null);
    setPendingRatingSession(completedSession);

    await StorageService.saveSessions(updatedSessions);
    await StorageService.saveDemandes(updatedDemandes);
    await StorageService.saveActiveSession(null);
    await StorageService.savePendingRatingSession(completedSession);
  };

  const submitRating = async (
    sessionId: string,
    rating: number,
    commentaire?: string
  ): Promise<void> => {
    const sessionRated = sessions.find((s) => s.id === sessionId) || pendingRatingSession;
    if (!sessionRated) return;

    const tutorId = sessionRated.aidant_id;
    const isNegative = rating <= 2;

    // Credit calculation rule:
    // Credits awarded to the tutor depend directly on the student's rating and subject coefficient
    const mat = matieres.find((m) => m.nom.toLowerCase() === sessionRated.matiere.toLowerCase());
    const coeff = mat ? mat.coefficient : 1.0;
    const creditGain = calculateCreditsFromRating(rating, coeff);

    const updatedSessions = sessions.map((s) =>
      s.id === sessionId
        ? { ...s, note_recue: rating, commentaire, credits_verses: creditGain, statut: 'terminee' as const }
        : s
    );

    // Update tutor ratings, note moyenne, negative counts & suspension rules
    const tutorSessions = updatedSessions.filter(
      (s) => s.aidant_id === tutorId && s.note_recue !== undefined
    );
    const totalScore = tutorSessions.reduce((sum, s) => sum + (s.note_recue || 0), 0);
    const averageScore =
      tutorSessions.length > 0 ? Math.round((totalScore / tutorSessions.length) * 10) / 10 : 5.0;

    const updatedUsers = users.map((u) => {
      if (u.id === tutorId) {
        const prevConsecutive = u.consecutive_negatives || 0;
        const newConsecutive = isNegative ? prevConsecutive + 1 : 0;
        const newTotalNegatives = isNegative
          ? u.nb_evaluations_negatives + 1
          : u.nb_evaluations_negatives;

        let newStatus: StatutTuteur = u.statut_tuteur;
        // Rule: 3 consecutive negative ratings or average note < 2.5 -> suspended
        if (newConsecutive >= 3 || (tutorSessions.length >= 3 && averageScore < 2.5)) {
          newStatus = 'suspendu';
        }

        return {
          ...u,
          credits: u.credits + creditGain,
          nb_sessions_donnees: u.nb_sessions_donnees + 1,
          note_moyenne: averageScore,
          nb_evaluations_negatives: newTotalNegatives,
          consecutive_negatives: newConsecutive,
          statut_tuteur: newStatus,
        };
      }
      return u;
    });

    if (currentUser && currentUser.id === tutorId) {
      const updatedCurrent = updatedUsers.find((u) => u.id === currentUser.id);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }

    setSessions(updatedSessions);
    setUsers(updatedUsers);
    setPendingRatingSession(null);

    await StorageService.saveSessions(updatedSessions);
    await StorageService.saveUsers(updatedUsers);
    await StorageService.savePendingRatingSession(null);
  };

  const cancelDemande = async (demandeId: string): Promise<void> => {
    const updated = demandes.map((d) =>
      d.id === demandeId ? { ...d, statut: 'annulee' as const } : d
    );
    setDemandes(updated);
    await StorageService.saveDemandes(updated);
  };

  const resetDatabase = async (): Promise<void> => {
    await StorageService.resetAll();
    const data = await StorageService.initStorage();
    setUsers(data.users);
    setDemandes(data.demandes);
    setSessions(data.sessions);
    setCurrentUser(data.currentUser);
    setActiveSession(null);
    setPendingRatingSession(null);
    if (data.currentUser) {
      setCurrentMode(data.currentUser.role_prefere === 'aide' ? 'aide' : 'besoin');
    }
  };

  // Rule 3 & 5: Filtered requests for tutor
  // 1. statut === 'ouverte' STRICTLY (once answered or in-progress, never available)
  // 2. not created by the current user
  // 3. tutor validated the quiz for this subject
  // 4. requester class <= tutor class
  // 5. if presentiel is true, must be the exact same school
  const getFilteredDemandesForCurrentUser = (): Demande[] => {
    if (!currentUser) return [];

    // If tutor is suspended, they cannot see or take requests
    if (currentUser.statut_tuteur === 'suspendu') {
      return [];
    }

    return demandes.filter((d) => {
      // Must be strictly OPEN (not in progress, not answered/completed, not cancelled)
      if (d.statut !== 'ouverte') return false;
      // Cannot take own request
      if (d.auteur_id === currentUser.id) return false;
      // Must have validated the quiz for this subject
      if (!currentUser.quiz_valide_par_matiere[d.matiere]) return false;
      // Class rule: classe_demandeur <= classe_aidant
      if (!isEligibleToHelp(currentUser.classe, d.classe_demandeur)) return false;
      // Presentiel rule: same school only
      if (d.presentiel && d.auteur_ecole.toLowerCase() !== currentUser.ecole.toLowerCase()) {
        return false;
      }
      return true;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        demandes,
        sessions,
        activeSession,
        pendingRatingSession,
        matieres,
        currentMode,
        setCurrentMode,
        registerUser,
        updateUserRolePrefere,
        switchUser,
        validateQuizForMatiere,
        createDemande,
        proposeAide,
        acceptProposition,
        simulateTutorProposition,
        takeDemande,
        completeSession,
        submitRating,
        cancelDemande,
        resetDatabase,
        getFilteredDemandesForCurrentUser,
        calculateCreditsForMatiere,
        calculateCreditsFromRatingForMatiere,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
