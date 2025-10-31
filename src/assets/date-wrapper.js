/**
 * @author Muhammad Sulman <whomaderules@gmail.com>
 * @license MIT
 * @lastModified 2025/07/09
 */

/**
 * @typedef {'millisecond'|'second'|'minute'|'hour'|'day'|'week'|'month'|'year'} Unit
 * @typedef {'sunday'|'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'} Weekday
 */

const MONTH_NAMES = { short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const WEEKDAY_NAMES = { short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };

/**
 * Pads a number with leading zeros to a specified length.
 * @param {number} n - The number to pad.
 * @param {number} [len=2] - The desired length.
 * @returns {string} Padded string.
 */
function pad(n, len = 2) {
  const s = String(n);
  return s.length >= len ? s : '0'.repeat(len - s.length) + s;
}

/**
 * Safely converts input to a Date object, handling various types.
 * @param {Date|number|string|object|null} v - Input value.
 * @returns {Date} A valid Date instance.
 */
function safeDate(v) {
  if (v == null) return new Date();
  if (v instanceof Date) return new Date(v.getTime());
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string') return parseFlexible(v);
  if (typeof v === 'object' && v.value) return safeDate(v.value);
  return new Date(v);
}

/**
 * Flexible date parser supporting ISO, common formats, and simple natural language patterns.
 * @param {string} s - String to parse.
 * @returns {Date} Parsed Date or invalid Date.
 */
function parseFlexible(s) {
  const str = String(s).trim();
  const strict = parseRFC3339(str);
  if (strict) return strict;
  const low = str.toLowerCase();
  if (low === 'now') return new Date();
  if (low === 'today') { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  if (low === 'tomorrow') { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); return d; }
  if (low === 'yesterday') { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d; }
  const inMatch = low.match(/^in\s+(\d+)\s+(day|days|month|months|year|years|hour|hours|minute|minutes|second|seconds)$/);
  if (inMatch) {
    const n = +inMatch[1]; const u = inMatch[2].replace(/s$/, '');
    const d = new Date();
    switch (u) {
      case 'day': d.setDate(d.getDate() + n); break;
      case 'month': d.setMonth(d.getMonth() + n); break;
      case 'year': d.setFullYear(d.getFullYear() + n); break;
      case 'hour': d.setHours(d.getHours() + n); break;
      case 'minute': d.setMinutes(d.getMinutes() + n); break;
      case 'second': d.setSeconds(d.getSeconds() + n); break;
    }
    return d;
  }
  const nextMatch = low.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (nextMatch) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const target = dayNames.indexOf(nextMatch[1]);
    const d = new Date();
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const ordinalMatch = low.match(/^(first|second|third|fourth|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s+of\s+(next|this|last)\s+month$/);
  if (ordinalMatch) {
    const ordMap = { first: 1, second: 2, third: 3, fourth: 4, last: -1 };
    const ord = ordMap[ordinalMatch[1]];
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(ordinalMatch[2]);
    const which = ordinalMatch[3];
    const base = new Date();
    if (which === 'next') base.setMonth(base.getMonth() + 1);
    else if (which === 'last') base.setMonth(base.getMonth() - 1);
    if (ord > 0) {
      const d = new Date(base.getFullYear(), base.getMonth(), 1);
      let count = 0;
      while (true) {
        if (d.getDay() === weekday) count++;
        if (count === ord) return d;
        d.setDate(d.getDate() + 1);
      }
    } else {
      const d = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
      return d;
    }
  }
  const t = Date.parse(str);
  if (!Number.isNaN(t)) return new Date(t);
  const dm = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (dm) {
    const a = +dm[1], b = +dm[2], c = +dm[3];
    if (str.includes('/')) return new Date(c < 100 ? 2000 + c : c, a - 1, b);
    else return new Date(c < 100 ? 2000 + c : c, b - 1, a);
  }
  return new Date('');
}

/**
 * Strictly parses RFC3339 date strings.
 * @param {string} s - RFC3339 string.
 * @returns {Date|null} Parsed Date or null if invalid.
 */
function parseRFC3339(s) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+\-]\d{2}:\d{2})?)?$/);
  if (!m) return null;
  const [, Y, M, D, h = '0', min = '0', sec = '0', msStr, tz] = m;
  const ms = msStr ? Math.round(parseFloat(msStr) * 1000) : 0;
  if (!tz || tz === 'Z') return new Date(Date.UTC(+Y, +M - 1, +D, +h, +min, +sec, ms));
  const sign = tz[0] === '+' ? 1 : -1;
  const [offH, offM] = tz.slice(1).split(':').map(Number);
  const offsetMinutes = sign * (offH * 60 + offM);
  const utc = Date.UTC(+Y, +M - 1, +D, +h, +min, +sec, ms) - offsetMinutes * 60000;
  return new Date(utc);
}

