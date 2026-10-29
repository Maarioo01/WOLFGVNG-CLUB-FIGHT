'use strict';
// ============================================================
//  STAGES — the four real places: Marcos's attic, Bene's pool and garden, the Castilla-La Mancha bridge.
//  A stage is a background strip (assets/stages/<art>.png, cut by tools/build_stages.py from the art in
//  images/fondos/), a perspective floor drawn in code below it, and a crowd: the fighters who aren't fighting,
//  at half size, reacting to the fight. Same interface as the old street stages (world.js): update, react,
//  drawBack, drawCrowd, drawFront, plus cast(ids) to pick the crowd. The list of stages is STAGES (story.js).
// ============================================================
const STAGE_IMG = {};          // art id -> Image (loadStages, before the title screen)
const BACK_F = 0.55;           // strip parallax = floorF(HORIZON), so its bottom row moves with the floor's far edge
const STRIP_H = 162;           // strip height: the 150 rows above the floor line + 12 for screen shakes
const FLOOR_PAD = 16;          // the floor is drawn this much wider on each side, and 12 rows below the screen (shakes)
const CROWD_SLOTS = [-300, -180, -60, 60, 180, 300]; // spectators' world x around the arena centre (left half supports J1)
const CROWD_ROWS = [154, 157]; // their feet, alternating, just in front of the strip
const CROWD_ANIM = { idle: 'crowdIdle', cheer: 'crowdCheer', shock: 'crowdShock', sad: 'crowdSad' }; // sprites.js

function loadStages() {
  const img = (src, tries = 3) => new Promise(res => {
    const im = new Image(); im.onload = () => res(im);
    im.onerror = () => tries > 1 ? setTimeout(() => img(src, tries - 1).then(res), 400) : res(null);
    im.src = src;
  });
  return Promise.all(STAGES.filter(st => st.art).map(st => img('assets/stages/' + st.art + '.png').then(im => { if (im) STAGE_IMG[st.art] = im; })));
}
// the strip, or a plain stand-in if its file is missing (a warning, not an error: the game keeps working)
function stripOf(st) {
  if (STAGE_IMG[st.art]) return STAGE_IMG[st.art];
  console.warn('missing stage background: assets/stages/' + st.art + '.png (python3 tools/build_stages.py)');
  const [c, g] = mk(560, STRIP_H); g.fillStyle = st.haze || '#2a2438'; g.fillRect(0, 0, 560, STRIP_H);
  tiny(g, 'FALTA EL FONDO', 280 - tinyW('FALTA EL FONDO') / 2, 110, '#fff');
  return c;
}

