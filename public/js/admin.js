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

    form.addEventListener('input', (event) => {
      setDirty(true);
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
})();
