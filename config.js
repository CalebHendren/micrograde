/* =============================================================================
 * MicroGrade — Instructor Configuration
 * -----------------------------------------------------------------------------
 * Edit this file to adapt the grade calculator to your course. No build step
 * is required; just save and reload the page (or push to GitHub Pages).
 *
 * Quick reference:
 *   course    : Page title, subtitle, disclaimer, and source link.
 *   ui        : Default theme and whether the theme toggle is shown.
 *   modes     : Which section types are enabled and how they are labeled.
 *   onground  : "On-Ground Lecture / Lab"
 *   hybrid    : "Hybrid (Online Lecture + On-Ground Lab)"
 *   online    : "Fully Online Lecture / Lab"
 *
 * All three section types use the same weighted calculator. Every graded item
 * carries two numbers:
 *
 *   points : the raw score the student enters (0 to this maximum)
 *   weight : how many percentage points of the final grade the item is worth
 *
 * Students only ever see and type the points. The weight does the arithmetic
 * in the background: score / points x weight = percentage points earned. The
 * weights of all graded items in a section must add up to 100.
 *
 * Schema for each section type:
 *   storageKey  : Unique localStorage key for that section type.
 *   lecture     : { title, hint?, groups: [...], replacement: null | {...} }
 *   lab         : { title, hint?, groups: [...] }
 *   extraCredit : null | { title, hint?, items: [...] }
 *   thresholds  : { A, B, C, D } minimum course percentage for each letter.
 *   footerNote  : One-line summary shown in the page footer.
 *
 * A group is one row of the syllabus grading table:
 *   { id, title, layout, items: [{ id, label, points, weight }, ...] }
 *   layout 'rows' : one labeled input per item (exams, skills, single items).
 *   layout 'grid' : a compact numbered grid (quizzes, at-home labs).
 *
 * A replacement block lets one exam stand in for a weaker one:
 *   { sourceId: 'finalLec', replaceableIds: ['ex1', 'ex2', 'ex3'] }
 *   The source's percentage replaces the lowest replaceable percentage when
 *   that helps, keeping the replaced item's own weight. Set to null to turn
 *   the policy off.
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

(function () {
    /* Build a numbered run of identical items:
     * series('lq', 'Lecture Quiz', 10, 20, 1.4) makes Lecture Quiz 1..10,
     * each worth 20 points and 1.4 percentage points of the final grade. */
    function series(idPrefix, label, count, points, weight) {
        return Array.from({ length: count }, (_, i) => ({
            id: idPrefix + (i + 1),
            label: `${label} ${i + 1}`,
            points,
            weight,
        }));
    }

    /* The on-ground lab is shared by the On-Ground and Hybrid section types.
     * Built fresh on each call so the two copies stay independent. */
    function onGroundLab() {
        return {
            title: 'Lab',
            hint: 'Skills tests are pass/fail — enter 1 for pass, 0 for fail.',
            groups: [
                {
                    id: 'labSkills',
                    title: 'Lab Skills',
                    layout: 'rows',
                    items: [
                        { id: 'skTransfer',  label: 'Transfer',   points: 1, weight: 0.2 },
                        { id: 'skOil',       label: 'Oil',        points: 1, weight: 0.2 },
                        { id: 'skGram',      label: 'Gram Stain', points: 1, weight: 0.2 },
                        { id: 'skStreak',    label: 'Streak',     points: 1, weight: 0.2 },
                        { id: 'skUnknowns',  label: 'Unknowns',   points: 1, weight: 0.2 },
                    ],
                },
                {
                    id: 'labQuizzes',
                    title: 'Lab Quizzes',
                    layout: 'grid',
                    items: series('labq', 'Lab Quiz', 10, 5, 0.6),
                },
                {
                    id: 'pathogen',
                    title: 'Pathogen Project',
                    layout: 'rows',
                    items: [
                        { id: 'pathogen', label: 'Pathogen Project', points: 15, weight: 3 },
                    ],
                },
                {
                    id: 'labPractical',
                    title: 'Lab Practical Exam',
                    layout: 'rows',
                    items: [
                        { id: 'labPractical', label: 'Lab Practical Exam', points: 100, weight: 20 },
                    ],
                },
            ],
        };
    }

    /* The online lecture is shared by the Hybrid and Fully Online section
     * types: two proctored exams plus ten quizzes. */
    function onlineLecture() {
        return {
            title: 'Lecture',
            hint: 'Enter each lecture quiz individually.',
            groups: [
                {
                    id: 'lecExams',
                    title: 'Lecture Exams',
                    layout: 'rows',
                    items: [
                        { id: 'lecMid', label: 'Midterm Exam', points: 100, weight: 28 },
                        { id: 'lecFin', label: 'Final Exam',   points: 100, weight: 28 },
                    ],
                },
                {
                    id: 'lecQuizzes',
                    title: 'Lecture Quizzes',
                    layout: 'grid',
                    items: series('lq', 'Lecture Quiz', 10, 20, 1.4),
                },
            ],
            replacement: null,
        };
    }

    /* Every extra-credit item is worth 2 points and 0.4 percentage points on
     * top of the 100 available from graded work. */
    function ec(id, label) {
        return { id, label, points: 2, weight: 0.4 };
    }

    /* Copied into each section type below, so changing one section's cutoffs
     * does not move the others. */
    const THRESHOLDS = { A: 90, B: 80, C: 70, D: 65 };

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
            onground: {
                enabled: true,
                label: 'On-Ground Lecture / Lab',
                sublabel: 'Lecture and lab both on campus',
            },
            hybrid: {
                enabled: true,
                label: 'Hybrid (Online Lecture + On-Ground Lab)',
                sublabel: 'Online lecture, lab on campus',
            },
            online: {
                enabled: true,
                label: 'Fully Online Lecture / Lab',
                sublabel: 'Online lecture, at-home labs',
            },
        },

        /* On-ground sections. Covers both the separate and the integrated
         * course layouts, since both are graded on the same weights. */
        onground: {
            storageKey: 'microGradeOnGroundW1',

            lecture: {
                title: 'Lecture',
                groups: [
                    {
                        id: 'lecExams',
                        title: 'Lecture Exams',
                        layout: 'rows',
                        items: [
                            { id: 'ex1',      label: 'Unit 1 Exam', points: 50,  weight: 17 },
                            { id: 'ex2',      label: 'Unit 2 Exam', points: 50,  weight: 17 },
                            { id: 'ex3',      label: 'Unit 3 Exam', points: 50,  weight: 17 },
                            { id: 'finalLec', label: 'Final Exam',  points: 100, weight: 19 },
                        ],
                    },
                ],
                /* Set to null to drop the policy. */
                replacement: {
                    sourceId: 'finalLec',
                    replaceableIds: ['ex1', 'ex2', 'ex3'],
                },
            },

            lab: onGroundLab(),

            extraCredit: null,

            thresholds: { ...THRESHOLDS },

            footerNote: 'On-Ground Lecture / Lab: lecture exams 70%, lab practical 20%, lab quizzes 6%, pathogen project 3%, lab skills 1%.',
        },

        /* Hybrid: online lecture, on-ground lab. */
        hybrid: {
            storageKey: 'microGradeHybridW1',

            lecture: onlineLecture(),
            lab: onGroundLab(),

            extraCredit: {
                title: 'Extra Credit',
                hint: 'Optional. These add to your grade on top of the 100% above.',
                items: [
                    ec('ecIntro',    'Student Intro'),
                    ec('ecMidSched', 'Midterm Scheduling'),
                    ec('ecFinSched', 'Final Exam Scheduling'),
                ],
            },

            thresholds: { ...THRESHOLDS },

            footerNote: 'Hybrid: lecture exams 56%, lab practical 20%, lecture quizzes 14%, lab quizzes 6%, pathogen project 3%, lab skills 1%.',
        },

        /* Fully online: online lecture, at-home labs. */
        online: {
            storageKey: 'microGradeOnlineW1',

            lecture: onlineLecture(),

            lab: {
                title: 'Lab',
                hint: 'Each at-home lab is worth 30 points.',
                groups: [
                    {
                        id: 'atHomeLabs',
                        title: 'At-Home Labs',
                        layout: 'grid',
                        items: series('lab', 'Lab', 10, 30, 3),
                    },
                ],
            },

            extraCredit: {
                title: 'Extra Credit',
                hint: 'Optional. These add to your grade on top of the 100% above.',
                items: [
                    ec('ecIntro',     'Student Intro'),
                    ec('ecMidSched',  'Midterm Scheduling'),
                    ec('ecFinSched',  'Final Exam Scheduling'),
                    ec('ecKitOrder',  'Lab Kit Ordering'),
                    ec('ecKitDeliv',  'Lab Kit Delivery'),
                ],
            },

            thresholds: { ...THRESHOLDS },

            footerNote: 'Fully Online: lecture exams 56%, at-home labs 30%, lecture quizzes 14%.',
        },
    };
})();
