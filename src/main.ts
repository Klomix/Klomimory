import { Plugin, Notice } from 'obsidian';
import { KlomimorySettings, DEFAULT_SETTINGS, VIEW_TYPE_KLOMIMORY_STATS, WordCard } from './types';
import { KlomimoryStatsView } from './StatsView';
import { TopicSelectionModal } from './Modals';

export default class KlomimoryPlugin extends Plugin {
    settings: KlomimorySettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();
        this.checkAndGrantFreezes();

        this.registerView(
            VIEW_TYPE_KLOMIMORY_STATS,
            (leaf) => new KlomimoryStatsView(leaf, this)
        );

        this.addRibbonIcon('brain', 'Klomimory', () => {
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
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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

    async checkAndGrantFreezes() {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!this.settings.lastFreezeEarnDate) {
            this.settings.lastFreezeEarnDate = todayStr;
            this.settings.streakFreezes = (this.settings.streakFreezes || 0) + 1;
            await this.saveSettings();
            return;
        }

        const lastDate = new Date(this.settings.lastFreezeEarnDate);
        const currentDate = new Date(todayStr);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 3) {
            const addedFreezes = Math.floor(diffDays / 3);
            this.settings.streakFreezes = (this.settings.streakFreezes || 0) + addedFreezes;
            
            lastDate.setDate(lastDate.getDate() + addedFreezes * 3);
            this.settings.lastFreezeEarnDate = lastDate.toISOString().split('T')[0];
            await this.saveSettings();
        }
    }

    async logActivity(isFailed: boolean = false) {
        const today = new Date().toISOString().split('T')[0];
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
        await this.checkAndGrantFreezes();
        await this.saveSettings();
    }

    async recordMistake(card: WordCard, type: 'again' | 'hard') {
        const key = `${card.topic}___${card.word}`;
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

    startStudySession() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('Please open a note containing word cards!');
            return;
        }

        this.app.vault.read(activeFile).then((content) => {
            const cards = this.extractCardsFromText(content);
            if (cards.length === 0 && this.settings.failedWords.length === 0) {
                new Notice('No word cards found in this note and no hard words stored.');
            } else {
                new TopicSelectionModal(this.app, cards, this).open();
            }
        });
    }

    extractCardsFromText(text: string): WordCard[] {
        const lines = text.split('\n');
        const cards: WordCard[] = [];
        let currentTopic = 'Untagged';

        const headingRegex = /^#{1,6}\s+(.+)$/;
        const hrRegex = /^([-*_])\1{2,}\s*$/;
        const withTransRegex = /^(.+?)\s*[-–—]\s*\[(.+?)\]\s*[-–—]\s*(.+)$/;
        const simpleRegex = /^(.+?)\s*[-–—]\s*(.+)$/;

        const cleanText = (str: string) => {
            return str
                .replace(/^[-*+]\s+/, '')
                .replace(/^\d+\.\s+/, '')
                .replace(/[*_]{1,3}/g, '')
                .trim();
        };

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || hrRegex.test(trimmedLine)) {
                continue;
            }

            const headingMatch = trimmedLine.match(headingRegex);
            if (headingMatch) {
                currentTopic = headingMatch[1].trim();
                continue;
            }

            const transMatch = trimmedLine.match(withTransRegex);
            if (transMatch) {
                cards.push({
                    word: cleanText(transMatch[1]),
                    transcription: transMatch2Clean(transMatch[2]),
                    translation: cleanText(transMatch[3]),
                    topic: currentTopic,
                    rawLine: line
                });
                continue;
            }

            const simpleMatch = trimmedLine.match(simpleRegex);
            if (simpleMatch) {
                const cleanedWord = cleanText(simpleMatch[1]);
                if (cleanedWord.length > 0) {
                    cards.push({
                        word: cleanedWord,
                        translation: cleanText(simpleMatch[2]),
                        topic: currentTopic,
                        rawLine: line
                    });
                }
            }
        }

        return cards;

        function transMatch2Clean(t: string) {
            return t.trim();
        }
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