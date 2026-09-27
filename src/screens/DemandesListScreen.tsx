import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Demande, MatiereConfig, StatutDemande } from '../types';

interface DemandesListScreenProps {
  onSelectDemande: (demande: Demande) => void;
  onCreateDemande: (preselectedMatiere?: string, preselectedRubrique?: string) => void;
  onOpenTutorQuizzes: () => void;
}

type SortOrder = 'recent' | 'duration_asc' | 'duration_desc';
type RequesterTab = 'matieres' | 'history';

export const DemandesListScreen: React.FC<DemandesListScreenProps> = ({
  onSelectDemande,
  onCreateDemande,
  onOpenTutorQuizzes,
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const {
    currentUser,
    currentMode,
    demandes,
    matieres,
    getFilteredDemandesForCurrentUser,
    calculateCreditsForMatiere,
    activeSession,
  } = useApp();

  // Navigation flow state:
  // selectedMatiere: null means user is on "Choix de la matière" screen
  // string means user is inside "Vue des questions" for that subject
  const [selectedMatiereNom, setSelectedMatiereNom] = useState<string | null>(null);
  const [selectedRubrique, setSelectedRubrique] = useState<string>('all'); // "Tri par leçon"
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Requester Sub-tab: "Parcourir par matière" vs "Historique de mes requêtes"
  const [requesterTab, setRequesterTab] = useState<RequesterTab>('matieres');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');

  if (!currentUser) return null;

  const isTutorMode = currentMode === 'aide';
  const isSuspended = currentUser.statut_tuteur === 'suspendu';

  // Rule: ONLY open requests are available for tutors. Answered/In-progress requests are strictly hidden.
  let availableTutorDemandes: Demande[] = [];
  if (isTutorMode) {
    availableTutorDemandes = getFilteredDemandesForCurrentUser();
  }

  // Requester's submitted requests history
  const mySubmittedDemandes: Demande[] = demandes.filter(
    (d) => d.auteur_id === currentUser.id
  );

  // Count questions per subject (strictly open for tutor, all for requester)
  const getQuestionCountForMatiere = (matiereNom: string): number => {
    if (isTutorMode) {
      if (matiereNom === 'all') return availableTutorDemandes.length;
      return availableTutorDemandes.filter(
        (d) => d.matiere.toLowerCase() === matiereNom.toLowerCase()
      ).length;
    } else {
      const openRequests = demandes.filter((d) => d.statut === 'ouverte');
      if (matiereNom === 'all') return openRequests.length;
      return openRequests.filter(
        (d) => d.matiere.toLowerCase() === matiereNom.toLowerCase()
      ).length;
    }
  };

  const currentMatiereObj: MatiereConfig | undefined = matieres.find(
    (m) => m.nom.toLowerCase() === (selectedMatiereNom || '').toLowerCase()
  );

  // Filtered list in "Vue des questions"
  let questionsList = isTutorMode
    ? availableTutorDemandes
    : demandes.filter((d) => d.statut === 'ouverte');

  if (selectedMatiereNom && selectedMatiereNom !== 'all') {
    questionsList = questionsList.filter(
      (d) => d.matiere.toLowerCase() === selectedMatiereNom.toLowerCase()
    );
  }

  // Sub-filter: "Tri par leçon" (Rubrique)
  if (selectedRubrique !== 'all') {
    questionsList = questionsList.filter(
      (d) => d.rubrique.toLowerCase() === selectedRubrique.toLowerCase()
    );
  }

  // Search query filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    questionsList = questionsList.filter(
      (d) =>
        d.description?.toLowerCase().includes(q) ||
        d.rubrique.toLowerCase().includes(q) ||
        d.matiere.toLowerCase().includes(q) ||
        d.auteur_nom.toLowerCase().includes(q)
    );
  }

  // Sort order
  if (sortOrder === 'duration_asc') {
    questionsList.sort((a, b) => (a.duree_proposee || 0) - (b.duree_proposee || 0));
  } else if (sortOrder === 'duration_desc') {
    questionsList.sort((a, b) => (b.duree_proposee || 0) - (a.duree_proposee || 0));
  } else {
    // recent
    questionsList.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Filtered submitted history list
  let displayedHistory = mySubmittedDemandes;
  if (historyStatusFilter !== 'all') {
    displayedHistory = displayedHistory.filter((d) => d.statut === historyStatusFilter);
  }
  displayedHistory.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const validatedSubjects = Object.entries(currentUser.quiz_valide_par_matiere)
    .filter(([_, val]) => val)
    .map(([key]) => key);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)}j`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.responsiveWrapper}>
        {/* Active Session Alert Banner if one is running */}
        {activeSession && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              const targetDemande = demandes.find((d) => d.id === activeSession.demande_id);
              if (targetDemande) onSelectDemande(targetDemande);
            }}
            style={styles.activeSessionBanner}
          >
            <View style={styles.activeSessionRow}>
              <View style={styles.pulseDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeSessionTitle}>Session en cours active !</Text>
                <Text style={styles.activeSessionSub}>
                  {activeSession.matiere} • {activeSession.aidant_nom} & {activeSession.demandeur_nom}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* SUSPENDED BANNER */}
        {isTutorMode && isSuspended && (
          <Card variant="flat" style={styles.suspendedBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="warning" size={22} color={COLORS.danger} style={{ marginRight: 8 }} />
              <Text style={styles.suspendedTitle}>Compte Tuteur Suspendu</Text>
            </View>
            <Text style={styles.suspendedDesc}>
              Suite à des évaluations insuffisantes (note moyenne &lt; 2.5 ou avis négatifs répétés), ton profil tuteur est temporairement suspendu.
            </Text>
          </Card>
        )}

        {/* NO QUIZ VALIDATED BANNER */}
        {isTutorMode && !isSuspended && validatedSubjects.length === 0 && (
          <Card variant="highlight" style={styles.noQuizBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="ribbon" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.noQuizTitle}>Débloque tes matières d'entraide</Text>
            </View>
            <Text style={styles.noQuizDesc}>
              Pour voir et accepter les demandes d'élèves, valide le mini-quiz de 3 questions (niveau inférieur à ta classe {currentUser.classe}).
            </Text>
            <Button
              title="Passer mes quiz tuteur"
              size="sm"
              onPress={onOpenTutorQuizzes}
              style={{ marginTop: 10 }}
            />
          </Card>
        )}

        {/* REQUESTER MODE NAVIGATION SUB-TABS: "Parcourir" vs "Historique de mes requêtes" */}
        {!isTutorMode && (
          <View style={styles.requesterTabRow}>
            <TouchableOpacity
              onPress={() => {
                setRequesterTab('matieres');
                setSelectedMatiereNom(null);
              }}
              style={[
                styles.requesterTabBtn,
                requesterTab === 'matieres' && styles.requesterTabBtnActive,
              ]}
            >
              <Ionicons
                name="grid"
                size={16}
                color={requesterTab === 'matieres' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.requesterTabText,
                  requesterTab === 'matieres' && styles.requesterTabTextActive,
                ]}
              >
                Parcourir par matière
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRequesterTab('history')}
              style={[
                styles.requesterTabBtn,
                requesterTab === 'history' && styles.requesterTabBtnActive,
              ]}
            >
              <Ionicons
                name="time"
                size={16}
                color={requesterTab === 'history' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.requesterTabText,
                  requesterTab === 'history' && styles.requesterTabTextActive,
                ]}
              >
                Historique de mes requêtes ({mySubmittedDemandes.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* =========================================================================
            VIEW A: HISTORIQUE DES REQUÊTES SOUMISES (For Requester Mode)
            ========================================================================= */}
        {!isTutorMode && requesterTab === 'history' ? (
          <View>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.mainStepTitle}>Historique de mes requêtes 📋</Text>
                <Text style={styles.mainStepSubtitle}>
                  Suis en temps réel les tuteurs qui répondent à tes questions :
                </Text>
              </View>
              <Button
                title="+ Poser"
                size="sm"
                onPress={() => onCreateDemande()}
              />
            </View>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {[
                { id: 'all', label: 'Toutes' },
                { id: 'ouverte', label: 'En attente' },
                { id: 'en_cours', label: 'En cours' },
                { id: 'terminee', label: 'Terminées' },
                { id: 'annulee', label: 'Annulées' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setHistoryStatusFilter(filter.id)}
                  style={[
                    styles.filterChip,
                    historyStatusFilter === filter.id && styles.filterChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      historyStatusFilter === filter.id && styles.filterChipTextSelected,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* History Cards */}
            {displayedHistory.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={38} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyStateTitle}>Aucune requête dans cet état</Text>
                <Text style={styles.emptyStateDesc}>
                  Tu n'as pas de demande {historyStatusFilter !== 'all' ? `"${historyStatusFilter}"` : 'enregistrée'}.
                </Text>
                <Button
                  title="Poser une question maintenant"
                  size="md"
                  onPress={() => onCreateDemande()}
                  style={{ marginTop: 14 }}
                />
              </View>
            ) : (
              <View style={styles.cardsContainer}>
                {displayedHistory.map((demande) => (
                  <Card
                    key={demande.id}
                    onPress={() => onSelectDemande(demande)}
                    style={styles.demandeCard}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.subjectRow}>
                        <Badge label={demande.matiere} variant="primary" />
                        <Badge label={demande.rubrique} variant="neutral" />
                      </View>
                      <Badge
                        label={
                          demande.statut === 'ouverte'
                            ? 'En attente de tuteur'
                            : demande.statut === 'en_cours'
                            ? 'En cours'
                            : demande.statut === 'terminee'
                            ? 'Terminée ✓'
                            : 'Annulée'
                        }
                        variant={
                          demande.statut === 'ouverte'
                            ? 'accent'
                            : demande.statut === 'en_cours'
                            ? 'secondary'
                            : demande.statut === 'terminee'
                            ? 'primary'
                            : 'danger'
                        }
                        size="sm"
                      />
                    </View>

                    {/* Description or Audio note */}
                    {demande.description ? (
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {demande.description}
                      </Text>
                    ) : null}

                    {/* Format Badge & Tutor / Proposals info */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name={demande.mode === 'audio' ? 'mic' : 'videocam'}
                          size={15}
                          color={COLORS.primary}
                        />
                        <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: '700' }]}>
                          {demande.mode === 'audio' ? 'Message Audio' : 'Appel Vidéo'}
                          {demande.duree_proposee ? ` • ${demande.duree_proposee} min` : ''}
                        </Text>
                      </View>

                      {demande.creneau_horaire && (
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.metaText}>{demande.creneau_horaire}</Text>
                        </View>
                      )}

                      {demande.statut === 'ouverte' && (demande.propositions || []).length > 0 && (
                        <View style={styles.metaItem}>
                          <Ionicons name="people" size={15} color={COLORS.secondary} />
                          <Text style={[styles.metaText, { color: COLORS.secondary, fontWeight: '700' }]}>
                            {(demande.propositions || []).length} proposition(s) reçue(s) !
                          </Text>
                        </View>
                      )}

                      {demande.aidant_nom && (
                        <View style={styles.metaItem}>
                          <Ionicons name="person-circle" size={15} color={COLORS.secondary} />
                          <Text style={[styles.metaText, { color: COLORS.secondary, fontWeight: '700' }]}>
                            Tuteur : {demande.aidant_nom}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.timeAgoText}>{formatTimeAgo(demande.created_at)}</Text>
                      <View style={styles.actionHint}>
                        <Text style={styles.actionHintText}>Voir le suivi</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        ) : selectedMatiereNom === null ? (
          // =========================================================================
          // VIEW B: CHOIX DE LA MATIÈRE (Diagram Block 1)
          // =========================================================================
          <View>
            <View style={styles.stepHeaderBox}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>Étape 1</Text>
              </View>
              <Text style={styles.mainStepTitle}>Choix de la matière 📚</Text>
              <Text style={styles.mainStepSubtitle}>
                {isTutorMode
                  ? 'Sélectionne une matière pour voir les élèves en attente que tu peux aider :'
                  : 'Sélectionne une matière pour voir les questions ou en poser une :'}
              </Text>
            </View>

            {/* "Toutes les matières" Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMatiereNom('all');
                setSelectedRubrique('all');
              }}
              style={styles.allSubjectsCard}
            >
              <View style={styles.allSubjectsLeft}>
                <View style={styles.allSubjectsIcon}>
                  <Ionicons name="apps" size={22} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.allSubjectsTitle}>Toutes les matières confondues</Text>
                  <Text style={styles.allSubjectsSub}>
                    {isTutorMode
                      ? `${availableTutorDemandes.length} demande(s) disponible(s)`
                      : 'Explorer toutes les questions'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Grid of Matieres (Responsive 1 or 2 columns) */}
            <View style={[styles.matieresGrid, isLargeScreen && styles.matieresGridLarge]}>
              {matieres.map((mat) => {
                const count = getQuestionCountForMatiere(mat.nom);
                const isValidated = !!currentUser.quiz_valide_par_matiere[mat.nom];
                const isHighCoeff = mat.coefficient > 1.0;

                return (
                  <TouchableOpacity
                    key={mat.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedMatiereNom(mat.nom);
                      setSelectedRubrique('all');
                    }}
                    style={[
                      styles.matiereSelectCard,
                      isLargeScreen && styles.matiereSelectCardLarge,
                      isTutorMode && isValidated && styles.matiereCardTutorValid,
                    ]}
                  >
                    <View style={styles.matiereCardHeader}>
                      <View style={[styles.matiereCardIcon, { backgroundColor: mat.color + '20' }]}>
                        <Ionicons name="book" size={22} color={mat.color} />
                      </View>
                      <View style={styles.cardBadgesGroup}>
                        {isHighCoeff && (
                          <Badge label="x1.5" variant="accent" size="sm" />
                        )}
                        {isTutorMode && (
                          <Badge
                            label={isValidated ? 'Certifié ✓' : 'Non certifié'}
                            variant={isValidated ? 'secondary' : 'neutral'}
                            size="sm"
                          />
                        )}
                      </View>
                    </View>

                    <Text style={styles.matiereCardName}>{mat.nom}</Text>
                    <Text style={styles.matiereCardRubriques} numberOfLines={1}>
                      {mat.rubriques.slice(0, 3).join(' • ')}
                    </Text>

                    <View style={styles.matiereCardFooter}>
                      <View style={styles.countBadge}>
                        <Ionicons
                          name="help-circle"
                          size={14}
                          color={count > 0 ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text
                          style={[
                            styles.countBadgeText,
                            count > 0 && { color: COLORS.primary, fontWeight: '700' },
                          ]}
                        >
                          {count} disponible{count > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward-circle" size={22} color={mat.color} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!isTutorMode && (
              <Button
                title="+ Poser une nouvelle question"
                size="lg"
                onPress={() => onCreateDemande()}
                style={{ marginTop: 24, marginBottom: 10 }}
              />
            )}
          </View>
        ) : (
          // =========================================================================
          // VIEW C: VUE DES QUESTIONS & TRI PAR LEÇON (Diagram Blocks 2 & 3)
          // =========================================================================
          <View>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => {
                setSelectedMatiereNom(null);
                setSelectedRubrique('all');
                setSearchQuery('');
              }}
              style={styles.backToSubjectsBtn}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backToSubjectsText}>← Choisir une autre matière</Text>
            </TouchableOpacity>

            {/* Subject Header Banner */}
            <Card
              style={[
                styles.subjectHeaderCard,
                currentMatiereObj ? { borderLeftColor: currentMatiereObj.color, borderLeftWidth: 5 } : undefined,
              ]}
            >
              <View style={styles.subjectHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Badge
                      label={selectedMatiereNom === 'all' ? 'Toutes les matières' : selectedMatiereNom}
                      variant="primary"
                    />
                    {currentMatiereObj?.coefficient && currentMatiereObj.coefficient > 1.0 && (
                      <Badge label="x1.5 crédits" variant="accent" size="sm" />
                    )}
                  </View>
                  <Text style={styles.subjectBannerTitle}>Vue des questions 💬</Text>
                  <Text style={styles.subjectBannerSub}>
                    {questionsList.length} demande{questionsList.length > 1 ? 's' : ''} ouverte{questionsList.length > 1 ? 's' : ''}
                  </Text>
                </View>

                {!isTutorMode && (
                  <Button
                    title="+ Poser"
                    size="sm"
                    onPress={() => onCreateDemande(selectedMatiereNom !== 'all' ? selectedMatiereNom : undefined)}
                  />
                )}
              </View>
            </Card>

            {/* ========================================================
                SUB-BRANCH: TRI PAR LEÇON / RUBRIQUE (Diagram: Tri par leçon)
                ======================================================== */}
            {currentMatiereObj && (
              <View style={styles.triSectionBox}>
                <View style={styles.triSectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="funnel" size={16} color={COLORS.primary} />
                    <Text style={styles.triSectionTitle}>Tri par leçon / Chapitre :</Text>
                  </View>
                  <Text style={styles.triSectionCount}>
                    {selectedRubrique === 'all' ? 'Tous chapitres' : selectedRubrique}
                  </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rubriquesScroll}>
                  <TouchableOpacity
                    onPress={() => setSelectedRubrique('all')}
                    style={[
                      styles.rubriquePill,
                      selectedRubrique === 'all' && styles.rubriquePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rubriquePillText,
                        selectedRubrique === 'all' && styles.rubriquePillTextActive,
                      ]}
                    >
                      Toutes les leçons
                    </Text>
                  </TouchableOpacity>

                  {currentMatiereObj.rubriques.map((rub) => {
                    const isSelected = selectedRubrique.toLowerCase() === rub.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={rub}
                        onPress={() => setSelectedRubrique(rub)}
                        style={[
                          styles.rubriquePill,
                          isSelected && styles.rubriquePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rubriquePillText,
                            isSelected && styles.rubriquePillTextActive,
                          ]}
                        >
                          {rub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Search & Sort Controls */}
            <View style={styles.searchAndSortRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par mot-clé..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (sortOrder === 'recent') setSortOrder('duration_asc');
                  else if (sortOrder === 'duration_asc') setSortOrder('duration_desc');
                  else setSortOrder('recent');
                }}
                style={styles.sortButton}
              >
                <Ionicons name="swap-vertical" size={16} color={COLORS.primary} />
                <Text style={styles.sortButtonText}>
                  {sortOrder === 'recent'
                    ? 'Plus récentes'
                    : sortOrder === 'duration_asc'
                    ? 'Durée courte'
                    : 'Durée longue'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of Question Cards */}
            {questionsList.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name={isTutorMode ? 'file-tray' : 'help-buoy'}
                    size={42}
                    color={COLORS.textMuted}
                  />
                </View>
                <Text style={styles.emptyStateTitle}>Aucune demande ouverte</Text>
                <Text style={styles.emptyStateDesc}>
                  {isTutorMode
                    ? `Toutes les demandes de cette leçon ont été prises en charge.`
                    : `Tu n'as pas encore posé de question pour cette leçon.`}
                </Text>
                {!isTutorMode ? (
                  <Button
                    title={`+ Poser une question en ${selectedMatiereNom}`}
                    size="md"
                    onPress={() =>
                      onCreateDemande(
                        selectedMatiereNom !== 'all' ? selectedMatiereNom : undefined,
                        selectedRubrique !== 'all' ? selectedRubrique : undefined
                      )
                    }
                    style={{ marginTop: 14 }}
                  />
                ) : (
                  <Button
                    title="Gérer mes certifications matières"
                    variant="outline"
                    size="md"
                    onPress={onOpenTutorQuizzes}
                    style={{ marginTop: 14 }}
                  />
                )}
              </View>
            ) : (
              <View style={styles.cardsContainer}>
                {questionsList.map((demande) => {
                  const myProp = (demande.propositions || []).find((p) => p.aidant_id === currentUser.id);
                  const propCount = (demande.propositions || []).length;
                  const matObj = matieres.find((m) => m.nom.toLowerCase() === demande.matiere.toLowerCase());
                  const maxReward = matObj && matObj.coefficient > 1.0 ? 37.5 : 25;

                  return (
                    <Card
                      key={demande.id}
                      onPress={() => onSelectDemande(demande)}
                      style={styles.demandeCard}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.subjectRow}>
                          <Badge label={demande.matiere} variant="primary" />
                          <Badge label={demande.rubrique} variant="neutral" />
                        </View>
                        {isTutorMode ? (
                          myProp ? (
                            <Badge label={`Proposé (${myProp.duree_proposee_min} min) ✓`} variant="secondary" size="sm" />
                          ) : (
                            <View style={styles.rewardPill}>
                              <Ionicons name="sparkles" size={13} color={COLORS.accent} />
                              <Text style={styles.rewardText}>Max {maxReward} pts</Text>
                            </View>
                          )
                        ) : (
                          <Badge
                            label={propCount > 0 ? `${propCount} proposition(s)` : 'Ouverte'}
                            variant={propCount > 0 ? 'secondary' : 'accent'}
                            size="sm"
                          />
                        )}
                      </View>

                      {/* Description */}
                      {demande.description ? (
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {demande.description}
                        </Text>
                      ) : null}

                      {/* Meta information tags */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.metaText}>
                            {demande.auteur_nom} ({demande.classe_demandeur})
                          </Text>
                        </View>

                        <View style={styles.metaItem}>
                          <Ionicons name="school-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.metaText}>{demande.auteur_ecole}</Text>
                        </View>

                        {/* Format is strictly audio or video */}
                        <View style={styles.metaItem}>
                          <Ionicons
                            name={demande.mode === 'audio' ? 'mic' : 'videocam'}
                            size={14}
                            color={COLORS.primary}
                          />
                          <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: '700' }]}>
                            {demande.mode === 'audio' ? 'Audio' : 'Vidéo'}
                            {demande.duree_proposee ? ` • ${demande.duree_proposee} min` : propCount > 0 ? ` • ${propCount} offre(s)` : ''}
                          </Text>
                        </View>

                        {demande.creneau_horaire && (
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.secondary} />
                            <Text style={[styles.metaText, { color: COLORS.secondary, fontWeight: '700' }]}>
                              {demande.creneau_horaire}
                            </Text>
                          </View>
                        )}

                        {demande.presentiel && (
                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
                            <Text style={[styles.metaText, { color: COLORS.secondary, fontWeight: '700' }]}>
                              Présentiel
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardFooter}>
                        <Text style={styles.timeAgoText}>{formatTimeAgo(demande.created_at)}</Text>
                        <View style={styles.actionHint}>
                          <Text style={styles.actionHintText}>
                            {isTutorMode ? 'Proposer mon aide' : 'Voir les propositions'}
                          </Text>
                          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  activeSessionBanner: {
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.md,
  },
  activeSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  activeSessionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  activeSessionSub: {
    color: '#ECFDF5',
    fontSize: 12,
  },
  suspendedBanner: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
    borderWidth: 1,
    marginBottom: 14,
  },
  suspendedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.danger,
  },
  suspendedDesc: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  noQuizBanner: {
    marginBottom: 14,
  },
  noQuizTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  noQuizDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Requester Sub-Tabs
  requesterTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  requesterTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  requesterTabBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  requesterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  requesterTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  // Flow Step 1: Choix de la matière
  stepHeaderBox: {
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  mainStepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  mainStepSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  allSubjectsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  allSubjectsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  allSubjectsIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  allSubjectsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  allSubjectsSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  matieresGrid: {
    gap: 12,
  },
  matieresGridLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  matiereSelectCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  matiereSelectCardLarge: {
    width: '48.5%',
  },
  matiereCardTutorValid: {
    borderColor: COLORS.secondary,
  },
  matiereCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matiereCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgesGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  matiereCardName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  matiereCardRubriques: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  matiereCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Flow Step 2: Vue des questions & Tri par leçon
  backToSubjectsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backToSubjectsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  subjectHeaderCard: {
    padding: 16,
    marginBottom: 14,
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  subjectBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  triSectionBox: {
    marginBottom: 14,
  },
  triSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  triSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  triSectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  rubriquesScroll: {
    flexDirection: 'row',
  },
  rubriquePill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  rubriquePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rubriquePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  rubriquePillTextActive: {
    color: '#FFFFFF',
  },
  searchAndSortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 8,
    marginLeft: 6,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardsContainer: {
    gap: 10,
  },
  demandeCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeAgoText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
