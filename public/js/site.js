// Subnet — interactions du site public (sans dépendance).
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // En-tête : filet discret au défilement.
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Menu mobile.
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (toggle && menu) {
    const label = toggle.querySelector('.sr-only');
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      header?.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 881px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  // Apparition progressive des blocs au défilement.
  const revealables = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduceMotion) {
    const groups = new Map();
    for (const el of revealables) {
      const parent = el.parentElement;
      const index = groups.get(parent) || 0;
      groups.set(parent, index + 1);
      if (index) el.style.setProperty('--delay', `${Math.min(index, 6) * 70}ms`);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    revealables.forEach((el) => observer.observe(el));
    document.documentElement.classList.add('reveal-ready');
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
    document.documentElement.classList.add('reveal-ready');
  }

  // Vitrine de la page d'accueil : un exemple de site par secteur.
  const showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    const buttons = [...showcase.querySelectorAll('[data-slide-to]')];
    const slides = [...showcase.querySelectorAll('[data-slide]')];
    let current = 0;
    let timer = null;
    let visible = true;

    const show = (index) => {
      current = (index + buttons.length) % buttons.length;
      for (const slide of slides) {
        const active = Number(slide.dataset.slide) === current;
        slide.classList.toggle('is-active', active);
        if (slide.closest('.browser')) slide.setAttribute('aria-hidden', String(!active));
      }
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === current)));
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const start = () => {
      if (reduceMotion || timer || !visible) return;
      timer = setInterval(() => show(current + 1), 4500);
    };

    buttons.forEach((button, i) =>
      button.addEventListener('click', () => {
        stop();
        show(i);
        showcase.dataset.manual = 'true';
      }),
    );
    showcase.addEventListener('mouseenter', stop);
    showcase.addEventListener('mouseleave', () => {
      if (!showcase.dataset.manual) start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !showcase.dataset.manual) start();
        else stop();
      }).observe(showcase);
    } else {
      start();
    }
  }

  // Filtres des réalisations.
  const filters = document.querySelector('[data-filters]');
  if (filters) {
    const cards = [...document.querySelectorAll('[data-project]')];
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      const value = button.dataset.filter;
      for (const b of filters.querySelectorAll('[data-filter]')) b.setAttribute('aria-pressed', String(b === button));
      for (const card of cards) {
        const show = !value || card.dataset.sector === value;
        card.hidden = !show;
        if (show) card.classList.add('is-visible');
      }
    });
  }

  // Visionneuse des réalisations.
  const dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    const img = dialog.querySelector('[data-lightbox-img]');
    const title = dialog.querySelector('[data-lightbox-title]');
    const text = dialog.querySelector('[data-lightbox-text]');
    const meta = dialog.querySelector('[data-lightbox-meta]');
    const link = dialog.querySelector('[data-lightbox-link]');
    let opener = null;

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-lightbox]');
      if (!trigger) return;
      opener = trigger;
      const d = trigger.dataset;
      img.src = d.src;
      img.alt = d.title || '';
      title.textContent = d.title || '';
      text.textContent = d.text || '';
      text.hidden = !d.text;
      meta.replaceChildren();
      if (d.badge) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = d.badge;
        meta.append(badge);
      }
      if (d.sectorLabel) {
        const sector = document.createElement('span');
        sector.textContent = d.sectorLabel;
        meta.append(sector);
      }
      link.hidden = !d.url;
      if (d.url) link.href = d.url;
      dialog.showModal();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-lightbox-close]')) dialog.close();
    });
    dialog.addEventListener('close', () => opener?.focus());
  }

  // Formulaire de contact : évite les doubles envois.
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type="submit"]');
      if (!button) return;
      button.disabled = true;
      button.textContent = 'Envoi en cours…';
    });
  }
})();
