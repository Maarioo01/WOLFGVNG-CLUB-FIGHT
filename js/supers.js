'use strict';
// ============================================================
//  SUPERS — each fighter's cinematic super move: an instant K.O., once per match.
//  The blue bar fills while fighting (slower than before: SUPER_CHARGE). With it full, the super key
//  starts a SuperScene: after the cut-in the fight freezes and the fighter's script (a generator)
//  moves both fighters, spawns props and effects, and ends with the opponent K.O.
//  Frames come from the fighter's sheet F (super_*, prop_*, see docs/super-prompts.md). Until it exists,
//  'super_1|idle_1' falls back to idle_1 (optionally tinted) and props are drawn by code (PROP_DRAW).
// ============================================================
const SUPER_CHARGE = .7; // bar gained per hit (given or taken) is multiplied by this: a full bar takes about two rounds
const IDLE_LOOP = ['idle_1', 'idle_2', 'idle_3', 'idle_4'];
const WALK_BACK = ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6'];

const SUPERS = {
  mario: { name: '¡INYECCIÓN!', run: superMario },
  peno: { name: '¡CHOLISMO!', run: superPeno },
  alba: { name: '¡IPPON!', run: superAlba },
  alvaro: { name: '¡A TODO GAS!', run: superAlvaro },
  belli: { name: '¡HACKEO!', run: superBelli },
  bene: { name: '¡CONCIERTO!', run: superBene },
  carlottis: { name: '¡VACUNA!', run: superCarlottis },
  marcos: { name: '¡YOGURAZO!', run: superMarcos },
  oso: { name: '¡CULPABLE!', run: superOso },
  casado: { name: '¡ARTILLERÍA!', run: superCasado },
  madeverxp: { name: '¡LANZALLAMAS!', run: superMadeverxp },
  manu: { name: '¡LÁGRIMAS!', run: superManu },
};

// ---------- frames & drawing ----------
// 'super_1|idle_1' -> [sprite, isStandIn]: super_1 when the fighter has it, otherwise idle_1
function superFrame(f, spec) {
  const [want, fb] = spec.split('|');
  if (typeof spriteSet !== 'function' || !spriteSet(f.def)) return [getSprite(f.def, 'idle', FIGHT_REF ? FIGHT_REF.tick : 0), true];
  if (spriteHas(f.def, want) || !fb) return [spriteFrame(f.def, want), false];
  return [spriteFrame(f.def, fb), true];
}
// sprite drawn with extra scale / vertical squash / rotation (around a point cy units above the feet)
function drawSprEx(g, s, x, y, facing, o = {}) {
  const k = (s.hd ? 1 / s.hd : (s.sc || 1)) * (o.scale || 1);
  g.save(); g.translate(Math.round(x), Math.round(y));
  if (o.rot) { const cy = o.cy || 0; g.translate(0, -cy); g.rotate(o.rot * facing); g.translate(0, cy); }
  if (o.alpha != null && o.alpha < 1) g.globalAlpha = Math.max(0, o.alpha);
  g.scale(facing * k, k * (o.sq || 1));
  g.drawImage(o.img || s.c, -s.ax, -s.ay);
  g.restore();
}
// a fighter whose drawing is taken over by a super script (Fighter.draw calls this when f.ov is set)
//   ov: { pose | frames + every, dx, dy, scale, sq, rot, cy, flip, alpha, tint, fbTint, glitch, jitter, hidden }
function drawFighterOv(f, g, camX) {
  const o = f.ov; if (o.hidden) return;
  const tick = FIGHT_REF ? FIGHT_REF.tick : 0;
  const spec = o.frames ? o.frames[Math.floor((tick - (o.t0 || 0)) / (o.every || 6)) % o.frames.length] : (o.pose || 'idle_1');
  const [spr, standIn] = superFrame(f, spec);
  const bx = f.x + (o.dx || 0) - camX, scale = o.scale || 1;
  let x = bx;
  if (o.jitter) x += rndi(-o.jitter, o.jitter);
  if (o.glitch && tick % 5 < 2) x += rndi(-5, 5);
  if (!o.noShadow) shadow(g, bx, GROUND, 26 * f.s * scale, .4);
  const tint = (standIn && o.fbTint) || o.tint;
  let img = tint ? tintedOf(spr, tint[0], tint[1]) : null;
  if (o.glitch && tick % 6 < 3) img = tintedOf(spr, '#40ff60', .5);
  drawSprEx(g, spr, x, GROUND + f.y + (o.dy || 0), f.facing * (o.flip ? -1 : 1), { scale, sq: o.sq, rot: o.rot, cy: o.cy, alpha: o.alpha, img });
}

