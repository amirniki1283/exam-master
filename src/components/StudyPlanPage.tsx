import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { getNowJalali, toPersianNum, getDaysDiff, formatJalaliDate, getJalaliMonthDays } from '../utils/jalali';
import { courseColors } from '../data/courses';
import type { StudyPlan } from '../types';

export default function StudyPlanPage() {
  const { state, dispatch } = useApp();
  const now = getNowJalali();
  const [generating, setGenerating] = useState(false);

  const generatePlan = () => {
    setGenerating(true);
    setTimeout(() => {
      const plans: StudyPlan[] = [];
      const coursesWithExam = state.courses.filter(c => c.examDate);
      const coursesWithout = state.courses.filter(c => !c.examDate);

      // Calculate priority scores
      const scored = [...coursesWithExam, ...coursesWithout].map(c => {
        let score = c.importance * 2 + c.units;
        if (c.examDate) {
          const days = getDaysDiff(now.jy, now.jm, now.jd, c.examDate.jy, c.examDate.jm, c.examDate.jd);
          if (days > 0 && days <= 3) score += 20;
          else if (days > 0 && days <= 7) score += 10;
          else if (days > 0 && days <= 14) score += 5;
        }
        const studiedPct = c.chapters.length > 0
          ? c.chapters.filter(ch => ch.studied).length / c.chapters.length
          : 0;
        score += Math.round((1 - studiedPct) * 5);
        return { course: c, score };
      }).sort((a, b) => b.score - a.score);

      // Generate for next 14 days
      const hoursPerDay = state.settings.studyHoursPerDay;
      const totalMinPerDay = hoursPerDay * 60;

      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        // Simple date calculation
        let cJd = now.jd + dayOffset;
        let cJm = now.jm;
        let cJy = now.jy;

        // Normalize date
        while (cJd > getJalaliMonthDays(cJy, cJm)) {
          cJd -= getJalaliMonthDays(cJy, cJm);
          cJm += 1;
          if (cJm > 12) { cJm = 1; cJy += 1; }
        }

        let remainMin = totalMinPerDay;
        const dayScored = [...scored];

        // Prioritize courses with exams coming up
        const examsThisWeek = dayScored.filter(s =>
          s.course.examDate &&
          getDaysDiff(cJy, cJm, cJd, s.course.examDate.jy, s.course.examDate.jm, s.course.examDate.jd) >= 0 &&
          getDaysDiff(cJy, cJm, cJd, s.course.examDate.jy, s.course.examDate.jm, s.course.examDate.jd) <= 7
        );

        const coursesToStudy = examsThisWeek.length > 0 ? examsThisWeek : dayScored.slice(0, 4);

        for (const s of coursesToStudy) {
          if (remainMin <= 0) break;
          const timeForCourse = Math.min(
            Math.max(45, Math.round(totalMinPerDay / coursesToStudy.length)),
            remainMin
          );

          const unstudied = s.course.chapters.filter(ch => !ch.studied);
          const topic = unstudied.length > 0
            ? `مطالعه: ${unstudied[dayOffset % unstudied.length]?.title || 'مرور کلی'}`
            : s.course.chapters.length > 0
            ? 'مرور و تمرین'
            : `مطالعه ${s.course.name}`;

          plans.push({
            courseId: s.course.id,
            courseName: s.course.name,
            date: { jy: cJy, jm: cJm, jd: cJd },
            duration: timeForCourse,
            priority: s.score,
            topic,
            done: false,
          });

          remainMin -= timeForCourse;
        }
      }

      dispatch({ type: 'SET_STUDY_PLANS', plans });
      setGenerating(false);
    }, 800);
  };

  // Group plans by date
  const plansByDate: Record<string, StudyPlan[]> = {};
  state.studyPlans.forEach(p => {
    const key = `${p.date.jy}-${p.date.jm}-${p.date.jd}`;
    if (!plansByDate[key]) plansByDate[key] = [];
    plansByDate[key].push(p);
  });

  const totalPlans = state.studyPlans.length;
  const donePlans = state.studyPlans.filter(p => p.done).length;
  const progress = totalPlans > 0 ? Math.round((donePlans / totalPlans) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black dark:text-white">📋 برنامه مطالعاتی</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            برنامه هوشمند بر اساس اهمیت، واحد و تاریخ امتحان
          </p>
        </div>
        <button
          onClick={generatePlan}
          disabled={generating || state.courses.length === 0}
          className="btn-gradient text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-spin">⚙️</span>
              در حال ساخت...
            </>
          ) : (
            <>🧠 ساخت برنامه هوشمند</>
          )}
        </button>
      </div>

      {/* Progress */}
      {totalPlans > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold dark:text-white">پیشرفت برنامه</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{toPersianNum(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-gradient-to-l from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {toPersianNum(donePlans)} از {toPersianNum(totalPlans)} مورد انجام شده
          </p>
        </div>
      )}

      {/* Plans */}
      {state.studyPlans.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">هنوز برنامه‌ای ساخته نشده</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">ابتدا درس‌ها و تاریخ امتحاناتت رو وارد کن، بعد دکمه ساخت برنامه رو بزن</p>
          {state.courses.length > 0 && (
            <button onClick={generatePlan} className="btn-gradient text-white px-8 py-3 rounded-xl font-bold">
              🧠 ساخت برنامه هوشمند
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(plansByDate).map(([key, plans]) => {
            const date = plans[0].date;
            const isToday = date.jy === now.jy && date.jm === now.jm && date.jd === now.jd;
            return (
              <div key={key} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border ${isToday ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-100 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-3 py-1 rounded-lg text-sm font-bold ${isToday ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    {isToday ? '📍 امروز' : toPersianNum(formatJalaliDate(date.jy, date.jm, date.jd))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {toPersianNum(plans.reduce((s, p) => s + p.duration, 0))} دقیقه مطالعه
                  </span>
                </div>
                <div className="space-y-2">
                  {plans.map((plan, i) => {
                    const course = state.courses.find(c => c.id === plan.courseId);
                    const color = course ? courseColors[course.colorIndex % courseColors.length] : courseColors[0];
                    const globalIdx = state.studyPlans.indexOf(plan);

                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${plan.done ? 'bg-green-50 dark:bg-green-900/20 opacity-75' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_PLAN_DONE', index: globalIdx })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${plan.done ? 'bg-green-500 border-green-500 text-white' : `${color.border} hover:bg-gray-200 dark:hover:bg-gray-600`}`}
                        >
                          {plan.done && '✓'}
                        </button>
                        <div className={`w-1 h-8 rounded-full ${color.bg}`}></div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${plan.done ? 'line-through text-gray-400' : 'dark:text-white'}`}>{plan.courseName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{plan.topic}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-lg">
                          {toPersianNum(plan.duration)} دقیقه
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-700">
        <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3">💡 نکات مطالعه مؤثر</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2"><span>✅</span><span>هر ۵۰ دقیقه مطالعه، ۱۰ دقیقه استراحت کنید</span></div>
          <div className="flex items-start gap-2"><span>✅</span><span>درس‌های سخت‌تر رو اول بخونید</span></div>
          <div className="flex items-start gap-2"><span>✅</span><span>از فلش‌کارت برای مرور استفاده کنید</span></div>
          <div className="flex items-start gap-2"><span>✅</span><span>قبل خواب مطالب مهم رو مرور کنید</span></div>
        </div>
      </div>
    </div>
  );
}
