# Preliminary Microbiology Grade Calculator

**Website:** <https://calebhendren.github.io/micrograde/>

> **Disclaimer:** This tool is informational. The **official final letter grade is calculated by the instructor of record**.

## Privacy and data

- All calculations run **client-side** in your browser.
- **No grades are uploaded** or sent to any server.
- Scores are saved to your browser's local storage so they persist between visits.

## Purpose

- Enter scores for your assessments and view your running course grade.
- See your current letter grade and what you need to reach higher thresholds.
- See whether the **replacement policy** benefits your grade.

## Section types

The calculator supports three section formats. On first visit you choose your section type, and the app remembers your choice.

### Separate Lecture & Lab (550 points)

For sections where lecture and lab are graded independently and combined into a 550-point total.

**Lecture (400 pts)**

| Assessment | Max |
|---|---|
| Unit 1 Exam | 100 |
| Unit 2 Exam | 100 |
| Unit 3 Exam | 100 |
| Final Exam | 100 |

**Lab (150 pts)**

| Assessment | Max |
|---|---|
| Lab Quizzes (10×) | 3 each, 30 total |
| Skills Tests (5×) | 1 each, 5 total |
| Midterm Exam | 50 |
| Final Exam | 50 |
| Pathogen Project | 15 |

**Letter-grade thresholds**

| Grade | Points |
|---|---|
| A | 493+ |
| B | 438–492 |
| C | 383–437 |
| D | 355–382 |
| F | 0–354 |

### Hybrid: Online Lecture + On-Ground Lab (550 points)

For BIOL 2230 hybrid sections — online lecture (proctored on-campus exams) with an on-ground lab. Based on the published BIOL 2230 hybrid syllabus.

**Online Lecture (400 pts)**

| Assessment | Max |
|---|---|
| Online Quizzes (cumulative) | 100 |
| Midterm Exam (proctored) | 150 |
| Final Exam (proctored) | 150 |

**On-Ground Lab (150 pts)**

| Assessment | Max |
|---|---|
| Lab Quizzes (10×) | 3 each, 30 total |
| Skills Tests (5×) | 1 each, 5 total |
| Practical Midterm Exam | 50 |
| Practical Final Exam | 50 |
| Pathogen Project | 15 |

**Letter-grade thresholds** (same as Separate mode)

| Grade | Points |
|---|---|
| A | 493+ |
| B | 438–492 |
| C | 383–437 |
| D | 355–382 |
| F | 0–354 |

The hybrid syllabus does **not** include a replacement policy; the calculator reflects this.

### Integrated Lecture/Lab (weighted percentages)

For sections where lecture and lab are combined into a single weighted grade.

| Assessment | Max Score | Weight |
|---|---|---|
| Unit 1 Exam | 100 | 24% |
| Unit 2 Exam | 75 | 24% |
| Unit 3 Exam | 75 | 24% |
| Final Exam | 100 | 24% |
| Skills Tests (5×) | 1 each | 1% |
| Pathogen Project | 15 | 3% |

Raw scores are converted to percentages before applying weights.

**Letter-grade scale**

| Grade | Percentage |
|---|---|
| A | 90–100% |
| B | 80–89.9% |
| C | 70–79.9% |
| D | 65–69.9% |
| F | below 65% |

## Replacement policy

In **Separate** and **Integrated** modes, the **Final Exam score replaces the lowest Unit Exam score** if the replacement benefits the student's grade. In integrated mode, comparison is by percentage since exams have different point maximums. **Hybrid mode does not use a replacement policy** (the hybrid syllabus does not specify one).

## Skills tests

All three modes break skills tests into five individual assessments (0 or 1 each):

1. Aseptic Technique
2. Oil Immersion
3. Slide Staining
4. Bacterial Isolation
5. Biochemical ID

## What the app displays

- Which **unit exam** was replaced by the final (if applicable).
- Subtotals and percentages for each grading category.
- Current letter grade.
- Points or percentage needed to reach the next threshold(s).
- In integrated mode with partial scores entered: the average needed on remaining assessments for each letter grade.

## Themes (light & dark)

The calculator ships with three light themes and three dark themes. A theme picker and a one-click light/dark toggle live in the header. The first-visit theme follows the visitor's operating-system `prefers-color-scheme`; afterwards the choice is remembered per browser.

