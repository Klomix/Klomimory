import type { WordCard } from './types';

export const headingRegex = /^#{1,6}\s+(.+)$/;
export const hrRegex = /^([-*_])\1{2,}\s*$/;
export const qaRegex = /^(.+?)\s*::\s*(.*)$/;
export const withTransRegex = /^(.+?)\s*[-–—]\s*\[(.+?)\]\s*[-–—]\s*(.+)$/;
export const simpleRegex = /^(.+?)\s*[-–—]\s*(.+)$/;

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;

const stripListMarker = (s: string) =>
    s.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+[.)]\s+/, '').trim();

const cleanWordText = (s: string) =>
    s.replace(/^[-*+]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/[*_]{1,3}/g, '')
        .trim();

const looksLikeWordCard = (trimmedLine: string) => simpleRegex.test(trimmedLine);

export function parseCards(text: string, sourcePath?: string): WordCard[] {
    const lines = text.split(/\r?\n/);
    const cards: WordCard[] = [];
    let currentTopic = 'Untagged';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || hrRegex.test(trimmed)) continue;

        const headingMatch = trimmed.match(headingRegex);
        if (headingMatch) {
            currentTopic = headingMatch[1].trim();
            continue;
        }

        const qaMatch = trimmed.match(qaRegex);
        if (qaMatch) {
            const question = stripListMarker(qaMatch[1]);
            const first = qaMatch[2].trim();
            const continuation: string[] = [];

            let j = i + 1;
            while (j < lines.length) {
                const next = lines[j];
                const nt = next.trim();
                if (!nt || hrRegex.test(nt) || headingRegex.test(nt) || qaRegex.test(nt)) break;
                const indented = /^\s/.test(next);
                if (!indented && looksLikeWordCard(nt)) break;
                continuation.push(next.replace(/\s+$/, ''));
                j++;
            }

            const answerLines = first ? [first, ...continuation] : continuation;
            const answer = answerLines.join('\n').replace(/^\n+|\s+$/g, '');

            if (question && answer) {
                cards.push({
                    word: question,
                    translation: answer,
                    topic: currentTopic,
                    rawLine: line,
                    rawText: lines.slice(i, j).join('\n'),
                    startLine: i,
                    sourcePath,
                    type: 'qa'
                });
            }
            i = j - 1;
            continue;
        }

        const transMatch = trimmed.match(withTransRegex);
        if (transMatch) {
            cards.push({
                word: cleanWordText(transMatch[1]),
                transcription: transMatch[2].trim(),
                translation: cleanWordText(transMatch[3]),
                topic: currentTopic,
                rawLine: line,
                rawText: line,
                startLine: i,
                sourcePath,
                type: 'word'
            });
            continue;
        }

        const simpleMatch = trimmed.match(simpleRegex);
        if (simpleMatch) {
            const cleanedWord = cleanWordText(simpleMatch[1]);
            if (cleanedWord.length > 0) {
                cards.push({
                    word: cleanedWord,
                    translation: cleanWordText(simpleMatch[2]),
                    topic: currentTopic,
                    rawLine: line,
                    rawText: line,
                    startLine: i,
                    sourcePath,
                    type: 'word'
                });
            }
        }
    }

    return cards;
}

