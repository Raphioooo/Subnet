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
  return s;
}

export function renderMarkdown(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };
  const pushItem = (type, value) => {
    flushParagraph();
    if (list?.type !== type) {
      flushList();
      list = { type, items: [] };
    }
    list.items.push(value);
  };

  for (const line of lines) {
    const t = line.trim();
    let m;
    if (!t) {
      flushParagraph();
      flushList();
    } else if ((m = t.match(/^(#{1,4})\s+(.+)$/))) {
      flushParagraph();
      flushList();
      const level = Math.min(Math.max(m[1].length, 2), 4);
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
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
