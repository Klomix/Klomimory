<p align="center">
    <a href="https://github.com/Klomix/Klomimory" align="center">
<img width="552" height="82" alt="Klomimory — advanced spaced repetition plugin for Obsidian" style="width: 55%; height: auto; object-fit: contain;" src="https://github.com/user-attachments/assets/a2ad8aea-0571-4dc8-82e7-fcc10c55fd38" />
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


## Why Klomimory?
**Klomimory** was born out of pure frustration. Like many lifelong learners, I loved organizing my knowledge base in Obsidian, but when it came to actual revision, I was completely dependent on Anki.

The workflow was exhausting. Every single study session felt like a tedious chore: constantly copying text, formatting cards, exporting decks, and bouncing back and forth between two entirely different apps. It felt like I was spending **80% of my time just managing notes and creating flashcards**, and only **20% actually studying them**. It was inefficient, broke my daily workflow, and took all the joy out of learning.

> ### The Solution
> **Klomimory solves this exact problem.** It is a lightweight, active recall and flashcard study plugin built directly into Obsidian. No more third-party software dependencies, no more friction, and no more wasting time. 
> 
> Klomimory seamlessly transforms your raw markdown lists, headings, and notes into interactive study sessions with SRS-like queues, custom direction controls, and real-time statistics tracking. Now, **your notes *are* your flashcards—instantly.**

## Main Menu & Card Style

<p align="center">
    <a href="https://github.com/Klomix/Klomimory" align="center">
<img width="100%" height="auto" alt="Main Menu & Card Style" src="https://github.com/user-attachments/assets/b1c97d9d-04fb-4e80-972a-369b553c66aa" />
    </a>
</p>

**Klomimory** gives you complete control over your learning process, allowing you to seamlessly adapt flashcards to your current goals. You can easily choose the type of content you want to focus on—whether that means studying isolated words, practicing with Q&A and terms, or mixing everything together. The app supports two learning modes: highly effective _Active Recall_ for deep memorization, or a more traditional _Classic View_.

The intuitive interface lets you flip card sides (Front to Back or vice versa) in a single click, or randomize the entire deck to truly test your knowledge. For language learners, the smart filtering system makes it easy to isolate words with or without transcriptions. Managing your study decks is just as effortless: combine different topics, shuffle your queue, or launch a practice session for specific categories directly from the settings menu.

## Detailed Stats & Hard Words

<p align="center">
    <a href="https://github.com/Klomix/Klomimory" align="center">
        <img width="100%" height="auto" alt="Detailed Stats & Hard Words" src="https://github.com/user-attachments/assets/6344eb7b-ba18-4daa-ab86-1aa789d5f187" />
    </a>
</p>

**Klomimory** keeps you motivated and helps you refine your learning by turning your study history into actionable insights. The built-in dashboard tracks your daily goal progress, monitors your consistency with an activity heatmap, and records your active days and current streak. With real-time accuracy rates and a detailed breakdown of total reviewed items, you can easily see how your memory improves over time.

Beyond just numbers, the app actively helps you tackle your weak spots. It automatically identifies your top hard words—the ones you struggle with most—allowing you to focus your attention right where it's needed, correct recurring mistakes, and study much more efficiently.

## Term Mode & Edit Card

<p align="center">
    <a href="https://github.com/Klomix/Klomimory" align="center">
        <img width="100%" height="auto" alt="Term Mode & Edit Card" src="https://github.com/user-attachments/assets/9f774438-2399-40fb-b307-ef57f868dc1f" />
    </a>
</p>

**Klomimory** bridges the gap between note-taking and active studying by letting you turn your markdown notes into study flashcards in seconds. If you notice a typo or want to refine an answer mid-session, you can seamlessly edit your cards on the fly without breaking your learning flow. Any changes you make are instantly synchronized, ensuring your source files and study queue always stay perfectly up to date.

