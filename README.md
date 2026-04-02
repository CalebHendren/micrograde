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

The calculator supports two section formats. On first visit you choose your section type, and the app remembers your choice.

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

## Replacement policy (both modes)

The **Final Exam score replaces the lowest Unit Exam score** if the replacement benefits the student's grade. In integrated mode, comparison is by percentage since exams have different point maximums.

## Skills tests

Both modes break skills tests into five individual assessments (0 or 1 each):

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

## Use

1. Visit <https://calebhendren.github.io/micrograde/>
2. Select your section type.
3. Enter your scores.

## For instructors

### Fork and adapt

- You may **fork** this repository and adapt point values, weights, thresholds, or replacement rules to fit your syllabus.
- Update labels and help text to match your course policy.

### Publish as a GitHub Pages site

1. Repository → **Settings** → **Pages**.
2. **Build and deployment** → **Source**: *Deploy from a branch*.
3. **Branch**: `master`. **Folder**: `/` (root). Save.
4. Access at `https://<your-username>.github.io/<repo-name>/`.