/**
 * Immutable Duration class for handling time spans.
 */
class Duration {
  /**
   * Creates a Duration instance.
   * @param {{years?:number, months?:number, days?:number, hours?:number, minutes?:number, seconds?:number, milliseconds?:number}} [obj={}] - Duration components.
   */
  constructor(obj = {}) {
    this.years = obj.years || 0;
    this.months = obj.months || 0;
    this.days = obj.days || 0;
    this.hours = obj.hours || 0;
    this.minutes = obj.minutes || 0;
    this.seconds = obj.seconds || 0;
    this.milliseconds = obj.milliseconds || 0;
  }

  /**
   * Parses ISO duration string (PnYnMnDTnHnMnS).
   * @param {string} iso - ISO duration string.
   * @returns {Duration} Parsed Duration.
   * @throws {Error} If invalid format.
   */
  static fromISO(iso) {
    const m = iso.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
    if (!m) throw new Error('Invalid ISO duration');
    return new Duration({ years: +m[1] || 0, months: +m[2] || 0, days: +m[3] || 0, hours: +m[4] || 0, minutes: +m[5] || 0, seconds: +m[6] || 0 });
  }

  /**
   * Converts to ISO duration string.
   * @returns {string} ISO string.
   */
  toISO() {
    let s = 'P';
    if (this.years) s += this.years + 'Y';
    if (this.months) s += this.months + 'M';
    if (this.days) s += this.days + 'D';
    if (this.hours || this.minutes || this.seconds) s += 'T';
    if (this.hours) s += this.hours + 'H';
    if (this.minutes) s += this.minutes + 'M';
    if (this.seconds) s += this.seconds + 'S';
    return s;
  }
}

/**
 * Represents a date range from start to end.
 */
class DateRange {
  /**
   * Creates a DateRange.
   * @param {Date|string|DateWrapper|DateRange} start - Start date.
   * @param {Date|string|DateWrapper|DateRange} end - End date.
   * @throws {Error} If start > end.
   */
  constructor(start, end) {
    this.start = safeDate(start instanceof DateRange ? start.start : (start instanceof DateWrapper ? start.toDate() : start));
    this.end = safeDate(end instanceof DateRange ? end.end : (end instanceof DateWrapper ? end.toDate() : end));
    if (this.start.getTime() > this.end.getTime()) throw new Error('Range start must be <= end');
  }

  /**
   * Checks if a date is within the range.
   * @param {Date|DateWrapper} d - Date to check.
   * @returns {boolean} True if contained.
   */
  contains(d) {
    const t = d instanceof DateWrapper ? d.toDate().getTime() : safeDate(d).getTime();
    return t >= this.start.getTime() && t <= this.end.getTime();
  }

  /**
   * Computes intersection with another range.
   * @param {DateRange} other - Other range.
   * @returns {DateRange|null} Intersection or null if none.
   */
  intersect(other) {
    const s = new Date(Math.max(this.start.getTime(), other.start.getTime()));
    const e = new Date(Math.min(this.end.getTime(), other.end.getTime()));
    if (s.getTime() > e.getTime()) return null;
    return new DateRange(s, e);
  }

  /**
   * Generates an array of dates in the range with steps.
   * @param {{unit: Unit, amount: number}} [step={unit: 'day', amount:1}] - Step config.
   * @returns {Date[]} Array of dates.
   */
  toArray(step = { unit: 'day', amount: 1 }) {
    const out = [];
    const cur = new Date(this.start);
    const add = (u, a) => {
      switch (u) {
        case 'day': cur.setDate(cur.getDate() + a); break;
        case 'hour': cur.setHours(cur.getHours() + a); break;
        case 'month': cur.setMonth(cur.getMonth() + a); break;
        default: cur.setDate(cur.getDate() + a);
      }
    };
    while (cur.getTime() <= this.end.getTime()) {
      out.push(new Date(cur));
      add(step.unit, step.amount);
    }
    return out;
  }
}

