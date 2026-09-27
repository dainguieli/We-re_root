import React, { useEffect, useState } from 'react';

const RNW = require('react-native-web') as Record<string, any>;

export const View = RNW.View;
export const Text = RNW.Text;
export const StyleSheet = RNW.StyleSheet;
export const TouchableOpacity = RNW.TouchableOpacity;
export const ScrollView = RNW.ScrollView;
export const TextInput = RNW.TextInput;
export const ActivityIndicator = RNW.ActivityIndicator;
export const Switch = RNW.Switch;
export const Modal = RNW.Modal;
export const Animated = RNW.Animated;
export const Dimensions = RNW.Dimensions;
export const KeyboardAvoidingView = RNW.KeyboardAvoidingView || RNW.View;
export const SafeAreaView = RNW.View;

export type ViewStyle = Record<string, any>;
export type TextStyle = Record<string, any>;
export type ImageStyle = Record<string, any>;
export type StyleProp<T> = T | T[] | null | undefined;

type WebImageProps = React.ComponentProps<'img'> & {
  source?: unknown;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  style?: StyleProp<ImageStyle>;
};

function normalizeImageSource(source: unknown) {
  if (typeof source === 'string') return { uri: source };
  if (source && typeof source === 'object' && 'uri' in source) return source;
  if (source && typeof source === 'object' && 'src' in source) {
    return { uri: String((source as { src: string }).src) };
  }
  if (source && typeof source === 'object' && 'default' in source) {
    const nested = (source as { default: unknown }).default;
    if (nested && typeof nested === 'object' && 'src' in nested) {
      return { uri: String((nested as { src: string }).src) };
    }
  }
  return source;
}

export const Image = ({ source, ...props }: WebImageProps) => (
  <RNW.Image {...props} source={normalizeImageSource(source)} />
);

export const Platform = {
  ...RNW.Platform,
  OS: 'web' as const,
};

type StatusBarProps = {
  barStyle?: string;
  backgroundColor?: string;
};

export const StatusBar = Object.assign((_props: StatusBarProps) => null, {
  currentHeight: 0,
});

export const RefreshControl = (_props: Record<string, unknown>) => null;

export function useWindowDimensions() {
  const getSize = () => ({
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight,
    scale: 1,
    fontScale: 1,
  });

  const [size, setSize] = useState(getSize);

  useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

export const Alert = {
  alert(title: string, message?: string, buttons?: Array<{ text?: string; onPress?: () => void; style?: string }>) {
    const confirmButton = buttons?.find((button) => button.style !== 'cancel' && button.onPress);
    const cancelButton = buttons?.find((button) => button.style === 'cancel');

    if (confirmButton && cancelButton) {
      if (window.confirm(message ? `${title}\n\n${message}` : title)) {
        confirmButton.onPress?.();
      }
      return;
    }

    window.alert(message ? `${title}\n\n${message}` : title);
    confirmButton?.onPress?.();
  },
};

export const Linking = {
  async canOpenURL(url: string) {
    return /^https?:\/\//i.test(url);
  },
  async openURL(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};

export default {
  ...RNW,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
};
