<p align="center">
    <a href="https://github.com/Klomix/Klomimory" align="center">
<img width="552" height="82" alt="Klomimory — advanced spaced repetition plugin for Obsidian" style="max-width: 100%; height: auto; object-fit: contain;" src="https://github.com/user-attachments/assets/a2ad8aea-0571-4dc8-82e7-fcc10c55fd38" />
    </a>
</p>
<!-- <h1 align="center">Talker</h1> -->
<h2 align="center"> Now your notes have a photographic memory </h2>

<p align="center">
  Create interactive flashcards directly in your notes, track your learning statistics, review missed words, and practice with advanced recall modes.
   <br>
</p>

<p align="center">
    <a href="https://github.com/Klomix/Klomimory" align="center">
      <img width="100%" height="auto" alt="Social preview image Klomimory" src="https://github.com/user-attachments/assets/10724cce-dbaf-4664-8fd1-a106cdcdd753" />
    </a>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
    <a href="https://github.com/Klomix/Klomimory"><img src="https://img.shields.io/github/stars/Klomix/Klomimory?style=social" alt="GitHub"></a>
</p>

**Klomimory** is a lightweight, active recall and flashcard study plugin for [Obsidian](https://obsidian.md). It transforms markdown lists and notes into interactive study sessions with SRS-like queues, customized direction controls, and statistics tracking.

---

## ✨ Core Features

- **Versatile Card Parsing**  
  Automatically extracts standard vocabulary items (`Word - Translation` or `Word - [Transcription] - Translation`) as well as interactive Q&A pairs and terms (`Question :: Answer`).

- **Rich Term Mode**  
  Supports multi-line answers with formatting, bullet lists, paragraphs, and **images** — perfect for detailed definitions and complex concepts.

- **Topic Separation**  
  Headings (`#`, `##`, etc.) automatically convert into study topics, allowing you to select specific categories for review.

- **Multiple Learning Modes**  
  - **Active Recall** – Repeats missed words within the session until successfully remembered.  
  - **Classic View** – Sequential flip-card practice without repetition.

- **Flexible Directions & Refined Randomization**  
  Supports `Word → Translation`, `Translation → Word`, and `Random Side` with stabilized and fixed random queue ordering logic.

- **Navigate & Edit on the Fly**  
  - Step back to previous cards during a session with **arrow keys** (`←` / `→`).  
  - **Edit cards in real time** while studying — fix typos or mistakes without losing your progress.

- **Hard Words Vault**  
  Automatically collects mistakes in a separate queue for targeted practice on difficult items.

- **Comprehensive Statistics**  
  Tracks daily review counts, mistake metrics per word, and streaks with built-in **Streak Freeze** mechanics (limited to **5 freezes**). Streaks can be lost if you skip days.

- **Smart Text Handling**  
  Long answers are fully scrollable, with text left-aligned for comfortable reading.

---

## Discussion

Join the discussion on Obsidian Forum: [Klomimory — Free SRS Flashcards Plugin](https://forum.obsidian.md/t/klomimory-free-srs-flashcards-plugin-for-language-learning/118242)

---

## Design

#### The menu when you log in to the app
<p align="center">
  <img width="1317" height="759" alt="изображение" src="https://github.com/user-attachments/assets/474e9d9b-cc4e-4ee7-ba65-99c355c175c2" />
</p>

#### Active Recall mode
<p align="center">
  <img width="1314" height="456" alt="изображение" src="https://github.com/user-attachments/assets/745c11cf-2e16-4a69-b55d-0befd63c2424" />
</p>

#### The right menu with statistics
<p align="center">
  <img width="520" height="447" alt="изображение" src="https://github.com/user-attachments/assets/b0d698b4-eda6-4165-8db0-476946ef30aa" />
</p>

#### Detailed Stats & Hard Words
<p align="center">
  <img width="1113" height="598" alt="изображение" src="https://github.com/user-attachments/assets/b8e54d9b-bc3f-4f20-b63e-fcb9421f9792" />
</p>

#### Terms Mode:
<p align="center">
  <img width="1306" height="813" alt="изображение" src="https://github.com/user-attachments/assets/82189729-771c-409c-a252-bb9b8bd8997b" />
</p>

#### Edit Card Menu:
<p align="center">
  <img width="1318" height="540" alt="изображение" src="https://github.com/user-attachments/assets/29cbcd88-f82f-40a2-afc2-beb4e75c5f0b" />
</p>

---

## Markdown Syntax Format

### Vocabulary Cards

```markdown
# Spanish Vocabulary

## Greetings
hola - [ˈola] - hello
buenos días - good morning
```

### Term Cards (Q&A)

Term Mode supports **rich formatting**, **multi-line answers**, **bullet lists**, and **images**:

```markdown
## Q&A / Terms

What is the capital of Spain? :: Madrid

Explain photosynthesis :: 
- Process used by plants to convert light into energy
- Requires sunlight, CO₂, and water
- Produces glucose and oxygen

![Diagram](path/to/image.png)
Text Text Text Text Text Text Text

Next question :: Answer
```

---

## Usage & Keyboard Shortcuts

1. Open any note containing your vocabulary cards.
2. Click the **Brain icon** in the left ribbon bar or use the command palette (`Ctrl/Cmd + P` → `Klomimory: Start Study Session`).
3. Choose your topics, display directions, and study mode in the **Study Settings** modal.
4. Use keyboard shortcuts during practice:

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Show Answer / Good (3) |
| `1` | Again (Re-queue card) |
| `2` | Hard (Delay card) |
| `3` | Good (Pass card) |
| `←` | Previous card |
| `→` | Next card |

> **Tip:** You can edit any card mid-session — just fix the text and continue without losing your progress.

---

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](https://github.com/Klomix/Klomimory).
2. Place them into your Obsidian vault's plugin directory:  
   `<vault>/.obsidian/plugins/klomimory/`
3. Reload Obsidian and enable **Klomimory** in the Community Plugins tab.

If Klomimory is useful, a ⭐ helps other people find it.
---

## License

[MIT](LICENSE) © Klomix