/**
 * Parses a subset of RFC5545 RRULE: FREQ, INTERVAL, COUNT, BYDAY, BYMONTHDAY.
 * @param {string} rule - RRULE string.
 * @returns {object} Parsed rule object.
 */
function parseRRule(rule) {
  const parts = rule.split(';').map(p => p.trim()).filter(Boolean);
  const out = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (!k) continue;
    const key = k.toUpperCase();
    const val = v;
    if (key === 'FREQ') out.freq = val.toUpperCase();
    else if (key === 'INTERVAL') out.interval = Math.max(1, parseInt(val, 10) || 1);
    else if (key === 'COUNT') out.count = parseInt(val, 10);
    else if (key === 'BYDAY') out.byday = val.split(',').map(x => x.trim().toUpperCase());
    else if (key === 'BYMONTHDAY') out.bymonthday = val.split(',').map(Number);
    else out[key.toLowerCase()] = val;
  }
  return out;
}

/**
 * Generates occurrences from a simple RRULE.
 * @param {Date} startDate - Start date.
 * @param {string|object} rruleStrOrObj - RRULE string or object.
 * @param {number} [max=1000] - Max occurrences.
 * @returns {Date[]} Array of occurrence dates.
 */
function generateRRule(startDate, rruleStrOrObj, max = 1000) {
  const rule = typeof rruleStrOrObj === 'string' ? parseRRule(rruleStrOrObj) : rruleStrOrObj;
  const freq = rule.freq || 'DAILY';
  const interval = rule.interval || 1;
  const count = rule.count || 0;
  const out = [];
  let cur = new Date(startDate.getTime());
  const weekdayMap = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };
  while ((count ? out.length < count : out.length < max) && out.length < max) {
    switch (freq) {
      case 'DAILY': cur.setDate(cur.getDate() + interval); break;
      case 'WEEKLY':
        cur.setDate(cur.getDate() + 7 * interval);
        if (rule.byday) {
          const wkStart = new Date(cur);
          wkStart.setDate(wkStart.getDate() - wkStart.getDay());
          for (const bd of rule.byday) {
            const wd = weekdayMap[bd];
            const d = new Date(wkStart);
            d.setDate(d.getDate() + wd);
            out.push(d);
            if (count && out.length >= count) break;
          }
          continue;
        }
        break;
      case 'MONTHLY': {
        if (rule.bymonthday && rule.bymonthday.length) {
          cur.setMonth(cur.getMonth() + interval);
          for (const md of rule.bymonthday) {
            const d = new Date(cur.getFullYear(), cur.getMonth(), md);
            if (!Number.isNaN(d.getTime())) out.push(d);
            if (count && out.length >= count) break;
          }
          continue;
        } else {
          cur.setMonth(cur.getMonth() + interval);
        }
        break;
      }
      case 'YEARLY': cur.setFullYear(cur.getFullYear() + interval); break;
      default: cur.setDate(cur.getDate() + interval); break;
    }
    out.push(new Date(cur.getTime()));
  }
  return out.slice(0, count || out.length);
}

/**
 * Manages business days with holidays and custom workweeks.
 */
class BusinessCalendar {
  /**
   * Creates a BusinessCalendar.
   * @param {{holidays?: (string|Date)[], workweek?: number[]}} [opts={}] - Options.
   */
  constructor(opts = {}) {
    this.holidays = (opts.holidays || []).map(h => { const d = safeDate(h); d.setHours(0, 0, 0, 0); return d.getTime(); });
    this.workweek = opts.workweek || [1, 2, 3, 4, 5];
  }

  /**
   * Checks if a date is a holiday.
   * @param {Date} d - Date to check.
   * @returns {boolean} True if holiday.
   */
  isHoliday(d) {
    const dt = safeDate(d);
    dt.setHours(0, 0, 0, 0);
    return this.holidays.includes(dt.getTime());
  }

  /**
   * Checks if a date is a workday.
   * @param {Date} d - Date to check.
   * @returns {boolean} True if workday.
   */
  isWorkday(d) {
    const day = safeDate(d).getDay();
    return this.workweek.includes(day) && !this.isHoliday(d);
  }

