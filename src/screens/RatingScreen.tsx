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
import { Session } from '../types';

interface RatingScreenProps {
  session: Session;
  onDone: () => void;
}

export const RatingScreen: React.FC<RatingScreenProps> = ({ session, onDone }) => {
  const { submitRating } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await submitRating(session.id, rating, comment.trim());
      Alert.alert(
        'Merci pour ton retour !',
        'Ton évaluation a bien été enregistrée pour aider la communauté.',
        [{ text: 'Continuer', onPress: onDone }]
      );
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
        return 'Correct, problème en partie résolu 🙂';
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
        <Text style={styles.ratingTitle}>Ta note :</Text>
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
                size={38}
                color={star <= rating ? COLORS.accent : COLORS.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingFeedbackText}>{getRatingLabel(rating)}</Text>

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
            Les notes permettent de valoriser les élèves tuteurs bienveillants et d'ajuster leur note moyenne.
          </Text>
        </View>

        <Button
          title="Envoyer mon évaluation"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit}
          style={{ marginTop: 20 }}
        />
      </Card>
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
    paddingTop: 40,
    paddingBottom: 40,
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
});
