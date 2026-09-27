import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Demande } from '../types';

interface DemandesListScreenProps {
  onSelectDemande: (demande: Demande) => void;
  onCreateDemande: () => void;
  onOpenTutorQuizzes: () => void;
}

export const DemandesListScreen: React.FC<DemandesListScreenProps> = ({
  onSelectDemande,
  onCreateDemande,
  onOpenTutorQuizzes,
}) => {
  const {
    currentUser,
    currentMode,
    demandes,
    getFilteredDemandesForCurrentUser,
    calculateCreditsForMatiere,
    activeSession,
  } = useApp();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  if (!currentUser) return null;

  const isTutorMode = currentMode === 'aide';
  const isSuspended = currentUser.statut_tuteur === 'suspendu';

  // Determine list of requests to display
  let displayedDemandes: Demande[] = [];
  if (isTutorMode) {
    displayedDemandes = getFilteredDemandesForCurrentUser();
  } else {
    displayedDemandes = demandes.filter((d) => d.auteur_id === currentUser.id);
  }

  // Filter by subject if chosen
  if (selectedSubjectFilter !== 'all') {
    displayedDemandes = displayedDemandes.filter(
      (d) => d.matiere.toLowerCase() === selectedSubjectFilter.toLowerCase()
    );
  }

  const validatedSubjects = Object.entries(currentUser.quiz_valide_par_matiere)
    .filter(([_, val]) => val)
    .map(([key]) => key);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
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
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
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

      {/* SUSPENDED TUTOR BANNER */}
      {isTutorMode && isSuspended && (
        <Card variant="flat" style={styles.suspendedBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="warning" size={22} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.suspendedTitle}>Compte Tuteur Suspendu</Text>
          </View>
          <Text style={styles.suspendedDesc}>
            Suite à des évaluations insuffisantes (note moyenne &lt; 2.5 ou plusieurs avis négatifs), ton profil tuteur est temporairement masqué.
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
            Pour voir et accepter les demandes d'élèves, valide le mini-quiz de 3 questions (niveau inférieur à {currentUser.classe}).
          </Text>
          <Button
            title="Passer mes quiz tuteur"
            size="sm"
            onPress={onOpenTutorQuizzes}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* HEADER SECTION WITH COUNTERS */}
      <View style={styles.listHeaderRow}>
        <View>
          <Text style={styles.listSectionTitle}>
            {isTutorMode ? "Demandes d'entraide disponibles" : 'Mes demandes posées'}
          </Text>
          <Text style={styles.listSectionSubtitle}>
            {isTutorMode
              ? `Filtrées selon ton niveau (${currentUser.classe}) et matières validées`
              : 'Suis tes demandes et tes sessions en cours'}
          </Text>
        </View>

        {!isTutorMode && (
          <Button
            title="+ Poser"
            size="sm"
            onPress={onCreateDemande}
          />
        )}
      </View>

      {/* Subject Filter Chips if tutor has multiple subjects or in student mode */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          onPress={() => setSelectedSubjectFilter('all')}
          style={[
            styles.filterChip,
            selectedSubjectFilter === 'all' && styles.filterChipSelected,
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedSubjectFilter === 'all' && styles.filterChipTextSelected,
            ]}
          >
            Toutes ({isTutorMode ? displayedDemandes.length : demandes.filter(d => d.auteur_id === currentUser.id).length})
          </Text>
        </TouchableOpacity>

        {['Mathématiques', 'Physique-Chimie', 'Français', 'SVT', 'Anglais', 'Histoire-Géo', 'Philosophie'].map((mat) => (
          <TouchableOpacity
            key={mat}
            onPress={() => setSelectedSubjectFilter(mat)}
            style={[
              styles.filterChip,
              selectedSubjectFilter === mat && styles.filterChipSelected,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSubjectFilter === mat && styles.filterChipTextSelected,
              ]}
            >
              {mat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* LIST OF DEMANDE CARDS */}
      {displayedDemandes.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name={isTutorMode ? 'file-tray' : 'help-buoy'}
              size={42}
              color={COLORS.textMuted}
            />
          </View>
          <Text style={styles.emptyStateTitle}>
            {isTutorMode ? 'Aucune demande correspondante' : 'Aucune demande active'}
          </Text>
          <Text style={styles.emptyStateDesc}>
            {isTutorMode
              ? `Toutes les demandes ont été prises en charge ou nécessitent la validation de quiz supplémentaires.`
              : `Tu n'as pas encore posé de question. Clique sur le bouton ci-dessous pour demander de l'aide !`}
          </Text>
          {!isTutorMode ? (
            <Button
              title="Poser une question maintenant"
              size="md"
              onPress={onCreateDemande}
              style={{ marginTop: 14 }}
            />
          ) : (
            <Button
              title="Gérer mes matières & quiz"
              variant="outline"
              size="md"
              onPress={onOpenTutorQuizzes}
              style={{ marginTop: 14 }}
            />
          )}
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {displayedDemandes.map((demande) => {
            const creditsGain = calculateCreditsForMatiere(
              demande.matiere,
              demande.duree_proposee
            );

            return (
              <Card
                key={demande.id}
                onPress={() => onSelectDemande(demande)}
                style={styles.demandeCard}
              >
                {/* Card Top: Subject + Status / Reward */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.subjectRow}>
                    <Badge label={demande.matiere} variant="primary" />
                    <Badge label={demande.rubrique} variant="neutral" />
                  </View>
                  {isTutorMode ? (
                    <View style={styles.rewardPill}>
                      <Ionicons name="sparkles" size={13} color={COLORS.accent} />
                      <Text style={styles.rewardText}>+{creditsGain} pts</Text>
                    </View>
                  ) : (
                    <Badge
                      label={
                        demande.statut === 'ouverte'
                          ? 'Ouverte'
                          : demande.statut === 'en_cours'
                          ? 'En cours'
                          : 'Terminée'
                      }
                      variant={
                        demande.statut === 'ouverte'
                          ? 'accent'
                          : demande.statut === 'en_cours'
                          ? 'secondary'
                          : 'neutral'
                      }
                      size="sm"
                    />
                  )}
                </View>

                {/* Description */}
                {demande.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {demande.description}
                  </Text>
                )}

                {/* Meta info tags */}
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

                  <View style={styles.metaItem}>
                    <Ionicons
                      name={demande.mode === 'video' ? 'videocam-outline' : 'chatbubble-outline'}
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: '700' }]}>
                      {demande.mode === 'video' ? 'Vidéo' : 'Écrit'} • {demande.duree_proposee} min
                    </Text>
                  </View>

                  {demande.presentiel && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
                      <Text style={[styles.metaText, { color: COLORS.secondary, fontWeight: '700' }]}>
                        Présentiel
                      </Text>
                    </View>
                  )}
                </View>

                {/* Card Footer: Time & Action Hint */}
                <View style={styles.cardFooter}>
                  <Text style={styles.timeAgoText}>
                    {formatTimeAgo(demande.created_at)}
                  </Text>
                  <View style={styles.actionHint}>
                    <Text style={styles.actionHintText}>
                      {isTutorMode ? 'Prendre en charge' : 'Voir le statut'}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  listSectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    gap: 12,
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
