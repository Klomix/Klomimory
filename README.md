# Klomimory 🧠

**Klomimory** is a lightweight, active recall and flashcard study plugin for [Obsidian](https://obsidian.md). It transforms markdown lists and notes into interactive study sessions with SRS-like queues, customized direction controls, and statistics tracking.

---

## ✨ Core Features

- **Versatile Card Parsing**  
  Automatically extracts standard vocabulary items (`Word - Translation` or `Word - [Transcription] - Translation`) as well as interactive Q&A pairs and terms (`Question :: Answer`).

- **Topic Separation**  
  Headings (`#`, `##`, etc.) automatically convert into study topics, allowing you to select specific categories for review.

- **Multiple Learning Modes**  
  - **Active Recall** – Repeats missed words within the session until successfully remembered.  
  - **Classic View** – Sequential flip-card practice without repetition.

- **Flexible Directions & Refined Randomization**  
  Supports `Word → Translation`, `Translation → Word`, and `Random Side` with stabilized and fixed random queue ordering logic.

- **Hard Words Vault**  
  Automatically collects mistakes in a separate queue for targeted practice on difficult items.

- **Comprehensive Statistics**  
  Tracks daily review counts, mistake metrics per word, and streaks with built-in Streak Freeze mechanics.

---

## Design 
#### The menu when you log in to the app
<p align="center">
  <img width="500" height="590" alt="изображение" src="https://github.com/user-attachments/assets/f483e229-f588-4c7b-a087-d773279645bb" />
</p>

#### Active Recall mode
<p align="center">
  <img width="500" height="340" alt="изображение" src="https://github.com/user-attachments/assets/7ade1e09-ba81-4ffa-8bda-8aae9f64db5a" />
</p>

#### The right menu with statistics
<p align="center">
  <img width="400" height="625" alt="изображение" src="https://github.com/user-attachments/assets/409edda3-7780-4e9b-ac26-3cc867a440c0" />
</p>

#### Terms Mode:
<p align="center">
  <img width="500" height="300" alt="изображение" src="https://github.com/user-attachments/assets/94e01992-ef50-4460-a141-062fc7d6070f" />
</p>

---


## 📝 Markdown Syntax Format

```markdown
# Spanish Vocabulary

## Greetings
hola - [ˈola] - hello
buenos días - good morning

## Q&A / Terms
What is the capital of Spain? :: Madrid
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

---

## 💻 Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](https://github.com/your-repo/klomimory/releases).
2. Place them into your Obsidian vault's plugin directory:  
   `<vault>/.obsidian/plugins/klomimory/`
3. Reload Obsidian and enable **Klomimory** in the Community Plugins tab.

---

## 📜 License

[MIT](LICENSE) © Klomix
