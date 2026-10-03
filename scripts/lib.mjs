// Shared design tokens + helpers for the profile's SVG assets.
// SVGs rendered through <img> cannot load external fonts, so each file embeds
// a Google Fonts subset that contains only the glyphs it actually uses.

export const THEMES = {
  dark: {
    bg: '#07080e', panel: '#0c0f1c', line: '#1d2340', glow: '#141a33',
    text: '#f4f1ea', body: '#a3a9bf', muted: '#5d647d', chip: '#c7cbe0', stamp: '#3a4060', core: '#ffffff',
    cyan: '#67e8f9', violet: '#a78bfa', indigo: '#818cf8', warm: '#fcd9a8', green: '#86efac',
  },
  light: {
    bg: '#f6f7fb', panel: '#ffffff', line: '#e3e6ef', glow: '#eef1ff',
    text: '#12141c', body: '#4b5168', muted: '#8a90a6', chip: '#3b4058', stamp: '#b6bbcc', core: '#4f46e5',
    cyan: '#0e7490', violet: '#6d28d9', indigo: '#4f46e5', warm: '#b45309', green: '#15803d',
  },
};
export const T = THEMES.dark;

const FAMILIES = {
  serif: { css: 'Instrument+Serif:ital@0;1', name: 'Instrument Serif' },
  mono: { css: 'JetBrains+Mono:wght@400;500', name: 'JetBrains Mono' },
  sans: { css: 'Inter:wght@400;500;600', name: 'Inter' },
};

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return res;
    } catch (err) {
      if (attempt >= 4) throw err;
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
}

// Returns @font-face rules (base64 woff2) for `family`, subset to `text`.
export async function fontFaces(family, text) {
  const f = FAMILIES[family];
  const glyphs = [...new Set(text)].join('');
  const url = `https://fonts.googleapis.com/css2?family=${f.css}&text=${encodeURIComponent(glyphs)}`;
  const css = await (await get(url)).text();
  const rules = [];
  for (const block of css.match(/@font-face\s*{[^}]+}/g) ?? []) {
    const src = block.match(/url\((https:[^)]+)\)/)[1];
    const buf = Buffer.from(await (await get(src)).arrayBuffer());
    const style = block.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal';
    const weight = block.match(/font-weight:\s*([\d ]+)/)?.[1] ?? '400';
    rules.push(`@font-face{font-family:'${f.name}';font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`);
  }
  return rules.join('');
}

// Collects every string drawn with each family so fonts can be subset once per file.
export function fontCollector() {
  const used = { serif: '', mono: '', sans: '' };
  const use = (family, s) => { used[family] += s; return esc(s); };
  const css = async () => (await Promise.all(Object.entries(used).filter(([, s]) => s).map(([fam, s]) => fontFaces(fam, s)))).join('');
  return { use, css };
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const STACKS = {
  serif: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sans: "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
};

// Greedy word wrap using an average glyph width estimate.
export function wrap(text, maxChars) {
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
