import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AudioPlayerWidget } from '../components/AudioWidget';
import { SuccessModal } from '../components/SuccessModal';
import { Demande, PropositionAide } from '../types';

interface DemandeDetailScreenProps {
  demande: Demande;
  onBack: () => void;
  onSessionStarted: () => void;
}

const DURATIONS = [5, 10, 15, 20, 25, 30];

export const DemandeDetailScreen: React.FC<DemandeDetailScreenProps> = ({
  demande,
  onBack,
  onSessionStarted,
}) => {
  const {
    currentUser,
    proposeAide,
    acceptProposition,
    simulateTutorProposition,
    cancelDemande,
    calculateCreditsForMatiere,
  } = useApp();

  // Tutor Proposal State
  const [tutorDuration, setTutorDuration] = useState<number>(15);
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [videoLink, setVideoLink] = useState<string>('https://meet.google.com/linkup-aide');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState<boolean>(false);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
  const [showProposalSuccessModal, setShowProposalSuccessModal] = useState<boolean>(false);

  if (!currentUser) return null;

  const isAuthor = demande.auteur_id === currentUser.id;
  const isTutorEligible =
    !isAuthor &&
    currentUser.quiz_valide_par_matiere[demande.matiere] &&
    currentUser.statut_tuteur === 'actif' &&
    demande.statut === 'ouverte';

  const proposalsList = demande.propositions || [];
  const myExistingProposal = proposalsList.find((p) => p.aidant_id === currentUser.id);

  // Tutor submits a time proposal
  const handleSubmitProposal = async () => {
    if (demande.mode === 'video' && !videoLink.trim()) {
      Alert.alert('Lien requis', "Veuillez fournir un lien d'appel vidéo (Meet, WhatsApp, Jitsi).");
      return;
    }

    try {
      setIsSubmittingProposal(true);
      await proposeAide(
        demande.id,
        tutorDuration,
        tutorMessage.trim() || undefined,
        demande.mode === 'video' ? videoLink.trim() : undefined
      );

      setShowProposalSuccessModal(true);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Impossible d'envoyer la proposition.");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Requester chooses a tutor among candidates
  const handleChooseTutor = async (prop: PropositionAide) => {
    try {
      setIsAcceptingId(prop.id);
      await acceptProposition(demande.id, prop.id);
      Alert.alert(
        'Tuteur sélectionné ! 🎉',
        `Tu as choisi ${prop.aidant_nom} pour t'expliquer (${prop.duree_proposee_min} min). La session démarre !`,
        [{ text: 'Accéder à la session', onPress: onSessionStarted }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de démarrer la session avec ce tuteur.');
    } finally {
      setIsAcceptingId(null);
    }
  };

  // Instant demo simulation
  const handleSimulateDemoProposal = async () => {
    try {
      await simulateTutorProposition(demande.id);
      Alert.alert(
        'Proposition reçue !',
        'Un tuteur certifié vient de te proposer son aide avec son estimation de temps.'
      );
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de simuler une proposition.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler la demande',
      'Es-tu sûr(e) de vouloir retirer cette demande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            await cancelDemande(demande.id);
            onBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.responsiveWrapper}>
        {/* Top Back Bar */}
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          <Text style={styles.backText}>Retour aux demandes</Text>
        </TouchableOpacity>

        {/* Main Details Card */}
        <Card style={styles.mainCard}>
          {/* Header Badges */}
          <View style={styles.headerBadgesRow}>
            <Badge label={demande.matiere} variant="primary" />
            <Badge label={demande.rubrique} variant="neutral" />
            <Badge
              label={demande.mode === 'audio' ? 'Message Audio' : 'Appel Vidéo'}
              variant={demande.mode === 'audio' ? 'primary' : 'info'}
              icon={
                <Ionicons
                  name={demande.mode === 'audio' ? 'mic' : 'videocam'}
                  size={14}
                  color={COLORS.primary}
                />
              }
            />
            <Badge
              label={
                demande.statut === 'ouverte'
                  ? 'Ouverte'
                  : demande.statut === 'en_cours'
                  ? 'En cours'
                  : demande.statut === 'terminee'
                  ? 'Terminée'
                  : 'Annulée'
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
          </View>

          <Text style={styles.authorTitle}>
            Question de {demande.auteur_nom}
          </Text>

          {/* Student meta info */}
          <View style={styles.studentInfoBox}>
            <View style={styles.studentInfoRow}>
              <Ionicons name="school" size={16} color={COLORS.primary} />
              <Text style={styles.studentInfoText}>
                {demande.auteur_ecole} • Classe de {demande.classe_demandeur}
              </Text>
            </View>
            <View style={[styles.studentInfoRow, { marginTop: 4 }]}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={[styles.studentInfoText, { color: COLORS.primary, fontWeight: '700' }]}>
                Disponibilité : {demande.creneau_horaire || '06h00 - 18h00'} (1h)
              </Text>
            </View>
            {demande.presentiel && (
              <View style={[styles.studentInfoRow, { marginTop: 4 }]}>
                <Ionicons name="location" size={16} color={COLORS.secondary} />
                <Text style={[styles.studentInfoText, { color: COLORS.secondary, fontWeight: '700' }]}>
                  Aide en présentiel requise (même établissement)
                </Text>
              </View>
            )}
          </View>

          {/* If Mode is AUDIO: Show Interactive Audio Player Widget */}
          {demande.mode === 'audio' && (
            <View style={styles.audioPlayerSection}>
              <Text style={styles.sectionHeading}>Enregistrement vocal de l'élève :</Text>
              <AudioPlayerWidget durationSec={demande.audio_duration_sec || 20} />
            </View>
          )}

          {/* Text Description */}
          {demande.description ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.sectionHeading}>Détail de la question :</Text>
              <Text style={styles.descriptionText}>{demande.description}</Text>
            </View>
          ) : null}

          {/* Attached Photo */}
          {demande.photo_uri && (
            <View style={styles.photoContainer}>
              <Text style={styles.sectionHeading}>Photo de l'exercice :</Text>
              <Image
                source={{ uri: demande.photo_uri }}
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          )}
        </Card>

        {/* =========================================================================
            SECTION 1 : DEMANDEUR — CHOIX DU TUTEUR PARMI LES PROPOSITIONS REÇUES
            ========================================================================= */}
        {isAuthor && demande.statut === 'ouverte' && (
          <Card style={styles.proposalsCard}>
            <View style={styles.proposalsHeaderRow}>
              <View>
                <Text style={styles.proposalsTitle}>
                  Propositions de tuteurs ({proposalsList.length}) 👥
                </Text>
                <Text style={styles.proposalsSubtitle}>
                  Choisis la personne dont tu veux recevoir les explications :
                </Text>
              </View>
            </View>

            {proposalsList.length === 0 ? (
              <View style={styles.emptyProposalsBox}>
                <Ionicons name="hourglass-outline" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyProposalsText}>
                  En attente de propositions de tuteurs certifiés...
                </Text>
                <Text style={styles.emptyProposalsSub}>
                  Chaque tuteur va estimer le temps qu'il lui faut pour répondre.
                </Text>
                <Button
                  title="⚡ Simuler une proposition de tuteur (Démo)"
                  variant="outline"
                  size="sm"
                  onPress={handleSimulateDemoProposal}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <View style={styles.proposalsList}>
                {proposalsList.map((prop) => {
                  const isBeingAccepted = isAcceptingId === prop.id;
                  const rewardCredits = calculateCreditsForMatiere(
                    demande.matiere,
                    prop.duree_proposee_min
                  );

                  return (
                    <Card key={prop.id} variant="flat" style={styles.proposalItemCard}>
                      <View style={styles.proposalTopRow}>
                        <View style={styles.proposalAvatar}>
                          <Text style={styles.proposalAvatarText}>
                            {prop.aidant_nom.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                            <Text style={styles.proposalTutorName}>{prop.aidant_nom}</Text>
                            <Badge
                              label={`⏱️ Propose ${prop.duree_proposee_min} min`}
                              variant="accent"
                              size="md"
                            />
                          </View>
                          <Text style={styles.proposalTutorSchool}>
                            Classe : {prop.aidant_classe} • {prop.aidant_ecole}
                          </Text>
                          <View style={styles.proposalMetaRow}>
                            <View style={styles.ratingPill}>
                              <Ionicons name="star" size={13} color={COLORS.accent} />
                              <Text style={styles.ratingPillText}>
                                {prop.aidant_note.toFixed(1)} / 5 ({prop.aidant_nb_sessions} sessions)
                              </Text>
                            </View>
                            <Text style={styles.proposalCreditsText}>
                              Gagne des crédits selon ta note ⭐
                            </Text>
                          </View>
                        </View>
                      </View>

                      {prop.message && (
                        <View style={styles.proposalMessageBox}>
                          <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.primary} />
                          <Text style={styles.proposalMessageText}>"{prop.message}"</Text>
                        </View>
                      )}

                      <Button
                        title="🤝 Choisir ce tuteur pour m'expliquer"
                        variant="secondary"
                        size="md"
                        loading={isBeingAccepted}
                        onPress={() => handleChooseTutor(prop)}
                        style={{ marginTop: 10 }}
                      />
                    </Card>
                  );
                })}

                <Button
                  title="+ Simuler une autre proposition (Démo)"
                  variant="ghost"
                  size="sm"
                  onPress={handleSimulateDemoProposal}
                  style={{ marginTop: 6 }}
                />
              </View>
            )}
          </Card>
        )}

        {/* =========================================================================
            SECTION 2 : TUTEUR — PROPOSER LE TEMPS NÉCESSAIRE POUR EXPLIQUER
            ========================================================================= */}
        {!isAuthor && isTutorEligible && (
          <Card variant="highlight" style={styles.actionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="time" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.actionCardTitle}>Proposer mon aide à l'élève 🤝</Text>
            </View>
            <Text style={styles.actionCardSubtitle}>
              Indique le temps que tu estimes nécessaire pour lui expliquer ce qui est demandé :
            </Text>

            {myExistingProposal && (
              <View style={styles.existingProposalBanner}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
                <Text style={styles.existingProposalText}>
                  Tu as déjà proposé <Text style={{ fontWeight: '800' }}>{myExistingProposal.duree_proposee_min} min</Text>. En attente du choix de {demande.auteur_nom}.
                </Text>
              </View>
            )}

            {/* Time Estimation selector (Rule: Seul celui qui aide propose le temps) */}
            <Text style={styles.fieldLabel}>Temps estimé pour expliquer :</Text>
            <View style={styles.durationsRow}>
              {DURATIONS.map((d) => {
                const isSelected = tutorDuration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setTutorDuration(d)}
                    style={[
                      styles.durationChip,
                      isSelected && styles.durationChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        isSelected && styles.durationChipTextSelected,
                      ]}
                    >
                      {d} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional message from tutor */}
            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
              Message ou précision pour l'élève (optionnel) :
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Je suis dispo maintenant, j'ai eu 18 à ce contrôle..."
              placeholderTextColor={COLORS.textMuted}
              value={tutorMessage}
              onChangeText={setTutorMessage}
            />

            {/* Video link input if mode is video */}
            {demande.mode === 'video' && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldLabel}>Lien d'appel vidéo (Meet, WhatsApp, Jitsi) :</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor={COLORS.textMuted}
                  value={videoLink}
                  onChangeText={setVideoLink}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Credit reward info based on rating rule */}
            <View style={styles.creditsRewardRow}>
              <Ionicons name="sparkles" size={18} color={COLORS.accent} />
              <Text style={styles.creditsRewardText}>
                Tes crédits seront calculés d'après la note attribuée par l'élève à ton explication (note élevée = plus de crédits) !
              </Text>
            </View>

            <Button
              title={myExistingProposal ? "Modifier ma proposition d'aide" : `🚀 Envoyer ma proposition (${tutorDuration} min)`}
              size="lg"
              variant="secondary"
              loading={isSubmittingProposal}
              onPress={handleSubmitProposal}
              style={{ marginTop: 14 }}
            />
          </Card>
        )}

        {/* IF REQUEST IS ALREADY IN PROGRESS */}
        {demande.statut === 'en_cours' && (
          <Card variant="flat" style={styles.inProgressCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="play-circle" size={22} color={COLORS.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.inProgressTitle}>Session d'entraide en cours</Text>
            </View>
            <Text style={styles.inProgressDesc}>
              Tuteur sélectionné : <Text style={{ fontWeight: '700' }}>{demande.aidant_nom || 'Attribué'}</Text> ({demande.duree_proposee || 15} min)
            </Text>
            <Button
              title="Accéder à l'écran de session active"
              size="md"
              onPress={onSessionStarted}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* IF REQUEST IS ALREADY FINISHED */}
        {demande.statut === 'terminee' && (
          <Card variant="flat" style={styles.finishedCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.finishedTitle}>Demande clôturée</Text>
            </View>
            <Text style={styles.finishedDesc}>
              Cette session a été terminée avec succès par {demande.aidant_nom || 'le tuteur'}.
            </Text>
          </Card>
        )}

        {/* IF CURRENT USER IS AUTHOR */}
        {isAuthor && demande.statut === 'ouverte' && (
          <Button
            title="Annuler ma demande"
            variant="danger"
            size="md"
            onPress={handleCancel}
            style={{ marginTop: 20 }}
          />
        )}
      </View>

      {/* Animated Validation Modal for Tutor Proposal */}
      <SuccessModal
        visible={showProposalSuccessModal}
        title="Proposition d'aide envoyée ! 🎉"
        subtitle={`Tu as proposé ${tutorDuration} min d'explication à ${demande.auteur_nom} sur son créneau (${demande.creneau_horaire || 'disponible'}). L'élève va pouvoir choisir son tuteur !`}
        buttonText="Retour aux demandes"
        badgeText={`⏱️ Proposé : ${tutorDuration} min`}
        secondaryBadgeText={`📅 ${demande.creneau_horaire || 'Créneau demandé'}`}
        onClose={() => {
          setShowProposalSuccessModal(false);
          onBack();
        }}
      />
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
    maxWidth: 720,
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    marginLeft: 6,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  mainCard: {
    marginBottom: 16,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  authorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  studentInfoBox: {
    backgroundColor: COLORS.cardAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentInfoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 8,
  },
  audioPlayerSection: {
    marginVertical: 6,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    backgroundColor: COLORS.cardAlt,
    padding: 14,
    borderRadius: 12,
  },
  photoContainer: {
    marginTop: 14,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 6,
  },

  // Proposals Received Card (Requester View)
  proposalsCard: {
    padding: 16,
    marginBottom: 16,
  },
  proposalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  proposalsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  proposalsSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyProposalsBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 14,
  },
  emptyProposalsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyProposalsSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  proposalsList: {
    gap: 12,
  },
  proposalItemCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  proposalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proposalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  proposalAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  proposalTutorName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  proposalTutorSchool: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  proposalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  proposalCreditsText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  proposalMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  proposalMessageText: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    flex: 1,
  },

  // Action Section (Tutor View)
  actionCard: {
    padding: 16,
    marginBottom: 16,
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  existingProposalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondaryLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  existingProposalText: {
    fontSize: 12,
    color: COLORS.secondary,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  durationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  durationChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  durationChipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  creditsRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  creditsRewardText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#78350F',
    fontWeight: '600',
  },
  inProgressCard: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
  },
  inProgressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  inProgressDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  finishedCard: {
    backgroundColor: COLORS.cardAlt,
    padding: 16,
    borderRadius: 16,
  },
  finishedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  finishedDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
