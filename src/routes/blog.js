import express from 'express';
import { SESSION_COOKIE } from '../auth.js';
import { escapeHtml } from '../markdown.js';
import { POSTS_PER_PAGE, POST_CATEGORIES, categoryOf, effectiveMetaTitle, isPublished, readingTime, renderPost } from '../posts.js';
import { postJsonLd } from '../helpers.js';
import { readCookie } from './admin.js';

const BLOG_TITLE = 'Blog : conseils site internet pour pros | Subnet';
const BLOG_DESCRIPTION =
  'Conseils concrets pour restaurateurs, tatoueurs, instituts et TPE : réservation en ligne, acompte, visibilité sur Google et site internet sur mesure.';

const pageNumber = (raw) => (raw === undefined ? 1 : /^[1-9]\d{0,3}$/.test(String(raw)) ? Number(raw) : null);

export function blogRouter({ store, auth }) {
  const router = express.Router();
  const published = () => store.listPosts().filter((p) => isPublished(p));

  // Publication programmée vérifiée à chaque visite du blog (et toutes les minutes, voir app.js).
  router.use(['/blog', '/sitemap.xml'], async (req, res, next) => {
    await store.publishDue();
    next();
  });

  const renderList = (req, res, next, { category = null } = {}) => {
    const page = pageNumber(req.query.page);
    if (!page) return next();
    const all = published().filter((p) => !category || p.category === category.value);
    const pages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
    if (page > pages) return next();
    const basePath = category ? `/blog/categorie/${category.value}` : '/blog';
    const at = (n) => (n === 1 ? basePath : `${basePath}?page=${n}`);
    const used = new Set(published().map((p) => p.category));
    const titleBase = category ? `Blog ${category.label} : conseils site internet | Subnet` : BLOG_TITLE;
    res.render('pages/blog', {
      page: {
        fullTitle: page > 1 ? titleBase.replace(' | Subnet', ` (page ${page}) | Subnet`) : titleBase,
        description: category
          ? `Articles du blog Subnet pour les ${category.label.toLowerCase()} : réservation en ligne, acompte, visibilité sur Google et site sur mesure.`
          : BLOG_DESCRIPTION,
        path: at(page),
        prev: page > 1 ? at(page - 1) : '',
        next: page < pages ? at(page + 1) : '',
      },
      posts: all.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE).map((p) => ({ ...p, minutes: readingTime(p.content) })),
      categories: POST_CATEGORIES.filter((c) => used.has(c.value)),
      category,
      pagination: { page, pages, at },
    });
  };

  router.get('/blog', (req, res, next) => renderList(req, res, next));

  router.get('/blog/categorie/:category', (req, res, next) => {
    const category = categoryOf(req.params.category);
    if (!category) return next();
    renderList(req, res, next, { category });
  });

  router.get('/blog/rss.xml', (req, res) => {
    const { c, baseUrl } = res.locals;
    const posts = published().slice(0, 30);
    const items = posts
      .map((p) => {
        const url = `${baseUrl}/blog/${p.slug}`;
        return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <category>${escapeHtml(categoryOf(p.category)?.label || p.category)}</category>
      <description>${escapeHtml(p.excerpt || p.metaDescription)}</description>
    </item>`;
      })
      .join('\n');
    res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog ${escapeHtml(c.site.name)}</title>
    <link>${baseUrl}/blog</link>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${escapeHtml(BLOG_DESCRIPTION)}</description>
    <language>fr-FR</language>
${items}
  </channel>
</rss>
`);
  });

  router.get('/blog/:slug', (req, res, next) => {
    const { c, baseUrl } = res.locals;
    const post = store.getPostBySlug(req.params.slug);
    if (!post) return next();
    const live = isPublished(post);
    // Brouillons et articles programmés : 404 au public, aperçu pour l'admin connecté.
    const preview = !live && 'preview' in req.query && auth.verifyToken(readCookie(req, SESSION_COOKIE));
    if (!live && !preview) return next();
    if (preview) res.setHeader('Cache-Control', 'no-store');

    const category = categoryOf(post.category);
    const sector = category?.sector ? c.sectors.find((s) => s.slug === category.sector) : null;
    const related = published()
      .filter((p) => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
    const { html, toc } = renderPost(post);
    const image = baseUrl + (post.coverImage || c.site.shareImage || '/assets/images/og.jpg');
    res.render('pages/post', {
      page: {
        fullTitle: effectiveMetaTitle(post),
        description: post.metaDescription || post.excerpt,
        path: `/blog/${post.slug}`,
        image: post.coverImage || '',
        ogType: 'article',
        publishedTime: live ? post.publishedAt : '',
        modifiedTime: post.updatedAt,
        noindex: preview,
      },
      post,
      preview,
      html,
      toc,
      minutes: readingTime(post.content),
      category,
      sector,
      related,
      jsonLd: postJsonLd(post, { baseUrl, image }),
    });
  });

  return router;
}
