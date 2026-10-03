// Builds assets/stats.svg from the GitHub GraphQL API.
// Run: GITHUB_TOKEN=... node scripts/stats.mjs   (the daily workflow does this)
import { writeFileSync } from 'node:fs';
import { T, THEMES, STACKS, fontCollector } from './lib.mjs';

const LOGIN = process.env.PROFILE_LOGIN || 'Rohankhan5990';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');

const query = `query($login:String!){ user(login:$login){
  createdAt
  followers { totalCount }
  repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: {field: PUSHED_AT, direction: DESC}) {
    totalCount
    nodes { stargazerCount languages(first: 8, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } } }
  }
  contributionsCollection {
    totalCommitContributions totalPullRequestContributions restrictedContributionsCount
    contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } }
  }
} }`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});
const { data, errors } = await res.json();
if (errors) throw new Error(JSON.stringify(errors));
const u = data.user;
const cc = u.contributionsCollection;

// Language share by bytes, limited to the web + AI/ML stack the profile is about
// (mobile, legacy and markup languages still count toward the total below).
const FOCUS = ['Python', 'TypeScript', 'JavaScript', 'Jupyter Notebook', 'Go', 'Rust', 'SQL'];
const allLangs = new Set();
const langs = new Map();
for (const r of u.repositories.nodes) for (const e of r.languages.edges) {
  allLangs.add(e.node.name);
  if (!FOCUS.includes(e.node.name)) continue;
  const cur = langs.get(e.node.name) ?? { size: 0, color: e.node.color ?? T.muted };
  cur.size += e.size; langs.set(e.node.name, cur);
}
const langSum = [...langs.values()].reduce((s, v) => s + v.size, 0) || 1;
const top = [...langs.entries()].sort((a, b) => b[1].size - a[1].size).filter(([, v]) => v.size / langSum >= 0.01).slice(0, 4);
const langTotal = top.reduce((s, [, v]) => s + v.size, 0) || 1;

const stars = u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0);
const weeks = cc.contributionCalendar.weeks.slice(-30).map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0));

const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));
const years = Math.max(1, Math.floor((Date.now() - new Date(u.createdAt)) / (365.25 * 864e5)));
const STATS = [
  ['Repositories', fmt(u.repositories.totalCount)],
  ['Languages used', fmt(allLangs.size)],
  ['Contributions · 12 mo', fmt(cc.contributionCalendar.totalContributions)],
  ['Years on GitHub', `${years}+`],
];

async function render(t) {
const f = fontCollector();
const W = 960, H = 250;

// --- stat column
let statsSvg = '';
STATS.forEach(([label, value], i) => {
  const x = 32 + (i % 2) * 190, y = 58 + Math.floor(i / 2) * 92;
  statsSvg += `<text class="v" x="${x}" y="${y + 40}">${f.use('serif', value)}</text><text class="l" x="${x + 1}" y="${y + 62}">${f.use('mono', label.toUpperCase())}</text>`;
});

// --- contribution sparkline (last 30 weeks)
const sx = 440, sw = 488, sy = 52, sh = 104;
const max = Math.max(1, ...weeks);
const pts = weeks.map((v, i) => [sx + (i / (weeks.length - 1)) * sw, sy + sh - (v / max) * sh]);
const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const area = `${line} L${sx + sw} ${sy + sh} L${sx} ${sy + sh} Z`;
const len = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const last = pts[pts.length - 1];

// --- language bar
let lx = sx, gx = sx, bars = '', legend = '';
top.forEach(([name, v], i) => {
  const w = (v.size / langTotal) * sw;
  bars += `<rect x="${lx.toFixed(1)}" y="192" width="${Math.max(0, w - 3).toFixed(1)}" height="6" rx="3" fill="${v.color}"/>`;
  const pct = Math.round((v.size / langTotal) * 100) + '%';
  legend += `<circle cx="${gx + 4}" cy="222" r="3.5" fill="${v.color}"/><text class="lg" x="${gx + 13}" y="226">${f.use('sans', name)} <tspan fill="${t.muted}">${f.use('sans', pct)}</tspan></text>`;
  gx += 13 + (name.length + pct.length + 1) * 7.4 + 22;
  lx += w;
});

const kickL = f.use('mono', 'WEEKLY CONTRIBUTIONS · LAST 30 WEEKS');
const kickR = f.use('mono', 'TOP LANGUAGES');
const updated = f.use('mono', `updated ${new Date().toISOString().slice(0, 10)}`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub stats for ${LOGIN}: ${STATS.map(([l, v]) => `${l} ${v}`).join(', ')}">
<style>${await f.css()}
.v{font:400 48px ${STACKS.serif};fill:${t.text}}
.l{font:500 10.5px ${STACKS.mono};fill:${t.muted};letter-spacing:.16em}
.k{font:500 10.5px ${STACKS.mono};fill:${t.muted};letter-spacing:.18em}
.lg{font:400 12.5px ${STACKS.sans};fill:${t.body}}
.u{font:400 10px ${STACKS.mono};fill:${t.stamp}}
.draw{stroke-dasharray:${len.toFixed(0)};stroke-dashoffset:${len.toFixed(0)};animation:draw 2.6s cubic-bezier(.4,0,.2,1) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.fade{opacity:0;animation:fade 1s 1.6s forwards}
@keyframes fade{to{opacity:1}}
.ping{animation:ping 2s ease-out 2.6s infinite;transform-box:fill-box;transform-origin:center;opacity:0}
@keyframes ping{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.6);opacity:0}}
</style>
<defs>
<linearGradient id="ln" x1="0" x2="1"><stop offset="0" stop-color="${t.violet}"/><stop offset="1" stop-color="${t.cyan}"/></linearGradient>
<linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.cyan}" stop-opacity=".22"/><stop offset="1" stop-color="${t.cyan}" stop-opacity="0"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" rx="18" fill="${t.panel}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.line}"/>
<rect x="408" y="32" width="1" height="${H - 64}" fill="${t.line}"/>
${statsSvg}
<text class="k" x="${sx}" y="38">${kickL}</text>
<path class="fade" d="${area}" fill="url(#ar)"/>
<path class="draw" d="${line}" fill="none" stroke="url(#ln)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
<circle class="ping" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="5" fill="none" stroke="${t.cyan}"/>
<circle class="fade" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="${t.cyan}"/>
<text class="k" x="${sx}" y="182">${kickR}</text>
${bars}
${legend}
<text class="u" x="${W - 32}" y="38" text-anchor="end">${updated}</text>
</svg>`;

return svg;
}

for (const [mode, t] of Object.entries(THEMES)) writeFileSync(`assets/stats-${mode}.svg`, await render(t));

console.log('wrote assets/stats-{dark,light}.svg', STATS);
