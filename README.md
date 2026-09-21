# Klomimory 🧠

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

## 💬 Discussion

Join the discussion on Obsidian Forum: [Klomimory — Free SRS Flashcards Plugin](https://forum.obsidian.md/t/klomimory-free-srs-flashcards-plugin-for-language-learning/118242)

---

## 🎨 Design

#### The menu when you log in to the app
<p align="center">
  <img width="1211" height="749" alt="изображение" src="https://github.com/user-attachments/assets/d3d25374-afc3-4881-8778-99bb05571a24" />
</p>

#### Active Recall mode
<p align="center">
  <img width="1224" height="439" alt="изображение" src="https://github.com/user-attachments/assets/fc6ddb6b-3b56-4c91-9037-249d9a230afc" />
</p>

#### The right menu with statistics
<p align="center">
  <img width="455" height="475" alt="изображение" src="https://github.com/user-attachments/assets/cfaf0317-8ee0-40bc-9bf1-ca1ecd3895e1" />
</p>
#### Detailed Stats & Hard Words
<p align="center">
  <img width="1202" height="616" alt="изображение" src="https://github.com/user-attachments/assets/6d5abccc-8a71-48e3-b019-f4a875292903" />
</p>

#### Terms Mode:
<p align="center">
  <img width="1226" height="797" alt="изображение" src="https://github.com/user-attachments/assets/80b115cb-0533-40a2-bced-2d3bae9496a6" />
</p>

#### Edit Card Menu:
<p align="center">
  <img width="1234" height="528" alt="изображение" src="https://github.com/user-attachments/assets/dde4b466-8a53-4bd4-8374-aaa60312efd3" />
</p>

---

## 📝 Markdown Syntax Format

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

## 🚀 Usage & Keyboard Shortcuts

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

> 💡 **Tip:** You can edit any card mid-session — just fix the text and continue without losing your progress.

---

## 💻 Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](https://github.com/Klomix/Klomimory).
2. Place them into your Obsidian vault's plugin directory:  
   `<vault>/.obsidian/plugins/klomimory/`
3. Reload Obsidian and enable **Klomimory** in the Community Plugins tab.

---

## 📜 License

[MIT](LICENSE) © Klomix