// ---------- props ----------
// in-game size of each prop (units); sprites from sheet F are resized to it ('w' = width, 'h' = height)
const PROP_SIZE = {
  car: ['w', 200], tank: ['w', 230], tank_2: ['w', 230], missile: ['w', 36], yogurt: ['h', 130], yogurt_2: ['w', 210],
  charizard: ['h', 150], charizard_2: ['h', 150], isaac: ['h', 150], isaac_2: ['h', 150], // isaac includes Manu on his head
  pokeball: ['w', 11], note: ['h', 16], syringe: ['w', 28], virus: ['h', 120],
};
const PROP_CENTRED = { missile: 1, pokeball: 1, note: 1, syringe: 1, virus: 1, tear: 1, ball: 1 }; // anchor = centre, not feet
function drawProp(g, p, camX, owner) {
  if (p.hidden) return;
  const f = p.f;
  g.save(); g.translate(Math.round(p.x - camX), Math.round(GROUND + p.y));
  if (p.alpha < 1) g.globalAlpha = Math.max(0, p.alpha);
  if (p.rot) { const px = (p.pivot || 0) * f; g.translate(px, 0); g.rotate(p.rot); g.translate(-px, 0); }
  if (p.scale !== 1) g.scale(p.scale, p.scale);
  const size = PROP_SIZE[p.kind];
  if (size && spriteHas(owner.def, 'prop_' + p.kind)) {
    const s = spriteFrame(owner.def, 'prop_' + p.kind), k = size[1] / (size[0] === 'w' ? s.c.width : s.c.height);
    g.scale(f * k, k); g.drawImage(s.c, -s.c.width / 2, PROP_CENTRED[p.kind] ? -s.c.height / 2 : -s.c.height);
  } else {
    const draw = PROP_DRAW[p.kind] || PROP_DRAW[p.kind.replace(/_\d+$/, '')]; // tank_2 -> tank (the drawer checks p.kind)
    if (draw) draw(g, f, p, owner);
  }
  g.restore();
}
// pen for code-drawn props: local coords around the anchor (x forward, y up = negative), mirrored by facing
function pen(g, f) {
  const X = (x, w = 0) => Math.round(f > 0 ? x : -x - w);
  return {
    r: (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(X(x, w), Math.round(y), w, h); },
    o: (x, y, w, h, col) => { g.fillStyle = OUTL; g.fillRect(X(x - 1, w + 2), Math.round(y - 1), w + 2, h + 2); g.fillStyle = col; g.fillRect(X(x, w), Math.round(y), w, h); },
    c: (x, y, d, col) => stamp(g, x * f, y, d, col),
    p: (pts, col) => polyFill(g, pts.map(([x, y]) => pt(x * f, y)), col),
    po: (pts, col) => polyOut(g, pts.map(([x, y]) => pt(x * f, y)), col),
    l: (x0, y0, x1, y1, d, col) => seg(g, pt(x0 * f, y0), pt(x1 * f, y1), d, col),
  };
}
const PROP_DRAW = {
  ball(g, f, p) { stamp(g, 0, 0, 10, OUTL); stamp(g, 0, 0, 8, '#f4f4f4'); const a = p.t * .3 * f; g.fillStyle = '#1a1a1a'; g.fillRect(Math.round(Math.cos(a) * 2) - 1, Math.round(Math.sin(a) * 2) - 1, 2, 2); },
  tear(g) { stamp(g, 0, 0, 8, OUTL); stamp(g, 0, 0, 6, '#6ab0f0'); g.fillStyle = '#e8f6ff'; g.fillRect(-2, -2, 1, 1); },
  syringe(g, f) {
    const P = pen(g, f);
    P.o(-18, -4, 2, 8, '#9a9ea8'); P.o(-16, -2, 4, 4, '#b8bcc4'); P.o(-12, -3, 18, 6, '#eef4fa');
    P.r(-5, -2, 10, 4, '#7ad0ff'); P.r(-11, -3, 18, 1, '#ffffff'); P.r(6, -1, 2, 2, '#9a9ea8'); P.r(8, -1, 8, 1, '#e0e0e8');
  },
  missile(g, f, p) {
    const P = pen(g, f);
    P.p([[-17, -7], [-10, -3], [-10, 3], [-17, 7]], OUTL); P.p([[-16, -6], [-10, -2], [-10, 2], [-16, 6]], '#6a6e76');
    P.o(-12, -3, 24, 6, '#b8bcc4'); P.r(-12, -3, 24, 1, '#dce0e6'); P.r(-4, -3, 3, 6, '#3a5a2a');
    P.p([[12, -4], [19, 0], [12, 4]], OUTL); P.p([[12, -3], [17, 0], [12, 3]], '#d83030');
    if ((p.t >> 1) % 2) { P.c(-20, 0, 7, '#ffd040'); P.c(-19, 0, 3, '#fff4c0'); } else P.c(-20, 0, 6, '#ff8030');
  },
  pokeball(g, f) {
    stamp(g, 0, 0, 12, OUTL); stamp(g, 0, 0, 10, '#f4f4f4');
    g.save(); g.beginPath(); g.rect(-6, -6, 12, 6); g.clip(); stamp(g, 0, 0, 10, '#e83030'); g.restore();
    g.fillStyle = OUTL; g.fillRect(-5, -1, 10, 2); stamp(g, 0, 0, 5, OUTL); stamp(g, 0, 0, 3, '#ffffff');
  },
  note(g, f, p) {
    const P = pen(g, f), c = p.col || '#ffd040';
    P.l(2, -1, 2, -13, 3, OUTL); P.l(2, -13, 7, -9, 3, OUTL); P.c(-1, 0, 8, OUTL);
    P.l(2, -1, 2, -13, 1, c); P.l(2, -13, 6, -9, 1, c); P.c(-1, 0, 6, c); P.c(-2, -1, 2, '#ffffff');
  },
  car(g, f, p) { // red convertible; the stand-in driver is Álvaro's head and cap
    const P = pen(g, f);
    if (p.driver) { P.o(-36, -46, 18, 12, '#2f5cc0'); P.c(-26, -52, 14, OUTL); P.c(-26, -52, 12, '#c98e62'); P.o(-34, -60, 17, 5, '#f2f2f2'); P.r(-20, -57, 9, 2, '#f2f2f2'); }
    P.po([[-100, -12], [-100, -26], [-80, -31], [-44, -33], [-14, -36], [24, -36], [44, -32], [94, -28], [100, -18], [100, -12]], '#d81e1e');
    P.r(-96, -30, 186, 2, '#ff5a5a'); P.r(-100, -16, 200, 4, '#8a1010');
    P.po([[-2, -36], [12, -48], [16, -48], [8, -36]], '#9fd8f8');
    P.r(92, -27, 6, 4, '#fff4a0'); P.r(-100, -27, 4, 4, '#ff6060'); P.r(30, -30, 5, 5, '#f2c14e');
    for (const wx of [-62, 64]) {
      P.c(wx, -12, 26, OUTL); P.c(wx, -12, 22, '#1a1a1e'); P.c(wx, -12, 11, '#c8c8d0');
      const a = p.t * .6; P.l(wx, -12, wx + Math.cos(a) * 5, -12 + Math.sin(a) * 5, 2, '#5a5a62');
    }
  },
  tank(g, f, p) { // olive tank; the stand-in crew is Casado's head and cap in the hatch
    const P = pen(g, f), fire = p.kind === 'tank_2';
    if (p.crew) {
      P.c(-6, -92, 15, OUTL); P.c(-6, -92, 13, '#e8b894'); P.o(-15, -102, 18, 5, '#6e6a3a'); P.r(-8, -101, 3, 2, '#f2c14e');
      if (fire) P.l(2, -84, 22, -94, 4, '#6e6a3a'); else P.l(2, -84, 6, -98, 4, '#6e6a3a');
    }
    P.po([[-50, -50], [-40, -78], [34, -78], [48, -50]], '#7a7642'); P.r(-38, -76, 70, 3, '#949058');
    const bl = fire ? 70 : 84; P.o(44, -70, bl, 8, '#5e5a32'); P.o(42 + bl, -72, 8, 12, '#4a4628');
    P.po([[-112, -30], [-100, -50], [100, -50], [114, -30]], '#6e6a3a'); P.r(-102, -48, 202, 3, '#86824a');
    P.po([[-116, -30], [116, -30], [104, -2], [-104, -2]], '#2e2e24');
    for (let i = -5; i <= 5; i++) { P.c(i * 20, -15, 16, OUTL); P.c(i * 20, -15, 13, '#4a4a3a'); P.c(i * 20, -15, 5, '#6a6a56'); }
    for (let i = 0; i < 24; i++) P.r(-110 + ((i * 10 + p.t * 2) % 220), -31, 4, 2, '#4a4a3a');
  },
  yogurt(g, f) {
    const P = pen(g, f);
    P.po([[-44, -124], [44, -124], [36, 0], [-36, 0]], '#f6f6f0'); P.p([[-44, -124], [-30, -124], [-24, -1], [-36, -1]], '#dcdcd4');
    P.p([[-41, -92], [41, -92], [38, -54], [-38, -54]], '#2a62d0'); P.r(-41, -92, 82, 3, '#4a82f0');
    text(g, 'GRIEGO', 0, -78, { align: 'center', color: '#ffffff' });
    P.o(-48, -132, 96, 8, '#d8dce4'); P.r(-48, -132, 96, 2, '#f4f6fa');
  },
  spill(g, f, p) { // the yogurt wave, p.w units long
    const P = pen(g, f), w = Math.max(6, p.w | 0), pts = [[0, 0], [0, -16]];
    for (let x = 6; x <= w; x += 6) pts.push([x, -13 - 5 * Math.sin(x * .2 + p.t * .3)]);
    pts.push([w + 8, -5], [w + 8, 0]);
    P.po(pts, '#f8f8f2'); P.r(0, -4, w + 6, 2, '#e4e4dc');
  },
  gavel(g, f) { // pivot = bottom of the handle; rot 0 points up
    const P = pen(g, f);
    P.o(-2, -56, 5, 56, '#8a5a30'); P.o(-18, -76, 37, 21, '#7a4a24'); P.r(-18, -76, 37, 3, '#a06a3a');
    P.r(-12, -76, 3, 21, '#5a3418'); P.r(9, -76, 3, 21, '#5a3418');
  },
  desk(g, f, p) { // stand-in desk + laptop for Belli
    const P = pen(g, f);
    P.o(-30, -32, 60, 5, '#7a5634'); P.o(-27, -27, 4, 27, '#5a3a20'); P.o(23, -27, 4, 27, '#5a3a20');
    P.o(-8, -35, 26, 3, '#9aa0aa');
    P.p([[16, -35], [21, -56], [26, -56], [21, -35]], OUTL); P.p([[17, -36], [22, -54], [24, -54], [19, -36]], '#141820');
    if ((p.t >> 2) % 2) P.r(20, -48, 2, 1, '#40ff70');
  },
  charizard(g, f, p) { // stand-in orange fire dragon: cream belly, teal wings, flame on the tail
    const P = pen(g, f), fire = p.kind === 'charizard_2', OR = '#f08030', OD = '#c05a20', CR = '#f8d890';
    const thick = (x0, y0, x1, y1, w, col) => { P.l(x0, y0, x1, y1, w + 2, OUTL); P.l(x0, y0, x1, y1, w, col); };
    P.po([[-4, -92], [-44, -150], [-50, -126], [-78, -122], [-52, -104], [-64, -86], [-18, -80]], '#23807e');  // back wing
    P.po([[8, -94], [-28, -146], [-34, -124], [-62, -120], [-38, -104], [-48, -88], [-4, -82]], '#2fb0aa');    // front wing
    P.l(8, -94, -28, -146, 2, OD); P.l(-28, -146, -34, -124, 2, OD); P.l(-34, -124, -62, -120, 2, OD);
    thick(-14, -28, -44, -20, 12, OR); thick(-44, -20, -62, -36, 9, OR);                                       // tail
    const fl = (p.t >> 2) % 2; P.c(-64, -44, 15 + fl * 2, '#ffd040'); P.c(-64, -46, 9, '#ff6020'); P.c(-64, -42, 4, '#fff4a0');
    for (const [x, y, d] of [[-10, -24, 26], [18, -24, 26], [2, -52, 60], [4, -80, 42]]) P.c(x, y, d, OUTL); // body outline
    for (const [x, y, d] of [[-10, -24, 22], [18, -24, 22], [2, -52, 56], [4, -80, 38]]) P.c(x, y, d, OR);
    P.c(10, -50, 38, CR); P.c(12, -74, 22, CR); P.r(-2, -62, 22, 1, '#e0b868'); P.r(0, -50, 22, 1, '#e0b868'); P.r(2, -38, 18, 1, '#e0b868');
    P.o(-22, -6, 20, 6, OR); P.o(8, -6, 22, 6, OR); for (const x of [-4, 0, 26, 30]) P.r(x, -3, 2, 3, '#ffffff'); // feet + claws
    const hx = fire ? 40 : 30, hy = fire ? -112 : -122;
    thick(8, -92, hx - 6, hy + 8, 16, OR);                                                                   // neck
    P.c(hx, hy, 30, OUTL); P.c(hx + 12, hy + 4, 20, OUTL); P.c(hx, hy, 26, OR); P.c(hx + 12, hy + 4, 16, OR); // head + snout
    thick(hx - 8, hy - 10, hx - 16, hy - 22, 3, OR); thick(hx - 2, hy - 12, hx - 6, hy - 24, 3, OR);         // horns
    P.c(hx + 4, hy - 4, 7, '#ffffff'); P.c(hx + 5, hy - 4, 4, '#1a3a8a');
    if (fire) P.p([[hx + 10, hy + 5], [hx + 26, hy + 1], [hx + 24, hy + 13]], '#6a1010'); else P.l(hx + 10, hy + 9, hx + 20, hy + 8, 1, OUTL);
    thick(16, -80, 30, -66, 6, OR); P.r(30, -67, 2, 2, '#ffffff'); P.r(28, -64, 2, 2, '#ffffff');            // arm
  },
  isaac(g, f, p, owner) { // stand-in crying child with a huge bald head; Manu rides on top
    const P = pen(g, f), cry = p.kind === 'isaac_2', SK = '#f6e0d8';
    P.po([[-11, -42], [11, -42], [14, 0], [-14, 0]], '#f2d8cc'); P.r(-14, -17, 28, 8, '#8a6a5a');
    P.l(-9, -38, -17, -21, 6, OUTL); P.l(-9, -38, -17, -21, 4, SK); P.l(9, -38, 17, -21, 6, OUTL); P.l(9, -38, 17, -21, 4, SK);
    P.c(0, -74, 66, OUTL); P.c(0, -74, 62, SK); P.c(-8, -70, 40, '#fae8e2');
    for (const ex of [-12, 12]) { P.c(ex, -74, 17, OUTL); P.c(ex, -74, 14, '#ffffff'); P.c(ex + 1, -73, 9, '#1a1418'); P.c(ex, -75, 3, '#ffffff'); }
    P.l(-20, -85, -7, -89, 2, '#8a6a5a'); P.l(20, -85, 7, -89, 2, '#8a6a5a');
    if (cry) { P.c(1, -55, 14, OUTL); P.c(1, -55, 11, '#4a1418'); } else P.l(-7, -55, 8, -55, 2, '#8a4a4a');
    for (const ex of [-12, 12]) P.r(ex - 1, -66, 3, 10 + (p.t % 10), '#7ab8f0');
    if (p.rider && owner) { const [s] = superFrame(owner, 'crouch|idle_1'); drawSprEx(g, s, -f * 3, -103, f, { scale: .75 }); }
  },
};
// green skull "virus" logo (Belli's stand-in for prop_virus), centred on (cx, cy)
function drawVirusLogo(g, cx, cy, k, t) {
  g.save(); g.translate(cx, cy); g.scale(k, k);
  g.fillStyle = OUTL; g.fillRect(-54, -54, 108, 108); g.fillStyle = '#071007'; g.fillRect(-52, -52, 104, 104);
  g.fillStyle = '#103a14'; for (let i = -48; i < 52; i += 8) { g.fillRect(i, -52, 1, 104); g.fillRect(-52, i, 104, 1); }
  const G = '#40f060';
  stamp(g, 0, -12, 58, G); stamp(g, 0, -6, 50, G);
  stamp(g, -12, -14, 16, '#071007'); stamp(g, 12, -14, 16, '#071007');
  if (t % 10 < 5) { stamp(g, -12, -13, 5, '#ff3030'); stamp(g, 12, -13, 5, '#ff3030'); }
  polyFill(g, [pt(0, -2), pt(-4, 5), pt(4, 5)], '#071007');
  g.fillStyle = G; g.fillRect(-14, 10, 28, 10); g.fillStyle = '#071007'; for (let x = -10; x < 14; x += 6) g.fillRect(x, 10, 2, 10);
  seg(g, pt(-40, 24), pt(40, 44), 6, G); seg(g, pt(40, 24), pt(-40, 44), 6, G);
  g.restore();
}

