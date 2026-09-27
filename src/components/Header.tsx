import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from './Badge';

interface HeaderProps {
  onOpenUserSwitch?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUserSwitch, onOpenProfile }) => {
  const { currentUser, currentMode, setCurrentMode } = useApp();

  if (!currentUser) return null;

  const isTutorMode = currentMode === 'aide';
  const isSuspended = currentUser.statut_tuteur === 'suspendu';

  return (
    <View style={styles.container}>
      <View style={styles.responsiveWrapper}>
        {/* Top row: Brand + Credits + Profile Avatar */}
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.brandTitle}>LinkUp</Text>
              <Text style={styles.brandSubtitle}>Tutorat entre pairs</Text>
            </View>
          </View>

          <View style={styles.rightActions}>
            {/* Credits pill */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenProfile}
              style={styles.creditsPill}
            >
              <Ionicons name="sparkles" size={16} color={COLORS.accent} />
              <Text style={styles.creditsText}>{currentUser.credits} pts</Text>
            </TouchableOpacity>

            {/* User selector avatar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenUserSwitch}
              style={styles.userButton}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentUser.nom.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info Bar */}
        <View style={styles.userInfoRow}>
          <View style={styles.userBadges}>
            <Text style={styles.userName}>{currentUser.nom}</Text>
            <Badge label={currentUser.classe} variant="primary" size="sm" />
            <Badge label={currentUser.ecole} variant="neutral" size="sm" />
            {isSuspended && (
              <Badge label="Tuteur suspendu" variant="danger" size="sm" />
            )}
          </View>
        </View>

        {/* Mode Switcher Tab (Aide vs Besoin) */}
        <View style={styles.modeSwitcherContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentMode('besoin')}
            style={[
              styles.modeTab,
              !isTutorMode && styles.modeTabActiveBesoin,
            ]}
          >
            <Ionicons
              name="help-circle"
              size={18}
              color={!isTutorMode ? '#FFFFFF' : COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeTabText,
                !isTutorMode ? styles.modeTabTextActive : styles.modeTabTextInactive,
              ]}
            >
              J'ai besoin d'aide
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentMode('aide')}
            style={[
              styles.modeTab,
              isTutorMode && styles.modeTabActiveAide,
            ]}
          >
            <Ionicons
              name="heart-half"
              size={18}
              color={isTutorMode ? '#FFFFFF' : COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeTabText,
                isTutorMode ? styles.modeTabTextActive : styles.modeTabTextInactive,
              ]}
            >
              Je veux aider
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    ...SHADOWS.sm,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  creditsText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 4,
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  modeTabActiveBesoin: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  modeTabActiveAide: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeTabTextInactive: {
    color: COLORS.textSecondary,
  },
});
