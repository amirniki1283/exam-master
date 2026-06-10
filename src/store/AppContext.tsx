import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Course, UserSettings, Page, StudyPlan } from '../types';

interface AppState {
  settings: UserSettings;
  courses: Course[];
  studyPlans: StudyPlan[];
  currentPage: Page;
  aiStatus: 'connected' | 'disconnected' | 'testing';
  lastAIMessage: string;
}

type AppAction =
  | { type: 'SET_PAGE'; page: Page }
  | { type: 'SET_SETTINGS'; settings: Partial<UserSettings> }
  | { type: 'ADD_COURSE'; course: Course }
  | { type: 'UPDATE_COURSE'; course: Course }
  | { type: 'DELETE_COURSE'; id: string }
  | { type: 'SET_COURSES'; courses: Course[] }
  | { type: 'SET_STUDY_PLANS'; plans: StudyPlan[] }
  | { type: 'TOGGLE_PLAN_DONE'; index: number }
  | { type: 'LOAD_STATE'; state: Partial<AppState> }
  | { type: 'SET_AI_STATUS'; status: 'connected' | 'disconnected' | 'testing'; message?: string };

const defaultSettings: UserSettings = {
  name: '',
  major: '',
  semester: 1,
  darkMode: false,
  apiKey: '',
  apiProvider: 'none',
  customEndpoint: '',
  customModel: '',
  studyHoursPerDay: 6,
  setupComplete: false,
};

const initialState: AppState = {
  settings: defaultSettings,
  courses: [],
  studyPlans: [],
  currentPage: 'welcome',
  aiStatus: 'disconnected',
  lastAIMessage: '',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.course] };
    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: state.courses.map(c => c.id === action.course.id ? action.course : c),
      };
    case 'DELETE_COURSE':
      return { ...state, courses: state.courses.filter(c => c.id !== action.id) };
    case 'SET_COURSES':
      return { ...state, courses: action.courses };
    case 'SET_STUDY_PLANS':
      return { ...state, studyPlans: action.plans };
    case 'TOGGLE_PLAN_DONE': {
      const plans = [...state.studyPlans];
      if (plans[action.index]) {
        plans[action.index] = { ...plans[action.index], done: !plans[action.index].done };
      }
      return { ...state, studyPlans: plans };
    }
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    case 'SET_AI_STATUS':
      return { ...state, aiStatus: action.status, lastAIMessage: action.message || state.lastAIMessage };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem('exam-master-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          settings: { ...defaultSettings, ...parsed.settings },
          courses: parsed.courses || [],
          studyPlans: parsed.studyPlans || [],
          currentPage: (parsed.settings?.setupComplete ? 'dashboard' : 'welcome') as Page,
          aiStatus: 'disconnected' as const,
          lastAIMessage: '',
        };
      }
    } catch {
      // ignore
    }
    return initialState;
  });

  useEffect(() => {
    const toSave = {
      settings: state.settings,
      courses: state.courses,
      studyPlans: state.studyPlans,
    };
    localStorage.setItem('exam-master-state', JSON.stringify(toSave));
  }, [state.settings, state.courses, state.studyPlans]);

  useEffect(() => {
    if (state.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings.darkMode]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
