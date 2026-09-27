import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { RolePrefere } from '../types';

interface ProfileScreenProps {
  onOpenQuizzes: () => void;
  onOpenUserSwitch: () => void;
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenQuizzes,
  onOpenUserSwitch,
  onBack,
}) => {
  const {
    currentUser,
    sessions,
    matieres,
    updateUserRolePrefere,
    resetDatabase,
  } = useApp();

  if (!currentUser) return null;

  const isSuspended = currentUser.statut_tuteur === 'suspendu';
  const validatedSubjectsList = Object.entries(currentUser.quiz_valide_par_matiere)
    .filter(([_, val]) => val)
    .map(([key]) => key);

  // Filter sessions involving current user
  const userSessions = sessions.filter(
    (s) => s.aidant_id === currentUser.id || s.demandeur_id === currentUser.id
  );

  const handleRoleChange = async (role: RolePrefere) => {
    await updateUserRolePrefere(role);
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser les données',
      'Remettre les profils et demandes de démonstration par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
          },
        },
      ]
    );
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.responsiveWrapper}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        )}

        {/* User Header Profile Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarText}>
                {currentUser.nom.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{currentUser.nom}</Text>
            <Text style={styles.profileSchool}>{currentUser.ecole}</Text>
            <View style={styles.profileBadgesRow}>
              <Badge label={`Classe : ${currentUser.classe}`} variant="primary" size="sm" />
              <Badge
                label={isSuspended ? 'Tuteur suspendu' : 'Tuteur actif'}
                variant={isSuspended ? 'danger' : 'secondary'}
                size="sm"
              />
            </View>
          </View>
        </View>

        {/* Credits Balance Box */}
        <View style={styles.creditsBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.sparkleCircle}>
              <Ionicons name="sparkles" size={22} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.creditsLabel}>Solde de crédits temps</Text>
              <Text style={styles.creditsAmount}>{currentUser.credits} points</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Tutor Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Ionicons name="star" size={24} color={COLORS.accent} />
          <Text style={styles.statValue}>
            {currentUser.note_moyenne ? currentUser.note_moyenne.toFixed(1) : '5.0'} / 5
          </Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="people" size={24} color={COLORS.primary} />
          <Text style={styles.statValue}>{currentUser.nb_sessions_donnees}</Text>
          <Text style={styles.statLabel}>Sessions données</Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="ribbon" size={24} color={COLORS.secondary} />
          <Text style={styles.statValue}>{validatedSubjectsList.length}</Text>
          <Text style={styles.statLabel}>Quiz validés</Text>
        </Card>
      </View>

      {/* Validated Subjects Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Matières certifiées pour aider</Text>
          <TouchableOpacity onPress={onOpenQuizzes}>
            <Text style={styles.linkText}>Gérer / Passer</Text>
          </TouchableOpacity>
        </View>

        {validatedSubjectsList.length === 0 ? (
          <View style={styles.emptyQuizBox}>
            <Ionicons name="school-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.emptyQuizText}>
              Aucun quiz validé pour le moment. Passe les tests pour débloquer les demandes.
            </Text>
            <Button
              title="Passer mes quiz tuteur"
              size="sm"
              onPress={onOpenQuizzes}
              style={{ marginTop: 8 }}
            />
          </View>
        ) : (
          <View style={styles.validatedChipsContainer}>
            {validatedSubjectsList.map((subject) => {
              const mat = matieres.find((m) => m.nom === subject);
              const coeff = mat ? mat.coefficient : 1.0;
              return (
                <View key={subject} style={styles.validatedSubjectItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
                  <Text style={styles.validatedSubjectText}>{subject}</Text>
                  {coeff > 1.0 && (
                    <Badge label="x1.5" variant="accent" size="sm" />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Rôle Préféré Setting */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Objectif principal</Text>
        <View style={styles.roleChipsRow}>
          {(['besoin', 'aide', 'les_deux'] as RolePrefere[]).map((r) => {
            const isSelected = currentUser.role_prefere === r;
            const label =
              r === 'besoin'
                ? "Besoin d'aide"
                : r === 'aide'
                ? 'Je veux aider'
                : 'Les deux (Mixte)';
            return (
              <TouchableOpacity
                key={r}
                onPress={() => handleRoleChange(r)}
                style={[
                  styles.roleChip,
                  isSelected && styles.roleChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    isSelected && styles.roleChipTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* History of sessions */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Historique des sessions ({userSessions.length})</Text>
        {userSessions.length === 0 ? (
          <Text style={styles.emptyHistoryText}>
            Aucune session terminée pour le moment.
          </Text>
        ) : (
          <View style={styles.historyList}>
            {userSessions.map((session) => {
              const isTutorInSession = session.aidant_id === currentUser.id;
              return (
                <View key={session.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Badge
                      label={isTutorInSession ? 'Tuteur' : 'Demandeur'}
                      variant={isTutorInSession ? 'secondary' : 'primary'}
                      size="sm"
                    />
                    <Text style={styles.historyDate}>{formatDate(session.date)}</Text>
                  </View>

                  <View style={styles.historyBody}>
                    <Text style={styles.historyMatiere}>{session.matiere}</Text>
                    <Text style={styles.historyPartner}>
                      Avec {isTutorInSession ? session.demandeur_nom : session.aidant_nom} • {session.duree_min} min
                    </Text>
                  </View>

                  {session.note_recue !== undefined && (
                    <View style={styles.historyRatingRow}>
                      <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= (session.note_recue || 0) ? 'star' : 'star-outline'}
                            size={14}
                            color={COLORS.accent}
                          />
                        ))}
                      </View>
                      {session.commentaire && (
                        <Text style={styles.historyComment} numberOfLines={1}>
                          "{session.commentaire}"
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Demo Controls */}
      <Card variant="flat" style={styles.demoCard}>
        <Text style={styles.demoTitle}>Mode Démonstration & Tests</Text>
        <Button
          title="👥 Changer de compte élève (Sarah, Lucas, Thomas...)"
          variant="outline"
          size="md"
          onPress={onOpenUserSwitch}
          style={{ marginBottom: 10 }}
        />
        <Button
          title="🔄 Réinitialiser les données démo"
          variant="ghost"
          size="sm"
          onPress={handleReset}
        />
      </Card>
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
  responsiveWrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    marginLeft: 6,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  profileHeaderCard: {
    padding: 18,
    marginBottom: 14,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bigAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileSchool: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  profileBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  creditsBanner: {
    backgroundColor: COLORS.accentLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  creditsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
  },
  creditsAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyQuizBox: {
    alignItems: 'center',
    padding: 14,
  },
  emptyQuizText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  validatedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  validatedSubjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  validatedSubjectText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  roleChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  roleChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
  historyList: {
    gap: 10,
    marginTop: 6,
  },
  historyItem: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  historyBody: {
    marginBottom: 4,
  },
  historyMatiere: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyPartner: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  historyComment: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  demoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
});
