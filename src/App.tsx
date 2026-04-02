import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, BottomNav, TopBar } from './components/Navigation';
import { SplashScreen } from './components/SplashScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { GameProvider, useGame } from './context/GameContext';
import { Screen } from './types';
import { cn } from './lib/utils';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const { connectionStatus, session, authReady } = useGame();

  useEffect(() => {
    if (!authReady) return;
    if (session) {
      setCurrentScreen((prev) => (prev === 'splash' ? 'lobby' : prev));
    } else {
      setCurrentScreen('splash');
    }
  }, [authReady, session]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 text-on-surface">
        <div className="font-orbitron text-secondary text-sm tracking-[0.35em] animate-pulse">RESTORING SESSION</div>
        <div className="font-inter text-on-surface-variant text-xs max-w-xs text-center">
          Checking saved login and reconnecting to Nakama…
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen key="splash" onStart={() => setCurrentScreen('lobby')} />;
      case 'lobby':
        return <LobbyScreen key="lobby" onEnterGame={() => setCurrentScreen('game')} />;
      case 'game':
        return <GameScreen key="game" onGameEnd={() => setCurrentScreen('victory')} />;
      case 'victory':
        return <VictoryScreen key="victory" onAction={(screen) => setCurrentScreen(screen)} />;
      case 'leaderboard':
        return <LeaderboardScreen key="leaderboard" />;
      case 'settings':
        return <SettingsScreen key="settings" onBack={() => setCurrentScreen('lobby')} />;
      default:
        return <SplashScreen key="splash" onStart={() => setCurrentScreen('lobby')} />;
    }
  };

  const showNavigation = currentScreen !== 'splash' && currentScreen !== 'game' && currentScreen !== 'victory';

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/30 text-on-surface overflow-x-hidden">
      {showNavigation && (
        <>
          <Sidebar currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
          <div className="md:hidden">
            <TopBar />
          </div>
        </>
      )}

      <main className={cn('transition-all duration-500 pb-24 md:pb-0', showNavigation ? 'md:ml-64' : 'ml-0')}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNavigation && <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />}

      {/* Connection status indicator */}
      {connectionStatus === 'connecting' && (
        <div className="fixed bottom-4 right-4 z-50 bg-secondary/20 border border-secondary/40 text-secondary px-4 py-2 rounded-xl font-orbitron text-xs tracking-wider animate-pulse">
          CONNECTING...
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
