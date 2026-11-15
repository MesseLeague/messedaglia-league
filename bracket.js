// =================================================================
// TABELLONE – condiviso tra stage e regia
// Una config descrive il torneo: { name, type: 'double'|'single', size,
// bo, final_bo, reset, players: [{ name, tag }] }. build() ne ricava le
// serie con la loro posizione; resolve() applica i risultati e dice chi
// gioca ogni serie. Tutta la logica sta qui: il server salva e basta.
//
// Ogni serie ha un id stabile (W1, L3, GF…: è la chiave dei risultati)
// e un numero "num" in ordine di gioco, quello mostrato a schermo.
// =================================================================

const Bracket = (() => {
  // Geometria: numero (34) + righe con nome e punteggio (176) = 210
  const W = 210, H = 56, COL = 250, STEP = 76, HEAD = 28, TOP = HEAD + 28;

  const seed = i => ({ seed: i });
  const win = id => ({ win: id });
  const lose = id => ({ lose: id });

  const ROUND_NAMES = { 8: 'Ottavi', 4: 'Quarti', 2: 'Semifinali', 1: 'Finale' };

  function single(cfg) {
    const matches = [], links = [], labels = [];
    const rounds = Math.log2(cfg.size);
    let prev = [], n = 1;
    for (let r = 0; r < rounds; r++) {
      const count = cfg.size / 2 ** (r + 1);
      const name = ROUND_NAMES[count] || `Turno ${r + 1}`;
      const ids = [];
      for (let k = 0; k < count; k++) {
        const id = `M${n}`;
        const span = 2 ** r;
        matches.push({
          id, num: n++, col: r,
          y: TOP + (span * (k + 0.5) - 0.5) * STEP,
          a: r === 0 ? seed(2 * k) : win(prev[2 * k]),
          b: r === 0 ? seed(2 * k + 1) : win(prev[2 * k + 1]),
          bo: count === 1 ? cfg.final_bo : cfg.bo,
          cls: count === 1 ? 'gf' : '',
          label: name,
        });
        if (r > 0) links.push([prev[2 * k], id], [prev[2 * k + 1], id]);
        ids.push(id);
      }
      labels.push([name, r, 0, count === 1 ? 'gold' : '']);
      prev = ids;
    }
    return { matches, links, labels, bands: [0] };
  }

  function double8(cfg) {
    const B = cfg.bo, F = cfg.final_bo;
    const LOW_HEAD = TOP + 3 * STEP + H + 54, LOW = LOW_HEAD + HEAD + 28;
    const yW5 = TOP + STEP / 2, yW6 = TOP + 2.5 * STEP, yW7 = (yW5 + yW6) / 2;
    const matches = [
      // Seeding del regolamento: 1º-8º, 4º-5º, 2º-7º, 3º-6º
      { id: 'W1', num: 1, col: 0, y: TOP, a: seed(0), b: seed(7), bo: B, label: 'Quarti' },
      { id: 'W2', num: 2, col: 0, y: TOP + STEP, a: seed(3), b: seed(4), bo: B, label: 'Quarti' },
      { id: 'W3', num: 3, col: 0, y: TOP + 2 * STEP, a: seed(1), b: seed(6), bo: B, label: 'Quarti' },
      { id: 'W4', num: 4, col: 0, y: TOP + 3 * STEP, a: seed(2), b: seed(5), bo: B, label: 'Quarti' },
      { id: 'L1', num: 5, col: 0, y: LOW, a: lose('W1'), b: lose('W2'), bo: B, label: 'Losers turno 1' },
      { id: 'L2', num: 6, col: 0, y: LOW + STEP, a: lose('W3'), b: lose('W4'), bo: B, label: 'Losers turno 1' },
      { id: 'W5', num: 7, col: 1, y: yW5, a: win('W1'), b: win('W2'), bo: B, label: 'Semifinale' },
      { id: 'W6', num: 8, col: 1, y: yW6, a: win('W3'), b: win('W4'), bo: B, label: 'Semifinale' },
      { id: 'L3', num: 9, col: 1, y: LOW, a: win('L1'), b: lose('W6'), bo: B, label: 'Losers turno 2' },
      { id: 'L4', num: 10, col: 1, y: LOW + STEP, a: win('L2'), b: lose('W5'), bo: B, label: 'Losers turno 2' },
      { id: 'L5', num: 11, col: 2, y: LOW + STEP / 2, a: win('L3'), b: win('L4'), bo: B, label: 'Losers turno 3' },
      { id: 'W7', num: 12, col: 2, y: yW7, a: win('W5'), b: win('W6'), bo: F, label: 'Finale Winners' },
      { id: 'L6', num: 13, col: 3, y: LOW + STEP / 2, a: lose('W7'), b: win('L5'), bo: F, label: 'Finale Losers' },
    ];
    const links = [['W1', 'W5'], ['W2', 'W5'], ['W3', 'W6'], ['W4', 'W6'], ['W5', 'W7'], ['W6', 'W7'],
      ['L1', 'L3'], ['L2', 'L4'], ['L3', 'L5'], ['L4', 'L5'], ['L5', 'L6']];
    const labels = [['Quarti', 0, 0], ['Semifinali', 1, 0], ['Finale Winners', 2, 0],
      ['Losers turno 1', 0, LOW_HEAD], ['Losers turno 2', 1, LOW_HEAD], ['Losers turno 3', 2, LOW_HEAD], ['Finale Losers', 3, LOW_HEAD]];
    addGrand(cfg, matches, links, labels, 'W7', 'L6', 3, yW7, 14);
    return { matches, links, labels, bands: [0, LOW_HEAD] };
  }

  function double4(cfg) {
    const B = cfg.bo, F = cfg.final_bo;
    const LOW_HEAD = TOP + STEP + H + 54, LOW = LOW_HEAD + HEAD + 28;
    const yW3 = TOP + STEP / 2;
    const matches = [
      { id: 'W1', num: 1, col: 0, y: TOP, a: seed(0), b: seed(1), bo: B, label: 'Semifinale' },
      { id: 'W2', num: 2, col: 0, y: TOP + STEP, a: seed(2), b: seed(3), bo: B, label: 'Semifinale' },
      { id: 'L1', num: 3, col: 0, y: LOW, a: lose('W1'), b: lose('W2'), bo: B, label: 'Losers turno 1' },
      { id: 'W3', num: 4, col: 1, y: yW3, a: win('W1'), b: win('W2'), bo: F, label: 'Finale Winners' },
      { id: 'L2', num: 5, col: 1, y: LOW, a: lose('W3'), b: win('L1'), bo: F, label: 'Finale Losers' },
    ];
    const links = [['W1', 'W3'], ['W2', 'W3'], ['L1', 'L2']];
    const labels = [['Semifinali', 0, 0], ['Finale Winners', 1, 0], ['Losers turno 1', 0, LOW_HEAD], ['Finale Losers', 1, LOW_HEAD]];
    addGrand(cfg, matches, links, labels, 'W3', 'L2', 2, yW3, 6);
    return { matches, links, labels, bands: [0, LOW_HEAD] };
  }

  // Spareggi aspiranti (regolamento): AS1 = 7º contro 10º, AS2 = 8º contro 9º, al meglio delle 5.
  // players = [7º, 8º, 9º, 10º]. Chi vince entra nel tabellone come 7º (AS1) o 8º (AS2).
  function aspiranti(cfg) {
    const matches = [
      { id: 'AS1', num: 'AS1', col: 0, y: TOP, a: seed(0), b: seed(3), bo: cfg.bo, cls: 'as', label: 'Spareggio AS1' },
      { id: 'AS2', num: 'AS2', col: 0, y: TOP + STEP, a: seed(1), b: seed(2), bo: cfg.bo, cls: 'as', label: 'Spareggio AS2' },
    ];
    const labels = [['Spareggi', 0, 0],
      ['→ 7º nel tabellone', 1, TOP + (H - HEAD) / 2, 'gold dest'], ['→ 8º nel tabellone', 1, TOP + STEP + (H - HEAD) / 2, 'gold dest']];
    return { matches, links: [], labels, bands: [0] };
  }

  // Grand Final nella riga del Winners; la rivincita subito a destra, sulla stessa riga
  function addGrand(cfg, matches, links, labels, wFinal, lFinal, col, y, num) {
    matches.push({ id: 'GF', num, col, y, a: win(wFinal), b: win(lFinal), bo: cfg.final_bo, cls: 'gf', label: 'Grand Final' });
    links.push([wFinal, 'GF'], [lFinal, 'GF', 'up']);
    labels.push(['Grand Final', col, 0, 'gold']);
    if (cfg.reset) {
      // Esiste solo se la GF la vince chi arriva dal Losers (posto b)
      matches.push({ id: 'GF2', num: num + 1, col: col + 1, y, a: win('GF'), b: lose('GF'), bo: cfg.final_bo, cls: 'reset', label: 'Rivincita', onlyIf: ['GF', 'b'] });
      links.push(['GF', 'GF2']);
      labels.push(['Rivincita', col + 1, 0, 'grey', 'se serve']);
    }
  }

  const TYPES = {
    double: { label: 'Doppia eliminazione', sizes: [4, 8] },
    single: { label: 'Eliminazione diretta', sizes: [4, 8, 16] },
  };

  const BUILTIN_PRESETS = [
    { name: 'Messedaglia · Doppia eliminazione 8', type: 'double', size: 8, bo: 3, final_bo: 5, reset: true, builtin: true },
    { name: 'Eliminazione diretta 8', type: 'single', size: 8, bo: 3, final_bo: 5, reset: false, builtin: true },
    { name: 'Doppia eliminazione 4', type: 'double', size: 4, bo: 3, final_bo: 5, reset: true, builtin: true },
  ];

  function build(cfg) {
    const layout = cfg.type === 'aspiranti' ? aspiranti(cfg) : cfg.type === 'single' ? single(cfg) : cfg.size === 4 ? double4(cfg) : double8(cfg);
    const cols = Math.max(...layout.matches.map(m => m.col), ...layout.labels.map(l => l[1])) + 1;
    const bottom = Math.max(...layout.matches.map(m => m.y)) + H;
    return { ...layout, W, H, COL, HEAD, width: (cols - 1) * COL + W, height: bottom + 4 };
  }

  function sourceText(src, numOf = id => id) {
    if ('seed' in src) return `Posto ${src.seed + 1}`;
    return `${'win' in src ? 'Vincente' : 'Perdente'} match ${numOf(src.win || src.lose)}`;
  }

  // Applica i risultati: per ogni serie dice chi gioca, chi ha vinto e se esiste
  function resolve(bracket) {
    const { config, results = {} } = bracket;
    const layout = build(config);
    const nums = Object.fromEntries(layout.matches.map(m => [m.id, m.num]));
    const byId = {};
    const player = src => {
      if ('seed' in src) {
        const p = config.players[src.seed];
        return p && p.name ? p : null;   // posto vuoto in torneo.py: resta "Posto N"
      }
      const m = byId[src.win || src.lose];
      if (!m || !m.winner) return null;
      const side = 'win' in src ? m.winner : (m.winner === 'a' ? 'b' : 'a');
      return m[side];
    };
    // In ordine di gioco: una serie dipende sempre da serie con numero più basso
    const ordered = [...layout.matches].sort((p, q) => (typeof p.num === 'number' && typeof q.num === 'number' ? p.num - q.num : 0));
    for (const m of ordered) {
      const r = { ...m, a: player(m.a), b: player(m.b), aText: sourceText(m.a, id => nums[id]), bText: sourceText(m.b, id => nums[id]) };
      r.exists = !m.onlyIf || byId[m.onlyIf[0]]?.winner === m.onlyIf[1];
      r.ready = r.exists && !!r.a?.name && !!r.b?.name;
      r.winner = r.ready && (results[m.id] === 'a' || results[m.id] === 'b') ? results[m.id] : null;
      byId[m.id] = r;
    }
    // Ultima serie che decide il torneo: la rivincita se si gioca, altrimenti la GF (o la finale)
    const last = byId.GF2?.exists ? byId.GF2 : byId.GF || byId[ordered[ordered.length - 1].id];
    const champion = last?.winner ? last[last.winner] : null;
    return { layout, matches: ordered.map(m => byId[m.id]), byId, champion };
  }

  // Serie che dipendono (anche indirettamente) da una serie: se ne cambia il risultato vanno azzerate
  function dependents(config, id) {
    const { matches } = build(config);
    const out = new Set();
    const visit = src => {
      for (const m of matches) {
        if (out.has(m.id)) continue;
        if ([m.a, m.b].some(s => s.win === src || s.lose === src) || m.onlyIf?.[0] === src) {
          out.add(m.id);
          visit(m.id);
        }
      }
    };
    visit(id);
    return [...out];
  }

  // Disegna il tabellone dentro root.
  // opts.live = { tags: [blu, rosso], wins: { [tag]: vittorie } } per evidenziare la serie in corso
  // opts.scores = { [num]: { a: vittorie, b: vittorie } } punteggio delle serie finite (sito, pagina Partite)
  function render(root, bracket, opts = {}) {
    const { layout, matches, byId } = resolve(bracket);
    const { W, H, COL, HEAD } = layout;
    const x = c => c * COL;
    const NUM = 34;           // spazio del quadratino col numero
    let html = '';

    for (const y of layout.bands) html += `<div class="bk-band" style="top:${y - 10}px;height:${HEAD + 20}px"></div>`;
    for (const [label, c, y, cls = '', sub = ''] of layout.labels) {
      html += `<div class="bk-head ${cls}" style="left:${x(c) + NUM}px;top:${y}px;width:${W - NUM}px;height:${HEAD}px">${label}</div>`;
      if (sub) html += `<div class="bk-head-sub" style="left:${x(c) + NUM}px;top:${y + HEAD + 5}px;width:${W - NUM}px">${sub}</div>`;
    }

    const liveKey = opts.live ? [...opts.live.tags].sort().join() : null;
    for (const m of matches) {
      const live = !!liveKey && m.ready && !m.winner && [m.a.tag, m.b.tag].sort().join() === liveKey;
      const row = (side, color) => {
        const p = m[side];
        const state = live ? 'live' : m.winner ? (m.winner === side ? 'won' : 'lost') : p ? '' : 'tbd';
        const fin = opts.scores?.[m.num];
        const score = live ? (opts.live.wins[p.tag] ?? 0) : (m.winner && fin ? (fin[side] ?? '') : '');
        return `<div class="bk-row ${color} ${state}"><span class="bk-name">${esc(p?.name || m[side + 'Text'])}</span><span class="bk-score">${score}</span></div>`;
      };
      html += `<div class="bk-match ${m.cls || ''}${m.exists ? '' : ' ghost'}${live ? ' is-live' : ''}${opts.scores?.[m.num] ? ' has-score' : ''}" data-id="${m.id}" data-num="${m.num}" style="left:${x(m.col)}px;top:${m.y}px;width:${W}px;height:${H}px;--d:${(m.col * 0.08).toFixed(2)}s">
        <span class="bk-num" style="width:${NUM - 4}px">${m.num}</span>
        <div class="bk-rows">${row('a', 'red')}${row('b', 'blue')}</div>
        <span class="bk-bo${m.bo === 5 ? ' five' : ''}">BO${m.bo}</span></div>`;
    }

    // Linee a gomito: dal lato destro della serie al quadratino del numero della successiva
    let paths = '';
    for (const [from, to, style = ''] of layout.links) {
      const a = byId[from], b = byId[to];
      const lit = a.winner ? ' lit' : '';
      const x1 = x(a.col) + W, y1 = a.y + H / 2, y2 = b.y + H / 2;
      if (style === 'up') {
        // Dalla finale Losers sale fino alla Grand Final ed entra dal lato destro
        const xr = x(b.col) + W + 16;
        paths += `<path class="bk-wire${lit}" d="M${x1} ${y1} H${xr} V${y2} H${x(b.col) + W}"/>`;
        continue;
      }
      const x2 = x(b.col), mid = x2 - 22;
      paths += `<path class="bk-wire${lit}" d="M${x1} ${y1} H${mid} V${y2} H${x2}"/>`;
    }

    root.style.width = layout.width + 'px';
    root.style.height = layout.height + 'px';
    root.innerHTML = `<svg viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" aria-hidden="true">${paths}</svg>${html}`;
    return layout;
  }

  function esc(t) {
    return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { TYPES, BUILTIN_PRESETS, build, resolve, dependents, render, sourceText };
})();