The built-in editor provides a clean, distraction-free interface where you can easily modify questions, redefine terms, and instantly insert images into your cards. This frictionless workflow means you spend less time formatting and more time absorbing information, making your knowledge base feel alive and constantly evolving.

## Smart Parsing & Mechanics
- **Versatile Card Parsing** — Automatically extracts standard vocabulary items (`Word - Translation` or `Word - [Transcription] - Translation`) as well as interactive Q&A pairs and terms (`Question :: Answer`).
- **Topic Separation** — Headings (`#`, `##`, etc.) automatically convert into study topics, allowing you to select specific categories for review.
- **Smart Text Handling** — Long answers are fully scrollable, with text left-aligned for comfortable reading.
- **Streak Freeze Limit** — Note that your streak freezes are capped at a maximum of **5 freezes**.

## Join the Discussion
If you want to suggest a feature, ask a question, or simply stay updated with **Klomimory**, feel free to join the community on your favorite platform!

- [![Obsidian Forum](https://shields.io)](https://forum.obsidian.md/t/klomimory-free-srs-flashcards-plugin-for-language-learning/118242)<br>
- [![Reddit](https://shields.io)](https://www.reddit.com/user/Klomix_Dev/)<br>
- [![Product Hunt](https://shields.io)](https://www.producthunt.com/products/klomimory)<br>

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

## Usage & Keyboard Shortcuts

1. Open any note containing your vocabulary cards.
2. Click the **Brain icon** in the left ribbon bar or use the command palette (`Ctrl/Cmd + P` → `Klomimory: Start Study Session`).
3. Choose your topics, display directions, and study mode in the **Study Settings** modal.
4. Use keyboard shortcuts during practice:

| Action | Keybinding |
| :--- | :--- |
| **Show Answer** | `Space` |
| **Grade: Again** | `1` |
| **Grade: Hard** | `2` |
| **Grade: Good** | `3` |
| **Previous Card** | `←` *(Left Arrow)* |
| **Next Card** | `→` *(Right Arrow)* |
| **Save Card (In Editor)** | `Ctrl` + `Enter` (or `Cmd` + `Enter` on Mac) |
| **Cancel Editing** | `Esc` |

> **Tip:** You can edit any card mid-session — just fix the text and continue without losing your progress.

## FAQ

If you are deciding whether Klomimory fits your workflow, start here.

- **Can I use Klomimory with my existing notes?** Yes. Klomimory is designed to parse your existing Obsidian markdown notes. As long as your notes contain standard separators like `Word - Translation` or `Question :: Answer`, you can start studying them instantly.
- **Does it modify my original note files?** Only when you want it to. When you use the built-in *Edit Card* feature during a study session, Klomimory directly updates the text in your source `.md` file so your notes and cards always stay synchronized.
- **How does the Topic Separation work?** Klomimory automatically scans your headings (`# Heading 1`, `## Heading 2`, etc.) and treats them as separate study topics. You can easily toggle specific topics on or off in the Study Settings.
- **Does it work on mobile?** Yes. Klomimory works seamlessly across both desktop and mobile versions of Obsidian, though managing large settings menus may feel more comfortable on larger screens.
- **How does the Streak Freeze mechanic work?** To help you maintain your habits, you have a maximum pool of **5 Streak Freezes**. If you miss a day, a freeze is automatically consumed to protect your streak. If you run out of freezes and skip a day, your streak will reset.
- **Is Klomimory free?** Yes. Klomimory is completely free, open-source, and runs entirely locally on your device.

## Installation

#### Via Obsidian
Settings → Community plugins → Enable community plugins → Browse → Search for "Klomimory" → Install → Enable

#### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub release](https://github.com).
2. Place them into your Obsidian vault's plugin directory:  
   `<vault>/.obsidian/plugins/klomimory/`
3. Reload Obsidian and enable **Klomimory** in the Community Plugins tab.


## License

[MIT](LICENSE) © Klomix
