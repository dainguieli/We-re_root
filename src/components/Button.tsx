import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, SHADOWS } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = (): { btn: ViewStyle; txt: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          btn: { backgroundColor: COLORS.secondary },
          txt: { color: COLORS.textLight },
        };
      case 'accent':
        return {
          btn: { backgroundColor: COLORS.accent },
          txt: { color: COLORS.textLight },
        };
      case 'outline':
        return {
          btn: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: COLORS.primary,
          },
          txt: { color: COLORS.primary },
        };
      case 'danger':
        return {
          btn: { backgroundColor: COLORS.danger },
          txt: { color: COLORS.textLight },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent' },
          txt: { color: COLORS.primary },
        };
      case 'primary':
      default:
        return {
          btn: { backgroundColor: COLORS.primary },
          txt: { color: COLORS.textLight },
        };
    }
  };

  const getSizeStyles = (): { btn: ViewStyle; txt: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
          txt: { fontSize: 13, fontWeight: '600' },
        };
      case 'lg':
        return {
          btn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 },
          txt: { fontSize: 16, fontWeight: '700' },
        };
      case 'md':
      default:
        return {
          btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
          txt: { fontSize: 15, fontWeight: '600' },
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        vStyles.btn,
        sStyles.btn,
        variant === 'primary' && !disabled && SHADOWS.sm,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.baseText, vStyles.txt, sStyles.txt, disabled && styles.disabledText, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  baseText: {
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});
