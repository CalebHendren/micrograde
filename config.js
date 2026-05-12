/* =============================================================================
 * MicroGrade — Instructor Configuration
 * -----------------------------------------------------------------------------
 * Edit this file to adapt the grade calculator to your course. No build step
 * is required; just save and reload the page (or push to GitHub Pages).
 *
 * Quick reference:
 *   - course      : Page title, subtitle, disclaimer, and source link.
 *   - ui          : Default theme and whether the theme toggle is shown.
 *   - modes       : Which calculator modes are enabled and how they are labeled.
 *   - separate    : "Separate Lecture & Lab" — points-based calculator.
 *   - hybrid      : "Hybrid (Online Lecture + On-Ground Lab)" — points-based.
 *   - integrated  : "Integrated" — weighted-percent calculator.
 *
 * Schema for `separate` and `hybrid` (both use the same points calculator):
 *   storageKey   : Unique localStorage key for that mode.
 *   totalPoints  : Total points in the course.
 *   thresholds   : { A, B, C, D } cut-off points for each letter grade.
 *   lecture      : {
 *     title, maxPoints, hint?,
 *     quizzes?: { count, max, groupLabel, ariaPrefix },  // optional quiz grid
 *     components: [{ id, label, max }, ...],
 *     replacement: null | {
 *       sourceId: '<component id>',      // e.g. the final exam
 *       replaceableIds: ['<id>', ...],   // e.g. unit exams
 *     },
 *   }
 *   lab          : {
 *     title, maxPoints,
 *     quizzes: { count, max, groupLabel, ariaPrefix },
 *     skills: ['Skill 1', 'Skill 2', ...],     // each pass/fail (0–1)
 *     otherAssessments: [{ id, label, max }, ...],
 *   }
 *
 * Valid theme IDs (used by ui.defaultTheme):
 *   'system'          : Follow the visitor's OS light/dark preference.
 *   'light-default'   : Clean light theme (default light).
 *   'sepia'           : Warm cream paper-like light theme.
 *   'light-contrast'  : WCAG AAA high-contrast light theme.
 *   'dracula'         : Purple/cyan dark theme (legacy default).
 *   'nord'            : Cool blue dark theme.
 *   'dark-contrast'   : WCAG AAA high-contrast dark theme.
 * ============================================================================= */

window.MICROGRADE_CONFIG = {
    course: {
        title: 'Preliminary Microbiology Grade Calculator',
        subtitle: 'Your official letter grade will be calculated by your lecture instructor.',
        disclaimer: 'This tool is informational. The official final letter grade is calculated by the instructor of record.',
        sourceUrl: 'https://github.com/CalebHendren/micrograde/',
    },

    ui: {
        defaultTheme: 'system',
        allowThemeToggle: true,
    },

    modes: {
        separate: {
            enabled: true,
            label: 'Separate Lecture & Lab',
            sublabel: '550 total points',
        },
        hybrid: {
            enabled: true,
            label: 'Hybrid (Online Lecture + On-Ground Lab)',
            sublabel: '550 total points',
        },
        integrated: {
            enabled: true,
            label: 'Integrated Lecture/Lab',
            sublabel: 'Weighted percentages',
        },
    },

    separate: {
        storageKey: 'microGradeSepV1',
        totalPoints: 550,

        lecture: {
            title: 'Lecture',
            maxPoints: 400,
            hint: 'Unit Exams and Final are 0–100 each.',
            components: [
                { id: 'ex1',      label: 'Unit 1 Exam', max: 100 },
                { id: 'ex2',      label: 'Unit 2 Exam', max: 100 },
                { id: 'ex3',      label: 'Unit 3 Exam', max: 100 },
                { id: 'finalLec', label: 'Final Exam',  max: 100 },
            ],
            replacement: {
                sourceId: 'finalLec',
                replaceableIds: ['ex1', 'ex2', 'ex3'],
            },
        },

        lab: {
            title: 'Lab',
            maxPoints: 150,
            quizzes: {
                count: 10,
                max: 3,
                groupLabel: 'Lab Quizzes',
                ariaPrefix: 'Quiz',
            },
            skills: [
                'Aseptic Technique',
                'Oil Immersion',
                'Slide Staining',
                'Bacterial Isolation',
                'Biochemical ID',
            ],
            otherAssessments: [
                { id: 'mid',      label: 'Midterm Exam',     max: 50 },
                { id: 'fin',      label: 'Final Exam',       max: 50 },
                { id: 'pathogen', label: 'Pathogen Project', max: 15 },
            ],
        },

        thresholds: { A: 493, B: 438, C: 383, D: 355 },

        footerNote: 'Lecture Final replaces lowest Unit Exam if beneficial. Thresholds: A 493, B 438, C 383, D 355.',
    },

    /* Hybrid: Online Lecture + On-Ground Lab.
     * Based on the BIOL 2230 Hybrid syllabus. No replacement policy. */
    hybrid: {
        storageKey: 'microGradeHybV2',
        totalPoints: 550,

        lecture: {
            title: 'Online Lecture',
            maxPoints: 400,
            hint: 'Enter each online quiz individually (0–10 each). Midterm and Final are proctored on campus.',
            quizzes: {
                count: 10,
                max: 10,
                groupLabel: 'Online Quizzes',
                ariaPrefix: 'Online Quiz',
            },
            components: [
                { id: 'lecMid', label: 'Midterm Exam (proctored)', max: 150 },
                { id: 'lecFin', label: 'Final Exam (proctored)',   max: 150 },
            ],
            replacement: null,
        },

        lab: {
            title: 'On-Ground Lab',
            maxPoints: 150,
            quizzes: {
                count: 10,
                max: 3,
                groupLabel: 'Lab Quizzes',
                ariaPrefix: 'Lab Quiz',
            },
            skills: [
                'Aseptic Technique',
                'Oil Immersion',
                'Slide Staining',
                'Bacterial Isolation',
                'Biochemical ID',
            ],
            otherAssessments: [
                { id: 'mid',      label: 'Practical Midterm Exam', max: 50 },
                { id: 'fin',      label: 'Practical Final Exam',   max: 50 },
                { id: 'pathogen', label: 'Pathogen Project',       max: 15 },
            ],
        },

        thresholds: { A: 493, B: 438, C: 383, D: 355 },

        footerNote: 'Hybrid (Online Lecture + On-Ground Lab): 550 pts. Thresholds: A 493, B 438, C 383, D 355.',
    },

    integrated: {
        storageKey: 'microGradeIntV2',

        exams: [
            { id: 'ex1', label: 'Unit 1 Exam', max: 100, weight: 24 },
            { id: 'ex2', label: 'Unit 2 Exam', max: 75,  weight: 24 },
            { id: 'ex3', label: 'Unit 3 Exam', max: 75,  weight: 24 },
        ],
        finalExam: { id: 'final', label: 'Final Exam', max: 100, weight: 24 },
        replacement: true,

        skills: {
            weight: 1,
            items: [
                'Aseptic Technique',
                'Oil Immersion',
                'Slide Staining',
                'Bacterial Isolation',
                'Biochemical ID',
            ],
        },

        project: { id: 'pathogen', label: 'Pathogen Project', max: 15, weight: 3 },

        thresholds: { A: 90, B: 80, C: 70, D: 65 },

        footerNote: 'Final Exam replaces lowest Unit Exam if beneficial. Weights: Exams 24% each, Pathogen 3%, Skills 1%.',
    },
};
