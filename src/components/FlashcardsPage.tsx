import { useState, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { courseColors } from '../data/courses';
import { toPersianNum } from '../utils/jalali';
import { generateFlashcards } from '../services/aiService';
import type { Flashcard } from '../types';

export default function FlashcardsPage() {
  const { state, dispatch } = useApp();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const course = state.courses.find(c => c.id === selectedCourse);
  const chapter = course?.chapters.find(ch => ch.id === selectedChapter);
  const cards = chapter?.flashcards || [];

  const generateCards = useCallback(async (courseId: string, chapterId: string) => {
    setGenerating(true);
    setStatusMessage('در حال تولید فلش‌کارت...');

    const c = state.courses.find(c2 => c2.id === courseId);
    const ch = c?.chapters.find(ch2 => ch2.id === chapterId);
    if (!c || !ch) {
      setGenerating(false);
      return;
    }

    const result = await generateFlashcards(
      {
        provider: state.settings.apiProvider,
        apiKey: state.settings.apiKey,
        customEndpoint: state.settings.customEndpoint,
        customModel: state.settings.customModel,
      },
      c.name,
      ch.title,
      5
    );

    setStatusMessage(result.message);
    dispatch({
      type: 'SET_AI_STATUS',
      status: result.usedFallback ? 'disconnected' : 'connected',
      message: result.message,
    });

    const newCards: Flashcard[] = result.cards.map((card, i) => ({
      id: crypto.randomUUID(),
      front: card.front,
      back: card.back,
      difficulty: i < 2 ? 'easy' as const : i < 4 ? 'medium' as const : 'hard' as const,
      score: 0,
    }));

    const updatedChapters = c.chapters.map(chapter2 =>
      chapter2.id === chapterId
        ? { ...chapter2, flashcards: newCards }
        : chapter2
    );

    dispatch({ type: 'UPDATE_COURSE', course: { ...c, chapters: updatedChapters } });
    setGenerating(false);

    // Clear message after 3 seconds
    setTimeout(() => setStatusMessage(''), 3000);
  }, [state.courses, state.settings, dispatch]);

  const refreshCard = useCallback(async (cardId: string) => {
    if (!course || !chapter) return;

    const result = await generateFlashcards(
      {
        provider: state.settings.apiProvider,
        apiKey: state.settings.apiKey,
        customEndpoint: state.settings.customEndpoint,
        customModel: state.settings.customModel,
      },
      course.name,
      chapter.title,
      1
    );

    if (result.cards.length > 0) {
      const newCard = result.cards[0];
      const updatedFlashcards = chapter.flashcards.map(fc =>
        fc.id === cardId ? { ...fc, front: newCard.front, back: newCard.back } : fc
      );

      const updatedChapters = course.chapters.map(ch =>
        ch.id === chapter.id ? { ...ch, flashcards: updatedFlashcards } : ch
      );

      dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: updatedChapters } });
      setStatusMessage(result.message);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  }, [course, chapter, state.settings, dispatch]);

  const rateCard = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!course || !chapter || !cards[currentCardIdx]) return;

    const card = cards[currentCardIdx];
    const scoreChange = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 1 : -1;

    const updatedFlashcards = chapter.flashcards.map(fc =>
      fc.id === card.id ? { ...fc, score: fc.score + scoreChange, difficulty, lastReviewed: Date.now() } : fc
    );

    const updatedChapters = course.chapters.map(ch =>
      ch.id === chapter.id ? { ...ch, flashcards: updatedFlashcards } : ch
    );

    dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: updatedChapters } });

    if (currentCardIdx < cards.length - 1) {
      setCurrentCardIdx(currentCardIdx + 1);
      setShowAnswer(false);
    } else {
      setStudyMode(false);
      setCurrentCardIdx(0);
    }
  };

  // Study mode
  if (studyMode && cards.length > 0) {
    const card = cards[currentCardIdx];
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fadeIn px-4">
        <div className="text-center mb-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            کارت {toPersianNum(currentCardIdx + 1)} از {toPersianNum(cards.length)}
          </span>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 max-w-xs mx-auto">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentCardIdx + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        <div
          onClick={() => setShowAnswer(!showAnswer)}
          className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 cursor-pointer transition-all hover:shadow-3xl border border-gray-100 dark:border-gray-700 min-h-[300px] flex flex-col items-center justify-center"
        >
          {!showAnswer ? (
            <div className="text-center">
              <span className="text-4xl mb-4 block">❓</span>
              <p className="text-xl font-bold dark:text-white leading-relaxed">{card?.front}</p>
              <p className="text-sm text-gray-400 mt-4">برای دیدن جواب کلیک کنید</p>
            </div>
          ) : (
            <div className="text-center animate-fadeIn">
              <span className="text-4xl mb-4 block">💡</span>
              <p className="text-lg dark:text-gray-200 leading-relaxed">{card?.back}</p>
            </div>
          )}
        </div>

        {showAnswer && (
          <div className="flex gap-3 mt-6 animate-fadeIn">
            <button onClick={() => rateCard('hard')} className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all">
              😰 سخت
            </button>
            <button onClick={() => rateCard('medium')} className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg hover:bg-amber-600 transition-all">
              🤔 متوسط
            </button>
            <button onClick={() => rateCard('easy')} className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold shadow-lg hover:bg-green-600 transition-all">
              😊 آسان
            </button>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {card && (
            <button onClick={() => refreshCard(card.id)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
              🔄 کارت جدید
            </button>
          )}
          <button onClick={() => { setStudyMode(false); setCurrentCardIdx(0); setShowAnswer(false); }} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            ✕ خروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black dark:text-white">🃏 فلش‌کارت</h1>
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
          state.aiStatus === 'connected'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${state.aiStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
          {state.aiStatus === 'connected' ? 'AI فعال' : 'دیتابیس داخلی'}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-sm font-medium animate-fadeIn ${
          statusMessage.includes('✅') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          statusMessage.includes('⚠️') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Course Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.courses.map(c => {
          const color = courseColors[c.colorIndex % courseColors.length];
          const totalCards = c.chapters.reduce((s, ch) => s + ch.flashcards.length, 0);
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedCourse(c.id); setSelectedChapter(null); }}
              className={`card-hover p-5 rounded-2xl text-right transition-all border-2 ${
                selectedCourse === c.id
                  ? `${color.border} ${color.light} dark:bg-opacity-20 shadow-lg`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center text-white text-xl`}>📖</div>
                <h3 className="font-bold dark:text-white">{c.name}</h3>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{toPersianNum(c.chapters.length)} فصل</span>
                <span>{toPersianNum(totalCards)} کارت</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chapter Selection */}
      {course && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-slideIn">
          <h3 className="font-bold text-lg dark:text-white mb-4">فصل‌های {course.name}</h3>

          {course.chapters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">ابتدا فصل‌ها را از بخش درس‌ها اضافه کنید</p>
              <button
                onClick={() => dispatch({ type: 'SET_PAGE', page: 'courses' })}
                className="btn-gradient text-white px-6 py-2 rounded-xl font-bold text-sm"
              >
                رفتن به مدیریت درس‌ها
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {course.chapters.map(ch => (
                <div
                  key={ch.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedChapter === ch.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button onClick={() => setSelectedChapter(ch.id)} className="flex-1 text-right">
                      <p className="font-medium dark:text-white">{ch.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{toPersianNum(ch.flashcards.length)} فلش‌کارت</p>
                    </button>
                    <div className="flex gap-2">
                      {ch.flashcards.length > 0 && (
                        <button
                          onClick={() => { setSelectedChapter(ch.id); setStudyMode(true); setCurrentCardIdx(0); setShowAnswer(false); }}
                          className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600"
                        >
                          ▶ مرور
                        </button>
                      )}
                      <button
                        onClick={() => generateCards(course.id, ch.id)}
                        disabled={generating}
                        className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 disabled:opacity-50"
                      >
                        {generating ? '⏳' : '🧠'} ساخت کارت
                      </button>
                    </div>
                  </div>

                  {/* Show cards preview */}
                  {selectedChapter === ch.id && ch.flashcards.length > 0 && (
                    <div className="mt-4 space-y-2 animate-fadeIn">
                      {ch.flashcards.map(fc => (
                        <div key={fc.id} className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${fc.difficulty === 'easy' ? 'bg-green-100 text-green-700' : fc.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {fc.difficulty === 'easy' ? 'آسان' : fc.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium dark:text-white">{fc.front}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fc.back}</p>
                          </div>
                          <button
                            onClick={() => refreshCard(fc.id)}
                            className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                            title="تولید مجدد"
                          >
                            🔄
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {state.courses.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🃏</div>
          <p className="text-xl text-gray-500 dark:text-gray-400">ابتدا درس‌ها و فصل‌ها رو اضافه کنید</p>
        </div>
      )}
    </div>
  );
}
