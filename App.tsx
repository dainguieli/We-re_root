import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS, SHADOWS } from './src/theme/colors';
import { Header } from './src/components/Header';
import { UserSwitcherModal } from './src/components/UserSwitcherModal';

// Screens
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DemandesListScreen } from './src/screens/DemandesListScreen';
import { CreateDemandeScreen } from './src/screens/CreateDemandeScreen';
import { DemandeDetailScreen } from './src/screens/DemandeDetailScreen';
import { TutorOnboardingScreen } from './src/screens/TutorOnboardingScreen';
import { ActiveSessionScreen } from './src/screens/ActiveSessionScreen';
import { RatingScreen } from './src/screens/RatingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Demande } from './src/types';

type ScreenType =
  | 'list'
  | 'create'
  | 'detail'
  | 'quizzes'
  | 'session'
  | 'rating'
  | 'profile'
  | 'register';

function MainApp() {
  const {
    currentUser,
    activeSession,
    pendingRatingSession,
  } = useApp();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('list');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [createMatiere, setCreateMatiere] = useState<string | undefined>(undefined);
  const [createRubrique, setCreateRubrique] = useState<string | undefined>(undefined);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState<boolean>(false);

  // If no user exists, show register screen
  if (!currentUser) {
    return (
      <RegisterScreen
        onSuccess={() => setCurrentScreen('list')}
      />
    );
  }

  // If there's a pending rating session to be completed
  if (pendingRatingSession && currentScreen !== 'rating') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <RatingScreen
          session={pendingRatingSession}
          onDone={() => setCurrentScreen('list')}
        />
      </SafeAreaView>
    );
  }

  const handleSelectDemande = (demande: Demande) => {
    setSelectedDemande(demande);
    setCurrentScreen('detail');
  };

  const handleOpenCreate = (matiere?: string, rubrique?: string) => {
    setCreateMatiere(matiere);
    setCreateRubrique(rubrique);
    setCurrentScreen('create');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'create':
        return (
          <CreateDemandeScreen
            initialMatiere={createMatiere}
            initialRubrique={createRubrique}
            onSuccess={() => {
              setCreateMatiere(undefined);
              setCreateRubrique(undefined);
              setCurrentScreen('list');
            }}
            onCancel={() => {
              setCreateMatiere(undefined);
              setCreateRubrique(undefined);
              setCurrentScreen('list');
            }}
          />
        );

      case 'detail':
        if (!selectedDemande) {
          return (
            <DemandesListScreen
              onSelectDemande={handleSelectDemande}
              onCreateDemande={handleOpenCreate}
              onOpenTutorQuizzes={() => setCurrentScreen('quizzes')}
            />
          );
        }
        return (
          <DemandeDetailScreen
            demande={selectedDemande}
            onBack={() => {
              setSelectedDemande(null);
              setCurrentScreen('list');
            }}
            onSessionStarted={() => setCurrentScreen('session')}
          />
        );

      case 'session':
        return (
          <ActiveSessionScreen
            onBack={() => setCurrentScreen('list')}
            onSessionEnded={() => setCurrentScreen('list')}
          />
        );

      case 'rating':
        if (!pendingRatingSession) {
          return (
            <DemandesListScreen
              onSelectDemande={handleSelectDemande}
              onCreateDemande={() => setCurrentScreen('create')}
              onOpenTutorQuizzes={() => setCurrentScreen('quizzes')}
            />
          );
        }
        return (
          <RatingScreen
            session={pendingRatingSession}
            onDone={() => setCurrentScreen('list')}
          />
        );

      case 'quizzes':
        return (
          <TutorOnboardingScreen
            onDone={() => setCurrentScreen('list')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            onOpenQuizzes={() => setCurrentScreen('quizzes')}
            onOpenUserSwitch={() => setIsUserSwitcherOpen(true)}
            onBack={() => setCurrentScreen('list')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            onSuccess={() => setCurrentScreen('list')}
            onCancel={() => setCurrentScreen('list')}
          />
        );

      case 'list':
      default:
        return (
          <DemandesListScreen
            onSelectDemande={handleSelectDemande}
            onCreateDemande={() => setCurrentScreen('create')}
            onOpenTutorQuizzes={() => setCurrentScreen('quizzes')}
          />
        );
    }
  };

  const showHeaderAndTabs =
    currentScreen === 'list' || currentScreen === 'quizzes' || currentScreen === 'profile';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Persistent Global Header on main tabs */}
      {showHeaderAndTabs && (
        <Header
          onOpenUserSwitch={() => setIsUserSwitcherOpen(true)}
          onOpenProfile={() => setCurrentScreen('profile')}
        />
      )}

      {/* Screen Body */}
      <View style={styles.body}>{renderCurrentScreen()}</View>

      {/* Bottom Tab Bar */}
      {showHeaderAndTabs && (
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCurrentScreen('list')}
              style={styles.tabItem}
            >
              <Ionicons
                name={currentScreen === 'list' ? 'list' : 'list-outline'}
                size={22}
                color={currentScreen === 'list' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'list' && styles.tabLabelActive,
                ]}
              >
                Demandes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCurrentScreen('quizzes')}
              style={styles.tabItem}
            >
              <Ionicons
                name={currentScreen === 'quizzes' ? 'ribbon' : 'ribbon-outline'}
                size={22}
                color={currentScreen === 'quizzes' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'quizzes' && styles.tabLabelActive,
                ]}
              >
                Quiz Tuteur
              </Text>
            </TouchableOpacity>

            {/* Center Create Action */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenCreate()}
              style={styles.centerFabTab}
            >
              <View style={styles.fabCircle}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.fabLabel}>Poser</Text>
            </TouchableOpacity>

            {/* Active Session tab if running */}
            {activeSession && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('session')}
                style={styles.tabItem}
              >
                <Ionicons
                  name="stopwatch"
                  size={22}
                  color={COLORS.secondary}
                />
                <Text style={[styles.tabLabel, { color: COLORS.secondary, fontWeight: '700' }]}>
                  Session
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCurrentScreen('profile')}
              style={styles.tabItem}
            >
              <Ionicons
                name={currentScreen === 'profile' ? 'person' : 'person-outline'}
                size={22}
                color={currentScreen === 'profile' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  currentScreen === 'profile' && styles.tabLabelActive,
                ]}
              >
                Profil
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Switcher Modal */}
      <UserSwitcherModal
        visible={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        onOpenRegisterNew={() => setCurrentScreen('register')}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  tabBarContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    ...SHADOWS.md,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  centerFabTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fabCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
});