// ---------- the scene ----------
class SuperScene {
  constructor(F, a) {
    this.F = F; this.a = a; this.v = a.opp; this.t = 0; this.freeze = true; this.done = false; this.koed = false;
    this.props = []; this.fx = []; this.screen = null;
    const v = this.v;
    for (const f of [a, v]) { f.y = 0; f.vx = f.vy = 0; f.move = null; f.flash = 0; f.inv = 0; }
    a.face(); v.face(); this.d = a.facing;
    a.setState('super'); v.setState('hitstun'); v.stun = 99999;
    F.projs = [];
    a.ov = { frames: IDLE_LOOP, every: 11 }; v.ov = { frames: IDLE_LOOP, every: 11 };
    this.co = (SUPERS[a.kind] || SUPERS.mario).run(this, a, v, this.d);
  }
  update() {
    this.t++;
    if (this.co) { const r = this.co.next(); if (r.done) { this.co = null; this.done = true; } }
    for (const p of this.props) { p.t++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.va; if (p.update) p.update(p); }
    this.props = this.props.filter(p => !p.dead && !(p.life && p.t >= p.life));
    for (const q of this.fx) { q.t++; q.vy += q.g; q.x += q.vx; q.y += q.vy; }
    this.fx = this.fx.filter(q => q.t < q.life);
  }
  // --- script helpers
  *wait(n) { for (let i = 0; i < n; i++) yield; }
  *until(fn, max = 240) { for (let i = 0; i < max && !fn(); i++) yield; }
  set(f, o) { f.ov = Object.assign({ t0: this.F.tick }, o); return f.ov; }
  prop(o) { const p = Object.assign({ t: 0, x: 0, y: 0, vx: 0, vy: 0, g: 0, rot: 0, va: 0, scale: 1, alpha: 1, layer: 'front', f: this.d }, o); this.props.push(p); return p; }
  emit(kind, x, y, vx, vy, life) { this.fx.push({ kind, x, y, vx, vy, life, t: 0, g: kind === 'splash' ? .22 : 0 }); }
  chest(f) { return -f.s * 34; }
  bounds() { const F = this.F; return [Math.max(F.arena.l, F.camX) + 16, Math.min(F.arena.r, F.camX + W) - 16]; } // on-screen x range
  // both fighters step back until they are at least `min` apart (room for big props)
  *spread(min) {
    const a = this.a, v = this.v, d = this.d, [lo, hi] = this.bounds();
    if (Math.abs(v.x - a.x) >= min) return;
    this.set(a, { frames: WALK_BACK, every: 5 }); this.set(v, { frames: WALK_BACK, every: 5 });
    for (let i = 0; i < 60 && Math.abs(v.x - a.x) < min; i++) {
      const na = clamp(a.x - d * 3, lo, hi), nv = clamp(v.x + d * 3, lo, hi);
      if (na === a.x && nv === v.x) break;
      a.x = na; v.x = nv; yield;
    }
    this.set(a, { frames: IDLE_LOOP, every: 11 }); this.set(v, { frames: IDLE_LOOP, every: 11 });
  }
  say(x, y, txt, col = '#ffd84a') { this.F.popup(x, y, txt, col); }
  poof(x, y = -40) { for (let i = 0; i < 12; i++) this.F.smokePuff(x + rnd(-16, 16), y + rnd(-30, 22), true); sfx('whoosh'); flash(2, '#ffffff'); }
  boom(x, y, big) { this.F.spark(x, y, big ? 'big' : 'hit'); sfx(big ? 'hitH' : 'hitM'); shake(big ? 7 : 3, big ? 16 : 6); }
  // the opponent is K.O.: the round goes to the attacker, then the fight runs again (slow motion)
  finish(vx, vy) {
    const F = this.F, a = this.a, v = this.v;
    v.ov = null; v.hp = 0; v.stun = 0; v.setState('idle');
    if (a.state === 'super') a.setState('idle');
    F.ko(a, v);
    v.vx = vx; v.vy = vy; v.y = Math.min(v.y, -3); v.bounced = false;
    this.freeze = false; this.koed = true;
  }
  // --- drawing (called by Fight)
  draw(g, camX, layer) {
    for (const p of this.props) if (p.layer === layer) drawProp(g, p, camX, this.a);
    if (layer !== 'front') return;
    for (const q of this.fx) {
      const x = Math.round(q.x - camX), y = Math.round(GROUND + q.y), k = q.t / q.life;
      if (q.kind === 'fire') { g.globalAlpha = 1 - k * .5; stamp(g, x, y, 4 + k * 9, k < .25 ? '#fff4a0' : k < .55 ? '#ffb030' : k < .8 ? '#ff5a20' : '#6a2a20'); g.globalAlpha = 1; }
      if (q.kind === 'smoke') { g.globalAlpha = .8 * (1 - k); stamp(g, x, y, 4 + k * 10, '#9a9aa4'); g.globalAlpha = 1; }
      if (q.kind === 'speed') { g.globalAlpha = .7 * (1 - k); g.fillStyle = '#ffffff'; g.fillRect(x, y, 16, 1); g.globalAlpha = 1; }
      if (q.kind === 'splash') { g.fillStyle = k < .5 ? '#bfe4ff' : '#6ab0f0'; g.fillRect(x, y, 2, 2); }
    }
  }
  drawScreen(g) { // screen-wide overlays (Belli's virus)
    if (!this.screen) return;
    const t = this.F.tick - this.screen.t0;
    g.globalAlpha = .22; g.fillStyle = '#20ff60'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { if (Math.random() < .5) continue; g.globalAlpha = .35; g.fillStyle = pick(['#20ff60', '#ff2a6a', '#000000', '#2a6aff']); g.fillRect(rndi(-40, 0), rndi(0, H - 6), W + 80, rndi(1, 5)); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    const k = Math.min(1, t / 10), jx = t % 9 < 2 ? rndi(-6, 6) : 0;
    if (spriteHas(this.a.def, 'prop_virus')) {
      const s = spriteFrame(this.a.def, 'prop_virus'), sc = PROP_SIZE.virus[1] / s.c.height * k;
      g.drawImage(s.c, Math.round(W / 2 + jx - s.c.width * sc / 2), Math.round(98 - s.c.height * sc / 2), s.c.width * sc, s.c.height * sc);
    } else drawVirusLogo(g, W / 2 + jx, 98, k, t);
    if (t % 16 < 10) text(g, '¡VIRUS DETECTADO!', W / 2, 168, { align: 'center', color: '#40f060', outline: OUTL });
  }
}

// ============================================================
//  THE SUPERS (S = scene, a = attacker, v = victim, d = direction toward the victim)
// ============================================================
// Mario: syringe, injection, he grows until he fills the screen, one huge punch
function* superMario(S, a, v, d) {
  const syr = spriteHas(a.def, 'super_1') ? null : S.prop({ kind: 'syringe', x: a.x + d * 16, y: -72, rot: -1.1 * d });
  S.set(a, { pose: 'super_1|idle_1' }); yield* S.wait(36);
  S.set(a, { pose: 'super_2|block' }); sfx('steal');
  if (syr) { syr.x = a.x + d * 3; syr.y = -62; syr.rot = .5 * d; }
  yield* S.wait(32);
  if (syr) syr.dead = true;
  const pump = { fbTint: ['#ff5030', .22] }, big = Math.max(1.6, (GROUND - 8) / (a.s * 63)); // standing height = s * 63 units
  S.set(a, { pose: 'super_3|victory_2', ...pump });
  for (let i = 1; i <= 72; i++) { a.ov.scale = 1 + (big - 1) * easeIn(i / 72); if (i % 9 === 0) { sfx('hitL'); shake(2 + i / 24, 6); } yield; }
  sfx('hitH'); shake(7, 22); flash(3, '#ffffff'); yield* S.wait(26);
  const scale = a.ov.scale, gap = Math.max(0, Math.abs(v.x - a.x) - 34 * scale);
  S.set(a, { pose: 'super_4|strong_2', scale, ...pump });
  for (let i = 1; i <= 6; i++) { a.ov.dx = d * gap * i / 6; yield; }
  S.boom(v.x - d * 6, S.chest(v), true); flash(6, '#ffffff'); shake(12, 30);
  S.finish(d * 8.5, -9.5);
  for (let i = 1; i <= 40; i++) { a.ov.scale = scale - (scale - 1) * easeOut(i / 40); yield; }
  a.x += a.ov.dx; a.ov = null;
}
// Peño: becomes Cholo Simeone, kicks the ball into the opponent and runs off
function* superPeno(S, a, v, d) {
  const sim = { fbTint: ['#141418', .6] }; // stand-in: Peño dressed in black
  S.poof(a.x); yield* S.wait(8);
  S.set(a, { pose: 'super_1|idle_1', ...sim }); S.say(a.x, -100, '¡PARTIDO A PARTIDO!'); yield* S.wait(44);
  const ball = S.prop({ kind: 'ball', x: a.x + d * 24, y: -6 });
  S.set(a, { pose: 'super_2|kick_1', ...sim }); yield* S.wait(12);
  S.set(a, { pose: 'super_3|kick_2', ...sim }); sfx('throw'); sfx('hitM');
  ball.vx = d * 9; ball.vy = -2.2; ball.g = .08;
  yield* S.until(() => d * (ball.x - v.x) > -10, 90);
  S.boom(v.x - d * 4, -36, true);
  ball.vx = -d * 2.2; ball.vy = -4.5; ball.g = .25; ball.life = ball.t + 60;
  S.finish(d * 7.5, -8);
  S.set(a, { frames: ['super_4|walk_fwd_1', 'super_5|walk_fwd_4'], every: 5, flip: true, ...sim });
  for (let i = 0; i < 64; i++) { a.ov.dx = -d * i * 5; if (i % 6 === 0) S.F.dust(a.x + a.ov.dx, 1); yield; }
  yield* S.wait(24);
  a.ov = null; S.poof(a.x);
}
// Alba: judo gi, backflip over the opponent, shoulder throw into the ground
function* superAlba(S, a, v, d) {
  const gi = { fbTint: ['#ffffff', .32] }; // stand-in: Alba in white
  S.poof(a.x); yield* S.wait(6);
  S.set(a, { pose: 'super_1|idle_1', ...gi }); yield* S.wait(34);
  const [lo, hi] = S.bounds(), x0 = a.x, x1 = clamp(v.x + d * 36, lo, hi), N = 34; sfx('jump');
  S.set(a, { pose: 'super_2|jump_2', cy: 44, ...gi });
  for (let i = 1; i <= N; i++) { const k = i / N; a.x = lerp(x0, x1, k); a.ov.dy = -Math.sin(Math.PI * k) * 74; a.ov.rot = -k * Math.PI * 2; yield; }
  a.ov.dy = 0; a.ov.rot = 0; a.facing = -d; sfx('land'); S.F.dust(a.x, 6);
  S.set(a, { pose: 'super_3|strong_2', ...gi }); yield* S.wait(8);
  const vx0 = v.x, vx1 = clamp(a.x + d * 40, lo, hi) === a.x + d * 40 ? a.x + d * 40 : v.x;
  S.set(v, { pose: 'hit|idle_1', cy: 40 });
  for (let i = 1; i <= 20; i++) { const k = easeIn(i / 20); v.x = lerp(vx0, vx1, k); v.ov.dy = -Math.sin(Math.PI * k) * 70; v.ov.rot = k * Math.PI * 1.2; yield; }
  S.boom(v.x, -14, true); shake(10, 22); S.F.dust(v.x, 14); sfx('fall');
  S.finish(d * 1.4, -2.6);
  S.set(a, { pose: 'super_4|victory', ...gi }); yield* S.wait(54);
  a.ov = null;
}
// Álvaro: his car arrives, he jumps in and runs the opponent over
function* superAlvaro(S, a, v, d) {
  const car = S.prop({ kind: 'car', x: a.x - d * 320 });
  sfx('dash'); S.say(a.x, -100, '¡BRUM BRUM!');
  S.set(a, { pose: 'super_1|jump_3' });
  while (d * (a.x - car.x) > 6) { car.x += d * 8; if (car.t % 3 === 0) S.F.dust(car.x - d * 90, 1); yield; }
  car.x = a.x; car.driver = true; S.set(a, { hidden: true }); sfx('land');
  yield* S.wait(14); sfx('dash');
  let hit = false;
  for (let i = 0; i < 200; i++) {
    car.x += d * Math.min(15, 3 + i * .5);
    if (i % 2 === 0) S.emit('speed', car.x - d * (104 + 16 * (d > 0)), rnd(-40, -8), -d * 6, 0, 8);
    if (!hit && d * (car.x + d * 92 - v.x) > 0) { hit = true; S.boom(v.x, -30, true); S.finish(d * 10, -10.5); }
    if (hit && d * (car.x - v.x) > 300) break;
    yield;
  }
  car.dead = true;
  yield* S.wait(20);
  S.poof(a.x); a.ov = null;
}
// Belli: codes at his desk, a virus takes over the screen and the opponent glitches out
function* superBelli(S, a, v, d) {
  const desk = spriteHas(a.def, 'super_1') ? null : S.prop({ kind: 'desk', x: a.x + d * 14 });
  S.poof(a.x); yield* S.wait(6);
  S.set(a, { frames: ['super_1|crouch', 'super_2|crouch'], every: 6 }); S.say(a.x, -84, 'HACKEANDO...', '#40f060');
  for (let i = 0; i < 64; i++) { if (i % 4 === 0) sfx('tick'); yield; }
  S.screen = { kind: 'virus', t0: S.F.tick }; sfx('shock');
  S.set(v, { pose: 'hit|idle_1', glitch: true });
  for (let i = 0; i < 84; i++) { if (i % 7 === 0) sfx('blip', 180 + rnd(0, 500)); yield; }
  S.screen = null; flash(4, '#40ff60');
  S.finish(d * 1.5, -3);
  yield* S.wait(36);
  if (desk) desk.dead = true; a.ov = null;
}
// Bene: plays his racket like a guitar and blasts the opponent with notes
function* superBene(S, a, v, d) {
  S.set(a, { frames: ['super_1|victory', 'super_2|victory_2'], every: 8 });
  const riff = [330, 392, 440, 392, 523, 494, 440, 392, 330, 392, 494, 659], cols = ['#ffd040', '#ff6ab0', '#6ae0ff', '#a0ff6a'];
  let landed = 0;
  for (let i = 0; i < riff.length; i++) {
    sfx('blip', riff[i]); sfx('blip', riff[i] * 2);
    const n = S.prop({ kind: 'note', x: a.x + d * 24, y: -66 + rnd(-6, 6), vx: d * 4.6, col: cols[i % 4], w0: rnd(0, 6) });
    n.base = n.y;
    n.update = q => {
      q.y = q.base + Math.sin(q.t * .3 + q.w0) * 6;
      if (d * (q.x - v.x) > -8) { q.dead = true; landed++; S.F.spark(v.x - d * 6, q.y, 'hit'); S.set(v, { pose: 'hit|idle_1', dx: d * (1 + landed % 2) }); }
    };
    yield* S.wait(7);
  }
  yield* S.until(() => landed >= riff.length, 120);
  sfx('ko'); flash(5, '#ffd040'); shake(9, 20);
  S.boom(v.x, S.chest(v), true);
  S.finish(d * 7.5, -7.5);
  yield* S.wait(30); a.ov = null;
}
// Carlottis: nurse uniform, a volley of syringes, the opponent collapses
function* superCarlottis(S, a, v, d) {
  const nurse = { fbTint: ['#ffffff', .32] }; // stand-in: Carlottis in white
  S.poof(a.x); yield* S.wait(6);
  S.set(a, { pose: 'super_1|idle_1', ...nurse }); S.say(a.x, -100, '¡TOCA VACUNA!'); yield* S.wait(32);
  const stuck = [];
  for (let i = 0; i < 5; i++) {
    S.set(a, { pose: 'super_2|special_2', ...nurse }); sfx('throw');
    const s = S.prop({ kind: 'syringe', x: a.x + d * 22, y: -30 - [3, 0, 4, 1, 2][i] * 9 + rnd(-3, 3), vx: d * 8.5 });
    s.update = q => {
      if (!q.stuck && d * (q.x - (v.x - d * 4)) > 0) { q.stuck = true; q.vx = 0; q.x = v.x - d * rnd(0, 8); q.rot = rnd(-.35, .35); stuck.push(q); sfx('chancla'); S.F.spark(q.x, q.y, 'hit'); S.set(v, { pose: 'hit|idle_1', dx: d * stuck.length }); }
    };
    yield* S.wait(6); S.set(a, { pose: 'super_1|idle_1', ...nurse }); yield* S.wait(5);
  }
  yield* S.until(() => stuck.length >= 5, 90);
  yield* S.wait(10);
  S.set(v, { pose: 'hit|idle_1', tint: ['#90ff90', .3], cy: 40, dx: d * 5 });
  for (let i = 0; i < 34; i++) { v.ov.rot = Math.sin(i * .35) * .18; yield; }
  for (const q of stuck) q.dead = true;
  S.finish(d * 2, -3);
  yield* S.wait(30); a.ov = null;
}
// Marcos: a giant Greek yogurt drops between them and he tips it onto the opponent
function* superMarcos(S, a, v, d) {
  yield* S.spread(170);
  const mid = a.x + d * clamp(Math.abs(v.x - a.x) * .45, 60, 140);
  const pot = S.prop({ kind: 'yogurt', x: mid, y: -280, g: .55, layer: 'back' });
  yield* S.until(() => pot.y >= 0, 90);
  pot.y = 0; pot.vy = 0; pot.g = 0; sfx('hitH'); sfx('fall'); shake(8, 18); S.F.dust(mid, 16);
  S.say(mid, -122, '¡YOGUR GRIEGO!');
  yield* S.wait(18);
  S.set(a, { pose: 'super_1|special_2' });
  const pushX = mid - d * 58;
  while (d * (pushX - a.x) > 1.5) { a.x += d * 2.5; yield; }
  pot.pivot = 36; // tips over its front bottom edge
  for (let i = 1; i <= 20; i++) { pot.rot = d * (Math.PI / 2) * easeIn(i / 20); yield; }
  sfx('fall'); shake(7, 16); S.F.dust(mid + d * 60, 12);
  if (spriteHas(a.def, 'prop_yogurt_2')) { pot.kind = 'yogurt_2'; pot.rot = 0; pot.pivot = 0; pot.x = mid + d * 100; }
  const startX = d * (mid + d * 150 - v.x) > 0 ? v.x - d * 24 : mid + d * 150;
  const spill = S.prop({ kind: 'spill', x: startX, w: 6 });
  while (d * (spill.x + d * spill.w - v.x) < 26) { spill.w += 5; yield; }
  S.set(v, { pose: 'hit|idle_1', tint: ['#ffffff', .65] });
  sfx('fizz'); yield* S.wait(16);
  S.finish(d * 3.5, -5);
  for (let i = 1; i <= 40; i++) { pot.alpha = spill.alpha = 1 - i / 40; yield; }
  pot.dead = spill.dead = true; a.ov = null;
}
// Oso: a giant judge's gavel, one blow
function* superOso(S, a, v, d) {
  const gav = spriteHas(a.def, 'super_1') ? null : S.prop({ kind: 'gavel', x: a.x + d * 4, y: -86, rot: -.12 * d });
  S.set(a, { pose: 'super_1|victory' }); S.say(a.x, -118, '¡ORDEN EN LA SALA!'); yield* S.wait(38);
  const target = v.x - d * 64;
  while (d * (target - a.x) > 1.5) { a.x += d * 4; if (gav) gav.x = a.x + d * 4; yield; }
  S.set(a, { pose: 'super_2|special_2' });
  if (gav) for (let i = 1; i <= 6; i++) { const k = i / 6; gav.rot = d * lerp(-.12, 1.72, k); gav.y = lerp(-86, -34, k); gav.x = a.x + d * lerp(4, 16, k); yield; }
  sfx('shock'); sfx('hitH'); shake(13, 26); flash(4, '#ffffff'); S.F.dust(v.x, 18);
  S.set(v, { pose: 'hit|idle_1', sq: 1 });
  for (let i = 1; i <= 5; i++) { v.ov.sq = lerp(1, .3, i / 5); yield; }
  S.say(v.x, -60, '¡CULPABLE!', '#ff5a5a'); yield* S.wait(36);
  S.finish(d * 2, -3);
  yield* S.wait(26); if (gav) gav.dead = true; a.ov = null;
}
// Casado: a tank rolls in, he climbs aboard and fires a missile
function* superCasado(S, a, v, d) {
  const tank = S.prop({ kind: 'tank', x: a.x - d * 360 });
  sfx('shock'); S.say(a.x, -100, '¡A SUS ÓRDENES!');
  const stop = a.x - d * 30;
  while (d * (stop - tank.x) > 2) { tank.x += d * Math.min(5, d * (stop - tank.x)); if (tank.t % 5 === 0) { shake(2, 4); S.F.dust(tank.x - d * 100, 2); } yield; }
  sfx('land'); shake(4, 8);
  S.set(a, { pose: 'super_1|jump_3' });
  for (let i = 1; i <= 16; i++) { a.ov.dy = -Math.sin(Math.PI * i / 16) * 60; a.ov.dx = -d * 30 * i / 16; yield; }
  S.set(a, { hidden: true }); tank.crew = true; yield* S.wait(22);
  S.say(tank.x, -128, '¡FUEGO!', '#ff5a5a');
  tank.kind = 'tank_2'; sfx('ko'); shake(9, 16); flash(2, '#fff4c0');
  const muzzle = tank.x + d * (spriteHas(a.def, 'prop_tank_2') ? 112 : 132);
  for (let i = 0; i < 10; i++) S.emit('smoke', muzzle, -66 + rnd(-6, 6), d * rnd(.5, 2), rnd(-.6, .2), 30);
  let hit = false;
  const m = S.prop({ kind: 'missile', x: muzzle, y: -66, vx: d * 4 });
  m.update = q => { q.vx += d * .45; if (q.t % 2 === 0) S.emit('smoke', q.x - d * 20, q.y + rnd(-2, 2), 0, -.2, 26); if (d * (q.x - v.x) > -8) { q.dead = true; hit = true; } };
  yield* S.until(() => hit, 120);
  flash(6, '#fff4c0'); shake(14, 30); sfx('shock'); sfx('hitH');
  for (let i = 0; i < 40; i++) S.emit('fire', v.x + rnd(-10, 10), S.chest(v) + rnd(-20, 20), rnd(-3, 3), rnd(-3.5, 1), rndi(20, 40));
  S.finish(d * 7, -9.5);
  yield* S.wait(36);
  tank.kind = 'tank'; tank.crew = false; S.poof(a.x); a.ov = null;
  for (let i = 1; i <= 30; i++) { tank.alpha = 1 - i / 30; tank.x -= d * 3; yield; }
  tank.dead = true;
}
// MadeverXP (Alberto): Poké Ball, Charizard comes out and breathes fire
function* superMadeverxp(S, a, v, d) {
  yield* S.spread(200);
  S.set(a, { pose: 'super_1|special_1' }); yield* S.wait(16);
  S.set(a, { pose: 'super_2|special_2' }); sfx('throw');
  const spot = a.x + d * 76; // Charizard comes out between them
  const x0 = a.x + d * 18, y0 = -62, T = 26, g = .26;
  const ball = S.prop({ kind: 'pokeball', x: x0, y: y0, vx: (spot - x0) / T, vy: (-6 - y0 - g * T * (T + 1) / 2) / T, g, va: .35 * d });
  yield* S.wait(T);
  ball.vx = ball.vy = ball.g = ball.va = 0; ball.y = -6; sfx('beep', 1500); yield* S.wait(12); sfx('beep', 1800); yield* S.wait(10);
  flash(5, '#ffffff'); sfx('item'); ball.dead = true;
  const zard = S.prop({ kind: 'charizard', x: spot, layer: 'back', scale: .1 });
  for (let i = 1; i <= 16; i++) { zard.scale = i / 16; yield; }
  sfx('shock'); shake(6, 20); S.say(spot, -122, '¡CHARIZARD!', '#ff8a30'); yield* S.wait(30);
  zard.kind = 'charizard_2';
  const mx = spot + d * 64, my = -106, tFly = Math.max(6, Math.abs(v.x - mx) / 7); // Charizard's mouth
  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < 2; j++) S.emit('fire', mx, my + rnd(-3, 3), d * rnd(6, 8), (S.chest(v) - my) / tFly + rnd(-.6, .6), rndi(22, 34));
    if (i % 6 === 0) sfx('smoke');
    if (i === 14) S.set(v, { pose: 'hit|idle_1', jitter: 2 });
    if (i > 14) v.ov.tint = ['#200800', Math.min(.75, (i - 14) / 40)];
    yield;
  }
  S.finish(d * 6, -8);
  yield* S.wait(26);
  for (let i = 1; i <= 16; i++) { zard.scale = 1 - i / 16; yield; }
  zard.dead = true; a.ov = null;
}
// Manu: Isaac appears, Manu climbs on top and Isaac cries tears at the opponent
function* superManu(S, a, v, d) {
  const ix = a.x - d * 30;
  S.poof(ix, -60);
  const isaac = S.prop({ kind: 'isaac', x: ix, layer: 'back', alpha: 0 });
  for (let i = 1; i <= 16; i++) { isaac.alpha = i / 16; yield; }
  S.say(ix, -122, '¡ISAAC!', '#7ab8f0');
  S.set(a, { pose: 'super_1|jump_3' });
  for (let i = 1; i <= 18; i++) { a.ov.dx = -d * 30 * i / 18; a.ov.dy = -104 * Math.sin(Math.PI / 2 * i / 18); yield; }
  S.set(a, { hidden: true }); isaac.rider = true; yield* S.wait(12);
  isaac.kind = 'isaac_2';
  let hits = 0;
  const N = 16, T = 28, g = .12;
  for (let i = 0; i < N; i++) {
    const x0 = ix + d * rnd(4, 16), y0 = -70, tx = v.x + rnd(-6, 6), ty = S.chest(v) + rnd(-14, 14); // from Isaac's eyes
    const tear = S.prop({ kind: 'tear', x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0 - g * T * (T + 1) / 2) / T, g });
    tear.update = q => {
      if (q.t < T) return;
      q.dead = true; hits++;
      for (let k = 0; k < 5; k++) S.emit('splash', q.x, q.y, rnd(-1.5, 1.5), rnd(-2.5, -.5), 16);
      if (hits === 1) S.set(v, { pose: 'hit|idle_1', jitter: 1 });
    };
    sfx('blip', 520 + rnd(-60, 60));
    yield* S.wait(5);
  }
  yield* S.until(() => hits >= N, 60);
  S.boom(v.x, S.chest(v), true);
  S.finish(d * 6, -7.5);
  yield* S.wait(26);
  for (let i = 1; i <= 20; i++) { isaac.alpha = 1 - i / 20; yield; }
  isaac.dead = true; a.ov = null;
}
