// Construit docs/guide-mise-en-ligne.pdf à partir de guide.html.
// Prérequis : Playwright (npm install --no-save playwright && npx playwright install chromium)
// et pdftotext (paquet poppler-utils). Usage : node docs/guide/build.mjs
// Deux passes : la première repère la page de chaque section pour numéroter le sommaire.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const input = path.join(import.meta.dirname, 'guide.html');
const output = path.join(import.meta.dirname, '..', 'guide-mise-en-ligne.pdf');
const pdfText = (file, mode) => execFileSync('pdftotext', [mode, file, '-']).toString('utf8');

const browser = await chromium.launch();
// Largeur utile d'une page A4 (210 mm moins les marges) : la mise en page correspond à l'impression.
const page = await browser.newPage({ viewport: { width: 658, height: 1000 } });
await page.goto('file://' + input, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
await page.emulateMedia({ media: 'print' });
const pdfOptions = { preferCSSPageSize: true, printBackground: true, outline: true, tagged: true };

// Passe 1 : repères invisibles au début de chaque section du sommaire.
await page.evaluate(() => {
  for (const el of document.querySelectorAll('[data-toc]')) {
    const mark = document.createElement('span');
    mark.className = 'toc-mark';
    mark.textContent = `@@${el.id}@@`;
    mark.style.cssText = 'position:absolute;font-size:2px;line-height:0;color:#fff;';
    el.prepend(mark);
  }
});
const draft = output + '.tmp.pdf';
await page.pdf({ ...pdfOptions, path: draft });
const found = {};
pdfText(draft, '-layout').split('\f').forEach((content, i) => {
  for (const m of content.matchAll(/@@([\w-]+)@@/g)) found[m[1]] ??= i + 1;
});
fs.unlinkSync(draft);

// Passe 2 : sommaire numéroté, repères retirés.
const missing = await page.evaluate((found) => {
  document.querySelectorAll('.toc-mark').forEach((m) => m.remove());
  const missing = [];
  for (const el of document.querySelectorAll('[data-page-of]')) {
    if (found[el.dataset.pageOf]) el.textContent = String(found[el.dataset.pageOf]);
    else missing.push(el.dataset.pageOf);
  }
  return missing;
}, found);
await page.pdf({ ...pdfOptions, path: output });
const commands = await page.evaluate(() =>
  [...document.querySelectorAll('.cmd pre')].flatMap((p) => p.textContent.split('\n')).map((l) => l.trim()).filter(Boolean),
);
await browser.close();

// Chaque commande doit tenir sur une ligne : copiée depuis le PDF, elle reste intacte.
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const lines = pdfText(output, '-raw').split('\n').map(norm);
const cut = commands.filter((c) => !lines.some((l) => l.includes(norm(c))));

console.log(`PDF : ${path.relative(process.cwd(), output)} (${Math.round(fs.statSync(output).size / 1024)} Ko)`);
if (missing.length) console.log('Sections sans numéro de page :', missing.join(', '));
if (cut.length) console.log('Commandes coupées sur deux lignes :\n  ' + cut.join('\n  '));
process.exitCode = missing.length || cut.length ? 1 : 0;
