// Rendu Markdown volontairement minimal et sûr : le texte est échappé
// avant toute mise en forme, et seuls les liens sûrs sont conservés.

const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;
const EMAIL = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
    const raw = url.replace(/&amp;/g, '&');
    if (!SAFE_URL.test(raw)) return label;
    const external = /^https?:\/\//i.test(raw);
    return `<a href="${escapeHtml(raw)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  // Emails cliquables, hors liens existants.
  s = s
    .split(/(<a [^>]*>.*?<\/a>)/)
    .map((part) => (part.startsWith('<a ') ? part : part.replace(EMAIL, '<a href="mailto:$1">$1</a>')))
    .join('');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
  s = s.replace(/⟦([^⟧]+)⟧/g, '<mark class="todo">$1</mark>');
  s = s.replace(/\[(À COMPLÉTER[^\]]*)\]/gi, '<mark class="todo">[$1]</mark>');
  return s;
}

// Identifiant d'ancre ou d'adresse : minuscules, sans accents, mots séparés par des tirets.
export function slugify(value, max = 70) {
  const slug = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > max ? slug.slice(0, max).replace(/-[^-]*$/, '').replace(/-+$/, '') || slug.slice(0, max) : slug;
}

const plainText = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Ligne de tableau « | a | b | » → cellules.
const tableCells = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
const isTableSeparator = (line) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(line);

// Options : headings (tableau) reçoit les titres H2 avec leur ancre, pour un sommaire.
export function renderMarkdown(source, { headings = null } = {}) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let list = null;
  let table = null;
  const ids = new Set();

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const flushTable = () => {
    if (!table) return;
    const [head, ...rows] = table;
    const cells = (row, tag) => row.map((cell) => `<${tag}>${inline(cell)}</${tag}>`).join('');
    out.push(
      `<div class="table-wrap"><table><thead><tr>${cells(head, 'th')}</tr></thead><tbody>${rows.map((r) => `<tr>${cells(r, 'td')}</tr>`).join('')}</tbody></table></div>`,
    );
    table = null;
  };
  const pushItem = (type, value) => {
    flushParagraph();
    if (list?.type !== type) {
      flushList();
      list = { type, items: [] };
    }
    list.items.push(value);
  };

  for (const [index, line] of lines.entries()) {
    const t = line.trim();
    let m;
    if (table && t.startsWith('|')) {
      if (!isTableSeparator(t)) table.push(tableCells(t));
      continue;
    }
    flushTable();
    if (!t) {
      flushParagraph();
      flushList();
    } else if (t.startsWith('|') && isTableSeparator((lines[index + 1] || '').trim())) {
      flushParagraph();
      flushList();
      table = [tableCells(t)];
    } else if ((m = t.match(/^(#{1,4})\s+(.+)$/))) {
      flushParagraph();
      flushList();
      const level = Math.min(Math.max(m[1].length, 2), 4);
      const html = inline(m[2]);
      if (headings && level === 2) {
        const text = plainText(html);
        const base = slugify(text, 60) || 'section';
        let id = base;
        for (let n = 2; ids.has(id); n += 1) id = `${base}-${n}`;
        ids.add(id);
        headings.push({ id, text });
        out.push(`<h2 id="${id}">${html}</h2>`);
      } else {
        out.push(`<h${level}>${html}</h${level}>`);
      }
    } else if ((m = t.match(/^[-*•]\s+(.+)$/))) {
      pushItem('ul', m[1]);
    } else if ((m = t.match(/^\d+[.)]\s+(.+)$/))) {
      pushItem('ol', m[1]);
    } else if (t === '---') {
      flushParagraph();
      flushList();
      out.push('<hr>');
    } else {
      flushList();
      paragraph.push(t);
    }
  }
  flushTable();
  flushParagraph();
  flushList();
  return out.join('\n');
}

// Remplace les balises {{nom}} par les informations légales. Une balise
// facultative vide supprime toute sa ligne ; une balise obligatoire vide
// est signalée par « à compléter ».
export function applyTokens(source, values, optional = new Set()) {
  return String(source ?? '')
    .split('\n')
    .flatMap((line) => {
      let drop = false;
      const replaced = line.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, name) => {
        if (!Object.hasOwn(values, name)) return match;
        const value = String(values[name] ?? '').trim().replace(/\s*\n+\s*/g, ', ');
        if (value) return value;
        if (optional.has(name)) drop = true;
        return '⟦à compléter⟧';
      });
      return drop ? [] : [replaced];
    })
    .join('\n');
}