// ---------- perspective floor ----------
// texture rows at depth 1/floorF(y), texture x = world x + 400 (as buildFloor in world.js), 12 extra rows below the screen.
// st.floor: { style: 'planks' | 'tiles' | 'lawn' | 'field', cols: [main, second, seam / detail], edge, decals: [{ x: [wx0, wx1], d: [d0, d1], col, rim }] }
// (depth d: 1.82 at the floor line, 1.65 at the crowd, 1 at the fighters' feet)
function buildGround(st) {
  const F = st.floor, TW = WORLD_W + 800, TH = H - HORIZON + 12, [c] = mk(TW, TH);
  const C = F.cols.map(rgb), HZ = rgb(st.haze), ED = F.edge && rgb(F.edge), seed = st.seed || 7;
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263 + seed * 1013904223) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const shade = (col, v) => [col[0] + v, col[1] + v, col[2] + v];
  pixels(c, (p, w, h) => {
    for (let r = 0; r < h; r++) {
      const y = HORIZON + r, f = floorF(y + .5), depth = 1 / f, line = 1 / f; // a seam stays ~1 screen px wide at every depth
      const fog = Math.max(0, 1 - r / 30) * .45;
      for (let u = 0; u < w; u++) {
        const wx = u - 400; let col;
        if (F.style === 'planks') { // boards running left-right, staggered end joints, grain streaks
          const row = Math.floor(depth / .06), seam = Math.floor(1 / floorF(y - .5) / .06) !== row;
          const off = hash(row, 1) * 96, m = ((wx + off) % 96 + 96) % 96, board = Math.floor((wx + off) / 96);
          col = shade(hash(board, row) < .5 ? C[0] : C[1], (hash(board, row * 3) - .5) * 14);
          if (hash(Math.floor(wx / 3), row * 7 + Math.floor(depth * 90)) < .2) col = shade(col, -10);
          if (seam || m < line) col = C[2];
        } else if (F.style === 'tiles') { // square terracotta tiles with light grout
          const row = Math.floor(depth / .12), seam = Math.floor(1 / floorF(y - .5) / .12) !== row;
          const m = ((wx % 22) + 22) % 22, tile = Math.floor(wx / 22);
          col = shade(hash(tile, row) < .5 ? C[0] : C[1], (hash(tile, row * 5) - .5) * 12);
          if (hash(u, r * 7) < .05) col = shade(col, -12);
          if (seam || m < line) col = C[2];
        } else if (F.style === 'lawn') { // mowing stripes (they converge in perspective) and blades
          col = Math.floor(wx / 48) % 2 ? C[0] : C[1];
          const n = hash(u, r * 7); if (n < .16) col = C[2]; else if (n > .95) col = shade(col, 16);
        } else { // 'field': grass with dry patches and weeds
          const patch = hash(Math.floor(wx / 26), Math.floor(depth / .09));
          col = patch < .55 ? C[0] : patch < .8 ? C[1] : C[2];
          const n = hash(u, r * 7); if (n < .12) col = shade(col, -16); else if (n > .93) col = shade(col, 14);
        }
        for (const d of F.decals || []) if (wx >= d.x[0] && wx < d.x[1] && depth >= d.d[0] && depth < d.d[1]) {
          const rim = d.rim && (wx - d.x[0] < 3 * line || d.x[1] - wx < 3 * line || depth - d.d[0] < .012 || d.d[1] - depth < .012);
          col = rgb(rim ? d.rim : d.col); if (hash(u, r * 3) < .08) col = shade(col, -10);
        }
        if (ED && r < 3) col = r === 2 ? shade(ED, -40) : ED; // stone edge along the floor line (the pool)
        else if (r < 2) col = shade(col, -30); // contact shadow where the background meets the floor
        const o = (r * w + u) * 4;
        p[o] = lerp(col[0], HZ[0], fog); p[o + 1] = lerp(col[1], HZ[1], fog); p[o + 2] = lerp(col[2], HZ[2], fog); p[o + 3] = 255;
      }
    }
  });
  return c;
}
function drawFloorPad(g, tex, camX) {
  for (let r = 0; r < tex.height; r++) {
    const y = HORIZON + r, f = floorF(y + .5), sw = (W + FLOOR_PAD * 2) / f, sx = camX + W / 2 - sw / 2 + 400;
    g.drawImage(tex, sx, r, sw, 1, -FLOOR_PAD, y, W + FLOOR_PAD * 2, 1);
  }
}
// half size: one art pixel = one canvas pixel (RES 2); anchors rounded so the pixels land on whole canvas pixels
function drawHalf(g, s, x, y, facing, img) {
  const im = img || s.c, k = (s.hd ? 1 / s.hd : (s.sc || 1)) * .5, w = im.width * k, h = im.height * k;
  const X = Math.round(x * RES) / RES, Y = Math.round(y * RES) / RES, ax = Math.round(s.ax) * k, ay = Math.round(s.ay) * k;
  if (facing >= 0) g.drawImage(im, X - ax, Y - ay, w, h);
  else { g.save(); g.translate(X, 0); g.scale(-1, 1); g.drawImage(im, -ax, Y - ay, w, h); g.restore(); }
}

