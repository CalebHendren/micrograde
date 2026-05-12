// localStorage helpers with safe failure (private browsing, quota, etc.).

export function safeGet(key) {
    try { return localStorage.getItem(key); }
    catch (e) { return null; }
}

export function safeSet(key, value) {
    try { localStorage.setItem(key, value); }
    catch (e) { /* ignore quota / private-mode errors */ }
}

export function safeRemove(key) {
    try { localStorage.removeItem(key); }
    catch (e) { /* ignore */ }
}

export function loadJSON(key) {
    const raw = safeGet(key);
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch (e) { return null; }
}

export function saveJSON(key, obj) {
    safeSet(key, JSON.stringify(obj));
}
