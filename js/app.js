// Application entry point: wires config, themes, screens, and calculators.

import { safeGet, safeSet, safeRemove } from './storage.js';
import { applyTheme, getInitialTheme, buildThemePicker, rememberCurrent, toggleLightDark, modeOfTheme } from './themes.js';
import { buildWeightedCalc } from './weightedCalc.js';
import { el } from './dom.js';

const MODE_KEY = 'microGradeMode';
const MODE_ORDER = ['onground', 'hybrid', 'online'];

const screenId = mode => `${mode}Calc`;
const footerId = mode => `footer-${mode}`;

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

    let toggleClickTimes = [];
    toggle.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = toggleLightDark(cur);
        applyTheme(next);
        picker.value = next;
        updateToggleLabel();

        const now = Date.now();
        toggleClickTimes.push(now);
        toggleClickTimes = toggleClickTimes.filter(t => now - t <= 10000);
        if (toggleClickTimes.length >= 10) {
            document.documentElement.setAttribute('data-debug-mode', 'on');
        }
    });

    function updateToggleLabel() {
        const cur = document.documentElement.getAttribute('data-theme');
        toggle.textContent = modeOfTheme(cur) === 'dark' ? 'Light mode' : 'Dark mode';
    }

    host.replaceChildren(label, picker, toggle);
}

function buildSelector(config, enabledModes, onChoose) {
    const screen = document.getElementById('selectorScreen');

    const buttons = enabledModes.map(mode => {
        const m = config.modes[mode];
        const btn = el('button', {
            class: 'secondary', type: 'button',
            'aria-label': `Choose ${m.label}`,
        }, [
            m.label,
            el('span', { class: 'button-sub' }, m.sublabel || ''),
        ]);
        btn.addEventListener('click', () => onChoose(mode));
        return btn;
    });

    screen.replaceChildren(el('div', { class: 'selector' }, [
        el('h2', {}, 'Which type of section are you in?'),
        el('p', {}, 'Your section type determines how your grade is calculated. If you are unsure, check your course schedule or ask your instructor.'),
        el('div', { class: 'selector-btns' }, buttons),
    ]));
}

function showScreen(mode) {
    document.getElementById('selectorScreen').classList.toggle('hidden', mode !== null);

    for (const m of MODE_ORDER) {
        const screen = document.getElementById(screenId(m));
        if (screen) screen.classList.toggle('hidden', mode !== m);
        const footer = document.getElementById(footerId(m));
        if (footer) footer.classList.toggle('hidden', mode !== m);
    }

    if (mode) safeSet(MODE_KEY, mode);

    const target = document.getElementById(mode === null ? 'selectorScreen' : screenId(mode));
    const heading = target && target.querySelector('h1, h2');
    if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: false });
    }
}

function init() {
    const config = getConfig();

    applyTheme(getInitialTheme(config.ui.defaultTheme));
    rememberCurrent(document.documentElement.getAttribute('data-theme'));

    applyCourseInfo(config);
    installThemeControls(config);

    const enabledModes = MODE_ORDER.filter(
        m => config.modes[m] && config.modes[m].enabled && config[m]
    );

    for (const mode of MODE_ORDER) {
        setText(footerId(mode), config[mode] ? config[mode].footerNote || '' : '');
    }

    // Calculators are built on first visit to a section type, not up front, so
    // a student only pays for the one they use.
    const built = {};

    function ensureCalc(mode) {
        if (built[mode]) return built[mode];
        const backButtonId = `backFrom-${mode}`;
        built[mode] = buildWeightedCalc(
            document.getElementById(screenId(mode)),
            config[mode],
            { prefix: `${mode}-`, modeLabel: config.modes[mode].label, backButtonId }
        );
        const back = document.getElementById(backButtonId);
        if (back) {
            back.addEventListener('click', () => {
                safeRemove(MODE_KEY);
                showScreen(null);
            });
        }
        return built[mode];
    }

    function chooseMode(mode) {
        if (!enabledModes.includes(mode)) return;
        ensureCalc(mode);
        showScreen(mode);
    }

    if (enabledModes.length === 0) {
        document.getElementById('selectorScreen').textContent =
            'No calculator modes are enabled. Edit config.js to enable at least one.';
        return;
    }

    buildSelector(config, enabledModes, chooseMode);

    const saved = safeGet(MODE_KEY);
    if (enabledModes.length === 1) {
        chooseMode(enabledModes[0]);
    } else if (saved && enabledModes.includes(saved)) {
        chooseMode(saved);
    } else {
        showScreen(null);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
