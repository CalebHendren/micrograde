// Integrated weighted-percent calculator.

import { el, labeledRow, readInput, fmt } from './dom.js';
import { loadJSON, saveJSON, safeRemove } from './storage.js';

const PREFIX = 'int-';

function id(suffix) { return PREFIX + suffix; }

export function buildIntegrated(root, config) {
    const cfg = config.integrated;
    if (!cfg) return null;

    const examIds  = cfg.exams.map(e => id(e.id));
    const finalId  = id(cfg.finalExam.id);
    const skillIds = cfg.skills.items.map((_, i) => id('sk' + (i + 1)));
    const projectId = id(cfg.project.id);
    const allIds = [...examIds, finalId, projectId, ...skillIds];

    // Build DOM ---------------------------------------------------------------
    const toolbar = el('div', { class: 'mode-toolbar' }, [
        el('button', {
            id: 'backFromIntegrated',
            class: 'secondary back-btn',
            type: 'button',
            'aria-label': 'Change section type',
        }, '← Change section type'),
        el('span', { class: 'mode-tag', role: 'status' }, config.modes.integrated.label),
    ]);

    const totalExamWeight = cfg.exams.reduce((s, e) => s + e.weight, 0) + cfg.finalExam.weight;

    const examRows = cfg.exams.map(e =>
        labeledRow({ id: id(e.id), label: `${e.label}`, max: e.max })
    );
    examRows.push(labeledRow({
        id: finalId, label: cfg.finalExam.label, max: cfg.finalExam.max,
    }));

    const skillRows = cfg.skills.items.map((label, i) =>
        labeledRow({ id: id('sk' + (i + 1)), label, max: 1 })
    );

    const inputsCard = el('article', {
        class: 'card left', 'aria-labelledby': 'intInputTitle',
    }, [
        el('h2', { id: 'intInputTitle' }, 'Assessments'),
        el('p', { class: 'hint' }, 'Enter raw scores. Skills tests are pass/fail (0 or 1).'),

        el('h3', { class: 'section-heading' }, [
            'Exams ',
            el('span', { style: 'font-weight:normal' }, `(${totalExamWeight}% total)`),
        ]),
        ...examRows,

        cfg.replacement
            ? el('div', { class: 'box' }, [
                'Replacement: ',
                el('span', { class: 'mono', id: id('replaceMsg'), 'aria-live': 'polite' }, '—'),
            ])
            : null,

        el('div', { class: 'box', role: 'group', 'aria-label': 'Skills tests' }, [
            el('strong', {}, `Skills Tests (${cfg.skills.items.length}×, pass/fail, ${cfg.skills.weight}% total)`),
            el('div', { style: 'margin-top:8px' }, skillRows),
        ]),

        el('h3', { class: 'section-heading' }, [
            cfg.project.label, ' ',
            el('span', { style: 'font-weight:normal' }, `(${cfg.project.weight}%)`),
        ]),
        labeledRow({ id: projectId, label: 'Score', max: cfg.project.max }),

        el('div', { class: 'btns' }, [
            el('button', { id: id('resetAll'), type: 'button' }, 'Reset all'),
        ]),
    ]);

    const resultsCard = el('article', {
        class: 'card right', 'aria-labelledby': 'intResultsTitle',
    }, [
        el('h2', { id: 'intResultsTitle' }, 'Results'),
        el('div', { class: 'grade-display', role: 'status', 'aria-live': 'polite' }, [
            el('div', { class: 'detail' }, 'Weighted Course Average'),
            el('div', { class: 'big', id: id('coursePercent') }, '0.00%'),
            el('div', { class: 'detail' }, [
                'Letter Grade: ',
                el('strong', {}, el('span', { id: id('letter'), class: 'bad' }, 'F')),
            ]),
        ]),
        el('div', { class: 'box', style: 'margin-top:12px' }, [
            el('div', { style: 'margin-bottom:8px' }, el('strong', {}, 'Weighted Breakdown')),
            el('div', { id: id('breakdown') }),
        ]),
        el('div', { class: 'box' }, [
            el('div', { style: 'margin-bottom:6px' }, el('strong', {}, 'Points to next grade')),
            el('div', {
                id: id('targets'),
                class: 'mono',
                style: 'font-size:13px; white-space:pre-line',
                'aria-live': 'polite',
            }, '—'),
        ]),
        el('div', { class: 'box', style: 'font-size:13px; color:var(--muted)' }, [
            el('strong', { style: 'color:var(--text)' }, 'Grade scale'),
            el('br', {}),
            `A: ≥${cfg.thresholds.A}%   B: ≥${cfg.thresholds.B}%   C: ≥${cfg.thresholds.C}%   D: ≥${cfg.thresholds.D}%   F: below ${cfg.thresholds.D}%`,
        ]),
    ]);

    const section = el('section', { class: 'grid' }, [inputsCard, resultsCard]);
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
        // Raw → percentage for each exam component
        const examPcts = cfg.exams.map(e => {
            const raw = readInput(id(e.id));
            return raw === null
                ? { name: e.label, raw: null, max: e.max, score: null, replaced: false, weight: e.weight }
                : { name: e.label, raw, max: e.max, score: (raw / e.max) * 100, replaced: false, weight: e.weight };
        });

        const finalRaw = readInput(finalId);
        const finalPct = finalRaw === null ? null : (finalRaw / cfg.finalExam.max) * 100;

        const projectRaw = readInput(projectId);
        const projectPct = projectRaw === null ? null : (projectRaw / cfg.project.max) * 100;

        let skillsEntered = 0, skillsSum = 0;
        for (let i = 1; i <= cfg.skills.items.length; i++) {
            const v = readInput(id('sk' + i));
            if (v !== null) { skillsEntered++; skillsSum += v; }
        }
        const skillsPct = skillsEntered > 0 ? (skillsSum / cfg.skills.items.length) * 100 : null;

        // Replacement logic
        let replaceMsg = '';
        if (cfg.replacement) {
            const entered = examPcts.filter(e => e.score !== null);
            if (finalPct !== null && entered.length > 0) {
                let lowest = entered[0];
                for (let i = 1; i < entered.length; i++) {
                    if (entered[i].score < lowest.score) lowest = entered[i];
                }
                if (finalPct > lowest.score) {
                    const idx = examPcts.indexOf(lowest);
                    examPcts[idx] = { ...lowest, score: finalPct, replaced: true };
                    replaceMsg = `Final (${finalPct.toFixed(1)}%) replaces ${lowest.name} (${lowest.raw}/${lowest.max} = ${lowest.score.toFixed(1)}%).`;
                } else {
                    replaceMsg = 'No replacement. Final ≤ lowest unit exam (by %).';
                }
            } else {
                replaceMsg = 'Enter Final + at least one unit exam to evaluate.';
            }
            const node = document.getElementById(id('replaceMsg'));
            if (node) node.textContent = replaceMsg;
        }

        // Components for breakdown
        const components = [
            ...examPcts.map(e => ({
                name: e.replaced ? `${e.name} (replaced)` : e.name,
                score: e.score, weight: e.weight,
            })),
            { name: cfg.finalExam.label, score: finalPct,   weight: cfg.finalExam.weight },
            { name: cfg.project.label,   score: projectPct, weight: cfg.project.weight   },
            { name: 'Skills Tests',      score: skillsPct,  weight: cfg.skills.weight    },
        ];

        let totalWeighted = 0, totalWeightEntered = 0;
        const breakdownNodes = components.map(c => {
            const entered = c.score !== null;
            const contrib = entered ? (c.score * c.weight / 100) : 0;
            if (entered) { totalWeighted += contrib; totalWeightEntered += c.weight; }
            return el('div', {
                class: 'breakdown-row' + (entered ? '' : ' empty'),
            }, [
                el('span', { class: 'label' }, [
                    c.name, ' ',
                    el('span', { class: 'weight-note' }, `(${c.weight}%)`),
                ]),
                el('span', { class: 'pct' }, entered ? c.score.toFixed(1) + '%' : '—'),
                el('span', { class: 'contrib' }, entered ? contrib.toFixed(2) + '%' : '—'),
            ]);
        });
        const breakdown = document.getElementById(id('breakdown'));
        breakdown.replaceChildren(...breakdownNodes);

        const allEntered = totalWeightEntered === 100;
        const coursePct = totalWeightEntered > 0 ? (totalWeighted / totalWeightEntered) * 100 : 0;
        const courseActual = totalWeighted;
        const displayPct = allEntered ? courseActual : coursePct;

        document.getElementById(id('coursePercent')).textContent = displayPct.toFixed(2) + '%';

        const T = cfg.thresholds;
        const letter =
            displayPct >= T.A ? 'A' :
            displayPct >= T.B ? 'B' :
            displayPct >= T.C ? 'C' :
            displayPct >= T.D ? 'D' : 'F';

        const ls = document.getElementById(id('letter'));
        ls.textContent = letter;
        ls.className =
            letter === 'A' ? 'ok' :
            letter === 'B' ? 'good' :
            letter === 'C' ? 'warn' : 'bad';

        let targetText = '';
        if (allEntered) {
            if (letter === 'A')      targetText = 'You have an A.';
            else if (letter === 'B') targetText = `You have a B. Need ${fmt(T.A - courseActual)} more percentage points for an A.`;
            else if (letter === 'C') targetText = `You have a C. To B: ${fmt(T.B - courseActual)}, to A: ${fmt(T.A - courseActual)}.`;
            else if (letter === 'D') targetText = `You have a D. To C: ${fmt(T.C - courseActual)}, to B: ${fmt(T.B - courseActual)}, to A: ${fmt(T.A - courseActual)}.`;
            else                     targetText = `You have an F. To D: ${fmt(T.D - courseActual)}, to C: ${fmt(T.C - courseActual)}, to B: ${fmt(T.B - courseActual)}, to A: ${fmt(T.A - courseActual)}.`;
        } else if (totalWeightEntered > 0) {
            const remaining = 100 - totalWeightEntered;
            const neededFor = t => {
                const gap = t - totalWeighted;
                if (gap <= 0) return null;
                return (gap / remaining) * 100;
            };
            const lines = [
                `Entered ${totalWeightEntered}% of grade weight. ${remaining}% remaining.`,
                `Current weighted average: ${coursePct.toFixed(2)}%.`,
            ];
            ['A', 'B', 'C', 'D'].forEach(g => {
                const avg = neededFor(T[g]);
                if (avg === null) lines.push(`${g}: Already secured.`);
                else if (avg > 100) lines.push(`${g}: Need ${avg.toFixed(1)}% avg on remaining (not possible).`);
                else lines.push(`${g}: Need ${avg.toFixed(1)}% avg on remaining ${remaining}%.`);
            });
            targetText = lines.join('\n');
        } else {
            targetText = 'Enter scores to see projections.';
        }
        document.getElementById(id('targets')).textContent = targetText;

        save();
    }

    allIds.forEach(i => {
        const node = document.getElementById(i);
        if (node) node.addEventListener('input', compute);
    });

    document.getElementById(id('resetAll')).addEventListener('click', () => {
        allIds.forEach(i => { document.getElementById(i).value = ''; });
        safeRemove(cfg.storageKey);
        compute();
    });

    load();
    compute();

    return { compute };
}
