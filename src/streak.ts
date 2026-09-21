export const MAX_FREEZES = 5;
export const ACTIVE_DAYS_PER_FREEZE = 3;

export interface StreakState {
    streakCount: number;
    lastStreakDate: string;
    streakFreezes: number;
    freezeProgress: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function localDateStr(d: Date = new Date()): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toUtcMs(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
    return Math.round((toUtcMs(to) - toUtcMs(from)) / 86400000);
}

export function addDays(dateStr: string, n: number): string {
    const t = new Date(toUtcMs(dateStr) + n * 86400000);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function clampFreezes(n: number | undefined): number {
    const v = Number.isFinite(n) ? (n as number) : 0;
    return Math.min(Math.max(Math.floor(v), 0), MAX_FREEZES);
}

export function applyMissedDays(state: StreakState, today: string): StreakState {
    const s: StreakState = { ...state, streakFreezes: clampFreezes(state.streakFreezes) };
    if (!s.lastStreakDate || s.streakCount <= 0) return s;

    const missed = daysBetween(s.lastStreakDate, today) - 1;
    if (missed <= 0) return s;

    if (s.streakFreezes >= missed) {
        s.streakFreezes -= missed;
        s.lastStreakDate = addDays(today, -1);
    } else {
        s.streakCount = 0;
    }
    return s;
}

export function registerStudyDay(state: StreakState, today: string): { state: StreakState; newDay: boolean } {
    const s = applyMissedDays(state, today);
    if (s.lastStreakDate === today && s.streakCount > 0) {
        return { state: s, newDay: false };
    }

    s.streakCount = Math.max(s.streakCount, 0) + 1;
    s.lastStreakDate = today;
    s.freezeProgress = (s.freezeProgress || 0) + 1;

    if (s.freezeProgress >= ACTIVE_DAYS_PER_FREEZE) {
        s.freezeProgress = 0;
        if (s.streakFreezes < MAX_FREEZES) s.streakFreezes += 1;
    }
    return { state: s, newDay: true };
}

export function migrateFromActivityLog(
    log: Record<string, { cardsReviewed?: number }>,
    oldFreezes: number
): StreakState {
    const active = Object.keys(log || {})
        .filter(k => (log[k]?.cardsReviewed || 0) > 0)
        .sort();

    if (active.length === 0) {
        return { streakCount: 0, lastStreakDate: '', streakFreezes: clampFreezes(oldFreezes), freezeProgress: 0 };
    }

    const set = new Set(active);
    const last = active[active.length - 1];
    let count = 1;
    let cur = last;
    while (set.has(addDays(cur, -1))) {
        count++;
        cur = addDays(cur, -1);
    }

    return {
        streakCount: count,
        lastStreakDate: last,
        streakFreezes: clampFreezes(oldFreezes),
        freezeProgress: count % ACTIVE_DAYS_PER_FREEZE
    };
}