  /**
   * Adds business days to a date.
   * @param {Date} d - Starting date.
   * @param {number} n - Number of days to add (positive or negative).
   * @returns {Date} Resulting date.
   */
  addBusinessDays(d, n) {
    const dir = n >= 0 ? 1 : -1;
    let remaining = Math.abs(Math.floor(n));
    const cur = new Date(safeDate(d));
    while (remaining > 0) {
      cur.setDate(cur.getDate() + dir);
      if (this.isWorkday(cur)) remaining--;
    }
    return cur;
  }
}

/**
 * Approximates moon phase fraction (0=new, 0.5=full).
 * @param {Date} [date=new Date()] - Date for phase.
 * @returns {number} Fraction 0..1.
 */
function moonPhaseFraction(date = new Date()) {
  const d = new Date(date.getTime());
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  let t = ((r * 11) % 30) + month + day;
  if (month < 3) t += 2;
  t -= Math.floor((year < 2000) ? 0.2 : 0.0);
  t = t % 30;
  if (t < 0) t += 30;
  return Math.abs((t - 15) / 15);
}

/**
 * Enhanced Date wrapper with advanced utilities.
 */
class DateWrapper {
  /**
   * Creates a DateWrapper.
   * @param {Date|number|string|{value:string}} input - Input date.
   * @throws {Error} If invalid input.
   */
  constructor(input) {
    this._date = safeDate(input);
    if (Number.isNaN(this._date.getTime())) throw new Error('Invalid date input: ' + String(input));
  }

  /**
   * Returns the native Date.
   * @returns {Date} Native Date.
   */
  toDate() { return new Date(this._date.getTime()); }

  /**
   * Returns timestamp value.
   * @returns {number} Milliseconds since epoch.
   */
  valueOf() { return this._date.getTime(); }

  /**
   * Checks validity.
   * @returns {boolean} True if valid.
   */
  isValid() { return !Number.isNaN(this._date.getTime()); }

  /**
   * Clones the instance.
   * @returns {DateWrapper} Cloned instance.
   */
  clone() { return DateWrapper.fromNative(this._date); }

  /**
   * Creates from native Date.
   * @param {Date} d - Native Date.
   * @returns {DateWrapper} New instance.
   */
  static fromNative(d) {
    const w = new DateWrapper();
    w._date = new Date(d.getTime());
    return w;
  }

