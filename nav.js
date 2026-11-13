// =================================================================
// BARRA IN ALTO + ACCOUNT
// Ogni pagina ha <nav id="topbar" data-page="home|iscrizioni"></nav> e carica
// config.js e nav.js. L'accesso con la mail della scuola avviene nella pagina
// del modulo (Google); tornando al sito, il modulo passa nell'indirizzo
// #ml=... chi sei, e il sito lo ricorda per mostrare l'account.
// È solo per la grafica: i controlli veri li fa Google nel modulo.
// =================================================================
(function () {
  const CFG = window.ML_CONFIG || {};
  const FORM = CFG.ISCRIZIONI_URL || '';
  const KEY = 'ml_user';
  const DAYS = 30;
  const PAGES = [
    ['home', 'Home', './'],
    ['formato', 'Formato', './#formato'],
    ['tabellone', 'Tabellone', './#tabellone'],
    ['regole', 'Regole', './#regole'],
    ['faq', 'FAQ', './#faq'],
    ['iscrizioni', 'Iscrizioni', 'iscrizioni.html'],
  ];

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch { /* storage bloccato */ } },
  };

  // Ritorno dal modulo: #ml={...} (eventualmente &vai=sezione)
  function readReturn() {
    const m = location.hash.match(/^#ml=([^&]*)(?:&vai=([\w-]+))?/);
    if (!m) return;
    try {
      const d = JSON.parse(decodeURIComponent(m[1]));
      store.set({ name: String(d.n || '').slice(0, 60), initials: String(d.i || '').slice(0, 2), admin: !!d.a, iscritto: !!d.s, until: Date.now() + DAYS * 864e5 });
    } catch { /* indirizzo non valido: ignora */ }
    // Toglie i dati dall'indirizzo, così non finiscono in cronologia o nei link condivisi
    history.replaceState(null, '', location.pathname + location.search + (m[2] ? '#' + m[2] : ''));
    if (m[2]) addEventListener('load', () => document.getElementById(m[2])?.scrollIntoView());
  }

  readReturn();
  let user = store.get();
  if (user && !(user.until > Date.now())) { store.set(null); user = null; }
  window.MLUser = user;   // le pagine possono leggerlo (es. iscrizioni.html)

  function esc(t) { return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const avatar = big => `<span class="ml-avatar${big ? ' big' : ''}" aria-hidden="true"><span>${esc(user.initials)}</span></span>`;

  const nav = document.getElementById('topbar');
  if (!nav) return;
  const page = nav.dataset.page || 'home';

  function render() {
    let account = '';
    if (user) {
      account = `
        <button type="button" class="ml-me" id="ml-me" aria-haspopup="menu" aria-expanded="false" aria-label="Account di ${esc(user.name)}">${avatar()}</button>
        <div class="ml-menu" id="ml-menu" role="menu" hidden>
          <div class="ml-menu-head">${avatar(true)}<div><b>${esc(user.name)}</b><span>${user.iscritto ? 'Iscritto al torneo' : 'Non ancora iscritto'}</span></div></div>
          ${FORM ? `<a role="menuitem" href="${FORM}">${user.iscritto ? 'La mia iscrizione' : 'Iscriviti'}</a>` : ''}
          ${FORM && user.admin ? `<a role="menuitem" class="ml-menu-dev" href="${FORM}?pagina=dev">⚙ Pannello organizzatori</a>` : ''}
          <button type="button" role="menuitem" id="ml-logout">Esci</button>
        </div>`;
    } else if (FORM) {
      account = `<a class="ml-btn" href="${FORM}">Accedi</a>`;
    }
    nav.innerHTML = `
      <div class="ml-inner">
        <a class="ml-brand" href="./"><img src="img/logo.png" alt="" width="40" height="40"><span>Messedaglia League</span></a>
        <button type="button" class="ml-burger" id="ml-burger" aria-expanded="false" aria-controls="ml-links" aria-label="Menu">☰</button>
        <ul class="ml-links" id="ml-links">
          ${PAGES.map(([id, label, href]) => `<li><a href="${href}"${id === page ? ' aria-current="page"' : ''}${id === 'iscrizioni' ? ' class="ml-cta"' : ''}>${label}</a></li>`).join('')}
          ${user && user.admin && FORM ? `<li><a href="${FORM}?pagina=dev" class="ml-dev">Dev</a></li>` : ''}
        </ul>
        <div class="ml-account">${account}</div>
      </div>`;

    const burger = document.getElementById('ml-burger');
    burger.onclick = () => burger.setAttribute('aria-expanded', nav.classList.toggle('open'));
    nav.querySelectorAll('.ml-links a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }));

    if (user) {
      const me = document.getElementById('ml-me');
      const menu = document.getElementById('ml-menu');
      const toggle = open => { menu.hidden = !open; me.setAttribute('aria-expanded', open); };
      me.onclick = e => { e.stopPropagation(); toggle(menu.hidden); };
      document.addEventListener('click', e => { if (!e.target.closest('.ml-account')) toggle(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
      // Esci: il sito dimentica l'account (la sessione Google resta, la gestisce Google)
      document.getElementById('ml-logout').onclick = () => {
        store.set(null);
        user = window.MLUser = null;
        render();
        window.dispatchEvent(new Event('ml-user'));
      };
    }
  }
  render();
})();
