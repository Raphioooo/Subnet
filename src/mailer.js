// Notification par email des nouveaux messages (facultative, via SMTP).

import { CONTACT_SECTOR_OPTIONS } from './schema.js';

export function createMailer(smtp, log = console) {
  if (!smtp?.host) {
    return { enabled: false, async notifyNewMessage() { return false; } };
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

  return {
    enabled: true,
    async notifyNewMessage(message, content) {
      const to = smtp.to || content.contact.email;
      const from = smtp.from || smtp.user;
      if (!to || !from) {
        log.warn('Email : destinataire ou expéditeur manquant (MAIL_TO / MAIL_FROM).');
        return false;
      }
      const sector = CONTACT_SECTOR_OPTIONS.find((o) => o.value === message.sector)?.label || '';
      const details = [
        ['Nom', message.name],
        ['Email', message.email],
        ['Téléphone', message.phone],
        ['Entreprise', message.company],
        ['Activité', sector],
        ['Fonctionnalités', (message.modules || []).join(', ')],
      ]
        .filter(([, value]) => value)
        .map(([label, value]) => `${label} : ${value}`);
      const lines = [`Nouveau message reçu sur ${content.site.name}`, '', ...details, '', message.message];
      const t = await getTransporter();
      await t.sendMail({
        from,
        to,
        replyTo: message.email,
        subject: `Nouvelle demande de ${message.name}`,
        text: lines.join('\n'),
      });
      return true;
    },
  };
}
