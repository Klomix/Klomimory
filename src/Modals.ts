import {
    App, Modal, setIcon, Notice, Component, MarkdownRenderer, FuzzySuggestModal, TFile, normalizePath
} from 'obsidian';
import { WordCard, StudyMode, CardOrderMode, CardType, ProgressSnapshot } from './types';
import { CardFields, normalizeTermMarkdown, serializeCard, validateCardFields } from './cardFormat';
import type KlomimoryPlugin from './main';

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

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'];

type TextField = HTMLInputElement | HTMLTextAreaElement;

class ImagePickerModal extends FuzzySuggestModal<TFile> {
    private onPick: (file: TFile) => void;

    constructor(app: App, onPick: (file: TFile) => void) {
        super(app);
        this.onPick = onPick;
        this.setPlaceholder('Choose an image from the vault...');
    }

    getItems(): TFile[] {
        return this.app.vault.getFiles().filter(f => IMAGE_EXTS.includes(f.extension.toLowerCase()));
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile): void {
        this.onPick(item);
    }
}

function insertAtCursor(el: TextField, text: string) {
    el.focus();
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.setRangeText(text, start, end, 'end');
    el.dispatchEvent(new Event('input'));
}

/** Сохраняет картинку из буфера обмена в хранилище (в папку вложений Obsidian) и возвращает embed-ссылку. */
async function savePastedImage(app: App, blob: File, sourcePath: string): Promise<string> {
    const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const name = `Klomimory image ${Date.now()}.${ext}`;

    const fm = app.fileManager as any;
    const path: string = typeof fm.getAvailablePathForAttachment === 'function'
        ? await fm.getAvailablePathForAttachment(name, sourcePath)
        : normalizePath(name);

    const created = await app.vault.createBinary(path, await blob.arrayBuffer());
    return `![[${app.metadataCache.fileToLinktext(created, sourcePath)}]]`;
}

function addImageTools(app: App, parent: HTMLElement, fields: TextField[], getSourcePath: () => string) {
    let target: TextField = fields[fields.length - 1];
    fields.forEach(f => f.addEventListener('focus', () => { target = f; }));

    const row = parent.createEl('div', { cls: 'klomimory-image-tools' });
    const btn = row.createEl('button', { text: '🖼 Insert image' });
    btn.onclick = (e) => {
        e.preventDefault();
        new ImagePickerModal(app, (file) => {
            const link = `![[${app.metadataCache.fileToLinktext(file, getSourcePath())}]]`;
            insertAtCursor(target, link);
        }).open();
    };
    row.createEl('span', { text: 'or paste an image (Ctrl/Cmd+V)', cls: 'klomimory-hint' });

    fields.forEach(field => {
        field.addEventListener('paste', (evt: Event) => {
            const e = evt as ClipboardEvent;
            const items = Array.from(e.clipboardData?.items ?? []);
            const imageItem = items.find(i => i.kind === 'file' && i.type.startsWith('image/'));
            const file = imageItem?.getAsFile();
            if (!file) return;

            e.preventDefault();
            savePastedImage(app, file, getSourcePath())
                .then(link => insertAtCursor(field, link))
                .catch(err => {
                    console.error('Klomimory: failed to save pasted image', err);
                    new Notice('Could not save the pasted image.');
                });
        });
    });
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

        const isQa = this.cardType === 'qa';
        const firstLabel = isQa ? 'Question / Term:' : 'Word:';
        const firstPlaceholder = isQa ? 'Enter question or term...' : 'Enter word...';
        const secondLabel = isQa ? 'Answer / Definition:' : 'Translation:';
        const secondPlaceholder = isQa
            ? 'Enter answer or definition...\n- extra lines belong to the answer\n- markdown and images are supported'
            : 'Enter translation...';

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
        if (!isQa) {
            createLabel('Transcription (optional):');
            transInput = contentEl.createEl('input', { type: 'text', placeholder: 'Enter transcription...' });
            transInput.style.width = '100%';
            transInput.style.boxSizing = 'border-box';
            transInput.style.marginBottom = '12px';
        }

        createLabel(secondLabel);
        let secondInput: TextField;
        if (isQa) {
            const area = contentEl.createEl('textarea', { placeholder: secondPlaceholder });
            area.rows = 5;
            area.style.width = '100%';
            area.style.boxSizing = 'border-box';
            area.style.marginBottom = '8px';
            area.style.resize = 'vertical';
            secondInput = area;
        } else {
            const inp = contentEl.createEl('input', { type: 'text', placeholder: secondPlaceholder });
            inp.style.width = '100%';
            inp.style.boxSizing = 'border-box';
            inp.style.marginBottom = '12px';
            secondInput = inp;
        }

        if (isQa) {
            addImageTools(
                this.app,
                contentEl,
                [firstInput, secondInput],
                () => this.app.workspace.getActiveFile()?.path ?? ''
            );
        }

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
            const val2 = isQa ? secondInput.value : secondInput.value.trim();
            const transcription = transInput ? transInput.value.trim().replace(/^\[|\]$/g, '').trim() : '';
            const selectedTopicValue = topicSelect.style.display === 'none' ? '__new__' : topicSelect.value;
            let topic = selectedTopicValue === '__new__' ? newTopicInput.value.trim() : selectedTopicValue;

            if (!val1 || !val2.trim() || !topic) {
                new Notice('Please fill in all required fields!');
                return;
            }

            const validationError = validateCardFields(this.cardType, { word: val1, translation: val2 });
            if (validationError) {
                new Notice(validationError);
                return;
            }

            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('No active file found to append the card!');
                return;
            }

            const formattedLine = isQa
                ? serializeCard({ word: '', translation: '', topic, type: 'qa' }, { word: val1, translation: val2 })
                : (transcription ? `- ${val1} - [${transcription}] - ${val2}` : `- ${val1} - ${val2}`);

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

