// Weighted grade calculator shared by every section type.
//
// Each graded item carries a point value and a weight. The student types the
// points they earned; the weight never appears as an input. Behind the scenes
// each item contributes (score / points) x weight percentage points, and the
// weights of all graded items in a section add up to 100.
//
// The page is three cards: Lecture on the left, Lab on the right, and Overall
// underneath with the letter grade, a weighted breakdown, and projections.

import { el, numberInput, labeledRow, valNum, r2, fmt } from './dom.js';
import { loadJSON, saveJSON, safeRemove } from './storage.js';

// Weights like 1.4 x 10 do not land exactly on 14 in binary floating point,
// so weight sums are compared with a tolerance rather than for equality.
const WEIGHT_TOLERANCE = 0.01;

const sum = (arr, f) => arr.reduce((acc, x) => acc + f(x), 0);
const groupWeight = g => sum(g.items, i => i.weight);
const groupPoints = g => sum(g.items, i => i.points);

export function buildWeightedCalc(root, cfg, opts) {
    const { prefix, modeLabel, backButtonId } = opts;
    const id = s => prefix + s;

    const lectureGroups = cfg.lecture.groups;
    const labGroups = cfg.lab ? cfg.lab.groups : [];
    const gradedGroups = [...lectureGroups, ...labGroups];
    const gradedItems = gradedGroups.flatMap(g => g.items);
    const ecItems = cfg.extraCredit ? cfg.extraCredit.items : [];
    const allItems = [...gradedItems, ...ecItems];

    const itemsById = new Map(allItems.map(it => [it.id, it]));
    const labelOf = itemId => (itemsById.get(itemId) || {}).label || itemId;

    const lectureIds = lectureGroups.flatMap(g => g.items.map(i => id(i.id)));
    const labIds = labGroups.flatMap(g => g.items.map(i => id(i.id)));
    const ecIds = ecItems.map(i => id(i.id));
    const allIds = [...lectureIds, ...labIds, ...ecIds];

    const totalWeight = sum(gradedItems, i => i.weight);
    if (Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE) {
        console.warn(
            `MicroGrade: "${modeLabel}" graded weights add up to ${r2(totalWeight)}, not 100. ` +
            'Check the weight values in config.js.'
        );
    }

    const replacement = cfg.lecture.replacement || null;

    // Build DOM ---------------------------------------------------------------
    const toolbar = el('div', { class: 'mode-toolbar' }, [
        el('button', {
            id: backButtonId, class: 'secondary back-btn', type: 'button',
            'aria-label': 'Change section type',
        }, '← Change section type'),
        el('span', { class: 'mode-tag', role: 'status' }, modeLabel),
    ]);

    // A group renders as a weighted heading plus either labeled rows or a
    // compact numbered grid. Single-item groups label the input "Score", since
    // the heading above it already carries the assessment name.
    function renderGroup(g, showWeight) {
        const heading = el('h3', { class: 'section-heading' }, [
            g.title,
            showWeight ? ' ' : null,
            showWeight
                ? el('span', { class: 'weight-note' }, `${r2(groupWeight(g))}% of overall grade`)
                : null,
        ]);

        if (g.layout === 'grid') {
            const each = g.items[0];
            return [heading, el('div', {
                class: 'box', role: 'group', 'aria-label': g.title,
            }, [
                el('span', { class: 'hint', style: 'margin:0' },
                    `${g.items.length} total, 0–${each.points} points each`),
                el('div', { class: 'grid quiz-grid', style: 'margin-top:8px' },
                    g.items.map(it => numberInput({
                        id: id(it.id), min: 0, max: it.points, ariaLabel: it.label,
                    }))
                ),
            ])];
        }

        const soloItem = g.items.length === 1 && g.items[0].label === g.title;
        return [heading, ...g.items.map(it => labeledRow({
            id: id(it.id),
            label: soloItem ? 'Score' : it.label,
            max: it.points,
        }))];
    }

    function groupPill(g) {
        return el('div', { class: 'pill' }, [
            `${g.title}: `,
            el('span', { id: id(g.id + 'Out') }, '0'),
            ` / ${groupPoints(g)} pts`,
        ]);
    }

    function buildCard(spec, groups, side, titleId, runningId, weightId, extras) {
        const weight = r2(sum(groups, groupWeight));
        return el('article', { class: `card ${side}`, 'aria-labelledby': titleId }, [
            el('h2', { id: titleId }, [
                spec.title, ' ',
                el('span', { class: 'card-subtitle' }, `${weight}% of overall grade`),
            ]),
            spec.hint ? el('p', { class: 'hint' }, spec.hint) : null,
            ...groups.flatMap(g => renderGroup(g, groups.length > 1)),
            ...(extras || []),
            el('div', { class: 'totals' }, groups.map(groupPill)),
            el('div', { class: 'running-total', role: 'status', 'aria-live': 'polite' }, [
                `${spec.title}: `,
                el('span', { id: runningId }, '0.00'),
                ' of ',
                el('span', { id: weightId }, String(weight)),
                el('span', { class: 'running-note' }, ' points of your final grade'),
            ]),
        ]);
    }

    const replacementBox = replacement ? el('div', { class: 'box' }, [
        'Replacement: ',
        el('span', { class: 'mono', id: id('replaceMsg'), 'aria-live': 'polite' }, '—'),
    ]) : null;

    const lectureCard = buildCard(
        cfg.lecture, lectureGroups, 'left',
        `${prefix}lecTitle`, id('lecRunning'), id('lecWeight'),
        [replacementBox]
    );

    const labCard = buildCard(
        cfg.lab, labGroups, 'right',
        `${prefix}labTitle`, id('labRunning'), id('labWeight'),
        []
    );

    const ecMaxWeight = r2(sum(ecItems, i => i.weight));

    const extraCreditCard = cfg.extraCredit ? el('article', {
        class: 'card full', 'aria-labelledby': `${prefix}ecTitle`,
    }, [
        el('h2', { id: `${prefix}ecTitle` }, [
            cfg.extraCredit.title, ' ',
            el('span', { class: 'card-subtitle' }, `up to +${ecMaxWeight}% on top`),
        ]),
        cfg.extraCredit.hint ? el('p', { class: 'hint' }, cfg.extraCredit.hint) : null,
        el('div', { class: 'ec-rows' },
            ecItems.map(it => labeledRow({ id: id(it.id), label: it.label, max: it.points }))
        ),
        el('div', { class: 'totals' }, [
            el('div', { class: 'pill' }, [
                'Earned: +',
                el('span', { id: id('ecOut') }, '0.00'),
                ` of +${ecMaxWeight}%`,
            ]),
        ]),
    ]) : null;

    const overallCard = el('article', {
        class: 'card full', 'aria-labelledby': `${prefix}overallTitle`,
    }, [
        el('h2', { id: `${prefix}overallTitle` }, 'Overall'),
        el('div', { class: 'grade-display', role: 'status', 'aria-live': 'polite' }, [
            el('div', { class: 'detail' }, 'Course grade, counting work you have not entered as zero'),
            el('div', { class: 'big', id: id('coursePercent') }, '0.00%'),
            el('div', { class: 'detail' }, [
                'Letter grade: ',
                el('strong', {}, el('span', { id: id('letter'), class: 'bad' }, 'F')),
            ]),
        ]),
        el('div', { class: 'box' }, [
            el('div', { style: 'margin-bottom:8px' }, el('strong', {}, 'Weighted breakdown')),
            el('div', { class: 'breakdown-row breakdown-head' }, [
                el('span', { class: 'label' }, 'Category'),
                el('span', { class: 'pct' }, 'Your score'),
                el('span', { class: 'contrib' }, 'Counts for'),
            ]),
            el('div', { id: id('breakdown') }),
        ]),
        el('div', { id: id('targetsBox'), class: 'box' }, [
            el('div', { style: 'margin-bottom:6px' }, el('strong', {}, 'What you need from here')),
            el('div', {
                id: id('targets'), class: 'mono',
                style: 'font-size:13px; white-space:pre-line',
                'aria-live': 'polite',
            }, '—'),
        ]),
        el('div', { id: id('currentScoreBox'), class: 'box' }, [
            el('div', { style: 'margin-bottom:6px' }, el('strong', {}, 'Current score (entered assessments only)')),
            el('div', {
                id: id('currentScore'), class: 'mono',
                style: 'font-size:13px',
                'aria-live': 'polite',
            }, '—'),
            el('p', { class: 'hint', style: 'margin-top:6px' },
                'This is your average across the work you have entered so far — not your final grade. It leaves out assessments you have not entered, while the course grade above counts them as zero. Your final letter grade depends on every remaining assessment.'
            ),
        ]),
        el('div', { class: 'box', style: 'font-size:13px; color:var(--muted)' }, [
            el('strong', { style: 'color:var(--text)' }, 'Grade scale'),
            el('br', {}),
            `A: ≥${cfg.thresholds.A}%   B: ≥${cfg.thresholds.B}%   C: ≥${cfg.thresholds.C}%   D: ≥${cfg.thresholds.D}%   F: below ${cfg.thresholds.D}%`,
        ]),
        el('div', { class: 'btns' }, [
            el('button', { id: id('resetAll'), type: 'button' }, 'Reset all'),
        ]),
    ]);

    const debugFillBtn = el('button', {
        type: 'button',
        class: 'debug-fill-btn',
        'aria-label': 'Debugging Button Please Ignore',
    }, 'Fill');

    debugFillBtn.addEventListener('click', () => {
        for (const it of allItems) {
            const node = document.getElementById(id(it.id));
            if (node) node.value = Math.floor(Math.random() * (it.points + 1));
        }
        compute();
    });

    const section = el('section', { class: 'grid' }, [lectureCard, labCard, extraCreditCard, overallCard]);
    root.style.position = 'relative';
    root.replaceChildren(debugFillBtn, toolbar, section);

    // Compute -----------------------------------------------------------------
    function save() {
        const d = {};
        allIds.forEach(i => {
            const node = document.getElementById(i);
            if (node) d[i] = node.value;
        });
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

    // Read every input once. An empty box is "not entered yet" rather than a
    // zero, which is what separates the course grade from the current score.
    function readAll() {
        const state = new Map();
        for (const it of allItems) {
            const node = document.getElementById(id(it.id));
            const entered = !!node && node.value.trim() !== '';
            const raw = entered ? valNum(id(it.id), 0, it.points) : 0;
            state.set(it.id, { entered, raw, pct: entered ? raw / it.points : null });
        }
        return state;
    }

    // The final exam's percentage stands in for the weakest unit exam when
    // that helps. The replaced item keeps its own weight; only the percentage
    // changes. Unentered exams are left out so an untaken exam is not
    // "improved" by a final the student has already sat.
    function applyReplacement(state, effective) {
        if (!replacement) return new Set();

        const source = state.get(replacement.sourceId);
        const candidates = replacement.replaceableIds
            .map(rid => ({ rid, entry: state.get(rid) }))
            .filter(c => c.entry && c.entry.entered);

        const node = document.getElementById(id('replaceMsg'));
        const srcLabel = labelOf(replacement.sourceId);
        const pctText = p => (p * 100).toFixed(1) + '%';

        if (!source || !source.entered || candidates.length === 0) {
            node.textContent = `Enter your ${srcLabel} and at least one unit exam to see whether this applies.`;
            return new Set();
        }

        let lowest = candidates[0];
        for (const c of candidates) {
            if (c.entry.pct < lowest.entry.pct) lowest = c;
        }

        if (source.pct > lowest.entry.pct) {
            effective.set(lowest.rid, source.pct);
            node.textContent =
                `${srcLabel} (${pctText(source.pct)}) replaces ${labelOf(lowest.rid)} (${pctText(lowest.entry.pct)}).`;
            return new Set([lowest.rid]);
        }

        node.textContent = `No replacement. Your ${srcLabel} is not higher than your lowest unit exam.`;
        return new Set();
    }

    function compute() {
        const state = readAll();

        const effective = new Map(gradedItems.map(it => [it.id, state.get(it.id).pct]));
        const replaced = applyReplacement(state, effective);

        const contribOf = it => (effective.get(it.id) ?? 0) * it.weight;

        // Per-group and per-card totals
        const groupStats = new Map();
        for (const g of gradedGroups) {
            const earned = sum(g.items, it => state.get(it.id).raw);
            const contrib = sum(g.items, contribOf);
            const enteredWeight = sum(g.items, it => state.get(it.id).entered ? it.weight : 0);
            const enteredContrib = sum(g.items, it => state.get(it.id).entered ? contribOf(it) : 0);
            groupStats.set(g.id, { earned, contrib, enteredWeight, enteredContrib });
            document.getElementById(id(g.id + 'Out')).textContent = r2(earned);
        }

        const cardTotal = groups => r2(sum(groups, g => groupStats.get(g.id).contrib));
        document.getElementById(id('lecRunning')).textContent = cardTotal(lectureGroups).toFixed(2);
        document.getElementById(id('labRunning')).textContent = cardTotal(labGroups).toFixed(2);

        // Extra credit rides on top of the 100 points of graded weight.
        const ecEarned = sum(ecItems, it => (state.get(it.id).pct ?? 0) * it.weight);
        if (cfg.extraCredit) {
            document.getElementById(id('ecOut')).textContent = ecEarned.toFixed(2);
        }

        const gradedContrib = sum(gradedGroups, g => groupStats.get(g.id).contrib);
        const coursePct = gradedContrib + ecEarned;

        const enteredWeight = sum(gradedGroups, g => groupStats.get(g.id).enteredWeight);
        const enteredContrib = sum(gradedGroups, g => groupStats.get(g.id).enteredContrib);
        const allEntered = gradedItems.every(it => state.get(it.id).entered);

        document.getElementById(id('coursePercent')).textContent = coursePct.toFixed(2) + '%';

        const T = cfg.thresholds;
        const letterFor = p =>
            p >= T.A ? 'A' :
            p >= T.B ? 'B' :
            p >= T.C ? 'C' :
            p >= T.D ? 'D' : 'F';
        const classFor = l =>
            l === 'A' ? 'ok' :
            l === 'B' ? 'good' :
            l === 'C' ? 'warn' : 'bad';

        const letter = letterFor(coursePct);
        const letterNode = document.getElementById(id('letter'));
        letterNode.textContent = letter;
        letterNode.className = classFor(letter);

        // Weighted breakdown, one row per grading category
        const rows = gradedGroups.map(g => {
            const st = groupStats.get(g.id);
            const weight = r2(groupWeight(g));
            const anyEntered = st.enteredWeight > 0;
            const pct = anyEntered ? (st.enteredContrib / st.enteredWeight) * 100 : null;
            const replacedHere = g.items.some(it => replaced.has(it.id));
            return el('div', { class: 'breakdown-row' + (anyEntered ? '' : ' empty') }, [
                el('span', { class: 'label' }, [
                    g.title + (replacedHere ? ' (replacement applied)' : ''), ' ',
                    el('span', { class: 'weight-note' }, `${weight}%`),
                ]),
                el('span', { class: 'pct' }, anyEntered ? pct.toFixed(1) + '%' : '—'),
                el('span', { class: 'contrib' }, st.contrib.toFixed(2) + '%'),
            ]);
        });
        if (cfg.extraCredit) {
            rows.push(el('div', { class: 'breakdown-row' + (ecEarned > 0 ? '' : ' empty') }, [
                el('span', { class: 'label' }, [
                    cfg.extraCredit.title, ' ',
                    el('span', { class: 'weight-note' }, `up to +${ecMaxWeight}%`),
                ]),
                el('span', { class: 'pct' }, ''),
                el('span', { class: 'contrib' }, '+' + ecEarned.toFixed(2) + '%'),
            ]));
        }
        document.getElementById(id('breakdown')).replaceChildren(...rows);

        // Projections
        const secured = enteredContrib + ecEarned;
        const remaining = Math.max(0, totalWeight - enteredWeight);
        let targetText;

        if (allEntered) {
            const gaps = ['A', 'B', 'C', 'D']
                .filter(g => T[g] > coursePct)
                .map(g => `${g}: ${fmt(T[g] - coursePct)} more`);
            targetText = gaps.length === 0
                ? `Every assessment is entered. You have an ${letter === 'A' ? 'A' : letter}.`
                : `Every assessment is entered. Percentage points short:\n${gaps.join('\n')}`;
        } else if (enteredWeight > 0) {
            const lines = [
                `Entered ${r2(enteredWeight)}% of the course weight. ${r2(remaining)}% still to come.`,
            ];
            for (const g of ['A', 'B', 'C', 'D']) {
                const gap = T[g] - secured;
                if (gap <= 0) {
                    lines.push(`${g}: already locked in.`);
                } else {
                    const needed = (gap / remaining) * 100;
                    lines.push(needed > 100
                        ? `${g}: out of reach — would need ${needed.toFixed(1)}% of the remaining work.`
                        : `${g}: average ${needed.toFixed(1)}% on the remaining ${r2(remaining)}%.`);
                }
            }
            targetText = lines.join('\n');
        } else {
            targetText = 'Enter a score to see what you need from here.';
        }
        document.getElementById(id('targets')).textContent = targetText;

        // Current score across entered work only
        const currentNode = document.getElementById(id('currentScore'));
        if (enteredWeight > 0) {
            const curPct = (enteredContrib / enteredWeight) * 100;
            currentNode.textContent =
                `${curPct.toFixed(2)}% across ${r2(enteredWeight)}% of the course weight — at this rate: ${letterFor(curPct)}`;
        } else {
            currentNode.textContent = 'Enter at least one score to see your current average.';
        }

        document.getElementById(id('targetsBox')).classList.toggle('hidden', allEntered);
        document.getElementById(id('currentScoreBox')).classList.toggle('hidden', allEntered);

        save();
    }

    allIds.forEach(i => {
        const node = document.getElementById(i);
        if (node) node.addEventListener('input', compute);
    });

    document.getElementById(id('resetAll')).addEventListener('click', () => {
        allIds.forEach(i => {
            const node = document.getElementById(i);
            if (node) node.value = '';
        });
        safeRemove(cfg.storageKey);
        compute();
    });

    load();
    compute();

    return { compute };
}
