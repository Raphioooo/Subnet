// Notification par email des nouveaux messages (facultative, via SMTP).

import { CONTACT_SECTOR_OPTIONS } from './schema.js';

const SOURCES = { accueil: 'page d’accueil', contact: 'page contact' };

export function createMailer(smtp, log = console) {
  if (!smtp?.host) {
    return { enabled: false, async notifyNewMessage() { return false; }, async notifyNewDraft() { return false; } };
  }

  let transporter;
  async function getTransporter() {
    if (!transporter) {
      const { default: nodemailer } = await import('nodemailer');
      transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
      });
    }
    return transporter;
  }

  const addresses = (content) => {
    const to = smtp.to || content.contact.email;
    const from = smtp.from || smtp.user;
    if (!to || !from) log.warn('Email : destinataire ou expéditeur manquant (MAIL_TO / MAIL_FROM).');
    return to && from ? { to, from } : null;
  };

  return {
    enabled: true,
    // Brouillon d'article créé par l'agent de rédaction (API du blog).
    async notifyNewDraft(post, { markers, adminUrl, previewUrl }, content) {
      const target = addresses(content);
      if (!target) return false;
      const lines = [
        `Nouveau brouillon d’article sur ${content.site.name}`,
        '',
        `Titre : ${post.title}`,
        `Requête visée : ${post.targetKeyword || 'non précisée'}`,
        `Marqueurs [À COMPLÉTER] à remplir : ${markers.length}`,
        ...markers.map((m) => `  • ${m}`),
        '',
        `Relire et publier : ${adminUrl}`,
        `Aperçu : ${previewUrl}`,
        '',
        'L’article reste en brouillon tant que vous ne le publiez pas.',
      ];
      const t = await getTransporter();
      await t.sendMail({
        ...target,
        subject: `Brouillon à relire : ${post.title} (${markers.length} marqueur${markers.length > 1 ? 's' : ''})`,
        text: lines.join('\n'),
      });
      return true;
    },
    async notifyNewMessage(message, content) {
      const target = addresses(content);
      if (!target) return false;
      const { to, from } = target;
      const sector = CONTACT_SECTOR_OPTIONS.find((o) => o.value === message.sector)?.label || '';
      const isQuote = message.type !== 'contact';
      const details = [
        ['Type', isQuote ? 'Demande de devis' : 'Question'],
        ['Envoyée depuis', SOURCES[message.source] || ''],
        ['Nom', message.name],
        ['Email', message.email],
        ['Téléphone', message.phone],
        ['Entreprise', message.company],
        ['Activité', sector],
        ['Fonctionnalités', (message.modules || []).join(', ')],
      ]
        .filter(([, value]) => value)
        .map(([label, value]) => `${label} : ${value}`);
      const lines = [
        `${isQuote ? 'Nouvelle demande de devis' : 'Nouveau message'} reçu sur ${content.site.name}`,
        '',
        ...details,
        '',
        message.message,
        '',
        'Retrouvez toutes vos demandes dans l’administration, rubrique « Demandes ».',
      ];
      const t = await getTransporter();
      await t.sendMail({
        from,
        to,
        replyTo: message.email,
        subject: `${isQuote ? 'Nouvelle demande de devis' : 'Nouveau message'} de ${message.name}`,
        text: lines.join('\n'),
      });
      return true;
    },
  };
}