interface UndoEntry {
    queue: WordCard[];
    failedInSession: string[];
    progress: ProgressSnapshot;
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
    private history: UndoEntry[] = [];
    private isEditing = false;
    private busy = false;
    private mdComponent = new Component();

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
        this.mdComponent.load();
        window.addEventListener('keydown', this.handleKeyPress);
        this.renderCard();
    }

    onClose() {
        window.removeEventListener('keydown', this.handleKeyPress);
        this.mdComponent.unload();
        this.contentEl.empty();
    }

    private finishAndReturnToTopics = async () => {
        await this.plugin.saveSettings();
        this.close();
        new TopicSelectionModal(this.app, this.allCards, this.plugin).open();
    };

  private handleKeyPress = async (evt: KeyboardEvent) => {
        if (this.isEditing) return;

        const target = evt.target as HTMLElement | null;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
        if (evt.repeat || evt.ctrlKey || evt.metaKey || evt.altKey) return;

        const isNext = evt.code === 'Space' || evt.code === 'Enter' || evt.code === 'ArrowRight';

        if (evt.code === 'ArrowLeft') {
            evt.preventDefault();
            await this.handleBack();
            return;
        }

        if (this.isFinished()) {
            if (evt.code === 'Space' || evt.code === 'Enter') {
                evt.preventDefault();
                await this.finishAndReturnToTopics();
            }
            return;
        }

        if (!this.showTranslation) {
            if (isNext) {
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
            } else if (evt.key === '3' || isNext) {
                evt.preventDefault();
                await this.handleGood();
            }
        } else if (isNext) {
            evt.preventDefault();
            this.handleClassicNext();
        }
    };

    private isFinished(): boolean {
        return (this.studyMode === 'repetition' && this.cardsQueue.length === 0) ||
            (this.studyMode === 'classic' && this.currentIndex >= this.cardsQueue.length);
    }

    private getCurrentCard(): WordCard | undefined {
        return this.studyMode === 'repetition'
            ? this.cardsQueue[0]
            : this.cardsQueue[this.currentIndex];
    }

    private canGoBack(): boolean {
        return this.studyMode === 'repetition' ? this.history.length > 0 : this.currentIndex > 0;
    }

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

    private pushHistory(card: WordCard) {
        this.history.push({
            queue: [...this.cardsQueue],
            failedInSession: Array.from(this.failedInThisSession),
            progress: this.plugin.captureProgress(card)
        });
        if (this.history.length > 200) this.history.shift();
    }

    async handleBack() {
        if (this.busy) return;

        if (this.studyMode === 'classic') {
            this.handleClassicPrev();
            return;
        }

        const entry = this.history.pop();
        if (!entry) return;

        this.busy = true;
        try {
            this.cardsQueue = entry.queue;
            this.failedInThisSession = new Set(entry.failedInSession);
            await this.plugin.restoreProgress(entry.progress);
            this.showTranslation = true;
            this.renderCard();
        } finally {
            this.busy = false;
        }
    }

    async handleAgain() {
        if (this.busy || this.cardsQueue.length === 0) return;
        this.busy = true;
        try {
            const failedCard = this.cardsQueue[0];
            this.pushHistory(failedCard);
            this.cardsQueue.shift();

            await this.plugin.recordMistake(failedCard, 'again');
            await this.plugin.logActivity(true);
            await this.plugin.addFailedWord(failedCard);

            const cardId = `${failedCard.topic}-${failedCard.word}`;
            this.failedInThisSession.add(cardId);

            this.cardsQueue.push(failedCard);
            this.showTranslation = false;
            this.renderCard();
        } finally {
            this.busy = false;
        }
    }

    async handleHard() {
        if (this.busy || this.cardsQueue.length === 0) return;
        this.busy = true;
        try {
            const hardCard = this.cardsQueue[0];
            this.pushHistory(hardCard);
            this.cardsQueue.shift();

            await this.plugin.recordMistake(hardCard, 'hard');
            await this.plugin.addFailedWord(hardCard);

            if (this.cardsQueue.length > 2) {
                this.cardsQueue.splice(2, 0, hardCard);
            } else {
                this.cardsQueue.push(hardCard);
            }
            this.showTranslation = false;
            this.renderCard();
        } finally {
            this.busy = false;
        }
    }

    async handleGood() {
        if (this.busy || this.cardsQueue.length === 0) return;
        this.busy = true;
        try {
            const currentCard = this.cardsQueue[0];
            this.pushHistory(currentCard);
            this.cardsQueue.shift();
            const cardId = `${currentCard.topic}-${currentCard.word}`;

            await this.plugin.logActivity(false);

            if (this.studyMode === 'repetition') {
                if (!this.failedInThisSession.has(cardId)) {
                    await this.plugin.removeFailedWord(currentCard);
                }
            }

            this.showTranslation = false;
            this.renderCard();
        } finally {
            this.busy = false;
        }
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

    private async renderRich(el: HTMLElement, text: string, sourcePath: string) {
        const md = normalizeTermMarkdown(text);
        const renderer: any = MarkdownRenderer;
        try {
            if (typeof renderer.render === 'function') {
                await renderer.render(this.app, md, el, sourcePath, this.mdComponent);
            } else {
                await renderer.renderMarkdown(md, el, sourcePath, this.mdComponent);
            }
        } catch (e) {
            console.error('Klomimory: markdown render failed', e);
            el.setText(text);
        }
    }

    renderCard() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('klomimory-modal-content');

        if (this.isFinished()) {
            this.renderCompletionScreen();
            return;
        }

        const currentCard = this.getCurrentCard()!;
        const cardContent = this.getCardDisplayContent(currentCard);
        const isQa = cardContent.cardType === 'qa';
        const sourcePath = currentCard.sourcePath ?? '';

        const topBar = contentEl.createEl('div', { cls: 'klomimory-study-topbar' });
        const topRow = topBar.createEl('div', { cls: 'klomimory-study-toprow' });

        const backToTopicsBtn = topRow.createEl('button', { cls: 'klomimory-home-btn klomimory-icon-btn' });
        setIcon(backToTopicsBtn.createSpan(), 'home');
        backToTopicsBtn.createSpan({ text: 'Topics' });
        backToTopicsBtn.onclick = async () => await this.finishAndReturnToTopics();

        const actions = topRow.createEl('div', { cls: 'klomimory-study-actions' });

        const prevBtn = actions.createEl('button', {
            cls: 'klomimory-icon-btn',
            attr: { 'aria-label': 'Previous card (←)' }
        });
        setIcon(prevBtn.createSpan(), 'arrow-left');
        prevBtn.createSpan({ text: 'Back' });
        prevBtn.disabled = !this.canGoBack();
        prevBtn.onclick = async () => await this.handleBack();

        const editBtn = actions.createEl('button', {
            cls: 'klomimory-icon-btn',
            attr: { 'aria-label': 'Edit this card' }
        });
        setIcon(editBtn.createSpan(), 'pencil');
        editBtn.createSpan({ text: 'Edit' });
        editBtn.onclick = () => {
            this.isEditing = true;
            this.renderEditForm();
        };

        const metaInfo = topBar.createEl('div', { cls: 'klomimory-study-meta' });
        metaInfo.createEl('div', { text: currentCard.topic, cls: 'klomimory-study-topic' }).style.fontWeight = 'bold';

        const counterStr = this.studyMode === 'repetition'
            ? `Remaining in queue: ${this.cardsQueue.length}`
            : `${this.currentIndex + 1} / ${this.cardsQueue.length}`;
        metaInfo.createEl('div', { text: counterStr, cls: 'klomimory-study-counter' }).style.color = 'var(--text-muted)';

        const cardBox = contentEl.createEl('div', {
            cls: isQa ? ['klomimory-study-card', 'is-qa'] : ['klomimory-study-card']
        });
        const inner = cardBox.createEl('div', { cls: 'klomimory-card-inner' });

        if (isQa) {
            const frontEl = inner.createEl('div', { cls: ['klomimory-md', 'markdown-rendered', 'klomimory-qa-front'] });
            void this.renderRich(frontEl, cardContent.frontText, sourcePath);
        } else {
            const wordEl = inner.createEl('h1', { text: cardContent.frontText, cls: 'klomimory-study-word' });
            wordEl.style.fontSize = '2em';
            wordEl.style.margin = '0 0 8px 0';

            if (cardContent.frontSubText) {
                const transEl = inner.createEl('div', { text: cardContent.frontSubText });
                transEl.style.fontSize = '1.1em';
                transEl.style.color = 'var(--text-accent)';
            }
        }

        if (this.showTranslation) {
            const back = inner.createEl('div', { cls: 'klomimory-card-back' });
            back.createEl('hr', { cls: 'klomimory-card-divider' });

            if (isQa) {
                const backEl = back.createEl('div', { cls: ['klomimory-md', 'markdown-rendered', 'klomimory-qa-back'] });
                this.renderRich(backEl, cardContent.backText, sourcePath).then(() => {
                    if (cardBox.scrollHeight > cardBox.clientHeight) {
                        cardBox.scrollTop = Math.max(0, back.offsetTop - 8);
                    }
                });
            } else {
                const translationEl = back.createEl('h2', { text: cardContent.backText });
                translationEl.style.fontSize = '1.5em';
                translationEl.style.margin = '0';
                translationEl.style.color = 'var(--interactive-accent)';

                if (cardContent.backSubText) {
                    const backTransEl = back.createEl('div', { text: cardContent.backSubText });
                    backTransEl.style.fontSize = '1em';
                    backTransEl.style.color = 'var(--text-accent)';
                    backTransEl.style.marginTop = '6px';
                }

                if (cardBox.scrollHeight > cardBox.clientHeight) {
                    cardBox.scrollTop = Math.max(0, back.offsetTop - 8);
                }
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
                if (this.currentIndex < this.cardsQueue.length - 1) {
                    const nextBtn = navBox.createEl('button', { text: 'Next →', cls: 'mod-cta' });
                    nextBtn.style.flex = '1';
                    nextBtn.style.minHeight = '40px';
                    nextBtn.onclick = () => this.handleClassicNext();
                } else {
                    const finishBtn = navBox.createEl('button', { text: 'Finish', cls: 'mod-cta' });
                    finishBtn.style.flex = '1';
                    finishBtn.style.minHeight = '40px';
                    finishBtn.onclick = () => this.handleClassicNext();
                }
            }
        }

        contentEl.createEl('div', {
            cls: 'klomimory-hint klomimory-key-hint',
            text: this.studyMode === 'repetition'
                ? '← back · Space / → show answer, then Good · 1 Again · 2 Hard · 3 Good'
                : '← previous · Space / → show answer, then next'
        });
    }

    private renderEditForm() {
        const card = this.getCurrentCard();
        if (!card) {
            this.isEditing = false;
            return;
        }

        const isQa = (card.type || 'word') === 'qa';
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('klomimory-modal-content');

        contentEl.createEl('h3', { text: 'Edit card' }).style.marginBottom = '4px';
        contentEl.createEl('div', {
            text: 'Your session progress stays as it is. The note is updated too.',
            cls: 'klomimory-hint'
        }).style.marginBottom = '12px';

        const label = (text: string) => contentEl.createEl('div', { text, cls: 'klomimory-field-label' });

        label(isQa ? 'Question / Term:' : 'Word:');
        const wordInput = contentEl.createEl('input', { type: 'text', cls: 'klomimory-field' });
        wordInput.value = card.word;

        let transInput: HTMLInputElement | null = null;
        if (!isQa) {
            label('Transcription (optional):');
            transInput = contentEl.createEl('input', { type: 'text', cls: 'klomimory-field' });
            transInput.value = card.transcription ?? '';
        }

        label(isQa ? 'Answer / Definition:' : 'Translation:');
        let answerField: TextField;
        if (isQa) {
            const area = contentEl.createEl('textarea', { cls: 'klomimory-field klomimory-field-area' });
            area.rows = 8;
            area.value = card.translation;
            answerField = area;
        } else {
            const inp = contentEl.createEl('input', { type: 'text', cls: 'klomimory-field' });
            inp.value = card.translation;
            answerField = inp;
        }

        if (isQa) {
            addImageTools(
                this.app,
                contentEl,
                [wordInput, answerField],
                () => card.sourcePath ?? this.app.workspace.getActiveFile()?.path ?? ''
            );
            contentEl.createEl('div', {
                cls: 'klomimory-hint',
                text: 'Lines below the first belong to the answer. Blank lines are removed: a blank line ends a card in the note.'
            });
        }

        const buttons = contentEl.createEl('div', { cls: 'klomimory-edit-buttons' });
        const cancelBtn = buttons.createEl('button', { text: 'Cancel' });
        const saveBtn = buttons.createEl('button', { text: 'Save (Ctrl/Cmd+Enter)', cls: 'mod-cta' });

        const close = () => {
            this.isEditing = false;
            this.renderCard();
        };

        const save = async () => {
            const fields: CardFields = {
                word: wordInput.value,
                translation: answerField.value,
                transcription: transInput?.value
            };
            const error = validateCardFields(isQa ? 'qa' : 'word', fields);
            if (error) {
                new Notice(error);
                return;
            }
            saveBtn.disabled = true;
            try {
                await this.saveEdit(card, fields);
            } catch (e) {
                console.error('Klomimory: failed to save card edit', e);
                new Notice('Could not save the card. See the console for details.');
                saveBtn.disabled = false;
                return;
            }
            close();
        };

        cancelBtn.onclick = close;
        saveBtn.onclick = save;
        contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                void save();
            }
        });

        wordInput.focus();
    }

    private async saveEdit(card: WordCard, fields: CardFields) {
        const oldId = `${card.topic}-${card.word}`;

        const result = await this.plugin.applyCardEdit(card, fields, [...this.allCards, ...this.cardsQueue]);

        const newId = `${card.topic}-${card.word}`;
        if (newId !== oldId) {
            if (this.failedInThisSession.delete(oldId)) this.failedInThisSession.add(newId);

            for (const h of this.history) {
                h.failedInSession = h.failedInSession.map(id => id === oldId ? newId : id);
                if (h.progress.statsKey === result.oldKey) {
                    h.progress.statsKey = result.newKey;
                    if (h.progress.statsEntry) {
                        h.progress.statsEntry.word = card.word;
                        h.progress.statsEntry.translation = card.translation;
                    }
                }
            }
        }

        new Notice(result.savedToFile
            ? 'Card updated.'
            : 'Card updated for this session only: could not find it in the note (was it changed?).');
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

        if (this.canGoBack()) {
            const backBtn = box.createEl('button', { text: '← Back to last card', cls: 'klomimory-icon-btn' });
            backBtn.style.width = '100%';
            backBtn.style.minHeight = '38px';
            backBtn.style.marginTop = '10px';
            backBtn.onclick = async () => await this.handleBack();
        }

        const closeBtn = box.createEl('button', { text: 'Back to Topics', cls: 'mod-cta' });
        closeBtn.style.width = '100%';
        closeBtn.style.minHeight = '42px';
        closeBtn.style.marginTop = '15px';
        closeBtn.onclick = async () => await this.finishAndReturnToTopics();
    }
}
