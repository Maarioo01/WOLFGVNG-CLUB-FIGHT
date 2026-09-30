'use strict';
// ============================================================
//  VERSUS — character select, stage select, 1P vs CPU / 2P fights
// ============================================================
// const ROSTER = ['hero', 'fumeta', 'latero', 'carterista', 'relojero', 'capo']; // [OLD CHARS]
const ROSTER = ['mario', 'peno', 'alba', 'alvaro', 'belli', 'bene', 'carlottis', 'marcos', 'oso'];
const GRID_COLS = 6; // select-screen grid: 6 per row (room for 12)
const RANDOM_STAGE = STAGES.length; // extra slot in the stage list
const ARENA_C = 620;
const TOD_NAME = { afternoon: 'TARDE', sunset: 'ATARDECER', dusk: 'ANOCHECER', night: 'NOCHE', rain: 'LLUVIA' };
const P_COL = ['#4fb3ff', '#ff4a5a'];

// CPU tuning: same base personality for everyone, scaled by the chosen difficulty
const CPU_AI = { aggr: .66, block: .58, special: .18, jump: .12, react: 8, range: 38, combo: .65, dmg: 1.1, speed: 1.1, hp: 125, punish: .65 };
function aiForChar(id) { return aiFor({ ai: CPU_AI }); }

// mirror match: player 2 gets a recoloured copy (fight.js reads def.base for moves/specials)
const _alt = {};
function altDef(def) {
  if (_alt[def.id]) return _alt[def.id];
  const d = Object.assign({}, def, { id: def.id + '_alt', base: def.id, color: P_COL[1] });
  const keys = ['jacket', 'pants', 'cap', 'cap2', 'stripe', 'dress', 'skirt', 'cropCol', 'necktie', 'socks'];
  if (!def.bare && !def.crop) keys.push('shirt');
  for (const k of keys) if (d[k]) d[k] = mix(d[k], '#e03040', .55);
  if (def.bare || def.crop) d.shirt = d.skin;
  return _alt[def.id] = d;
}
function defsFor(p1, p2) { return [CH[p1], p1 === p2 ? altDef(CH[p2]) : CH[p2]]; }

const _worlds = new Map();
function stageWorld(i) {
  let w = _worlds.get(i);
  if (!w) { const st = STAGES[i]; w = buildStage({ theme: st.theme, tod: st.tod, seed: st.seed, arena: ARENA_C, crowd: 9 }); _worlds.set(i, w); }
  return w;
}
const centerTiny = (g, s, y, col) => tiny(g, s, Math.round(W / 2 - tinyW(s) / 2), y, col);

