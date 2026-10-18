// Subnet — espace d'administration (sans dépendance).
(() => {
  const ICONS = {
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  };

  // Notifications ---------------------------------------------------------
  const toasts = document.querySelector('[data-toasts]');
  function toast(message, { type = 'success', details = [], duration = 3200 } = {}) {
    if (!toasts) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = type === 'error' ? ICONS.alert : ICONS.check;
    const body = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = message;
    body.append(title);
    if (details.length) {
      const list = document.createElement('ul');
      for (const d of details.slice(0, 6)) {
        const li = document.createElement('li');
        li.textContent = d;
        list.append(li);
      }
      body.append(list);
    }
    el.append(body);
    toasts.append(el);
    setTimeout(() => el.remove(), type === 'error' ? Math.max(duration, 7000) : duration);
  }

  async function postJson(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      credentials: 'same-origin',
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = { ok: false, errors: ['Réponse inattendue du serveur.'] };
    }
    return { status: response.status, ...payload };
  }

  // Menu latéral (mobile) -------------------------------------------------
  const sidebar = document.querySelector('[data-sidebar]');
  const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
  const backdrop = document.querySelector('[data-sidebar-close]');
  const setSidebar = (open) => {
    sidebar?.classList.toggle('is-open', open);
    sidebarToggle?.setAttribute('aria-expanded', String(open));
    if (backdrop) backdrop.hidden = !open;
  };
  sidebarToggle?.addEventListener('click', () => setSidebar(!sidebar.classList.contains('is-open')));
  backdrop?.addEventListener('click', () => setSidebar(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar?.classList.contains('is-open')) setSidebar(false);
  });

  // Filtres envoyés dès qu'ils changent.
  for (const el of document.querySelectorAll('[data-autosubmit]')) {
    el.addEventListener('change', () => el.form?.submit());
  }

  // Confirmation avant certaines actions ----------------------------------
  document.addEventListener('submit', (event) => {
    const message = event.target.dataset?.confirm;
    if (message && !window.confirm(message)) event.preventDefault();
  });

  // Éditeur de contenus ---------------------------------------------------
  const editor = document.querySelector('[data-editor]');
  if (editor) initEditor(editor);

  function initEditor(form) {
    const pageId = form.dataset.page;
    const savebar = form.querySelector('[data-savebar]');
    const status = form.querySelector('[data-status]');
    const saveButton = form.querySelector('[data-save]');
    const iconLibrary = document.getElementById('icon-library');
    let dirty = false;
    let saving = false;
    let pendingUploads = 0;

    const setDirty = (value) => {
      dirty = value;
      savebar.classList.toggle('is-dirty', value);
      saveButton.disabled = !value || saving;
      status.textContent = value ? 'Modifications non enregistrées' : 'Toutes les modifications sont enregistrées';
    };

    // Lecture des valeurs à partir de la structure du formulaire.
    const ownFields = (scope) =>
      [...scope.querySelectorAll('[data-field]')].filter((el) => el.parentElement.closest('[data-scope]') === scope);

    function readScope(scope) {
      const data = {};
      for (const el of ownFields(scope)) data[el.dataset.field] = readField(el);
      return data;
    }

    function readField(el) {
      switch (el.dataset.type) {
        case 'hidden':
          return el.value;
        case 'toggle':
          return el.querySelector('[data-input]').checked;
        case 'group':
          return readScope(el);
        case 'list':
          return [...el.querySelector(':scope > [data-items]').children].map((item) => item.querySelector('[data-input]').value);
        case 'repeater':
          return [...el.querySelector(':scope > [data-items]').children].map((item) => readScope(item));
        default:
          return el.querySelector('[data-input]').value;
      }
    }

    function collect() {
      return { sections: [...form.querySelectorAll('[data-section]')].map((section) => readScope(section)) };
    }

    // Mise à jour de l'en-tête d'un élément (titre, vignette, statut).
    function refreshItemHead(item) {
      const repeater = item.closest('[data-type="repeater"]');
      if (!repeater) return;
      const labelKey = repeater.dataset.itemLabel;
      const title = item.querySelector(':scope > .r-item__head [data-title]');
      if (title && labelKey) {
        const field = ownFields(item).find((f) => f.dataset.field === labelKey);
        const input = field?.querySelector('[data-input]');
        let text = input?.value?.trim() || '';
        if (input?.tagName === 'SELECT') text = input.selectedOptions[0]?.textContent || text;
        title.textContent = text || 'Nouvel élément';
      }
      const thumbKey = repeater.dataset.thumbKey;
      const thumb = item.querySelector(':scope > .r-item__head [data-thumb]');
      if (thumb && thumbKey) {
        const field = ownFields(item).find((f) => f.dataset.field === thumbKey);
        const url = field?.querySelector('[data-input]')?.value;
        thumb.replaceChildren();
        if (url) {
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          thumb.append(img);
        }
      }
      const badge = item.querySelector(':scope > .r-item__head [data-hidden-badge]');
      if (badge) {
        const visible = ownFields(item).find((f) => f.dataset.field === 'visible');
        badge.hidden = !visible || visible.querySelector('[data-input]').checked;
      }
    }

    function refreshLimits(field) {
      const add = field.querySelector(':scope > [data-action="add"]');
      const items = field.querySelector(':scope > [data-items]');
      if (add && items) add.disabled = items.children.length >= Number(field.dataset.max || 50);
    }

    function refreshMoveButtons(container) {
      const items = [...container.children];
      items.forEach((item, index) => {
        const actions = item.querySelector(':scope > .r-item__head .item-actions, :scope > .item-actions');
        if (!actions) return;
        const up = actions.querySelector('[data-action="up"]');
        const down = actions.querySelector('[data-action="down"]');
        if (up) up.disabled = index === 0;
        if (down) down.disabled = index === items.length - 1;
      });
    }

    form.querySelectorAll('[data-items]').forEach(refreshMoveButtons);
    form.querySelectorAll('[data-type="list"], [data-type="repeater"]').forEach(refreshLimits);

    const refreshCounter = (counter) => {
      const input = counter.closest('[data-field]')?.querySelector('[data-input]');
      if (!input) return;
      const length = input.value.length;
      counter.querySelector('[data-count]').textContent = length;
      counter.classList.toggle('is-over', length > Number(counter.dataset.counter));
    };
    form.querySelectorAll('[data-counter]').forEach(refreshCounter);

    form.addEventListener('input', (event) => {
      setDirty(true);
      const counter = event.target.closest('[data-field]')?.querySelector(':scope > [data-counter]');
      if (counter) refreshCounter(counter);
      const item = event.target.closest('.r-item');
      if (item) refreshItemHead(item);
    });

    form.addEventListener('change', (event) => {
      setDirty(true);
      const target = event.target;
      if (target.matches('[data-icon-select]')) {
        const preview = target.closest('.select')?.querySelector('[data-icon-preview]');
        const svg = iconLibrary?.content.querySelector(`[data-icon-name="${CSS.escape(target.value)}"]`);
        if (preview && svg) preview.innerHTML = svg.innerHTML;
      }
      if (target.matches('[data-file]')) uploadImage(target);
      const item = target.closest('.r-item');
      if (item) refreshItemHead(item);
    });

    form.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button || !form.contains(button)) return;
      const action = button.dataset.action;
      if (action === 'pick-image' || action === 'clear-image') return;

      if (action === 'toggle-card') {
        const card = button.closest('.card');
        const body = card.querySelector('.card__body');
        const open = body.hidden;
        body.hidden = !open;
        card.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
        return;
      }

      if (action === 'toggle') {
        const item = button.closest('.r-item');
        const body = item.querySelector(':scope > .r-item__body');
        const open = body.hidden;
        body.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        return;
      }

      if (action === 'add') {
        const field = button.closest('[data-field]');
        const container = field.querySelector(':scope > [data-items]');
        const template = field.querySelector(':scope > template[data-template]');
        const fragment = template.content.cloneNode(true);
        const element = fragment.firstElementChild;
        container.append(fragment);
        refreshMoveButtons(container);
        refreshLimits(field);
        element.querySelectorAll('[data-items]').forEach(refreshMoveButtons);
        element.querySelector('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]), textarea')?.focus();
        setDirty(true);
        return;
      }

      const item = button.closest('[data-item]');
      if (!item) return;
      const container = item.parentElement;

      if (action === 'remove') {
        const hasContent = [...item.querySelectorAll('[data-input]')].some(
          (input) => input.type !== 'checkbox' && input.tagName !== 'SELECT' && input.value.trim(),
        );
        if (hasContent && !window.confirm('Supprimer cet élément ?')) return;
        const field = container.closest('[data-field]');
        item.remove();
        refreshMoveButtons(container);
        refreshLimits(field);
        setDirty(true);
        return;
      }

      if (action === 'up' || action === 'down') {
        const sibling = action === 'up' ? item.previousElementSibling : item.nextElementSibling;
        if (!sibling) return;
        if (action === 'up') container.insertBefore(item, sibling);
        else container.insertBefore(sibling, item);
        refreshMoveButtons(container);
        item.classList.add('is-moved');
        setTimeout(() => item.classList.remove('is-moved'), 600);
        button.focus();
        setDirty(true);
      }
    });

    // Champs image : choix et retrait du fichier.
    form.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="pick-image"], [data-action="clear-image"]');
      if (!button) return;
      const field = button.closest('[data-type="image"]');
      if (button.dataset.action === 'pick-image') {
        field.querySelector('[data-file]').click();
        return;
      }
      setImage(field, '');
      setDirty(true);
    });

    function setImage(field, url) {
      field.querySelector('[data-input]').value = url;
      const preview = field.querySelector('[data-preview]');
      preview.replaceChildren();
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        preview.append(img);
      } else {
        preview.innerHTML =
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
      }
      field.querySelector('[data-pick-label]').textContent = url ? 'Remplacer' : 'Choisir une image';
      field.querySelector('[data-action="clear-image"]').hidden = !url;
      const item = field.closest('.r-item');
      if (item) refreshItemHead(item);
    }

    // Redimensionne l'image dans le navigateur avant l'envoi.
    async function prepareImage(file, keepAlpha) {
      const MAX = 2400;
      if (file.type === 'image/gif') return file;
      let bitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        return file;
      }
      const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
      let blob = await toBlob('image/webp', 0.86);
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(keepAlpha ? 'image/png' : 'image/jpeg', 0.88);
      if (!blob) return file;
      return scale < 1 || blob.size < file.size ? blob : file;
    }

    async function uploadImage(input) {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      const field = input.closest('[data-type="image"]');
      const wrapper = field.querySelector('.image-field');
      wrapper.classList.add('is-uploading');
      pendingUploads += 1;
      savebar.classList.add('is-busy');
      status.textContent = 'Envoi de l’image…';
      try {
        const blob = await prepareImage(file, field.hasAttribute('data-keep-alpha'));
        if (blob.size > 12 * 1024 * 1024) throw new Error('Image trop lourde (12 Mo maximum).');
        const response = await fetch('/admin/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': blob.type || 'application/octet-stream' },
          body: blob,
          credentials: 'same-origin',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.errors?.[0] || 'L’image n’a pas pu être envoyée.');
        setImage(field, data.url);
        setDirty(true);
        toast('Image ajoutée. Pensez à enregistrer.');
      } catch (error) {
        toast(error.message, { type: 'error' });
        setDirty(dirty);
      } finally {
        wrapper.classList.remove('is-uploading');
        pendingUploads -= 1;
        savebar.classList.toggle('is-busy', pendingUploads > 0);
      }
    }

    async function save() {
      if (saving || pendingUploads) return;
      // Une ligne ajoutée puis laissée vide est simplement ignorée (comme côté serveur).
      const isBlankItem = (item) =>
        [...item.querySelectorAll('[data-input]')].every((i) => i.type === 'checkbox' || i.tagName === 'SELECT' || !i.value.trim());
      const invalid = [...form.querySelectorAll('[data-input][required]')].find((input) => {
        if (input.value.trim()) return false;
        const item = input.closest('.r-item');
        return !(item && isBlankItem(item));
      });
      if (invalid) {
        const item = invalid.closest('.r-item__body');
        if (item?.hidden) item.parentElement.querySelector('[data-action="toggle"]')?.click();
        const card = invalid.closest('.card__body');
        if (card?.hidden) card.parentElement.querySelector('[data-action="toggle-card"]')?.click();
        invalid.focus();
        invalid.closest('.field')?.classList.add('has-error');
        toast('Un champ obligatoire est vide.', { type: 'error' });
        return;
      }
      saving = true;
      saveButton.disabled = true;
      savebar.classList.add('is-busy');
      status.textContent = 'Enregistrement…';
      try {
        const result = await postJson(`/admin/api/pages/${pageId}`, collect());
        if (result.status === 401) {
          toast('Votre session a expiré. Reconnectez-vous dans un autre onglet, puis enregistrez à nouveau.', { type: 'error' });
          setDirty(true);
          return;
        }
        if (!result.ok) {
          toast('Certaines informations sont à corriger :', { type: 'error', details: result.errors || [] });
          setDirty(true);
          return;
        }
        form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
        setDirty(false);
        toast('Modifications enregistrées et publiées.');
      } catch {
        toast('Connexion impossible : vérifiez votre réseau puis réessayez.', { type: 'error' });
        setDirty(true);
      } finally {
        saving = false;
        saveButton.disabled = !dirty;
        savebar.classList.remove('is-busy');
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      save();
    });

    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (dirty) save();
      }
    });

    form.addEventListener('focusin', (event) => event.target.closest('.field')?.classList.remove('has-error'));

    window.addEventListener('beforeunload', (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
  }

  // Messages : marqués comme lus à l'ouverture ------------------------------
  document.querySelectorAll('details[data-message]').forEach((details) => {
    details.addEventListener('toggle', async () => {
      const item = details.closest('.message');
      if (!details.open || !item.classList.contains('is-unread')) return;
      const result = await postJson(`/admin/api/messages/${details.dataset.message}/read`, {}).catch(() => null);
      if (!result?.ok) return;
      item.classList.remove('is-unread');
      const count = document.querySelector('[data-unread-count]');
      if (count) {
        count.textContent = result.unread;
        count.hidden = !result.unread;
      }
    });
  });
  if (location.hash.startsWith('#m-')) {
    const target = document.getElementById(location.hash.slice(1))?.querySelector('details');
    if (target) target.open = true;
  }

  // Prospection : copie, ouverture de WhatsApp et suivi de la recherche --------
  const prospects = document.querySelector('[data-prospects]');
  if (prospects) {
    const setBadge = (item, label, value) => {
      const badge = item.querySelector('[data-status-badge]');
      if (!badge) return;
      badge.textContent = label;
      badge.className = `status pro-status pro-status--${value}`;
      for (const button of item.querySelectorAll('.pro-switch button')) button.setAttribute('aria-pressed', String(button.value === value));
    };
    prospects.addEventListener('click', async (event) => {
      const copy = event.target.closest('[data-copy]');
      if (copy) {
        const field = document.getElementById(copy.dataset.copy);
        try {
          await navigator.clipboard.writeText(field.value);
        } catch {
          field.select();
          document.execCommand('copy');
        }
        toast('Message copié.');
        return;
      }
      const link = event.target.closest('[data-whatsapp]');
      if (!link) return;
      // Le texte envoyé est celui du champ, modifications comprises.
      const field = document.getElementById(link.dataset.whatsapp);
      const url = new URL(link.href);
      url.searchParams.set('text', field.value);
      link.href = url.toString();
      const id = link.dataset.markSent;
      if (!id) return;
      postJson(`/admin/api/prospection/${id}/envoye`, {})
        .then((result) => {
          if (!result.ok) return;
          setBadge(link.closest('.pro-item'), 'Message envoyé', result.status);
          const count = document.querySelector('.nav-link[href="/admin/prospection"] .nav-count');
          if (count) {
            count.textContent = result.toContact;
            count.hidden = !result.toContact;
          }
          toast('Fiche passée en « Message envoyé » (modifiable en bas de la fiche).');
        })
        .catch(() => {});
    });
    prospects.addEventListener('input', (event) => {
      const form = event.target.closest('[data-message-form]');
      const save = form?.querySelector('[data-save-message]');
      if (save) save.disabled = false;
    });
  }

  const jobBanner = document.querySelector('[data-job-poll]');
  if (jobBanner) {
    const step = jobBanner.querySelector('[data-job-step]');
    const tick = async () => {
      try {
        const response = await fetch('/admin/prospection/etat', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
        const state = await response.json();
        if (!state.running) {
          location.href = '/admin/prospection';
          return;
        }
        if (step && state.step) step.textContent = state.step;
      } catch {
        // Réseau indisponible : on réessaie au prochain tour.
      }
      setTimeout(tick, 3000);
    };
    setTimeout(tick, 3000);
  }

  // Restauration d'une sauvegarde ---------------------------------------------
  const importButton = document.querySelector('[data-action="import"]');
  const importFile = document.querySelector('[data-import-file]');
  if (importButton && importFile) {
    importButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files?.[0];
      importFile.value = '';
      if (!file) return;
      if (!window.confirm('Remplacer tous les contenus actuels par ceux de cette sauvegarde ?')) return;
      try {
        const data = JSON.parse(await file.text());
        const result = await postJson('/admin/api/import', data);
        if (!result.ok) {
          toast('Restauration impossible :', { type: 'error', details: result.errors || [] });
          return;
        }
        toast('Sauvegarde restaurée.');
      } catch {
        toast('Ce fichier n’est pas une sauvegarde valide.', { type: 'error' });
      }
    });
  }
  // Éditeur d'articles du blog -----------------------------------------------
  const postEditor = document.querySelector('[data-post-editor]');
  if (postEditor) initPostEditor(postEditor);

  function initPostEditor(form) {
    const MARKER_RE = /\[\s*[ÀA]\s+COMPL[ÉE]TER\b[^\]]*\]?/giu;
    const SUFFIX = ' | Subnet';
    const $ = (sel) => form.querySelector(sel);
    const field = (name) => form.elements.namedItem(name);
    const status = $('[data-save-status]');
    let id = form.dataset.id;
    let dirty = false;
    let busy = false;

    const words = (text) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

    // Compteurs de caractères : vert, orange, rouge selon les limites.
    function level(name, length) {
      const el = $(`[data-counter="${name}"]`);
      const max = Number(el.dataset.max);
      const min = Number(el.dataset.min || 0);
      if (min) return length >= min && length <= max ? 'ok' : length >= min - 20 && length <= max ? 'warn' : 'bad';
      if (!length) return name === 'slug' || name === 'metaTitle' ? 'warn' : 'bad';
      return length > max ? 'bad' : length > max * 0.9 ? 'warn' : 'ok';
    }

    function metaTitle() {
      return field('metaTitle').value.trim() || `${field('title').value.trim()}${SUFFIX}`;
    }

    function refreshCounters() {
      for (const el of form.querySelectorAll('[data-counter]')) {
        const name = el.dataset.counter;
        let length = field(name).value.trim().length;
        let suffix = '';
        if (name === 'metaTitle' && !length) {
          length = metaTitle().length;
          suffix = ' (auto)';
        }
        const max = el.dataset.max;
        const min = el.dataset.min;
        el.textContent = `${length}${min ? ` / ${min}–${max}` : ` / ${max}`}${suffix}`;
        el.dataset.level = name === 'metaTitle' && suffix ? (length > Number(max) ? 'bad' : 'warn') : level(name, length);
      }
      for (const item of form.querySelectorAll('[data-faq-item]')) {
        const n = words(item.querySelector('[data-faq-answer]').value);
        const counter = item.querySelector('[data-words]');
        counter.textContent = `${n} mots (40–80 conseillés)`;
        counter.dataset.level = n >= 40 && n <= 80 ? 'ok' : n ? 'warn' : 'bad';
      }
      const content = field('content').value;
      const n = words(content);
      $('[data-content-stats]').textContent = `${n} mots · ${Math.max(1, Math.round(n / 200))} min de lecture`;
    }

    function refreshSerp() {
      const slug = field('slug').value.trim() || '…';
      $('[data-serp-url]').textContent = ` › blog › ${slug}`;
      $('[data-serp-title]').textContent = metaTitle();
      $('[data-serp-desc]').textContent = field('metaDescription').value.trim() || field('excerpt').value.trim() || 'Ajoutez une description Google (120 à 158 caractères).';
    }

    function allText() {
      return [...form.querySelectorAll('input:not([type=hidden]):not([type=file]):not([type=datetime-local]), textarea')].map((el) => el.value).join('\n');
    }

    function refreshMarkers() {
      const markers = allText().match(MARKER_RE) || [];
      const card = $('[data-markers]');
      card.classList.toggle('is-clear', !markers.length);
      $('[data-markers-title]').textContent = markers.length
        ? `${markers.length} marqueur${markers.length > 1 ? 's' : ''} à compléter avant publication`
        : 'Aucun marqueur restant';
      $('[data-markers-help]').textContent = markers.length
        ? 'Remplacez chaque marqueur par une information réelle (exemple client, chiffre, expérience), puis publiez.'
        : 'L’article peut être publié dès que les champs SEO sont au vert.';
      const list = $('[data-markers-list]');
      list.replaceChildren(...markers.map((m) => Object.assign(document.createElement('li'), { textContent: m })));
      for (const name of ['publish', 'schedule']) $(`[data-action="${name}"]`).disabled = markers.length > 0 || busy;
      $('[data-publish-hint]').hidden = !markers.length;
    }

    const refreshAll = () => {
      refreshCounters();
      refreshSerp();
      refreshMarkers();
      $('[data-faq-empty]').hidden = form.querySelectorAll('[data-faq-item]').length > 0;
      $('[data-faq-add]').disabled = form.querySelectorAll('[data-faq-item]').length >= 6;
    };

    const setDirty = (value) => {
      dirty = value;
      status.textContent = value ? 'Modifications non enregistrées' : '';
    };

    form.addEventListener('input', () => {
      setDirty(true);
      refreshAll();
    });
    form.addEventListener('change', () => setDirty(true));
    window.addEventListener('beforeunload', (event) => {
      if (dirty) event.preventDefault();
    });

    // Onglets Écrire / Aperçu : rendu côté serveur, identique au site.
    for (const tab of form.querySelectorAll('[data-md-tab]')) {
      tab.addEventListener('click', async () => {
        const preview = tab.dataset.mdTab === 'preview';
        for (const t of form.querySelectorAll('[data-md-tab]')) t.setAttribute('aria-selected', String(t === tab));
        document.getElementById('md-write').hidden = preview;
        document.getElementById('md-preview').hidden = !preview;
        if (!preview) return;
        const result = await postJson('/admin/api/articles/apercu', { content: field('content').value }).catch(() => null);
        if (result?.ok) $('[data-md-preview]').innerHTML = result.html;
      });
    }

    // FAQ : ajout et suppression de questions.
    const faqList = $('[data-faq-list]');
    $('[data-faq-add]').addEventListener('click', () => {
      const item = document.getElementById('faq-item-template').content.firstElementChild.cloneNode(true);
      faqList.append(item);
      item.querySelector('input').focus();
      setDirty(true);
      refreshAll();
    });
    faqList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-faq-remove]');
      if (!button) return;
      button.closest('[data-faq-item]').remove();
      setDirty(true);
      refreshAll();
    });

    // Image de couverture.
    const cover = $('[data-cover]');
    const setCover = (url) => {
      field('coverImage').value = url;
      const img = cover.querySelector('[data-cover-img]');
      img.hidden = !url;
      if (url) img.src = url;
      else img.removeAttribute('src');
      cover.querySelector('[data-cover-remove]').hidden = !url;
      setDirty(true);
    };
    cover.querySelector('[data-cover-remove]').addEventListener('click', () => setCover(''));
    cover.querySelector('[data-cover-file]').addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        if (file.size > 12 * 1024 * 1024) throw new Error('Image trop lourde (12 Mo maximum).');
        const response = await fetch('/admin/api/upload', { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file, credentials: 'same-origin' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.errors?.[0] || 'L’image n’a pas pu être envoyée.');
        setCover(data.url);
        toast('Image ajoutée. Pensez à enregistrer.');
      } catch (error) {
        toast(error.message, { type: 'error' });
      }
    });

    function collect() {
      const value = (name) => field(name).value;
      return {
        title: value('title'),
        slug: value('slug'),
        metaTitle: value('metaTitle'),
        metaDescription: value('metaDescription'),
        excerpt: value('excerpt'),
        content: value('content'),
        coverImage: value('coverImage'),
        coverAlt: value('coverAlt'),
        category: value('category'),
        tags: value('tags').split(',').map((t) => t.trim()).filter(Boolean),
        targetKeyword: value('targetKeyword'),
        topicId: value('topicId'),
        faq: [...form.querySelectorAll('[data-faq-item]')]
          .map((item) => ({ question: item.querySelector('[data-faq-question]').value, answer: item.querySelector('[data-faq-answer]').value }))
          .filter((f) => f.question.trim() || f.answer.trim()),
      };
    }

    const DONE = {
      save: 'Article enregistré.',
      publish: 'Article publié.',
      schedule: 'Publication programmée.',
      unpublish: 'Article repassé en brouillon.',
    };

    async function run(action) {
      if (busy) return;
      const payload = { action, post: collect() };
      if (action === 'schedule') {
        const at = $('[data-schedule-at]').value;
        if (!at) {
          toast('Choisissez la date et l’heure de publication.', { type: 'error' });
          return;
        }
        payload.scheduledAt = new Date(at).toISOString();
      }
      if (action === 'publish' && !window.confirm('Publier cet article sur le site ?')) return;
      busy = true;
      form.classList.add('is-busy');
      status.textContent = 'Enregistrement…';
      try {
        const result = await postJson(id ? `/admin/api/articles/${id}` : '/admin/api/articles', payload);
        if (!result.ok) {
          toast(result.errors?.length ? 'À corriger avant d’enregistrer :' : 'Enregistrement impossible.', { type: 'error', details: result.errors || [] });
          status.textContent = 'Non enregistré';
          return;
        }
        setDirty(false);
        const reload = !id || result.post.status !== form.dataset.status || field('slug').value !== result.post.slug;
        if (reload) {
          try {
            sessionStorage.setItem('post-toast', DONE[action]);
          } catch {
            // Stockage indisponible : pas de message après le rechargement.
          }
          location.href = `/admin/articles/${result.post.id}`;
          return;
        }
        id = result.post.id;
        toast(DONE[action]);
        status.textContent = 'Toutes les modifications sont enregistrées';
      } catch {
        toast('Connexion impossible : vos modifications ne sont pas enregistrées.', { type: 'error' });
      } finally {
        busy = false;
        form.classList.remove('is-busy');
        refreshMarkers();
      }
    }

    for (const button of form.querySelectorAll('[data-action]')) {
      button.addEventListener('click', () => run(button.dataset.action));
    }
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        run('save');
      }
    });

    try {
      const message = sessionStorage.getItem('post-toast');
      if (message) {
        sessionStorage.removeItem('post-toast');
        toast(message);
      }
    } catch {
      // Stockage indisponible : pas de message.
    }
    refreshAll();
  }
})();
