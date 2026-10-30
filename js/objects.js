'use strict';
// ============================================================
//  OBJECTS — the things the fighters throw (and, later, the floor items).
//  Balls are drawn as real shaded spheres: painted pixel by pixel (lit from the top-left, 3 tones, a highlight,
//  a dark outline) with their pattern on the sphere, for 16 spin angles, at 2x detail like the portraits.
//  The other objects come from the shared `objetos` atlas (tools/sprites.config.js, sheets O1 / O2 made from
//  docs/object-prompts.md); until it has them, code-drawn stand-ins are used.
// ============================================================
const OBJ_HD = 2;        // objects are painted at 2x detail: one sprite pixel = one screen pixel
const BALL_FRAMES = 16;  // spin angles per turn
const BALL_SHADOW = [34, 30, 62]; // shadow tones shift toward violet, like the hand-made palettes

// ---------- small 3D helpers ----------
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// rotate v by angle t around the unit axis k (Rodrigues)
function rot3(v, k, t) {
  const c = Math.cos(t), s = Math.sin(t), d = dot3(k, v) * (1 - c);
  return [v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s + k[0] * d, v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s + k[1] * d, v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s + k[2] * d];
}
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hash3 = p => { const h = Math.sin(p[0] * 127.1 + p[1] * 311.7 + p[2] * 74.7) * 43758.5453; return h - Math.floor(h); };

// the 12 pentagons of a football sit on an icosahedron's vertices, its 20 hexagons on the face centres
const ICO = (() => { const p = (1 + Math.sqrt(5)) / 2, v = []; for (const a of [-1, 1]) for (const b of [-p, p]) v.push([0, a, b], [a, b, 0], [b, 0, a]); return v.map(norm3); })();
const ICO_FACES = (() => {
  const f = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++)
    if (dot3(ICO[i], ICO[j]) > .4 && dot3(ICO[j], ICO[k]) > .4 && dot3(ICO[i], ICO[k]) > .4) f.push(norm3([ICO[i][0] + ICO[j][0] + ICO[k][0], ICO[i][1] + ICO[j][1] + ICO[k][1], ICO[i][2] + ICO[j][2] + ICO[k][2]]));
  return f;
})();
// a tennis ball's seam: the classic curve (a + b = 1 keeps it on the sphere)
const TENNIS_SEAM = (() => { const a = .7, b = .3, r = 2 * Math.sqrt(a * b), pts = []; for (let i = 0; i < 120; i++) { const t = i / 120 * Math.PI * 2; pts.push([a * Math.cos(t) + b * Math.cos(3 * t), a * Math.sin(t) - b * Math.sin(3 * t), r * Math.sin(2 * t)]); } return pts; })();
const nearest = (p, set) => { let m = -2; for (const v of set) { const d = dot3(p, v); if (d > m) m = d; } return m; };

// ---------- the balls ----------
// paint(p): base colour of the point p of the ball (unit vector in the ball's own frame, y down, z toward us)
// axis: the spin axis (mostly facing us, a bit tilted so the pattern rolls over the edge); gloss: highlight strength;
// still: one frame (no pattern to spin)
const BALLS = {
  football: {
    paint: p => {
      if (nearest(p, ICO) > .936) return [30, 28, 36];                                  // black pentagon
      let a = -2, b = -2; for (const v of ICO_FACES) { const d = dot3(p, v); if (d > a) { b = a; a = d; } else if (d > b) b = d; }
      return a - b < .028 ? [196, 196, 208] : [248, 248, 246];                         // seams between the white hexagons
    },
  },
  tennis: {
    paint: p => {
      if (nearest(p, TENNIS_SEAM) > .988) return [248, 250, 236];                        // the white seam
      const h = hash3([Math.round(p[0] * 9), Math.round(p[1] * 9), Math.round(p[2] * 9)]);
      return h < .3 ? [190, 214, 40] : h > .82 ? [228, 244, 96] : [210, 230, 58];       // fuzzy optic yellow
    },
    gloss: .3,
  },
  pokeball: {
    paint: p => {
      const front = p[2];
      if (front > .955) return [246, 246, 246];                                          // the button
      if (front > .915 || Math.abs(p[1]) < .1) return [28, 24, 32];                      // its ring and the band
      return p[1] < 0 ? [228, 44, 48] : [246, 246, 246];
    },
    gloss: .6,
  },
  tear: { paint: p => p[1] < -.35 ? [150, 206, 255] : [96, 168, 238], gloss: .8, still: true },
  bomb: { paint: () => [46, 44, 58], gloss: .45, still: true },
};
const _balls = new Map();
// the frames of a ball d units wide: [{ c, hd, ax, ay }] (centred), cached
function ballFrames(kind, d) {
  const key = kind + '|' + d; let fr = _balls.get(key); if (fr) return fr;
  const B = BALLS[kind], px = Math.round(d * OBJ_HD), R = px / 2, pad = OBJ_HD, size = px + pad * 2;
  const L = norm3([-.5, -.62, .6]), A = norm3(B.axis || [.22, .32, 1]), n = B.still ? 1 : BALL_FRAMES;
  fr = [];
  for (let i = 0; i < n; i++) {
    const ang = -i / BALL_FRAMES * Math.PI * 2, [c] = mk(size, size);
    pixels(c, (P, w) => {
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
        const nx = (x + .5 - R) / R, ny = (y + .5 - R) / R, q = nx * nx + ny * ny; if (q > 1) continue;
        const N = [nx, ny, Math.sqrt(1 - q)], lam = dot3(N, L);
        let col = B.paint(rot3(N, A, ang));
        col = lam > .62 ? col : lam > .12 ? mix3(col, BALL_SHADOW, .3) : mix3(col, BALL_SHADOW, .56);
        if (lam > .945) col = mix3(col, [255, 255, 255], B.gloss == null ? .5 : B.gloss);
        const o = ((y + pad) * w + x + pad) * 4; P[o] = col[0]; P[o + 1] = col[1]; P[o + 2] = col[2]; P[o + 3] = 255;
      }
    });
    objOutline(c, OBJ_HD);
    fr.push({ c, hd: OBJ_HD, ax: size / 2, ay: size / 2 });
  }
  _balls.set(key, fr); return fr;
}
// a ball centred at (x, y), spun to angle a (radians; it grows clockwise, as a ball rolling to the right)
function drawBall(g, kind, x, y, d, a = 0, img) {
  const fr = ballFrames(kind, d), n = fr.length, i = ((Math.round(a / (Math.PI * 2) * BALL_FRAMES) % n) + n) % n;
  drawSpr(g, fr[i], x, y, 1, img);
}

