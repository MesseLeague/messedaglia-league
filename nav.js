// =================================================================
// BARRA IN ALTO
// Ogni pagina ha <nav id="topbar" data-page="home|iscrizioni"></nav> e carica
// config.js e nav.js. L'accesso con la mail della scuola avviene nella pagina
// del modulo, servita da Google (vedi iscrizioni/Codice.gs).
// =================================================================
(function () {
  const CFG = window.ML_CONFIG || {};
  const PAGES = [
    ['home', 'Home', './'],
    ['formato', 'Formato', './#formato'],
    ['tabellone', 'Tabellone', './#tabellone'],
    ['regole', 'Regole', './#regole'],
    ['iscrizioni', 'Iscrizioni', 'iscrizioni.html'],
  ];

  const nav = document.getElementById('topbar');
  if (!nav) return;
  const page = nav.dataset.page || 'home';
  nav.innerHTML = `
    <div class="ml-inner">
      <a class="ml-brand" href="./"><img src="img/logo.png" alt="" width="40" height="40"><span>Messedaglia League</span></a>
      <button type="button" class="ml-burger" id="ml-burger" aria-expanded="false" aria-controls="ml-links" aria-label="Menu">☰</button>
      <ul class="ml-links" id="ml-links">
        ${PAGES.map(([id, label, href]) => `<li><a href="${href}"${id === page ? ' aria-current="page"' : ''}${id === 'iscrizioni' ? ' class="ml-cta"' : ''}>${label}</a></li>`).join('')}
      </ul>
      <div class="ml-account">
        ${CFG.ISCRIZIONI_URL
          ? `<a class="ml-btn" href="${CFG.ISCRIZIONI_URL}" target="_blank" rel="noopener">Accedi</a>`
          : ''}
      </div>
    </div>`;

  const burger = document.getElementById('ml-burger');
  burger.onclick = () => burger.setAttribute('aria-expanded', nav.classList.toggle('open'));
  // Su telefono il menu si chiude dopo aver scelto una voce
  nav.querySelectorAll('.ml-links a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));
})();
