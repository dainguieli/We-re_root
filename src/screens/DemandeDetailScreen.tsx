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
import { Demande } from '../types';

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
    takeDemande,
    cancelDemande,
    calculateCreditsForMatiere,
  } = useApp();

  const [proposedDuration, setProposedDuration] = useState<number>(demande.duree_proposee);
  const [videoLink, setVideoLink] = useState<string>('https://meet.google.com/linkup-aide');
  const [isTaking, setIsTaking] = useState<boolean>(false);

  if (!currentUser) return null;

  const isAuthor = demande.auteur_id === currentUser.id;
  const isTutorEligible =
    !isAuthor &&
    currentUser.quiz_valide_par_matiere[demande.matiere] &&
    currentUser.statut_tuteur === 'actif' &&
    demande.statut === 'ouverte';

  const estimatedCredits = calculateCreditsForMatiere(demande.matiere, proposedDuration);

  const handleTakeDemande = async () => {
    if (demande.mode === 'video' && !videoLink.trim()) {
      Alert.alert('Lien requis', "Veuillez fournir un lien d'appel vidéo (Meet, WhatsApp, Jitsi).");
      return;
    }

    try {
      setIsTaking(true);
      await takeDemande(demande.id, proposedDuration, videoLink.trim());
      Alert.alert(
        'Session démarrée !',
        `Tu aides maintenant ${demande.auteur_nom}. Vous avez ${proposedDuration} min pour cette session.`,
        [{ text: 'Accéder à la session', onPress: onSessionStarted }]
      );
    } catch (e: any) {
      Alert.alert('Impossible de prendre en charge', e.message || 'Cette demande a déjà été prise en charge.');
    } finally {
      setIsTaking(false);
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
                  ? 'Disponible'
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
            Demande de {demande.auteur_nom}
          </Text>

          {/* Student meta info */}
          <View style={styles.studentInfoBox}>
            <View style={styles.studentInfoRow}>
              <Ionicons name="school" size={16} color={COLORS.primary} />
              <Text style={styles.studentInfoText}>
                {demande.auteur_ecole} • Classe de {demande.classe_demandeur}
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

        {/* =========================================================
            ACTION SECTION FOR TUTOR (Only if request is OPEN)
            ========================================================= */}
        {demande.statut === 'ouverte' && isTutorEligible && (
          <Card variant="highlight" style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>Prendre en charge cette demande 🤝</Text>
            <Text style={styles.actionCardSubtitle}>
              {demande.mode === 'audio'
                ? "Écoute l'audio de l'élève ci-dessus puis confirme ton accompagnement :"
                : "Prépare le lien vidéo pour démarrer l'appel avec l'élève :"}
            </Text>

            {/* Duration selector */}
            <Text style={styles.fieldLabel}>Durée de la session :</Text>
            <View style={styles.durationsRow}>
              {DURATIONS.map((d) => {
                const isSelected = proposedDuration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setProposedDuration(d)}
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

            {/* Video link input if mode is video */}
            {demande.mode === 'video' && (
              <View style={{ marginTop: 12 }}>
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

            {/* Credit reward info */}
            <View style={styles.creditsRewardRow}>
              <Ionicons name="sparkles" size={20} color={COLORS.accent} />
              <Text style={styles.creditsRewardText}>
                Tu gagneras <Text style={{ fontWeight: '800' }}>+{estimatedCredits} crédits</Text> à la fin de cette session !
              </Text>
            </View>

            <Button
              title={demande.mode === 'audio' ? "✅ Valider et démarrer l'entraide" : "📞 Démarrer la session vidéo"}
              size="lg"
              variant="secondary"
              loading={isTaking}
              onPress={handleTakeDemande}
              style={{ marginTop: 14 }}
            />
          </Card>
        )}

        {/* IF REQUEST IS ALREADY IN PROGRESS */}
        {demande.statut === 'en_cours' && (
          <Card variant="flat" style={styles.inProgressCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="time" size={22} color={COLORS.secondary} style={{ marginRight: 6 }} />
              <Text style={styles.inProgressTitle}>Session d'aide en cours</Text>
            </View>
            <Text style={styles.inProgressDesc}>
              Tuteur accompagnateur : <Text style={{ fontWeight: '700' }}>{demande.aidant_nom || 'Attribué'}</Text>
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
    paddingBottom: 40,
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
    marginBottom: 12,
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
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  creditsRewardText: {
    marginLeft: 8,
    fontSize: 13,
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
