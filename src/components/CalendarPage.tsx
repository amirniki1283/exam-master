import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import {
  getNowJalali, jalaliMonthNames, jalaliWeekDays,
  getJalaliMonthDays, getJalaliDayOfWeek, toPersianNum, formatJalaliDate,
  getDaysDiff, jalaliWeekDaysFull
} from '../utils/jalali';
import { courseColors } from '../data/courses';

export default function CalendarPage() {
  const { state } = useApp();
  const [nowTime, setNowTime] = useState(getNowJalali());
  const [viewYear, setViewYear] = useState(nowTime.jy);
  const [viewMonth, setViewMonth] = useState(nowTime.jm);

  useEffect(() => {
    const timer = setInterval(() => setNowTime(getNowJalali()), 1000);
    return () => clearInterval(timer);
  }, []);

  const monthDays = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliDayOfWeek(viewYear, viewMonth, 1);

  const examDays: Record<number, typeof state.courses> = {};
  state.courses.forEach(c => {
    if (c.examDate && c.examDate.jy === viewYear && c.examDate.jm === viewMonth) {
      if (!examDays[c.examDate.jd]) examDays[c.examDate.jd] = [];
      examDays[c.examDate.jd].push(c);
    }
  });

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isToday = (d: number) => viewYear === nowTime.jy && viewMonth === nowTime.jm && d === nowTime.jd;

  const todayDow = getJalaliDayOfWeek(nowTime.jy, nowTime.jm, nowTime.jd);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Clock */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center shadow-2xl">
        <p className="text-sm opacity-80 mb-2">{jalaliWeekDaysFull[todayDow]}</p>
        <p className="text-6xl font-black tracking-wider mb-2">
          {toPersianNum(String(nowTime.hour).padStart(2, '0'))}:{toPersianNum(String(nowTime.minute).padStart(2, '0'))}:{toPersianNum(String(nowTime.second).padStart(2, '0'))}
        </p>
        <p className="text-xl opacity-90">{toPersianNum(formatJalaliDate(nowTime.jy, nowTime.jm, nowTime.jd))}</p>
        <p className="text-xs opacity-60 mt-1">ساعت رسمی ایران</p>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-2xl">→</button>
          <h2 className="text-xl font-black dark:text-white">
            {jalaliMonthNames[viewMonth - 1]} {toPersianNum(viewYear)}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-2xl">←</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {jalaliWeekDays.map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: monthDays }, (_, i) => {
            const d = i + 1;
            const hasExam = examDays[d];
            const today = isToday(d);
            return (
              <div
                key={d}
                className={`relative p-2 rounded-xl text-center cursor-default transition-all min-h-[48px] flex flex-col items-center justify-center ${
                  today
                    ? 'bg-indigo-500 text-white shadow-lg animate-pulse-glow'
                    : hasExam
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className={`text-sm font-bold ${today ? 'text-white' : 'dark:text-gray-200'}`}>{toPersianNum(d)}</span>
                {hasExam && (
                  <div className="flex gap-0.5 mt-1">
                    {hasExam.map(c => (
                      <div key={c.id} className={`w-2 h-2 rounded-full ${courseColors[c.colorIndex % courseColors.length].bg}`} title={c.name} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg dark:text-white mb-4">📝 امتحانات ثبت شده</h3>
        {state.courses.filter(c => c.examDate).length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">هنوز تاریخ امتحانی ثبت نشده</p>
        ) : (
          <div className="space-y-3">
            {[...state.courses.filter(c => c.examDate)].sort((a, b) => {
              if (!a.examDate || !b.examDate) return 0;
              return getDaysDiff(nowTime.jy, nowTime.jm, nowTime.jd, a.examDate.jy, a.examDate.jm, a.examDate.jd)
                - getDaysDiff(nowTime.jy, nowTime.jm, nowTime.jd, b.examDate.jy, b.examDate.jm, b.examDate.jd);
            }).map(c => {
              if (!c.examDate) return null;
              const days = getDaysDiff(nowTime.jy, nowTime.jm, nowTime.jd, c.examDate.jy, c.examDate.jm, c.examDate.jd);
              const color = courseColors[c.colorIndex % courseColors.length];
              const isPast = days < 0;
              return (
                <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isPast ? 'opacity-50 bg-gray-50 dark:bg-gray-700/30' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <div className={`w-14 h-14 rounded-xl ${color.bg} flex flex-col items-center justify-center text-white shadow-lg`}>
                    <span className="text-lg font-black">{toPersianNum(c.examDate.jd)}</span>
                    <span className="text-[10px]">{jalaliMonthNames[c.examDate.jm - 1]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {toPersianNum(formatJalaliDate(c.examDate.jy, c.examDate.jm, c.examDate.jd))}
                      {c.examTime && ` | ساعت ${toPersianNum(c.examTime)}`}
                      {` | ${toPersianNum(c.units)} واحد`}
                    </p>
                  </div>
                  <div className={`text-center min-w-[60px] ${isPast ? 'text-gray-400' : days <= 3 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-green-500'}`}>
                    {isPast ? (
                      <span className="text-sm">گذشته</span>
                    ) : (
                      <>
                        <p className="text-3xl font-black">{toPersianNum(days)}</p>
                        <p className="text-xs">روز مانده</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
