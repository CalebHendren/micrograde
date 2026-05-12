// Small DOM construction helpers. Avoids repeating createElement boilerplate.

export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') {
            node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k === 'dataset') {
            for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
        } else {
            node.setAttribute(k, v === true ? '' : v);
        }
    }
    const kids = Array.isArray(children) ? children : [children];
    for (const c of kids) {
        if (c === null || c === undefined || c === false) continue;
        node.append(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
}

export function numberInput({ id, label, min = 0, max, ariaLabel }) {
    const attrs = {
        id,
        type: 'number',
        min: String(min),
        step: 'any',
        inputmode: 'decimal',
    };
    if (max !== undefined && max !== null) attrs.max = String(max);
    if (label) attrs['aria-label'] = label;
    if (ariaLabel) attrs['aria-label'] = ariaLabel;
    return el('input', attrs);
}

export function labeledRow({ id, label, max, min = 0 }) {
    const maxNote = max !== undefined ? ` (0–${max})` : '';
    return el('div', { class: 'row' }, [
        el('label', { for: id, text: label + maxNote }),
        numberInput({ id, min, max }),
    ]);
}

export function r2(n) { return Math.round(n * 100) / 100; }
export function fmt(x) { return Math.max(0, x).toFixed(2); }

// Read a number input, clamping invalid input to [min, max]. Returns clamped value.
export function valNum(id, min = 0, max = Infinity) {
    const node = document.getElementById(id);
    if (!node) return 0;
    let v = parseFloat(node.value);
    if (Number.isNaN(v)) v = 0;
    if (v < min) v = min;
    if (v > max) v = max;
    const raw = parseFloat(node.value);
    if (!Number.isNaN(raw) && (raw < min || raw > max)) node.value = v;
    return v;
}

// Read a number input, returning null when empty. Clamps invalid input.
export function readInput(id) {
    const node = document.getElementById(id);
    if (!node) return null;
    const raw = node.value.trim();
    if (raw === '') return null;
    let v = parseFloat(raw);
    if (Number.isNaN(v)) return null;
    if (v < 0) v = 0;
    const max = parseFloat(node.max);
    if (!Number.isNaN(max) && v > max) v = max;
    if (parseFloat(raw) < 0 || (!Number.isNaN(max) && parseFloat(raw) > max)) {
        node.value = v;
    }
    return v;
}