// dark outline t px thick around a canvas's opaque pixels (rounded corners)
function objOutline(c, t = 1) {
  const O = rgb(OUTL);
  pixels(c, (P, w, h) => {
    const a = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) a[i] = P[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (a[y * w + x]) continue;
      let near = false;
      for (let dy = -t; dy <= t && !near; dy++) for (let dx = -t; dx <= t && !near; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > t + (t > 1 ? 1 : 0)) continue;
        const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && a[yy * w + xx]) near = true;
      }
      if (near) { const o = (y * w + x) * 4; P[o] = O[0]; P[o + 1] = O[1]; P[o + 2] = O[2]; P[o + 3] = 255; }
    }
  });
}

// ---------- objects from the atlas (or their stand-ins) ----------
// the cut drawing `name` of the shared objects atlas, centred, or null when the atlas doesn't have it
function objFrame(name) {
  const set = typeof SPRITES !== 'undefined' && SPRITES.objetos; if (!set || !set.meta.frames[name]) return null;
  let s = set.cache.get(name); if (s) return s;
  const f = set.meta.frames[name], [c, g] = mk(f.w, f.h); g.drawImage(set.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  s = { c, hd: f.hd || 1, ax: f.w / 2, ay: f.h / 2 }; set.cache.set(name, s); return s;
}
// code-drawn stand-ins, painted at 2x detail on a w x h unit grid: cell(x, y) gets the centre of each pixel in units
// and returns a colour or null. Each returns a centred sprite with the dark outline added.
function standIn(w, h, cell) {
  const k = OBJ_HD, [c] = mk(w * k + 2 * k, h * k + 2 * k);
  pixels(c, (P, cw) => {
    for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++) {
      const col = cell((x + .5) / k, (y + .5) / k); if (!col) continue;
      const v = rgb(col), o = ((y + k) * cw + x + k) * 4; P[o] = v[0]; P[o + 1] = v[1]; P[o + 2] = v[2]; P[o + 3] = 255;
    }
  });
  objOutline(c, k);
  return { c, hd: k, ax: c.width / 2, ay: c.height / 2 };
}
const OBJ_STANDIN = {
  // Álvaro's white cap, side view facing right: round crown lit from the top-left, panel seam, button, band, visor
  cap: () => standIn(18, 10, (x, y) => {
    const cx = 6.6, cy = 8.6, rx = 6.4, ry = 7.8, ex = (x - cx) / rx, ey = (y - cy) / ry;
    if (ex * ex + ey * ey <= 1 && y <= 8.6) {
      if (Math.hypot(x - 6.2, y - 1.1) < .9) return '#9ca0b0';                                // button
      if (y > 7.6) return x < 2.4 ? '#6a6e7e' : '#a2a6b8';                                   // band, strap gap at the back
      if (Math.abs(x - (6.4 + 3.6 * Math.pow(Math.max(0, y - 1) / 7, 1.4))) < .32) return '#c9cdd9'; // panel seam
      const lam = -ex * .6 - ey * .8;
      return lam > .45 ? '#ffffff' : lam > -.05 ? '#e6e9f1' : '#bcc0ce';
    }
    const top = 7.5 + Math.pow(Math.max(0, x - 10.5) / 7, 2) * 1.3;                           // visor, curving down
    if (x >= 10.5 && x <= 17.6 && y >= top && y <= top + 1.5) return y > top + .9 ? '#7c8094' : '#eef0f6';
    return null;
  }),
  // Carlottis's brown leather sandal seen from above: the sole (narrower at the heel) and two straps across
  sandal: () => standIn(16, 7, (x, y) => {
    const ry = lerp(2.5, 3.3, clamp((x - 2) / 8, 0, 1)), e = ((x - 8) / 7.7) ** 2 + ((y - 3.5) / ry) ** 2;
    const strap = (x >= 4.3 && x <= 5.9) || (x >= 10.2 && x <= 11.9);
    if (strap && Math.abs(y - 3.5) <= ry + .5) return y < 3.5 - ry + .9 ? '#9a6034' : '#6e3e20';
    if (e > 1) return null;
    if (e > .78) return '#8a5a32';                                                            // rim
    return x > 12.8 && Math.abs(y - 3.5) < 1.6 ? '#b07842' : y < 3 ? '#cc965e' : '#bc864e';  // footbed, toe print
  }),
};
const _objFr = new Map();
// the frames of object `name` for its kind of motion: 'flip' (spun like a frisbee: side, edge-on, mirrored, edge-on),
// 'rot90' (tumbling end over end, 4 quarter turns) or one frame. From the atlas (obj_<name>) or the stand-in.
function objFrames(name, motion) {
  const key = name + '|' + (motion || ''); let fr = _objFr.get(key); if (fr) return fr;
  const base = objFrame('obj_' + name) || (OBJ_STANDIN[name] && OBJ_STANDIN[name]());
  if (!base) return [];
  const W0 = base.c.width, H0 = base.c.height, k = base.hd || 1;
  const xf = (w, h, fn) => { const [c, g] = mk(w, h); fn(g); return { c, hd: k, ax: w / 2, ay: h / 2 }; };
  if (motion === 'flip') {
    const edge = xf(Math.max(2, Math.round(W0 * .45)), H0, g => g.drawImage(base.c, 0, 0, Math.max(2, Math.round(W0 * .45)), H0));
    fr = [base, edge, xf(W0, H0, g => { g.translate(W0, 0); g.scale(-1, 1); g.drawImage(base.c, 0, 0); }), edge];
  } else if (motion === 'rot90') {
    fr = [0, 1, 2, 3].map(q => q === 0 ? base : xf(q % 2 ? H0 : W0, q % 2 ? W0 : H0, g => { g.translate(q % 2 ? H0 / 2 : W0 / 2, q % 2 ? W0 / 2 : H0 / 2); g.rotate(q * Math.PI / 2); g.drawImage(base.c, -W0 / 2, -H0 / 2); }));
  } else fr = [base];
  _objFr.set(key, fr); return fr;
}

