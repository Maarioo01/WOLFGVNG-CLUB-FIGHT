'use strict';
// ============================================================
//  ITEMS — the friends' objects. Every 12–20 s a friend in the crowd throws their own item into the arena
//  (stages.js toss; on a stage without a crowd it drops from the sky). Crouch on it (↓) to pick it up; □ throws it
//  (or puts the trap / the toy car down); power-ups work as soon as they're picked up. Getting hit drops it.
//  OBJETOS: SÍ / NO in the menus (GAME.items, story.js). The hooks are in fight.js (Fighter, Fight.hit, Proj).
//  Drawings: the objects atlas (objects.js, sheet O2) or the code-drawn stand-ins below; balls are spheres.
// ============================================================
const ITEM_EVERY = [12 * 60, 20 * 60]; // ticks between two items
const ITEM_LIFE = 600;                  // ticks an item stays on the floor (it blinks for the last 2 s)
const ITEM_IN_T = 42;                   // ticks of the flight from the crowd
const ITEM_FX = { slow: 180, stuck: 120, tied: 90, hacked: 180, caught: 90, armor: 360 }; // effect lengths in ticks
// kind: 'throw' (□ throws it), 'floor' (□ puts it down and it drives at the opponent), 'trap' (□ puts it down),
// 'power' (it works when picked up). obj: its drawing (obj_<obj> in the objects atlas, or OBJ_STANDIN); ball: drawn as
// a sphere d units wide (objects.js). fx: the effect of a clean hit (ITEM_FX); pop: the text shown then.
const ITEMS = {
  mancuerna: { owner: 'mario', name: 'MANCUERNA', kind: 'throw', obj: 'dumbbell', dmg: 13, kd: 1, heavy: 1 },
  balon: { owner: 'peno', name: 'BALÓN', kind: 'throw', ball: 'football', d: 16, dmg: 7, bounce: 1 },
  cinturon: { owner: 'alba', name: 'CINTURÓN NEGRO', kind: 'throw', obj: 'belt', dmg: 4, fx: 'tied', pop: '¡OSAEKOMI!' },
  coche: { owner: 'alvaro', name: 'COCHE TELEDIRIGIDO', kind: 'floor', obj: 'car', dmg: 9, kd: 1 },
  portatil: { owner: 'belli', name: 'PORTÁTIL', kind: 'throw', obj: 'laptop', dmg: 9, fx: 'hacked', pop: '¡HACKEADO!' },
  flotador: { owner: 'bene', name: 'FLOTADOR UNICORNIO', kind: 'throw', obj: 'float', dmg: 5, fx: 'stuck', pop: '¡AL AGUA!' },
  botiquin: { owner: 'carlottis', name: 'BOTIQUÍN', kind: 'power', obj: 'firstaid', heal: 25 },
  yogur: { owner: 'marcos', name: 'YOGUR GRIEGO', kind: 'throw', obj: 'yogurt', dmg: 6, fx: 'slow', pop: '¡PRINGADO!' },
  codigo: { owner: 'oso', name: 'CÓDIGO PENAL', kind: 'throw', obj: 'book', dmg: 12, kd: 1 },
  caca: { owner: 'manu', name: 'CACA DE ISAAC', kind: 'trap', obj: 'poop', dmg: 5 },
  racion: { owner: 'casado', name: 'RACIÓN DE COMBATE', kind: 'power', obj: 'ration', fx: 'armor', pop: '¡MODO TANQUE!' },
  pokeball: { owner: 'madeverxp', name: 'POKÉ BALL', kind: 'throw', ball: 'pokeball', d: 14, dmg: 3, fx: 'caught', pop: '¡ATRAPADO!' },
};
MOVES.toss = { anim: 'jab', s: 5, a: 0, r: 12, spawn: { at: 5, type: 'item' } }; // □ with an item in hand

