// Sites de démonstration : tout est simulé dans le navigateur, rien n'est envoyé.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const euros = (n) => `${Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
  const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  // Menu mobile
  const toggle = $('[data-menu-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.d-nav a').forEach((a) => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Filtres (carte, portfolio, soins, réalisations)
  for (const group of $$('[data-filter-group]')) {
    const scope = group.closest('section') || document;
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      $$('[data-filter]', group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const value = btn.dataset.filter;
      $$('[data-tags]', scope).forEach((item) => {
        item.hidden = value !== 'tout' && !item.dataset.tags.split(' ').includes(value);
      });
    });
  }

  // Fichiers joints : on affiche seulement leur nom, rien n'est envoyé.
  for (const input of $$('input[type=file][data-files]')) {
    const list = document.getElementById(input.dataset.files);
    input.addEventListener('change', () => {
      list.replaceChildren(...[...input.files].slice(0, 6).map((f) => Object.assign(document.createElement('li'), { textContent: f.name })));
    });
  }

  // Prochains jours d'ouverture
  function fillDays(box) {
    const closed = (box.dataset.closed || '').split(',').filter(Boolean).map(Number);
    const count = Number(box.dataset.days) || 6;
    const day = new Date();
    day.setDate(day.getDate() + (Number(box.dataset.from) || 0));
    const buttons = [];
    while (buttons.length < count) {
      if (!closed.includes(day.getDay())) {
        const label = `${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}`;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'd-chip';
        b.dataset.pick = box.dataset.pickName || 'date';
        b.dataset.value = label;
        b.innerHTML = `<small>${DAYS[day.getDay()]}</small><strong>${day.getDate()}</strong><small>${MONTHS[day.getMonth()]}</small>`;
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', label);
        buttons.push(b);
      }
      day.setDate(day.getDate() + 1);
    }
    box.replaceChildren(...buttons);
  }
  $$('[data-days]').forEach(fillDays);

  // Parcours en étapes : réservation, demande de devis, acompte, confirmation.
  for (const flow of $$('[data-flow]')) {
    const steps = $$('[data-step]', flow);
    const state = {};
    const labels = {};
    let current = 0;
    const rate = Number(flow.dataset.depositRate) || 0;

    const deposit = () => {
      if (state.deposit !== undefined) return Number(state.deposit);
      if (rate && state.price) return Math.round(Number(state.price) * rate);
      return 0;
    };
    const matches = (cond) => {
      if (!cond) return false;
      const [key, value] = cond.split('=');
      const actual = key === 'deposit' ? String(deposit()) : String(state[key] ?? '');
      return actual === value;
    };
    const render = () => {
      for (const el of $$('[data-show]', flow)) {
        const key = el.dataset.show;
        let value = labels[key] ?? state[key];
        if (key === 'deposit') value = euros(deposit());
        else if (key === 'price' && state.price) value = euros(state.price);
        else if (key === 'rest' && state.price) value = euros(Number(state.price) - deposit());
        el.textContent = value ?? el.dataset.empty ?? '—';
      }
      for (const el of $$('[data-if]', flow)) el.hidden = !matches(el.dataset.if);
      for (const el of $$('[data-unless]', flow)) el.hidden = matches(el.dataset.unless);
      steps.forEach((s, i) => {
        s.hidden = i !== current;
        const needs = (s.dataset.requires || '').split(',').filter(Boolean);
        $$('[data-next]', s).forEach((b) => {
          if (b.type !== 'submit') b.disabled = needs.some((k) => state[k] === undefined);
        });
      });
      $$('[data-progress] li', flow).forEach((li, i) => {
        li.classList.toggle('is-done', i < Number(steps[current].dataset.stage ?? current));
        li.classList.toggle('is-current', i === Number(steps[current].dataset.stage ?? current));
      });
    };
    const go = (dir) => {
      let next = current + dir;
      while (steps[next] && matches(steps[next].dataset.skipIf)) next += dir;
      if (!steps[next]) return;
      current = next;
      if (steps[current].hasAttribute('data-final')) state.ref = `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
      render();
      const focusable = steps[current].querySelector('h3, h4, [tabindex="-1"]');
      if (focusable) {
        focusable.setAttribute('tabindex', '-1');
        focusable.focus({ preventScroll: true });
      }
      const top = flow.getBoundingClientRect().top;
      if (top < 0) flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    flow.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick && !pick.disabled) {
        const key = pick.dataset.pick;
        $$(`[data-pick="${key}"]`, flow).forEach((b) => b.setAttribute('aria-pressed', String(b === pick)));
        state[key] = pick.dataset.value;
        labels[key] = pick.dataset.label || pick.dataset.value;
        if (pick.dataset.price !== undefined) state.price = pick.dataset.price;
        if (pick.dataset.deposit !== undefined) state.deposit = pick.dataset.deposit;
        render();
        if (pick.hasAttribute('data-auto')) go(1);
        return;
      }
      if (e.target.closest('[data-next]:not([type=submit])')) go(1);
      else if (e.target.closest('[data-prev]')) go(-1);
      else if (e.target.closest('[data-pay]')) {
        const btn = e.target.closest('[data-pay]');
        btn.disabled = true;
        btn.classList.add('is-loading');
        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('is-loading');
          go(1);
        }, 1100);
      } else if (e.target.closest('[data-restart]')) {
        for (const k of Object.keys(state)) delete state[k];
        for (const k of Object.keys(labels)) delete labels[k];
        $$('[data-pick]', flow).forEach((b) => b.setAttribute('aria-pressed', 'false'));
        $$('form', flow).forEach((f) => f.reset());
        $$('[data-files]', flow).forEach((i) => document.getElementById(i.dataset.files)?.replaceChildren());
        current = 0;
        render();
      }
    });

    flow.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      if (!form.reportValidity()) return;
      for (const [k, v] of new FormData(form)) {
        if (typeof v !== 'string') continue;
        const field = form.elements[k];
        const option = field?.tagName === 'SELECT' ? field.selectedOptions[0] : null;
        state[k] = v.trim();
        labels[k] = option ? option.textContent.trim() : v.trim();
        if (option?.dataset.price !== undefined) state.price = option.dataset.price;
      }
      go(1);
    });

    render();
  }

  // Formulaires simples (newsletter, contact, adhésion…)
  for (const form of $$('form[data-demo-form]')) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const done = document.getElementById(form.dataset.demoForm);
      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
      }
    });
  }
})();
