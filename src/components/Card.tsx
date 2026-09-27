import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'flat' | 'outlined' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return { backgroundColor: COLORS.cardAlt, borderWidth: 0 };
      case 'outlined':
        return {
          backgroundColor: COLORS.card,
          borderWidth: 1.5,
          borderColor: COLORS.border,
        };
      case 'highlight':
        return {
          backgroundColor: COLORS.primaryLight,
          borderWidth: 1.5,
          borderColor: COLORS.primary,
        };
      case 'default':
      default:
        return {
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
          ...SHADOWS.sm,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.baseCard, getVariantStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.baseCard, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
  },
});