  /**
   * Formats the date with a pattern.
   * @param {string} [fmt='YYYY-MM-DD'] - Format string.
   * @returns {string} Formatted string.
   */
  format(fmt = 'YYYY-MM-DD') {
    const d = this._date;
    const tokens = {
      'YYYY': d.getFullYear(), 'YY': String(d.getFullYear()).slice(-2),
      'MMMM': MONTH_NAMES.long[d.getMonth()], 'MMM': MONTH_NAMES.short[d.getMonth()],
      'MM': pad(d.getMonth() + 1), 'M': d.getMonth() + 1,
      'DD': pad(d.getDate()), 'D': d.getDate(),
      'dddd': WEEKDAY_NAMES.long[d.getDay()], 'ddd': WEEKDAY_NAMES.short[d.getDay()],
      'HH': pad(d.getHours()), 'H': d.getHours(),
      'hh': pad((d.getHours() % 12) || 12), 'h': (d.getHours() % 12) || 12,
      'mm': pad(d.getMinutes()), 'm': d.getMinutes(),
      'ss': pad(d.getSeconds()), 's': d.getSeconds(),
      'SSS': pad(d.getMilliseconds(), 3),
      'A': d.getHours() < 12 ? 'AM' : 'PM', 'a': d.getHours() < 12 ? 'am' : 'pm'
    };
    return String(fmt).replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|SSS|A|a/g, t => tokens[t]);
  }

  /**
   * Formats with Intl.DateTimeFormat.
   * @param {string} locale - Locale string.
   * @param {object} [options={}] - Format options.
   * @returns {string} Formatted string.
   */
  formatWithTimeZone(locale, options = {}) {
    const fmt = new Intl.DateTimeFormat(locale, options);
    return fmt.format(this._date);
  }

  /**
   * Adds a value in specified unit.
   * @param {number} [n=0] - Amount to add.
   * @param {Unit} [unit='day'] - Unit.
   * @returns {DateWrapper} This instance.
   * @throws {TypeError} If invalid n or unit.
   */
  add(n = 0, unit = 'day') {
    if (!Number.isFinite(n)) throw new TypeError('n must be finite');
    switch (unit) {
      case 'millisecond': this._date.setMilliseconds(this._date.getMilliseconds() + n); break;
      case 'second': this._date.setSeconds(this._date.getSeconds() + n); break;
      case 'minute': this._date.setMinutes(this._date.getMinutes() + n); break;
      case 'hour': this._date.setHours(this._date.getHours() + n); break;
      case 'day': this._date.setDate(this._date.getDate() + n); break;
      case 'week': this._date.setDate(this._date.getDate() + 7 * n); break;
      case 'month': {
        const d = this._date.getDate();
        this._date.setDate(1);
        this._date.setMonth(this._date.getMonth() + n);
        const max = DateWrapper.daysInMonth(this._date.getFullYear(), this._date.getMonth() + 1);
        this._date.setDate(Math.min(d, max));
        break;
      }
      case 'year': {
        const m = this._date.getMonth();
        const d = this._date.getDate();
        this._date.setDate(1);
        this._date.setFullYear(this._date.getFullYear() + n);
        const max = DateWrapper.daysInMonth(this._date.getFullYear(), m + 1);
        this._date.setMonth(m);
        this._date.setDate(Math.min(d, max));
        break;
      }
      default: throw new TypeError('Unsupported unit');
    }
    return this;
  }

  /**
   * Subtracts a value in specified unit.
   * @param {number} n - Amount to subtract.
   * @param {Unit} unit - Unit.
   * @returns {DateWrapper} This instance.
   */
  subtract(n, unit) { return this.add(-n, unit); }

  addDays(n) { return this.add(n, 'day'); }
  addMonths(n) { return this.add(n, 'month'); }
  addYears(n) { return this.add(n, 'year'); }

  /**
   * Gets ISO week number.
   * @returns {number} ISO week.
   */
  isoWeek() {
    const d = new Date(this._date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Gets ISO week year.
   * @returns {number} ISO year.
   */
  isoWeekYear() {
    const d = new Date(this._date.getTime());
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return d.getFullYear();
  }

  /**
   * Creates from ISO week.
   * @param {number} year - Year.
   * @param {number} week - Week.
   * @param {number} [weekday=1] - Weekday (1=Mon..7=Sun).
   * @returns {DateWrapper} New instance.
   */
  static fromIsoWeek(year, week, weekday = 1) {
    const d = new Date(Date.UTC(year, 0, 1));
    const day = d.getUTCDay() || 7;
    const diff = (week - 1) * 7 + (weekday - day) + 1;
    d.setUTCDate(d.getUTCDate() + diff - 1);
    return DateWrapper.fromNative(new Date(d.getUTCFullYear(), d.getMonth(), d.getDate()));
  }

  /**
   * Gets RRULE generator.
   * @param {string|object} rruleStrOrObj - RRULE.
   * @returns {{all: Function, next: Function}} Generator object.
   */
  rrule(rruleStrOrObj) {
    const start = new Date(this._date.getTime());
    return {
      all: (cap = 100) => generateRRule(start, rruleStrOrObj, cap),
      next: (n = 1) => generateRRule(start, rruleStrOrObj, n)
    };
  }

  /**
   * Creates a BusinessCalendar.
   * @param {object} opts - Options.
   * @returns {BusinessCalendar} Calendar instance.
   */
  static businessCalendar(opts) { return new BusinessCalendar(opts); }

  /**
   * Adds business days using calendar.
   * @param {number} n - Days to add.
   * @param {BusinessCalendar} [calendar=new BusinessCalendar()] - Calendar.
   * @returns {DateWrapper} This instance.
   */
  addBusinessDays(n, calendar = new BusinessCalendar()) {
    const res = calendar.addBusinessDays(this._date, n);
    this._date = res;
    return this;
  }

  /**
   * Checks if business day.
   * @param {BusinessCalendar} [calendar=new BusinessCalendar()] - Calendar.
   * @returns {boolean} True if business day.
   */
  isBusinessDay(calendar = new BusinessCalendar()) {
    return calendar.isWorkday(this._date);
  }

  /**
   * Creates range to another date.
   * @param {Date|DateWrapper} other - End date.
   * @returns {DateRange} Range instance.
   */
  rangeTo(other) {
    return new DateRange(this._date, other instanceof DateWrapper ? other.toDate() : other);
  }

  /**
   * Adds a Duration.
   * @param {Duration} duration - Duration to add.
   * @returns {DateWrapper} This instance.
   * @throws {TypeError} If not Duration.
   */
  addDuration(duration) {
    if (!(duration instanceof Duration)) throw new TypeError('duration must be Duration');
    if (duration.years) this.add(duration.years, 'year');
    if (duration.months) this.add(duration.months, 'month');
    if (duration.days) this.add(duration.days, 'day');
    if (duration.hours) this.add(duration.hours, 'hour');
    if (duration.minutes) this.add(duration.minutes, 'minute');
    if (duration.seconds) this.add(duration.seconds, 'second');
    if (duration.milliseconds) this.add(duration.milliseconds, 'millisecond');
    return this;
  }

  /**
   * Humanizes time difference.
   * @param {DateWrapper|Date} [other=new DateWrapper()] - Other date.
   * @param {{locale?: string, maxUnit?: Unit}} [opts={locale: undefined, maxUnit: 'day'}] - Options.
   * @returns {string} Humanized string.
   */
  humanizeDiff(other = new DateWrapper(), opts = { locale: undefined, maxUnit: 'day' }) {
    const o = other instanceof DateWrapper ? other._date : safeDate(other);
    const diffMs = this._date.getTime() - o.getTime();
    const rtf = typeof Intl !== 'undefined' && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(opts.locale || undefined, { numeric: 'auto' }) : null;
    const abs = Math.abs(diffMs);
    const units = [
      ['year', 1000 * 60 * 60 * 24 * 365],
      ['month', 1000 * 60 * 60 * 24 * 30],
      ['day', 1000 * 60 * 60 * 24],
      ['hour', 1000 * 60 * 60],
      ['minute', 1000 * 60],
      ['second', 1000]
    ];
    for (const [name, ms] of units) {
      if (abs >= ms || name === 'second') {
        const val = Math.round(diffMs / ms);
        if (rtf) return rtf.format(val, name);
        return val === 0 ? 'now' : (val > 0 ? `${val} ${name}${Math.abs(val) > 1 ? 's' : ''} ago` : `in ${Math.abs(val)} ${name}${Math.abs(val) > 1 ? 's' : ''}`);
      }
    }
  }

  /**
   * Computes difference in unit.
   * @param {DateWrapper|Date} other - Other date.
   * @param {Unit} [unit='day'] - Unit.
   * @returns {number} Difference.
   * @throws {TypeError} If unsupported unit.
   */
  diff(other, unit = 'day') {
    const o = other instanceof DateWrapper ? other._date : safeDate(other);
    const ms = this._date.getTime() - o.getTime();
    switch (unit) {
      case 'millisecond': return ms;
      case 'second': return Math.floor(ms / 1000);
      case 'minute': return Math.floor(ms / 60000);
      case 'hour': return Math.floor(ms / 3600000);
      case 'day': return Math.floor(ms / 86400000);
      case 'week': return Math.floor(ms / 604800000);
      case 'month': return (this._date.getFullYear() - o.getFullYear()) * 12 + (this._date.getMonth() - o.getMonth());
      case 'year': return this._date.getFullYear() - o.getFullYear();
      default: throw new TypeError('Unsupported unit');
    }
  }

  /**
   * Compares to another date.
   * @param {DateWrapper|Date} other - Other date.
   * @returns {number} -1 if less, 1 if greater, 0 if equal.
   * @throws {Error} If invalid other.
   */
  compare(other) {
    const t = other instanceof DateWrapper ? other._date.getTime() : safeDate(other).getTime();
    if (Number.isNaN(t)) throw new Error('Invalid other date');
    const a = this._date.getTime();
    return a === t ? 0 : (a < t ? -1 : 1);
  }

  /**
   * Returns RFC3339 string.
   * @returns {string} RFC3339 string.
   */
  toRFC3339() { return this._date.toISOString(); }

  /**
   * Creates from Temporal object (if available).
   * @param {object} plain - Temporal object.
   * @returns {DateWrapper} New instance.
   * @throws {Error} If Temporal not available or unsupported.
   */
  static fromTemporal(plain) {
    if (!globalThis.Temporal) throw new Error('Temporal not available');
    if (plain instanceof Temporal.PlainDateTime) return DateWrapper.fromNative(new Date(plain.toString()));
    throw new Error('Unsupported Temporal object');
  }

  /**
   * Converts to Temporal.Instant (if available).
   * @returns {object} Temporal Instant.
   * @throws {Error} If Temporal not available.
   */
  toTemporalInstant() {
    if (!globalThis.Temporal) throw new Error('Temporal not available');
    return Temporal.Instant.fromEpochMilliseconds(this._date.getTime());
  }

  /**
   * Gets moon phase fraction.
   * @returns {number} 0..1 fraction.
   */
  moonPhase() { return moonPhaseFraction(this._date); }

  /**
   * Approximates sunrise time (crude).
   * @param {number} latitude - Latitude.
   * @param {number} longitude - Longitude (unused in approx).
   * @returns {Date} Approximate sunrise.
   * @throws {TypeError} If missing coords.
   */
  sunrise(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') throw new TypeError('latitude and longitude required');
    const d = new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate(), 12, 0, 0);
    const offset = Math.round(6 - Math.abs(latitude) / 15);
    d.setHours(12 - offset);
    return new Date(d);
  }

  /**
   * Approximates sunset time (crude).
   * @param {number} latitude - Latitude.
   * @param {number} longitude - Longitude (unused in approx).
   * @returns {Date} Approximate sunset.
   * @throws {TypeError} If missing coords.
   */
  sunset(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') throw new TypeError('latitude and longitude required');
    const d = new Date(this._date.getFullYear(), this._date.getMonth(), this._date.getDate(), 12, 0, 0);
    const offset = Math.round(6 - Math.abs(latitude) / 15);
    d.setHours(12 + offset);
    return new Date(d);
  }

  /**
   * Installs a plugin.
   * @param {Function|{install: Function}} plugin - Plugin.
   * @throws {TypeError} If invalid plugin.
   */
  static use(plugin) {
    if (typeof plugin.install === 'function') plugin.install(DateWrapper);
    else if (typeof plugin === 'function') plugin(DateWrapper);
    else throw new TypeError('plugin must be function or {install}');
  }

  /**
   * Sets to start of unit.
   * @param {Unit} [unit='day'] - Unit.
   * @returns {DateWrapper} This instance.
   */
  startOf(unit = 'day') {
    switch (unit) {
      case 'year': this._date.setMonth(0, 1); this._date.setHours(0, 0, 0, 0); break;
      case 'month': this._date.setDate(1); this._date.setHours(0, 0, 0, 0); break;
      case 'week': const day = this._date.getDay(); this._date.setDate(this._date.getDate() - day); this._date.setHours(0, 0, 0, 0); break;
      case 'day': this._date.setHours(0, 0, 0, 0); break;
      case 'hour': this._date.setMinutes(0, 0, 0); break;
      default: this._date.setHours(0, 0, 0, 0);
    }
    return this;
  }

  /**
   * Sets to end of unit.
   * @param {Unit} [unit='day'] - Unit.
   * @returns {DateWrapper} This instance.
   */
  endOf(unit = 'day') {
    switch (unit) {
      case 'year': this._date.setMonth(11, 31); this._date.setHours(23, 59, 59, 999); break;
      case 'month': this._date.setMonth(this._date.getMonth() + 1, 0); this._date.setHours(23, 59, 59, 999); break;
      case 'week': const day = this._date.getDay(); this._date.setDate(this._date.getDate() + (6 - day)); this._date.setHours(23, 59, 59, 999); break;
      case 'day': this._date.setHours(23, 59, 59, 999); break;
      case 'hour': this._date.setMinutes(59, 59, 999); break;
      default: this._date.setHours(23, 59, 59, 999);
    }
    return this;
  }

  /**
   * Checks if leap year.
   * @param {number} y - Year.
   * @returns {boolean} True if leap.
   */
  static isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0); }

  /**
   * Gets days in month.
   * @param {number} y - Year.
   * @param {number} m - Month (1-12).
   * @returns {number} Days.
   */
  static daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
}

(function attach() {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateWrapper;
    module.exports.DateWrapper = DateWrapper;
    module.exports.Duration = Duration;
    module.exports.DateRange = DateRange;
    module.exports.BusinessCalendar = BusinessCalendar;
  } else {
    if (typeof window !== 'undefined') {
      window.DateWrapper = DateWrapper;
      window.Duration = Duration;
      window.DateRange = DateRange;
      window.BusinessCalendar = BusinessCalendar;
    }
    if (typeof self !== 'undefined') {
      self.DateWrapper = DateWrapper;
      self.Duration = Duration;
      self.DateRange = DateRange;
      self.BusinessCalendar = BusinessCalendar;
    }
  }
})();
