import { ItemView, WorkspaceLeaf, Modal, App, Notice } from 'obsidian';
import { VIEW_TYPE_KLOMIMORY_STATS } from './types';
import type KlomimoryPlugin from './main';

export class KlomimoryStatsView extends ItemView {
    plugin: KlomimoryPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: KlomimoryPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_KLOMIMORY_STATS;
    }

    getDisplayText(): string {
        return 'Klomimory Stats';
    }

    getIcon(): string {
        return 'bar-chart-2';
    }

    async onOpen() {
        this.render();
    }

    private calculateStreakData() {
        const logs = this.plugin.settings.activityLog || {};
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        
        let currentStreak = 0;
        let checkDate = new Date(today);
        let freezes = this.plugin.settings.streakFreezes || 0;

        const todayStr = formatDate(today);
        const reviewedToday = logs[todayStr]?.cardsReviewed > 0;

        if (!reviewedToday) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = formatDate(checkDate);
            const count = logs[dateStr]?.cardsReviewed || 0;

            if (count > 0) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (freezes > 0) {
                    freezes--;
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    if (formatDate(checkDate) === todayStr && !reviewedToday) {
                        checkDate.setDate(checkDate.getDate() - 1);
                        continue;
                    }
                    break;
                }
            }
        }

        if (reviewedToday) {
            currentStreak = Math.max(currentStreak, 1);
        }

        return { currentStreak, reviewedTodayToday: reviewedToday ? logs[todayStr].cardsReviewed : 0 };
    }

    render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('klomimory-stats-container');

        const header = container.createEl('h4', { text: 'Study Progress' });
        header.style.margin = '10px 0 12px 0';

        const { currentStreak, reviewedTodayToday } = this.calculateStreakData();
        const freezes = this.plugin.settings.streakFreezes || 0;
        const dailyGoal = this.plugin.settings.dailyGoal || 20;

        // 1. Сетка метрик (Streak и Карточки за сегодня)
        const metricsGrid = container.createEl('div');
        metricsGrid.style.display = 'grid';
        metricsGrid.style.gridTemplateColumns = '1fr 1fr';
        metricsGrid.style.gap = '8px';
        metricsGrid.style.marginBottom = '12px';

        // Карточка Стрика с кликабельным индикатором заморозок
        this.renderStreakCard(metricsGrid, currentStreak, freezes);
        
        // Карточка Сегодня с возможностью быстрой смены цели по клику
        this.renderTodayCard(metricsGrid, reviewedTodayToday, dailyGoal);

        // 2. Интерактивный прогресс-бар выполнения дневной цели
        const goalSection = container.createEl('div');
        goalSection.style.marginBottom = '15px';
        goalSection.style.padding = '8px';
        goalSection.style.backgroundColor = 'var(--background-secondary)';
        goalSection.style.borderRadius = '6px';

        const goalLabelRow = goalSection.createEl('div');
        goalLabelRow.style.display = 'flex';
        goalLabelRow.style.justifyContent = 'space-between';
        goalLabelRow.style.fontSize = '0.75em';
        goalLabelRow.style.marginBottom = '4px';
        goalLabelRow.style.color = 'var(--text-muted)';
        
        goalLabelRow.createEl('span', { text: 'Daily Goal Progress' });
        const goalPercent = Math.min(Math.round((reviewedTodayToday / dailyGoal) * 100), 100);
        goalLabelRow.createEl('span', { text: `${goalPercent}%` });

        const barBg = goalSection.createEl('div');
        barBg.style.height = '6px';
        barBg.style.backgroundColor = 'var(--background-modifier-border)';
        barBg.style.borderRadius = '3px';
        barBg.style.overflow = 'hidden';

        const barFill = barBg.createEl('div');
        barFill.style.width = `${goalPercent}%`;
        barFill.style.height = '100%';
        barFill.style.backgroundColor = 'var(--interactive-accent)';

        // 3. Тепловая карта
        const heatmapTitle = container.createEl('div', { text: 'Activity Heatmap' });
        heatmapTitle.style.fontWeight = 'bold';
        heatmapTitle.style.marginBottom = '6px';
        heatmapTitle.style.fontSize = '0.85em';

        const logs = this.plugin.settings.activityLog || {};
        const heatmapContainer = container.createEl('div');
        heatmapContainer.style.display = 'grid';
        heatmapContainer.style.gridTemplateRows = 'repeat(7, 14px)';
        heatmapContainer.style.gridAutoFlow = 'column';
        heatmapContainer.style.gap = '3px';
        heatmapContainer.style.overflowX = 'auto';
        heatmapContainer.style.paddingBottom = '8px';
        heatmapContainer.style.marginBottom = '15px';

        const today = new Date();
        const days = 56;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = logs[dateStr]?.cardsReviewed || 0;

            const cell = heatmapContainer.createEl('div');
            cell.style.width = '14px';
            cell.style.height = '14px';
            cell.style.borderRadius = '3px';
            cell.title = `${dateStr}: ${count} reviews`;

            if (count === 0) {
                cell.style.backgroundColor = 'var(--background-modifier-border)';
            } else {
                cell.style.backgroundColor = 'var(--interactive-accent)';
                if (count < 10) cell.style.opacity = '0.25';
                else if (count < 25) cell.style.opacity = '0.50';
                else if (count < 50) cell.style.opacity = '0.75';
                else cell.style.opacity = '1.0';
            }
        }

        // Кнопка для открытия подробной статистики и графиков
        const detailedBtn = container.createEl('button', { text: 'Detailed Stats & Hard Words', cls: 'mod-cta' });
        detailedBtn.style.width = '100%';
        detailedBtn.onclick = () => {
            new DetailedStatsModal(this.app, this.plugin).open();
        };
    }

    private renderStreakCard(parent: HTMLElement, streak: number, freezes: number) {
        const card = parent.createEl('div');
        card.style.padding = '8px';
        card.style.borderRadius = '6px';
        card.style.backgroundColor = 'var(--background-secondary)';
        card.style.textAlign = 'center';
        card.style.cursor = 'pointer';
        card.title = 'Click for freeze info';

        const labelEl = card.createEl('div', { text: 'Streak' });
        labelEl.style.fontSize = '0.7em';
        labelEl.style.color = 'var(--text-muted)';
        labelEl.style.marginBottom = '2px';

        const valEl = card.createEl('div', { text: `${streak}` });
        valEl.style.fontSize = '1.5em';
        valEl.style.fontWeight = 'bold';
        valEl.style.color = 'var(--interactive-accent)';

        const subEl = card.createEl('div', { text: `❄️ Freezes: ${freezes}` });
        subEl.style.fontSize = '0.6em';
        subEl.style.color = 'var(--text-muted)';
        subEl.style.marginTop = '2px';

        card.onclick = () => {
            new Notice(`Streak Freezes available: ${freezes}. Automatically granted every 3 active days of usage!`);
        };
    }

    private renderTodayCard(parent: HTMLElement, reviewed: number, goal: number) {
        const card = parent.createEl('div');
        card.style.padding = '8px';
        card.style.borderRadius = '6px';
        card.style.backgroundColor = 'var(--background-secondary)';
        card.style.textAlign = 'center';
        card.style.cursor = 'pointer';
        card.title = 'Click to change daily goal';

        const labelEl = card.createEl('div', { text: 'Today' });
        labelEl.style.fontSize = '0.7em';
        labelEl.style.color = 'var(--text-muted)';
        labelEl.style.marginBottom = '2px';

        const valEl = card.createEl('div', { text: `${reviewed}` });
        valEl.style.fontSize = '1.5em';
        valEl.style.fontWeight = 'bold';
        valEl.style.color = 'var(--interactive-accent)';

        const subEl = card.createEl('div', { text: `Goal: ${goal} (Edit)` });
        subEl.style.fontSize = '0.6em';
        subEl.style.color = 'var(--text-muted)';
        subEl.style.marginTop = '2px';

        card.onclick = () => {
            new DailyGoalModal(this.app, this.plugin).open();
        };
    }
}

