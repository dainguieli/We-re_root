import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'secondary':
        return { bg: COLORS.secondaryLight, text: COLORS.secondary };
      case 'accent':
        return { bg: COLORS.accentLight, text: '#B45309' };
      case 'danger':
        return { bg: COLORS.dangerLight, text: COLORS.danger };
      case 'warning':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'info':
        return { bg: COLORS.infoLight, text: COLORS.info };
      case 'neutral':
        return { bg: COLORS.cardAlt, text: COLORS.textSecondary };
      case 'primary':
      default:
        return { bg: COLORS.primaryLight, text: COLORS.primary };
    }
  };

  const { bg, text: textColor } = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, paddingHorizontal: isSm ? 6 : 10, paddingVertical: isSm ? 2 : 4 },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          { color: textColor, fontSize: isSm ? 11 : 13, fontWeight: isSm ? '600' : '700' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    letterSpacing: 0.2,
  },
});
