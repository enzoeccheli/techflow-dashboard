/* =========================================================
   TechFlow Dashboard — app.js
   JavaScript puro (sem bibliotecas).

   Responsabilidades:
   1. Tema Light | Dark | System com localStorage
   2. Sidebar mobile (abrir/fechar)
   3. Dropdown do usuário
   4. Busca e filtros de projetos
   5. Checklist interativo
   6. Modal de Novo Projeto + validação visual do formulário
   7. Toast de feedback e atalhos de teclado
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Utilitários ---------- */
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

  // Os componentes animam com as variantes data-[open=true]: do Tailwind,
  // então abrir/fechar é só trocar o atributo data-open.
  const setOpen = (el, open) => el && el.setAttribute('data-open', String(open));
  const isOpen = (el) => !!el && el.getAttribute('data-open') === 'true';

  const desktopQuery = window.matchMedia('(min-width: 1024px)'); // breakpoint lg:

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const normalize = (str) =>
    String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const lockScroll = (lock) => { document.body.style.overflow = lock ? 'hidden' : ''; };

  /* =========================================================
     1. TEMA — Light | Dark | System
     ========================================================= */
  const THEME_KEY = 'techflow-theme';
  const THEMES = ['light', 'dark', 'system'];
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function readTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return THEMES.includes(saved) ? saved : 'system';
    } catch {
      return 'system';
    }
  }

  function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* modo privado */ }
  }

  function applyTheme(pref) {
    const dark = pref === 'dark' || (pref === 'system' && darkQuery.matches);
    // A classe .dark no <html> ativa todas as variantes dark: do Tailwind
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';

    // Marca o botão ativo (estilizado com aria-pressed: no Tailwind)
    $$('[data-theme-option]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.themeOption === pref));
    });
  }

  function setTheme(pref) {
    saveTheme(pref);
    applyTheme(pref);
  }

  $$('[data-theme-option]').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.dataset.themeOption));
  });

  // Modo System: acompanha a troca de tema do sistema operacional em tempo real
  darkQuery.addEventListener('change', () => {
    if (readTheme() === 'system') applyTheme('system');
  });

  // Sincroniza o tema entre abas abertas
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) applyTheme(readTheme());
  });

  applyTheme(readTheme());

  /* =========================================================
     2. SIDEBAR MOBILE
     ========================================================= */
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  const sidebarOpenBtn = $('#sidebar-open');
  const sidebarCloseBtn = $('#sidebar-close');

  function setSidebar(open) {
    const mobile = !desktopQuery.matches;
    setOpen(sidebar, open);
    setOpen(overlay, open);
    sidebarOpenBtn.setAttribute('aria-expanded', String(open));

    // No mobile, a sidebar fechada sai da ordem de foco (inert)
    sidebar.inert = mobile && !open;
    if (mobile) lockScroll(open);

    if (open && mobile) {
      sidebarCloseBtn.focus();
    } else if (!open && sidebar.contains(document.activeElement)) {
      sidebarOpenBtn.focus();
    }
  }

  sidebarOpenBtn.addEventListener('click', () => setSidebar(true));
  sidebarCloseBtn.addEventListener('click', () => setSidebar(false));
  overlay.addEventListener('click', () => setSidebar(false));

  // Clicar em um link no mobile fecha o menu
  $$('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!desktopQuery.matches) setSidebar(false);
    });
  });

  // Ao mudar para desktop, a sidebar volta ao estado normal
  function syncSidebarWithViewport() {
    if (desktopQuery.matches) {
      setOpen(sidebar, false);
      setOpen(overlay, false);
      sidebar.inert = false;
      lockScroll(false);
      sidebarOpenBtn.setAttribute('aria-expanded', 'false');
    } else {
      sidebar.inert = !isOpen(sidebar);
    }
  }
  desktopQuery.addEventListener('change', syncSidebarWithViewport);
  syncSidebarWithViewport();

  /* =========================================================
     3. DROPDOWN DO USUÁRIO
     ========================================================= */
  const userMenu = $('#user-menu');
  const userMenuBtn = $('#user-menu-button');
  const userMenuPanel = $('#user-menu-panel');
  const menuItems = () => $$('[role="menuitem"]', userMenuPanel);

  function setMenu(open, { focusFirst = false } = {}) {
    setOpen(userMenuPanel, open);
    userMenuBtn.setAttribute('aria-expanded', String(open));
    if (open && focusFirst) menuItems()[0]?.focus();
    if (!open && userMenuPanel.contains(document.activeElement)) userMenuBtn.focus();
  }

  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // detail === 0 → acionado pelo teclado: foca o primeiro item
    setMenu(!isOpen(userMenuPanel), { focusFirst: e.detail === 0 });
  });

  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    if (isOpen(userMenuPanel) && !userMenu.contains(e.target)) setMenu(false);
  });

  // Navegação por setas dentro do menu
  userMenuPanel.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const items = menuItems();
    const index = items.indexOf(document.activeElement);
    let next = 0;
    if (e.key === 'ArrowDown') next = (index + 1) % items.length;
    if (e.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    if (e.key === 'End') next = items.length - 1;
    items[next].focus();
  });

  $('#logout').addEventListener('click', () => {
    setMenu(false);
    showToast('Sessão encerrada', 'Isso é só uma demonstração — nada foi desconectado.');
  });

  $('#notifications')?.addEventListener('click', () => {
    showToast('3 novas notificações', 'Bruno, Carla e Diego atualizaram seus projetos.');
  });

  /* =========================================================
     4. BUSCA E FILTROS DE PROJETOS
     ========================================================= */
  const grid = $('#project-grid');
  const searchInput = $('#search');
  const emptyState = $('#projects-empty');
  const projectsCount = $('#projects-count');
  let currentFilter = 'todos';

  function filterProjects() {
    const term = normalize(searchInput.value);
    let visible = 0;

    $$('[data-project]', grid).forEach((card) => {
      const matchCategory = currentFilter === 'todos' || card.dataset.category === currentFilter;
      const matchText = !term || normalize(card.textContent).includes(term);
      const show = matchCategory && matchText;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });

    emptyState.classList.toggle('hidden', visible > 0);
    projectsCount.textContent = visible;
  }

  searchInput.addEventListener('input', filterProjects);

  $$('input[name="filter"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      currentFilter = radio.value;
      filterProjects();
    });
  });

  function resetFilters() {
    searchInput.value = '';
    currentFilter = 'todos';
    const all = $('input[name="filter"][value="todos"]');
    if (all) all.checked = true;
    filterProjects();
  }

  filterProjects();

  /* =========================================================
     5. CHECKLIST INTERATIVO (card "Migração para Cloud")
     ========================================================= */
  $$('[data-checklist]').forEach((list) => {
    const card = list.closest('[data-project]');
    const bar = $('[data-progress-bar]', card);
    const label = $('[data-progress-label]', card);
    const counter = $('[data-checklist-count]', card);

    const update = () => {
      const boxes = $$('input[type="checkbox"]', list);
      const done = boxes.filter((b) => b.checked).length;
      const pct = Math.round((done / boxes.length) * 100);
      bar.style.width = `${pct}%`;
      label.textContent = `${pct}%`;
      counter.textContent = `${done}/${boxes.length}`;
    };

    list.addEventListener('change', update);
    update();
  });

  /* =========================================================
     6. MODAL DE NOVO PROJETO
     ========================================================= */
  const modal = $('#project-modal');
  const modalPanel = $('#project-modal-panel');
  const form = $('#project-form');
  let lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    setMenu(false);
    modal.inert = false;
    setOpen(modal, true);
    setOpen(modalPanel, true);
    lockScroll(true);
    setTimeout(() => $('#p-name').focus(), 80);
  }

  function closeModal() {
    setOpen(modal, false);
    setOpen(modalPanel, false);
    modal.inert = true;
    // Só libera o scroll se a sidebar mobile também estiver fechada
    if (desktopQuery.matches || !isOpen(sidebar)) lockScroll(false);
    lastFocused?.focus();
  }

  $$('[data-open-modal]').forEach((btn) => btn.addEventListener('click', openModal));
  $$('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeModal));
  $('[data-modal-backdrop]').addEventListener('click', closeModal);

  // Mantém o foco do teclado dentro do modal (focus trap)
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    // Primeiro foco = botão fechar (cabeçalho); último = botão de enviar
    const first = $('[data-close-modal]', modalPanel);
    const last = submitBtn.disabled ? $('[data-close-modal]', form) : submitBtn;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------- Validação ---------- */
  const deadlineInput = $('#p-deadline');
  const descInput = $('#p-description');
  const descCount = $('#desc-count');
  const formAlert = $('#form-alert');
  const formAlertText = $('#form-alert-text');
  const submitBtn = $('#submit-btn');
  const submitLabel = $('#submit-label');
  const submitSpinner = $('#submit-spinner');

  // Data mínima = hoje (no fuso local)
  const todayISO = (() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  })();
  deadlineInput.min = todayISO;

  const DESC_MIN = 20;

  // Cada regra devolve '' (válido) ou a mensagem de erro
  const rules = {
    name(value) {
      const v = value.trim();
      if (!v) return 'Informe o nome do projeto.';
      if (v.length < 3) return 'O nome precisa ter pelo menos 3 caracteres.';
      return '';
    },
    owner: (value) => (value ? '' : 'Selecione um responsável.'),
    category: (value) => (value ? '' : 'Escolha uma categoria.'),
    priority: (value) => (value ? '' : 'Defina a prioridade.'),
    deadline(value) {
      if (!value) return 'Informe o prazo.';
      if (value < todayISO) return 'O prazo não pode estar no passado.';
      return '';
    },
    description(value) {
      const v = value.trim();
      if (!v) return 'Descreva o projeto.';
      if (v.length < DESC_MIN) return `Faltam ${DESC_MIN - v.length} caracteres (mínimo de ${DESC_MIN}).`;
      return '';
    }
  };

  const successMessages = {
    name: 'Nome válido.',
    owner: 'Responsável definido.',
    category: 'Categoria selecionada.',
    priority: 'Prioridade definida.',
    deadline: 'Prazo válido.',
    description: 'Descrição completa.'
  };

  const FIELDS = Object.keys(rules);
  const touched = new Set();

  function getValue(field) {
    if (field === 'priority') return $('input[name="priority"]:checked', form)?.value || '';
    return form.elements[field].value;
  }

  // Aplica o estado visual (error | success) usando data-state + variantes data-[state=...]: do Tailwind
  function setFieldState(field, error) {
    const wrapper = $(`[data-field="${field}"]`, form);
    const state = error ? 'error' : 'success';

    $$('[data-control]', wrapper).forEach((el) => { el.dataset.state = state; });
    $$('input, select, textarea', wrapper).forEach((el) => el.setAttribute('aria-invalid', String(!!error)));

    const msg = $('[data-msg]', wrapper);
    msg.dataset.state = state;
    msg.textContent = error ? `⚠ ${error}` : `✓ ${successMessages[field]}`;
  }

  function clearFieldState(field) {
    const wrapper = $(`[data-field="${field}"]`, form);
    $$('[data-control]', wrapper).forEach((el) => { delete el.dataset.state; });
    $$('input, select, textarea', wrapper).forEach((el) => el.removeAttribute('aria-invalid'));
    const msg = $('[data-msg]', wrapper);
    delete msg.dataset.state;
    msg.textContent = '';
  }

  function validateField(field) {
    const error = rules[field](getValue(field));
    setFieldState(field, error);
    return !error;
  }

  function updateFormAlert() {
    if (formAlert.classList.contains('hidden')) return;
    const invalid = FIELDS.filter((f) => rules[f](getValue(f))).length;
    if (invalid === 0) formAlert.classList.add('hidden');
    else formAlertText.textContent = invalid === 1 ? 'Falta corrigir 1 campo.' : `Faltam corrigir ${invalid} campos.`;
  }

  // Valida ao sair do campo; depois disso, valida enquanto digita
  FIELDS.forEach((field) => {
    const wrapper = $(`[data-field="${field}"]`, form);

    wrapper.addEventListener('focusout', (e) => {
      if (wrapper.contains(e.relatedTarget)) return; // ainda dentro do grupo (ex.: rádios)
      if (field === 'priority' && !getValue(field) && !touched.has(field)) return;
      touched.add(field);
      validateField(field);
      updateFormAlert();
    });

    const live = () => {
      if (field === 'priority' || field === 'owner' || field === 'category') touched.add(field);
      if (touched.has(field)) {
        validateField(field);
        updateFormAlert();
      }
    };
    wrapper.addEventListener('input', live);
    wrapper.addEventListener('change', live);
  });

  // Contador de caracteres da descrição
  function updateDescCount() {
    const len = descInput.value.length;
    const max = Number(descInput.maxLength);
    descCount.textContent = `${len}/${max}`;
    descCount.classList.toggle('text-amber-500', len >= max * 0.9);
    descCount.classList.toggle('text-slate-400', len < max * 0.9);
  }
  descInput.addEventListener('input', updateDescCount);

  function setSubmitting(loading) {
    submitBtn.disabled = loading;
    submitSpinner.classList.toggle('hidden', !loading);
    submitLabel.textContent = loading ? 'Salvando…' : 'Criar projeto';
    $$('input, select, textarea', form).forEach((el) => { el.disabled = loading; });
  }

  function resetFormUI() {
    touched.clear();
    FIELDS.forEach(clearFieldState);
    formAlert.classList.add('hidden');
    // o reset nativo roda depois do evento; atualiza o contador em seguida
    setTimeout(updateDescCount, 0);
  }

  form.addEventListener('reset', resetFormUI);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    FIELDS.forEach((f) => touched.add(f));
    const results = FIELDS.map(validateField);
    const invalid = results.filter((ok) => !ok).length;

    if (invalid) {
      formAlertText.textContent = invalid === 1
        ? 'Corrija o campo destacado para continuar.'
        : `Corrija os ${invalid} campos destacados para continuar.`;
      formAlert.classList.remove('hidden');

      // Microinteração: o painel balança e o foco vai para o primeiro erro
      modalPanel.classList.remove('animate-shake');
      void modalPanel.offsetWidth; // reinicia a animação
      modalPanel.classList.add('animate-shake');

      const firstInvalid = FIELDS[results.indexOf(false)];
      const target = firstInvalid === 'priority'
        ? $('input[name="priority"]', form)
        : form.elements[firstInvalid];
      target.focus();
      return;
    }

    // Válido: simula o envio (não há banco de dados)
    const data = {
      name: form.elements.name.value.trim(),
      owner: form.elements.owner.value,
      category: form.elements.category.value,
      priority: getValue('priority'),
      deadline: form.elements.deadline.value,
      description: form.elements.description.value.trim()
    };

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      addProjectCard(data);
      form.reset();
      closeModal();
      showToast('Projeto criado!', `"${data.name}" foi adicionado à lista de projetos.`);
    }, 900);
  });

  modalPanel.addEventListener('animationend', () => modalPanel.classList.remove('animate-shake'));

  /* ---------- Criação do card de projeto ---------- */
  const CATEGORIES = {
    desenvolvimento: { label: 'Desenvolvimento', tag: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', bar: 'bg-sky-500', hover: 'hover:border-sky-300 dark:hover:border-sky-500/40', arrow: 'text-sky-500' },
    design:          { label: 'Design',          tag: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300', bar: 'bg-pink-500', hover: 'hover:border-pink-300 dark:hover:border-pink-500/40', arrow: 'text-pink-500' },
    infraestrutura:  { label: 'Infraestrutura',  tag: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300', bar: 'bg-orange-500', hover: 'hover:border-orange-300 dark:hover:border-orange-500/40', arrow: 'text-orange-500' },
    dados:           { label: 'Dados',           tag: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300', bar: 'bg-violet-500', hover: 'hover:border-violet-300 dark:hover:border-violet-500/40', arrow: 'text-violet-500' }
  };

  const PRIORITIES = {
    baixa: { label: 'Baixa', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
    media: { label: 'Média', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500' },
    alta:  { label: 'Alta',  badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', dot: 'bg-red-500' }
  };

  const AVATAR_COLORS = {
    'Ana Ribeiro': 'bg-brand-500', 'Bruno Lima': 'bg-sky-500', 'Carla Mendes': 'bg-pink-500',
    'Diego Santos': 'bg-orange-500', 'Fernanda Alves': 'bg-violet-500', 'Gustavo Rocha': 'bg-slate-500'
  };

  const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const formatDate = (iso) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
      .format(new Date(`${iso}T00:00:00`))
      .replace('.', '');

  function addProjectCard(data) {
    const cat = CATEGORIES[data.category];
    const pri = PRIORITIES[data.priority];
    const card = document.createElement('article');

    card.dataset.project = '';
    card.dataset.category = data.category;
    card.className = `card-enter group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-soft ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-50 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 ${cat.hover}`;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-md px-2 py-1 text-xs font-semibold ${cat.tag}">${cat.label}</span>
          <span class="rounded-md bg-brand-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Novo</span>
        </div>
        <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${pri.badge}"><span class="h-1.5 w-1.5 rounded-full ${pri.dot}"></span>${pri.label}</span>
      </div>
      <h3 class="mt-4 flex items-center gap-1 break-words font-bold text-slate-900 dark:text-white">
        ${escapeHTML(data.name)}
        <svg class="h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${cat.arrow}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"/></svg>
      </h3>
      <p class="mt-1 line-clamp-3 break-words text-sm text-slate-500 dark:text-slate-400">${escapeHTML(data.description)}</p>
      <div class="mt-auto pt-5">
        <div class="flex items-center justify-between text-xs"><span class="text-slate-500 dark:text-slate-400">Progresso</span><span class="font-semibold text-slate-900 dark:text-white">0%</span></div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div class="h-full rounded-full ${cat.bar}" style="width: 0%"></div></div>
        <div class="mt-4 flex items-center justify-between">
          <span title="${escapeHTML(data.owner)}" class="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 ${AVATAR_COLORS[data.owner] || 'bg-slate-500'}">${escapeHTML(initials(data.owner))}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">${formatDate(data.deadline)}</span>
        </div>
      </div>`;

    // Entra logo depois do card em destaque
    const featured = grid.firstElementChild;
    if (featured) featured.after(card);
    else grid.prepend(card);

    // Remove o anel de destaque depois de alguns segundos
    setTimeout(() => card.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'), 2500);

    resetFilters();
    bumpCounter('#kpi-active');
    bumpCounter('#nav-projects-count');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function bumpCounter(selector) {
    const el = $(selector);
    if (el) el.textContent = Number(el.textContent) + 1;
  }

  /* =========================================================
     7. TOAST, DATA DE HOJE E ATALHOS
     ========================================================= */
  const toast = $('#toast');
  let toastTimer = null;

  function showToast(title, text) {
    $('#toast-title').textContent = title;
    $('#toast-text').textContent = text;
    setOpen(toast, true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setOpen(toast, false), 4000);
  }

  $('#toast-close').addEventListener('click', () => setOpen(toast, false));

  // Data de hoje no cabeçalho
  const todayEl = $('#today');
  if (todayEl) {
    const text = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    todayEl.textContent = text.charAt(0).toUpperCase() + text.slice(1);
  }

  document.addEventListener('keydown', (e) => {
    // Esc fecha o que estiver aberto, na ordem de prioridade
    if (e.key === 'Escape') {
      if (isOpen(modal)) return closeModal();
      if (isOpen(userMenuPanel)) return setMenu(false);
      if (isOpen(sidebar)) return setSidebar(false);
      if (document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        filterProjects();
      }
      return;
    }

    // "/" ou Ctrl+K focam a busca
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      if (isOpen(modal)) return;
      e.preventDefault();
      searchInput.focus();
    }
  });
})();