export function normalizeTermMarkdown(md: string): string {
    const src = md.replace(/\r/g, '').split('\n');

    type Kind = 'blank' | 'plain' | 'list' | 'raw';
    const items: { kind: Kind; text: string }[] = [];

    let listBase = -1;
    let inFence = false;

    for (const rawLine of src) {
        if (/^\s*(```|~~~)/.test(rawLine)) {
            inFence = !inFence;
            items.push({ kind: 'raw', text: rawLine });
            continue;
        }
        if (inFence) {
            items.push({ kind: 'raw', text: rawLine });
            continue;
        }

        const line = rawLine.replace(/\t/g, '    ');
        if (line.trim() === '') {
            items.push({ kind: 'blank', text: '' });
            listBase = -1;
            continue;
        }

        const indent = line.length - line.trimStart().length;
        const isItem = LIST_ITEM.test(line);

        if (isItem && listBase < 0) listBase = indent;

        if (listBase >= 0 && (isItem || indent > listBase)) {
            const strip = Math.min(listBase, indent);
            items.push({ kind: 'list', text: line.slice(strip).replace(/\s+$/, '') });
        } else {
            listBase = -1;
            items.push({ kind: 'plain', text: line.trim() });
        }
    }

    const out: string[] = [];
    for (let k = 0; k < items.length; k++) {
        const cur = items[k];
        const prev = k > 0 ? items[k - 1] : undefined;
        const next = k + 1 < items.length ? items[k + 1] : undefined;

        if (prev && prev.kind !== 'blank' && prev.kind !== 'raw' && cur.kind !== 'blank' && cur.kind !== 'raw'
            && prev.kind !== cur.kind) {
            out.push('');
        }

        if (cur.kind === 'plain' && next && next.kind === 'plain') {
            out.push(cur.text + '  ');
        } else {
            out.push(cur.text);
        }
    }

    return out.join('\n');
}

export function plainPreview(md: string, max = 80): string {
    const s = md
        .replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, '🖼')
        .replace(/\s*\n\s*/g, ' ')
        .replace(/[*_`]/g, '')
        .trim();
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export interface CardFields {
    word: string;
    translation: string;
    transcription?: string;
}

export function validateCardFields(type: 'word' | 'qa', f: CardFields): string | null {
    const word = f.word.trim();
    if (!word) return type === 'qa' ? 'Question is empty.' : 'Word is empty.';

    if (type === 'qa') {
        if (word.includes('::')) return 'Question can\'t contain "::" (it is the Question/Answer separator).';
        if (word.includes('\n')) return 'Question must be a single line.';
        const lines = f.translation.split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) return 'Answer is empty.';
        if (lines.slice(1).some(l => qaRegex.test(l.trim()))) {
            return 'Only the first line of the answer may contain "::" (other lines would become new cards).';
        }
        return null;
    }

    if (/[-–—]/.test(word)) return 'Word can\'t contain "-", "–" or "—": the note format uses them as the separator.';
    if (!f.translation.trim()) return 'Translation is empty.';
    return null;
}

export function serializeCard(card: WordCard, next: CardFields): string {
    const type = card.type || 'word';
    const firstRaw = (card.rawText ?? card.rawLine ?? '').split('\n')[0] ?? '';

    const markerMatch = firstRaw.match(/^\s*(?:[-*+]|\d+[.)])\s+/);
    const prefix = markerMatch ? markerMatch[0] : (firstRaw.match(/^\s*/)?.[0] ?? '');

    if (type === 'qa') {
        const q = next.word.replace(/\s*\n\s*/g, ' ').trim();
        const ans = next.translation
            .split('\n')
            .map(l => l.replace(/\s+$/, ''))
            .filter(l => l.trim() !== '');

        const safe = ans.map((l, idx) =>
            idx > 0 && !/^\s/.test(l) && looksLikeWordCard(l.trim()) ? '  ' + l : l);

        const firstIsBlock = LIST_ITEM.test(safe[0]);
        if (firstIsBlock) {
            return [`${prefix}${q} ::`, ...safe].join('\n');
        }
        return [`${prefix}${q} :: ${safe[0].trim()}`, ...safe.slice(1)].join('\n');
    }

    const dash = firstRaw.match(/\s([-–—])\s/)?.[1] ?? '-';
    const word = next.word.replace(/\s*\n\s*/g, ' ').trim();
    const translation = next.translation.replace(/\s*\n\s*/g, ' ').trim();
    const tr = (next.transcription ?? '').trim().replace(/^\[|\]$/g, '').trim();

    return tr
        ? `${prefix}${word} ${dash} [${tr}] ${dash} ${translation}`
        : `${prefix}${word} ${dash} ${translation}`;
}

export function replaceCardBlock(content: string, card: WordCard, newRaw: string): string | null {
    const oldRaw = card.rawText ?? card.rawLine;
    if (oldRaw === undefined || oldRaw === '') return null;

    const oldLines = oldRaw.split('\n');
    const lines = content.split('\n');
    const strip = (l: string) => l.replace(/\r$/, '');

    const matches: number[] = [];
    for (let i = 0; i + oldLines.length <= lines.length; i++) {
        let ok = true;
        for (let k = 0; k < oldLines.length; k++) {
            if (strip(lines[i + k]) !== oldLines[k]) { ok = false; break; }
        }
        if (ok) matches.push(i);
    }
    if (matches.length === 0) return null;

    const hint = card.startLine ?? 0;
    matches.sort((a, b) => Math.abs(a - hint) - Math.abs(b - hint));
    const idx = matches[0];

    const cr = lines[idx].endsWith('\r') ? '\r' : '';
    const replacement = newRaw.split('\n').map(l => l + cr);
    lines.splice(idx, oldLines.length, ...replacement);
    return lines.join('\n');
}
