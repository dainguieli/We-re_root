import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';

// -------------------------------------------------------------
// 1. AUDIO RECORDER WIDGET (For CreateDemandeScreen)
// -------------------------------------------------------------
interface AudioRecorderProps {
  onAudioRecorded: (audioUri: string, durationSec: number) => void;
  onAudioRemoved: () => void;
  existingAudioUri?: string;
  existingDurationSec?: number;
  style?: StyleProp<ViewStyle>;
}

export const AudioRecorderWidget: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  onAudioRemoved,
  existingAudioUri,
  existingDurationSec = 15,
  style,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordedUri, setRecordedUri] = useState<string | undefined>(existingAudioUri);
  const [audioDuration, setAudioDuration] = useState<number>(existingDurationSec);

  // Playback state for preview
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playProgress, setPlayProgress] = useState<number>(0);

  // Recording timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 120) {
            // max 2 min
            setIsRecording(false);
            return sec;
          }
          return sec + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Playback simulation timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.05;
        });
      }, 300);
    } else {
      setPlayProgress(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStartRecording = () => {
    setRecordSeconds(0);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const finalDuration = Math.max(recordSeconds, 3);
    const mockUri = `audio_record_${Date.now()}.m4a`;
    setRecordedUri(mockUri);
    setAudioDuration(finalDuration);
    onAudioRecorded(mockUri, finalDuration);
  };

  const handleDeleteAudio = () => {
    setRecordedUri(undefined);
    setRecordSeconds(0);
    setIsPlaying(false);
    onAudioRemoved();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // State A: Audio has been recorded and ready for preview
  if (recordedUri) {
    return (
      <View style={[styles.recordedContainer, style]}>
        <View style={styles.recordedHeader}>
          <View style={styles.audioLabelGroup}>
            <Ionicons name="mic" size={18} color={COLORS.primary} />
            <Text style={styles.recordedTitle}>Message vocal enregistré</Text>
          </View>
          <TouchableOpacity onPress={handleDeleteAudio} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playerBar}>
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playPauseCircle}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.waveformTrack}>
            {/* Visual sound bars */}
            {[40, 70, 30, 90, 60, 100, 80, 50, 90, 60, 40, 75, 95, 60, 30, 85, 70, 40, 60].map(
              (heightPercent, idx) => {
                const isActive = playProgress * 19 >= idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.waveBar,
                      { height: `${heightPercent}%` },
                      isActive && styles.waveBarActive,
                    ]}
                  />
                );
              }
            )}
          </View>

          <Text style={styles.durationText}>{formatTimer(audioDuration)}</Text>
        </View>
      </View>
    );
  }

  // State B: Recording in progress
  if (isRecording) {
    return (
      <View style={[styles.recordingContainer, style]}>
        <View style={styles.recordingPulseRow}>
          <View style={styles.recordingRedDot} />
          <Text style={styles.recordingStatusText}>Enregistrement en cours...</Text>
        </View>

        <Text style={styles.recordingDigits}>{formatTimer(recordSeconds)}</Text>

        <View style={styles.recordingWaves}>
          {[30, 60, 90, 40, 100, 70, 90, 50, 80, 60, 90, 70, 40, 85].map((h, i) => (
            <View
              key={i}
              style={[
                styles.recordingWaveBar,
                { height: `${h}%`, backgroundColor: COLORS.danger },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleStopRecording}
          style={styles.stopRecordBtn}
        >
          <Ionicons name="stop" size={22} color="#FFFFFF" />
          <Text style={styles.stopRecordBtnText}>Terminer l'audio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State C: Idle, ready to record
  return (
    <View style={[styles.idleContainer, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleStartRecording}
        style={styles.startRecordBtn}
      >
        <View style={styles.micCircle}>
          <Ionicons name="mic" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.startRecordTitle}>Enregistrer une note vocale</Text>
          <Text style={styles.startRecordSub}>
            Explique ton exercice ou ta question à voix haute (recommandé)
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// -------------------------------------------------------------
// 2. AUDIO PLAYER WIDGET (For DemandeDetailScreen & ActiveSessionScreen)
// -------------------------------------------------------------
interface AudioPlayerProps {
  durationSec?: number;
  style?: StyleProp<ViewStyle>;
}

export const AudioPlayerWidget: React.FC<AudioPlayerProps> = ({
  durationSec = 20,
  style,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.04 * speed;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const toggleSpeed = () => {
    if (speed === 1.0) setSpeed(1.25);
    else if (speed === 1.25) setSpeed(1.5);
    else setSpeed(1.0);
  };

  const formatSecs = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentPlayedSec = Math.floor(progress * durationSec);

  return (
    <View style={[styles.playerContainer, style]}>
      <View style={styles.playerTopRow}>
        <View style={styles.audioBadge}>
          <Ionicons name="mic-circle" size={20} color={COLORS.primary} />
          <Text style={styles.audioBadgeText}>Message Audio de l'élève</Text>
        </View>
        <TouchableOpacity onPress={toggleSpeed} style={styles.speedPill}>
          <Text style={styles.speedText}>{speed}x</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playerMainRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.playerPlayBtn}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.waveformContainer}>
          {[40, 80, 50, 100, 70, 90, 60, 100, 80, 50, 90, 70, 40, 85, 95, 60, 40, 70].map(
            (h, idx) => {
              const isBarActive = progress * 18 >= idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.waveformBarItem,
                    { height: `${h}%` },
                    isBarActive && styles.waveformBarItemActive,
                  ]}
                />
              );
            }
          )}
        </View>

        <Text style={styles.playerTimerText}>
          {formatSecs(isPlaying ? currentPlayedSec : durationSec)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Idle Container
  idleContainer: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    marginVertical: 6,
  },
  startRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  startRecordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  startRecordSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  // Recording State
  recordingContainer: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    marginVertical: 6,
  },
  recordingPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingRedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
  },
  recordingStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  recordingDigits: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.danger,
    marginVertical: 10,
  },
  recordingWaves: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    width: '100%',
    marginBottom: 14,
  },
  recordingWaveBar: {
    width: 4,
    borderRadius: 2,
  },
  stopRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
    ...SHADOWS.sm,
  },
  stopRecordBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Recorded State
  recordedContainer: {
    backgroundColor: COLORS.primaryLight + '50',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginVertical: 6,
  },
  recordedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  audioLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playPauseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    gap: 3,
  },
  waveBar: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  waveBarActive: {
    backgroundColor: COLORS.primary,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Player Widget
  playerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginVertical: 8,
    ...SHADOWS.sm,
  },
  playerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  speedPill: {
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  playerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 3,
  },
  waveformBarItem: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  waveformBarItemActive: {
    backgroundColor: COLORS.primary,
  },
  playerTimerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    minWidth: 42,
    textAlign: 'right',
  },
});
