import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { AudioRecorderWidget } from '../components/AudioWidget';
import { ModeDemande } from '../types';

interface CreateDemandeScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialMatiere?: string;
  initialRubrique?: string;
}

const DURATIONS = [5, 10, 15, 20, 25, 30];

export const CreateDemandeScreen: React.FC<CreateDemandeScreenProps> = ({
  onSuccess,
  onCancel,
  initialMatiere,
  initialRubrique,
}) => {
  const { currentUser, matieres, createDemande, calculateCreditsForMatiere } = useApp();

  const foundMatiere = initialMatiere
    ? matieres.find((m) => m.nom.toLowerCase() === initialMatiere.toLowerCase()) || matieres[0]
    : matieres[0];

  const [selectedMatiereId, setSelectedMatiereId] = useState<string>(foundMatiere.id);
  const [selectedRubrique, setSelectedRubrique] = useState<string>(
    initialRubrique || (foundMatiere.rubriques[0] || 'Autre')
  );
  const [customRubrique, setCustomRubrique] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Format is strictly 'audio' or 'video' (No 'ecrit')
  const [mode, setMode] = useState<ModeDemande>('audio');
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [audioDurationSec, setAudioDurationSec] = useState<number | undefined>(undefined);
  
  const [presentiel, setPresentiel] = useState<boolean>(false);
  const [duree, setDuree] = useState<number>(15);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentMatiere = matieres.find((m) => m.id === selectedMatiereId) || matieres[0];

  const handleMatiereChange = (id: string) => {
    setSelectedMatiereId(id);
    const m = matieres.find((item) => item.id === id);
    if (m && m.rubriques.length > 0) {
      setSelectedRubrique(m.rubriques[0]);
    }
    setCustomRubrique('');
  };

  const handleAddSamplePhoto = () => {
    const sampleUri =
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';
    setPhotoUri(sampleUri);
  };

  const handleSubmit = async () => {
    if (mode === 'audio' && !audioUri && !description.trim()) {
      Alert.alert(
        'Message requis',
        'Veuillez enregistrer une note vocale ou ajouter une courte description pour expliquer votre question.'
      );
      return;
    }

    if (mode === 'video' && !description.trim() && !photoUri) {
      Alert.alert(
        'Précision requise',
        "Veuillez décrire brièvement votre blocage ou ajouter une photo de l'exercice avant l'appel vidéo."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await createDemande({
        matiere: currentMatiere.nom,
        rubrique: selectedRubrique === 'Autre' && customRubrique ? customRubrique : selectedRubrique,
        rubrique_custom: selectedRubrique === 'Autre' ? customRubrique : undefined,
        photo_uri: photoUri,
        audio_uri: audioUri,
        audio_duration_sec: audioDurationSec,
        description: description.trim() || (mode === 'audio' ? 'Message vocal joint' : ''),
        mode,
        presentiel,
      });

      Alert.alert(
        'Demande publiée !',
        `Ta demande en ${currentMatiere.nom} (${selectedRubrique}) est publiée. Les tuteurs certifiés vont te proposer leur aide !`,
        [{ text: 'Super !', onPress: onSuccess }]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de publier la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedCredits = calculateCreditsForMatiere(currentMatiere.nom, duree);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.responsiveWrapper}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text style={styles.backText}>Annuler</Text>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Poser une question 🙋‍♂️</Text>
          <Text style={styles.subtitle}>
            Choisis le format (Audio ou Vidéo) et un tuteur va t'aider pour un coup de pouce rapide !
          </Text>
        </View>

        {/* 1. Matière & Leçon */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Matière</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matiereScroll}>
            {matieres.map((mat) => {
              const isSelected = selectedMatiereId === mat.id;
              return (
                <TouchableOpacity
                  key={mat.id}
                  onPress={() => handleMatiereChange(mat.id)}
                  style={[
                    styles.matiereChip,
                    isSelected && { backgroundColor: mat.color, borderColor: mat.color },
                  ]}
                >
                  <Ionicons
                    name="book"
                    size={16}
                    color={isSelected ? '#FFFFFF' : mat.color}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.matiereChipText,
                      isSelected && styles.matiereChipTextSelected,
                    ]}
                  >
                    {mat.nom}
                  </Text>
                  {mat.coefficient > 1.0 && (
                    <View style={[styles.miniBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                      <Text style={[styles.miniBadgeText, isSelected && { color: '#FFFFFF' }]}>x1.5</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rubrique / Chapitre */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Leçon / Chapitre</Text>
          <View style={styles.rubriquesContainer}>
            {currentMatiere.rubriques.map((rub) => {
              const isSelected = selectedRubrique === rub;
              return (
                <TouchableOpacity
                  key={rub}
                  onPress={() => setSelectedRubrique(rub)}
                  style={[
                    styles.rubriqueChip,
                    isSelected && styles.rubriqueChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.rubriqueChipText,
                      isSelected && styles.rubriqueChipTextSelected,
                    ]}
                  >
                    {rub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedRubrique === 'Autre' && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Précise la leçon ou le sujet..."
              placeholderTextColor={COLORS.textMuted}
              value={customRubrique}
              onChangeText={setCustomRubrique}
            />
          )}
        </Card>

        {/* 2. Format de l'aide (STRICTEMENT AUDIO OU VIDEO) */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Format de l'aide</Text>
          <Text style={styles.formatSubtitle}>
            Sélectionne comment tu souhaites échanger avec ton tuteur :
          </Text>

          <View style={styles.modeRow}>
            {/* Mode Audio */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('audio')}
              style={[styles.modeCard, mode === 'audio' && styles.modeCardSelected]}
            >
              <View style={[styles.modeIconCircle, mode === 'audio' && { backgroundColor: COLORS.primary }]}>
                <Ionicons
                  name="mic"
                  size={24}
                  color={mode === 'audio' ? '#FFFFFF' : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.modeTitle, mode === 'audio' && styles.modeTitleSelected]}>
                Message Audio
              </Text>
              <Text style={styles.modeSub}>Note vocale explicative</Text>
            </TouchableOpacity>

            {/* Mode Vidéo */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('video')}
              style={[styles.modeCard, mode === 'video' && styles.modeCardSelected]}
            >
              <View style={[styles.modeIconCircle, mode === 'video' && { backgroundColor: COLORS.primary }]}>
                <Ionicons
                  name="videocam"
                  size={24}
                  color={mode === 'video' ? '#FFFFFF' : COLORS.textSecondary}
                />
              </View>
              <Text style={[styles.modeTitle, mode === 'video' && styles.modeTitleSelected]}>
                Appel Vidéo
              </Text>
              <Text style={styles.modeSub}>Meet / WhatsApp / Jitsi</Text>
            </TouchableOpacity>
          </View>

          {/* If Mode is Audio: Show Audio Recorder Widget */}
          {mode === 'audio' && (
            <View style={{ marginTop: 10 }}>
              <AudioRecorderWidget
                existingAudioUri={audioUri}
                existingDurationSec={audioDurationSec}
                onAudioRecorded={(uri, sec) => {
                  setAudioUri(uri);
                  setAudioDurationSec(sec);
                }}
                onAudioRemoved={() => {
                  setAudioUri(undefined);
                  setAudioDurationSec(undefined);
                }}
              />
            </View>
          )}

          {/* Description complémentaire */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            {mode === 'audio' ? 'Texte ou question écrite (complémentaire)' : 'Détail de ton blocage :'}
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder={
              mode === 'audio'
                ? 'Ex: Exercice 4 page 52, je bloque sur la question 2...'
                : "Ex: Je n'arrive pas à comprendre le cours sur les forces. Besoin d'explications en direct..."
            }
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Photo attachment */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  onPress={() => setPhotoUri(undefined)}
                  style={styles.removePhotoBtn}
                >
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddSamplePhoto}
                style={styles.addPhotoBtn}
              >
                <Ionicons name="camera" size={20} color={COLORS.primary} />
                <Text style={styles.addPhotoText}>Ajouter une photo de l'exercice (optionnel)</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* 3. Modalités d'échange */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Modalités & Présentiel</Text>

          {/* Présentiel Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>Uniquement dans mon établissement (Présentiel)</Text>
              <Text style={styles.toggleDesc}>
                Réservé aux élèves de {currentUser?.ecole || 'votre établissement'}
              </Text>
            </View>
            <Switch
              value={presentiel}
              onValueChange={setPresentiel}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={presentiel ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          {/* Tutor estimated time banner */}
          <View style={styles.creditInfoBanner}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.creditInfoText, { color: COLORS.primary, fontWeight: '700' }]}>
                Durée proposée par le tuteur
              </Text>
              <Text style={[styles.creditInfoText, { color: COLORS.textSecondary, marginTop: 2 }]}>
                Chaque tuteur intéressé t'indiquera le temps nécessaire pour t'expliquer. Tu pourras ensuite choisir le tuteur de ton choix !
              </Text>
            </View>
          </View>
        </Card>

        <Button
          title="🚀 Publier ma demande d'aide"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit}
          style={{ marginVertical: 20 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 720,
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  formatSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  matiereScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  matiereChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  matiereChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  matiereChipTextSelected: {
    color: '#FFFFFF',
  },
  miniBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  rubriquesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rubriqueChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rubriqueChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rubriqueChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rubriqueChipTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  modeTitleSelected: {
    color: COLORS.primary,
  },
  modeSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
  },
  photoSection: {
    marginTop: 12,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    backgroundColor: COLORS.primaryLight + '30',
  },
  addPhotoText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.danger,
    padding: 6,
    borderRadius: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    marginVertical: 8,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  durationChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  durationChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  durationChipTextSelected: {
    color: '#FFFFFF',
  },
  creditInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: 10,
    borderRadius: 10,
  },
  creditInfoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#78350F',
    flex: 1,
  },
});
