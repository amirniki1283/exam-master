import { useApp } from '../store/AppContext';
import { getNowJalali, formatJalaliDate, toPersianNum, getDaysDiff } from '../utils/jalali';
import { courseColors } from '../data/courses';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const [now, setNow] = useState(getNowJalali());

  useEffect(() => {
    const timer = setInterval(() => setNow(getNowJalali()), 1000);
    return () => clearInterval(timer);
  }, []);

  const coursesWithExam = state.courses.filter(c => c.examDate);
  const sortedExams = [...coursesWithExam].sort((a, b) => {
    if (!a.examDate || !b.examDate) return 0;
    const da = getDaysDiff(now.jy, now.jm, now.jd, a.examDate.jy, a.examDate.jm, a.examDate.jd);
    const db = getDaysDiff(now.jy, now.jm, now.jd, b.examDate.jy, b.examDate.jm, b.examDate.jd);
    return da - db;
  });

  const nextExam = sortedExams.find(c => {
    if (!c.examDate) return false;
    return getDaysDiff(now.jy, now.jm, now.jd, c.examDate.jy, c.examDate.jm, c.examDate.jd) >= 0;
  });

  const totalUnits = state.courses.reduce((s, c) => s + c.units, 0);
  const totalChapters = state.courses.reduce((s, c) => s + c.chapters.length, 0);
  const studiedChapters = state.courses.reduce((s, c) => s + c.chapters.filter(ch => ch.studied).length, 0);
  const totalFlashcards = state.courses.reduce((s, c) => s + c.chapters.reduce((fs, ch) => fs + ch.flashcards.length, 0), 0);
  const donePlans = state.studyPlans.filter(p => p.done).length;
  const progress = totalChapters > 0 ? Math.round((studiedChapters / totalChapters) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black dark:text-white">
            سلام {state.settings.name}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {toPersianNum(formatJalaliDate(now.jy, now.jm, now.jd))} | ساعت {toPersianNum(String(now.hour).padStart(2, '0'))}:{toPersianNum(String(now.minute).padStart(2, '0'))}:{toPersianNum(String(now.second).padStart(2, '0'))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${state.aiStatus === 'connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${state.aiStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {state.aiStatus === 'connected' ? '🤖 AI متصل' : '📚 دیتابیس داخلی'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📚" label="تعداد درس‌ها" value={toPersianNum(state.courses.length)} color="bg-blue-500" />
        <StatCard icon="📐" label="مجموع واحدها" value={toPersianNum(totalUnits)} color="bg-emerald-500" />
        <StatCard icon="🃏" label="فلش‌کارت‌ها" value={toPersianNum(totalFlashcards)} color="bg-purple-500" />
        <StatCard icon="✅" label="تکالیف انجام‌شده" value={toPersianNum(donePlans)} color="bg-amber-500" />
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold dark:text-white">پیشرفت کلی مطالعه</h3>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{toPersianNum(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-l from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-1000 relative"
            style={{ width: `${progress}%` }}
          >
            {progress > 5 && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{toPersianNum(progress)}%</span>}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {toPersianNum(studiedChapters)} از {toPersianNum(totalChapters)} فصل مطالعه شده
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Exam */}
        <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
          <h3 className="font-bold text-lg mb-3 opacity-90">🔥 نزدیک‌ترین امتحان</h3>
          {nextExam && nextExam.examDate ? (
            <div>
              <p className="text-3xl font-black mb-2">{nextExam.name}</p>
              <p className="text-lg opacity-90">
                {toPersianNum(formatJalaliDate(nextExam.examDate.jy, nextExam.examDate.jm, nextExam.examDate.jd))}
                {nextExam.examTime && ` - ساعت ${toPersianNum(nextExam.examTime)}`}
              </p>
              <p className="text-4xl font-black mt-3">
                {toPersianNum(getDaysDiff(now.jy, now.jm, now.jd, nextExam.examDate.jy, nextExam.examDate.jm, nextExam.examDate.jd))} روز مانده
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl opacity-90">هنوز تاریخ امتحانی ثبت نشده</p>
              <button
                onClick={() => dispatch({ type: 'SET_PAGE', page: 'courses' })}
                className="mt-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                ثبت تاریخ امتحان ←
              </button>
            </div>
          )}
        </div>

        {/* Courses List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold dark:text-white text-lg mb-4">📚 درس‌های شما</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {state.courses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">هنوز درسی اضافه نشده</p>
            ) : (
              state.courses.map(course => {
                const color = courseColors[course.colorIndex % courseColors.length];
                const daysLeft = course.examDate
                  ? getDaysDiff(now.jy, now.jm, now.jd, course.examDate.jy, course.examDate.jm, course.examDate.jd)
                  : null;
                return (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-10 rounded-full ${color.bg}`}></div>
                      <div>
                        <p className="font-medium dark:text-white text-sm">{course.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{course.units} واحد | {'⭐'.repeat(course.importance)}</p>
                      </div>
                    </div>
                    {daysLeft !== null && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${daysLeft <= 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : daysLeft <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                        {toPersianNum(daysLeft)} روز
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction icon="📚" label="مدیریت درس‌ها" onClick={() => dispatch({ type: 'SET_PAGE', page: 'courses' })} />
        <QuickAction icon="📋" label="برنامه مطالعه" onClick={() => dispatch({ type: 'SET_PAGE', page: 'study-plan' })} />
        <QuickAction icon="🃏" label="فلش‌کارت" onClick={() => dispatch({ type: 'SET_PAGE', page: 'flashcards' })} />
        <QuickAction icon="⏱️" label="تایمر مطالعه" onClick={() => dispatch({ type: 'SET_PAGE', page: 'timer' })} />
      </div>

      {/* Upcoming exams */}
      {sortedExams.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold dark:text-white text-lg mb-4">📅 امتحانات پیش رو</h3>
          <div className="space-y-3">
            {sortedExams.slice(0, 5).map(c => {
              if (!c.examDate) return null;
              const days = getDaysDiff(now.jy, now.jm, now.jd, c.examDate.jy, c.examDate.jm, c.examDate.jd);
              const color = courseColors[c.colorIndex % courseColors.length];
              return (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center text-white font-black text-lg`}>
                    {toPersianNum(c.examDate.jd)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {toPersianNum(formatJalaliDate(c.examDate.jy, c.examDate.jm, c.examDate.jd))}
                      {c.examTime && ` - ${toPersianNum(c.examTime)}`}
                    </p>
                  </div>
                  <div className={`text-center ${days <= 3 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-green-500'}`}>
                    <p className="text-2xl font-black">{toPersianNum(days)}</p>
                    <p className="text-xs">روز</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-lg`}>
        {icon}
      </div>
      <p className="text-2xl font-black dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 text-center"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium dark:text-white">{label}</span>
    </button>
  );
}
