import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { majorNames, majors } from '../data/courses';
import { courseColors } from '../data/courses';
import type { Course, AIProvider } from '../types';

const API_OPTIONS: { id: AIProvider; name: string; icon: string; recommended?: boolean; description: string }[] = [
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    icon: '💎', 
    recommended: true,
    description: '✅ پیشنهادی - رایگان و کارآمد'
  },
  { 
    id: 'none', 
    name: 'هوشمند آفلاین', 
    icon: '🧠',
    description: 'بدون نیاز به API - دیتابیس داخلی'
  },
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: '🤖',
    description: 'نیاز به سرور proxy'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic Claude', 
    icon: '🧠',
    description: 'نیاز به سرور proxy'
  },
  { 
    id: 'custom', 
    name: 'سرور سفارشی', 
    icon: '⚙️',
    description: 'برای کاربران حرفه‌ای'
  },
];

export default function WelcomePage() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState(1);
  const [studyHours, setStudyHours] = useState(6);
  const [apiProvider, setApiProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [majorSearch, setMajorSearch] = useState('');
  const [systemDarkMode, setSystemDarkMode] = useState(false);

  // Detect system dark mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemDarkMode(e.matches);
      dispatch({ type: 'SET_SETTINGS', settings: { darkMode: e.matches } });
    };
    
    mediaQuery.addEventListener('change', handler);
    dispatch({ type: 'SET_SETTINGS', settings: { darkMode: mediaQuery.matches } });
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [dispatch]);

  const filteredMajors = majorNames.filter(m => m.includes(majorSearch));

  const semesterCourses = major && majors[major]
    ? majors[major].courses.filter(c => !c.semester || c.semester === semester)
    : [];

  const allMajorCourses = major && majors[major] ? majors[major].courses : [];

  const toggleCourse = (courseName: string) => {
    const newSet = new Set(selectedCourses);
    if (newSet.has(courseName)) {
      newSet.delete(courseName);
    } else {
      newSet.add(courseName);
    }
    setSelectedCourses(newSet);
  };

  const finishSetup = () => {
    const coursesArr: Course[] = Array.from(selectedCourses).map((cName, i) => {
      const tmpl = allMajorCourses.find(c => c.name === cName);
      return {
        id: crypto.randomUUID(),
        name: cName,
        units: tmpl?.units || 3,
        importance: tmpl?.importance || 3,
        colorIndex: i % courseColors.length,
        chapters: [],
        notes: '',
      };
    });

    dispatch({ type: 'SET_COURSES', courses: coursesArr });
    dispatch({
      type: 'SET_SETTINGS',
      settings: {
        name,
        major,
        semester,
        studyHoursPerDay: studyHours,
        apiKey,
        apiProvider,
        setupComplete: true,
        darkMode: systemDarkMode,
      },
    });
    dispatch({ type: 'SET_PAGE', page: 'dashboard' });
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="animate-fadeIn text-center space-y-6 px-4">
      <div className="text-7xl mb-4">📚</div>
      <h1 className="text-4xl font-black gradient-text">Exam Master</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
        هوشمندترین برنامه مدیریت امتحانات برای دانشجویان
        <br />
        <span className="text-sm text-gray-500">دانشگاه صنعتی همدان</span>
      </p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <button
          onClick={() => setStep(1)}
          className="btn-gradient text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl"
        >
          شروع کنیم! 🚀
        </button>
      </div>
      <p className="text-xs text-gray-400">
        نسخه ۱.۳.۰ | ساخته شده برای بچه‌های HUT ❤️
      </p>
    </div>,

    // Step 1: Name
    <div key="name" className="animate-fadeIn space-y-5 max-w-md mx-auto px-4">
      <div className="text-5xl text-center">👋</div>
      <h2 className="text-2xl font-bold text-center dark:text-white">اسمت چیه؟</h2>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="اسمتو وارد کن..."
        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-lg focus:border-indigo-500 focus:outline-none transition-all"
        autoFocus
      />
      <div className="flex gap-3">
        <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm">قبلی</button>
        <button
          onClick={() => name.trim() && setStep(2)}
          disabled={!name.trim()}
          className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold disabled:opacity-50 text-sm"
        >
          بعدی ←
        </button>
      </div>
    </div>,

    // Step 2: Major
    <div key="major" className="animate-fadeIn space-y-5 max-w-md mx-auto px-4">
      <div className="text-5xl text-center">🎓</div>
      <h2 className="text-2xl font-bold text-center dark:text-white">رشته‌ت چیه {name}؟</h2>
      <input
        type="text"
        value={majorSearch}
        onChange={e => setMajorSearch(e.target.value)}
        placeholder="جستجوی رشته..."
        className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white focus:border-indigo-500 focus:outline-none"
      />
      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {filteredMajors.map(m => (
          <button
            key={m}
            onClick={() => { setMajor(m); setMajorSearch(''); }}
            className={`p-3 rounded-xl text-right transition-all text-sm ${
              major === m
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-600'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm">قبلی</button>
        <button
          onClick={() => major && setStep(3)}
          disabled={!major}
          className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold disabled:opacity-50 text-sm"
        >
          بعدی ←
        </button>
      </div>
    </div>,

    // Step 3: Semester
    <div key="semester" className="animate-fadeIn space-y-5 max-w-md mx-auto px-4">
      <div className="text-5xl text-center">📅</div>
      <h2 className="text-2xl font-bold text-center dark:text-white">ترم چندمی؟</h2>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
          <button
            key={s}
            onClick={() => setSemester(s)}
            className={`p-3 rounded-xl text-lg font-bold transition-all ${
              semester === s
                ? 'bg-indigo-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm">قبلی</button>
        <button onClick={() => setStep(4)} className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold text-sm">بعدی ←</button>
      </div>
    </div>,

    // Step 4: API Configuration
    <div key="api" className="animate-fadeIn space-y-4 max-w-lg mx-auto px-4">
      <div className="text-5xl text-center">🤖</div>
      <h2 className="text-2xl font-bold text-center dark:text-white">هوش مصنوعی</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
        انتخاب کنید چگونه فلش‌کارت و سرفصل تولید شود
      </p>

      <div className="space-y-2">
        {API_OPTIONS.map(option => (
          <button
            key={option.id}
            onClick={() => setApiProvider(option.id)}
            className={`w-full p-3 rounded-xl border-2 text-right transition-all flex items-center gap-3 ${
              apiProvider === option.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{option.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold dark:text-white text-sm">{option.name}</span>
                {option.recommended && (
                  <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">پیشنهادی</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
            </div>
            {apiProvider === option.id && <span className="text-indigo-500">✓</span>}
          </button>
        ))}
      </div>

      {/* Gemini API Key Input */}
      {apiProvider === 'gemini' && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700 animate-fadeIn">
          <label className="block text-sm font-bold text-green-800 dark:text-green-300 mb-2">
            💎 کلید API Gemini (اختیاری)
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 rounded-xl border border-green-300 dark:border-green-600 bg-white dark:bg-gray-800 dark:text-white text-sm focus:border-green-500 focus:outline-none mb-2 font-mono"
            dir="ltr"
          />
          
          {apiKey && !apiKey.trim().startsWith('AIza') && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-2 rounded-lg text-xs mb-2">
              ❌ کلید باید با <strong>AIza</strong> شروع بشه! از لینک زیر کلید درست بگیرید.
            </div>
          )}
          
          {apiKey && apiKey.trim().startsWith('AIza') && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-2 rounded-lg text-xs mb-2">
              ✅ فرمت کلید درسته!
            </div>
          )}
          
          <button
            onClick={() => setShowApiHelp(!showApiHelp)}
            className="text-xs text-green-700 dark:text-green-400 underline"
          >
            {showApiHelp ? '❌ بستن آموزش' : '📖 آموزش گرفتن کلید (خیلی مهم!)'}
          </button>
          
          {showApiHelp && (
            <div className="mt-3 text-xs text-green-800 dark:text-green-300 bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <p className="font-black text-sm">⚡ مراحل گرفتن کلید رایگان Gemini:</p>
              
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 p-2 rounded-lg">
                ⚠️ <strong>مهم:</strong> کلید حتماً باید با <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">AIza</code> شروع بشه!
              </div>
              
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  به این لینک برو (با VPN اگه لازمه):
                  <br />
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 dark:text-blue-400 break-all">
                    aistudio.google.com/app/apikey
                  </a>
                </li>
                <li>با <strong>حساب Google</strong> وارد شو</li>
                <li>روی دکمه <strong>"Create API key"</strong> کلیک کن</li>
                <li>یک پروژه Google Cloud انتخاب کن (یا بذار خودش بسازه)</li>
                <li>
                  کلیدی مثل این تولید میشه:
                  <br />
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded block mt-1 text-[10px]">AIzaSyA1b2c3D4e5F6g7H8i9J0kLmNoPqRsTuV</code>
                </li>
                <li>اون کلید رو کپی و اینجا paste کن</li>
              </ol>
              
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-2 rounded-lg">
                💡 بدون کلید هم برنامه کاملاً کار می‌کنه! فقط از دیتابیس داخلی استفاده میشه.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other API Key Input */}
      {(apiProvider === 'openai' || apiProvider === 'anthropic' || apiProvider === 'custom') && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700 animate-fadeIn">
          <label className="block text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
            🔑 کلید API
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="کلید API..."
            className="w-full px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 dark:text-white text-sm focus:border-amber-500 focus:outline-none"
          />
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
            ⚠️ توجه: این سرویس‌ها از مرورگر مستقیم کار نمی‌کنند (CORS). پیشنهاد می‌کنیم از Gemini یا حالت آفلاین استفاده کنید.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm">قبلی</button>
        <button onClick={() => setStep(5)} className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold text-sm">
          {apiKey ? '✓ ' : ''}بعدی ←
        </button>
      </div>
    </div>,

    // Step 5: Select courses
    <div key="courses" className="animate-fadeIn space-y-4 max-w-2xl mx-auto px-4">
      <div className="text-4xl text-center">📖</div>
      <h2 className="text-xl font-bold text-center dark:text-white">درس‌های این ترم رو انتخاب کن</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
        درس‌های پیشنهادی ترم {semester} مشخص شدن
      </p>

      {semesterCourses.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">پیشنهادی ترم {semester}:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {semesterCourses.map(c => (
              <button
                key={c.name}
                onClick={() => toggleCourse(c.name)}
                className={`p-3 rounded-xl text-right flex items-center justify-between transition-all text-xs ${
                  selectedCourses.has(c.name)
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-[10px] opacity-75">{c.units} واحد</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <details className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
        <summary className="cursor-pointer font-bold text-gray-700 dark:text-gray-300 text-sm">همه درس‌های {major}</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-40 overflow-y-auto">
          {allMajorCourses.filter(c => !semesterCourses.includes(c)).map(c => (
            <button
              key={c.name}
              onClick={() => toggleCourse(c.name)}
              className={`p-2 rounded-xl text-right flex items-center justify-between transition-all text-xs ${
                selectedCourses.has(c.name)
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-600'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[10px] opacity-75">{c.units}و</span>
            </button>
          ))}
        </div>
      </details>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {selectedCourses.size} درس انتخاب شده
      </p>

      <div className="flex gap-3">
        <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm">قبلی</button>
        <button
          onClick={() => selectedCourses.size > 0 && setStep(6)}
          disabled={selectedCourses.size === 0}
          className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold disabled:opacity-50 text-sm"
        >
          بعدی ←
        </button>
      </div>
    </div>,

    // Step 6: Study hours & Final
    <div key="config" className="animate-fadeIn space-y-5 max-w-md mx-auto px-4">
      <div className="text-5xl text-center">⚙️</div>
      <h2 className="text-2xl font-bold text-center dark:text-white">تنظیمات نهایی</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ساعات مطالعه روزانه</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1} max={12}
              value={studyHours}
              onChange={e => setStudyHours(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 min-w-[3rem] text-center">{studyHours}</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🌙 حالت نمایش</label>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { darkMode: false } })}
              className={`flex-1 py-2 rounded-lg text-sm ${!systemDarkMode ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              ☀️ روشن
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { darkMode: true } })}
              className={`flex-1 py-2 rounded-lg text-sm ${systemDarkMode ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              🌙 تاریک
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">با تنظیمات دستگاه هماهنگ است</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
          <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">✅ خلاصه تنظیمات:</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>👤 نام: {name}</li>
            <li>🎓 رشته: {major}</li>
            <li>📅 ترم: {semester}</li>
            <li>📚 درس‌ها: {selectedCourses.size} درس</li>
            <li>🤖 AI: {API_OPTIONS.find(o => o.id === apiProvider)?.name}</li>
            <li>⏱️ مطالعه: {studyHours} ساعت/روز</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(5)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm">قبلی</button>
        <button
          onClick={finishSetup}
          className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold text-lg shadow-lg"
        >
          🎉 شروع!
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex justify-center gap-1 mb-6">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-indigo-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-6'
              }`}
            />
          ))}
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20 dark:border-gray-700/50">
          {steps[step]}
        </div>

        {/* Dark mode toggle */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              const newMode = !systemDarkMode;
              setSystemDarkMode(newMode);
              dispatch({ type: 'SET_SETTINGS', settings: { darkMode: newMode } });
            }}
            className="px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur text-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all"
          >
            {systemDarkMode ? '☀️ حالت روشن' : '🌙 حالت تاریک'}
          </button>
        </div>
      </div>
    </div>
  );
}
