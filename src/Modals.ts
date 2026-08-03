import { App, Modal, setIcon, Notice } from 'obsidian';
import { WordCard, StudyMode, CardOrderMode } from './types';
import type KlomimoryPlugin from './main';

export class TopicSelectionModal extends Modal {
    allCards: WordCard[];
    plugin: KlomimoryPlugin;
    topicsMap: Map<string, WordCard[]> = new Map();
    selectedTopics: Set<string> = new Set();
    filterType: 'all' | 'with' | 'without' = 'all';
    isRandomOrder: boolean = false;
    studyMode: StudyMode = 'repetition';
    cardOrderMode: CardOrderMode = 'word-first';

    constructor(app: App, cards: WordCard[], plugin: KlomimoryPlugin) {
        super(app);
        this.allCards = cards;
        this.plugin = plugin;
        this.cardOrderMode = plugin.settings.cardOrderMode || 'word-first';
        this.updateTopicsMap();
    }

    getFilteredCards(): WordCard[] {
        return this.allCards.filter(card => {
            if (this.filterType === 'with') return !!card.transcription;
            if (this.filterType === 'without') return !card.transcription;
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
            [shuffled[i], shuffled[j]] = [shuffled[i], shuffled[j]];
        }
        return shuffled;
    }

    onOpen() {
        this.render();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        
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
            hardBox.style.alignItems = 'center';
            hardBox.style.justifyContent = 'space-between';

            const infoDiv = hardBox.createEl('div');
            const hardTitle = infoDiv.createEl('div', { text: 'Hard Words Vault (Queue)' });
            hardTitle.style.fontWeight = 'bold';
            hardTitle.style.fontSize = '0.95em';

            const hardDesc = infoDiv.createEl('div', { text: `${hardWordsCount} word(s) waiting to be cleared` });
            hardDesc.style.color = 'var(--text-muted)';
            hardDesc.style.fontSize = '0.8em';

            const practiceBtn = hardBox.createEl('button', { text: 'Practice Queue' });
            practiceBtn.style.backgroundColor = 'var(--text-error)';
            practiceBtn.style.color = '#fff';
            practiceBtn.style.fontSize = '0.85em';
            practiceBtn.onclick = () => {
                let hardCards = [...this.plugin.settings.failedWords];
                if (this.isRandomOrder) {
                    hardCards = this.shuffleArray(hardCards);
                }
                this.close();
                new CardStudyModal(this.app, hardCards, this.allCards, 'repetition', this.cardOrderMode, this.plugin).open();
            };
        }

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
        if (this.studyMode === 'repetition') repBtn.classList.add('mod-cta');
        repBtn.onclick = () => { this.studyMode = 'repetition'; this.render(); };

        const classicBtn = modeBox.createEl('button', { text: 'Classic View' });
        classicBtn.style.flex = '1';
        if (this.studyMode === 'classic') classicBtn.classList.add('mod-cta');
        classicBtn.onclick = () => { this.studyMode = 'classic'; this.render(); };

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

        const wordFirstBtn = dirBox.createEl('button', { text: 'Word → Trans.' });
        wordFirstBtn.style.flex = '1';
        wordFirstBtn.style.fontSize = '0.85em';
        if (this.cardOrderMode === 'word-first') wordFirstBtn.classList.add('mod-cta');
        wordFirstBtn.onclick = async () => {
            this.cardOrderMode = 'word-first';
            this.plugin.settings.cardOrderMode = 'word-first';
            await this.plugin.saveSettings();
            this.render();
        };

        const transFirstBtn = dirBox.createEl('button', { text: 'Trans. → Word' });
        transFirstBtn.style.flex = '1';
        transFirstBtn.style.fontSize = '0.85em';
        if (this.cardOrderMode === 'translation-first') transFirstBtn.classList.add('mod-cta');
        transFirstBtn.onclick = async () => {
            this.cardOrderMode = 'translation-first';
            this.plugin.settings.cardOrderMode = 'translation-first';
            await this.plugin.saveSettings();
            this.render();
        };

        const randomSideBtn = dirBox.createEl('button', { text: 'Random Side' });
        randomSideBtn.style.flex = '1';
        randomSideBtn.style.fontSize = '0.85em';
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
        controlsRow.style.gap = '10px';
        controlsRow.style.marginBottom = '15px';
        controlsRow.style.flexWrap = 'wrap';

        const filterBox = controlsRow.createEl('div');
        filterBox.style.display = 'flex';
        filterBox.style.gap = '4px';

        const filterOptions: { label: string; value: 'all' | 'with' | 'without' }[] = [
            { label: 'All', value: 'all' },
            { label: 'With Trans.', value: 'with' },
            { label: 'No Trans.', value: 'without' }
        ];

        filterOptions.forEach(opt => {
            const btn = filterBox.createEl('button', { text: opt.label });
            btn.style.fontSize = '0.8em';
            btn.style.padding = '4px 8px';
            if (this.filterType === opt.value) btn.classList.add('mod-cta');
            btn.onclick = () => {
                this.filterType = opt.value;
                this.updateTopicsMap();
                this.render();
            };
        });

        const orderBox = controlsRow.createEl('div');
        orderBox.style.display = 'flex';
        orderBox.style.gap = '4px';

        const inOrderBtn = orderBox.createEl('button', { text: 'Order' });
        if (!this.isRandomOrder) inOrderBtn.classList.add('mod-cta');
        inOrderBtn.onclick = () => { this.isRandomOrder = false; this.render(); };

        const randomBtn = orderBox.createEl('button', { text: 'Random' });
        if (this.isRandomOrder) randomBtn.classList.add('mod-cta');
        randomBtn.onclick = () => { this.isRandomOrder = true; this.render(); };

        const topicsContainer = contentEl.createEl('div', { cls: 'klomimory-topics-list' });
        topicsContainer.style.maxHeight = '180px';
        topicsContainer.style.overflowY = 'auto';
        topicsContainer.style.marginBottom = '15px';

        this.topicsMap.forEach((topicCards, topicName) => {
            const row = topicsContainer.createEl('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.padding = '6px 4px';

            const leftGroup = row.createEl('label');
            leftGroup.style.display = 'flex';
            leftGroup.style.alignItems = 'center';
            leftGroup.style.gap = '8px';

            const checkbox = leftGroup.createEl('input', { type: 'checkbox' });
            checkbox.checked = this.selectedTopics.has(topicName);
            checkbox.onchange = (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                if (checked) this.selectedTopics.add(topicName);
                else this.selectedTopics.delete(topicName);
            };
            leftGroup.createSpan({ text: topicName });

            const countSpan = row.createSpan({ text: `${topicCards.length} words` });
            countSpan.style.color = 'var(--text-muted)';
            countSpan.style.fontSize = '0.8em';
        });

        const bottomBox = contentEl.createEl('div');
        bottomBox.style.display = 'flex';
        bottomBox.style.gap = '10px';

        const toggleAllBtn = bottomBox.createEl('button', { text: 'Toggle All' });
        toggleAllBtn.onclick = () => {
            if (this.selectedTopics.size === this.topicsMap.size) this.selectedTopics.clear();
            else this.topicsMap.forEach((_, topicName) => this.selectedTopics.add(topicName));
            this.render();
        };

        const startBtn = bottomBox.createEl('button', { text: 'Start Practice', cls: 'mod-cta' });
        startBtn.style.flex = '1';
        startBtn.onclick = () => {
            const availableCards = this.getFilteredCards();
            let filteredCards = availableCards.filter(c => this.selectedTopics.has(c.topic));
            
            if (filteredCards.length === 0) {
                new Notice('Please select at least one topic!');
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
        backSubText?: string 
    } {
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
                frontSubText: card.transcription ? `[${card.transcription}]` : undefined,
                backText: card.translation
            };
        } else {
            return {
                frontText: card.translation,
                backText: card.word,
                backSubText: card.transcription ? `[${card.transcription}]` : undefined
            };
        }
    }

    async handleAgain() {
        const failedCard = this.cardsQueue.shift()!;
        
        await this.plugin.recordMistake(failedCard, 'again');
        await this.plugin.logActivity(true); 
        await this.plugin.addFailedWord(failedCard);
        
        const cardId = `${failedCard.topic}-${failedCard.word}`;
        this.failedInThisSession.add(cardId);
        
        this.cardsQueue.push(failedCard);
        this.showTranslation = false;
        this.renderCard();
    }

    async handleHard() {
        const hardCard = this.cardsQueue.shift()!;
        
        await this.plugin.recordMistake(hardCard, 'hard');
        await this.plugin.addFailedWord(hardCard);

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

        await this.plugin.logActivity(false); 

        if (this.studyMode === 'repetition') {
            if (!this.failedInThisSession.has(cardId)) {
                await this.plugin.removeFailedWord(currentCard);
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
        topBar.style.marginBottom = '20px';

        const backToTopicsBtn = topBar.createEl('button', { cls: 'klomimory-home-btn' });
        backToTopicsBtn.style.display = 'inline-flex';
        backToTopicsBtn.style.alignItems = 'center';
        backToTopicsBtn.style.gap = '6px';
        
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
        cardBox.style.padding = '35px 20px';
        cardBox.style.margin = '15px 0 25px 0';
        cardBox.style.backgroundColor = 'var(--background-secondary)';
        cardBox.style.borderRadius = '12px';
        cardBox.style.textAlign = 'center';
        cardBox.style.wordBreak = 'break-word';

        const wordEl = cardBox.createEl('h1', { text: cardContent.frontText, cls: 'klomimory-study-word' });
        wordEl.style.fontSize = '2.4em';
        wordEl.style.margin = '0 0 8px 0';

        if (cardContent.frontSubText) {
            const transEl = cardBox.createEl('div', { text: cardContent.frontSubText });
            transEl.style.fontSize = '1.2em';
            transEl.style.color = 'var(--text-accent)';
        }

        if (this.showTranslation) {
            const hr = cardBox.createEl('hr');
            hr.style.width = '60%';
            hr.style.margin = '20px 0 15px 0';

            const translationEl = cardBox.createEl('h2', { text: cardContent.backText });
            translationEl.style.fontSize = '1.7em';
            translationEl.style.margin = '0';
            translationEl.style.color = 'var(--interactive-accent)';

            if (cardContent.backSubText) {
                const backTransEl = cardBox.createEl('div', { text: cardContent.backSubText });
                backTransEl.style.fontSize = '1.1em';
                backTransEl.style.color = 'var(--text-accent)';
                backTransEl.style.marginTop = '6px';
            }
        }

        const navBox = contentEl.createEl('div', { cls: 'klomimory-study-nav' });
        navBox.style.display = 'flex';
        navBox.style.justifyContent = 'center';
        navBox.style.gap = '12px';

        if (!this.showTranslation) {
            const showBtn = navBox.createEl('button', { text: 'Show Answer (Space)', cls: 'mod-cta' });
            showBtn.onclick = () => { this.showTranslation = true; this.renderCard(); };
        } else {
            if (this.studyMode === 'repetition') {
                const againBtn = navBox.createEl('button', { text: 'Again (1)' });
                againBtn.style.backgroundColor = 'var(--text-error)';
                againBtn.style.color = '#fff';
                againBtn.onclick = async () => await this.handleAgain();

                const hardBtn = navBox.createEl('button', { text: 'Hard (2)' });
                hardBtn.style.backgroundColor = 'var(--text-warning)';
                hardBtn.style.color = '#fff';
                hardBtn.onclick = async () => await this.handleHard();

                const goodBtn = navBox.createEl('button', { text: 'Good (3 / Space)' });
                goodBtn.style.backgroundColor = 'var(--text-success)';
                goodBtn.style.color = '#fff';
                goodBtn.onclick = async () => await this.handleGood();
            } else {
                if (this.currentIndex > 0) {
                    const prevBtn = navBox.createEl('button', { text: '← Back (←)' });
                    prevBtn.onclick = () => this.handleClassicPrev();
                }
                if (this.currentIndex < this.cardsQueue.length - 1) {
                    const nextBtn = navBox.createEl('button', { text: 'Next → (→ / Space)', cls: 'mod-cta' });
                    nextBtn.onclick = () => this.handleClassicNext();
                } else {
                    const finishBtn = navBox.createEl('button', { text: 'Finish (Space)', cls: 'mod-cta' });
                    finishBtn.onclick = () => this.renderCompletionScreen();
                }
            }
        }
    }

    renderCompletionScreen() {
        const { contentEl } = this;
        contentEl.empty();

        const box = contentEl.createEl('div');
        box.style.textAlign = 'center';
        box.style.padding = '40px 20px';

        box.createEl('h2', { text: 'Session Complete!' });
        box.createEl('p', { text: `You reviewed all ${this.totalInitialCount} words in this session.` }).style.color = 'var(--text-muted)';

        const closeBtn = box.createEl('button', { text: 'Back to Topics (Space)', cls: 'mod-cta' });
        closeBtn.onclick = async () => await this.finishAndReturnToTopics();
    }
}