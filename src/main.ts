import { Plugin, Notice, TFile } from 'obsidian';
import {
    KlomimorySettings, DEFAULT_SETTINGS, VIEW_TYPE_KLOMIMORY_STATS, WordCard, ProgressSnapshot
} from './types';
import { KlomimoryStatsView } from './StatsView';
import { TopicSelectionModal } from './Modals';
import { parseCards, serializeCard, replaceCardBlock, CardFields } from './cardFormat';
import {
    StreakState, applyMissedDays, registerStudyDay, migrateFromActivityLog, localDateStr, clampFreezes
} from './streak';

export default class KlomimoryPlugin extends Plugin {
    settings: KlomimorySettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();
        await this.refreshStreak();

        this.registerView(
            VIEW_TYPE_KLOMIMORY_STATS,
            (leaf) => new KlomimoryStatsView(leaf, this)
        );

        this.addRibbonIcon('brain', 'Klomimory Practice', () => {
            this.startStudySession();
        });

        this.addRibbonIcon('bar-chart-2', 'Klomimory Stats', () => {
            this.activateStatsView();
        });

        this.addCommand({
            id: 'open-klomimory-stats',
            name: 'Open Statistics Panel',
            callback: () => this.activateStatsView(),
        });

        this.addCommand({
            id: 'start-klomimory-session',
            name: 'Start Study Session',
            callback: () => this.startStudySession(),
        });
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), data);

        if (!this.settings.streakMigrated) {
            this.setStreakState(
                migrateFromActivityLog(this.settings.activityLog || {}, this.settings.streakFreezes || 0)
            );
            this.settings.streakMigrated = true;
            await this.saveData(this.settings);
        } else {
            this.settings.streakFreezes = clampFreezes(this.settings.streakFreezes);
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);

        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_KLOMIMORY_STATS);
        leaves.forEach(leaf => {
            if (leaf.view instanceof KlomimoryStatsView) {
                leaf.view.render();
            }
        });
    }

  getStreakState(): StreakState {
        const s = this.settings;
        return {
            streakCount: s.streakCount || 0,
            lastStreakDate: s.lastStreakDate || '',
            streakFreezes: clampFreezes(s.streakFreezes),
            freezeProgress: s.freezeProgress || 0
        };
    }

    setStreakState(st: StreakState) {
        this.settings.streakCount = st.streakCount;
        this.settings.lastStreakDate = st.lastStreakDate;
        this.settings.streakFreezes = st.streakFreezes;
        this.settings.freezeProgress = st.freezeProgress;
    }

    async refreshStreak() {
        const before = this.getStreakState();
        const after = applyMissedDays(before, localDateStr());
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            this.setStreakState(after);
            await this.saveSettings();
        }
    }

    async logActivity(isFailed: boolean = false) {
        const today = localDateStr();
        if (!this.settings.activityLog) {
            this.settings.activityLog = {};
        }
        if (!this.settings.activityLog[today]) {
            this.settings.activityLog[today] = { cardsReviewed: 0, failedCount: 0 };
        }
        this.settings.activityLog[today].cardsReviewed += 1;
        if (isFailed) {
            this.settings.activityLog[today].failedCount += 1;
        }

        const { state } = registerStudyDay(this.getStreakState(), today);
        this.setStreakState(state);

        await this.saveSettings();
    }

    private statsKey(card: WordCard): string {
        return `${card.topic}___${card.word}`;
    }

    async recordMistake(card: WordCard, type: 'again' | 'hard') {
        const key = this.statsKey(card);
        if (!this.settings.statsWords) {
            this.settings.statsWords = {};
        }

        if (!this.settings.statsWords[key]) {
            this.settings.statsWords[key] = {
                word: card.word,
                translation: card.translation,
                againCount: 0,
                hardCount: 0
            };
        }

        if (type === 'again') {
            this.settings.statsWords[key].againCount++;
        } else {
            this.settings.statsWords[key].hardCount++;
        }

        await this.saveSettings();
    }

    async addFailedWord(card: WordCard) {
        const exists = this.settings.failedWords.some(
            c => c.word.toLowerCase() === card.word.toLowerCase() &&
                 c.translation.toLowerCase() === card.translation.toLowerCase()
        );
        if (!exists) {
            this.settings.failedWords.push(card);
            await this.saveSettings();
        }
    }

    async removeFailedWord(card: WordCard) {
        this.settings.failedWords = this.settings.failedWords.filter(
            c => !(c.word.toLowerCase() === card.word.toLowerCase() &&
                   c.translation.toLowerCase() === card.translation.toLowerCase())
        );
        await this.saveSettings();
    }

    captureProgress(card: WordCard): ProgressSnapshot {
        const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
        const statsKey = this.statsKey(card);
        const dayKey = localDateStr();
        const statsEntry = this.settings.statsWords?.[statsKey];
        const dayEntry = this.settings.activityLog?.[dayKey];

        return {
            statsKey,
            statsEntry: statsEntry ? clone(statsEntry) : undefined,
            dayKey,
            dayEntry: dayEntry ? clone(dayEntry) : undefined,
            failedWords: [...this.settings.failedWords],
            streak: this.getStreakState()
        };
    }

    async restoreProgress(snap: ProgressSnapshot) {
        if (!this.settings.statsWords) this.settings.statsWords = {};
        if (snap.statsEntry) this.settings.statsWords[snap.statsKey] = snap.statsEntry;
        else delete this.settings.statsWords[snap.statsKey];

        if (!this.settings.activityLog) this.settings.activityLog = {};
        if (snap.dayEntry) this.settings.activityLog[snap.dayKey] = snap.dayEntry;
        else delete this.settings.activityLog[snap.dayKey];

        this.settings.failedWords = snap.failedWords;
        this.setStreakState(snap.streak);

        await this.saveSettings();
    }

    private resolveSourceFile(card: WordCard): TFile | null {
        if (card.sourcePath) {
            const f = this.app.vault.getAbstractFileByPath(card.sourcePath);
            if (f instanceof TFile) return f;
        }
        return this.app.workspace.getActiveFile();
    }

  async applyCardEdit(
        card: WordCard,
        next: CardFields,
        others: WordCard[] = []
    ): Promise<{ savedToFile: boolean; oldKey: string; newKey: string; oldWord: string; oldTranslation: string }> {
        const oldKey = this.statsKey(card);
        const oldWord = card.word;
        const oldTranslation = card.translation;
        const isSame = (c: WordCard) =>
            c === card || (c.topic === card.topic && c.word === oldWord && c.translation === oldTranslation);

        const targets = new Set<WordCard>([card]);
        [...others, ...this.settings.failedWords].forEach(c => { if (isSame(c)) targets.add(c); });

        const newRaw = serializeCard(card, next);
        let savedToFile = false as boolean;
        const file = this.resolveSourceFile(card);
        if (file) {
            await this.app.vault.process(file, (content) => {
                const updated = replaceCardBlock(content, card, newRaw);
                if (updated === null) return content;
                savedToFile = true;
                return updated;
            });
        }

        const parsed = parseCards(newRaw, card.sourcePath)[0];
        const fields: CardFields = parsed
            ? { word: parsed.word, translation: parsed.translation, transcription: parsed.transcription }
            : next;

        targets.forEach(c => {
            c.word = fields.word;
            c.translation = fields.translation;
            if ((c.type || 'word') === 'word') c.transcription = fields.transcription || undefined;
            if (savedToFile) {
                c.rawText = newRaw;
                c.rawLine = newRaw.split('\n')[0];
            }
        });

        const newKey = this.statsKey(card);
        const stats = this.settings.statsWords || (this.settings.statsWords = {});
        const oldEntry = stats[oldKey];
        if (oldEntry) {
            if (newKey !== oldKey) {
                const existing = stats[newKey];
                if (existing) {
                    existing.againCount += oldEntry.againCount;
                    existing.hardCount += oldEntry.hardCount;
                    existing.word = fields.word;
                    existing.translation = fields.translation;
                } else {
                    stats[newKey] = { ...oldEntry, word: fields.word, translation: fields.translation };
                }
                delete stats[oldKey];
            } else {
                oldEntry.translation = fields.translation;
            }
        }

        await this.saveSettings();
        return { savedToFile, oldKey, newKey, oldWord, oldTranslation };
    }

    async loadCardsFromActiveFile(): Promise<WordCard[]> {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return [];
        const content = await this.app.vault.read(activeFile);
        return this.extractCardsFromText(content, activeFile.path);
    }

    startStudySession() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('Please open a note containing word cards!');
            return;
        }

        this.app.vault.read(activeFile).then((content) => {
            const cards = this.extractCardsFromText(content, activeFile.path);
            if (cards.length === 0 && this.settings.failedWords.length === 0) {
                new Notice('No word cards found in this note and no hard words stored.');
            } else {
                new TopicSelectionModal(this.app, cards, this).open();
            }
        });
    }

    extractCardsFromText(text: string, sourcePath?: string): WordCard[] {
        return parseCards(text, sourcePath);
    }

    async activateStatsView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_KLOMIMORY_STATS)[0];

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({
                    type: VIEW_TYPE_KLOMIMORY_STATS,
                    active: true,
                });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}