// ---------- code-drawn stand-ins (until sheet O2 exists), painted like the cap and sandal (objects.js) ----------
Object.assign(OBJ_STANDIN, {
  dumbbell: () => standIn(22, 9, (x, y) => { // chrome handle, black hexagonal plates
    const plate = (x0, x1) => x >= x0 && x <= x1 && !((x < x0 + .9 || x > x1 - .9) && (y < 1.3 || y > 7.7));
    if (plate(.4, 5.2) || plate(16.8, 21.6)) return y < 2 ? '#5a5a66' : y > 7 ? '#18181e' : '#2c2c36';
    if (x > 5 && x < 17 && y >= 3.4 && y <= 5.6) return y < 4.2 ? '#ffffff' : y > 5 ? '#8a8e9a' : '#c8ccd6';
    return null;
  }),
  belt: () => standIn(20, 10, (x, y) => { // a black belt in its knot, the two ends hanging
    if (Math.hypot((x - 10) / 2.6, (y - 4) / 2.4) <= 1) return y < 3.2 ? '#4a4856' : '#24222c';
    for (const [x0, dx] of [[8.6, -2.6], [11.4, 2.6]]) { const t = (y - 5) / 4.6; if (t >= 0 && t <= 1 && Math.abs(x - (x0 + dx * t)) <= 1.1) return '#1e1c24'; }
    if (y >= 2.6 && y <= 5 && x >= .3 && x <= 19.7) return y < 3.3 ? '#4a4856' : '#24222c';
    return null;
  }),
  car: () => standIn(26, 12, (x, y) => { // red toy sports car, facing right
    for (const wx of [6.5, 19.5]) { const d = Math.hypot(x - wx, y - 9.3); if (d <= 2.7) return d < 1.1 ? '#b8bcc8' : '#16161c'; }
    if (x >= 3 && x <= 3.8 && y <= 4.5) return '#3a3a44';                                                    // antenna
    if (y >= 4.2 && y <= 8.6 && x >= .8 && x <= 25.2 && !(x > 24 && y < 5.4)) return y < 5.2 ? '#ff5a5a' : y > 7.8 ? '#8a1010' : '#d81e1e';
    if (y >= 1.2 && y < 4.2 && x >= 8 + (4.2 - y) * .9 && x <= 17.5 - (4.2 - y) * 1.2) return x > 12.5 && x < 13.5 ? '#d81e1e' : '#9fd8f8';
    return null;
  }),
  laptop: () => standIn(20, 14, (x, y) => { // open laptop, green lines on the screen
    const sx0 = 3 + (9.5 - y) * .25, sx1 = 15 + (9.5 - y) * .25;
    if (y >= 0 && y <= 9.5 && x >= sx0 && x <= sx1) {
      if (x < sx0 + .8 || x > sx1 - .8 || y < .8 || y > 8.8) return '#3a3e48';
      const row = Math.floor((y - 1.4) / 1.4);
      return row >= 0 && row < 5 && (y - 1.4) % 1.4 < .7 && x < sx0 + 3 + (row * 37) % 7 ? '#40f060' : '#0e1a14';
    }
    if (y > 9.5 && y <= 13.5 && x >= 1 && x <= 19) return y < 10.4 ? '#6a707c' : y > 12.6 ? '#2a2e36' : Math.floor(x) % 2 && y > 10.6 && y < 12.4 ? '#4a505c' : '#565c68';
    return null;
  }),
  float: () => standIn(30, 20, (x, y) => { // inflatable unicorn ring, facing right
    if (x >= 24 && x <= 26.2 && y >= 0 && y <= 2.6 && Math.abs(x - (25 + (2.6 - y) * .35)) < .75) return '#f2c14e';      // horn
    if (((x - 24.5) / 4.5) ** 2 + ((y - 5.2) / 3) ** 2 <= 1) return Math.hypot(x - 26.4, y - 4.6) < .8 ? '#1a1424' : y < 4.2 ? '#ffffff' : '#e8e8f2';
    const neckX = 19 + (13 - y) * .25;
    if (y >= 2.2 && y <= 12 && x < neckX + .6 && x > neckX - 2.6) return ['#e83030', '#f08a30', '#f2d040', '#40c050', '#3a7af0', '#8a4ad0'][Math.floor(y / 1.7) % 6]; // mane
    if (x >= neckX && x <= 24 && y >= 4 && y <= 13) return '#f4f4fa';                                                       // neck
    if (((x - 12) / 11) ** 2 + ((y - 14.5) / 5) ** 2 <= 1 && ((x - 12) / 6.5) ** 2 + ((y - 14) / 2.2) ** 2 > 1) return y < 12.5 ? '#ffffff' : y > 17.5 ? '#c8c8d8' : '#ececf4';
    if (x >= .2 && x <= 3.2 && y >= 9 && y <= 15 && x > 1.8 - (y - 9) * .2) return ['#e83030', '#f2d040', '#3a7af0'][Math.floor(y / 2) % 3]; // tail
    return null;
  }),
  firstaid: () => standIn(18, 14, (x, y) => { // white box, handle, green cross
    if (y < 3) return x >= 6 && x <= 12 && y >= .4 && (y > 1.8 || x < 7.2 || x > 10.8) ? '#8a8e9a' : null;
    if (x < .4 || x > 17.6 || y > 13.6) return null;
    if ((Math.abs(x - 9) < 1.6 && Math.abs(y - 8.3) < 4) || (Math.abs(y - 8.3) < 1.6 && Math.abs(x - 9) < 4)) return '#28a848';
    return y < 4 ? '#ffffff' : y > 12.6 ? '#b8bcc8' : x > 16.2 ? '#d4d8e2' : '#f4f4f8';
  }),
  book: () => standIn(16, 18, (x, y) => { // fat red law book with a gold title
    if (x < .4 || x > 15.6 || y < .3 || y > 17.7) return null;
    if (x > 13.6) return y % 2 < 1 ? '#f0e8d0' : '#d8ccb0';
    if (x < 2.6) return '#6e1218';
    if (((y > 3 && y < 3.8) || (y > 5.2 && y < 6) || (y > 13.6 && y < 14.2)) && x > 4.4 && x < 12) return '#e8c060';
    return x < 4 ? '#8a1a22' : '#a8202a';
  }),
  poop: () => standIn(15, 12, (x, y) => { // three brown tiers with a shine
    for (const [cx, cy, rx, ry] of [[7.5, 9.6, 7.2, 2.4], [7.5, 6.4, 5.4, 2.1], [7.3, 3.6, 3.6, 1.9]])
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) return Math.hypot(x - (cx - rx * .4), y - (cy - ry * .4)) < .8 ? '#e8d0b0' : y < cy - ry * .2 ? '#9a6232' : '#6a3e1e';
    if (x >= 7.4 && x <= 9 && y >= .6 && y < 2.2 && x < 7.4 + (2.2 - y)) return '#9a6232';
    return null;
  }),
  ration: () => standIn(18, 12, (x, y) => { // olive army ration box with a stencil label
    if (x < .4 || x > 17.6 || y < 1 || y > 11.6) return null;
    if (y < 2.4) return x > 13 ? null : '#4e5828';
    if (y > 4.6 && y < 7.4 && x > 3 && x < 15) return Math.floor(x * 1.5) % 3 === 0 && y > 5.2 && y < 6.8 ? '#9aa070' : '#1a1a14';
    return y < 3.4 ? '#7a8640' : y > 10.6 ? '#3e4820' : '#5e6a32';
  }),
});

