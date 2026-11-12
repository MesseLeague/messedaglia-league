// =================================================================
// BARRA IN ALTO + ACCESSO CON GOOGLE (solo account della scuola)
// Ogni pagina ha <nav id="topbar" data-page="home|iscrizioni"></nav> e carica
// config.js e nav.js. Le pagine leggono l'accesso con window.MLAuth.
// =================================================================
(function () {
  const CFG = window.ML_CONFIG || {};
  const DOMINIO = CFG.DOMINIO || 'messedaglia.edu.it';
  const KEY = 'ml_token';
  const listeners = [];

  // ---------- Stato dell'accesso ----------
  const Auth = {
    user: null,      // { name, email, picture, initials }
    token: null,     // ID token di Google (lo verifica il server delle iscrizioni)
    demo: false,     // anteprima: accesso finto, niente viene salvato
    admin: false,    // organizzatore (lo decide il server delle iscrizioni)
    adminChecked: false,
    ready: false,
    onChange(fn) { listeners.push(fn); if (this.ready) fn(this.user); },
    login: () => openLogin(),
    logout: () => logout(),
  };
  window.MLAuth = Auth;

  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* storage bloccato */ } },
  };

  // Contenuto del token (base64url): nome, mail, foto, dominio, scadenza
  function readToken(token) {
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(part))));
    } catch { return null; }
  }

  function initials(name, email) {
    const src = (name || email.split('@')[0]).replace(/[._-]+/g, ' ').trim().split(/\s+/);
    return ((src[0] || '')[0] + ((src[1] || '')[0] || '')).toUpperCase();
  }

  function setUser(user, token, demo) {
    Auth.user = user;
    Auth.token = token || null;
    Auth.demo = !!demo;
    Auth.admin = !!demo && !!user;   // in anteprima l'account finto è anche organizzatore
    Auth.adminChecked = !!demo || !user;
    Auth.ready = true;
    render();
    listeners.forEach(fn => fn(user));
    if (user && !demo) checkAdmin();
  }

  // Chiamata al server delle iscrizioni (Apps Script) con il token dell'accesso
  Auth.api = async function (action, data) {
    if (!CFG.API_URL) throw new Error('Il server delle iscrizioni non è ancora configurato.');
    // text/plain: richiesta "semplice", Apps Script la accetta senza controlli CORS aggiuntivi
    const res = await fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify({ action, token: Auth.token, data }) });
    const out = await res.json().catch(() => ({ ok: false, error: 'Risposta non valida dal server delle iscrizioni.' }));
    if (!out.ok) throw new Error(out.error);
    return out.result;
  };

  async function checkAdmin() {
    try {
      const r = await Auth.api('ruolo');
      Auth.admin = !!r.admin && !!Auth.user;
    } catch { /* server non configurato: nessun pannello */ }
    Auth.adminChecked = true;
    render();
    listeners.forEach(fn => fn(Auth.user));
  }

  function acceptToken(token, quiet) {
    const p = readToken(token);
    if (!p || p.exp * 1000 < Date.now()) { store.set(null); if (!quiet) toast('Accesso scaduto: accedi di nuovo.'); return false; }
    const email = String(p.email || '').toLowerCase();
    if (p.hd !== DOMINIO || !email.endsWith('@' + DOMINIO)) {
      store.set(null);
      toast(`Serve l'account della scuola (@${DOMINIO}). Hai usato ${email || 'un altro account'}.`);
      return false;
    }
    store.set(token);
    setUser({ name: p.name || email, email, picture: p.picture || '', initials: initials(p.name, email) }, token, false);
    return true;
  }

  function logout() {
    store.set(null);
    if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
    closeMenu();
    setUser(null);
  }

  // ---------- Google Identity Services ----------
  let gisReady = false;
  function loadGoogle() {
    if (!CFG.GOOGLE_CLIENT_ID) return Promise.resolve(false);
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => {
        try {
          google.accounts.id.initialize({
            client_id: CFG.GOOGLE_CLIENT_ID,
            hd: DOMINIO,                 // propone solo gli account della scuola
            auto_select: true,
            callback: r => acceptToken(r.credential),
          });
          gisReady = true;
          resolve(true);
        } catch { resolve(false); }
      };
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
      setTimeout(() => resolve(gisReady), 6000);
    });
  }

  function openLogin() {
    if (gisReady) {
      const box = document.getElementById('ml-login-box');
      box.hidden = !box.hidden;
      if (!box.hidden) {
        box.innerHTML = `<p>Accedi con l'account <b>@${DOMINIO}</b></p><div id="ml-gbtn"></div>`;
        google.accounts.id.renderButton(document.getElementById('ml-gbtn'), { theme: 'filled_black', size: 'large', shape: 'rectangular', text: 'signin_with', locale: 'it' });
      }
      return;
    }
    // Accesso non disponibile (es. anteprima su claude.ai): account finto per vedere la barra
    const box = document.getElementById('ml-login-box');
    box.hidden = !box.hidden;
    box.innerHTML = `<p><b>Anteprima.</b> L'accesso con Google funziona sul sito pubblicato. Qui puoi provarlo con un account finto.</p>
      <button type="button" class="ml-btn" id="ml-demo">Entra come mario.rossi@${DOMINIO}</button>`;
    document.getElementById('ml-demo').onclick = () => {
      box.hidden = true;
      setUser({ name: 'Mario Rossi', email: 'mario.rossi@' + DOMINIO, picture: '', initials: 'MR' }, null, true);
    };
  }

  // ---------- Barra ----------
  const PAGES = [
    ['home', 'Home', './'],
    ['formato', 'Formato', './#formato'],
    ['tabellone', 'Tabellone', './#tabellone'],
    ['regole', 'Regole', './#regole'],
    ['iscrizioni', 'Iscrizioni', 'iscrizioni.html'],
  ];

  function esc(t) { return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function avatar(u, big) {
    const pic = u.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    return `<span class="ml-avatar${big ? ' big' : ''}" aria-hidden="true"><span>${esc(u.initials)}</span>${pic}</span>`;
  }

  function render() {
    const nav = document.getElementById('topbar');
    if (!nav) return;
    const page = nav.dataset.page || 'home';
    const u = Auth.user;
    nav.innerHTML = `
      <div class="ml-inner">
        <a class="ml-brand" href="./"><img src="img/logo.png" alt="" width="40" height="40"><span>Messedaglia League</span></a>
        <button type="button" class="ml-burger" id="ml-burger" aria-expanded="false" aria-controls="ml-links" aria-label="Menu">☰</button>
        <ul class="ml-links" id="ml-links">
          ${PAGES.map(([id, label, href]) => `<li><a href="${href}"${id === page ? ' aria-current="page"' : ''}${id === 'iscrizioni' ? ' class="ml-cta"' : ''}>${label}</a></li>`).join('')}
          ${Auth.admin ? `<li><a href="dev.html" class="ml-dev"${page === 'dev' ? ' aria-current="page"' : ''}>Dev</a></li>` : ''}
        </ul>
        <div class="ml-account">
          ${u ? `<button type="button" class="ml-me" id="ml-me" aria-haspopup="menu" aria-expanded="false" aria-label="Account di ${esc(u.name)}">${avatar(u)}</button>
                 <div class="ml-menu" id="ml-menu" role="menu" hidden>
                   <div class="ml-menu-head">${avatar(u, true)}<div><b>${esc(u.name)}</b><span>${esc(u.email)}</span>${Auth.demo ? '<em>Anteprima</em>' : ''}</div></div>
                   ${Auth.admin ? '<a role="menuitem" href="dev.html" class="ml-menu-dev">⚙ Pannello organizzatori</a>' : ''}
                   <a role="menuitem" href="iscrizioni.html">La mia iscrizione</a>
                   <a role="menuitem" href="iscrizioni.html#profilo">Profilo giocatore</a>
                   <a role="menuitem" href="https://myaccount.google.com/" target="_blank" rel="noopener">Gestisci account Google ↗</a>
                   <button type="button" role="menuitem" id="ml-logout">Esci</button>
                 </div>`
               : `<button type="button" class="ml-btn" id="ml-login">Accedi</button>`}
          <div class="ml-login-box" id="ml-login-box" hidden></div>
        </div>
      </div>`;

    document.getElementById('ml-burger').onclick = e => {
      const open = nav.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    };
    if (u) {
      document.getElementById('ml-me').onclick = e => { e.stopPropagation(); toggleMenu(); };
      document.getElementById('ml-logout').onclick = logout;
    } else {
      document.getElementById('ml-login').onclick = e => { e.stopPropagation(); openLogin(); };
    }
  }

  function toggleMenu(force) {
    const menu = document.getElementById('ml-menu');
    const btn = document.getElementById('ml-me');
    if (!menu) return;
    const open = force ?? menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open);
  }
  function closeMenu() { toggleMenu(false); }

  document.addEventListener('click', e => {
    if (!e.target.closest('.ml-account')) {
      closeMenu();
      const box = document.getElementById('ml-login-box');
      if (box) box.hidden = true;
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  let toastTimer;
  function toast(text) {
    let t = document.getElementById('ml-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ml-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
  }
  Auth.toast = toast;

  // ---------- Avvio ----------
  render();
  const saved = store.get();
  const fromStore = saved && acceptToken(saved, true);
  loadGoogle().then(ok => {
    if (!fromStore) {
      setUser(null);
      if (ok) google.accounts.id.prompt();   // proposta discreta "Continua come…" se già entrato in Google
    }
  });
})();
