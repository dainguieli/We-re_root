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
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import {
  ClasseType,
  CLASSES_LIST,
  CLASSE_ORDER,
  ECOLES_PARTENAIRES,
  KycDocType,
  RolePrefere,
  getQuizTargetLevel,
} from '../types';
import { getDemoStudentCardUri, getDemoReceiptUri } from '../utils/kycDemoAssets';

interface RegisterScreenProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess, onCancel }) => {
  const { registerUser, matieres } = useApp();

  // Navigation step state: 0 = Accueil / Hero, 1 = Identité, 2 = Classe, 3 = Points forts, 4 = KYC, 5 = Récapitulatif
  const [step, setStep] = useState<number>(0);

  // Form State
  const [nom, setNom] = useState<string>('Awa Koffi');
  const [age, setAge] = useState<string>('15');
  const [ecole, setEcole] = useState<string>('Collège Sainte-Marie');
  const [customEcole, setCustomEcole] = useState<string>('');
  const [classe, setClasse] = useState<ClasseType>('3e');
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>(['Mathématiques', 'Anglais']);
  const [kycDocType, setKycDocType] = useState<KycDocType>('carte_scolaire');
  const [kycImageUri, setKycImageUri] = useState<string>(
    getDemoStudentCardUri('Awa Koffi', 'Collège Sainte-Marie', '3e')
  );
  const [rolePrefere, setRolePrefere] = useState<RolePrefere>('les_deux');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Age validation
  const parsedAge = parseInt(age, 10);
  const isAgeValid = !isNaN(parsedAge) && parsedAge >= 9 && parsedAge <= 25;

  // Selected school
  const activeEcole = customEcole.trim() ? customEcole.trim() : ecole.trim();

  // Step 1 Validation (Identité)
  const isStep1Valid = nom.trim().length >= 2 && isAgeValid && activeEcole.length >= 3;

  // Step 2 Validation (Classe)
  const isStep2Valid = !!classe;

  // Step 3 Validation (Points forts: exactement 2 matières)
  const isStep3Valid = selectedMatieres.length === 2;

  // Step 4 Validation (KYC: type + image)
  const isStep4Valid = !!kycDocType && !!kycImageUri;

  // Helper for helper classes based on hierarchy
  const getHelperClassesList = (c: ClasseType): ClasseType[] => {
    if (c === 'Tle') {
      return [...CLASSES_LIST]; // Tle can help all classes
    }
    const myOrder = CLASSE_ORDER[c];
    return CLASSES_LIST.filter((cls) => CLASSE_ORDER[cls] <= myOrder);
  };

  const getRestrictedClassesList = (c: ClasseType): ClasseType[] => {
    if (c === 'Tle') return [];
    const myOrder = CLASSE_ORDER[c];
    return CLASSES_LIST.filter((cls) => CLASSE_ORDER[cls] > myOrder);
  };

  // Toggle subject selection
  const handleToggleMatiere = (matiereNom: string) => {
    if (selectedMatieres.includes(matiereNom)) {
      setSelectedMatieres(selectedMatieres.filter((m) => m !== matiereNom));
    } else {
      if (selectedMatieres.length >= 2) {
        // Replace oldest or alert
        setSelectedMatieres([selectedMatieres[1], matiereNom]);
      } else {
        setSelectedMatieres([...selectedMatieres, matiereNom]);
      }
    }
  };