// ---------- drawing ----------
const itemSprite = it => it.ball ? ballFrames(it.ball, it.d)[0] : objFrames(it.obj)[0];
const itemSize = it => { const s = itemSprite(it); if (!s) return { w: 16, h: 12 }; const k = s.hd || 1; return { w: s.c.width / k, h: s.c.height / k }; };
// an item centred at (x, y): scale, rot (radians), ang (balls' spin), facing, img (tinted copy)
function drawItem(g, it, x, y, o = {}) {
  if (it.ball) { const fr = ballFrames(it.ball, it.d), i = (((Math.round((o.ang || 0) / (Math.PI * 2) * BALL_FRAMES)) % fr.length) + fr.length) % fr.length; drawSprEx(g, fr[i], x, y, 1, { scale: o.scale, rot: o.rot }); return; }
  const s = objFrames(it.obj)[0]; if (s) drawSprEx(g, s, x, y, o.facing || 1, { scale: o.scale, rot: o.rot, img: o.img });
}
// a small icon of an item fitted in a box of `size` units (HUD, above the head)
function drawItemIcon(g, it, x, y, size) { const z = itemSize(it); drawItem(g, it, x, y, { scale: Math.min(1, size / Math.max(z.w, z.h)) }); }

// ---------- the thrown item (a projectile, Proj type 'item'; the hooks are in fight.js) ----------
function itemProjInit(pr, owner) {
  const it = ITEMS[owner.tossItem], f = owner.facing, s = owner.s, z = itemSize(it);
  pr.item = it; pr.dmg = it.dmg || 0; pr.hs = it.fx ? 10 : 18; pr.kd = !!it.kd; pr.w = z.w * .8; pr.h = z.h * .8;
  if (it.kind === 'trap') { pr.x = owner.x + f * 34 * s; pr.y = -z.h / 2; pr.custom = true; pr.noClash = true; pr.life = 480; return; }
  if (it.kind === 'floor') { pr.x = owner.x + f * 26 * s; pr.y = -z.h / 2; pr.vx = f * 4.5; pr.low = true; pr.noClash = true; pr.life = 240; return; }
  pr.x = owner.x + f * 20 * s; pr.y = -44 * s; pr.spin = f * .3;
  if (it.heavy) { pr.vx = f * 4.2; pr.vy = -2.2; pr.g = .2; }                                    // a short, heavy arc
  else if (it.bounce) { pr.vx = f * 5; pr.vy = -2; pr.g = .2; pr.custom = true; pr.life = 300; pr.hitT = [0, 0]; }
  else { pr.vx = f * 5.2; pr.vy = -1; pr.g = .04; }                                              // almost straight
}
function itemProjUpdate(pr, F) {
  const it = pr.item; pr.rot = (pr.rot || 0) + (pr.spin || 0);
  if (it.ball) pr.ang += clamp(pr.vx / (it.d / 2), -.45, .45);
  if (it.kind === 'throw' && !it.bounce && pr.y >= -4 && pr.vy > 0) { pr.dead = true; F.dust(pr.x, 5); sfx('land'); return; } // missed: it breaks on the floor
  if (it.kind === 'floor') { if (pr.t % 6 === 0) F.dust(pr.x - Math.sign(pr.vx) * 10, 1); if (pr.x < F.camX - 30 || pr.x > F.camX + W + 30) pr.dead = true; return; }
  if (it.bounce) { // Peño's ball: bounces around the screen for 5 s and hits anyone, the thrower too
    const r = it.d / 2;
    if (pr.y >= -r && pr.vy > 0) { pr.y = -r; pr.vy = -Math.max(2.6, pr.vy * .8); sfx('land'); }
    if ((pr.x < F.camX + 10 && pr.vx < 0) || (pr.x > F.camX + W - 10 && pr.vx > 0)) pr.vx = -pr.vx;
    for (const [i, f] of [F.p, F.e].entries()) {
      if (pr.hitT[i] > 0) { pr.hitT[i]--; continue; }
      if ((f === pr.owner && pr.t < 24) || F.phase !== 'fight') continue;
      const hb = f.hurtbox(); if (!hb || !overlap(pr.box(), hb)) continue;
      F.hit(f === pr.owner ? f.opp : pr.owner, f, { dmg: pr.dmg, hs: 16, bs: 12, push: 2, lvl: 'mid', meter: 4, stop: 6, snd: 'hitM' }, pr, pr.x);
      pr.hitT[i] = 30; pr.vx = -pr.vx * .9; pr.vy = -3.5;
    }
    return;
  }
  if (it.kind === 'trap') { // the poop: whoever steps on it slips, the one who put it there too
    for (const f of [F.p, F.e]) {
      if (F.phase !== 'fight' || f.y < 0 || !f.grounded || Math.abs(f.x - pr.x) > 12 * f.s || ['knock', 'down', 'ko', 'thrown', 'caught', 'getup'].includes(f.state) || f.inv > 0) continue;
      if (f === pr.owner && pr.t < 40) continue;
      pr.dead = true; F.popup(pr.x, -64, '¡QUÉ ASCO!', '#c89a5a');
      F.hit(f === pr.owner ? f.opp : pr.owner, f, { dmg: it.dmg, kd: 1, hs: 0, push: 1.5, lvl: 'low', unblockable: 1, meter: 3, stop: 8, snd: 'fall' }, { vx: f.facing, y: -6, type: 'item', item: it }, f.x);
      break;
    }
  }
}
function itemProjDraw(pr, g, camX) {
  const it = pr.item, sx = Math.round(pr.x - camX), sy = Math.round(GROUND + pr.y), z = itemSize(it);
  objShadow(g, sx, pr.y + z.h / 2, z.w * .8);
  if (it.kind === 'floor') { drawItem(g, it, sx, sy + (pr.t % 4 < 2 ? 0 : -1), { facing: Math.sign(pr.vx) || 1 }); return; }
  if (it.kind === 'trap') { drawItem(g, it, sx, sy); for (let i = 0; i < 2; i++) { const a = pr.t * .21 + i * 3.1; g.fillStyle = '#1a1424'; g.fillRect(Math.round(sx + Math.cos(a) * 8), Math.round(sy - 9 + Math.sin(a * 1.7) * 3), 1, 1); } return; } // two flies
  drawItem(g, it, sx, sy, { rot: it.ball ? 0 : pr.rot, ang: pr.ang, facing: Math.sign(pr.vx) || 1 });
}

