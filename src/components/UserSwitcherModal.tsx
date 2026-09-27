import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from './Badge';
import { Button } from './Button';
import { ClasseType, CLASSES_LIST, RolePrefere } from '../types';

interface UserSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenRegisterNew: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  visible,
  onClose,
  onOpenRegisterNew,
}) => {
  const { currentUser, users, switchUser, resetDatabase } = useApp();

  const handleSelectUser = async (id: string) => {
    await switchUser(id);
    onClose();
  };

  const handleResetData = () => {
    Alert.alert(
      'Réinitialiser les données',
      'Voulez-vous remettre les données de démonstration par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Changer de compte</Text>
              <Text style={styles.subtitle}>
                Testez facilement les rôles Élève & Tuteur
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {users.map((user) => {
              const isSelected = currentUser?.id === user.id;
              const validatedCount = Object.values(user.quiz_valide_par_matiere).filter(Boolean).length;

              return (
                <TouchableOpacity
                  key={user.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelectUser(user.id)}
                  style={[
                    styles.userCard,
                    isSelected && styles.userCardSelected,
                  ]}
                >
                  <View style={styles.userCardHeader}>
                    <View style={styles.avatarRow}>
                      <View
                        style={[
                          styles.avatar,
                          isSelected && { backgroundColor: COLORS.primary },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {user.nom.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.userNameText}>{user.nom}</Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                          )}
                        </View>
                        <Text style={styles.schoolText}>{user.ecole}</Text>
                      </View>
                    </View>

                    <View style={styles.creditsBadge}>
                      <Ionicons name="sparkles" size={13} color={COLORS.accent} />
                      <Text style={styles.creditsText}>{user.credits} pts</Text>
                    </View>
                  </View>

                  <View style={styles.tagsRow}>
                    <Badge label={`Classe: ${user.classe}`} variant="primary" size="sm" />
                    <Badge
                      label={
                        user.role_prefere === 'aide'
                          ? 'Aidant'
                          : user.role_prefere === 'besoin'
                          ? 'Demandeur'
                          : 'Mixte'
                      }
                      variant="info"
                      size="sm"
                    />
                    <Badge
                      label={`${validatedCount} quiz validé(s)`}
                      variant={validatedCount > 0 ? 'secondary' : 'neutral'}
                      size="sm"
                    />
                    {user.statut_tuteur === 'suspendu' && (
                      <Badge label="Suspendu" variant="danger" size="sm" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="+ Créer un nouvel élève"
              variant="outline"
              size="md"
              onPress={() => {
                onClose();
                onOpenRegisterNew();
              }}
              style={{ marginBottom: 10 }}
            />
            <Button
              title="Réinitialiser les données démo"
              variant="ghost"
              size="sm"
              onPress={handleResetData}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  userCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  schoolText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
});
