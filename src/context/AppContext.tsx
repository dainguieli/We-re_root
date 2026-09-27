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
  isEligibleToHelp,
} from '../types';
import matieresJson from '../data/matieres.json';
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
  isLoading: boolean;
  
  // Actions
  setCurrentMode: (mode: 'aide' | 'besoin') => void;
  registerUser: (data: {
    nom: string;
    age: number | string;
    classe: ClasseType;
    ecole: string;
    role_prefere: RolePrefere;
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
    mode: ModeDemande;
    presentiel: boolean;
    duree_proposee: number;
  }) => Promise<Demande>;
  takeDemande: (demandeId: string, duree: number, lienVideo?: string) => Promise<Session>;
  completeSession: (sessionId: string) => Promise<void>;
  submitRating: (sessionId: string, rating: number, commentaire?: string) => Promise<void>;
  cancelDemande: (demandeId: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
  getFilteredDemandesForCurrentUser: () => Demande[];
  calculateCreditsForMatiere: (matiereNom: string, dureeMin: number) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [pendingRatingSession, setPendingRatingSession] = useState<Session | null>(null);
  const [currentMode, setCurrentMode] = useState<'aide' | 'besoin'>('besoin');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const calculateCreditsForMatiere = (matiereNom: string, dureeMin: number): number => {
    const mat = matieres.find((m) => m.nom.toLowerCase() === matiereNom.toLowerCase());
    const coeff = mat ? mat.coefficient : 1.0;
    return Math.round(dureeMin * coeff * 10) / 10;
  };

  const registerUser = async (data: {
    nom: string;
    age: number | string;
    classe: ClasseType;
    ecole: string;
    role_prefere: RolePrefere;
  }): Promise<User> => {
    const newUser: User = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      nom: data.nom.trim(),
      age: Number(data.age) || 15,
      classe: data.classe,
      ecole: data.ecole.trim(),
      role_prefere: data.role_prefere,
      credits: 20, // initial welcome bonus credits
      quiz_valide_par_matiere: {},
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
    setCurrentMode(data.role_prefere === 'aide' ? 'aide' : 'besoin');

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
    mode: ModeDemande;
    presentiel: boolean;
    duree_proposee: number;
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
      mode: data.mode,
      presentiel: data.presentiel,
      statut: 'ouverte',
      duree_proposee: data.duree_proposee,
      created_at: new Date().toISOString(),
    };

    const updated = [newDemande, ...demandes];
    setDemandes(updated);
    await StorageService.saveDemandes(updated);
    return newDemande;
  };

  const takeDemande = async (
    demandeId: string,
    duree: number,
    lienVideo?: string
  ): Promise<Session> => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    const targetDemande = demandes.find((d) => d.id === demandeId);
    if (!targetDemande) throw new Error('Demande introuvable');
    if (targetDemande.statut !== 'ouverte') throw new Error('Cette demande a déjà été prise en charge');

    const creditsGain = calculateCreditsForMatiere(targetDemande.matiere, duree);

    const newSession: Session = {
      id: `session_${Date.now()}`,
      demande_id: targetDemande.id,
      aidant_id: currentUser.id,
      aidant_nom: currentUser.nom,
      demandeur_id: targetDemande.auteur_id,
      demandeur_nom: targetDemande.auteur_nom,
      duree_min: duree,
      matiere: targetDemande.matiere,
      mode: targetDemande.mode,
      lien_video: lienVideo || targetDemande.lien_video,
      audio_uri: targetDemande.audio_uri,
      credits_verses: creditsGain,
      date: new Date().toISOString(),
      statut: 'en_cours',
    };

    // Update demande status to en_cours
    const updatedDemandes: Demande[] = demandes.map((d) =>
      d.id === demandeId
        ? {
            ...d,
            statut: 'en_cours',
            aidant_id: currentUser.id,
            aidant_nom: currentUser.nom,
            session_id: newSession.id,
            lien_video: lienVideo || d.lien_video,
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

  const completeSession = async (sessionId: string): Promise<void> => {
    const sessionToComplete = sessions.find((s) => s.id === sessionId) || activeSession;
    if (!sessionToComplete) return;

    const completedSession: Session = {
      ...sessionToComplete,
      statut: 'terminee',
    };

    // Credit reward to tutor
    const tutorId = completedSession.aidant_id;
    const creditGain = completedSession.credits_verses;

    const updatedUsers = users.map((u) => {
      if (u.id === tutorId) {
        return {
          ...u,
          credits: u.credits + creditGain,
          nb_sessions_donnees: u.nb_sessions_donnees + 1,
        };
      }
      return u;
    });

    // Update active user state if current user is the tutor
    if (currentUser && currentUser.id === tutorId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              credits: prev.credits + creditGain,
              nb_sessions_donnees: prev.nb_sessions_donnees + 1,
            }
          : null
      );
    }

    const updatedSessions = sessions.map((s) => (s.id === sessionId ? completedSession : s));
    const updatedDemandes = demandes.map((d) =>
      d.id === completedSession.demande_id ? { ...d, statut: 'terminee' as const } : d
    );

    setUsers(updatedUsers);
    setSessions(updatedSessions);
    setDemandes(updatedDemandes);
    setActiveSession(null);
    setPendingRatingSession(completedSession);

    await StorageService.saveUsers(updatedUsers);
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

    const updatedSessions = sessions.map((s) =>
      s.id === sessionId ? { ...s, note_recue: rating, commentaire } : s
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
        isLoading,
        setCurrentMode,
        registerUser,
        updateUserRolePrefere,
        switchUser,
        validateQuizForMatiere,
        createDemande,
        takeDemande,
        completeSession,
        submitRating,
        cancelDemande,
        resetDatabase,
        getFilteredDemandesForCurrentUser,
        calculateCreditsForMatiere,
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
