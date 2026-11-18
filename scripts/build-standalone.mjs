// Builds dist/ and inlines the JS, CSS and favicon into ONE html file that opens by double-click
// (file://), with no server. Output: standalone/triage.html
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const dist = `${root}dist`;
let html = readFileSync(`${dist}/index.html`, 'utf8');
const assets = readdirSync(`${dist}/assets`);
const js = assets.filter((f) => f.endsWith('.js'));
if (js.length !== 1) throw new Error(`expected one JS chunk, found ${js.length} — standalone inlining needs a single bundle`);
for (const f of assets.filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(`${dist}/assets/${f}`, 'utf8');
  html = html.replace(new RegExp(`<link rel="stylesheet"[^>]*href="/assets/${f}"[^>]*>`), () => `<style>${css}</style>`);
}
const code = readFileSync(`${dist}/assets/${js[0]}`, 'utf8').replace(/<\/script/gi, '<\\/script');
html = html.replace(new RegExp(`<script type="module"[^>]*src="/assets/${js[0]}"[^>]*></script>`), () => '');
html = html.replace('</body>', () => `<script type="module">${code}</script>\n</body>`);
const svg = readFileSync(`${root}public/favicon.svg`, 'utf8');
html = html.replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(svg)}"`);
if (/(src|href)="\/(assets|favicon)/.test(html)) throw new Error('an asset reference was not inlined');
mkdirSync(`${root}standalone`, { recursive: true });
writeFileSync(`${root}standalone/triage.html`, html);
console.log(`wrote standalone/triage.html (${(html.length / 1024).toFixed(0)} kB)`);
