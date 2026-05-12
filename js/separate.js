// Separate Lecture & Lab calculator.

import { el, numberInput, labeledRow, valNum, r2, fmt } from './dom.js';
import { loadJSON, saveJSON, safeRemove } from './storage.js';

const PREFIX = 'sep-';

function id(suffix) { return PREFIX + suffix; }

export function buildSeparate(root, config) {
    const cfg = config.separate;
    if (!cfg) return null;

    const lectureIds = [
        ...cfg.lecture.exams.map(e => id(e.id)),
        id(cfg.lecture.finalExam.id),
    ];

    const quizIds  = Array.from({ length: cfg.lab.quizzes.count }, (_, i) => id('q' + (i + 1)));
    const skillIds = cfg.lab.skills.map((_, i) => id('sk' + (i + 1)));
    const otherIds = cfg.lab.otherAssessments.map(a => id(a.id));

    const labIds = [...quizIds, ...skillIds, ...otherIds];
    const allIds = [...lectureIds, ...labIds];

    // Build DOM ---------------------------------------------------------------
    const toolbar = el('div', { class: 'mode-toolbar' }, [
        el('button', {
            id: 'backFromSeparate',
            class: 'secondary back-btn',
            type: 'button',
            'aria-label': 'Change section type',
        }, '← Change section type'),
        el('span', { class: 'mode-tag', role: 'status' }, config.modes.separate.label),
    ]);

    // Lecture card
    const lectureRows = cfg.lecture.exams.map(e =>
        labeledRow({ id: id(e.id), label: e.label, max: e.max })
    );
    lectureRows.push(labeledRow({
        id: id(cfg.lecture.finalExam.id),
        label: cfg.lecture.finalExam.label,
        max: cfg.lecture.finalExam.max,
    }));

    const lectureCard = el('article', {
        class: 'card left', 'aria-labelledby': 'sepLecTitle',
    }, [
        el('h2', { id: 'sepLecTitle' }, [
            cfg.lecture.title, ' ',
            el('span', { class: 'card-subtitle' }, `(${cfg.lecture.maxPoints} pts)`),
        ]),
        el('p', { class: 'hint' }, 'Enter raw scores for each assessment.'),
        ...lectureRows,
        cfg.lecture.replacement
            ? el('div', { class: 'box' }, [
                'Replacement: ',
                el('span', { class: 'mono', id: id('lecReplaceMsg'), 'aria-live': 'polite' }, '—'),
            ])
            : null,
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

    // Lab card — quizzes
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
        class: 'card right', 'aria-labelledby': 'sepLabTitle',
    }, [
        el('h2', { id: 'sepLabTitle' }, [
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

    // Overall card
    const overallCard = el('article', {
        class: 'card full', 'aria-labelledby': 'sepOverallTitle',
    }, [
        el('h2', { id: 'sepOverallTitle' }, 'Overall'),
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
        // Lecture
        const examVals = cfg.lecture.exams.map(e => valNum(id(e.id), 0, e.max));
        const finalLec = valNum(id(cfg.lecture.finalExam.id), 0, cfg.lecture.finalExam.max);

        let lecTotal = examVals.reduce((a, b) => a + b, 0) + finalLec;
        let replaced = false;
        let replacedIdx = -1;
        if (cfg.lecture.replacement) {
            const minE = Math.min(...examVals);
            replacedIdx = examVals.indexOf(minE);
            if (finalLec > minE) {
                lecTotal = lecTotal - minE + finalLec;
                replaced = true;
            }
        }

        document.getElementById(id('lecRunning')).textContent = r2(lecTotal);
        document.getElementById(id('lecPercent')).textContent =
            ((lecTotal / cfg.lecture.maxPoints) * 100).toFixed(2);

        if (cfg.lecture.replacement) {
            const msgNode = document.getElementById(id('lecReplaceMsg'));
            msgNode.textContent = replaced
                ? `Final replaces ${cfg.lecture.exams[replacedIdx].label} (lowest = ${examVals[replacedIdx]}).`
                : 'No replacement. Final not higher than lowest exam.';
        }

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

    // Wire up listeners
    allIds.forEach(i => {
        const node = document.getElementById(i);
        if (node) node.addEventListener('input', compute);
    });

    function clearIds(ids) { ids.forEach(i => { document.getElementById(i).value = ''; }); }
    document.getElementById(id('resetLecture')).addEventListener('click', () => { clearIds(lectureIds); compute(); });
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
