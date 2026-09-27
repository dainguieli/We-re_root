import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SuccessModal } from '../components/SuccessModal';
import { Session } from '../types';

interface RatingScreenProps {
  session: Session;
  onDone: () => void;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({ session, onDone }) => {
  const { submitRating, calculateCreditsFromRatingForMatiere } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const calculatedCredits = calculateCreditsFromRatingForMatiere(session.matiere, rating);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await submitRating(session.id, rating, comment.trim());
      setShowSuccessModal(true);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'enregistrer l'évaluation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return 'Exceptionnel ! Explications parfaites 🌟';
      case 4:
        return 'Très bien ! Ça ma beaucoup aidé 👍';
      case 3:
        return 'Correct, problème résolu 🙂';
      case 2:
        return 'Moyen, explications peu claires 😕';
      case 1:
        return 'Pas du tout aidé 😞';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="star" size={36} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Évalue ta session d'aide</Text>
        <Text style={styles.subtitle}>
          Cette session avec {session.aidant_nom} en {session.matiere} t'a-t-elle aidé(e) ?
        </Text>
      </View>

      <Card style={styles.mainCard}>
        {/* Star Selector */}
        <Text style={styles.ratingTitle}>Ta note à l'explication :</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              activeOpacity={0.7}
              onPress={() => setRating(star)}
              style={styles.starBtn}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? COLORS.accent : COLORS.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingFeedbackText}>{getRatingLabel(rating)}</Text>

        {/* Dynamic Credit Reward based on rating */}
        <View style={styles.creditRewardBox}>
          <Ionicons name="sparkles" size={20} color={COLORS.accent} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.creditRewardTitle}>
              Crédits attribués à {session.aidant_nom} :
            </Text>
            <Text style={styles.creditRewardValue}>
              +{calculatedCredits} crédits (note : {rating}/5)
            </Text>
          </View>
        </View>

        {/* Comment input */}
        <Text style={styles.commentLabel}>Commentaire ou remerciement (optionnel) :</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Ex: Merci pour l'astuce sur les identités remarquables !"
          placeholderTextColor={COLORS.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Info card */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Les crédits sont attribués en fonction de la qualité de ton évaluation. Plus la note est haute, plus le tuteur gagne de crédits !
          </Text>
        </View>

        <Button
          title={`Valider l'évaluation (+${calculatedCredits} crédits)`}
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit}
          style={{ marginTop: 20 }}
        />
      </Card>

      {/* Animated Validation Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Merci pour ton retour ! 🎉"
        subtitle={`Ton évaluation de ${rating}/5 a bien été enregistrée. +${calculatedCredits} crédits ont été versés à ${session.aidant_nom}.`}
        buttonText="Retour à l'accueil"
        badgeText={`${session.matiere} • ${rating}/5 ★`}
        secondaryBadgeText={`+${calculatedCredits} crédits versés`}
        onClose={() => {
          setShowSuccessModal(false);
          onDone();
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
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 90,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  mainCard: {
    padding: 20,
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  starBtn: {
    padding: 4,
  },
  ratingFeedbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  commentInput: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 16,
  },
  creditRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  creditRewardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  creditRewardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
});
