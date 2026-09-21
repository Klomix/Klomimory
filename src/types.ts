export type CardType = 'word' | 'qa';
export type StudyMode = 'classic' | 'repetition';
export type CardOrderMode = 'word-first' | 'translation-first' | 'random';

export interface WordCard {
    word: string;
    translation: string;
    transcription?: string;
    topic: string;
    rawLine?: string;
    rawText?: string;
    startLine?: number;
    sourcePath?: string;
    againCount?: number;
    hardCount?: number;
    type?: CardType;
}

export interface DailyActivity {
    cardsReviewed: number;
    failedCount: number;
    goodCount?: number;
}

export interface ProgressSnapshot {
    statsKey: string;
    statsEntry?: { word: string; translation: string; againCount: number; hardCount: number };
    dayKey: string;
    dayEntry?: DailyActivity;
    failedWords: WordCard[];
    streak: {
        streakCount: number;
        lastStreakDate: string;
        streakFreezes: number;
        freezeProgress: number;
    };
}

export interface KlomimorySettings {
    failedWords: WordCard[];
    statsWords: Record<string, {
        word: string;
        translation: string;
        againCount: number;
        hardCount: number;
    }>;
    activityLog: Record<string, DailyActivity>;

    streakCount: number;
    lastStreakDate: string;
    streakFreezes: number;
    freezeProgress: number;
    streakMigrated: boolean;
    lastFreezeEarnDate: string;

    dailyGoal: number;
    cardOrderMode: CardOrderMode;
    studyMode: StudyMode;
    contentTypeFilter: 'all' | 'word' | 'qa';
    filterType: 'all' | 'with' | 'without';
    isRandomOrder: boolean;
}

export const DEFAULT_SETTINGS: KlomimorySettings = {
    failedWords: [],
    statsWords: {},
    activityLog: {},
    streakCount: 0,
    lastStreakDate: '',
    streakFreezes: 0,
    freezeProgress: 0,
    streakMigrated: false,
    lastFreezeEarnDate: '',
    dailyGoal: 20,
    cardOrderMode: 'word-first',
    studyMode: 'repetition',
    contentTypeFilter: 'all',
    filterType: 'all',
    isRandomOrder: false
};

export const VIEW_TYPE_KLOMIMORY_STATS = 'klomimory-stats-view';
