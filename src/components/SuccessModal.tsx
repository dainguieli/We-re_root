import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  buttonText?: string;
  badgeText?: string;
  secondaryBadgeText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  subtitle,
  buttonText = 'Continuer',
  badgeText,
  secondaryBadgeText,
  iconName = 'checkmark-circle',
  iconColor = COLORS.secondary,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const starRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Parallel entry animations
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(120),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.timing(starRotateAnim, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      iconScaleAnim.setValue(0);
      starRotateAnim.setValue(0);
    }
  }, [visible]);

  const starRotateInterpolate = starRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Animated backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

        {/* Modal Card */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top celebratory decorative circles */}
          <Animated.View
            style={[
              styles.sparkleOrbit,
              { transform: [{ rotate: starRotateInterpolate }] },
            ]}
          >
            <View style={[styles.particle, styles.particle1]}>
              <Ionicons name="sparkles" size={16} color={COLORS.accent} />
            </View>
            <View style={[styles.particle, styles.particle2]}>
              <Ionicons name="star" size={14} color={COLORS.primary} />
            </View>
            <View style={[styles.particle, styles.particle3]}>
              <Ionicons name="flash" size={14} color={COLORS.secondary} />
            </View>
          </Animated.View>

          {/* Main animated icon circle */}
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: iconColor + '20',
                borderColor: iconColor,
                transform: [{ scale: iconScaleAnim }],
              },
            ]}
          >
            <Ionicons name={iconName} size={48} color={iconColor} />
          </Animated.View>

          {/* Titles */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Highlight badges */}
          {(badgeText || secondaryBadgeText) && (
            <View style={styles.badgesRow}>
              {badgeText && (
                <View style={styles.badgeItem}>
                  <Ionicons name="time" size={14} color={COLORS.primary} />
                  <Text style={styles.badgeText}>{badgeText}</Text>
                </View>
              )}
              {secondaryBadgeText && (
                <View style={[styles.badgeItem, { backgroundColor: COLORS.secondaryLight }]}>
                  <Ionicons name="checkmark-done" size={14} color={COLORS.secondary} />
                  <Text style={[styles.badgeText, { color: COLORS.secondary }]}>
                    {secondaryBadgeText}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>{buttonText}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    position: 'relative',
  },
  sparkleOrbit: {
    position: 'absolute',
    top: 15,
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particle1: {
    top: 0,
    right: 20,
  },
  particle2: {
    bottom: 10,
    left: 10,
  },
  particle3: {
    top: 40,
    left: 0,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginTop: 22,
    gap: 8,
    ...SHADOWS.md,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
