import express from 'express';

// Sites de démonstration : des commerces fictifs (Maison Olive, Atelier Noir…)
// que l'on peut parcourir et essayer, hébergés sur le site de Subnet. Rien n'est
// envoyé : réservations, demandes et acomptes sont simulés dans le navigateur.
// Les pages ne sont pas indexées (ce ne sont pas de vrais commerces).
export const DEMOS = [
  { slug: 'maison-olive', name: 'Maison Olive', kind: 'restaurant', fiction: 'un restaurant fictif', sector: 'restaurateurs', projectId: 'concept-restaurant' },
  { slug: 'atelier-noir', name: 'Atelier Noir', kind: 'studio de tatouage', fiction: 'un studio de tatouage fictif', sector: 'tatoueurs', projectId: 'concept-tatouage' },
  { slug: 'lumen-institut', name: 'Lumen Institut', kind: 'institut de beauté', fiction: 'un institut de beauté fictif', sector: 'instituts', projectId: 'concept-institut' },
  { slug: 'arbor-menuiserie', name: 'Arbor Menuiserie', kind: 'menuiserie', fiction: 'une menuiserie fictive', sector: 'tpe-pme', projectId: 'concept-pme' },
  { slug: 'jardins-du-lavoir', name: 'Les Jardins du Lavoir', kind: 'association', fiction: 'une association fictive', sector: 'associations', projectId: 'concept-association' },
];

export function demoPath(slug) {
  return `/demo/${slug}`;
}

export function demoRouter() {
  const router = express.Router();

  router.get('/demo', (req, res) => res.redirect(302, '/realisations'));

  router.get('/demo/:slug', (req, res, next) => {
    const demo = DEMOS.find((d) => d.slug === req.params.slug);
    if (!demo) return next();
    res.setHeader('X-Robots-Tag', 'noindex');
    res.render(`demo/${demo.slug}`, { demo, contactHref: `/contact?secteur=${demo.sector}` });
  });

  return router;
}