// ---------- the stage ----------
// st: a STAGES entry with `art` (story.js); o.center: world x of the arena centre (ARENA_C)
function buildPhotoStage(st, o = {}) {
  const S = { st, C: o.center || 620, t: 0, back: stripOf(st), floor: buildGround(st), crowd: [], castKey: null };
  return Object.assign(S, PhotoStageProto);
}
const PhotoStageProto = {
  // the crowd: up to st.crowd (6) fighters who aren't in `ids`, the host (st.host) in the middle when free.
  // The same people stay while the fighters are the same; fresh = start everyone calm again (a new fight)
  cast(ids, fresh) {
    const key = [...ids].sort().join('|');
    if (key !== this.castKey) {
      this.castKey = key; fresh = true;
      const free = ROSTER.filter(id => !ids.includes(id)), host = free.includes(this.st.host) ? this.st.host : null;
      const others = free.filter(id => id !== host);
      for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
      const slots = this.st.slots || CROWD_SLOTS, n = Math.min(slots.length, this.st.crowd || 6);
      const near = slots.map((x, i) => i).sort((a, b) => Math.abs(slots[a]) - Math.abs(slots[b])).slice(0, n); // centre slots first
      this.crowd = (host ? [host] : []).concat(others).slice(0, n).map((id, k) => {
        const i = near[k], x = slots[i];
        return { id, def: CH[id], wx: this.C + x + rndi(-8, 8), y: CROWD_ROWS[i % 2], side: x < 0 ? 0 : 1, face: x < 0 ? 1 : -1, t0: rndi(0, 200) };
      }).sort((a, b) => a.y - b.y);
    }
    if (fresh) for (const c of this.crowd) Object.assign(c, { mood: 'idle', moodT: 0, since: this.t, away: false, lookT: rndi(60, 400) });
  },
  // a new mood replaces the current one; the same mood only lasts longer
  mood(c, m, t) {
    if (c.mood === m) c.moodT = Math.max(c.moodT, t); else { c.mood = m; c.moodT = t; c.since = this.t; }
    c.away = false;
  },
  update() {
    this.t++;
    for (const c of this.crowd) {
      if (c.mood !== 'idle') { if (--c.moodT <= 0) { c.mood = 'idle'; c.since = this.t; } }
      else if (--c.lookT <= 0) { c.away = !c.away; c.lookT = c.away ? rndi(40, 110) : rndi(150, 450); } // now and then they look around
    }
  },
  // kind: 'hit' (a landed hit), 'super', 'ko', 'round' (o = Fight.result), 'match', 'start' (¡PELEA!).
  // side: the fighter it's good news for (0 = J1, 1 = J2; -1 = nobody, e.g. a draw). Fans support that side.
  react(kind, wx, side = -1, o = {}) {
    for (const c of this.crowd) {
      const fan = c.side === side;
      if (kind === 'hit') {
        if (fan) { if ((c.mood === 'idle' || c.mood === 'cheer') && Math.random() < .45) this.mood(c, 'cheer', rndi(35, 60)); }
        else if (c.mood === 'idle' && Math.random() < .15) this.mood(c, 'shock', 24);
      }
      else if (kind === 'super') this.mood(c, 'shock', 96);
      else if (kind === 'ko') this.mood(c, fan ? 'cheer' : 'shock', fan ? 200 : 90);
      else if (kind === 'round') this.mood(c, side < 0 ? 'shock' : fan || o.perfect ? 'cheer' : 'sad', side < 0 ? 60 : 170);
      else if (kind === 'match') this.mood(c, fan ? 'cheer' : 'sad', fan ? Infinity : 240);
      else if (kind === 'start' && c.mood === 'idle') this.mood(c, 'cheer', 30);
    }
    if (kind === 'super') sfx('ooh');
    if (kind === 'match') sfx('crowd');
  },
  drawBack(g, camX) {
    const bx = Math.round(W / 2 + (this.C - camX - W / 2) * BACK_F - this.back.width / 2), by = HORIZON - STRIP_H, glow = this.st.glow || [];
    g.drawImage(this.back, bx, by);
    if (glow.length) { // lamps: a glow on the strip, and a pool of light on the floor below
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55;
      for (const l of glow) { const r = l.r || 18; g.drawImage(glowSprite(r, l.col || '#ffc870', .7), bx + l.x - r, by + l.y - r); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    drawFloorPad(g, this.floor, camX);
    if (glow.length) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .22;
      for (const l of glow) g.drawImage(glowSprite(30, l.col || '#ffb860', .8), bx + l.x - 30, HORIZON + 2, 60, 18);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  },
  drawCrowd(g, camX) {
    const tint = this.st.crowdTint;
    for (const c of this.crowd) {
      const sx = projX(c.wx, floorF(c.y), camX); if (sx < -30 || sx > W + 30) continue;
      if (sx < W / 2 - 12) c.face = 1; else if (sx > W / 2 + 12) c.face = -1; // towards the fight
      const sad = c.mood === 'sad' && this.t - c.since > 50; // after the flinch, they turn away
      const spr = getSprite(c.def, sad ? CROWD_ANIM.idle : CROWD_ANIM[c.mood], this.t + c.t0);
      shadow(g, sx, c.y, 14, .25);
      drawHalf(g, spr, sx, c.y, c.away || sad ? -c.face : c.face, tint ? tintedOf(spr, tint[0], tint[1]) : null);
    }
  },
  drawFront(g) {
    if (this.st.night) g.drawImage(vignette(), 0, 0);
  },
};
