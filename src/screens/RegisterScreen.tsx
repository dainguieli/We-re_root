import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Button } from '../components/Button';
import { ClasseType, CLASSES_LIST, RolePrefere } from '../types';

interface RegisterScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess, onCancel }) => {
  const { registerUser } = useApp();
  const [nom, setNom] = useState('');
  const [age, setAge] = useState('15');
  const [classe, setClasse] = useState<ClasseType>('2nde');
  const [ecole, setEcole] = useState('Lycée Condorcet');
  const [rolePrefere, setRolePrefere] = useState<RolePrefere>('les_deux');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir votre prénom et nom.');
      return;
    }
    if (!ecole.trim()) {
      Alert.alert('Champ requis', 'Veuillez indiquer votre établissement scolaire.');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser({
        nom: nom.trim(),
        age: parseInt(age, 10) || 15,
        classe,
        ecole: ecole.trim(),
        role_prefere: rolePrefere,
      });
      onSuccess();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoBig}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bienvenue sur LinkUp</Text>
          <Text style={styles.subtitle}>
            L'entraide scolaire entre élèves, sans argent, en crédits de temps !
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* Nom */}
          <Text style={styles.label}>Prénom et Nom</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Sarah Martin"
            placeholderTextColor={COLORS.textMuted}
            value={nom}
            onChangeText={setNom}
          />

          {/* Âge */}
          <Text style={styles.label}>Âge</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 15"
            placeholderTextColor={COLORS.textMuted}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={2}
          />

          {/* Classe */}
          <Text style={styles.label}>Classe actuelle</Text>
          <View style={styles.classChipsContainer}>
            {CLASSES_LIST.map((c) => {
              const isSelected = classe === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setClasse(c)}
                  style={[
                    styles.classChip,
                    isSelected && styles.classChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.classChipText,
                      isSelected && styles.classChipTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* École */}
          <Text style={styles.label}>École / Collège / Lycée</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Collège Victor Hugo, Lycée Condorcet..."
            placeholderTextColor={COLORS.textMuted}
            value={ecole}
            onChangeText={setEcole}
          />

          {/* Rôle préféré */}
          <Text style={styles.label}>Quel est ton objectif principal ?</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => setRolePrefere('besoin')}
              style={[
                styles.roleOption,
                rolePrefere === 'besoin' && styles.roleOptionSelected,
              ]}
            >
              <Ionicons
                name="help-circle"
                size={22}
                color={rolePrefere === 'besoin' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleOptionTitle,
                  rolePrefere === 'besoin' && styles.roleOptionTitleSelected,
                ]}
              >
                Recevoir de l'aide
              </Text>
              <Text style={styles.roleOptionDesc}>Poser mes questions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRolePrefere('aide')}
              style={[
                styles.roleOption,
                rolePrefere === 'aide' && styles.roleOptionSelected,
              ]}
            >
              <Ionicons
                name="heart"
                size={22}
                color={rolePrefere === 'aide' ? COLORS.secondary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleOptionTitle,
                  rolePrefere === 'aide' && styles.roleOptionTitleSelected,
                ]}
              >
                Aider les autres
              </Text>
              <Text style={styles.roleOptionDesc}>Gagner des crédits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRolePrefere('les_deux')}
              style={[
                styles.roleOption,
                rolePrefere === 'les_deux' && styles.roleOptionSelected,
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={22}
                color={rolePrefere === 'les_deux' ? COLORS.accent : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleOptionTitle,
                  rolePrefere === 'les_deux' && styles.roleOptionTitleSelected,
                ]}
              >
                Les deux
              </Text>
              <Text style={styles.roleOptionDesc}>Entraide complète</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Créer mon compte"
            size="lg"
            loading={isSubmitting}
            onPress={handleSubmit}
            style={{ marginTop: 24 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBig: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  classChipTextSelected: {
    color: '#FFFFFF',
  },
  roleContainer: {
    gap: 10,
    marginTop: 4,
  },
  roleOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  roleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  roleOptionTitleSelected: {
    color: COLORS.primary,
  },
  roleOptionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