// ============================================================
//  CHARACTER + STAGE SELECT
// ============================================================
class SelectScene {
  // mode: 'cpu' | '2p'; prev: last match config (keeps the previous picks)
  constructor(mode, prev) { this.mode = mode; this.prev = prev || {}; }
  init() {
    const p = this.prev, idx = (id, d) => Math.max(0, ROSTER.indexOf(id || d));
    this.t = 0; this.cur = [idx(p.p1, 'mario'), idx(p.p2, 'peno')]; this.done = [false, false];
    this.phase = 'chars'; this.readyT = 0; this.stageSel = p.stage != null ? p.stage : 0;
    playMusic('rumba'); ambient(null);
  }
  get cpu() { return this.mode === 'cpu'; }
  update() {
    this.t++;
    if (this.phase === 'chars') this.updateChars(); else this.updateStage();
  }
  updateChars() {
    if (this.done[0] && this.done[1]) { if (++this.readyT > 30) { this.phase = 'stage'; sfx('confirm'); } return; }
    if (this.t < 8) return;
    const n = ROSTER.length;
    const nav = (i, hit) => {
      let c = this.cur[i];
      if (hit('left')) c = (c + n - 1) % n;
      if (hit('right')) c = (c + 1) % n;
      if (hit('up') || hit('down')) { const col = c % GRID_COLS, rows = Math.ceil(n / GRID_COLS); let r = Math.floor(c / GRID_COLS) + (hit('up') ? rows - 1 : 1); r %= rows; c = Math.min(n - 1, r * GRID_COLS + col); }
      if (c !== this.cur[i]) { this.cur[i] = c; sfx('select'); }
    };
    if (this.cpu) {
      // player 1 picks their fighter, then the CPU's
      const step = this.done[0] ? 1 : 0;
      nav(step, a => Input.hit(a));
      if (Input.ok()) { this.done[step] = true; sfx('confirm'); }
      else if (Input.backHit() || Input.hit('kick')) {
        if (step === 1) { this.done[0] = false; sfx('back'); } else this.exit();
      }
      return;
    }
    for (let i = 0; i < 2; i++) {
      if (!this.done[i]) {
        nav(i, a => Input.hitP(i, a));
        if (Input.okP(i)) { this.done[i] = true; sfx('confirm'); }
        else if (i === 0 && Input.hitP(0, 'back')) this.exit();
      } else if (Input.backP(i)) { this.done[i] = false; sfx('back'); }
    }
    if (Input.hit('pause')) this.exit();
  }
  updateStage() {
    const n = STAGES.length + 1;
    if (Input.hit('left')) { this.stageSel = (this.stageSel + n - 1) % n; sfx('select'); }
    if (Input.hit('right')) { this.stageSel = (this.stageSel + 1) % n; sfx('select'); }
    if (this.stageSel < STAGES.length) stageWorld(this.stageSel).update();
    if (Input.ok()) {
      sfx('confirm'); stopMusic();
      const cfg = { mode: this.mode, p1: ROSTER[this.cur[0]], p2: ROSTER[this.cur[1]], stage: this.stageSel };
      goFade(() => new VersusScene(cfg), .03);
    } else if (Input.backHit() || Input.hit('kick')) { this.phase = 'chars'; this.done[1] = false; this.readyT = 0; sfx('back'); }
  }
  exit() { sfx('back'); goFade(() => new TitleScene()); }
  draw(g) {
    if (this.phase === 'stage') { this.drawStage(g); return; }
    g.fillStyle = '#1a0e24'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 20; i++) { g.fillStyle = '#241634'; g.fillRect(((i * 40 + this.t) % (W + 40)) - 40, 0, 20, H); }
    textGrad(g, 'ELIGE LUCHADOR', W / 2, 6, 16, ['#fff', '#ffb0b8', '#ff4a5a']);
    const tags = this.cpu ? ['J1', 'CPU'] : ['J1', 'J2'];
    // roster
    const BW = 38, GAP = 6;
    const active = [true, !this.cpu || this.done[0]];
    ROSTER.forEach((id, i) => {
      const row = Math.floor(i / GRID_COLS), inRow = Math.min(GRID_COLS, ROSTER.length - row * GRID_COLS);
      const x = Math.round(W / 2 - (inRow * BW + (inRow - 1) * GAP) / 2) + (i % GRID_COLS) * (BW + GAP), y = 28 + row * (BW + GAP);
      const d = CH[id], on = [0, 1].filter(p => active[p] && this.cur[p] === i);
      const blink = (this.t >> 3) % 2;
      g.fillStyle = OUTL; g.fillRect(x - 3, y - 3, BW + 6, BW + 6);
      on.forEach((p, k) => { g.fillStyle = this.done[p] ? '#fff' : blink ? P_COL[p] : lt(P_COL[p], .4); if (on.length === 2) g.fillRect(x - 3 + k * (BW / 2 + 3), y - 3, BW / 2 + 3, BW + 6); else g.fillRect(x - 3, y - 3, BW + 6, BW + 6); });
      g.fillStyle = mix(d.color || '#888', '#141028', .5); g.fillRect(x, y, BW, BW);
      g.save(); g.beginPath(); g.rect(x, y, BW, BW); g.clip();
      { const pc = portraitCanvas(d, on.length ? 'angry' : 'normal'); g.drawImage(pc, x + (BW - pc.width / 2) / 2, y + 1, pc.width / 2, pc.height / 2); }
      g.restore();
      on.forEach(p => { const tg = tags[p], tx = p === 0 ? x + 1 : x + BW - 1 - tinyW(tg); g.fillStyle = OUTL; g.fillRect(tx - 1, y, tinyW(tg) + 2, 7); tiny(g, tg, tx, y + 1, P_COL[p]); });
    });
    // big previews
    const defs = defsFor(ROSTER[this.cur[0]], ROSTER[this.cur[1]]);
    for (let p = 0; p < 2; p++) {
      const d = defs[p], x = p ? 352 : 48, show = p === 0 || !this.cpu || this.done[0];
      if (!show) { textGrad(g, '?', x, 150, 32, ['#fff', '#ffb0b8', '#ff4a5a']); continue; }
      const spr = getSprite(d, this.done[p] ? 'win' : 'idle', this.t, this.done[p] ? 'happy' : d.expr);
      shadow(g, x, 202, 26 * d.b.s * CHAR_SIZE, .4); drawSpr(g, spr, x, 202, p ? -1 : 1);
      text(g, d.name, x, 206, { align: 'center', color: this.done[p] ? '#ffd84a' : '#fff', outline: OUTL });
      const tl = tags[p] + (this.done[p] ? ' · LISTO' : ''); tiny(g, tl, x - (tinyW(tl) >> 1), 217, P_COL[p]);
    }
    textGrad(g, 'VS', W / 2, 142, 24, ['#fff4a0', '#ffd040', '#ff8030', '#e83020']);
    const hint = this.cpu
      ? (this.done[0] ? 'ELIGE AL RIVAL (CPU)' : 'ELIGE TU LUCHADOR')
      : 'J1: WASD + F   ·   J2: FLECHAS + K';
    centerTiny(g, hint, 176, '#e8e0ff');
    centerTiny(g, this.cpu ? 'ENTER/F: ELEGIR   G/ESC: VOLVER' : 'PUÑO: ELEGIR   PATADA: DESHACER   ESC: MENU', 186, '#8a80b0');
  }
  drawStage(g) {
    const i = this.stageSel, rnd = i === RANDOM_STAGE, camX = ARENA_C - W / 2;
    const defs = defsFor(ROSTER[this.cur[0]], ROSTER[this.cur[1]]);
    if (!rnd) {
      const wd = stageWorld(i);
      wd.drawBack(g, camX); wd.drawCrowd(g, camX);
      defs.forEach((d, p) => { const x = W / 2 + (p ? 60 : -60); shadow(g, x, GROUND, 26 * d.b.s, .4); drawSpr(g, getSprite(d, 'idle', this.t, d.expr), x, GROUND, p ? -1 : 1); });
      wd.drawFront(g, camX);
    } else {
      g.fillStyle = '#10081c'; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 20; k++) { g.fillStyle = '#1c1030'; g.fillRect(((k * 40 + this.t) % (W + 40)) - 40, 0, 20, H); }
      textGrad(g, '?', W / 2, 110, 32, ['#fff', '#ffe8a0', '#ffc040']);
    }
    // panel
    g.fillStyle = OUTL; g.fillRect(40, 8, W - 80, 52); g.fillStyle = 'rgba(16,10,34,.9)'; g.fillRect(41, 9, W - 82, 50); g.fillStyle = '#ffd84a'; g.fillRect(41, 9, W - 82, 1);
    text(g, 'ESCENARIO', W / 2, 14, { align: 'center', color: '#9fe8ff' });
    const name = rnd ? 'ALEATORIO' : STAGES[i].name;
    text(g, '◀', 50, 30, { color: '#ffd84a' }); text(g, '▶', W - 58, 30, { color: '#ffd84a' });
    text(g, name, W / 2, 30, { align: 'center', color: '#fff', outline: OUTL });
    centerTiny(g, rnd ? 'UN ESCENARIO AL AZAR' : (TOD_NAME[STAGES[i].tod] || '') + '   ·   ' + (i + 1) + '/' + STAGES.length, 46, '#c8c0e0');
    centerTiny(g, '← → ELEGIR   ENTER: PELEAR   ESC: VOLVER', 214, '#fff');
  }
}

