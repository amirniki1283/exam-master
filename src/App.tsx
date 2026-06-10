import { AppProvider, useApp } from './store/AppContext';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import CoursesPage from './components/CoursesPage';
import CalendarPage from './components/CalendarPage';
import StudyPlanPage from './components/StudyPlanPage';
import FlashcardsPage from './components/FlashcardsPage';
import NotesPage from './components/NotesPage';
import TimerPage from './components/TimerPage';
import SettingsPage from './components/SettingsPage';

function AppContent() {
  const { state } = useApp();

  if (!state.settings.setupComplete) {
    return <WelcomePage />;
  }

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'courses': return <CoursesPage />;
      case 'calendar': return <CalendarPage />;
      case 'study-plan': return <StudyPlanPage />;
      case 'flashcards': return <FlashcardsPage />;
      case 'notes': return <NotesPage />;
      case 'timer': return <TimerPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${state.settings.darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      <main className="lg:mr-64 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
