import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { toPersianNum } from '../utils/jalali';
import { courseColors } from '../data/courses';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

const TIMER_PRESETS = {
  study: 50 * 60,
  shortBreak: 10 * 60,
  longBreak: 30 * 60,
};

export default function TimerPage() {
  const { state } = useApp();
  const [mode, setMode] = useState<TimerMode>('study');
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.study);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [customStudy, setCustomStudy] = useState(50);
  const [customBreak, setCustomBreak] = useState(10);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const resetTimer = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    switch (newMode) {
      case 'study':
        setTimeLeft(customStudy * 60);
        break;
      case 'shortBreak':
        setTimeLeft(customBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(30 * 60);
        break;
    }
  }, [customStudy, customBreak]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);

            if (mode === 'study') {
              setSessions(s => s + 1);
              setTotalStudyTime(t => t + customStudy);
              // Play notification sound
              try {
                const audio = new AudioContext();
                const oscillator = audio.createOscillator();
                oscillator.connect(audio.destination);
                oscillator.frequency.setValueAtTime(800, audio.currentTime);
                oscillator.start();
                oscillator.stop(audio.currentTime + 0.3);
                setTimeout(() => {
                  const osc2 = audio.createOscillator();
                  osc2.connect(audio.destination);
                  osc2.frequency.setValueAtTime(1000, audio.currentTime);
                  osc2.start();
                  osc2.stop(audio.currentTime + 0.3);
                }, 400);
              } catch {
                // ignore
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, customStudy]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = mode === 'study' ? customStudy * 60 : mode === 'shortBreak' ? customBreak * 60 : 30 * 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-black dark:text-white">⏱️ تایمر مطالعه</h1>

      {/* Mode Selector */}
      <div className="flex gap-2 justify-center">
        {([
          { mode: 'study' as TimerMode, label: '📖 مطالعه', color: 'bg-indigo-500' },
          { mode: 'shortBreak' as TimerMode, label: '☕ استراحت کوتاه', color: 'bg-green-500' },
          { mode: 'longBreak' as TimerMode, label: '🌿 استراحت بلند', color: 'bg-teal-500' },
        ]).map(item => (
          <button
            key={item.mode}
            onClick={() => resetTimer(item.mode)}
            className={`px-5 py-3 rounded-xl font-bold transition-all text-sm ${
              mode === item.mode
                ? `${item.color} text-white shadow-lg`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Course Selector */}
      {mode === 'study' && (
        <div className="flex flex-wrap gap-2 justify-center">
          {state.courses.map(c => {
            const color = courseColors[c.colorIndex % courseColors.length];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCourse(c.id)}
                className={`px-3 py-2 rounded-xl text-sm transition-all border-2 ${
                  selectedCourse === c.id
                    ? `${color.border} ${color.light} dark:bg-opacity-20 font-bold`
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Timer Circle */}
      <div className="flex justify-center">
        <div className="relative w-72 h-72">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="8"
            />
            <circle
              cx="130"
              cy="130"
              r="120"
              fill="none"
              stroke={mode === 'study' ? '#6366f1' : mode === 'shortBreak' ? '#10b981' : '#14b8a6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black dark:text-white tracking-wider">
              {toPersianNum(String(minutes).padStart(2, '0'))}:{toPersianNum(String(seconds).padStart(2, '0'))}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {mode === 'study' ? '📖 زمان مطالعه' : mode === 'shortBreak' ? '☕ استراحت' : '🌿 استراحت بلند'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'btn-gradient text-white'
          }`}
        >
          {isRunning ? '⏸ توقف' : timeLeft === 0 ? '🔄 دوباره' : '▶ شروع'}
        </button>
        <button
          onClick={() => resetTimer(mode)}
          className="px-6 py-4 rounded-2xl font-bold text-lg border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        >
          🔄 ریست
        </button>
      </div>

      {/* Custom Time */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
        <h3 className="font-bold dark:text-white text-sm mb-3">⚙️ تنظیم زمان (دقیقه)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">مطالعه</label>
            <input
              type="number"
              value={customStudy}
              onChange={e => { setCustomStudy(Number(e.target.value)); if (!isRunning && mode === 'study') setTimeLeft(Number(e.target.value) * 60); }}
              min={5} max={120}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-center focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">استراحت</label>
            <input
              type="number"
              value={customBreak}
              onChange={e => { setCustomBreak(Number(e.target.value)); if (!isRunning && mode === 'shortBreak') setTimeLeft(Number(e.target.value) * 60); }}
              min={1} max={30}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-center focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center border border-gray-100 dark:border-gray-700">
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{toPersianNum(sessions)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">جلسه مطالعه</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center border border-gray-100 dark:border-gray-700">
          <p className="text-3xl font-black text-green-600 dark:text-green-400">{toPersianNum(totalStudyTime)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">دقیقه مطالعه</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center border border-gray-100 dark:border-gray-700 col-span-2 md:col-span-1">
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {toPersianNum(Math.floor(totalStudyTime / 60))}:{toPersianNum(String(totalStudyTime % 60).padStart(2, '0'))}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">ساعت:دقیقه کل</p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-700 max-w-lg mx-auto">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">💡 تکنیک پومودورو</h3>
        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
          <li>• ۵۰ دقیقه مطالعه متمرکز</li>
          <li>• ۱۰ دقیقه استراحت کوتاه</li>
          <li>• بعد از ۴ جلسه، ۳۰ دقیقه استراحت بلند</li>
          <li>• تمرکز بر یک موضوع در هر جلسه</li>
        </ul>
      </div>
    </div>
  );
}
