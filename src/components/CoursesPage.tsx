import { useState, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { courseColors, majors } from '../data/courses';
import { jalaliMonthNames, getJalaliMonthDays, toPersianNum, getNowJalali } from '../utils/jalali';
import { generateChapters } from '../services/aiService';
import type { Course, Chapter } from '../types';

export default function CoursesPage() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [newName, setNewName] = useState('');
  const [newUnits, setNewUnits] = useState(3);
  const [newImportance, setNewImportance] = useState(3);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [generatingChapters, setGeneratingChapters] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const majorCourses = state.settings.major && majors[state.settings.major]
    ? majors[state.settings.major].courses
    : [];

  const existingNames = new Set(state.courses.map(c => c.name));
  const suggestedCourses = majorCourses.filter(c => !existingNames.has(c.name));

  const addCourse = () => {
    if (!newName.trim()) return;
    const tmpl = majorCourses.find(c => c.name === newName);
    const course: Course = {
      id: crypto.randomUUID(),
      name: newName,
      units: tmpl?.units || newUnits,
      importance: tmpl?.importance || newImportance,
      colorIndex: state.courses.length % courseColors.length,
      chapters: [],
      notes: '',
    };
    dispatch({ type: 'ADD_COURSE', course });
    setNewName('');
    setShowAdd(false);
  };

  const addFromSuggestion = (name: string) => {
    const tmpl = majorCourses.find(c => c.name === name);
    const course: Course = {
      id: crypto.randomUUID(),
      name,
      units: tmpl?.units || 3,
      importance: tmpl?.importance || 3,
      colorIndex: state.courses.length % courseColors.length,
      chapters: [],
      notes: '',
    };
    dispatch({ type: 'ADD_COURSE', course });
  };

  const autoGenerateChapters = useCallback(async (courseId: string) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    setGeneratingChapters(courseId);
    setStatusMessage('در حال تولید فصل‌ها...');

    const result = await generateChapters(
      {
        provider: state.settings.apiProvider,
        apiKey: state.settings.apiKey,
        customEndpoint: state.settings.customEndpoint,
        customModel: state.settings.customModel,
      },
      course.name
    );

    setStatusMessage(result.message);
    dispatch({
      type: 'SET_AI_STATUS',
      status: result.usedFallback ? 'disconnected' : 'connected',
      message: result.message,
    });

    const newChapters: Chapter[] = result.chapters.map(title => ({
      id: crypto.randomUUID(),
      title,
      studied: false,
      flashcards: [],
    }));

    // Merge with existing chapters
    const mergedChapters = [...course.chapters];
    for (const nc of newChapters) {
      if (!mergedChapters.find(c => c.title === nc.title)) {
        mergedChapters.push(nc);
      }
    }

    dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: mergedChapters } });
    setGeneratingChapters(null);
    setTimeout(() => setStatusMessage(''), 3000);
  }, [state.courses, state.settings, dispatch]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black dark:text-white">📚 مدیریت درس‌ها</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">درس‌ها و فصل‌بندی</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
            state.aiStatus === 'connected'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${state.aiStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
            {state.aiStatus === 'connected' ? 'AI' : 'آفلاین'}
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-gradient text-white px-6 py-3 rounded-xl font-bold shadow-lg"
          >
            + افزودن درس
          </button>
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

      {/* Add Course Form */}
      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 animate-fadeIn">
          <h3 className="font-bold dark:text-white mb-2">درس جدید</h3>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-700 mb-4">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ توجه: واحد و اهمیت پیش‌فرض ممکن است با چارت درسی شما متفاوت باشد. پس از افزودن، از طریق ویرایش اصلاح کنید.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">نام درس</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="نام درس..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
                list="course-suggestions"
              />
              <datalist id="course-suggestions">
                {suggestedCourses.map(c => <option key={c.name} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">تعداد واحد</label>
              <input
                type="number"
                value={newUnits}
                onChange={e => setNewUnits(Number(e.target.value))}
                min={1} max={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">اهمیت</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => setNewImportance(i)}
                    className={`text-2xl transition-all ${i <= newImportance ? 'opacity-100 scale-110' : 'opacity-30'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={addCourse} className="btn-gradient text-white px-6 py-2 rounded-xl font-bold">ثبت</button>
            <button onClick={() => setShowAdd(false)} className="px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">انصراف</button>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestedCourses.length > 0 && (
        <details className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-700">
          <summary className="cursor-pointer font-bold text-indigo-700 dark:text-indigo-300">
            💡 درس‌های پیشنهادی ({toPersianNum(suggestedCourses.length)} درس)
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {suggestedCourses.slice(0, 20).map(c => (
              <button
                key={c.name}
                onClick={() => addFromSuggestion(c.name)}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 text-right hover:bg-indigo-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600 text-sm"
              >
                <span className="font-medium dark:text-white">{c.name}</span>
                <span className="text-xs text-gray-500">{c.units}و</span>
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {state.courses.map(course => {
          const color = courseColors[course.colorIndex % courseColors.length];
          return (
            <div key={course.id} className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className={`h-2 ${color.bg}`}></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">{course.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {toPersianNum(course.units)} واحد | {'⭐'.repeat(course.importance)}
                    </p>
                    <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1">
                      ⚠️ واحد و اهمیت ممکن است اشتباه باشد - از ویرایش اصلاح کنید
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditCourse(course)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('حذف این درس؟')) dispatch({ type: 'DELETE_COURSE', id: course.id });
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Exam Date */}
                <div className="mb-3">
                  {course.examDate ? (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span className="text-sm font-medium dark:text-gray-200">
                          {toPersianNum(course.examDate.jd)} {jalaliMonthNames[course.examDate.jm - 1]} {toPersianNum(course.examDate.jy)}
                        </span>
                        {course.examTime && <span className="text-xs text-gray-500 dark:text-gray-400">ساعت {toPersianNum(course.examTime)}</span>}
                      </div>
                      <button
                        onClick={() => setShowDatePicker(course.id)}
                        className="text-xs text-indigo-500 hover:underline"
                      >
                        تغییر
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDatePicker(course.id)}
                      className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm hover:border-indigo-400 hover:text-indigo-500 transition-all"
                    >
                      + تعیین تاریخ امتحان
                    </button>
                  )}
                </div>

                {/* Chapters */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold dark:text-white">فصل‌ها</span>
                    <button
                      onClick={() => autoGenerateChapters(course.id)}
                      disabled={generatingChapters === course.id}
                      className="text-xs px-2 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
                    >
                      {generatingChapters === course.id ? '⏳' : '🧠'} تولید خودکار
                    </button>
                  </div>
                  
                  {course.chapters.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                      با دکمه تولید خودکار یا ویرایش، فصل‌ها اضافه کنید
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {course.chapters.map((ch, i) => (
                        <div key={ch.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={ch.studied}
                            onChange={() => {
                              const updatedChapters = course.chapters.map(c =>
                                c.id === ch.id ? { ...c, studied: !c.studied } : c
                              );
                              dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: updatedChapters } });
                            }}
                            className="w-4 h-4 accent-indigo-500"
                          />
                          <span className={`flex-1 ${ch.studied ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {i + 1}. {ch.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span>{toPersianNum(course.chapters.filter(c => c.studied).length)} از {toPersianNum(course.chapters.length)} مطالعه شده</span>
                    <span className={`px-2 py-0.5 rounded-lg font-bold ${color.light} ${color.text} dark:bg-opacity-20`}>
                      {course.chapters.length > 0
                        ? `${toPersianNum(Math.round((course.chapters.filter(c => c.studied).length / course.chapters.length) * 100))}%`
                        : '۰%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.courses.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl text-gray-500 dark:text-gray-400">هنوز درسی اضافه نشده</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 btn-gradient text-white px-6 py-3 rounded-xl font-bold">
            اولین درست رو اضافه کن
          </button>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && <DatePickerModal courseId={showDatePicker} onClose={() => setShowDatePicker(null)} />}

      {/* Edit Course Modal */}
      {editCourse && <EditCourseModal course={editCourse} onClose={() => setEditCourse(null)} />}
    </div>
  );
}

function DatePickerModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const course = state.courses.find(c => c.id === courseId);
  const now = getNowJalali();

  const [year, setYear] = useState(course?.examDate?.jy || now.jy);
  const [month, setMonth] = useState(course?.examDate?.jm || now.jm);
  const [day, setDay] = useState(course?.examDate?.jd || now.jd);
  const [time, setTime] = useState(course?.examTime || '10:00');

  const maxDay = getJalaliMonthDays(year, month);

  const save = () => {
    if (!course) return;
    const d = Math.min(day, maxDay);
    dispatch({
      type: 'UPDATE_COURSE',
      course: { ...course, examDate: { jy: year, jm: month, jd: d }, examTime: time },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg dark:text-white mb-4">📅 تاریخ امتحان {course?.name}</h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">سال</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setYear(y => y - 1)} className="p-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">-</button>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-center focus:outline-none focus:border-indigo-500"
              />
              <button onClick={() => setYear(y => y + 1)} className="p-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">+</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ماه</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="w-full px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {jalaliMonthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">روز</label>
            <div className="flex items-center gap-1">
              <button onClick={() => setDay(d => Math.max(1, d - 1))} className="p-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">-</button>
              <input
                type="number"
                value={day}
                onChange={e => setDay(Math.min(maxDay, Math.max(1, Number(e.target.value))))}
                min={1} max={maxDay}
                className="w-full px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-center focus:outline-none focus:border-indigo-500"
              />
              <button onClick={() => setDay(d => Math.min(maxDay, d + 1))} className="p-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">+</button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ساعت امتحان</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={save} className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold">ذخیره</button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">انصراف</button>
        </div>
      </div>
    </div>
  );
}

function EditCourseModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const { dispatch } = useApp();
  const [name, setName] = useState(course.name);
  const [units, setUnits] = useState(course.units);
  const [importance, setImportance] = useState(course.importance);
  const [colorIdx, setColorIdx] = useState(course.colorIndex);
  const [chapters, setChapters] = useState<Chapter[]>(course.chapters);
  const [newChapter, setNewChapter] = useState('');

  const addChapter = () => {
    if (!newChapter.trim()) return;
    setChapters([...chapters, {
      id: crypto.randomUUID(),
      title: newChapter,
      studied: false,
      flashcards: [],
    }]);
    setNewChapter('');
  };

  const save = () => {
    dispatch({
      type: 'UPDATE_COURSE',
      course: { ...course, name, units, importance, colorIndex: colorIdx, chapters },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg dark:text-white mb-4">✏️ ویرایش {course.name}</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">نام درس</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-700 mb-2">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ توجه: واحد و اهمیت درس ممکن است اشتباه باشد. لطفاً بر اساس چارت درسی خود تصحیح کنید.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">تعداد واحد *</label>
              <input type="number" value={units} onChange={e => setUnits(Number(e.target.value))} min={1} max={4} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">اهمیت</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setImportance(i)} className={`text-xl ${i <= importance ? 'opacity-100' : 'opacity-30'}`}>⭐</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">رنگ درس</label>
            <div className="flex flex-wrap gap-2">
              {courseColors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColorIdx(i)}
                  className={`w-8 h-8 rounded-full ${c.bg} transition-all ${colorIdx === i ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">فصل‌ها</label>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {chapters.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={ch.studied}
                    onChange={() => {
                      const newCh = [...chapters];
                      newCh[i] = { ...newCh[i], studied: !newCh[i].studied };
                      setChapters(newCh);
                    }}
                    className="w-5 h-5 accent-indigo-500"
                  />
                  <span className={`flex-1 text-sm ${ch.studied ? 'line-through text-gray-400' : 'dark:text-white'}`}>{ch.title}</span>
                  <button onClick={() => setChapters(chapters.filter((_, j) => j !== i))} className="text-red-500 text-xs hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newChapter}
                onChange={e => setNewChapter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChapter()}
                placeholder="عنوان فصل جدید..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none text-sm"
              />
              <button onClick={addChapter} className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold">+</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={save} className="flex-1 btn-gradient text-white py-3 rounded-xl font-bold">ذخیره</button>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">انصراف</button>
        </div>
      </div>
    </div>
  );
}
