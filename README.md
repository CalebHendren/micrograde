# Preliminary Microbiology Grade Calculator

**Website:** <https://calebhendren.github.io/micrograde/>

> **Disclaimer:** This tool is informational. The official final letter grade is calculated by the instructor of record.

## Privacy and data

Every calculation runs in your browser. No grades are uploaded, and nothing is sent to any server. Scores are kept in your browser's local storage so they are still there when you come back, and the "Reset all" button clears them.

## How the grade is calculated

Each graded item has two numbers behind it: the points it is out of, and its weight — how much of the final 100% it is worth. You only ever type the points. The calculator divides your score by the points available and multiplies by the weight, so a 44/50 on a Unit 1 Exam worth 17% contributes 14.96 percentage points.

The weights of all graded items in a section add up to 100. Extra credit sits on top of that, so a fully online student who completes all five extra-credit items can finish at 102%.

The calculator shows two numbers, and they answer different questions:

- **Course grade** counts everything you have not entered as a zero. It is where you stand if the semester ended today with no further work.
- **Current score** averages only the work you have entered. It is how you are doing on what you have actually done, and it ignores everything still ahead of you.

## Section types

You pick your section type on first visit, and the app remembers it.

### On-Ground Lecture / Lab

Lecture and lab both meet on campus. This covers the separate and the integrated course layouts, since both are graded on the same weights.

| Category | Items | Points each | Weight each | Category weight |
|---|---|---|---|---|
| Lecture Exams | Unit 1, Unit 2, Unit 3 | 50 | 17% | 70% |
| | Final Exam | 100 | 19% | |
| Lab Skills | Transfer, Oil, Gram Stain, Streak, Unknowns | 1 | 0.2% | 1% |
| Lab Quizzes | Lab Quiz 1–10 | 5 | 0.6% | 6% |
| Pathogen Project | — | 15 | 3% | 3% |
| Lab Practical Exam | — | 100 | 20% | 20% |

### Hybrid (Online Lecture + On-Ground Lab)

Online lecture with proctored exams, plus the same on-ground lab as above.

| Category | Items | Points each | Weight each | Category weight |
|---|---|---|---|---|
| Lecture Exams | Midterm, Final | 100 | 28% | 56% |
| Lecture Quizzes | Lecture Quiz 1–10 | 20 | 1.4% | 14% |
| Lab Skills | Transfer, Oil, Gram Stain, Streak, Unknowns | 1 | 0.2% | 1% |
| Lab Quizzes | Lab Quiz 1–10 | 5 | 0.6% | 6% |
| Pathogen Project | — | 15 | 3% | 3% |
| Lab Practical Exam | — | 100 | 20% | 20% |

**Extra credit** (2 points each, 0.4% each, up to +1.2%): Student Intro, Midterm Scheduling, Final Exam Scheduling.

### Fully Online Lecture / Lab

Online lecture and at-home lab kits.

| Category | Items | Points each | Weight each | Category weight |
|---|---|---|---|---|
| Lecture Exams | Midterm, Final | 100 | 28% | 56% |
| Lecture Quizzes | Lecture Quiz 1–10 | 20 | 1.4% | 14% |
| At-Home Labs | Lab 1–10 | 30 | 3% | 30% |

**Extra credit** (2 points each, 0.4% each, up to +2%): Student Intro, Midterm Scheduling, Final Exam Scheduling, Lab Kit Ordering, Lab Kit Delivery.

### Letter-grade scale

All three section types use the same scale.

| Grade | Course percentage |
|---|---|
| A | 90% and above |
| B | 80–89.9% |
| C | 70–79.9% |
| D | 65–69.9% |
| F | below 65% |

## Replacement policy

In the On-Ground section type, the Final Exam percentage replaces the lowest Unit Exam percentage when that helps. The replaced exam keeps its own 17% weight; only the percentage changes. Comparison is by percentage rather than raw points, because the Final is out of 100 and the Unit Exams are out of 50.

Only exams you have entered are considered, so a Unit Exam you have not taken yet is never quietly "replaced" by a Final you already sat. The Hybrid and Fully Online section types have no replacement policy.

## What the app shows

- Your course grade and letter grade, with everything unentered counted as zero.
- A weighted breakdown: your percentage in each category and the percentage points it contributes.
- Your current score across only the assessments you have entered.
- The average you would need on the remaining weight to reach each letter grade.
- Which Unit Exam the Final replaced, in the On-Ground section type.
- Running point subtotals for each category, so you can check them against the LMS gradebook.

