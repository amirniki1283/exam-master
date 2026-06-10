import type { AIProvider } from './services/aiService';
export type { AIProvider };

export interface Course {
  id: string;
  name: string;
  units: number;
  importance: number; // 1-5
  colorIndex: number;
  examDate?: { jy: number; jm: number; jd: number };
  examTime?: string;
  chapters: Chapter[];
  notes: string;
  pdfContent?: string;
}

export interface Chapter {
  id: string;
  title: string;
  studied: boolean;
  flashcards: Flashcard[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: number;
  nextReview?: number;
  score: number;
}

export interface StudyPlan {
  courseId: string;
  courseName: string;
  date: { jy: number; jm: number; jd: number };
  duration: number; // minutes
  priority: number;
  topic: string;
  done: boolean;
}

export interface UserSettings {
  name: string;
  major: string;
  semester: number;
  darkMode: boolean;
  // AI Settings
  apiKey: string;
  apiProvider: AIProvider;
  customEndpoint?: string;
  customModel?: string;
  // Study Settings
  studyHoursPerDay: number;
  setupComplete: boolean;
}

export type Page = 'welcome' | 'dashboard' | 'courses' | 'calendar' | 'study-plan' | 'flashcards' | 'notes' | 'timer' | 'settings';
