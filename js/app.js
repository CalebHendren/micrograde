// Application entry point: wires config, themes, screens, and calculators.

import { safeGet, safeSet, safeRemove } from './storage.js';
import { applyTheme, getInitialTheme, buildThemePicker, rememberCurrent, toggleLightDark, modeOfTheme } from './themes.js';
import { buildSeparate } from './separate.js';
import { buildIntegrated } from './integrated.js';
import { el } from './dom.js';

const MODE_KEY = 'microGradeMode';

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

    if (config.modes.separate.enabled) {
        buttons.push(el('button', {
            id: 'btnSeparate', class: 'secondary', type: 'button',
            'aria-label': `Choose ${config.modes.separate.label}`,
        }, [
            config.modes.separate.label,
            el('span', { class: 'button-sub' }, config.modes.separate.sublabel || ''),
        ]));
    }
    if (config.modes.integrated.enabled) {
        buttons.push(el('button', {
            id: 'btnIntegrated', class: 'secondary', type: 'button',
            'aria-label': `Choose ${config.modes.integrated.label}`,
        }, [
            config.modes.integrated.label,
            el('span', { class: 'button-sub' }, config.modes.integrated.sublabel || ''),
        ]));
    }

    screen.replaceChildren(el('div', { class: 'selector' }, [
        el('h2', {}, 'Which type of section are you in?'),
        el('p', {}, 'Your section type determines how your grade is calculated. If you are unsure, check your course schedule or ask your instructor.'),
        el('div', { class: 'selector-btns' }, buttons),
    ]));

    if (config.modes.separate.enabled) {
        document.getElementById('btnSeparate').addEventListener('click', () => onChoose('separate'));
    }
    if (config.modes.integrated.enabled) {
        document.getElementById('btnIntegrated').addEventListener('click', () => onChoose('integrated'));
    }
}

function showScreen(mode, config) {
    const sel = document.getElementById('selectorScreen');
    const sep = document.getElementById('separateCalc');
    const intg = document.getElementById('integratedCalc');
    const footerSep = document.getElementById('footerSep');
    const footerInt = document.getElementById('footerInt');

    sel.classList.toggle('hidden', mode !== null);
    sep.classList.toggle('hidden', mode !== 'separate');
    intg.classList.toggle('hidden', mode !== 'integrated');
    footerSep.classList.toggle('hidden', mode !== 'separate');
    footerInt.classList.toggle('hidden', mode !== 'integrated');

    if (mode) safeSet(MODE_KEY, mode);

    // Move focus to the new region for screen reader / keyboard users.
    const target = mode === 'separate' ? sep : mode === 'integrated' ? intg : sel;
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

    setText('footerSep', config.separate.footerNote || '');
    setText('footerInt', config.integrated.footerNote || '');

    let sepApp = null;
    let intApp = null;

    function ensureSeparate() {
        if (!sepApp && config.separate) {
            sepApp = buildSeparate(document.getElementById('separateCalc'), config);
            const back = document.getElementById('backFromSeparate');
            if (back) back.addEventListener('click', () => {
                safeRemove(MODE_KEY);
                showScreen(null, config);
            });
        }
        return sepApp;
    }

    function ensureIntegrated() {
        if (!intApp && config.integrated) {
            intApp = buildIntegrated(document.getElementById('integratedCalc'), config);
            const back = document.getElementById('backFromIntegrated');
            if (back) back.addEventListener('click', () => {
                safeRemove(MODE_KEY);
                showScreen(null, config);
            });
        }
        return intApp;
    }

    function chooseMode(mode) {
        if (mode === 'separate' && config.modes.separate.enabled) ensureSeparate();
        else if (mode === 'integrated' && config.modes.integrated.enabled) ensureIntegrated();
        showScreen(mode, config);
    }

    buildSelector(config, chooseMode);

    // Auto-select if exactly one mode is enabled
    const enabledModes = ['separate', 'integrated'].filter(m => config.modes[m].enabled);
    if (enabledModes.length === 0) {
        document.getElementById('selectorScreen').textContent =
            'No calculator modes are enabled. Edit config.js to enable at least one.';
        return;
    }

    const saved = safeGet(MODE_KEY);
    if (enabledModes.length === 1) {
        chooseMode(enabledModes[0]);
    } else if (saved === 'separate' || saved === 'integrated') {
        if (config.modes[saved].enabled) chooseMode(saved);
        else showScreen(null, config);
    } else {
        showScreen(null, config);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
