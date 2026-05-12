// Generic points-based grade calculator.
//
// Used by both the "Separate Lecture & Lab" and "Hybrid" modes. The shape of
// each mode is the same — a Lecture card with N components, a Lab card with
// quizzes / skills / other assessments, and an Overall card with a letter
// grade against fixed point thresholds — so a single implementation reads its
// structure from config.

import { el, numberInput, labeledRow, valNum, r2, fmt } from './dom.js';
import { loadJSON, saveJSON, safeRemove } from './storage.js';

export function buildPointsCalc(root, cfg, opts) {
    const { prefix, modeLabel, backButtonId } = opts;
    const id = s => prefix + s;

    const componentIds = cfg.lecture.components.map(c => id(c.id));
    const hasLecQuizzes = !!cfg.lecture.quizzes;
    const lecQuizIds = hasLecQuizzes
        ? Array.from({ length: cfg.lecture.quizzes.count }, (_, i) => id('lq' + (i + 1)))
        : [];
    const lectureAllIds = [...lecQuizIds, ...componentIds];

    const quizIds  = Array.from({ length: cfg.lab.quizzes.count }, (_, i) => id('q' + (i + 1)));
    const skillIds = cfg.lab.skills.map((_, i) => id('sk' + (i + 1)));
    const otherIds = cfg.lab.otherAssessments.map(a => id(a.id));
    const labIds = [...quizIds, ...skillIds, ...otherIds];
    const allIds = [...lectureAllIds, ...labIds];

    const hasReplacement = !!cfg.lecture.replacement;

    // Build DOM ---------------------------------------------------------------
    const toolbar = el('div', { class: 'mode-toolbar' }, [
        el('button', {
            id: backButtonId, class: 'secondary back-btn', type: 'button',
            'aria-label': 'Change section type',
        }, '← Change section type'),
        el('span', { class: 'mode-tag', role: 'status' }, modeLabel),
    ]);

    const lectureRows = cfg.lecture.components.map(c =>
        labeledRow({ id: id(c.id), label: c.label, max: c.max })
    );

    const lecQuizGroup = hasLecQuizzes ? el('div', {
        class: 'box', role: 'group', 'aria-label': cfg.lecture.quizzes.groupLabel,
    }, [
        el('strong', {},
            `${cfg.lecture.quizzes.groupLabel} (${cfg.lecture.quizzes.count}×, 0–${cfg.lecture.quizzes.max} each)`
        ),
        el('div', { class: 'grid quiz-grid', style: 'margin-top:8px' },
            lecQuizIds.map((qid, i) => numberInput({
                id: qid, min: 0, max: cfg.lecture.quizzes.max,
                ariaLabel: `${cfg.lecture.quizzes.ariaPrefix} ${i + 1}`,
            }))
        ),
    ]) : null;

    const lecTotalsRow = hasLecQuizzes ? el('div', { class: 'totals' }, [
        el('div', { class: 'pill' }, [
            `${cfg.lecture.quizzes.groupLabel}: `,
            el('span', { id: id('lecQuizTotal') }, '0'),
            ` / ${cfg.lecture.quizzes.count * cfg.lecture.quizzes.max}`,
        ]),
    ]) : null;

    const lectureCard = el('article', {
        class: 'card left', 'aria-labelledby': `${prefix}lecTitle`,
    }, [
        el('h2', { id: `${prefix}lecTitle` }, [
            cfg.lecture.title, ' ',
            el('span', { class: 'card-subtitle' }, `(${cfg.lecture.maxPoints} pts)`),
        ]),
        cfg.lecture.hint ? el('p', { class: 'hint' }, cfg.lecture.hint) : null,
        lecQuizGroup,
        ...lectureRows,
        hasReplacement
            ? el('div', { class: 'box' }, [
                'Replacement: ',
                el('span', { class: 'mono', id: id('lecReplaceMsg'), 'aria-live': 'polite' }, '—'),
            ])
            : null,
        lecTotalsRow,
        el('div', { class: 'running-total', role: 'status', 'aria-live': 'polite' }, [
            cfg.lecture.title + ': ',
            el('span', { id: id('lecRunning') }, '0'),
            ` / ${cfg.lecture.maxPoints} (`,
            el('span', { id: id('lecPercent') }, '0.00'),
            '%)',
        ]),
        el('div', { class: 'btns' }, [
            el('button', { id: id('resetLecture'), class: 'secondary', type: 'button' }, 'Reset lecture'),
        ]),
    ]);

    const quizGrid = el('div', { class: 'grid quiz-grid', style: 'margin-top:8px' },
        quizIds.map((qid, i) => numberInput({
            id: qid, min: 0, max: cfg.lab.quizzes.max,
            ariaLabel: `${cfg.lab.quizzes.ariaPrefix} ${i + 1}`,
        }))
    );

    const skillsRows = cfg.lab.skills.map((label, i) =>
        labeledRow({ id: id('sk' + (i + 1)), label, max: 1 })
    );

    const otherRows = cfg.lab.otherAssessments.map(a =>
        labeledRow({ id: id(a.id), label: a.label, max: a.max })
    );

    const totalsChildren = [
        el('div', { class: 'pill' }, [
            'Quizzes: ',
            el('span', { id: id('quizTotal') }, '0'),
            ` / ${cfg.lab.quizzes.count * cfg.lab.quizzes.max}`,
        ]),
        el('div', { class: 'pill' }, [
            'Skills: ',
            el('span', { id: id('skillsOut') }, '0'),
            ` / ${cfg.lab.skills.length}`,
        ]),
    ];
    for (const a of cfg.lab.otherAssessments) {
        totalsChildren.push(el('div', { class: 'pill' }, [
            `${a.label}: `,
            el('span', { id: id(a.id + 'Out') }, '0'),
            ` / ${a.max}`,
        ]));
    }

    const labCard = el('article', {
        class: 'card right', 'aria-labelledby': `${prefix}labTitle`,
    }, [
        el('h2', { id: `${prefix}labTitle` }, [
            cfg.lab.title, ' ',
            el('span', { class: 'card-subtitle' }, `(${cfg.lab.maxPoints} pts)`),
        ]),
        el('p', { class: 'hint' },
            `Quizzes 0–${cfg.lab.quizzes.max} each. Skills tests 0–1 each.`
        ),
        el('div', { class: 'box', role: 'group', 'aria-label': cfg.lab.quizzes.groupLabel }, [
            el('strong', {},
                `${cfg.lab.quizzes.groupLabel} (${cfg.lab.quizzes.count}×, 0–${cfg.lab.quizzes.max} each)`
            ),
            quizGrid,
        ]),
        el('div', { class: 'box', role: 'group', 'aria-label': 'Skills tests' }, [
            el('strong', {}, `Skills Tests (${cfg.lab.skills.length}×, 0–1 each)`),
            el('div', { style: 'margin-top:8px' }, skillsRows),
        ]),
        ...otherRows,
        el('div', { class: 'totals' }, totalsChildren),
        el('div', { class: 'running-total', role: 'status', 'aria-live': 'polite' }, [
            cfg.lab.title + ': ',
            el('span', { id: id('labRunning') }, '0'),
            ` / ${cfg.lab.maxPoints} (`,
            el('span', { id: id('labPercent') }, '0.00'),
            '%)',
        ]),
        el('div', { class: 'btns' }, [
            el('button', { id: id('resetLab'), class: 'secondary', type: 'button' }, 'Reset lab'),
        ]),
    ]);

    const overallCard = el('article', {
        class: 'card full', 'aria-labelledby': `${prefix}overallTitle`,
    }, [
        el('h2', { id: `${prefix}overallTitle` }, 'Overall'),
        el('div', { class: 'totals' }, [
            el('div', { class: 'pill' }, [
                'Course total: ',
                el('span', { id: id('courseTotal') }, '0'),
                ` / ${cfg.totalPoints} (`,
                el('span', { id: id('coursePercent') }, '0.00'),
                '%)',
            ]),
            el('div', { class: 'pill' }, [
                'Letter grade: ',
                el('span', { id: id('letter'), class: 'good' }, 'F'),
            ]),
        ]),
        el('div', { class: 'box' }, [
            el('div', { style: 'margin-bottom:6px' }, el('strong', {}, 'Points needed for next thresholds')),
            el('div', {
                id: id('targets'), class: 'mono',
                'aria-live': 'polite',
            }, '—'),
        ]),
        el('div', { class: 'btns' }, [
            el('button', { id: id('resetAll'), type: 'button' }, 'Reset all'),
        ]),
    ]);

    const section = el('section', { class: 'grid' }, [lectureCard, labCard, overallCard]);
    root.replaceChildren(toolbar, section);

    // Compute -----------------------------------------------------------------
    function save() {
        const d = {};
        allIds.forEach(i => { d[i] = document.getElementById(i).value; });
        saveJSON(cfg.storageKey, d);
    }

    function load() {
        const d = loadJSON(cfg.storageKey);
        if (!d) return;
        for (const [k, v] of Object.entries(d)) {
            const node = document.getElementById(k);
            if (node && v) node.value = v;
        }
    }

    function compute() {
        // Lecture quizzes (optional)
        let lecQuizSum = 0;
        if (hasLecQuizzes) {
            for (let i = 1; i <= cfg.lecture.quizzes.count; i++) {
                lecQuizSum += valNum(id('lq' + i), 0, cfg.lecture.quizzes.max);
            }
            document.getElementById(id('lecQuizTotal')).textContent = r2(lecQuizSum);
        }

        // Lecture components
        const componentVals = cfg.lecture.components.map(c => valNum(id(c.id), 0, c.max));
        let lecTotal = componentVals.reduce((a, b) => a + b, 0) + lecQuizSum;

        if (hasReplacement) {
            const rep = cfg.lecture.replacement;
            const sourceIdx = cfg.lecture.components.findIndex(c => c.id === rep.sourceId);
            const replaceableIdxs = rep.replaceableIds
                .map(rid => cfg.lecture.components.findIndex(c => c.id === rid))
                .filter(i => i >= 0);

            if (sourceIdx >= 0 && replaceableIdxs.length > 0) {
                const sourceVal = componentVals[sourceIdx];
                let lowestIdx = replaceableIdxs[0];
                for (const i of replaceableIdxs) {
                    if (componentVals[i] < componentVals[lowestIdx]) lowestIdx = i;
                }
                const lowestVal = componentVals[lowestIdx];
                const msgNode = document.getElementById(id('lecReplaceMsg'));
                if (sourceVal > lowestVal) {
                    lecTotal = lecTotal - lowestVal + sourceVal;
                    msgNode.textContent =
                        `${cfg.lecture.components[sourceIdx].label} replaces ${cfg.lecture.components[lowestIdx].label} (lowest = ${lowestVal}).`;
                } else {
                    msgNode.textContent =
                        `No replacement. ${cfg.lecture.components[sourceIdx].label} not higher than lowest replaceable component.`;
                }
            }
        }

        document.getElementById(id('lecRunning')).textContent = r2(lecTotal);
        document.getElementById(id('lecPercent')).textContent =
            ((lecTotal / cfg.lecture.maxPoints) * 100).toFixed(2);

        // Lab
        let quizSum = 0;
        for (let i = 1; i <= cfg.lab.quizzes.count; i++) {
            quizSum += valNum(id('q' + i), 0, cfg.lab.quizzes.max);
        }
        let skillsSum = 0;
        for (let i = 1; i <= cfg.lab.skills.length; i++) {
            skillsSum += valNum(id('sk' + i), 0, 1);
        }
        const otherVals = cfg.lab.otherAssessments.map(a => valNum(id(a.id), 0, a.max));
        const otherSum = otherVals.reduce((a, b) => a + b, 0);

        const labTotal = quizSum + skillsSum + otherSum;

        document.getElementById(id('quizTotal')).textContent = r2(quizSum);
        document.getElementById(id('skillsOut')).textContent = r2(skillsSum);
        cfg.lab.otherAssessments.forEach((a, i) => {
            document.getElementById(id(a.id + 'Out')).textContent = r2(otherVals[i]);
        });
        document.getElementById(id('labRunning')).textContent = r2(labTotal);
        document.getElementById(id('labPercent')).textContent =
            ((labTotal / cfg.lab.maxPoints) * 100).toFixed(2);

        // Overall
        const course = lecTotal + labTotal;
        document.getElementById(id('courseTotal')).textContent = r2(course);
        document.getElementById(id('coursePercent')).textContent =
            ((course / cfg.totalPoints) * 100).toFixed(2);

        const T = cfg.thresholds;
        const letter =
            course >= T.A ? 'A' :
            course >= T.B ? 'B' :
            course >= T.C ? 'C' :
            course >= T.D ? 'D' : 'F';

        const ls = document.getElementById(id('letter'));
        ls.textContent = letter;
        ls.className =
            letter === 'A' ? 'ok' :
            letter === 'B' ? 'good' :
            letter === 'C' ? 'warn' : 'bad';

        let lines;
        if (letter === 'A')      lines = 'You have an A.';
        else if (letter === 'B') lines = `You have a B. Points to A: ${fmt(T.A - course)}.`;
        else if (letter === 'C') lines = `You have a C. Points to B: ${fmt(T.B - course)}, to A: ${fmt(T.A - course)}.`;
        else if (letter === 'D') lines = `You have a D. Points to C: ${fmt(T.C - course)}, to B: ${fmt(T.B - course)}, to A: ${fmt(T.A - course)}.`;
        else                     lines = `You have an F. Points to D: ${fmt(T.D - course)}, to C: ${fmt(T.C - course)}, to B: ${fmt(T.B - course)}, to A: ${fmt(T.A - course)}.`;
        document.getElementById(id('targets')).textContent = lines;

        save();
    }

    allIds.forEach(i => {
        const node = document.getElementById(i);
        if (node) node.addEventListener('input', compute);
    });

    function clearIds(ids) { ids.forEach(i => { document.getElementById(i).value = ''; }); }
    document.getElementById(id('resetLecture')).addEventListener('click', () => { clearIds(lectureAllIds); compute(); });
    document.getElementById(id('resetLab')).addEventListener('click', () => { clearIds(labIds); compute(); });
    document.getElementById(id('resetAll')).addEventListener('click', () => {
        clearIds(allIds);
        safeRemove(cfg.storageKey);
        compute();
    });

    load();
    compute();

    return { compute };
}