// ---------- effects ----------
// a clean hit with an item (Fight.hit): its text, then its effect
function itemHitFx(F, def, it) {
  if (it.pop) F.popup(def.x, -92, it.pop, '#ffd84a');
  if (!it.fx || def.hp <= 0) return;
  def.fx[it.fx] = ITEM_FX[it.fx];
  if (it.fx === 'tied') { def.setState('hitstun'); def.stun = ITEM_FX.tied; def.vx = 0; }
  if (it.fx === 'caught') { def.setState('caught'); def.vx = def.vy = 0; def.y = 0; def.move = null; flash(3, '#ffffff'); sfx('item'); }
}
// a power-up, as soon as it's picked up
function applyPower(F, f, it) {
  if (it.heal) { f.hp = Math.min(f.maxHp, f.hp + it.heal); f.hpShow = Math.max(f.hpShow, f.hp); F.popup(f.x, -84, '+' + it.heal, '#8fe08a'); sfx('coin'); }
  if (it.fx) { f.fx[it.fx] = ITEM_FX[it.fx]; F.popup(f.x, -84, it.pop || it.name, '#ffd84a'); sfx('super'); }
}

// ---------- the items in a fight (Fight methods) ----------
Object.assign(Fight.prototype, {
  updateItems() {
    if (!itemsOn()) { if (this.items.length) this.items = []; this.p.held = this.e.held = null; return; }
    for (const it of this.items) {
      it.t++;
      if (it.state === 'in' && it.t >= ITEM_IN_T) { it.state = 'floor'; it.t = 0; sfx('land'); this.dust(it.x, 4); }
      else if (it.state === 'floor' && it.t > it.life) { it.dead = true; this.smokePuff(it.x, -6, true); }
    }
    this.items = this.items.filter(i => !i.dead);
    if (this.phase !== 'fight' || --this.itemT > 0 || this.items.length) return;
    this.itemT = rndi(ITEM_EVERY[0], ITEM_EVERY[1]);
    this.spawnItem();
  },
  // a friend in the crowd throws their item (any item, from the sky, on a stage without a crowd)
  spawnItem(id) {
    const crowd = this.stage.crowd || [], pool = crowd.length ? crowd.map(c => c.id) : ROSTER;
    const ids = Object.keys(ITEMS).filter(k => pool.includes(ITEMS[k].owner)); if (!id && !ids.length) return;
    id = id || pick(ids);
    const c = crowd.find(m => m.id === ITEMS[id].owner);
    let x = this.camX + W / 2;
    for (let i = 0; i < 12; i++) { x = rnd(this.camX + 40, this.camX + W - 40); if (Math.abs(x - this.p.x) > 50 && Math.abs(x - this.e.x) > 50) break; } // away from both fighters
    this.items.push({ id, it: ITEMS[id], x: clamp(x, this.arena.l + 30, this.arena.r - 30), state: 'in', t: 0, life: ITEM_LIFE, from: c ? { crowd: c } : null });
    if (c && this.stage.toss) this.stage.toss(c);
    sfx('throw');
  },
  // crouching on an item picks it up
  tryPickup(f) {
    if (f.held || !f.grounded || !itemsOn()) return false;
    const it = this.items.find(i => i.state === 'floor' && Math.abs(i.x - f.x) < 20 * f.s); if (!it) return false;
    this.items = this.items.filter(i => i !== it);
    if (it.it.kind === 'power') applyPower(this, f, it.it);
    else { f.held = it.id; this.popup(f.x, -84, it.it.name, '#8fe0ff'); sfx('item'); }
    return true;
  },
  // □ with an item: throw it (or put it down)
  useItem(f) { if (!f.held) return false; f.tossItem = f.held; f.held = null; f.doMove('toss'); sfx('whiff'); return true; },
  // hit while holding an item: it falls
  dropItem(f) {
    if (!f.held) return;
    this.items.push({ id: f.held, it: ITEMS[f.held], x: clamp(f.x - f.facing * 18, this.camX + 20, this.camX + W - 20), state: 'in', t: 18, life: 360, from: { x: f.x, y: f.y - 60 * f.s } });
    f.held = null;
  },
  drawItems(g, camX) {
    for (const it of this.items) {
      const z = itemSize(it.it), fx = it.x - camX, fy = GROUND - z.h / 2;
      if (it.state === 'floor') {
        if (it.t > it.life - 120 && it.t % 8 < 4) continue; // about to vanish: blinks
        shadow(g, fx, GROUND, z.w * .9, .3);
        drawItem(g, it.it, Math.round(fx), Math.round(fy - (Math.floor(it.t / 20) % 2)));
        if (it.t % 40 < 20) { g.fillStyle = '#fff4a0'; g.fillRect(Math.round(fx) - 1, Math.round(fy - z.h / 2 - 7), 3, 1); g.fillRect(Math.round(fx), Math.round(fy - z.h / 2 - 6), 1, 2); } // a twinkle so it's noticed
        continue;
      }
      // flying in: from the friend in the crowd (half size, back there) or from where it was dropped, in an arc
      const k = it.t / ITEM_IN_T, c = it.from && it.from.crowd;
      const sx0 = c ? projX(c.wx, floorF(c.y), camX) : it.from ? it.from.x - camX : fx, sy0 = c ? c.y - 30 : it.from ? GROUND + it.from.y : -20;
      const x = lerp(sx0, fx, k), y = lerp(sy0, fy, k) - Math.sin(Math.PI * k) * (c ? 70 : it.from ? 30 : 0), sc = c ? lerp(.55, 1, k) : 1;
      if (!c && !it.from) shadow(g, fx, GROUND, z.w * k, .3 * k);
      drawItem(g, it.it, Math.round(x), Math.round(y), { scale: sc, rot: it.it.ball ? 0 : k * Math.PI * 2, ang: k * 8 });
    }
  },
});
