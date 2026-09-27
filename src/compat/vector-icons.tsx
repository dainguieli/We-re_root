import React from 'react';

const ICONS: Record<string, string> = {
  add: '+',
  'arrow-back': '←',
  'arrow-forward': '→',
  book: '▣',
  camera: '▣',
  checkmark: '✓',
  'checkmark-circle': '✓',
  'checkmark-done': '✓',
  'chevron-down': '⌄',
  close: '×',
  'close-circle': '×',
  flash: '✦',
  heart: '♥',
  'heart-half': '♥',
  'help-circle': '?',
  'information-circle': 'i',
  'information-circle-outline': 'i',
  list: '☰',
  'list-outline': '☰',
  mic: '●',
  pause: 'Ⅱ',
  person: '●',
  'person-outline': '○',
  play: '▶',
  refresh: '↻',
  ribbon: '◆',
  'ribbon-outline': '◇',
  school: '▣',
  'shield-checkmark': '✓',
  sparkles: '✦',
  star: '★',
  'star-outline': '☆',
  stopwatch: '◷',
  stop: '■',
  'trash-outline': '⌫',
  videocam: '▣',
};

type IconProps = {
  name: keyof typeof ICONS | string;
  size?: number;
  color?: string;
  style?: React.CSSProperties | React.CSSProperties[];
};

function flattenStyle(style: IconProps['style']): React.CSSProperties {
  if (Array.isArray(style)) return Object.assign({}, ...style);
  return style || {};
}

export const Ionicons = ({ name, size = 24, color = 'currentColor', style }: IconProps) => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-flex',
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      color,
      fontSize: Math.max(12, size * 0.82),
      lineHeight: 1,
      fontWeight: 800,
      flexShrink: 0,
      ...flattenStyle(style),
    }}
  >
    {ICONS[name] || '•'}
  </span>
);

Ionicons.glyphMap = ICONS;
