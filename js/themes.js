// Theme picker. Honors prefers-color-scheme on first visit and persists choice.

import { safeGet, safeSet } from './storage.js';

const STORAGE_KEY = 'microGradeTheme';

export const THEMES = [
    { id: 'light-default',  label: 'Light',                  mode: 'light' },
    { id: 'sepia',          label: 'Sepia',                  mode: 'light' },
    { id: 'light-contrast', label: 'High Contrast (Light)',  mode: 'light' },
    { id: 'dracula',        label: 'Dracula',                mode: 'dark'  },
    { id: 'nord',           label: 'Nord',                   mode: 'dark'  },
    { id: 'dark-contrast',  label: 'High Contrast (Dark)',   mode: 'dark'  },
];

function isValidThemeId(id) {
    return THEMES.some(t => t.id === id);
}

function systemPrefersDark() {
    return window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveSystemTheme() {
    return systemPrefersDark() ? 'dracula' : 'light-default';
}

export function getInitialTheme(configDefault) {
    const stored = safeGet(STORAGE_KEY);
    if (stored && isValidThemeId(stored)) return stored;
    if (configDefault === 'system' || !configDefault) return resolveSystemTheme();
    if (isValidThemeId(configDefault)) return configDefault;
    return resolveSystemTheme();
}

export function applyTheme(id) {
    if (!isValidThemeId(id)) return;
    document.documentElement.setAttribute('data-theme', id);
    safeSet(STORAGE_KEY, id);
}

export function modeOfTheme(id) {
    const t = THEMES.find(t => t.id === id);
    return t ? t.mode : 'dark';
}

// Toggle between current theme's mode and the first theme of the opposite mode.
// If user has already picked a non-default theme in the opposite mode, remember it.
const lastByMode = { light: 'light-default', dark: 'dracula' };

export function rememberCurrent(id) {
    const mode = modeOfTheme(id);
    lastByMode[mode] = id;
}

export function toggleLightDark(currentId) {
    rememberCurrent(currentId);
    const currentMode = modeOfTheme(currentId);
    const targetMode = currentMode === 'light' ? 'dark' : 'light';
    return lastByMode[targetMode];
}

export function buildThemePicker(currentId, onChange) {
    const select = document.createElement('select');
    select.id = 'themeSelect';
    select.setAttribute('aria-label', 'Color theme');

    const groups = [
        { label: 'Light themes', mode: 'light' },
        { label: 'Dark themes',  mode: 'dark'  },
    ];

    for (const g of groups) {
        const og = document.createElement('optgroup');
        og.label = g.label;
        for (const t of THEMES.filter(t => t.mode === g.mode)) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.label;
            if (t.id === currentId) opt.selected = true;
            og.appendChild(opt);
        }
        select.appendChild(og);
    }

    select.addEventListener('change', () => onChange(select.value));
    return select;
}