// ---------- the flying cat (MadeverXP's special): two drawings, legs stretched / tucked ----------
// from the atlas (obj_cat_1, obj_cat_2) or drawn in code, facing right
const _cat = [];
function catFrames() {
  if (_cat.length) return _cat;
  for (const fr of [0, 1]) {
    const a = objFrame('obj_cat_' + (fr + 1)); if (a) { _cat.push(a); continue; }
    const k = 1.3, [c, g] = mk(36, 20), X = v => 18 + v * k, Y = v => 11 + v * k;
    for (const [col, e] of [[OUTL, 2], ['#24212c', 0]]) {
      seg(g, pt(X(-6), Y(0)), pt(X(4), Y(0)), 7 * k + e, col);                                   // body
      stamp(g, X(7), Y(-2), 7 * k + e, col);                                                       // head
      seg(g, pt(X(5), Y(-4)), pt(X(5), Y(-8)), 2 * k + e, col); seg(g, pt(X(9), Y(-4)), pt(X(9.5), Y(-8)), 2 * k + e, col); // ears
      seg(g, pt(X(-6), Y(-1)), pt(X(-11), Y(-6 + fr * 2)), 2 * k + e, col);                         // tail
      seg(g, pt(X(3), Y(2)), pt(X(9), Y(4 - fr * 2)), 2 * k + e, col);                              // front legs
      seg(g, pt(X(-4), Y(2)), pt(X(-10), Y(3 + fr * 2)), 2 * k + e, col);                           // back legs
    }
    g.fillStyle = '#3c3848'; g.fillRect(Math.round(X(-4)), Math.round(Y(-3)), 8, 1);              // fur highlight
    g.fillStyle = '#a8f060'; g.fillRect(Math.round(X(6)), Math.round(Y(-3)), 2, 1); g.fillRect(Math.round(X(9)), Math.round(Y(-3)), 1, 1); // eyes
    g.fillStyle = '#e88aa0'; g.fillRect(Math.round(X(8.5)), Math.round(Y(-1)), 1, 1);              // nose
    _cat.push({ c, ax: 18, ay: 11 });
  }
  return _cat;
}

// ---------- shadow under a flying object ----------
// h: the object's y (0 = on the floor, negative = up); w: its width
function objShadow(g, x, h, w) {
  const k = clamp(1 + h / 110, .35, 1);
  shadow(g, x, GROUND, Math.max(4, w * k), .32 * k);
}
