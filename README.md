# Klomimory 🧠

**Klomimory** is a lightweight, active recall and flashcard study plugin for [Obsidian](https://obsidian.md). It allows you to transform simple markdown lists and vocabulary notes into interactive study sessions with SRS-like queues, custom direction controls, and statistics tracking.

---

## ✨ Features

- **Zero-Setup Flashcard Parsing**: Automatically extracts flashcards from your active note using simple markdown syntax (`Word - Translation` or `Word - [Transcription] - Translation`).
- **Topic Separation**: Headings (`#`, `##`, etc.) automatically turn into study topics, letting you select specific categories for review.
- **Multiple Learning Modes**:
  - **Active Recall**: Repeat missed words within the session until remembered.
  - **Classic View**: Sequential flip-card practice without repeating.
- **Flexible Card Directions**:
  - `Word → Translation`
  - `Translation → Word`
  - `Random Side` (randomly picks front and back for each card)
- **Hard Words Vault**: Mistakes are automatically collected in a separate queue, allowing focused sessions on tricky vocabulary.
- **Comprehensive Statistics View**: Track daily review counts, mistake counts per word, and maintain streaks with built-in Streak Freeze mechanics.

---

## 📝 Markdown Syntax Format

Simply write your vocabulary lists inside any Markdown file:

```markdown
# Spanish Vocabulary

## Greetings
hola - [ˈola] - hello
buenos días - good morning

## Travel
estación - [es.taˈsjon] - station
playa - beach

🚀 Usage

    Open a note with your vocabulary cards.

    Click the Brain icon in the left ribbon bar (or use the command palette Ctrl/Cmd + P -> Klomimory: Start Study Session).

    Select topics, card display directions, and study mode in the Study Settings modal.

    Use keyboard shortcuts during practice:

        Space / Enter: Show Answer / Good (3)

        1: Again (Re-queue card)

        2: Hard (Delay card)

        3: Good (Pass card)

💻 Installation
Manual Installation

    Download main.js, manifest.json, and styles.css (if applicable) from the latest release.

    Place them in your Obsidian vault's plugin directory: <vault>/.obsidian/plugins/klomimory/

    Reload Obsidian and enable Klomimory in the Community Plugins tab.

📜 License

MIT License. Feel free to contribute or adapt!