  // File Picker on Web / fallback
  const handlePickCustomImage = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const uri = event.target?.result as string;
            if (uri) {
              setKycImageUri(uri);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Mobile fallback demo selection
      const demoUri =
        kycDocType === 'carte_scolaire'
          ? getDemoStudentCardUri(nom, activeEcole, classe)
          : getDemoReceiptUri(nom, activeEcole, classe);
      setKycImageUri(demoUri);
      Alert.alert(
        'Document importé',
        'Le justificatif scolaire a été importé avec succès pour le MVP.'
      );
    }
  };

  const handleUseDemoDoc = (type: KycDocType) => {
    setKycDocType(type);
    const uri =
      type === 'carte_scolaire'
        ? getDemoStudentCardUri(nom, activeEcole, classe)
        : getDemoReceiptUri(nom, activeEcole, classe);
    setKycImageUri(uri);
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      await registerUser({
        nom: nom.trim(),
        age: parsedAge || 15,
        classe,
        ecole: activeEcole,
        role_prefere: rolePrefere,
        matieres_fortes: selectedMatieres,
        kyc_soumis: true,
        kyc_type: kycDocType,
        kyc_document_uri: kycImageUri,
      });

      onSuccess();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stepper Progress Header
  const renderStepper = () => {
    if (step === 0) return null;
    const progressPercent = (step / 5) * 100;
    const stepNames = ['Identité', 'Classe', 'Points forts', 'Sécurité KYC', 'Récap'];

    return (
      <View style={styles.stepperWrapper}>
        <View style={styles.stepperTop}>
          <TouchableOpacity
            onPress={() => setStep((prev) => Math.max(0, prev - 1))}
            style={styles.stepperBackBtn}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            <Text style={styles.stepperBackText}>Étape {step}/5</Text>
          </TouchableOpacity>
          <Text style={styles.stepperCurrentName}>{stepNames[step - 1]}</Text>
        </View>

        {/* Progress bar line */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Step dots */}
        <View style={styles.stepsDotsRow}>
          {[1, 2, 3, 4, 5].map((i) => {
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <View
                key={i}
                style={[
                  styles.stepDot,
                  isCurrent && styles.stepDotCurrent,
                  isCompleted && styles.stepDotCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepDotText,
                      isCurrent && styles.stepDotTextCurrent,
                    ]}
                  >
                    {i}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ==========================================
  // ÉCRAN 0 : ACCUEIL / HERO BIENVENUE
  // ==========================================
  if (step === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.heroScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.responsiveWrapper}>
            {onCancel && (
              <TouchableOpacity onPress={onCancel} style={styles.topBackBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            )}

            <View style={styles.heroHeader}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>LinkUp</Text>
              <Text style={styles.heroTagline}>
                L'entraide scolaire gratuite entre pairs, basée sur les crédits de temps !
              </Text>
            </View>

            <View style={styles.heroFeaturesContainer}>
              <View style={styles.heroFeatureCard}>
                <View style={[styles.heroIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="school" size={24} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroFeatureTitle}>100% Élèves & Collèges/Lycées</Text>
                  <Text style={styles.heroFeatureDesc}>
                    De la 6e à la Terminale. Une communauté sécurisée et certifiée.
                  </Text>
                </View>
              </View>

              <View style={styles.heroFeatureCard}>
                <View style={[styles.heroIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="sparkles" size={24} color={COLORS.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroFeatureTitle}>Économie de crédits temps</Text>
                  <Text style={styles.heroFeatureDesc}>
                    Pas d'argent. Aide un camarade pour gagner des points et poser tes questions.
                  </Text>
                </View>
              </View>

              <View style={styles.heroFeatureCard}>
                <View style={[styles.heroIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="mic" size={24} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroFeatureTitle}>Messages audio & visio</Text>
                  <Text style={styles.heroFeatureDesc}>
                    Pose tes questions vocalement ou échange en appel vidéo direct.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.heroActionBox}>
              <Button
                title="Créer mon compte"
                size="lg"
                onPress={() => setStep(1)}
                style={{ width: '100%', marginBottom: 12 }}
              />
              <Text style={styles.heroNote}>
                Inscription rapide en 5 étapes simples (2 minutes)
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // ÉCRAN 1 : IDENTITÉ (Nom, Âge, École)
  // ==========================================
  const renderStep1Identite = () => (
    <View style={styles.formCard}>
      <View style={styles.stepTitleRow}>
        <View style={styles.stepIconCircle}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.stepTitle}>Identité</Text>
          <Text style={styles.stepSubtitle}>Parle-nous un peu de toi</Text>
        </View>
      </View>

      {/* Nom complet */}
      <Text style={styles.label}>Nom et prénom complet *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Awa Koffi"
        placeholderTextColor={COLORS.textMuted}
        value={nom}
        onChangeText={setNom}
      />

      {/* Âge */}
      <View style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Âge (entre 9 et 25 ans) *</Text>
          {age && (
            <Text
              style={[
                styles.ageStatusText,
                isAgeValid ? styles.ageValidText : styles.ageInvalidText,
              ]}
            >
              {isAgeValid ? '✓ Âge valide' : '⚠️ Doit être entre 9 et 25 ans'}
            </Text>
          )}
        </View>
        <TextInput
          style={[styles.input, !isAgeValid && age.length > 0 && styles.inputError]}
          placeholder="Ex: 15"
          placeholderTextColor={COLORS.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={2}
        />
        {/* Quick Age Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ageChipsRow}
        >
          {['12', '13', '14', '15', '16', '17', '18'].map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setAge(a)}
              style={[styles.ageChip, age === a && styles.ageChipSelected]}
            >
              <Text style={[styles.ageChipText, age === a && styles.ageChipTextSelected]}>
                {a} ans
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* École */}
      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Établissement scolaire (10 écoles partenaires) *</Text>
        <Text style={styles.inputHelp}>
          Choisis parmi les écoles partenaires ou tape le nom de ton établissement :
        </Text>

        <View style={styles.schoolChipsContainer}>
          {ECOLES_PARTENAIRES.map((sch) => {
            const isSelected = ecole === sch && !customEcole;
            return (
              <TouchableOpacity
                key={sch}
                onPress={() => {
                  setEcole(sch);
                  setCustomEcole('');
                }}
                style={[styles.schoolChip, isSelected && styles.schoolChipSelected]}
              >
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'business-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.schoolChipText, isSelected && styles.schoolChipTextSelected]}
                >
                  {sch}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Ou saisis un autre établissement :</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Collège Moderne de Bouaké..."
          placeholderTextColor={COLORS.textMuted}
          value={customEcole}
          onChangeText={(val: string) => setCustomEcole(val)}
        />
      </View>

      {/* Navigation Buttons */}
      <View style={styles.stepActionsRow}>
        <Button
          title="Suivant : Choisir ma classe"
          size="lg"
          disabled={!isStep1Valid}
          onPress={() => setStep(2)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  // ==========================================
  // ÉCRAN 2 : CLASSE (6e à Terminale + Logique hiérarchique)
  // ==========================================
  const renderStep2Classe = () => {
    const helperClasses = getHelperClassesList(classe);
    const restrictedClasses = getRestrictedClassesList(classe);

    return (
      <View style={styles.formCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepIconCircle}>
            <Ionicons name="layers" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.stepTitle}>Ta classe actuelle</Text>
            <Text style={styles.stepSubtitle}>
              Définit le périmètre d'entraide et les quiz
            </Text>
          </View>
        </View>

        {/* Classe selector grid */}
        <Text style={styles.label}>Sélectionne ta classe (de la 6e à la Terminale) :</Text>
        <View style={styles.classGrid}>
          {CLASSES_LIST.map((c) => {
            const isSelected = classe === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setClasse(c)}
                style={[styles.classGridCard, isSelected && styles.classGridCardSelected]}
              >
                <Text
                  style={[
                    styles.classGridCardText,
                    isSelected && styles.classGridCardTextSelected,
                  ]}
                >
                  {c}
                </Text>
                {c === 'Tle' && (
                  <View style={styles.tleBadge}>
                    <Text style={styles.tleBadgeText}>Toutes classes</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Hierarchy Explanation Card */}
        <Card variant="flat" style={styles.hierarchyCard}>
          <View style={styles.hierarchyHeaderRow}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.hierarchyTitle}>
              Logique de hiérarchie pour la {classe} :
            </Text>
          </View>

          {classe === 'Tle' ? (
            <View style={styles.hierarchyBoxHighlight}>
              <Text style={styles.hierarchySuccessText}>
                👑 <Text style={{ fontWeight: '800' }}>Privilège Terminale :</Text> En
                Terminale, tu peux aider les élèves de <Text style={{ fontWeight: '800' }}>Terminale</Text> ainsi
                que toutes les autres classes (1ère, 2nde, 3e, 4e, 5e, 6e) !
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.hierarchyRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
                <Text style={styles.hierarchyText}>
                  Tu pourras aider en :{' '}
                  <Text style={{ fontWeight: '700', color: COLORS.secondary }}>
                    {helperClasses.join(', ')}
                  </Text>
                </Text>
              </View>

              {restrictedClasses.length > 0 && (
                <View style={[styles.hierarchyRow, { marginTop: 6 }]}>
                  <Ionicons name="close-circle" size={18} color="#DC2626" />
                  <Text style={styles.hierarchyText}>
                    Tu ne pourras pas aider en :{' '}
                    <Text style={{ fontWeight: '600', color: '#DC2626' }}>
                      {restrictedClasses.join(', ')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Navigation Buttons */}
        <View style={styles.stepActionsRow}>
          <Button
            title="Précédent"
            variant="outline"
            size="lg"
            onPress={() => setStep(1)}
            style={{ marginRight: 8, flex: 0.8 }}
          />
          <Button
            title="Suivant : Matières"
            size="lg"
            disabled={!isStep2Valid}
            onPress={() => setStep(3)}
            style={{ flex: 1.2 }}
          />
        </View>
      </View>
    );
  };

  // ==========================================
  // ÉCRAN 3 : POINTS FORTS (Exactement 2 matières)
  // ==========================================
  const renderStep3PointsForts = () => {
    const targetLevel = getQuizTargetLevel(classe);

    return (
      <View style={styles.formCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepIconCircle}>
            <Ionicons name="star" size={24} color={COLORS.accent} />
          </View>
          <View>
            <Text style={styles.stepTitle}>Tes points forts</Text>
            <Text style={styles.stepSubtitle}>
              Matières dans lesquelles tu souhaites aider
            </Text>
          </View>
        </View>

        <View style={styles.selectionCounterBox}>
          <Text style={styles.counterText}>
            Sélectionne <Text style={{ fontWeight: '800' }}>exactement 2 matières</Text> :
          </Text>
          <Badge
            label={`${selectedMatieres.length} / 2 sélectionnée(s)`}
            variant={selectedMatieres.length === 2 ? 'secondary' : 'neutral'}
            size="md"
          />
        </View>

        {/* List of Subjects */}
        <View style={styles.matieresGrid}>
          {matieres.map((mat) => {
            const isSelected = selectedMatieres.includes(mat.nom);
            return (
              <TouchableOpacity
                key={mat.id}
                onPress={() => handleToggleMatiere(mat.nom)}
                style={[
                  styles.matiereCard,
                  isSelected && styles.matiereCardSelected,
                ]}
              >
                <View style={styles.matiereLeft}>
                  <View
                    style={[
                      styles.matiereIconCircle,
                      { backgroundColor: `${mat.color || COLORS.primary}20` },
                    ]}
                  >
                    <Ionicons
                      name={(mat.icon as any) || 'book'}
                      size={20}
                      color={mat.color || COLORS.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.matiereCardTitle,
                        isSelected && styles.matiereCardTitleSelected,
                      ]}
                    >
                      {mat.nom}
                    </Text>
                    <Text style={styles.matiereCoeff}>
                      Coeff {mat.coefficient}x {mat.coefficient > 1 && '⭐ Bonus'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.checkboxCircle,
                    isSelected && styles.checkboxCircleSelected,
                  ]}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanatory note */}
        <View style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoBannerText}>
            Pour devenir tuteur visible, chaque matière choisie déclenchera le quiz du niveau
            immédiatement inférieur (ici : <Text style={{ fontWeight: '700' }}>quiz niveau {targetLevel}</Text>).
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.stepActionsRow}>
          <Button
            title="Précédent"
            variant="outline"
            size="lg"
            onPress={() => setStep(2)}
            style={{ marginRight: 8, flex: 0.8 }}
          />
          <Button
            title="Suivant : Sécurité"
            size="lg"
            disabled={!isStep3Valid}
            onPress={() => setStep(4)}
            style={{ flex: 1.2 }}
          />
        </View>
      </View>
    );
  };

  // ==========================================
  // ÉCRAN 4 : KYC (Sécurité & Document élève)
  // ==========================================
  const renderStep4Kyc = () => {
    return (
      <View style={styles.formCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.secondary} />
          </View>
          <View>
            <Text style={styles.stepTitle}>Vérification élève (KYC)</Text>
            <Text style={styles.stepSubtitle}>
              Sécurise la communauté LinkUp
            </Text>
          </View>
        </View>

        <Text style={styles.kycNotice}>
          Pour garantir que LinkUp reste un espace 100% réservé aux élèves, sélectionne ton justificatif de scolarité :
        </Text>

        {/* Document type selector */}
        <Text style={styles.label}>Type de document à fournir :</Text>
        <View style={styles.docTypeRow}>
          <TouchableOpacity
            onPress={() => handleUseDemoDoc('carte_scolaire')}
            style={[
              styles.docTypeBtn,
              kycDocType === 'carte_scolaire' && styles.docTypeBtnSelected,
            ]}
          >
            <Ionicons
              name="card"
              size={22}
              color={kycDocType === 'carte_scolaire' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.docTypeBtnTitle,
                kycDocType === 'carte_scolaire' && styles.docTypeBtnTitleSelected,
              ]}
            >
              Carte scolaire
            </Text>
            <Text style={styles.docTypeBtnSubtitle}>Badge ou carte d'élève</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleUseDemoDoc('recu_inscription')}
            style={[
              styles.docTypeBtn,
              kycDocType === 'recu_inscription' && styles.docTypeBtnSelected,
            ]}
          >
            <Ionicons
              name="document-text"
              size={22}
              color={kycDocType === 'recu_inscription' ? COLORS.secondary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.docTypeBtnTitle,
                kycDocType === 'recu_inscription' && styles.docTypeBtnTitleSelected,
              ]}
            >
              Reçu d'inscription
            </Text>
            <Text style={styles.docTypeBtnSubtitle}>Certificat ou reçu</Text>
          </TouchableOpacity>
        </View>

        {/* Image Selection Area */}
        <View style={styles.uploadArea}>
          <Text style={styles.label}>Aperçu du document sélectionné :</Text>

          {kycImageUri ? (
            <View style={styles.docPreviewCard}>
              <Image
                source={{ uri: kycImageUri }}
                style={styles.docPreviewImage}
                resizeMode="contain"
              />
              <View style={styles.docPreviewInfo}>
                <View style={styles.docStatusRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
                  <Text style={styles.docStatusText}>
                    Document {kycDocType === 'carte_scolaire' ? 'Carte Scolaire' : 'Reçu'} chargé
                  </Text>
                </View>
                <Text style={styles.docSubStatus}>
                  Statut MVP : kyc_soumis = true (Validé localement)
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyUploadBox}>
              <Ionicons name="cloud-upload-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyUploadText}>
                Aucun document sélectionné
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.uploadActionsRow}>
            <Button
              title="📁 Choisir une image depuis l'appareil"
              variant="outline"
              size="md"
              onPress={handlePickCustomImage}
              style={{ flex: 1, marginRight: 6 }}
            />
            <Button
              title="⚡ Modèle démo"
              variant="ghost"
              size="md"
              onPress={() => handleUseDemoDoc(kycDocType)}
            />
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.stepActionsRow}>
          <Button
            title="Précédent"
            variant="outline"
            size="lg"
            onPress={() => setStep(3)}
            style={{ marginRight: 8, flex: 0.8 }}
          />
          <Button
            title="Suivant : Récapitulatif"
            size="lg"
            disabled={!isStep4Valid}
            onPress={() => setStep(5)}
            style={{ flex: 1.2 }}
          />
        </View>
      </View>
    );
  };

  // ==========================================
  // ÉCRAN 5 : RÉCAPITULATIF (Confirmation & Auto-login)
  // ==========================================
  const renderStep5Recapitulatif = () => {
    const helperClasses = getHelperClassesList(classe);

    return (
      <View style={styles.formCard}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepIconCircle}>
            <Ionicons name="checkmark-done-circle" size={24} color={COLORS.secondary} />
          </View>
          <View>
            <Text style={styles.stepTitle}>Récapitulatif</Text>
            <Text style={styles.stepSubtitle}>
              Vérifie tes informations avant de valider
            </Text>
          </View>
        </View>

        {/* Profile Card Summary */}
        <View style={styles.recapCard}>
          <View style={styles.recapTop}>
            <View style={styles.recapAvatar}>
              <Text style={styles.recapAvatarText}>
                {nom.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recapName}>{nom}</Text>
              <Text style={styles.recapSchool}>{activeEcole}</Text>
              <View style={styles.recapBadgesRow}>
                <Badge label={`${age} ans`} variant="neutral" size="sm" />
                <Badge label={`Classe : ${classe}`} variant="primary" size="sm" />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Helper scope */}
          <View style={styles.recapSection}>
            <Text style={styles.recapSectionLabel}>Éligibilité d'aide :</Text>
            <Text style={styles.recapSectionValue}>
              Peut aider en : <Text style={{ fontWeight: '700' }}>{helperClasses.join(', ')}</Text>
            </Text>
          </View>

          {/* Strong Subjects */}
          <View style={styles.recapSection}>
            <Text style={styles.recapSectionLabel}>Matières fortes sélectionnées :</Text>
            <View style={styles.recapSubjectsRow}>
              {selectedMatieres.map((m) => (
                <Badge key={m} label={`⭐ ${m}`} variant="secondary" size="md" />
              ))}
            </View>
          </View>

          {/* KYC Doc Thumbnail */}
          <View style={styles.recapSection}>
            <Text style={styles.recapSectionLabel}>Justificatif élève :</Text>
            <View style={styles.recapDocRow}>
              {kycImageUri && (
                <Image
                  source={{ uri: kycImageUri }}
                  style={styles.recapDocThumb}
                  resizeMode="contain"
                />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.recapDocTitle}>
                  {kycDocType === 'carte_scolaire' ? 'Carte scolaire' : "Reçu d'inscription"}
                </Text>
                <Badge label="✓ Document validé" variant="secondary" size="sm" />
              </View>
            </View>
          </View>

          {/* Welcome Credit Gift */}
          <View style={styles.welcomeGiftBanner}>
            <Ionicons name="sparkles" size={24} color="#92400E" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.welcomeGiftTitle}>Bonus de bienvenue</Text>
              <Text style={styles.welcomeGiftDesc}>
                +20 crédits temps offerts pour tester l'entraide immédiatement !
              </Text>
            </View>
          </View>
        </View>

        {/* Preferred Initial Mode */}
        <Text style={[styles.label, { marginTop: 16 }]}>Ton objectif initial :</Text>
        <View style={styles.roleChoiceRow}>
          <TouchableOpacity
            onPress={() => setRolePrefere('besoin')}
            style={[styles.roleChoiceBtn, rolePrefere === 'besoin' && styles.roleChoiceBtnSelected]}
          >
            <Ionicons
              name="help-circle"
              size={18}
              color={rolePrefere === 'besoin' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.roleChoiceText,
                rolePrefere === 'besoin' && styles.roleChoiceTextSelected,
              ]}
            >
              Poser des questions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRolePrefere('aide')}
            style={[styles.roleChoiceBtn, rolePrefere === 'aide' && styles.roleChoiceBtnSelected]}
          >
            <Ionicons
              name="heart"
              size={18}
              color={rolePrefere === 'aide' ? COLORS.secondary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.roleChoiceText,
                rolePrefere === 'aide' && styles.roleChoiceTextSelected,
              ]}
            >
              Aider les autres
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRolePrefere('les_deux')}
            style={[
              styles.roleChoiceBtn,
              rolePrefere === 'les_deux' && styles.roleChoiceBtnSelected,
            ]}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={rolePrefere === 'les_deux' ? COLORS.accent : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.roleChoiceText,
                rolePrefere === 'les_deux' && styles.roleChoiceTextSelected,
              ]}
            >
              Les deux
            </Text>
          </TouchableOpacity>
        </View>

        {/* Final Submission Button */}
        <Button
          title="🎉 Confirmer et créer mon compte"
          size="lg"
          loading={isSubmitting}
          onPress={handleFinalSubmit}
          style={{ marginTop: 20 }}
        />

        <Button
          title="Précédent"
          variant="ghost"
          size="sm"
          onPress={() => setStep(4)}
          style={{ marginTop: 8 }}
        />
      </View>
    );
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
        <View style={styles.responsiveWrapper}>
          {renderStepper()}

          {step === 1 && renderStep1Identite()}
          {step === 2 && renderStep2Classe()}
          {step === 3 && renderStep3PointsForts()}
          {step === 4 && renderStep4Kyc()}
          {step === 5 && renderStep5Recapitulatif()}
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
    padding: 16,
    paddingTop: 24,
    paddingBottom: 90,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  topBackBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },

  // Hero Step 0 Styles
  heroScrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroLogo: {
    width: 84,
    height: 84,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  heroFeaturesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  heroFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroFeatureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroFeatureDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  heroActionBox: {
    alignItems: 'center',
  },
  heroNote: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Stepper Styles
  stepperWrapper: {
    marginBottom: 16,
  },
  stepperTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepperBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  stepperCurrentName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  stepsDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCurrent: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  stepDotCompleted: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepDotTextCurrent: {
    color: COLORS.primary,
  },

  // Form Cards
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
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
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  ageStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ageValidText: {
    color: COLORS.secondary,
  },
  ageInvalidText: {
    color: '#DC2626',
  },
  ageChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  ageChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ageChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ageChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ageChipTextSelected: {
    color: '#FFFFFF',
  },
  schoolChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  schoolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  schoolChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  schoolChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  schoolChipTextSelected: {
    color: '#FFFFFF',
  },

  // Step 2 Class Grid
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 6,
  },
  classGridCard: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classGridCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  classGridCardText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  classGridCardTextSelected: {
    color: '#FFFFFF',
  },
  tleBadge: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  tleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
  },
  hierarchyCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: COLORS.cardAlt,
  },
  hierarchyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  hierarchyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  hierarchyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hierarchyText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  hierarchyBoxHighlight: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
  },
  hierarchySuccessText: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
  },

  // Step 3 Points Forts
  selectionCounterBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterText: {
    fontSize: 13,
    color: COLORS.text,
  },
  matieresGrid: {
    gap: 8,
    marginBottom: 16,
  },
  matiereCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  matiereCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  matiereLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matiereIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matiereCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  matiereCardTitleSelected: {
    color: COLORS.secondary,
  },
  matiereCoeff: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
    lineHeight: 16,
  },

  // Step 4 KYC
  kycNotice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  docTypeBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  docTypeBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  docTypeBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  docTypeBtnTitleSelected: {
    color: COLORS.primary,
  },
  docTypeBtnSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  uploadArea: {
    marginBottom: 16,
  },
  docPreviewCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  docPreviewImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  docPreviewInfo: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  docStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  docSubStatus: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyUploadBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyUploadText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  // Step 5 Recap
  recapCard: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recapTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recapAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recapAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  recapName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  recapSchool: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  recapBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  recapSection: {
    marginBottom: 10,
  },
  recapSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  recapSectionValue: {
    fontSize: 13,
    color: COLORS.text,
  },
  recapSubjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recapDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recapDocThumb: {
    width: 60,
    height: 40,
    borderRadius: 6,
  },
  recapDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  welcomeGiftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  welcomeGiftTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
  welcomeGiftDesc: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  roleChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  roleChoiceBtn: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  roleChoiceBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  roleChoiceTextSelected: {
    color: COLORS.primary,
  },

  // Actions
  stepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
});
