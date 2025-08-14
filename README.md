# Preliminary Microbiology Grade Calculator

**Live site:** https://calebhendren.github.io/micrograde/

> **Disclaimer:** This tool is informational. The **official final letter grade is calculated by the instructor of record**.

## Privacy and data
- All calculations run **client-side** in your browser.
- **No grades are uploaded** or sent to any server.

## Purpose
- Enter scores for lecture and lab components.
- View running totals, current letter grade, and points needed to reach higher thresholds.
- See which **lecture exam** is replaced by the final (if applicable) and which **lab quiz** is dropped.

## Grading logic

### Lecture
- Components: Exam 1 (100), Exam 2 (100), Exam 3 (100), Final (100), Extra Credit (cap **+10**).
- **Replacement rule:** If the final exam score is **greater than the lowest** of Exam 1–3, that **lowest exam is dropped** and the **final counts twice**.  
  Example: 78, 92, 83, Final 99 → becomes 99, 92, 83, 99.
- Lecture base maximum without extra credit: **400**. With extra credit, lecture can exceed base by **up to 10**.

### Lab
- **10 lab quizzes** across Labs 2–6 and 8–12, **5 points each**. The **lowest single quiz** is **dropped** → best 9 count (max **45**).
- Task points: **5**.
- Midterm: **50**.
- Final: **50**.
- Extra Credit (if provided): cap **+5**.
- Lab base maximum without extra credit: **150**. With extra credit, lab can exceed base by **up to 5**.

### Course totals and thresholds
- Course base total (without extra credit): **400 (lecture) + 150 (lab) = 550**.
- Extra credit can raise the numeric total above **550**. Thresholds do **not** change.

**Letter-grade thresholds**
- **A:** 495+
- **B:** 440–494
- **C:** 385–439
- **D:** 330–384
- **F:** <330

## What the app displays
- Which **lecture exam** was replaced by the final (if any).
- Which **lab quiz** was dropped.
- Subtotals for lecture and lab, course total, current letter grade.
- Points needed to reach **A/B/C/D** per the rules above.

## Use
1. Visit https://calebhendren.github.io/micrograde/
2. Enter your scores.

## For instructors

### Fork and adapt
- You may **fork** this repository and adapt point values, extra-credit caps, thresholds, or replacement/drop rules to fit your syllabus.
- Update labels and help text to match your course policy.

### Publish as a GitHub Pages site
- Repository → **Settings** → **Pages**.
- **Build and deployment** → **Source**: *Deploy from a branch*.
- **Branch**: `main`. **Folder**: `/` (root). Save.
- Access at `https://<your-username>.github.io/<repo-name>/`.
