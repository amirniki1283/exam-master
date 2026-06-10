// Jalali calendar utilities
const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + div((gy2 + 3), 4) - div((gy2 + 99), 100) + div((gy2 + 399), 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * div(days, 12053));
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div((days - 1), 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + div(days, 31) : 7 + div((days - 186), 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jy2 = jy + 1595;
  let days = -355668 + (365 * jy2) + (div(jy2, 33) * 8) + div(((jy2 % 33) + 3), 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * div(days, 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    gy += div((days - 1), 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return [gy, gm, gd];
}

export function isJalaliLeap(jy: number): boolean {
  const rem = ((jy - (jy > 0 ? 474 : 473)) % 2820 + 2820) % 2820 + 474;
  return ((rem + 38) * 682) % 2816 < 682;
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

export const jalaliMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const jalaliWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
export const jalaliWeekDaysFull = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd);
  return (d.getDay() + 1) % 7;
}

export function getNowJalali(): { jy: number; jm: number; jd: number; hour: number; minute: number; second: number } {
  const now = new Date();
  const iranTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));
  const [jy, jm, jd] = gregorianToJalali(iranTime.getFullYear(), iranTime.getMonth() + 1, iranTime.getDate());
  return { jy, jm, jd, hour: iranTime.getHours(), minute: iranTime.getMinutes(), second: iranTime.getSeconds() };
}

export function formatJalaliDate(jy: number, jm: number, jd: number): string {
  return `${jd} ${jalaliMonthNames[jm - 1]} ${jy}`;
}

export function toPersianNum(num: number | string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

export function jalaliToTimestamp(jy: number, jm: number, jd: number, hour = 0, minute = 0): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd, hour, minute).getTime();
}

export function getDaysDiff(jy1: number, jm1: number, jd1: number, jy2: number, jm2: number, jd2: number): number {
  const t1 = jalaliToTimestamp(jy1, jm1, jd1);
  const t2 = jalaliToTimestamp(jy2, jm2, jd2);
  return Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24));
}
