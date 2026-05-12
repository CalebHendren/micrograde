// Application entry point: wires config, themes, screens, and calculators.

import { safeGet, safeSet, safeRemove } from './storage.js';
import { applyTheme, getInitialTheme, buildThemePicker, rememberCurrent, toggleLightDark, modeOfTheme } from './themes.js';
import { buildPointsCalc } from './pointsCalc.js';
import { buildIntegrated } from './integrated.js';
import { el } from './dom.js';

const MODE_KEY = 'microGradeMode';
const MODE_ORDER = ['separate', 'hybrid', 'integrated'];

function getConfig() {
    const cfg = window.MICROGRADE_CONFIG;
    if (!cfg) {
        throw new Error(
            'MICROGRADE_CONFIG is missing. Make sure config.js loads before app.js.'
        );
    }
    return cfg;
}

function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
}

function setHref(id, value) {
    const node = document.getElementById(id);
    if (node && value) node.href = value;
}

function applyCourseInfo(config) {
    document.title = config.course.title;
    setText('courseTitle', config.course.title);
    setText('courseSubtitle', config.course.subtitle);
    setText('disclaimerText', config.course.disclaimer);
    setHref('sourceLink', config.course.sourceUrl);
    if (!config.course.sourceUrl) {
        const link = document.getElementById('sourceLink');
        if (link) link.classList.add('hidden');
    }
}

function installThemeControls(config) {
    if (!config.ui.allowThemeToggle) return;
    const host = document.getElementById('themeControls');
    if (!host) return;

    const current = document.documentElement.getAttribute('data-theme');

    const label = el('label', { for: 'themeSelect' }, 'Theme:');
    const picker = buildThemePicker(current, id => {
        applyTheme(id);
        rememberCurrent(id);
        updateToggleLabel();
    });

    const toggle = el('button', {
        type: 'button',
        class: 'theme-toggle',
        id: 'themeToggle',
        'aria-label': 'Toggle light or dark mode',
    }, modeOfTheme(current) === 'dark' ? 'Light mode' : 'Dark mode');

    toggle.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = toggleLightDark(cur);
        applyTheme(next);
        picker.value = next;
        updateToggleLabel();
    });

    function updateToggleLabel() {
        const cur = document.documentElement.getAttribute('data-theme');
        toggle.textContent = modeOfTheme(cur) === 'dark' ? 'Light mode' : 'Dark mode';
    }

    host.replaceChildren(label, picker, toggle);
}

function buildSelector(config, onChoose) {
    const screen = document.getElementById('selectorScreen');
    const buttons = [];

    const buttonSpecs = [
        { key: 'separate',   id: 'btnSeparate'   },
        { key: 'hybrid',     id: 'btnHybrid'     },
        { key: 'integrated', id: 'btnIntegrated' },
    ];

    for (const { key, id } of buttonSpecs) {
        const m = config.modes[key];
        if (!m || !m.enabled) continue;
        buttons.push(el('button', {
            id, class: 'secondary', type: 'button',
            'aria-label': `Choose ${m.label}`,
        }, [
            m.label,
            el('span', { class: 'button-sub' }, m.sublabel || ''),
        ]));
    }

    screen.replaceChildren(el('div', { class: 'selector' }, [
        el('h2', {}, 'Which type of section are you in?'),
        el('p', {}, 'Your section type determines how your grade is calculated. If you are unsure, check your course schedule or ask your instructor.'),
        el('div', { class: 'selector-btns' }, buttons),
    ]));

    for (const { key, id } of buttonSpecs) {
        if (config.modes[key] && config.modes[key].enabled) {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => onChoose(key));
        }
    }
}

function showScreen(mode, config) {
    const screens = {
        selector:   document.getElementById('selectorScreen'),
        separate:   document.getElementById('separateCalc'),
        hybrid:     document.getElementById('hybridCalc'),
        integrated: document.getElementById('integratedCalc'),
    };
    const footers = {
        separate:   document.getElementById('footerSep'),
        hybrid:     document.getElementById('footerHyb'),
        integrated: document.getElementById('footerInt'),
    };

    screens.selector.classList.toggle('hidden',   mode !== null);
    screens.separate.classList.toggle('hidden',   mode !== 'separate');
    screens.hybrid.classList.toggle('hidden',     mode !== 'hybrid');
    screens.integrated.classList.toggle('hidden', mode !== 'integrated');

    for (const m of MODE_ORDER) {
        if (footers[m]) footers[m].classList.toggle('hidden', mode !== m);
    }

    if (mode) safeSet(MODE_KEY, mode);

    const target = mode === null ? screens.selector : screens[mode];
    if (target) {
        const heading = target.querySelector('h1, h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: false });
        }
    }
}

function init() {
    const config = getConfig();

    applyTheme(getInitialTheme(config.ui.defaultTheme));
    rememberCurrent(document.documentElement.getAttribute('data-theme'));

    applyCourseInfo(config);
    installThemeControls(config);

    setText('footerSep', config.separate ? config.separate.footerNote || '' : '');
    setText('footerHyb', config.hybrid   ? config.hybrid.footerNote   || '' : '');
    setText('footerInt', config.integrated ? config.integrated.footerNote || '' : '');

    const apps = { separate: null, hybrid: null, integrated: null };

    function ensureSeparate() {
        if (!apps.separate && config.separate) {
            apps.separate = buildPointsCalc(
                document.getElementById('separateCalc'), config.separate,
                { prefix: 'sep-', modeLabel: config.modes.separate.label, backButtonId: 'backFromSeparate' }
            );
            const back = document.getElementById('backFromSeparate');
            if (back) back.addEventListener('click', () => {
                safeRemove(MODE_KEY);
                showScreen(null, config);
            });
        }
        return apps.separate;
    }

    function ensureHybrid() {
        if (!apps.hybrid && config.hybrid) {
            apps.hybrid = buildPointsCalc(
                document.getElementById('hybridCalc'), config.hybrid,
                { prefix: 'hyb-', modeLabel: config.modes.hybrid.label, backButtonId: 'backFromHybrid' }
            );
            const back = document.getElementById('backFromHybrid');
            if (back) back.addEventListener('click', () => {
                safeRemove(MODE_KEY);
                showScreen(null, config);
            });
        }
        return apps.hybrid;
    }

    function ensureIntegrated() {
        if (!apps.integrated && config.integrated) {
            apps.integrated = buildIntegrated(document.getElementById('integratedCalc'), config);
            const back = document.getElementById('backFromIntegrated');
            if (back) back.addEventListener('click', () => {
                safeRemove(MODE_KEY);
                showScreen(null, config);
            });
        }
        return apps.integrated;
    }

    function chooseMode(mode) {
        if (mode === 'separate'   && config.modes.separate.enabled)   ensureSeparate();
        else if (mode === 'hybrid'     && config.modes.hybrid.enabled)     ensureHybrid();
        else if (mode === 'integrated' && config.modes.integrated.enabled) ensureIntegrated();
        showScreen(mode, config);
    }

    buildSelector(config, chooseMode);

    const enabledModes = MODE_ORDER.filter(m => config.modes[m] && config.modes[m].enabled);
    if (enabledModes.length === 0) {
        document.getElementById('selectorScreen').textContent =
            'No calculator modes are enabled. Edit config.js to enable at least one.';
        return;
    }

    const saved = safeGet(MODE_KEY);
    if (enabledModes.length === 1) {
        chooseMode(enabledModes[0]);
    } else if (saved && enabledModes.includes(saved)) {
        chooseMode(saved);
    } else {
        showScreen(null, config);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
