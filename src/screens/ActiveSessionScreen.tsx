import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface ActiveSessionScreenProps {
  onSessionEnded: () => void;
  onBack: () => void;
}

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({
  onSessionEnded,
  onBack,
}) => {
  const { activeSession, completeSession, currentUser } = useApp();

  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    activeSession ? activeSession.duree_min * 60 : 15 * 60
  );
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  useEffect(() => {
    if (!activeSession) return;
    setSecondsRemaining(activeSession.duree_min * 60);
  }, [activeSession?.id]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  if (!activeSession) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="information-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>Aucune session active pour le moment.</Text>
        <Button title="Retour" size="md" onPress={onBack} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenVideo = async () => {
    const url = activeSession.lien_video || 'https://meet.google.com';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Lien vidéo', `Voici le lien de la session :\n${url}`);
      }
    } catch (e) {
      Alert.alert('Lien vidéo', `Voici le lien de la session :\n${url}`);
    }
  };

  const handleFinishSession = () => {
    Alert.alert(
      'Terminer la session',
      `Confirmez-vous la fin de cette session d'aide ?\n+${activeSession.credits_verses} crédits seront versés à l'aidant (${activeSession.aidant_nom}).`,
      [
        { text: 'Continuer la session', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: async () => {
            try {
              setIsFinishing(true);
              await completeSession(activeSession.id);
              onSessionEnded();
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de terminer la session.');
            } finally {
              setIsFinishing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          <Text style={styles.backText}>Réduire</Text>
        </TouchableOpacity>
        <Badge label="SESSION EN COURS" variant="secondary" />
      </View>

      {/* Main Timer Card */}
      <Card style={styles.timerCard}>
        <View style={styles.subjectRow}>
          <Badge label={activeSession.matiere} variant="primary" size="sm" />
          <Badge
            label={activeSession.mode === 'video' ? 'Appel Vidéo' : 'Écrit'}
            variant="info"
            size="sm"
          />
        </View>

        <Text style={styles.timerTitle}>Temps restant estimé</Text>
        <Text style={styles.timerDigits}>{formatTime(secondsRemaining)}</Text>

        <View style={styles.timerControlsRow}>
          <TouchableOpacity
            onPress={() => setIsActive(!isActive)}
            style={styles.controlBtn}
          >
            <Ionicons
              name={isActive ? 'pause' : 'play'}
              size={18}
              color={COLORS.text}
            />
            <Text style={styles.controlBtnText}>{isActive ? 'Pause' : 'Reprendre'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSecondsRemaining(activeSession.duree_min * 60)}
            style={styles.controlBtn}
          >
            <Ionicons name="refresh" size={18} color={COLORS.text} />
            <Text style={styles.controlBtnText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Participants Card */}
      <Card style={styles.participantsCard}>
        <Text style={styles.cardHeading}>Participants</Text>

        <View style={styles.participantRow}>
          <View style={[styles.avatarCircle, { backgroundColor: COLORS.secondary }]}>
            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.participantRole}>Tuteur / Aidant</Text>
            <Text style={styles.participantName}>{activeSession.aidant_nom}</Text>
          </View>
          <Badge label={`+${activeSession.credits_verses} pts`} variant="accent" size="sm" />
        </View>

        <View style={[styles.participantRow, { marginTop: 12 }]}>
          <View style={[styles.avatarCircle, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="school" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.participantRole}>Demandeur / Élève</Text>
            <Text style={styles.participantName}>{activeSession.demandeur_nom}</Text>
          </View>
        </View>
      </Card>

      {/* Video Call Action if applicable */}
      {activeSession.mode === 'video' && (
        <Card variant="highlight" style={styles.videoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="videocam" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.videoCardTitle}>Lien d'appel externe</Text>
          </View>
          <Text style={styles.videoCardDesc} numberOfLines={1}>
            {activeSession.lien_video || 'Meet / WhatsApp'}
          </Text>
          <Button
            title="📞 Ouvrir l'appel vidéo"
            size="md"
            onPress={handleOpenVideo}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* Complete Session Button */}
      <View style={styles.footer}>
        <Button
          title="🏁 Marquer la session comme terminée"
          size="lg"
          variant="secondary"
          loading={isFinishing}
          onPress={handleFinishSession}
        />
        <Text style={styles.footerTip}>
          Les crédits seront automatiquement attribués au tuteur et vous pourrez laisser une évaluation.
        </Text>
      </View>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 6,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  timerTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timerDigits: {
    fontSize: 54,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginVertical: 10,
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  participantsCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  participantRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  videoCard: {
    padding: 16,
    marginBottom: 16,
  },
  videoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  videoCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  footer: {
    marginTop: 10,
  },
  footerTip: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
