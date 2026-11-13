// Topo quotidien par email : articles publiés, programmés, brouillons et visites.

import fs from 'node:fs/promises';
import path from 'node:path';
import { findMarkers, isPublished } from './posts.js';
import { addDays, dayKey } from './stats.js';

const HOUR = 8; // heure d'envoi, heure de Paris
const hourFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' });
const whenFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function buildDigest({ store, stats, baseUrl, siteName = 'Subnet', now = Date.now() }) {
  const posts = store.listPosts();
  const since = now - 24 * 60 * 60 * 1000;
  const live = posts.filter((p) => isPublished(p, now));
  const fresh = live.filter((p) => Date.parse(p.publishedAt) > since).sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const scheduled = posts.filter((p) => p.status === 'scheduled' && p.scheduledAt).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const drafts = posts.filter((p) => p.status === 'draft');

  const today = dayKey(new Date(now));
  const yesterday = addDays(today, -1);
  const day = stats.summarize(yesterday, yesterday);
  const week = stats.summarize(addDays(today, -7), yesterday);
  const google = (s) => s.sources.google || 0;

  const lines = [
    `Topo du ${dateFormat.format(new Date(now))}`,
    '',
    `PUBLIÉS CES DERNIÈRES 24 H (${fresh.length})`,
    ...(fresh.length ? fresh.map((p) => `• ${p.title}\n  ${baseUrl}/blog/${p.slug}`) : ['• Aucun.']),
    '',
    `PROGRAMMÉS (${scheduled.length})`,
    ...(scheduled.length ? scheduled.slice(0, 14).map((p) => `• ${whenFormat.format(new Date(p.scheduledAt))} : ${p.title}`) : ['• Aucun : la file de publication est vide.']),
    ...(scheduled.length > 14 ? [`• … et ${scheduled.length - 14} autres.`] : []),
    '',
    `BROUILLONS EN ATTENTE (${drafts.length})`,
    ...(drafts.length ? drafts.map((p) => {
      const n = findMarkers(p).length;
      return `• ${p.title}${n ? ` (${plural(n, 'marqueur')} à remplir)` : ''}\n  ${baseUrl}/admin/articles/${p.id}`;
    }) : ['• Aucun.']),
    '',
    'VISITES',
    `• Hier : ${plural(day.visits, 'visite')}, dont ${google(day)} depuis Google ; ${plural(day.views, 'page')} vue${day.views > 1 ? 's' : ''} ; ${plural(day.contacts, 'message')} de contact.`,
    `• 7 derniers jours : ${plural(week.visits, 'visite')}, dont ${google(week)} depuis Google ; ${plural(week.contacts, 'message')} de contact.`,
    '',
    `${plural(live.length, 'article')} en ligne au total. Statistiques détaillées : ${baseUrl}/admin/statistiques`,
  ];
  return {
    subject: `Topo ${siteName} : ${fresh.length} publié${fresh.length > 1 ? 's' : ''}, ${scheduled.length} programmé${scheduled.length > 1 ? 's' : ''}, ${day.visits} visite${day.visits > 1 ? 's' : ''} hier`,
    text: lines.join('\n'),
  };
}

// Envoie le topo une fois par jour, à partir de 8 h (heure de Paris).
export function startDailyDigest({ config, store, stats, mailer, log }) {
  if (!mailer.enabled) return null;
  const file = path.join(config.dataDir, 'digest.json');
  const tick = async () => {
    const now = new Date();
    if (Number(hourFormat.format(now)) < HOUR) return;
    const today = dayKey(now);
    let last = '';
    try {
      last = JSON.parse(await fs.readFile(file, 'utf8')).lastSent || '';
    } catch {
      // premier envoi
    }
    if (last === today) return;
    await fs.writeFile(file, JSON.stringify({ lastSent: today }));
    const content = store.getContent();
    const baseUrl = config.baseUrl || content.site.url.replace(/\/+$/, '');
    await mailer.sendDigest(buildDigest({ store, stats, baseUrl, siteName: content.site.name }), content);
  };
  const timer = setInterval(() => tick().catch((err) => log.error('Topo quotidien :', err.message)), 5 * 60 * 1000);
  timer.unref();
  return timer;
}
