import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import quizBankJson from '../data/quiz_questions.json';
import { QuizQuestion, getQuizTargetLevel } from '../types';

interface TutorOnboardingScreenProps {
  onDone?: () => void;
}

export const TutorOnboardingScreen: React.FC<TutorOnboardingScreenProps> = ({ onDone }) => {
  const { currentUser, matieres, validateQuizForMatiere } = useApp();
  const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null);
  
  // Quiz active state
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  if (!currentUser) return null;

  const targetLevel = getQuizTargetLevel(currentUser.classe);

  const startQuiz = (matiereNom: string) => {
    const allQuestions = quizBankJson.questions as unknown as QuizQuestion[];

    // Filter questions for this subject and target level, or fallback to any questions for this subject
    let filtered = allQuestions.filter(
      (q) => q.matiere.toLowerCase() === matiereNom.toLowerCase() && q.niveau_cible === targetLevel
    );

    if (filtered.length < 3) {
      // Fallback to all questions for that subject
      const subjectPool = allQuestions.filter(
        (q) => q.matiere.toLowerCase() === matiereNom.toLowerCase()
      );
      filtered = subjectPool.length >= 3 ? subjectPool : allQuestions.slice(0, 3);
    }

    const selected3 = filtered.slice(0, 3);
    setActiveQuizQuestions(selected3);
    setSelectedMatiere(matiereNom);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setHasAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleSelectOption = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswerIndex(index);
  };

  const handleValidateAnswer = () => {
    if (selectedAnswerIndex === null) {
      Alert.alert('Attention', 'Veuillez sélectionner une réponse.');
      return;
    }

    const currentQ = activeQuizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswerIndex === currentQ.bonne_reponse_index;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setHasAnswered(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex + 1 < activeQuizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
      setHasAnswered(false);
    } else {
      // Quiz finished
      setQuizFinished(true);
      const finalScore = score;
      if (finalScore >= 2 && selectedMatiere) {
        await validateQuizForMatiere(selectedMatiere);
      }
    }
  };

  const handleExitQuiz = () => {
    setSelectedMatiere(null);
    setActiveQuizQuestions([]);
    setQuizFinished(false);
  };

  // QUIZ IN PROGRESS VIEW
  if (selectedMatiere && activeQuizQuestions.length > 0) {
    if (quizFinished) {
      const isPassed = score >= 2;
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.quizResultContent}>
            <View style={[styles.resultIconCircle, isPassed ? styles.resultSuccess : styles.resultFail]}>
              <Ionicons
                name={isPassed ? 'checkmark-circle' : 'close-circle'}
                size={60}
                color={isPassed ? COLORS.secondary : COLORS.danger}
              />
            </View>

            <Text style={styles.resultTitle}>
              {isPassed ? 'Félicitations !' : 'Encore un petit effort'}
            </Text>
            <Text style={styles.resultScoreText}>
              Score : {score} / 3
            </Text>

            <Text style={styles.resultDesc}>
              {isPassed
                ? `Tu as validé le quiz de ${selectedMatiere} (Niveau ${targetLevel}). Tu es maintenant certifié(e) aidant sur cette matière !`
                : `Il te faut au moins 2/3 pour valider la matière. Tu pourras retenter le quiz quand tu veux.`}
            </Text>

            <Button
              title={isPassed ? "Voir les demandes d'aide" : 'Retour aux matières'}
              variant={isPassed ? 'secondary' : 'primary'}
              size="lg"
              onPress={() => {
                handleExitQuiz();
                if (onDone) onDone();
              }}
              style={{ marginTop: 24, width: '100%' }}
            />
          </ScrollView>
        </View>
      );
    }

    const currentQ = activeQuizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswerIndex === currentQ.bonne_reponse_index;

    return (
      <View style={styles.container}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={handleExitQuiz} style={styles.quizCloseBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.quizHeaderCenter}>
            <Text style={styles.quizMatiereTitle}>{selectedMatiere}</Text>
            <Text style={styles.quizLevelSubtitle}>
              Test niveau {targetLevel} (inférieur à ta classe {currentUser.classe})
            </Text>
          </View>
          <Badge label={`${currentQuestionIndex + 1}/3`} variant="primary" />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentQuestionIndex + 1) / 3) * 100}%` },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.questionContent}>
          <Card style={styles.questionCard}>
            <Text style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
            </Text>
            <Text style={styles.questionText}>{currentQ.question}</Text>
          </Card>

          <View style={styles.optionsList}>
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswerIndex === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  disabled={hasAnswered}
                  onPress={() => handleSelectOption(idx)}
                  style={[
                    styles.optionCard,
                    hasAnswered && idx === currentQ.bonne_reponse_index && styles.optionCorrect,
                    hasAnswered && isSelected && idx !== currentQ.bonne_reponse_index && styles.optionWrong,
                    !hasAnswered && isSelected && styles.optionSelected,
                  ]}
                >
                  <View style={styles.optionLetterCircle}>
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                  {hasAnswered && idx === currentQ.bonne_reponse_index && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation when answered */}
          {hasAnswered && currentQ.explication && (
            <Card variant="flat" style={styles.explanationCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons
                  name={isCorrect ? 'checkmark-circle' : 'information-circle'}
                  size={18}
                  color={isCorrect ? COLORS.secondary : COLORS.accent}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.explanationTitle}>
                  {isCorrect ? 'Excellente réponse !' : 'Explication :'}
                </Text>
              </View>
              <Text style={styles.explanationText}>{currentQ.explication}</Text>
            </Card>
          )}
        </ScrollView>

        <View style={styles.quizFooter}>
          {!hasAnswered ? (
            <Button
              title="Valider ma réponse"
              size="lg"
              disabled={selectedAnswerIndex === null}
              onPress={handleValidateAnswer}
            />
          ) : (
            <Button
              title={currentQuestionIndex + 1 < 3 ? 'Question suivante' : 'Voir mon résultat'}
              variant="secondary"
              size="lg"
              onPress={handleNextQuestion}
            />
          )}
        </View>
      </View>
    );
  }

  // SUBJECT SELECTION LIST VIEW
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.responsiveWrapper}>
        <View style={styles.introHeader}>
          <Text style={styles.mainTitle}>Certification Aidant 🎓</Text>
          <Text style={styles.mainDesc}>
            Pour garantir des explications fiables, valide un court quiz de 3 questions (niveau {targetLevel}) sur chaque matière que tu souhaites débloquer.
          </Text>
        </View>

        <View style={styles.matieresGrid}>
          {matieres.map((mat) => {
            const isValidated = !!currentUser.quiz_valide_par_matiere[mat.nom];
            const isHighValue = mat.coefficient > 1.0;

            return (
              <Card
                key={mat.id}
                style={[
                  styles.matiereCard,
                  isValidated ? styles.matiereCardValidated : undefined,
                ]}
              >
                <View style={styles.matiereTopRow}>
                  <View style={[styles.matiereIconBadge, { backgroundColor: mat.color + '20' }]}>
                    <Ionicons name="book" size={20} color={mat.color} />
                  </View>
                  <View style={styles.badgeGroup}>
                    {isHighValue && (
                      <Badge label="x1.5 crédits" variant="accent" size="sm" />
                    )}
                    {isValidated ? (
                      <Badge label="Validé ✓" variant="secondary" size="sm" />
                    ) : (
                      <Badge label="À valider" variant="neutral" size="sm" />
                    )}
                  </View>
                </View>

                <Text style={styles.matiereName}>{mat.nom}</Text>
                <Text style={styles.matiereRubriquesText}>
                  {mat.rubriques.slice(0, 3).join(', ')}...
                </Text>

                <View style={{ marginTop: 12 }}>
                  {isValidated ? (
                    <Button
                      title="Rejouer le quiz"
                      variant="outline"
                      size="sm"
                      onPress={() => startQuiz(mat.nom)}
                    />
                  ) : (
                    <Button
                      title={`Passer le quiz (${targetLevel})`}
                      variant="primary"
                      size="sm"
                      onPress={() => startQuiz(mat.nom)}
                    />
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  introHeader: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  mainDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  matieresGrid: {
    gap: 12,
  },
  matiereCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.card,
  },
  matiereCardValidated: {
    borderColor: COLORS.secondary,
    borderWidth: 1.5,
  },
  matiereTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  matiereIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  matiereName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  matiereRubriquesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Quiz View Styles
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quizCloseBtn: {
    padding: 4,
  },
  quizHeaderCenter: {
    alignItems: 'center',
    flex: 1,
  },
  quizMatiereTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  quizLevelSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  questionContent: {
    padding: 16,
    paddingBottom: 80,
  },
  questionCard: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 24,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionCorrect: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  optionWrong: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  optionLetterCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  explanationCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  quizFooter: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  // Result View
  quizResultContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  resultIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultSuccess: {
    backgroundColor: COLORS.secondaryLight,
  },
  resultFail: {
    backgroundColor: COLORS.dangerLight,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  resultScoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  resultDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
