import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { Page } from '../types';

const menuItems: { page: Page; icon: string; label: string }[] = [
  { page: 'dashboard', icon: '🏠', label: 'داشبورد' },
  { page: 'courses', icon: '📚', label: 'درس‌ها' },
  { page: 'calendar', icon: '📅', label: 'تقویم' },
  { page: 'study-plan', icon: '📋', label: 'برنامه مطالعه' },
  { page: 'flashcards', icon: '🃏', label: 'فلش‌کارت' },
  { page: 'notes', icon: '📝', label: 'جزوه‌ها' },
  { page: 'timer', icon: '⏱️', label: 'تایمر' },
  { page: 'settings', icon: '⚙️', label: 'تنظیمات' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200 dark:border-gray-700 shadow-2xl fixed right-0 top-0 z-40">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-black gradient-text text-center">Exam Master</h1>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">مدیریت هوشمند امتحانات</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.page}
              onClick={() => dispatch({ type: 'SET_PAGE', page: item.page })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${
                state.currentPage === item.page
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {state.settings.name.charAt(0) || '؟'}
            </div>
            <div>
              <p className="font-bold text-sm dark:text-white">{state.settings.name || 'کاربر'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{state.settings.major}</p>
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { darkMode: !state.settings.darkMode } })}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
          >
            {state.settings.darkMode ? '☀️ حالت روشن' : '🌙 حالت تاریک'}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-around items-center px-2 py-2">
          {menuItems.slice(0, 5).map(item => (
            <button
              key={item.page}
              onClick={() => { dispatch({ type: 'SET_PAGE', page: item.page }); setShowMore(false); }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                state.currentPage === item.page
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${showMore ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="text-lg">•••</span>
              <span className="text-[10px] font-medium">بیشتر</span>
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 min-w-[140px] animate-fadeIn">
                  {menuItems.slice(5).map(item => (
                    <button
                      key={item.page}
                      onClick={() => { dispatch({ type: 'SET_PAGE', page: item.page }); setShowMore(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-right text-sm transition-all ${
                        state.currentPage === item.page
                          ? 'bg-indigo-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