## Themes

Three light themes and three dark ones, with a picker and a light/dark toggle in the header. The first visit follows your operating system's `prefers-color-scheme`; after that the choice is remembered per browser.

| Mode | Theme |
|---|---|
| Light | Light (default) |
| Light | Sepia |
| Light | High Contrast (Light) — WCAG AAA |
| Dark | Dracula |
| Dark | Nord |
| Dark | High Contrast (Dark) — WCAG AAA |

Instructors can change the default theme, or hide the picker entirely, in `config.js` (`ui.defaultTheme`, `ui.allowThemeToggle`).

## Accessibility

The interface targets WCAG 2.1 AA and supports common university accessibility requirements:

- Semantic landmarks (`header`, `main`, `footer`) and a visible-on-focus skip-to-content link.
- Every input has a programmatically associated `<label>`. Inputs without visible labels use `aria-label`.
- Live regions (`aria-live="polite"`) announce updated totals, replacement messages, and the letter grade.
- Keyboard navigation throughout, with `:focus-visible` outlines that stay visible in all six themes.
- The two High Contrast themes meet WCAG AAA (7:1) on body text and respect the OS forced-colors mode (`@media (forced-colors: active)`).
- Color is never the sole indicator of meaning — the letter grade is always present as text.
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- Number inputs use `inputmode="decimal"` for soft keyboards, with `min` and `max` for assistive validation.

If you find an accessibility problem, please open an issue on GitHub.

## Use

1. Visit <https://calebhendren.github.io/micrograde/>
2. Select your section type.
3. Enter your scores.

## For instructors

### Customize via `config.js`

Everything course-specific lives in `config.js` at the repository root: assessments, point values, weights, letter-grade thresholds, the replacement policy, section labels, the GitHub link, and the default theme. The project is plain HTML, CSS and ES modules with no bundler, so editing the file and pushing is the whole deployment process.

All three section types share one schema. A section has a `lecture` and a `lab`, each holding a list of groups, plus optional `extraCredit`:

```js
{
    id: 'labQuizzes',
    title: 'Lab Quizzes',
    layout: 'grid',                      // 'grid' for a numbered run, 'rows' for named items
    items: series('labq', 'Lab Quiz', 10, 5, 0.6),   // 10 quizzes, 5 points each, 0.6% each
}
```

Common edits:

```js
// Move the letter-grade cutoffs
window.MICROGRADE_CONFIG.onground.thresholds = { A: 92, B: 83, C: 74, D: 68 };

// Turn off the replacement policy
window.MICROGRADE_CONFIG.onground.lecture.replacement = null;

// Hide a section type students are not enrolled in this term
window.MICROGRADE_CONFIG.modes.online.enabled = false;

// Force a theme and hide the picker
window.MICROGRADE_CONFIG.ui.defaultTheme = 'light-contrast';
window.MICROGRADE_CONFIG.ui.allowThemeToggle = false;
```

The weights in a section must total 100. If they do not, the calculator still runs but logs a warning to the browser console naming the section and the total it found, which is usually enough to spot the typo.

### Fork and adapt

Fork the repository and edit `config.js` for your syllabus. For changes the config cannot express — a new assessment layout, a different replacement rule — edit `js/weightedCalc.js`.

### Publish as a GitHub Pages site

1. Repository → **Settings** → **Pages**.
2. **Build and deployment** → **Source**: *Deploy from a branch*.
3. **Branch**: `master`. **Folder**: `/` (root). Save.
4. Access at `https://<your-username>.github.io/<repo-name>/`.

## Project layout

```
.
├── index.html           # HTML shell — landmarks and mount points
├── config.js            # Instructor-editable configuration
├── css/
│   ├── base.css         # Resets, layout, typography
│   ├── components.css   # Cards, forms, buttons, pills, theme picker
│   └── themes.css       # 6 themes via CSS custom properties
├── js/
│   ├── app.js           # Entry point — boots the app
│   ├── themes.js        # Theme registry, picker, light/dark toggle
│   ├── weightedCalc.js  # The weighted calculator, shared by all section types
│   ├── dom.js           # DOM helpers (element builder, number parsing)
│   └── storage.js       # localStorage helpers with safe failure
└── README.md
```
