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
 *   - separate    : Configuration for the "separate lecture & lab" calculator.
 *   - integrated  : Configuration for the "integrated" weighted-percent calculator.
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
            exams: [
                { id: 'ex1', label: 'Unit 1 Exam', max: 100 },
                { id: 'ex2', label: 'Unit 2 Exam', max: 100 },
                { id: 'ex3', label: 'Unit 3 Exam', max: 100 },
            ],
            finalExam: { id: 'finalLec', label: 'Final Exam', max: 100 },
            replacement: true,
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