// Модальное окно для смены дневной цели прямо из меню
export class DailyGoalModal extends Modal {
    plugin: KlomimoryPlugin;

    constructor(app: App, plugin: KlomimoryPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h3', { text: 'Set Daily Cards Goal' }).style.marginBottom = '12px';

        const input = contentEl.createEl('input', { type: 'number' });
        input.value = (this.plugin.settings.dailyGoal || 20).toString();
        input.style.width = '100%';
        input.style.marginBottom = '15px';

        const saveBtn = contentEl.createEl('button', { text: 'Save Goal', cls: 'mod-cta' });
        saveBtn.style.width = '100%';
        saveBtn.onclick = async () => {
            const val = parseInt(input.value);
            if (!isNaN(val) && val > 0) {
                this.plugin.settings.dailyGoal = val;
                await this.plugin.saveSettings();
                new Notice(`Daily goal updated to ${val} cards!`);
                this.close();
            } else {
                new Notice('Please enter a valid number greater than 0.');
            }
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

// Модальное окно для детальной аналитики, топа трудных слов и графика точности (Accuracy)
export class DetailedStatsModal extends Modal {
    plugin: KlomimoryPlugin;

    constructor(app: App, plugin: KlomimoryPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        this.render();
    }

    onClose() {
        this.contentEl.empty();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Detailed Statistics & Accuracy' }).style.marginBottom = '15px';

        const logs = this.plugin.settings.activityLog || {};
        let totalReviews = 0;
        let totalDaysActive = 0;
        let totalFailed = 0;

        Object.values(logs).forEach(day => {
            if (day.cardsReviewed > 0) {
                totalReviews += day.cardsReviewed;
                totalDaysActive++;
                totalFailed += (day.failedCount || 0);
            }
        });

        const accuracyRate = totalReviews > 0 ? Math.max(0, Math.round(((totalReviews - totalFailed) / totalReviews) * 100)) : 100;

        const grid = contentEl.createEl('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr 1fr';
        grid.style.gap = '8px';
        grid.style.marginBottom = '20px';

        this.renderBox(grid, 'Total Reviewed', totalReviews.toString());
        this.renderBox(grid, 'Active Days', totalDaysActive.toString());
        this.renderBox(grid, 'Accuracy Rate', `${accuracyRate}%`);

        // Блок графика точности (Accuracy Progress Bar)
        const accuracySection = contentEl.createEl('div');
        accuracySection.style.marginBottom = '20px';
        accuracySection.style.padding = '10px';
        accuracySection.style.backgroundColor = 'var(--background-secondary)';
        accuracySection.style.borderRadius = '6px';

        const accHeader = accuracySection.createEl('div');
        accHeader.style.display = 'flex';
        accHeader.style.justifyContent = 'space-between';
        accHeader.style.fontSize = '0.8em';
        accHeader.style.marginBottom = '6px';
        accHeader.createEl('span', { text: 'Overall Success / Accuracy Ratio' });
        accHeader.createEl('span', { text: `${accuracyRate}%` });

        const accBg = accuracySection.createEl('div');
        accBg.style.height = '8px';
        accBg.style.backgroundColor = 'var(--background-modifier-border)';
        accBg.style.borderRadius = '4px';
        accBg.style.overflow = 'hidden';

        const accFill = accBg.createEl('div');
        accFill.style.width = `${accuracyRate}%`;
        accFill.style.height = '100%';
        accFill.style.backgroundColor = accuracyRate > 75 ? 'var(--text-success)' : accuracyRate > 40 ? 'var(--text-warning)' : 'var(--text-error)';

        // Топ трудных слов
        const topHeaderRow = contentEl.createEl('div');
        topHeaderRow.style.display = 'flex';
        topHeaderRow.style.justifyContent = 'space-between';
        topHeaderRow.style.alignItems = 'center';
        topHeaderRow.style.marginBottom = '8px';

        topHeaderRow.createEl('div', { text: 'Top Hard Words (All-Time)' }).style.fontWeight = 'bold';

        const statsMap = this.plugin.settings.statsWords || {};
        const statsArray = Object.values(statsMap);
        const getTotalErrors = (item: any) => (item.againCount || 0) + (item.hardCount || 0);
        statsArray.sort((a, b) => getTotalErrors(b) - getTotalErrors(a));

        if (statsArray.length > 0) {
            const clearBtn = topHeaderRow.createEl('button', { text: 'Clear Stats' });
            clearBtn.style.fontSize = '0.75em';
            clearBtn.style.padding = '2px 6px';
            clearBtn.onclick = async () => {
                this.plugin.settings.statsWords = {};
                await this.plugin.saveSettings();
                this.render();
            };
        }

        const hardWordsList = contentEl.createEl('div');
        hardWordsList.style.display = 'flex';
        hardWordsList.style.flexDirection = 'column';
        hardWordsList.style.gap = '8px';
        hardWordsList.style.maxHeight = '240px';
        hardWordsList.style.overflowY = 'auto';

        if (statsArray.length === 0) {
            hardWordsList.createEl('div', { text: 'No mistakes recorded yet!' }).style.color = 'var(--text-muted)';
        } else {
            const maxAgain = Math.max(...statsArray.map(c => c.againCount || 0), 1);
            const maxHard = Math.max(...statsArray.map(c => c.hardCount || 0), 1);

            statsArray.slice(0, 15).forEach((card, index) => {
                const item = hardWordsList.createEl('div');
                item.style.display = 'flex';
                item.style.flexDirection = 'column';
                item.style.gap = '5px';
                item.style.padding = '8px 10px';
                item.style.borderRadius = '6px';
                item.style.backgroundColor = 'var(--background-secondary)';

                const rowTop = item.createEl('div');
                rowTop.style.display = 'flex';
                rowTop.style.justifyContent = 'space-between';
                rowTop.style.alignItems = 'center';

                const leftPart = rowTop.createEl('div');
                leftPart.style.display = 'flex';
                leftPart.style.gap = '6px';
                leftPart.style.alignItems = 'center';
                leftPart.style.alignItems = 'center'; // Исправление ошибки .center
                leftPart.createEl('span', { text: `${index + 1}.` }).style.color = 'var(--text-muted)';
                leftPart.createEl('span', { text: card.word }).style.fontWeight = '600';

                const statsText = rowTop.createEl('span', { 
                    text: `Again - ${card.againCount || 0}  |  Hard - ${card.hardCount || 0}` 
                });
                statsText.style.fontSize = '0.75em';
                statsText.style.color = 'var(--text-muted)';

                const barsContainer = item.createEl('div');
                barsContainer.style.display = 'flex';
                barsContainer.style.flexDirection = 'column';
                barsContainer.style.gap = '3px';

                const againPercent = Math.round(((card.againCount || 0) / maxAgain) * 100);
                this.createProgressBarRow(barsContainer, 'Again', againPercent, 'var(--text-error)');

                const hardPercent = Math.round(((card.hardCount || 0) / maxHard) * 100);
                this.createProgressBarRow(barsContainer, 'Hard', hardPercent, 'var(--text-warning)');
            });
        }
    }

    private renderBox(parent: HTMLElement, label: string, val: string) {
        const box = parent.createEl('div');
        box.style.padding = '10px';
        box.style.borderRadius = '6px';
        box.style.backgroundColor = 'var(--background-secondary)';
        box.style.textAlign = 'center';
        box.createEl('div', { text: val }).style.fontSize = '1.2em';
        box.createEl('div', { text: label }).style.fontSize = '0.7em';
        box.createEl('div', { text: label }).style.color = 'var(--text-muted)';
    }

    private createProgressBarRow(parent: HTMLElement, label: string, percent: number, color: string) {
        const row = parent.createEl('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center'; // Исправление ошибки .center
        row.style.gap = '6px';

        const labelEl = row.createEl('span', { text: label });
        labelEl.style.fontSize = '0.65em';
        labelEl.style.color = 'var(--text-muted)';
        labelEl.style.width = '32px';

        const bg = row.createEl('div');
        bg.style.flex = '1';
        bg.style.height = '3px';
        bg.style.backgroundColor = 'var(--background-modifier-border)';
        bg.style.borderRadius = '2px';
        bg.style.overflow = 'hidden';

        const fill = bg.createEl('div');
        fill.style.width = `${percent}%`;
        fill.style.height = '100%';
        fill.style.backgroundColor = color;
    }
}