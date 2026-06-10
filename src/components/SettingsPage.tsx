import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { majorNames } from '../data/courses';
import { testAPIConnection, type AIProvider } from '../services/aiService';

const API_PROVIDERS: { id: AIProvider; name: string; icon: string; color: string }[] = [
  { id: 'gemini', name: 'Google Gemini', icon: '💎', color: 'green' },
  { id: 'none', name: 'هوشمند آفلاین', icon: '🧠', color: 'gray' },
  { id: 'openai', name: 'OpenAI', icon: '🤖', color: 'blue' },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠', color: 'purple' },
  { id: 'custom', name: 'سرور سفارشی', icon: '⚙️', color: 'orange' },
];

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const [apiKey, setApiKey] = useState(state.settings.apiKey);
  const [provider, setProvider] = useState<AIProvider>(state.settings.apiProvider);
  const [customEndpoint, setCustomEndpoint] = useState(state.settings.customEndpoint || '');
  const [customModel, setCustomModel] = useState(state.settings.customModel || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeHelp, setActiveHelp] = useState<AIProvider | null>(null);

  useEffect(() => {
    setApiKey(state.settings.apiKey);
    setProvider(state.settings.apiProvider);
    setCustomEndpoint(state.settings.customEndpoint || '');
    setCustomModel(state.settings.customModel || '');
  }, [state.settings]);

  const testApi = async () => {
    setTesting(true);
    setTestResult(null);
    dispatch({ type: 'SET_AI_STATUS', status: 'testing', message: 'در حال تست اتصال...' });

    const result = await testAPIConnection({
      provider,
      apiKey,
      customEndpoint,
      customModel,
    });

    setTestResult(result);
    dispatch({
      type: 'SET_AI_STATUS',
      status: result.success ? 'connected' : 'disconnected',
      message: result.message,
    });
    setTesting(false);
  };

  const saveApiSettings = () => {
    dispatch({
      type: 'SET_SETTINGS',
      settings: {
        apiKey,
        apiProvider: provider,
        customEndpoint,
        customModel,
      },
    });

    if (apiKey && provider !== 'none') {
      testApi();
    } else {
      dispatch({ type: 'SET_AI_STATUS', status: 'disconnected', message: 'حالت هوشمند آفلاین فعال است' });
    }
  };

  const exportData = () => {
    const data = {
      settings: state.settings,
      courses: state.courses,
      studyPlans: state.studyPlans,
      version: '1.3.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam-master-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) dispatch({ type: 'SET_SETTINGS', settings: data.settings });
        if (data.courses) dispatch({ type: 'SET_COURSES', courses: data.courses });
        if (data.studyPlans) dispatch({ type: 'SET_STUDY_PLANS', plans: data.studyPlans });
        alert('داده‌ها با موفقیت بازیابی شدند!');
      } catch {
        alert('خطا در خواندن فایل!');
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (confirm('آیا مطمئنید؟ تمام داده‌ها حذف خواهد شد!')) {
      localStorage.removeItem('exam-master-state');
      dispatch({ type: 'SET_SETTINGS', settings: { setupComplete: false } });
      dispatch({ type: 'SET_COURSES', courses: [] });
      dispatch({ type: 'SET_STUDY_PLANS', plans: [] });
      dispatch({ type: 'SET_PAGE', page: 'welcome' });
    }
  };

  const selectedProvider = API_PROVIDERS.find(p => p.id === provider);

  const renderApiHelp = (p: AIProvider) => {
    switch (p) {
      case 'gemini':
        return (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700 text-sm space-y-2">
            <h4 className="font-bold text-green-800 dark:text-green-300">💎 آموزش Google Gemini</h4>
            <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-400 text-xs">
              <li>به <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google AI Studio</a> بروید</li>
              <li>با حساب Google وارد شوید</li>
              <li>روی "Create API Key" کلیک کنید</li>
              <li>یک پروژه انتخاب کنید (یا بسازید)</li>
              <li>کلید را کپی کنید (با AIza شروع می‌شود)</li>
              <li>در اینجا paste کنید</li>
            </ol>
            <p className="text-[10px] text-green-600 dark:text-green-500">
              ✅ مزایا: رایگان، سریع، بدون CORS
            </p>
          </div>
        );
      case 'openai':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700 text-sm space-y-2">
            <h4 className="font-bold text-blue-800 dark:text-blue-300">🤖 آموزش OpenAI</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
              <li>به <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-bold">OpenAI Platform</a> بروید</li>
              <li>ثبت‌نام و ورود کنید</li>
              <li>روی "Create new secret key" کلیک کنید</li>
              <li>کلید را کپی کنید (با sk- شروع می‌شود)</li>
            </ol>
            <p className="text-[10px] text-amber-600 dark:text-amber-500">
              ⚠️ توجه: به دلیل CORS، از مرورگر مستقیم کار نمی‌کند. نیاز به سرور proxy دارید.
            </p>
          </div>
        );
      case 'anthropic':
        return (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700 text-sm space-y-2">
            <h4 className="font-bold text-purple-800 dark:text-purple-300">🧠 آموزش Anthropic Claude</h4>
            <ol className="list-decimal list-inside space-y-1 text-purple-700 dark:text-purple-400 text-xs">
              <li>به <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Anthropic Console</a> بروید</li>
              <li>ثبت‌نام کنید</li>
              <li>به بخش API Keys بروید</li>
              <li>یک کلید بسازید (با sk-ant- شروع می‌شود)</li>
            </ol>
            <p className="text-[10px] text-amber-600 dark:text-amber-500">
              ⚠️ توجه: به دلیل CORS، از مرورگر مستقیم کار نمی‌کند.
            </p>
          </div>
        );
      case 'custom':
        return (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700 text-sm space-y-2">
            <h4 className="font-bold text-orange-800 dark:text-orange-300">⚙️ سرور سفارشی</h4>
            <p className="text-orange-700 dark:text-orange-400 text-xs">
              برای کاربران حرفه‌ای که سرور proxy یا API شخصی دارند.
            </p>
            <div className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
              <p><strong>Endpoint:</strong> آدرس کامل API</p>
              <p><strong>Model:</strong> نام مدل (مثلاً: gpt-3.5-turbo)</p>
              <p>فرمت OpenAI-compatible باید باشد</p>
            </div>
          </div>
        );
      case 'none':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm space-y-2">
            <h4 className="font-bold text-gray-800 dark:text-gray-300">🧠 حالت هوشمند آفلاین</h4>
            <p className="text-gray-700 dark:text-gray-400 text-xs">
              بدون نیاز به API Key! برنامه از دیتابیس داخلی هوشمند استفاده می‌کند.
            </p>
            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-500 space-y-1">
              <li>بیش از ۱۰۰ فلش‌کارت آماده</li>
              <li>تولید سرفصل هوشمند</li>
              <li>تحلیل جزوه بدون نیاز به اینترنت</li>
              <li>سریع و قابل اعتماد</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto px-4 pb-8">
      <h1 className="text-2xl font-black dark:text-white">⚙️ تنظیمات</h1>

      {/* AI Status Banner */}
      <div className={`p-4 rounded-2xl flex items-center gap-3 ${
        state.aiStatus === 'connected'
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
          : state.aiStatus === 'testing'
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}>
        <div className={`w-4 h-4 rounded-full ${
          state.aiStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          state.aiStatus === 'testing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <div className="flex-1">
          <p className={`font-bold text-sm ${
            state.aiStatus === 'connected' ? 'text-green-700 dark:text-green-400' :
            state.aiStatus === 'testing' ? 'text-blue-700 dark:text-blue-400' :
            'text-gray-700 dark:text-gray-300'
          }`}>
            {state.aiStatus === 'connected' ? '🤖 AI متصل' :
             state.aiStatus === 'testing' ? '⏳ در حال تست...' :
             '📚 حالت هوشمند آفلاین'}
          </p>
          {state.lastAIMessage && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{state.lastAIMessage}</p>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold dark:text-white text-lg mb-4">👤 مشخصات</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">نام</label>
            <input
              value={state.settings.name}
              onChange={e => dispatch({ type: 'SET_SETTINGS', settings: { name: e.target.value } })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">رشته تحصیلی</label>
            <select
              value={state.settings.major}
              onChange={e => dispatch({ type: 'SET_SETTINGS', settings: { major: e.target.value } })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
            >
              {majorNames.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">ترم</label>
            <select
              value={state.settings.semester}
              onChange={e => dispatch({ type: 'SET_SETTINGS', settings: { semester: Number(e.target.value) } })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
            >
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>ترم {s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">ساعات مطالعه روزانه</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1} max={14}
                value={state.settings.studyHoursPerDay}
                onChange={e => dispatch({ type: 'SET_SETTINGS', settings: { studyHoursPerDay: Number(e.target.value) } })}
                className="flex-1 accent-indigo-500"
              />
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 min-w-[3rem] text-center">
                {state.settings.studyHoursPerDay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold dark:text-white text-lg">🌙 حالت نمایش</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">با تنظیمات دستگاه هماهنگ است</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { darkMode: !state.settings.darkMode } })}
            className={`w-14 h-8 rounded-full transition-all relative ${state.settings.darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${state.settings.darkMode ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold dark:text-white text-lg mb-2">🤖 تنظیمات هوش مصنوعی</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          انتخاب روش تولید فلش‌کارت و سرفصل
        </p>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">سرویس‌دهنده</label>
            <div className="grid grid-cols-1 gap-2">
              {API_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setActiveHelp(null); }}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-3 ${
                    provider === p.id
                      ? `border-${p.color}-500 bg-${p.color}-50 dark:bg-${p.color}-900/30`
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex-1 text-right">
                    <span className="font-bold">{p.name}</span>
                    {p.id === 'gemini' && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full mr-2">پیشنهادی</span>}
                  </div>
                  {provider === p.id && <span className="text-indigo-500">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* API Help Button */}
          <button
            onClick={() => setActiveHelp(activeHelp === provider ? null : provider)}
            className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            📖 آموزش گرفتن {selectedProvider?.name}
          </button>

          {/* API Help Content */}
          {activeHelp && (
            <div className="animate-fadeIn">
              {renderApiHelp(activeHelp)}
            </div>
          )}

          {/* API Key Input */}
          {provider !== 'none' && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                کلید API {selectedProvider?.name}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={`کلید ${selectedProvider?.name}...`}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Custom Endpoint */}
          {provider === 'custom' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">آدرس Endpoint</label>
                <input
                  type="url"
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">نام مدل</label>
                <input
                  type="text"
                  value={customModel}
                  onChange={e => setCustomModel(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          {provider !== 'none' && (
            <div className="flex gap-2">
              <button onClick={saveApiSettings} className="btn-gradient text-white px-5 py-2 rounded-xl text-sm font-bold">💾 ذخیره</button>
              <button
                onClick={testApi}
                disabled={!apiKey || testing}
                className="px-5 py-2 rounded-xl border border-indigo-500 text-indigo-500 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50"
              >
                {testing ? '⏳ تست...' : '🔍 تست'}
              </button>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-xl text-sm font-medium ${
              testResult.success
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold dark:text-white text-lg mb-4">💾 مدیریت داده‌ها</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={exportData} className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-all text-sm">
            📤 خروجی
          </button>
          <label className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-sm cursor-pointer text-center">
            📥 بازیابی
            <input type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && importData(e.target.files[0])} />
          </label>
          <button onClick={resetAll} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-sm">
            🗑️ حذف
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-700 text-center">
        <h2 className="text-2xl font-black gradient-text mb-2">Exam Master</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">نسخه ۱.۳.۰</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          ساخته شده برای بچه‌های HUT ❤️
        </p>
        <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            تحلیل جزوه | فلش‌کارت هوشمند | برنامه‌ریزی امتحانات
          </p>
        </div>
      </div>
    </div>
  );
}
