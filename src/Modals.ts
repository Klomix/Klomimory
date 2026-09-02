import { App, Modal, setIcon, Notice } from 'obsidian';
import { WordCard, StudyMode, CardOrderMode } from './types';
import type KlomimoryPlugin from './main';

export type CardType = 'word' | 'qa';

export class TopicSelectionModal extends Modal {
    allCards: WordCard[];
    plugin: KlomimoryPlugin;
    topicsMap: Map<string, WordCard[]> = new Map();
    selectedTopics: Set<string> = new Set();
    filterType: 'all' | 'with' | 'without' = 'all';
    contentTypeFilter: 'all' | 'word' | 'qa' = 'all';
    isRandomOrder: boolean = false;
    studyMode: StudyMode = 'repetition';
    cardOrderMode: CardOrderMode;

    constructor(app: App, cards: WordCard[], plugin: KlomimoryPlugin) {
        super(app);
        this.allCards = cards;
        this.plugin = plugin;
        this.cardOrderMode = plugin.settings.cardOrderMode || 'word-first';
        this.studyMode = plugin.settings.studyMode || 'repetition';
        this.contentTypeFilter = plugin.settings.contentTypeFilter || 'all';
        this.filterType = plugin.settings.filterType || 'all';
        this.isRandomOrder = plugin.settings.isRandomOrder || false;
        this.updateTopicsMap();
    }

    getFilteredCards(): WordCard[] {
        return this.allCards.filter(card => {
            const cardType = card.type || 'word';
            if (this.contentTypeFilter !== 'all' && cardType !== this.contentTypeFilter) return false;
            if (cardType === 'word' && this.contentTypeFilter !== 'qa') {
                if (this.filterType === 'with') return !!card.transcription;
                if (this.filterType === 'without') return !card.transcription;
            }
            return true;
        });
    }

    updateTopicsMap() {
        this.topicsMap.clear();
        this.selectedTopics.clear();
        const filtered = this.getFilteredCards();
        for (const card of filtered) {
            if (!this.topicsMap.has(card.topic)) {
                this.topicsMap.set(card.topic, []);
            }
            this.topicsMap.get(card.topic)?.push(card);
            this.selectedTopics.add(card.topic);
        }
    }

    shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    onOpen() {
        this.render();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('klomimory-modal-content');

        const title = contentEl.createEl('h2', { text: 'Study Settings', cls: 'klomimory-title' });
        title.style.marginBottom = '15px';
        title.style.textAlign = 'center';

        const hardWordsCount = this.plugin.settings.failedWords.length;
        if (hardWordsCount > 0) {
            const hardBox = contentEl.createEl('div', { cls: 'klomimory-hard-section' });
            hardBox.style.marginBottom = '15px';
            hardBox.style.padding = '12px';
            hardBox.style.backgroundColor = 'var(--background-secondary-alt)';
            hardBox.style.border = '1px solid var(--text-error)';
            hardBox.style.borderRadius = '8px';
            hardBox.style.display = 'flex';
            hardBox.style.flexWrap = 'wrap';
            hardBox.style.alignItems = 'center';
            hardBox.style.justifyContent = 'space-between';
            hardBox.style.gap = '10px';

            const infoDiv = hardBox.createEl('div');
            const hardTitle = infoDiv.createEl('div', { text: 'Hard Words Vault (Queue)' });
            hardTitle.style.fontWeight = 'bold';
            hardTitle.style.fontSize = '0.95em';

            const hardDesc = infoDiv.createEl('div', { text: `${hardWordsCount} item(s) waiting` });
            hardDesc.style.color = 'var(--text-muted)';
            hardDesc.style.fontSize = '0.8em';

            const practiceBtn = hardBox.createEl('button', { text: 'Practice Queue' });
            practiceBtn.style.backgroundColor = 'var(--text-error)';
            practiceBtn.style.color = '#fff';
            practiceBtn.style.fontSize = '0.85em';
            practiceBtn.style.minHeight = '36px';
            practiceBtn.onclick = () => {
                let hardCards = [...this.plugin.settings.failedWords];
                if (this.isRandomOrder) {
                    hardCards = this.shuffleArray(hardCards);
                }
                this.close();
                new CardStudyModal(this.app, hardCards, this.allCards, 'repetition', this.cardOrderMode, this.plugin).open();
            };
        }

        const contentTypeSection = contentEl.createEl('div');
        contentTypeSection.style.marginBottom = '10px';
        contentTypeSection.style.padding = '10px';
        contentTypeSection.style.backgroundColor = 'var(--background-secondary)';
        contentTypeSection.style.borderRadius = '8px';

        const ctLabel = contentTypeSection.createEl('div', { text: 'Content Type:' });
        ctLabel.style.fontWeight = 'bold';
        ctLabel.style.marginBottom = '8px';
        ctLabel.style.fontSize = '0.9em';

        const ctBox = contentTypeSection.createEl('div');
        ctBox.style.display = 'flex';
        ctBox.style.gap = '8px';

        const contentTypes: { label: string; value: 'all' | 'word' | 'qa' }[] = [
            { label: 'All', value: 'all' },
            { label: 'Words', value: 'word' },
            { label: 'Q&A / Terms', value: 'qa' }
        ];

        contentTypes.forEach(ct => {
            const btn = ctBox.createEl('button', { text: ct.label });
            btn.style.flex = '1';
            btn.style.fontSize = '0.85em';
            btn.style.minHeight = '36px';
            if (this.contentTypeFilter === ct.value) btn.classList.add('mod-cta');
            btn.onclick = async () => {
                this.contentTypeFilter = ct.value;
                this.plugin.settings.contentTypeFilter = ct.value;
                await this.plugin.saveSettings();
                this.updateTopicsMap();
                this.render();
            };
        });

        const modeSection = contentEl.createEl('div', { cls: 'klomimory-mode-section' });
        modeSection.style.marginBottom = '12px';
        modeSection.style.padding = '10px';
        modeSection.style.backgroundColor = 'var(--background-secondary)';
        modeSection.style.borderRadius = '8px';

        const modeLabel = modeSection.createEl('div', { text: 'Learning Mode:' });
        modeLabel.style.fontWeight = 'bold';
        modeLabel.style.marginBottom = '8px';
        modeLabel.style.fontSize = '0.9em';

        const modeBox = modeSection.createEl('div');
        modeBox.style.display = 'flex';
        modeBox.style.gap = '8px';
        modeBox.style.flexWrap = 'wrap';

        const repBtn = modeBox.createEl('button', { text: 'Active Recall' });
        repBtn.style.flex = '1';
        repBtn.style.minHeight = '36px';
        if (this.studyMode === 'repetition') repBtn.classList.add('mod-cta');
        repBtn.onclick = async () => {
            this.studyMode = 'repetition';
            this.plugin.settings.studyMode = 'repetition';
            await this.plugin.saveSettings();
            this.render();
        };

        const classicBtn = modeBox.createEl('button', { text: 'Classic View' });
        classicBtn.style.flex = '1';
        classicBtn.style.minHeight = '36px';
        if (this.studyMode === 'classic') classicBtn.classList.add('mod-cta');
        classicBtn.onclick = async () => {
            this.studyMode = 'classic';
            this.plugin.settings.studyMode = 'classic';
            await this.plugin.saveSettings();
            this.render();
        };

        const dirSection = contentEl.createEl('div', { cls: 'klomimory-direction-section' });
        dirSection.style.marginBottom = '15px';
        dirSection.style.padding = '10px';
        dirSection.style.backgroundColor = 'var(--background-secondary)';
        dirSection.style.borderRadius = '8px';

        const dirLabel = dirSection.createEl('div', { text: 'Card Side Order:' });
        dirLabel.style.fontWeight = 'bold';
        dirLabel.style.marginBottom = '8px';
        dirLabel.style.fontSize = '0.9em';

        const dirBox = dirSection.createEl('div');
        dirBox.style.display = 'flex';
        dirBox.style.gap = '8px';
        dirBox.style.flexWrap = 'wrap';

        const wordFirstText = this.contentTypeFilter === 'qa' ? 'Question → Answer' : (this.contentTypeFilter === 'word' ? 'Word → Trans.' : 'Front → Back');
        const transFirstText = this.contentTypeFilter === 'qa' ? 'Answer → Question' : (this.contentTypeFilter === 'word' ? 'Trans. → Word' : 'Back → Front');

        const wordFirstBtn = dirBox.createEl('button', { text: wordFirstText });
        wordFirstBtn.style.flex = '1';
        wordFirstBtn.style.fontSize = '0.8em';
        wordFirstBtn.style.minHeight = '36px';
        if (this.cardOrderMode === 'word-first') wordFirstBtn.classList.add('mod-cta');
        wordFirstBtn.onclick = async () => {
            this.cardOrderMode = 'word-first';
            this.plugin.settings.cardOrderMode = 'word-first';
            await this.plugin.saveSettings();
            this.render();
        };

        const transFirstBtn = dirBox.createEl('button', { text: transFirstText });
        transFirstBtn.style.flex = '1';
        transFirstBtn.style.fontSize = '0.8em';
        transFirstBtn.style.minHeight = '36px';
        if (this.cardOrderMode === 'translation-first') transFirstBtn.classList.add('mod-cta');
        transFirstBtn.onclick = async () => {
            this.cardOrderMode = 'translation-first';
            this.plugin.settings.cardOrderMode = 'translation-first';
            await this.plugin.saveSettings();
            this.render();
        };

        const randomSideBtn = dirBox.createEl('button', { text: 'Random' });
        randomSideBtn.style.flex = '1';
        randomSideBtn.style.fontSize = '0.8em';
        randomSideBtn.style.minHeight = '36px';
        if (this.cardOrderMode === 'random') randomSideBtn.classList.add('mod-cta');
        randomSideBtn.onclick = async () => {
            this.cardOrderMode = 'random';
            this.plugin.settings.cardOrderMode = 'random';
            await this.plugin.saveSettings();
            this.render();
        };

        const controlsRow = contentEl.createEl('div');
        controlsRow.style.display = 'flex';
        controlsRow.style.justifyContent = 'space-between';
        controlsRow.style.gap = '8px';
        controlsRow.style.marginBottom = '15px';
        controlsRow.style.flexWrap = 'wrap';

        if (this.contentTypeFilter !== 'qa') {
            const filterBox = controlsRow.createEl('div');
            filterBox.style.display = 'flex';
            filterBox.style.gap = '4px';
            filterBox.style.flexWrap = 'wrap';

            const filterOptions: { label: string; value: 'all' | 'with' | 'without' }[] = [
                { label: 'All', value: 'all' },
                { label: 'With Trans.', value: 'with' },
                { label: 'No Trans.', value: 'without' }
            ];

            filterOptions.forEach(opt => {
                const btn = filterBox.createEl('button', { text: opt.label });
                btn.style.fontSize = '0.75em';
                btn.style.padding = '6px 8px';
                btn.style.minHeight = '32px';
                if (this.filterType === opt.value) btn.classList.add('mod-cta');
                btn.onclick = async () => {
                    this.filterType = opt.value;
                    this.plugin.settings.filterType = opt.value;
                    await this.plugin.saveSettings();
                    this.updateTopicsMap();
                    this.render();
                };
            });
        }

        const orderBox = controlsRow.createEl('div');
        orderBox.style.display = 'flex';
        orderBox.style.gap = '4px';
        if (this.contentTypeFilter === 'qa') {
            orderBox.style.width = '100%';
            orderBox.style.justifyContent = 'flex-end';
        }

        const inOrderBtn = orderBox.createEl('button', { text: 'Order' });
        inOrderBtn.style.minHeight = '32px';
        if (!this.isRandomOrder) inOrderBtn.classList.add('mod-cta');
        inOrderBtn.onclick = async () => {
            this.isRandomOrder = false;
            this.plugin.settings.isRandomOrder = false;
            await this.plugin.saveSettings();
            this.render();
        };

        const randomBtn = orderBox.createEl('button', { text: 'Shuffle' });
        randomBtn.style.minHeight = '32px';
        if (this.isRandomOrder) randomBtn.classList.add('mod-cta');
        randomBtn.onclick = async () => {
            this.isRandomOrder = true;
            this.plugin.settings.isRandomOrder = true;
            await this.plugin.saveSettings();
            this.render();
        };

        const topicsContainer = contentEl.createEl('div', { cls: 'klomimory-topics-list' });
        topicsContainer.style.maxHeight = '180px';
        topicsContainer.style.overflowY = 'auto';
        topicsContainer.style.marginBottom = '15px';
        topicsContainer.style.border = '1px solid var(--background-modifier-border)';
        topicsContainer.style.borderRadius = '6px';
        topicsContainer.style.padding = '8px';

        this.topicsMap.forEach((topicCards, topicName) => {
            const row = topicsContainer.createEl('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '8px 4px';
            row.style.borderBottom = '1px solid var(--background-modifier-border)';

            const leftGroup = row.createEl('label');
            leftGroup.style.display = 'flex';
            leftGroup.style.alignItems = 'center';
            leftGroup.style.gap = '8px';
            leftGroup.style.cursor = 'pointer';

            const checkbox = leftGroup.createEl('input', { type: 'checkbox' });
            checkbox.checked = this.selectedTopics.has(topicName);
            checkbox.onchange = (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                if (checked) this.selectedTopics.add(topicName);
                else this.selectedTopics.delete(topicName);
            };
            leftGroup.createSpan({ text: topicName }).style.wordBreak = 'break-word';

            const countSpan = row.createSpan({ text: `${topicCards.length}` });
            countSpan.style.color = 'var(--text-muted)';
            countSpan.style.fontSize = '0.8em';
            countSpan.style.marginLeft = '8px';
        });

        const bottomBox = contentEl.createEl('div');
        bottomBox.style.display = 'flex';
        bottomBox.style.gap = '8px';
        bottomBox.style.flexWrap = 'wrap';

        const toggleAllBtn = bottomBox.createEl('button', { text: 'Toggle All' });
        toggleAllBtn.style.minHeight = '38px';
        toggleAllBtn.onclick = () => {
            if (this.selectedTopics.size === this.topicsMap.size) this.selectedTopics.clear();
            else this.topicsMap.forEach((_, topicName) => this.selectedTopics.add(topicName));
            this.render();
        };

        const addWordBtn = bottomBox.createEl('button', { text: '+ Add Card' });
        addWordBtn.style.minHeight = '38px';
        addWordBtn.onclick = () => {
            new AddWordModal(this.app, this.plugin, this.allCards, async () => {
                const pluginAny = this.plugin as any;
                if (typeof pluginAny.loadCardsFromActiveFile === 'function') {
                    this.allCards = await pluginAny.loadCardsFromActiveFile();
                }
                this.updateTopicsMap();
                this.render();
            }).open();
        };

        const startBtn = bottomBox.createEl('button', { text: 'Start Practice', cls: 'mod-cta' });
        startBtn.style.flex = '1';
        startBtn.style.minHeight = '38px';
        startBtn.onclick = () => {
            const availableCards = this.getFilteredCards();
            let filteredCards = availableCards.filter(c => this.selectedTopics.has(c.topic));

            if (filteredCards.length === 0) {
                new Notice('Please select at least one topic and ensure cards exist!');
                return;
            }
            if (this.isRandomOrder) {
                filteredCards = this.shuffleArray(filteredCards);
            }
            this.close();
            new CardStudyModal(this.app, filteredCards, this.allCards, this.studyMode, this.cardOrderMode, this.plugin).open();
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

export class AddWordModal extends Modal {
    plugin: KlomimoryPlugin;
    allCards: WordCard[];
    onWordAdded?: () => void;
    cardType: CardType = 'word';

    constructor(app: App, plugin: KlomimoryPlugin, allCards: WordCard[], onWordAdded?: () => void) {
        super(app);
        this.plugin = plugin;
        this.allCards = allCards;
        this.onWordAdded = onWordAdded;
    }

    onOpen() {
        this.render();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('klomimory-modal-content');

        contentEl.createEl('h2', { text: 'Add New Card' }).style.marginBottom = '15px';

        const typeToggle = contentEl.createEl('div');
        typeToggle.style.display = 'flex';
        typeToggle.style.gap = '8px';
        typeToggle.style.marginBottom = '15px';

        const wordTab = typeToggle.createEl('button', { text: 'Word' });
        wordTab.style.flex = '1';
        wordTab.style.minHeight = '36px';
        if (this.cardType === 'word') wordTab.classList.add('mod-cta');
        wordTab.onclick = () => { this.cardType = 'word'; this.render(); };

        const qaTab = typeToggle.createEl('button', { text: 'Question / Term' });
        qaTab.style.flex = '1';
        qaTab.style.minHeight = '36px';
        if (this.cardType === 'qa') qaTab.classList.add('mod-cta');
        qaTab.onclick = () => { this.cardType = 'qa'; this.render(); };

        const firstLabel = this.cardType === 'word' ? 'Word:' : 'Question / Term:';
        const firstPlaceholder = this.cardType === 'word' ? 'Enter word...' : 'Enter question or term...';
        const secondLabel = this.cardType === 'word' ? 'Translation:' : 'Answer / Definition:';
        const secondPlaceholder = this.cardType === 'word' ? 'Enter translation...' : 'Enter answer or definition...';

        const createLabel = (text: string) => {
            const el = contentEl.createEl('div', { text });
            el.style.fontSize = '0.85em';
            el.style.fontWeight = 'bold';
            el.style.marginBottom = '4px';
            return el;
        };

        createLabel(firstLabel);
        const firstInput = contentEl.createEl('input', { type: 'text', placeholder: firstPlaceholder });
        firstInput.style.width = '100%';
        firstInput.style.boxSizing = 'border-box';
        firstInput.style.marginBottom = '12px';

        let transInput: HTMLInputElement | null = null;
        if (this.cardType === 'word') {
            createLabel('Transcription (optional):');
            transInput = contentEl.createEl('input', { type: 'text', placeholder: 'Enter transcription...' });
            transInput.style.width = '100%';
            transInput.style.boxSizing = 'border-box';
            transInput.style.marginBottom = '12px';
        }

        createLabel(secondLabel);
        const secondInput = contentEl.createEl('input', { type: 'text', placeholder: secondPlaceholder });
        secondInput.style.width = '100%';
        secondInput.style.boxSizing = 'border-box';
        secondInput.style.marginBottom = '12px';

        createLabel('Topic (Header):');

        const uniqueTopics = Array.from(new Set(this.allCards.map(c => c.topic)));

        const topicSelect = contentEl.createEl('select');
        topicSelect.style.width = '100%';
        topicSelect.style.boxSizing = 'border-box';
        topicSelect.style.marginBottom = '8px';

        uniqueTopics.forEach(t => {
            topicSelect.createEl('option', { text: t, value: t });
        });
        topicSelect.createEl('option', { text: '-- Create New Topic Header --', value: '__new__' });

        const newTopicInput = contentEl.createEl('input', { type: 'text', placeholder: 'Enter new topic name...' });
        newTopicInput.style.width = '100%';
        newTopicInput.style.boxSizing = 'border-box';
        newTopicInput.style.marginBottom = '20px';
        newTopicInput.style.display = uniqueTopics.length === 0 ? 'block' : 'none';
        if (uniqueTopics.length === 0) {
            topicSelect.value = '__new__';
            topicSelect.style.display = 'none';
        }

        topicSelect.onchange = () => {
            if (topicSelect.value === '__new__') {
                newTopicInput.style.display = 'block';
            } else {
                newTopicInput.style.display = 'none';
            }
        };

        const saveBtn = contentEl.createEl('button', { text: 'Save Card to File', cls: 'mod-cta' });
        saveBtn.style.width = '100%';
        saveBtn.style.minHeight = '40px';
        saveBtn.onclick = async () => {
            const val1 = firstInput.value.trim();
            const val2 = secondInput.value.trim();
            const transcription = transInput ? transInput.value.trim() : '';
            const selectedTopicValue = topicSelect.style.display === 'none' ? '__new__' : topicSelect.value;
            let topic = selectedTopicValue === '__new__' ? newTopicInput.value.trim() : selectedTopicValue;

            if (!val1 || !val2 || !topic) {
                new Notice('Please fill in all required fields!');
                return;
            }

            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('No active file found to append the card!');
                return;
            }

            await this.app.vault.process(activeFile, (content) => {
                const lines = content.split('\n');
                let headerIndex = -1;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('#')) {
                        const headerText = line.replace(/^#+\s*/, '').trim();
                        if (headerText.toLowerCase() === topic.toLowerCase()) {
                            headerIndex = i;
                            break;
                        }
                    }
                }

                let formattedLine = this.cardType === 'word'
                    ? (transcription ? `- ${val1} - [${transcription}] - ${val2}` : `- ${val1} - ${val2}`)
                    : `${val1} :: ${val2}`;

                if (headerIndex !== -1) {
                    let nextHeaderIdx = headerIndex + 1;
                    while (nextHeaderIdx < lines.length && !lines[nextHeaderIdx].trim().startsWith('#')) {
                        nextHeaderIdx++;
                    }

                    let lastContentIdx = nextHeaderIdx - 1;
                    while (lastContentIdx > headerIndex && lines[lastContentIdx].trim() === '') {
                        lastContentIdx--;
                    }

                    if (lastContentIdx === headerIndex) {
                        lines.splice(headerIndex + 1, 0, formattedLine);
                    } else {
                        lines.splice(lastContentIdx + 1, 0, formattedLine);
                    }
                } else {
                    const targetHeader = `## ${topic}`;
                    lines.push('', targetHeader, formattedLine);
                }

                return lines.join('\n');
            });

            new Notice(`Successfully added card under "${topic}"!`);
            this.close();
            if (this.onWordAdded) {
                this.onWordAdded();
            }
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

export class CardStudyModal extends Modal {
    cardsQueue: WordCard[];
    allCards: WordCard[];
    studyMode: StudyMode;
    cardOrderMode: CardOrderMode;
    plugin: KlomimoryPlugin;
    currentIndex: number = 0;
    totalInitialCount: number;
    showTranslation: boolean = false;

    private failedInThisSession: Set<string> = new Set();

    constructor(
        app: App,
        cards: WordCard[],
        allCards: WordCard[],
        mode: StudyMode,
        cardOrderMode: CardOrderMode,
        plugin: KlomimoryPlugin
    ) {
        super(app);
        this.cardsQueue = [...cards];
        this.totalInitialCount = cards.length;
        this.allCards = allCards;
        this.studyMode = mode;
        this.cardOrderMode = cardOrderMode;
        this.plugin = plugin;
    }

    onOpen() {
        window.addEventListener('keydown', this.handleKeyPress);
        this.renderCard();
    }

    onClose() {
        window.removeEventListener('keydown', this.handleKeyPress);
        this.contentEl.empty();
    }

    private finishAndReturnToTopics = async () => {
        await this.plugin.saveSettings();
        this.close();
        new TopicSelectionModal(this.app, this.allCards, this.plugin).open();
    };

    private handleKeyPress = async (evt: KeyboardEvent) => {
        if (evt.target instanceof HTMLInputElement || evt.target instanceof HTMLTextAreaElement) return;

        if ((this.studyMode === 'repetition' && this.cardsQueue.length === 0) ||
            (this.studyMode === 'classic' && this.currentIndex >= this.cardsQueue.length)) {
            if (evt.code === 'Space' || evt.code === 'Enter') {
                evt.preventDefault();
                await this.finishAndReturnToTopics();
            }
            return;
        }

        if (!this.showTranslation) {
            if (evt.code === 'Space' || evt.code === 'Enter') {
                evt.preventDefault();
                this.showTranslation = true;
                this.renderCard();
            }
            return;
        }

        if (this.studyMode === 'repetition') {
            if (evt.key === '1') {
                evt.preventDefault();
                await this.handleAgain();
            } else if (evt.key === '2') {
                evt.preventDefault();
                await this.handleHard();
            } else if (evt.key === '3' || evt.code === 'Space' || evt.code === 'Enter') {
                evt.preventDefault();
                await this.handleGood();
            }
        } else {
            if (evt.code === 'ArrowRight' || evt.code === 'Space' || evt.code === 'Enter') {
                evt.preventDefault();
                this.handleClassicNext();
            } else if (evt.code === 'ArrowLeft') {
                evt.preventDefault();
                this.handleClassicPrev();
            }
        }
    };

    private getCardDisplayContent(card: WordCard): {
        frontText: string;
        frontSubText?: string;
        backText: string;
        backSubText?: string;
        cardType: CardType;
    } {
        const cardType = card.type || 'word';
        let showWordFirst = true;

        if (this.cardOrderMode === 'translation-first') {
            showWordFirst = false;
        } else if (this.cardOrderMode === 'random') {
            if ((card as any)._isWordFront === undefined) {
                (card as any)._isWordFront = Math.random() < 0.5;
            }
            showWordFirst = (card as any)._isWordFront;
        }

        if (showWordFirst) {
            return {
                frontText: card.word,
                frontSubText: (cardType === 'word' && card.transcription) ? `[${card.transcription}]` : undefined,
                backText: card.translation,
                cardType
            };
        } else {
            return {
                frontText: card.translation,
                backText: card.word,
                backSubText: (cardType === 'word' && card.transcription) ? `[${card.transcription}]` : undefined,
                cardType
            };
        }
    }

    async handleAgain() {
        const failedCard = this.cardsQueue.shift()!;

        if (typeof (this.plugin as any).recordMistake === 'function') {
            await (this.plugin as any).recordMistake(failedCard, 'again');
        }
        if (typeof (this.plugin as any).logActivity === 'function') {
            await (this.plugin as any).logActivity(true);
        }
        if (typeof (this.plugin as any).addFailedWord === 'function') {
            await (this.plugin as any).addFailedWord(failedCard);
        }

        const cardId = `${failedCard.topic}-${failedCard.word}`;
        this.failedInThisSession.add(cardId);

        this.cardsQueue.push(failedCard);
        this.showTranslation = false;
        this.renderCard();
    }

    async handleHard() {
        const hardCard = this.cardsQueue.shift()!;

        if (typeof (this.plugin as any).recordMistake === 'function') {
            await (this.plugin as any).recordMistake(hardCard, 'hard');
        }
        if (typeof (this.plugin as any).addFailedWord === 'function') {
            await (this.plugin as any).addFailedWord(hardCard);
        }

        if (this.cardsQueue.length > 2) {
            this.cardsQueue.splice(2, 0, hardCard);
        } else {
            this.cardsQueue.push(hardCard);
        }
        this.showTranslation = false;
        this.renderCard();
    }

    async handleGood() {
        const currentCard = this.cardsQueue.shift()!;
        const cardId = `${currentCard.topic}-${currentCard.word}`;

        if (typeof (this.plugin as any).logActivity === 'function') {
            await (this.plugin as any).logActivity(false);
        }

        if (this.studyMode === 'repetition') {
            if (!this.failedInThisSession.has(cardId) && typeof (this.plugin as any).removeFailedWord === 'function') {
                await (this.plugin as any).removeFailedWord(currentCard);
            }
        }

        this.showTranslation = false;
        this.renderCard();
    }

    handleClassicNext() {
        if (this.currentIndex < this.cardsQueue.length - 1) {
            this.currentIndex++;
            this.showTranslation = false;
            this.renderCard();
        } else {
            this.currentIndex++;
            this.renderCompletionScreen();
        }
    }

    handleClassicPrev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showTranslation = false;
            this.renderCard();
        }
    }

    renderCard() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('klomimory-modal-content');

        if (this.studyMode === 'repetition' && this.cardsQueue.length === 0) {
            this.renderCompletionScreen();
            return;
        }

        const currentCard = this.studyMode === 'repetition'
            ? this.cardsQueue[0]
            : this.cardsQueue[this.currentIndex];

        const cardContent = this.getCardDisplayContent(currentCard);

        const topBar = contentEl.createEl('div', { cls: 'klomimory-study-topbar' });
        topBar.style.display = 'flex';
        topBar.style.flexDirection = 'column';
        topBar.style.alignItems = 'flex-start';
        topBar.style.gap = '8px';
        topBar.style.marginBottom = '15px';

        const backToTopicsBtn = topBar.createEl('button', { cls: 'klomimory-home-btn' });
        backToTopicsBtn.style.display = 'inline-flex';
        backToTopicsBtn.style.alignItems = 'center';
        backToTopicsBtn.style.gap = '6px';
        backToTopicsBtn.style.minHeight = '32px';

        const iconSpan = backToTopicsBtn.createSpan();
        setIcon(iconSpan, 'home');
        backToTopicsBtn.createSpan({ text: 'Topics' });
        backToTopicsBtn.onclick = async () => await this.finishAndReturnToTopics();

        const metaInfo = topBar.createEl('div');
        metaInfo.style.display = 'flex';
        metaInfo.style.flexDirection = 'column';
        metaInfo.style.gap = '2px';
        metaInfo.createEl('div', { text: currentCard.topic, cls: 'klomimory-study-topic' }).style.fontWeight = 'bold';

        const counterStr = this.studyMode === 'repetition'
            ? `Remaining in queue: ${this.cardsQueue.length}`
            : `${this.currentIndex + 1} / ${this.cardsQueue.length}`;
        metaInfo.createEl('div', { text: counterStr, cls: 'klomimory-study-counter' }).style.color = 'var(--text-muted)';

        const cardBox = contentEl.createEl('div', { cls: 'klomimory-study-card' });
        cardBox.style.display = 'flex';
        cardBox.style.flexDirection = 'column';
        cardBox.style.alignItems = 'center';
        cardBox.style.padding = '25px 15px';
        cardBox.style.margin = '10px 0 20px 0';
        cardBox.style.backgroundColor = 'var(--background-secondary)';
        cardBox.style.borderRadius = '12px';
        cardBox.style.textAlign = 'center';
        cardBox.style.wordBreak = 'break-word';
        cardBox.style.boxSizing = 'border-box';

        const wordEl = cardBox.createEl('h1', { text: cardContent.frontText, cls: 'klomimory-study-word' });
        wordEl.style.fontSize = cardContent.cardType === 'qa' ? '1.4em' : '2em';
        wordEl.style.margin = '0 0 8px 0';

        if (cardContent.frontSubText) {
            const transEl = cardBox.createEl('div', { text: cardContent.frontSubText });
            transEl.style.fontSize = '1.1em';
            transEl.style.color = 'var(--text-accent)';
        }

        if (this.showTranslation) {
            const hr = cardBox.createEl('hr');
            hr.style.width = '60%';
            hr.style.margin = '15px 0 12px 0';

            const translationEl = cardBox.createEl('h2', { text: cardContent.backText });
            translationEl.style.fontSize = cardContent.cardType === 'qa' ? '1.1em' : '1.5em';
            translationEl.style.margin = '0';
            translationEl.style.color = 'var(--interactive-accent)';

            if (cardContent.backSubText) {
                const backTransEl = cardBox.createEl('div', { text: cardContent.backSubText });
                backTransEl.style.fontSize = '1em';
                backTransEl.style.color = 'var(--text-accent)';
                backTransEl.style.marginTop = '6px';
            }
        }

        const navBox = contentEl.createEl('div', { cls: 'klomimory-study-nav' });
        navBox.style.display = 'flex';
        navBox.style.justifyContent = 'center';
        navBox.style.gap = '8px';
        navBox.style.flexWrap = 'wrap';

        if (!this.showTranslation) {
            const showBtn = navBox.createEl('button', { text: 'Show Answer (Space)', cls: 'mod-cta' });
            showBtn.style.width = '100%';
            showBtn.style.minHeight = '44px';
            showBtn.onclick = () => { this.showTranslation = true; this.renderCard(); };
        } else {
            if (this.studyMode === 'repetition') {
                const againBtn = navBox.createEl('button', { text: 'Again (1)' });
                againBtn.style.flex = '1';
                againBtn.style.minHeight = '40px';
                againBtn.style.backgroundColor = 'var(--text-error)';
                againBtn.style.color = '#fff';
                againBtn.onclick = async () => await this.handleAgain();

                const hardBtn = navBox.createEl('button', { text: 'Hard (2)' });
                hardBtn.style.flex = '1';
                hardBtn.style.minHeight = '40px';
                hardBtn.style.backgroundColor = 'var(--text-warning)';
                hardBtn.style.color = '#fff';
                hardBtn.onclick = async () => await this.handleHard();

                const goodBtn = navBox.createEl('button', { text: 'Good (3)' });
                goodBtn.style.flex = '1';
                goodBtn.style.minHeight = '40px';
                goodBtn.style.backgroundColor = 'var(--text-success)';
                goodBtn.style.color = '#fff';
                goodBtn.onclick = async () => await this.handleGood();
            } else {
                if (this.currentIndex > 0) {
                    const prevBtn = navBox.createEl('button', { text: '← Back' });
                    prevBtn.style.minHeight = '40px';
                    prevBtn.onclick = () => this.handleClassicPrev();
                }
                if (this.currentIndex < this.cardsQueue.length - 1) {
                    const nextBtn = navBox.createEl('button', { text: 'Next →', cls: 'mod-cta' });
                    nextBtn.style.flex = '1';
                    nextBtn.style.minHeight = '40px';
                    nextBtn.onclick = () => this.handleClassicNext();
                } else {
                    const finishBtn = navBox.createEl('button', { text: 'Finish', cls: 'mod-cta' });
                    finishBtn.style.flex = '1';
                    finishBtn.style.minHeight = '40px';
                    finishBtn.onclick = () => this.renderCompletionScreen();
                }
            }
        }
    }

    renderCompletionScreen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('klomimory-modal-content');

        const box = contentEl.createEl('div');
        box.style.textAlign = 'center';
        box.style.padding = '30px 15px';

        box.createEl('h2', { text: 'Session Complete!' });
        box.createEl('p', { text: `You reviewed all ${this.totalInitialCount} items in this session.` }).style.color = 'var(--text-muted)';

        const closeBtn = box.createEl('button', { text: 'Back to Topics', cls: 'mod-cta' });
        closeBtn.style.width = '100%';
        closeBtn.style.minHeight = '42px';
        closeBtn.style.marginTop = '15px';
        closeBtn.onclick = async () => await this.finishAndReturnToTopics();
    }
}