| Mode | Theme |
|---|---|
| Light | Light (default) |
| Light | Sepia |
| Light | High Contrast (Light) — WCAG AAA |
| Dark | Dracula |
| Dark | Nord |
| Dark | High Contrast (Dark) — WCAG AAA |

Instructors can change the default theme — or disable the toggle entirely — in `config.js` (`ui.defaultTheme`, `ui.allowThemeToggle`).

## Accessibility

The interface targets WCAG 2.1 AA and supports common university accessibility requirements:

- Semantic landmarks (`header`, `main`, `footer`) and a visible-on-focus **skip-to-content** link.
- Every input has a programmatically associated `<label>`. Inputs without visible labels use `aria-label`.
- Live regions (`aria-live="polite"`) announce updated totals, replacement messages, and the letter grade.
- Keyboard navigation throughout; visible `:focus-visible` outlines that remain visible in all themes.
- The two **High Contrast** themes meet WCAG AAA (7:1) on body text and respect the OS forced-colors mode (`@media (forced-colors: active)`).
- Color is never the sole indicator of meaning — the letter grade is always present as text.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- Number inputs use `inputmode="decimal"` for soft-keyboard support and have `min`/`max` attributes for assistive validation.

If you discover an accessibility issue, please open an issue on GitHub.

## Use

1. Visit <https://calebhendren.github.io/micrograde/>
2. Select your section type.
3. Enter your scores.

## For instructors

### Customize via `config.js`

All course-specific values — assessments, point maxima, weights, letter-grade thresholds, the replacement policy, mode labels, the GitHub link, and the default theme — live in a single file, **`config.js`** at the repository root. No build step, no JavaScript bundler, no framework. Edit, save, push.

Examples:

```js
// Change letter-grade thresholds for the 550-point modes
window.MICROGRADE_CONFIG.separate.thresholds = { A: 500, B: 445, C: 390, D: 360 };

// Disable a mode entirely
window.MICROGRADE_CONFIG.modes.integrated.enabled = false;

// Force a specific default theme and hide the picker
window.MICROGRADE_CONFIG.ui.defaultTheme = 'light-contrast';
window.MICROGRADE_CONFIG.ui.allowThemeToggle = false;

// Add a "replacement policy" to a points-based mode (Separate / Hybrid)
window.MICROGRADE_CONFIG.hybrid.lecture.replacement = {
    sourceId: 'lecFin',
    replaceableIds: ['lecMid'],
};

// Rename or re-weight an exam
window.MICROGRADE_CONFIG.integrated.exams[1].max = 100;
window.MICROGRADE_CONFIG.integrated.exams[1].weight = 20;
```

**Separate** and **Hybrid** share the same points-based schema (`storageKey`, `totalPoints`, `thresholds`, `lecture.components`, `lecture.replacement`, `lab`), so you can copy one and edit it to add additional course variants. The header of `config.js` documents every supported field.

### Fork and adapt

- **Fork** this repository and edit `config.js` for your syllabus.
- For deeper changes (new assessment types, custom replacement rules), edit the relevant module in `js/`.

### Publish as a GitHub Pages site

1. Repository → **Settings** → **Pages**.
2. **Build and deployment** → **Source**: *Deploy from a branch*.
3. **Branch**: `master`. **Folder**: `/` (root). Save.
4. Access at `https://<your-username>.github.io/<repo-name>/`.

No build step is required — the project is plain HTML, CSS, and ES modules, all served directly by GitHub Pages.

## Project layout

```
.
├── index.html         # Minimal HTML shell — landmarks and mount points
├── config.js          # Instructor-editable configuration
├── css/
│   ├── base.css       # Resets, layout, typography
│   ├── components.css # Cards, forms, buttons, pills, theme picker
│   └── themes.css     # 6 themes via CSS custom properties
├── js/
│   ├── app.js         # Entry point — boots the app
│   ├── themes.js      # Theme registry, picker, light/dark toggle
│   ├── pointsCalc.js  # Generic points calculator (Separate + Hybrid modes)
│   ├── integrated.js  # Weighted-percent integrated-mode calculator
│   ├── dom.js         # DOM helpers (element builder, number parsing)
│   └── storage.js     # localStorage helpers with safe failure
└── README.md
```