// ============================================================
//  FIGHT SCENE
// ============================================================
class VersusScene {
  // cfg: { mode: 'cpu' | '2p', p1, p2 (ROSTER ids), stage (index or RANDOM_STAGE) }
  constructor(cfg) { this.cfg = cfg; }
  init() {
    const c = this.cfg, idx = c.stage >= STAGES.length ? rndi(0, STAGES.length - 1) : c.stage, st = this.st = STAGES[idx];
    GAME.stage = idx;
    this.world = stageWorld(idx);
    ambient(st.tod === 'rain' ? 'rain' : 'street');
    const [d1, d2] = defsFor(c.p1, c.p2);
    this.fight = new Fight({ stage: this.world, center: ARENA_C, p1Def: d1, p2Def: d2, ai: c.mode === 'cpu' ? aiForChar(c.p2) : null, place: st.name, music: st.music, onEnd: w => this.endFight(w) });
    this.camX = this.fight.camX; this.paused = false; this.pauseSel = 0; this.post = null;
    this.pauseItems = c.mode === 'cpu' ? ['CONTINUAR', 'DIFICULTAD', 'REINICIAR', 'ELEGIR PERSONAJES', 'SALIR AL MENÚ'] : ['CONTINUAR', 'REINICIAR', 'ELEGIR PERSONAJES', 'SALIR AL MENÚ'];
    playMusic(st.music);
  }
  endFight(w) {
    if (this.cfg.mode === 'cpu' && w !== 0) playMusic('gameover');
    this.post = { w, t: 0, sel: 0 };
  }
  // shared menu actions
  act(item) {
    sfx('confirm');
    if (item === 'CONTINUAR') this.paused = false;
    else if (item === 'REINICIAR' || item === 'REVANCHA') { this.paused = false; goFade(() => new VersusScene(this.cfg)); }
    else if (item === 'ELEGIR PERSONAJES') { this.paused = false; goFade(() => new SelectScene(this.cfg.mode, this.cfg)); }
    else { this.paused = false; goFade(() => new TitleScene()); }
  }
  menuNav(obj, key, n) {
    if (Input.hit('up')) { obj[key] = (obj[key] + n - 1) % n; sfx('select'); }
    if (Input.hit('down')) { obj[key] = (obj[key] + 1) % n; sfx('select'); }
  }
  update() {
    if (this.paused) {
      const items = this.pauseItems;
      this.menuNav(this, 'pauseSel', items.length);
      if (Input.hit('pause') || Input.hit('back')) { this.paused = false; sfx('back'); return; }
      if (items[this.pauseSel] === 'DIFICULTAD') {
        let ch = 0; if (Input.hit('left')) ch = -1; if (Input.hit('right') || Input.ok()) ch = 1;
        if (ch) { setDiff(GAME.diff + ch); this.fight.setAI(aiForChar(this.cfg.p2)); }
        return;
      }
      if (Input.ok()) this.act(items[this.pauseSel]);
      return;
    }
    const F = this.fight;
    if (!this.post && (Input.hit('pause') || Input.hit('start'))) { this.paused = true; this.pauseSel = 0; sfx('select'); return; }
    this.world.update();
    F.update(); this.camX = F.camX;
    if (this.post) {
      const P = this.post; P.t++;
      if (P.t > 60) {
        this.menuNav(P, 'sel', 3);
        if (Input.ok()) this.act(['REVANCHA', 'ELEGIR PERSONAJES', 'MENÚ PRINCIPAL'][P.sel]);
      }
    }
  }
  draw(g) {
    const camX = Math.round(this.camX), wd = this.world, F = this.fight;
    wd.drawBack(g, camX); wd.drawCrowd(g, camX);
    F.drawWorld(g);
    wd.drawFront(g, camX);
    F.drawHUD(g);
    if (this.post && this.post.t > 60) {
      const w = this.post.w, cpu = this.cfg.mode === 'cpu';
      const title = cpu ? (w === 0 ? '¡HAS GANADO!' : 'HAS PERDIDO') : '¡GANA ' + F.tags[w] + '!';
      drawMenu(g, title, ['REVANCHA', 'ELEGIR PERSONAJES', 'MENÚ PRINCIPAL'], this.post.sel, 64, [F.p, F.e][w].def.name);
    }
    if (this.paused) {
      drawMenu(g, 'PAUSA', this.pauseItems, this.pauseSel, 54);
      if (this.pauseItems[this.pauseSel] === 'DIFICULTAD') centerTiny(g, '← → CAMBIAR', 200, '#8a80b0');
    }
  }
}
function drawMenu(g, title, items, sel, y0, sub) {
  drawFade(g, .6, '#05020a');
  textGrad(g, title, W / 2, y0, 24, ['#fff', '#ffd860', '#ff9030']);
  if (sub) text(g, sub, W / 2, y0 + 30, { align: 'center', color: '#c8c0e0', outline: OUTL });
  items.forEach((s, i) => {
    const y = y0 + (sub ? 50 : 40) + i * 16, on = i === sel;
    if (s === 'DIFICULTAD') { drawDiffOption(g, y, on); return; }
    text(g, (on ? '▶ ' : '  ') + s, W / 2, y, { align: 'center', color: on ? '#ffd84a' : '#c8c0e0', outline: OUTL });
  });
}
