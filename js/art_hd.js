'use strict';
// ============================================================
//  ART HD — detailed renderer used by every fighter (def.hd)
//  Same skeleton & animations as art.js, painted with 2x the pixels.
//  Heads are parametric: designed on a 48px reference and drawn HEAD_F bigger,
//  so faces get more pixels while bodies keep their size.
//
//  Character options (see CH in art.js):
//    face:   fem, face {nose, chin, jaw}, eyeCol, browCol, browTh, smile, blush, fringe
//    hair:   hairStyle buzz|messy|curlyTop|curlyLong|braid|quiff|sidePart|cap, hair, hair2 (highlights), cap
//    beard:  trim|goatee|light|chin, beardCol
//    extras: glasses round|rect (+glassesCol), sunHead, earrings small|big (+earCol), neck chain|pendant|choker|goldChain
//    body:   top bare|tee|tank|crop|hoodie|openShirt|suit, shirt, vstripes, jacket, necktie, tucked, cropCol
//            bottom shorts|pants|skirt, pants, fit baggy|slim|tight, jeans, crease, belt, shortsLen, shortsStripe, shortsLogo, skirt, skirtLen
//            shoe barefoot|sneaker|dress|sandal, shoes, sole, shoeAccent, socks, weapon racket
// ============================================================
const HDK = 2;
const LIGHT = { x: 0.55, y: -0.83 }; // light comes from the front-top (sprites face right)
const HEAD_F = 1.22;                 // head scale vs. the 48px reference design
const HEAD_OY = 5;                   // room above the skull for hair volume (reference px)

function hdTones(c) { return { b: c, d: dk(c, .78), dd: dk(c, .6), l: lt(c, .2) }; }
function fabric(c) { return { b: c, d: dk(c, .8), dd: dk(c, .64), l: lt(c, .12) }; }
function farTones(t) { return { b: dk(t.b, .82), d: dk(t.d, .82), dd: dk(t.dd, .85), l: dk(t.l, .85) }; }
function litSide(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, p = { x: -dy / L, y: dx / L };
  return p.x * LIGHT.x + p.y * LIGHT.y >= 0 ? p : { x: -p.x, y: -p.y };
}
const unit = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return { x: dx / L, y: dy / L }; };
// capsule with tapering diameter (d0 -> d1) and optional bulge in the middle
function tcap(g, a, b, d0, d1, col, bulge = 0, off = null) {
  const len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(len / 0.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n, d = lerp(d0, d1, t) + bulge * Math.sin(Math.PI * t);
    stamp(g, a.x + (b.x - a.x) * t + (off ? off.x : 0), a.y + (b.y - a.y) * t + (off ? off.y : 0), d, col);
  }
}
// limb made of segments {a, b, d0, d1, bulge}: one outline pass, then shadow / base / highlight
function hdLimb(g, segs, tone) {
  for (const s of segs) tcap(g, s.a, s.b, s.d0 + 2, s.d1 + 2, OUTL, s.bulge || 0);
  for (const s of segs) {
    const L = litSide(s.a, s.b), avg = (s.d0 + s.d1) / 2, bl = s.bulge || 0;
    tcap(g, s.a, s.b, s.d0, s.d1, tone.d, bl);
    tcap(g, s.a, s.b, s.d0 * .66, s.d1 * .66, tone.b, bl * .66, { x: L.x * avg * .15, y: L.y * avg * .15 });
    tcap(g, plerp(s.a, s.b, .12), plerp(s.a, s.b, .85), Math.max(1, avg * .16), Math.max(1, avg * .12), tone.l, bl * .15, { x: L.x * avg * .3, y: L.y * avg * .3 });
  }
}
function px1(g, p, col, w = 1, h = 1) { g.fillStyle = col; g.fillRect(Math.round(p.x), Math.round(p.y), w, h); }
function line1(g, a, b, col) { seg(g, a, b, 1, col); }
function inPoly(x, y, P) {
  let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i], b = P[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  } return c;
}
const pw = (P, x) => { if (x <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (x <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (x - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return P[P.length - 1][1]; };
// distance from a point to a polyline
function distPoly(x, y, P) {
  let m = 1e9; for (let i = 1; i < P.length; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1), qx = ax + dx * t - x, qy = ay + dy * t - y; m = Math.min(m, qx * qx + qy * qy);
  } return Math.sqrt(m);
}

// ============================================================
//  BODY
// ============================================================
function renderPoseHD(def, p, expr) {
  const K = HDK, [c, g] = mk(SPR_W * K, SPR_H * K);
  const k0 = skel(def, p), oy = AY + p.hipY;
  const k = {}; for (const key in k0) { const v = k0[key]; k[key] = (v && v.x !== undefined && key !== 'u' && key !== 'n') ? pt((v.x + AX) * K, (v.y + oy) * K) : v; }
  const b = def.b, s = b.s, u = k.u, n = k.n, hip = k.hip, T = k.T, hw = b.hw / 2, sw = b.sw / 2;
  const Q = (uk, nk) => pt(hip.x + (u.x * uk + n.x * nk) * K, hip.y + (u.y * uk + n.y * nk) * K);
  const fem = !!def.fem, top = def.top || 'tee', bot = def.bottom || 'pants';
  const skin = hdTones(def.skin), skinF = farTones(skin);
  const shirtT = fabric(def.shirt || '#888888'), jackT = fabric(def.jacket || def.shirt || '#888888'), pantT = fabric(def.pants || '#333333');
  const sleeve = top === 'hoodie' || top === 'suit' ? 'long' : top === 'tee' || top === 'openShirt' ? 'short' : 'none';
  const sleeveT = top === 'openShirt' || top === 'suit' ? jackT : shirtT;
  const muscle = top === 'bare';

  // ---- arms
  function arm(sh, el, ha, isFar, htype) {
    const tone = isFar ? skinF : skin, dir = unit(el, ha);
    const upD = (b.uw + .6) * K, foD = (b.fw + .3) * K;
    if (sleeve === 'long') {
      const st = isFar ? farTones(sleeveT) : sleeveT, ex = top === 'hoodie' ? 3 : 1.6, wr = padd(ha, dir, -2.5);
      hand(ha, el, htype, tone);
      hdLimb(g, [{ a: sh, b: el, d0: upD + ex * 1.3, d1: foD + ex, bulge: .6 }, { a: el, b: wr, d0: foD + ex, d1: foD + ex - (top === 'hoodie' ? 0 : 1) }], st);
      const cf = padd(wr, dir, -1.8), q = { x: -dir.y, y: dir.x }, cw = (foD + ex) / 2;
      if (top === 'hoodie') { for (let i = -2; i <= 2; i++) line1(g, padd(padd(cf, q, i * cw * .35), dir, -1.5), padd(padd(cf, q, i * cw * .35), dir, 1.5), st.d); }
      else { tcap(g, padd(wr, dir, .5), padd(wr, dir, 2.2), foD - 1, foD - 2, OUTL); tcap(g, padd(wr, dir, .8), padd(wr, dir, 2), foD - 3, foD - 4, isFar ? '#c8c8c0' : '#f2f2ee'); }
      const ef = padd(el, litSide(sh, el), -(upD / 2 - 2)); line1(g, ef, padd(ef, unit(sh, el), -4), st.dd); // elbow fold
      return;
    }
    hdLimb(g, [
      { a: sh, b: el, d0: upD - (fem ? 2 : 0), d1: foD - 1 - (fem ? 1 : 0), bulge: muscle ? 2 : fem ? .4 : 1 },
      { a: el, b: ha, d0: foD - (fem ? 1 : 0), d1: (b.fw - 1.4) * K, bulge: muscle ? 1.2 : .6 },
    ], tone);
    if (muscle && !isFar) { const L = litSide(sh, el), dc = plerp(sh, el, .12); stamp(g, dc.x + L.x, dc.y + L.y, upD * .55, lt(skin.b, .1)); }
    if (sleeve === 'short') {
      const st = isFar ? farTones(sleeveT) : sleeveT, m = plerp(sh, el, top === 'openShirt' ? .6 : .46), L = litSide(sh, el), sd = upD + (top === 'openShirt' ? 3 : 2);
      tcap(g, plerp(sh, el, -.06), m, sd + 2, sd + 2.5, OUTL); tcap(g, plerp(sh, el, -.06), m, sd, sd + .5, st.d);
      tcap(g, plerp(sh, el, -.03), plerp(sh, el, .4), sd - 3, sd - 2.5, st.b, 0, { x: L.x * 1.5, y: L.y * 1.5 });
      const q = { x: -unit(sh, el).y, y: unit(sh, el).x }, hm = plerp(sh, el, top === 'openShirt' ? .56 : .42);
      line1(g, padd(hm, q, -sd / 2), padd(hm, q, sd / 2), st.dd);
      if (def.vstripes) { const vc = isFar ? dk(def.vstripes, .8) : def.vstripes; for (const o of [-3, 1]) line1(g, padd(plerp(sh, el, .02), q, o), padd(hm, q, o), vc); }
    }
    hand(ha, el, htype, tone);
  }
  // fist: rounded block along the forearm with knuckles, finger creases and a thumb on top
  function hand(h, el, type, tone) {
    if (type === 'hide') return;
    const fs = (b.fist + .6) * K, d = unit(el, h);
    const q = { x: -d.y, y: d.x }, up = q.y <= 0 ? q : { x: -q.x, y: -q.y }, lit = litSide(el, h);
    if (type === 'open') {
      const a = padd(h, d, -1), e = padd(h, d, fs * .75);
      tcap(g, a, e, fs * .8 + 2, fs * .55 + 2, OUTL); tcap(g, a, e, fs * .8, fs * .55, tone.d);
      tcap(g, a, e, fs * .5, fs * .35, tone.b, 0, { x: lit.x * 1.5, y: lit.y * 1.5 });
      for (const o of [-.18, .05, .28]) line1(g, padd(padd(e, d, -fs * .28), up, fs * o), padd(padd(e, d, fs * .12), up, fs * o), tone.d);
      const th = padd(padd(h, d, fs * .15), up, fs * .45); tcap(g, th, padd(th, d, fs * .3), 5, 4, OUTL); tcap(g, th, padd(th, d, fs * .3), 3, 2, tone.b);
      return;
    }
    const a = padd(h, d, -fs * .05), e = padd(h, d, fs * .42);
    tcap(g, a, e, fs + 2, fs + 1, OUTL);
    tcap(g, a, e, fs, fs - 1, tone.d);
    tcap(g, a, e, fs * .68, fs * .62, tone.b, 0, { x: lit.x * fs * .12, y: lit.y * fs * .12 });
    const kn = padd(e, d, fs * .38);
    for (const o of [-.3, -.1, .1, .3]) px1(g, padd(kn, up, fs * o), tone.l);
    for (const o of [-.2, 0, .2]) line1(g, padd(padd(e, d, fs * .1), up, fs * o), padd(padd(e, d, fs * .34), up, fs * o), tone.dd);
    const t0 = padd(padd(h, d, fs * .05), up, fs * .42), t1 = padd(padd(e, d, fs * .15), up, fs * .3);
    tcap(g, t0, t1, 6, 5, OUTL); tcap(g, t0, t1, 4, 3, tone.b); px1(g, t1, tone.dd);
  }
  // ---- legs
  function leg(hp, kn, an, ft, isFar) {
    if (bot === 'pants') { pantsLeg(hp, kn, an, isFar); foot(an, ft, isFar); return; }
    const sk = isFar ? skinF : skin;
    hdLimb(g, [
      { a: hp, b: kn, d0: (b.tw + 1) * K, d1: (b.tw - 1.2) * K, bulge: fem ? 2 : 1.5 },
      { a: kn, b: an, d0: (b.shw + .5) * K, d1: (b.shw - 2) * K, bulge: fem ? 2.2 : 3 },
    ], sk);
    const kh = plerp(kn, an, .06); px1(g, padd(kh, litSide(kn, an), 2), sk.l, 2, 1);
    if (def.socks) sock(kn, an, isFar);
    if (bot === 'shorts') shortsLeg(hp, kn, isFar);
    foot(an, ft, isFar);
  }
  function sock(kn, an, isFar) {
    const sc = isFar ? dk(def.socks, .8) : def.socks, a = plerp(kn, an, .74), d0 = (b.shw - 1.4) * K;
    tcap(g, a, an, d0 + 2, d0 + 1, OUTL); tcap(g, a, an, d0, d0 - 1, sc);
    const q = { x: -unit(kn, an).y, y: unit(kn, an).x }; line1(g, padd(a, q, -d0 / 2 + 1), padd(a, q, d0 / 2 - 1), dk(sc, .8));
  }
  function pantsLeg(hp, kn, an, isFar) {
    const tone = isFar ? farTones(pantT) : pantT, baggy = def.fit === 'baggy', dir2 = unit(kn, an);
    const d0 = (b.tw + (baggy ? 2.4 : 1.3)) * K, d1 = (b.tw + (baggy ? .6 : -.6)) * K, d2 = (b.shw + (baggy ? 2.4 : .6)) * K;
    const cuff = padd(an, dir2, baggy ? 3 : 1.5);
    hdLimb(g, [{ a: plerp(hp, kn, -.1), b: kn, d0, d1 }, { a: kn, b: cuff, d0: d1 - 1, d1: d2 }], tone);
    const L = litSide(kn, an), back = { x: -L.x, y: -L.y };
    for (const o of [-2, 1.5]) { const f0 = padd(padd(kn, back, d1 * .2), dir2, o); line1(g, f0, padd(f0, L, d1 * .3), tone.dd); } // knee folds
    const q = { x: -dir2.y, y: dir2.x }; line1(g, padd(padd(cuff, dir2, -2), q, -d2 / 2 + 1), padd(padd(cuff, dir2, -2), q, d2 / 2 - 1), tone.dd);
    if (def.jeans) { const sc = isFar ? dk(lt(def.pants, .3), .85) : lt(def.pants, .3); line1(g, padd(plerp(hp, kn, .05), back, d0 * .3), padd(kn, back, d1 * .32), sc); line1(g, padd(kn, back, d1 * .32), padd(cuff, back, d2 * .3), sc); }
    if (def.crease) line1(g, padd(plerp(hp, kn, .15), L, d0 * .12), padd(padd(cuff, dir2, -2), L, d2 * .12), tone.l);
  }
  function shortsLeg(hp, kn, isFar) {
    const tone = isFar ? farTones(pantT) : pantT, hem = plerp(hp, kn, def.shortsLen || .74), tight = def.fit === 'tight';
    const d0 = (b.tw + (tight ? 1.2 : 2.4)) * K, d1 = (b.tw + (tight ? .6 : 2.6)) * K;
    hdLimb(g, [{ a: plerp(hp, kn, -.15), b: hem, d0, d1 }], tone);
    const L = litSide(hp, kn), back = { x: -L.x, y: -L.y }, v = { x: kn.x - hp.x, y: kn.y - hp.y };
    tcap(g, padd(hem, v, -.04), hem, d1 - 2, d1 - 2, tone.dd);
    tcap(g, padd(hem, v, -.09), padd(hem, v, -.05), d1 - 3, d1 - 3, tone.b);
    if (def.jeans) { tcap(g, padd(hem, v, -.06), padd(hem, v, -.02), d1 - 2, d1 - 2, lt(tone.b, .18)); line1(g, padd(plerp(hp, kn, -.05), back, d0 * .3), padd(hem, back, d1 * .3), lt(tone.b, .25)); }
    if (def.shortsStripe) { const pc = isFar ? dk(def.shortsStripe, .7) : def.shortsStripe, o = d0 * .12; line1(g, padd(plerp(hp, kn, -.1), back, o), padd(hem, back, o + 1), pc); }
    if (!isFar && def.shortsLogo) {
      const lp = padd(padd(hem, { x: hp.x - kn.x, y: hp.y - kn.y }, .12), L, d1 * .22);
      g.fillStyle = def.shortsLogo; for (const [x, y] of [[0, 0], [1, 0], [3, 0], [4, 0], [0, 1], [2, 1], [3, 1], [5, 1]]) g.fillRect(Math.round(lp.x) - 2 + x, Math.round(lp.y) + y, 1, 1);
    }
  }
  function foot(an, ft, isFar) {
    const f = V(ft, 1), dn = pt(-f.y, f.x), heel = padd(an, f, -1.8 * K), toe = padd(an, f, 4.6 * s * K);
    const shoe = def.shoe || 'sneaker';
    if (shoe === 'barefoot' || shoe === 'sandal') {
      const tone = isFar ? skinF : skin;
      tcap(g, heel, toe, 8, 6, OUTL); tcap(g, heel, toe, 6, 4, tone.d); tcap(g, padd(heel, f, 1), padd(toe, f, -1), 4, 3, tone.b, 0, { x: 0, y: -1 });
      px1(g, padd(padd(toe, f, -1), dn, -1), tone.dd); px1(g, padd(padd(toe, f, -3), dn, -1), tone.dd);
      if (shoe === 'sandal') {
        const sc = isFar ? dk(def.shoes, .8) : def.shoes;
        tcap(g, padd(heel, dn, 3.2), padd(toe, dn, 3.2), 3, 3, OUTL); tcap(g, padd(heel, dn, 3), padd(toe, dn, 3), 2, 2, dk(sc, .8));
        for (const t of [.3, .62]) { const m = plerp(heel, toe, t); tcap(g, padd(m, dn, -2.5), padd(m, dn, 2.5), 3, 3, sc); }
      }
      return;
    }
    const sc = isFar ? dk(def.shoes, .8) : def.shoes, so = isFar ? dk(def.sole || '#f0f0f0', .8) : (def.sole || '#f0f0f0');
    if (shoe === 'dress') {
      tcap(g, heel, padd(toe, f, 1), 10, 7, OUTL); tcap(g, heel, padd(toe, f, 1), 8, 5, sc); tcap(g, padd(heel, f, 2), toe, 3, 2, lt(sc, .25), 0, { x: 0, y: -2 });
      tcap(g, padd(heel, dn, 3.5), padd(heel, dn, 3.5), 4, 4, OUTL);
      return;
    }
    // sneaker: chunky body, thick sole, toe cap, laces, side accent
    const t2 = padd(toe, f, 1.5);
    tcap(g, heel, t2, 12, 9, OUTL); tcap(g, heel, t2, 10, 7, dk(sc, .82)); tcap(g, padd(heel, f, .5), padd(t2, f, -1), 7, 5, sc, 0, { x: 0, y: -1.2 });
    tcap(g, padd(heel, dn, 3.4), padd(t2, dn, 3), 5, 4, OUTL); tcap(g, padd(heel, dn, 3.4), padd(t2, dn, 2.8), 3, 2, so);
    tcap(g, padd(padd(t2, f, -2.5), dn, .5), padd(padd(t2, f, -1), dn, .8), 4, 3, lt(sc, .15));
    for (let i = 0; i < 3; i++) px1(g, padd(padd(an, f, 1 + i * 2.2), dn, -3 + i * .5), isFar ? '#b0b0b0' : '#f8f8f8');
    if (def.shoeAccent) { const ac = isFar ? dk(def.shoeAccent, .8) : def.shoeAccent; line1(g, padd(padd(heel, f, 2), dn, 1), padd(padd(an, f, 4), dn, -.5), ac); line1(g, padd(padd(heel, f, 3), dn, 1.8), padd(padd(an, f, 3.5), dn, .5), ac); }
  }
  // ---- torso variants
  function torsoPoly(extra = 0, len = 0) {
    const e = extra;
    if (fem) return [Q(-len, -hw - e), Q(-len, hw * .85 + e), Q(T * .3, hw * .72 + e), Q(T * .5, sw * .7 + e), Q(T * .62, sw + 1.4 + e), Q(T * .78, sw + 1.2 + e), Q(T * .9, sw - .2 + e), Q(T + .5, sw - 2.5), Q(T + .2, -sw + 2.5), Q(T * .8, -sw - e), Q(T * .4, -hw * .8 - e)];
    return [Q(-len, -hw - e), Q(-len, hw * .92 + e), Q(T * .45, hw + .4 + e), Q(T * .72, sw + .3 + e), Q(T + .2, sw - .8 + e * .5), Q(T + .6, sw - 3), Q(T + .2, -sw + 2.6), Q(T * .8, -sw - e), Q(T * .4, -hw - .5 - e)];
  }
  function torso() {
    if (top === 'bare') { bareTorso(); return; }
    if (top === 'crop') { femSkinTorso(); crop(); return; }
    if (top === 'tank') { tank(); return; }
    const hood = top === 'hoodie', suit = top === 'suit', open = top === 'openShirt';
    const tone = suit || open ? jackT : shirtT, ex = hood ? 1.4 : suit ? .6 : .2, len = hood ? 1.5 : suit ? 4 : open ? 3 : def.tucked ? -1 : 1.8;
    const poly = torsoPoly(ex, len);
    polyOut(g, poly, tone.b);
    // side/back shadow & front light
    polyFill(g, [Q(-len, -hw - ex), Q(T * .4, -hw - .5 - ex), Q(T * .8, -sw - ex), Q(T + .2, -sw + 2.6), Q(T + .2, -sw * .35), Q(T * .5, -hw * .4), Q(-len, -hw * .4)], tone.d);
    polyFill(g, [Q(T * .55, sw * .15), Q(T * .72, sw - .6), Q(T - .5, sw - 1.6), Q(T - .5, sw * .1)], tone.l);
    // folds from the armpit toward the waist
    for (const [a0, a1] of [[[.78, -.2], [.46, .3]], [[.7, .15], [.36, .55]], [[.3, -.4], [.08, -.1]]]) line1(g, Q(T * a0[0], sw * a0[1]), Q(T * a1[0], sw * a1[1]), tone.dd);
    if (def.vstripes) {
      g.save(); g.beginPath(); poly.forEach((v, i) => i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)); g.closePath(); g.clip();
      for (let nk = -sw - 2; nk < sw + 2; nk += 3.6) polyFill(g, [Q(-len, nk), Q(-len, nk + 1.5), Q(T + 1, nk + 1.5), Q(T + 1, nk)], nk < -sw * .35 ? dk(def.vstripes, .82) : def.vstripes);
      g.restore();
    }
    line1(g, Q(-len + .6, -hw - ex), Q(-len + .6, hw * .9 + ex), tone.dd); // hem
    if (hood) {
      // hood bunched behind the neck, drawstrings, kangaroo pocket, ribbed hem
      const hb = Q(T + .5, -sw + 3.2); stamp(g, hb.x, hb.y, 17, OUTL); stamp(g, hb.x, hb.y, 15, tone.d); stamp(g, hb.x + 1, hb.y - 1, 10, tone.b); line1(g, padd(hb, { x: 2, y: -4 }), padd(hb, { x: 5, y: 3 }), tone.dd);
      for (const o of [sw - 2.2, sw - 4]) line1(g, Q(T - .5, o), Q(T - 7, o - .3), '#f0f0f0');
      const pk = [Q(T * .08, sw - .2), Q(T * .42, sw - 1.2), Q(T * .42, -1), Q(T * .08, -1.5)];
      line1(g, pk[0], pk[1], tone.dd); line1(g, pk[1], pk[2], tone.dd); line1(g, pk[2], pk[3], tone.dd);
      for (let nk = -hw; nk < hw; nk += 1.4) line1(g, Q(-len, nk), Q(-len + 1.6, nk), tone.d);
    }
    if (open) {
      // overshirt worn open over a white tank: tank strip, lapels, pocket, buttons
      const tk = [Q(-len + 1, hw * .45), Q(-len + 1, hw * .9 + ex), Q(T * .45, hw + .4), Q(T * .72, sw + .3), Q(T + .2, sw - .8), Q(T + .1, sw - 3.6), Q(T * .7, sw - 3.2), Q(T * .3, hw * .45)];
      const wt = fabric(def.shirt);
      polyOut(g, tk, wt.b); polyFill(g, [tk[0], tk[7], tk[6], Q(T * .7, sw - 2.4), Q(T * .3, hw * .6), Q(-len + 1, hw * .6)], wt.d);
      polyFill(g, [Q(T + .1, sw - 3.6), Q(T + .2, sw - .8), Q(T * .86, sw - 1.2)], skin.b); // neckline
      line1(g, Q(T + .2, sw - 3.2), Q(T * .72, sw - 3.6), tone.dd); line1(g, Q(T * .72, sw - 3.6), Q(-len + 1, hw * .45), tone.dd);
      polyFill(g, [Q(T + .6, sw - 4.2), Q(T * .82, sw - 3.2), Q(T + .3, sw - 5.8)], tone.l); // collar
      for (const r of [.2, .45, .68]) px1(g, Q(T * r, hw * .42), lt(tone.b, .4), 2, 2);
      const pc = [Q(T * .66, -1), Q(T * .66, 2.5), Q(T * .5, 2.5), Q(T * .5, -1)]; for (let i = 0; i < 3; i++) line1(g, pc[i], pc[i + 1], tone.dd);
    }
    if (suit) {
      // white shirt V, tie, lapels, buttons, pocket flap
      polyFill(g, [Q(T + .3, sw - 5), Q(T + .5, sw - 1.2), Q(T * .56, sw - .5)], def.shirt);
      if (def.necktie) {
        const a = Q(T - .3, sw - 2.2), e = Q(T * .3, sw - 1.1);
        seg(g, a, e, 5, OUTL); seg(g, a, e, 3, def.necktie); stamp(g, a.x, a.y, 5, dk(def.necktie, .8));
        g.fillStyle = dk(def.necktie, .6); for (let i = 1; i < 8; i++) { const q = plerp(a, e, i / 8); g.fillRect(Math.round(q.x) + (i % 2), Math.round(q.y), 1, 1); }
      }
      line1(g, Q(T + .6, sw - 5.4), Q(T * .5, sw - .6), tone.dd); line1(g, Q(T + .6, sw - 6.4), Q(T * .55, sw - 1.8), lt(tone.b, .18));
      for (const r of [.3, .14]) px1(g, Q(T * r, sw - .6), lt(tone.b, .35), 2, 2);
      line1(g, Q(T * .1, -1.5), Q(T * .1, 2.5), tone.dd);
    }
    if (!open && !suit && !hood) { line1(g, Q(T - .2, -1.2), Q(T - 1.2, sw - 2.4), tone.dd); line1(g, Q(T + .1, -1), Q(T - .8, sw - 2.6), lt(tone.b, .15)); } // tee collar
  }
  // female torso in skin (sports top)
  function femSkinTorso() {
    const S = skin, poly = torsoPoly(0, 0);
    polyOut(g, poly, S.b);
    polyFill(g, [Q(0, -hw), Q(T * .4, -hw * .8), Q(T * .8, -sw), Q(T + .2, -sw + 2.5), Q(T + .2, -sw * .35), Q(T * .5, -hw * .4), Q(0, -hw * .35)], S.d);
    const m = hw * .35;
    for (const r of [.14, .26, .38]) line1(g, Q(T * r, m - 2.2), Q(T * r + .3, m + 1.8), mix(S.b, S.d, .6));
    line1(g, Q(T * .05, m), Q(T * .45, m + .2), mix(S.b, S.d, .5));
    px1(g, Q(T * .08, m + .4), S.dd, 1, 2);
    line1(g, Q(T * .3, -hw * .3), Q(1.5, hw * .1), S.d);
  }
  function crop() {
    const t = fabric(def.cropCol || '#1a1a1e');
    const band = [Q(T * .52, -sw * .85), Q(T * .5, sw * .72), Q(T * .62, sw + 1.4), Q(T * .78, sw + 1.2), Q(T * .86, sw - .2), Q(T * .86, -sw)];
    polyOut(g, band, t.b); polyFill(g, [band[0], band[5], Q(T * .86, -sw * .3), Q(T * .52, -sw * .3)], t.d);
    line1(g, Q(T * .54, -sw * .8), Q(T * .52, sw * .7), t.l);
    line1(g, Q(T * .86, sw - 1.8), Q(T + .4, sw - 2.8), t.b); line1(g, Q(T * .86, sw - 1.2), Q(T + .4, sw - 2.2), t.d); // strap
  }
  function tank() {
    const t = fabric(def.shirt), S = skin, poly = torsoPoly(0, 1.5);
    polyOut(g, poly, S.b); // skin shows at the neckline & shoulders
    polyFill(g, [Q(0, -hw), Q(T * .4, -hw * .8), Q(T * .8, -sw), Q(T + .2, -sw + 2.5), Q(T + .2, -sw * .3), Q(T * .5, -hw * .4), Q(0, -hw * .35)], S.d);
    const tk = [Q(-1.5, -hw), Q(-1.5, hw * .85), Q(T * .3, hw * .72), Q(T * .5, sw * .7), Q(T * .62, sw + 1.4), Q(T * .76, sw + 1.2), Q(T * .82, sw * .5), Q(T * .86, -sw * .1), Q(T * .8, -sw), Q(T * .4, -hw * .8)];
    polyOut(g, tk, t.b);
    polyFill(g, [tk[0], tk[9], tk[8], Q(T * .8, -sw * .35), Q(T * .5, -hw * .4), Q(-1.5, -hw * .35)], t.d);
    for (let nk = -hw; nk < sw + 1; nk += 1.3) line1(g, Q(0, nk), Q(T * .56, nk * .98), nk < -hw * .35 ? t.dd : lt(t.b, .06)); // ribs
    line1(g, Q(T * .62, sw * .2), Q(T * .72, sw + .6), t.d); // bust shading
    line1(g, Q(T * .86, -sw * .1), Q(T + .4, -sw + 2.8), t.b); line1(g, Q(T * .84, sw * .5), Q(T + .4, sw - 2.2), t.b); // straps
  }
  // shirtless athletic torso seen in the fighting stance (3/4 profile)
  function bareTorso() {
    const S = skin, top_ = T + .6;
    const FE = [[0, hw * .86], [.14, hw * .9], [.24, hw * .97], [.34, hw * 1.02], [.44, hw + .5], [.54, sw * .8], [.64, sw * .96], [.74, sw + .5], [.86, sw + .2]];
    const fe = r => pw(FE, r);
    const F = (r, o = 0) => Q(T * r, fe(r) + o);
    const tor = [Q(0, -hw), F(0), F(.1, .25), F(.14), F(.2, .3), F(.24), F(.3, .3), F(.34), F(.4, .3), F(.44), F(.54), F(.64), F(.74), F(.86), Q(top_ - .5, sw - 1), Q(top_, sw - 3),
      Q(top_ - .6, -sw + 3), Q(top_ - 2.4, -sw + 1.2), Q(T * .62, -sw + .1), Q(T * .46, -hw - .9), Q(T * .22, -hw - .5)];
    polyOut(g, tor, S.b);
    polyFill(g, [Q(0, -hw), Q(T * .22, -hw - .5), Q(T * .46, -hw - .9), Q(T * .62, -sw + .1), Q(top_ - 2.4, -sw + 1.2), Q(top_ - .6, -sw * .3), Q(T * .62, -sw * .35), Q(T * .4, -hw * .4), Q(0, -hw * .35)], S.d);
    polyFill(g, [Q(T * .2, -hw - .5), Q(T * .46, -hw - .9), Q(T * .62, -sw + .1), Q(T * .62, -sw + 1.1), Q(T * .46, -hw + .2), Q(T * .2, -hw + .4)], S.dd);
    polyFill(g, [F(.04, -3), F(.04, -.4), F(.5, -.4), F(.5, -3.2)], lt(S.b, .06));
    polyFill(g, [Q(T * .62, sw * .05), F(.64, -.4), F(.86, -.6), Q(top_ - .8, sw * .1)], lt(S.b, .1));
    polyFill(g, [Q(T * .72, sw * .35), F(.74, -1), F(.84, -1.1), Q(T * .86, sw * .35)], S.l);
    for (let r = .04; r < .52; r += .02) px1(g, F(r, -3.3), S.d);
    for (const r of [.16, .28, .4]) line1(g, F(r, -3.2), F(r + .015, -.5), S.d);
    for (const r of [.06, .19, .31, .43]) px1(g, F(r + .03, -1.8), S.l, 2, 1);
    px1(g, F(.08, -1.3), S.dd, 1, 2);
    const ob = [Q(1.6, -hw * .55), Q(T * .14, -hw * .2), Q(T * .3, hw * .05), Q(T * .5, fe(.5) - 3.6)];
    for (let i = 0; i < 3; i++) line1(g, ob[i], ob[i + 1], S.d);
    for (let i = 0; i < 2; i++) line1(g, padd(ob[i], { x: 0, y: -1 }), padd(ob[i + 1], { x: 0, y: -1 }), lt(S.b, .08));
    line1(g, F(.1, -3.4), Q(.3, hw * .35), S.d);
    for (const r of [.52, .58, .64]) { line1(g, Q(T * r, -sw * .28), Q(T * r - 1.1, sw * .18), S.d); px1(g, Q(T * r + .7, -sw * .05), S.l); }
    const pc = [F(.62, -.2), Q(T * .6, sw * .45), Q(T * .64, sw * .05), Q(T * .72, -sw * .25), Q(T * .82, -sw * .4)];
    for (let i = 0; i < 4; i++) { line1(g, pc[i], pc[i + 1], S.dd); line1(g, padd(pc[i], { x: 0, y: 1 }), padd(pc[i + 1], { x: 0, y: 1 }), S.d); }
    px1(g, Q(T * .68, sw * .62), dk(S.b, .66), 2, 1);
    line1(g, Q(top_ - 1.2, -sw * .2), Q(top_ - 1.8, sw - 3), S.d);
  }
  // ---- waist: shorts / trousers (the skirt is its own piece)
  function pelvis() {
    if (bot === 'skirt') return;
    const tone = pantT, e = fem ? 1.4 : 0, band = [Q(-3.5, -hw - 1 - e), Q(-3.5, hw + 1 + e), Q(2.6, hw + .6 + e * .5), Q(2.8, -hw - .7 - e * .5)];
    polyOut(g, band, tone.b);
    polyFill(g, [band[0], Q(-3.5, -hw * .2), Q(2.8, -hw * .2), band[3]], tone.d);
    line1(g, Q(1.6, -hw - .5 - e * .5), Q(1.5, hw + .4 + e * .5), tone.l);
    if (top === 'bare') line1(g, Q(3.2, -hw - .4), Q(3.1, hw * .2), '#141418');
    if (def.belt) { seg(g, Q(1.8, -hw - .6), Q(1.6, hw + .5), 3, def.belt); px1(g, Q(1.7, hw * .55), '#c8c8c8', 2, 2); }
    else if (bot === 'shorts' && !def.jeans) { const ds = Q(2, hw * .55); px1(g, ds, '#f0f0f0', 1, 3); px1(g, padd(ds, { x: 2, y: 0 }), '#f0f0f0', 1, 2); }
    line1(g, Q(-1, hw * .1), Q(-3.2, hw * .5), tone.dd);
    if (bot === 'pants' || def.jeans) line1(g, Q(1, hw * .55), Q(-2.5, hw * .62), tone.dd); // fly
    if (def.shortsStripe) line1(g, Q(2.5, hw * .15), Q(-2.5, hw * .5), def.shortsStripe);
  }
  function skirtPiece() {
    const tone = fabric(def.skirt), L = (def.skirtLen || 20) * s * K;
    const xs = [k.kn1.x, k.kn2.x, hip.x - (hw + 2) * K, hip.x + (hw + 2) * K], lo = Math.min(...xs) - 6, hi = Math.max(...xs) + 6;
    const hy = Math.min(hip.y + L, Math.max(k.kn1.y, k.kn2.y) + 14);
    const w0 = Q(2.5, -hw - 1.6), w1 = Q(2.5, hw + 1.6);
    const sk = [w0, w1, pt(hi, hy - 2), pt(lerp(lo, hi, .66), hy + 1), pt(lerp(lo, hi, .33), hy + 1), pt(lo, hy - 2)], skA = sk.map(v => [v.x, v.y]);
    polyOut(g, sk, tone.b);
    polyFill(g, [w0, pt(lerp(w0.x, w1.x, .35), w0.y), pt(lerp(lo, hi, .3), hy), pt(lo, hy - 2)], tone.d);
    // crochet: diamond mesh + scalloped hem
    for (let y = Math.round(Math.min(w0.y, w1.y)) + 3; y < hy - 1; y += 3) for (let x = Math.round(lo); x < hi; x += 4) {
      const xx = x + ((y / 3) % 2 ? 2 : 0); if (!inPoly(xx + .5, y + .5, skA)) continue;
      g.fillStyle = (x + y) % 3 ? lt(tone.b, .22) : tone.dd; g.fillRect(xx, y, 1, 1);
    }
    for (let x = Math.round(lo) + 2; x < hi - 1; x += 4) stamp(g, x, hy, 3, tone.d);
    seg(g, w0, w1, 2, tone.d);
    const tie = Q(1.5, hw * .5); line1(g, tie, padd(tie, { x: 1, y: 7 }), tone.l); line1(g, padd(tie, { x: 1, y: 0 }), padd(tie, { x: 3, y: 6 }), tone.d);
  }
  // ---- neck accessories (drawn over the neck base)
  function neckwear() {
    const nk = def.neck; if (!nk) return;
    if (nk === 'choker') { const p0 = Q(T + 3.2, -1), p1 = Q(T + 3.2, sw - 3.2); seg(g, p0, p1, 3, OUTL); for (let i = 0; i <= 6; i++) px1(g, plerp(p0, p1, i / 6), i % 2 ? '#c8b8e8' : '#f4f4f8', 2, 2); return; }
    const a = Q(T + .8, -1.8), e = Q(T + .6, sw - 3), m = Q(T - (nk === 'goldChain' ? 5 : 6.5), sw * .35);
    const col = nk === 'goldChain' ? '#e8c060' : '#d8dce4';
    line1(g, a, m, col); line1(g, m, e, col); line1(g, padd(a, { x: 0, y: 1 }), padd(m, { x: 0, y: 1 }), dk(col, .6));
    if (nk === 'pendant') { g.fillStyle = OUTL; g.fillRect(Math.round(m.x) - 2, Math.round(m.y), 4, 8); g.fillStyle = '#9aa0aa'; g.fillRect(Math.round(m.x) - 1, Math.round(m.y) + 1, 2, 6); }
  }
  // ---- head
  function head() {
    const rot = p.t < -50, H = headCanvasHD(def, expr, rot), nk = k.neck, a = H.anchor;
    if (!rot) g.drawImage(H, Math.round(nk.x - a.x + p.hdx * K), Math.round(nk.y - a.y + 3 + p.hdy * K));
    else g.drawImage(H, Math.round(nk.x - a.x), Math.round(nk.y - a.y));
  }
  function racket(front) {
    const h = front ? k.ha2 : k.ha1, e = front ? k.el2 : k.el1, d = unit(e, h);
    const nk = padd(h, d, 8), c1 = padd(h, d, 12), c2 = padd(h, d, 17), cc = padd(h, d, 14.5);
    seg(g, h, nk, 4, OUTL); seg(g, h, nk, 2, '#6a4020');
    seg(g, c1, c2, 12, OUTL); seg(g, c1, c2, 10, '#9a6a30'); seg(g, c1, c2, 8, '#e8e6dc');
    g.fillStyle = '#b8b6ac'; for (let i = -3; i <= 3; i += 2) { g.fillRect(Math.round(cc.x) + i, Math.round(cc.y) - 4, 1, 8); g.fillRect(Math.round(cc.x) - 4, Math.round(cc.y) + i, 8, 1); }
  }
  // ---- draw order
  const racketFront = def.weapon === 'racket' && p.h2 === 'open';
  if (def.weapon === 'racket' && !racketFront) racket(false); // carried in the back hand, behind the body
  const fsh = { x: (k.sh2.x - k.sh1.x) * .45, y: (k.sh2.y - k.sh1.y) * .45 }; // far shoulder sits just behind the near one
  arm(padd(k.sh1, fsh), padd(k.el1, fsh), padd(k.ha1, fsh), true, p.h1);
  leg(k.hp1, k.kn1, k.an1, p.ft1, true);
  leg(k.hp2, k.kn2, k.an2, p.ft2, false);
  if (bot === 'skirt') skirtPiece();
  const pelvisFirst = !(top === 'bare' || top === 'crop' || def.tucked);
  if (pelvisFirst) pelvis();
  torso();
  if (!pelvisFirst) pelvis();
  head();
  neckwear();
  arm(k.sh2, k.el2, k.ha2, false, p.h2);
  if (racketFront) racket(true); // serve: swung with the front hand
  const Lg = v => pt(v.x / K - AX, v.y / K - AY);
  return { c, ax: AX * K, ay: AY * K, hd: K, hand1: Lg(k.ha1), hand2: Lg(k.ha2), top: pt(k.neck.x / K - AX, k.neck.y / K - AY - 18) };
}

// ============================================================
//  GRID PAINTER (shared by heads & portraits)
//  works in design units; f = unit->pixel scale, oy = vertical offset in units
// ============================================================
function gridPainter(G, f, oy) {
  const gx = v => v * f, gy = v => (v + oy) * f;
  const P = {
    G, f,
    // col(ux, uy, x, y, old) for every pixel whose centre passes test(ux, uy); box limits the scan (units)
    fill(test, col, box) {
      const x0 = box ? Math.max(0, Math.floor(gx(box[0]))) : 0, x1 = box ? Math.min(G.w, Math.ceil(gx(box[2]))) : G.w;
      const y0 = box ? Math.max(0, Math.floor(gy(box[1]))) : 0, y1 = box ? Math.min(G.h, Math.ceil(gy(box[3]))) : G.h;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const ux = (x + .5) / f, uy = (y + .5) / f - oy;
        if (!test(ux, uy, x, y)) continue;
        const cc = typeof col === 'function' ? col(ux, uy, x, y, G.get(x, y)) : col; if (cc) G.set(x, y, cc);
      }
    },
    ell(cx, cy, rx, ry, col, cond) { P.fill((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && (!cond || cond(x, y)), col, [cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1]); },
    // ring w pixels thick just inside the ellipse edge
    ring(cx, cy, rx, ry, col, w = 1, cond) {
      const wi = w / f; P.fill((x, y) => { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, di = ((x - cx) / Math.max(.1, rx - wi)) ** 2 + ((y - cy) / Math.max(.1, ry - wi)) ** 2; return d <= 1 && di > 1 && (!cond || cond(x, y)); }, col, [cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1]);
    },
    poly(pts, col, cond) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); P.fill((x, y) => inPoly(x, y, pts) && (!cond || cond(x, y)), col, [Math.min(...xs) - 1, Math.min(...ys) - 1, Math.max(...xs) + 1, Math.max(...ys) + 1]); },
    // thick polyline (width in units, at least ~1px)
    stroke(pts, w, col) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), r = Math.max(w / 2, .55 / f); P.fill((x, y) => distPoly(x, y, pts) <= r, col, [Math.min(...xs) - w - 1, Math.min(...ys) - w - 1, Math.max(...xs) + w + 1, Math.max(...ys) + w + 1]); },
    line(x0, y0, x1, y1, col) { const a = [gx(x0), gy(y0)], b = [gx(x1), gy(y1)], n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])))); for (let i = 0; i <= n; i++) G.set(Math.floor(lerp(a[0], b[0], i / n)), Math.floor(lerp(a[1], b[1], i / n)), col); },
    arc(cx, cy, rx, ry, a0, a1, col) { const n = Math.ceil((rx + ry) * f * Math.abs(a1 - a0)); for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); G.set(Math.floor(gx(cx + Math.cos(a) * rx)), Math.floor(gy(cy + Math.sin(a) * ry)), col); } },
    dot(x, y, col) { G.set(Math.floor(gx(x)), Math.floor(gy(y)), col); },
  };
  return P;
}
// grid -> canvas with outline; pixels listed in G.noOut don't produce outline (neck base / cut edges)
function hdGridCanvas(G) {
  const pad = 1, [c, g] = mk(G.w + 2 * pad, G.h + 2 * pad), no = G.noOut;
  const solid = (x, y) => G.get(x, y) && !(no && x >= 0 && y >= 0 && x < G.w && y < G.h && no.has(y * G.w + x));
  g.fillStyle = OUTL;
  for (let y = -pad; y < G.h + pad; y++) for (let x = -pad; x < G.w + pad; x++) {
    if (G.get(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) g.fillRect(x + pad, y + pad, 1, 1);
  }
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) { const v = G.get(x, y); if (v) { g.fillStyle = v; g.fillRect(x + pad, y + pad, 1, 1); } }
  return c;
}

// ============================================================
//  IN-GAME HEAD (3/4 profile facing right) — 48-unit reference
// ============================================================
const SIL_M = [[11, 12], [13, 8], [17, 5], [22, 3.5], [28, 3.6], [32, 5.5], [35, 9], [36.2, 13], [36.4, 16.5], [37, 18.5], [36.3, 20.5], [37.4, 22.5], [39, 25], [40.8, 27.4], [40, 28.6], [38, 29.4], [38.3, 31], [38.6, 32.6], [37.8, 33.8], [38.2, 35], [37.6, 36.4], [38, 38.5], [36.6, 40.6], [33, 41.4], [28, 40.5], [23, 37.5], [19.5, 33.5], [16, 30], [13, 26], [11.2, 21], [10.6, 16]];
function headSil(def) {
  const s = SIL_M.map(p => p.slice()), fa = def.face || {}, fem = def.fem;
  const nose = fa.nose != null ? fa.nose : fem ? -1 : 0;
  s[12][0] += nose * .6; s[13][0] += nose; s[14][0] += nose * .8; s[15][0] += nose * .3;
  if (fem) { s[20] = [37.2, 36.2]; s[21] = [37.2, 38]; s[22] = [35.6, 39.8]; s[23] = [32, 40.5]; s[24] = [27, 39.2]; s[25] = [22.5, 35.8]; s[26] = [19.5, 32.5]; }
  const ch = fa.chin || 0; for (const [i, w] of [[20, .5], [21, 1], [22, 1], [23, 1], [24, .8], [25, .4]]) s[i][1] += ch * w;
  const jw = fa.jaw || 0; s[24][1] += jw * .6; s[25][1] += jw; s[25][0] -= jw * .5; s[26][1] += jw * .6;
  return s;
}
const NECK_M = [[18, 30], [31, 36], [32.5, 41], [34, 50], [15, 50], [16, 40], [16.5, 33]];
const NECK_F = [[19, 31], [30, 36], [31, 41], [32, 50], [17, 50], [17.5, 40], [17.5, 33]];

function paintHeadHD(def, expr) {
  const f = HEAD_F, OY = HEAD_OY, hs = def.hairStyle, long = hs === 'curlyLong' || hs === 'braid';
  const GW = Math.ceil(52 * f), GH = Math.ceil(((long ? 92 : 50) + OY) * f);
  const G = new PGrid(GW, GH), P = gridPainter(G, f, OY), R = RNG((def.seed || 7) * 31 + 3);
  G.noOut = new Set();
  const S = def.skin, SS = dk(S, .86), SD = dk(S, .72), SDD = dk(S, .58), SL = lt(S, .15), SLL = lt(S, .28);
  const H = def.hair, H2 = def.hair2 || lt(H, .28), HD = dk(H, .68), HL = lt(H, .22);
  const BRD = def.beardCol || H, BRL = mix(BRD, S, .45);
  const E = expr || 'normal', fem = !!def.fem;
  const sil = headSil(def), inHead = (x, y) => inPoly(x, y, sil);
  const ear = { x: 18.2, y: 23.4, rx: fem ? 2.5 : 2.9, ry: fem ? 4 : 4.5 };
  const inEar = (x, y) => ((x - ear.x) / ear.rx) ** 2 + ((y - ear.y) / ear.ry) ** 2 <= 1;

  // ---- long hair behind the head (drawn first)
  if (hs === 'curlyLong') {
    const back = [[14, 10], [22, 16], [23, 34], [21, 52], [18, 70], [10, 80], [3, 70], [2, 46], [4, 24], [8, 12]];
    P.poly(back, HD);
    for (let i = 0; i < 260; i++) {
      const x = R.r(2, 23), y = R.r(12, 80); if (!inPoly(x, y, back)) continue;
      const r = R.r(1.5, 2.4); P.ell(x, y, r, r * 1.1, (ux, uy) => ux - x + uy - y < -r * .7 ? H2 : ux - x + uy - y > r * .6 ? HD : H);
    }
  }
  if (hs === 'braid') {
    for (let i = 0; i < 13; i++) {
      const cy = 20 + i * 4.3, cx = 10.4 + Math.sin(i * .45) * 1.1 - i * .1, side = i % 2 ? 1 : -1, col = mix(H, H2, clamp(i / 12 * 1.4 - .1, 0, 1)), rr = 3 - i * .06;
      P.ell(cx + side * .8, cy, rr, rr * .95, col);
      P.stroke([[cx + side * .8 - rr * .6, cy - rr * .5], [cx + side * .8 + rr * .5, cy + rr * .2]], .5, lt(col, .18));
      P.arc(cx + side * .8, cy, rr, rr * .95, Math.PI * .15, Math.PI * .85, dk(col, .62));
    }
    P.ell(9.2, 75.6, 1.7, 1.1, '#2a2a2a'); // hair tie
    P.poly([[7.2, 76.5], [11.2, 76.5], [12.4, 82], [9.4, 84.5], [6.8, 81]], H2);
  }
  // ---- neck
  const neck = fem ? NECK_F : NECK_M;
  P.poly(neck, (x) => x < 19.5 ? SD : x < 21 ? mix(SD, SS, .5) : x < 23 ? SS : x < 24.5 ? mix(SS, S, .5) : S);
  P.stroke([[21.5, 37], [27, 49]], .8, SD);
  P.fill((x, y) => inPoly(x, y, neck) && y > 45, (x, y, gx, gy) => { G.noOut.add(gy * G.w + gx); return null; });
  // ---- skull + face
  P.poly(sil, (x) => x < 15.5 ? SS : S);
  P.fill((x, y) => inPoly(x, y, neck) && !inHead(x, y) && inHead(x, y - 2.2), SD, [14, 30, 36, 46]); // soft shadow right under the jaw
  P.ell(31, 10.5, 4.4, 2.8, (x, y, a, b, o) => o === S ? SL : null);
  P.ell(30, 25.6, 2.6, 1.1, (x, y, a, b, o) => o === S ? SL : null);
  if (def.blush) P.ell(30.5, 27.4, 2.6, 1.5, (x, y, a, b, o) => o ? mix(o, '#e05a5a', .22) : null);
  P.line(26, 19.2, 33.5, 19.2, SS);
  // ---- ear
  P.ell(ear.x, ear.y, ear.rx, ear.ry, S);
  P.arc(ear.x, ear.y, ear.rx - .8, ear.ry - .9, Math.PI * .55, Math.PI * 1.6, SD);
  P.ell(ear.x + .3, ear.y + .3, .8, 1.3, SDD); P.dot(ear.x - 1.6, ear.y - 1, SL);

  // ---- hair styles
  const hairMass = (test, colFn, box) => P.fill((x, y) => test(x, y) && !inEar(x, y), colFn, box);
  const strands = (cx, cy, k1, k2) => (x, y) => { const a = Math.atan2(y - cy, x - cx), r = Math.hypot(x - cx, y - cy), v = Math.sin(a * k1 + r * k2 + (R() - .5) * .9); return v > .62 ? HD : v < -.8 ? HL : H; };
  if (hs === 'buzz') {
    const hl = x => pw([[10, 27], [13, 23], [16, 19.5], [21, 16.5], [26, 13.5], [30, 11.8], [34, 10.8], [38, 10.5]], x);
    hairMass((x, y) => inHead(x, y) && y <= hl(x), (x, y) => {
      const edge = y > hl(x) - 1.1, fade = x < 25 && y > hl(x) - 5.5;
      if (edge) return R() < .6 ? mix(H, S, .45) : mix(H, S, .7);
      if (fade) return R() < .5 ? mix(H, S, .45) : mix(H, S, .28);
      return y < 7 && R() < .35 ? HL : R() < .14 ? HL : H;
    });
  } else if (hs === 'messy') {
    const hl = x => pw([[8, 27], [12, 24], [16, 20.5], [20, 17.5], [25, 15], [29, 13.4], [33, 12.6], [37, 13]], x);
    const fr = x => x > 26 ? hl(x) + (def.fringe || 1.6) + 2 * Math.abs(Math.sin(x * 1.45 + 0.4)) : hl(x);
    const vol = (x, y) => { const a = Math.atan2(y - 11, x - 23), r = 1 + .06 * Math.sin(a * 11 + 1) + .04 * Math.sin(a * 17); return ((x - 23) / (15.4 * r)) ** 2 + ((y - 11) / (11 * r)) ** 2 <= 1; };
    const st = strands(21, 3, 9, .45);
    hairMass((x, y) => (inHead(x, y) || vol(x, y)) && y <= fr(x) && x < 38.2, (x, y) => y > fr(x) - 1 && x > 26 ? HD : x < 18 && y > 16 ? (R() < .5 ? H : HD) : st(x, y), [0, -6, 40, 30]);
    for (let i = 0; i < 7; i++) { const x = R.r(14, 32); P.stroke([[x, -.4 + R() * 2], [x + R.r(2, 4), 2 + R() * 3]], .7, HL); }
  } else if (hs === 'curlyTop' || hs === 'curlyLong') {
    const tight = hs === 'curlyTop';
    const hl = tight ? x => pw([[8, 24], [12, 21], [16, 18], [20, 16], [26, 13.2], [31, 11.8], [35, 11.6], [37.5, 12.5]], x)
      : x => pw([[8, 28], [12, 24], [16, 20], [21, 16], [27, 12.3], [32, 10.8], [36, 11]], x);
    const vol = (x, y) => ((x - 23) / (tight ? 15.8 : 16.5)) ** 2 + ((y - (tight ? 9.5 : 10)) / (tight ? 11.2 : 10.8)) ** 2 <= 1;
    const reg = (x, y) => (inHead(x, y) || vol(x, y)) && y <= hl(x) + (x > 28 && tight ? 1.2 : 0) && x < 38;
    hairMass(reg, HD, [0, -7, 40, 30]);
    for (let i = 0; i < (tight ? 190 : 150); i++) {
      const x = R.r(6, 38), y = R.r(-5, 26); if (!reg(x, y) || inEar(x, y)) continue;
      const r = tight ? R.r(1.3, 1.9) : R.r(1.6, 2.3), side = tight && x < 20 && y > 12, rr = r * (side ? .7 : 1);
      P.ell(x, y, rr, rr, (ux, uy) => { const d = ux - x + uy - y; return d < -r * .7 ? (tight ? HL : H2) : d > r * .6 ? HD : H; }, (ux, uy) => !inEar(ux, uy));
    }
    if (hs === 'curlyLong') { // curls falling over the ear
      const lock = [[16, 12], [23, 14], [23.5, 26], [21, 40], [15, 44], [13, 30]];
      for (let i = 0; i < 70; i++) { const x = R.r(13, 24), y = R.r(12, 44); if (!inPoly(x, y, lock)) continue; const r = R.r(1.5, 2.2); P.ell(x, y, r, r * 1.15, (ux, uy) => ux - x + uy - y < -r * .6 ? H2 : R() < .75 ? H : HD); }
    }
  } else if (hs === 'braid') {
    const hl = x => pw([[8, 24], [11, 20.5], [15, 17], [20, 14], [26, 11], [31, 9.6], [35, 9.8], [37, 10.8]], x);
    hairMass((x, y) => inHead(x, y) && y <= hl(x), (x, y) => {
      const a = Math.atan2(y - 17.5, x - 11), v = Math.sin(a * 30 + R() * .6), streak = Math.sin(a * 6 + 1) > .7;
      const base = streak ? mix(H, H2, .45) : H; return v > .7 ? dk(base, .72) : v < -.85 ? lt(base, .2) : base;
    });
    P.ell(11.8, 17.6, 1.5, 1.8, '#2a2a2a'); // tie at the back
  } else if (hs === 'quiff') {
    const hl = x => pw([[9, 25], [12, 21.5], [16, 18.5], [20, 15.5], [25, 12.5], [30, 11], [34, 10.4], [37, 10.6]], x);
    hairMass((x, y) => inHead(x, y) && y <= hl(x) && y > 7.5, (x, y) => y > hl(x) - 1.2 ? mix(H, S, .62) : x < 27 ? (R() < .5 ? mix(H, S, .38) : mix(H, S, .22)) : H); // faded sides
    const top = (x, y) => (((x - 25) / 13) ** 2 + ((y - 5.5) / 6.4) ** 2 <= 1 || ((x - 33) / 5.2) ** 2 + ((y - 4.2) / 4.4) ** 2 <= 1) && y < 10 + (x > 30 ? 1.5 : 0);
    const st = strands(18, 14, 7, .2);
    hairMass(top, (x, y) => !top(x, y - 1.3) ? (R() < .6 ? H2 : lt(H2, .1)) : st(x, y), [8, -6, 40, 14]); // swept top with lighter tips
  } else if (hs === 'sidePart') {
    const hl = x => pw([[8, 26], [12, 22.5], [16, 19], [20, 16], [25, 13.4], [30, 12], [34, 11.6], [37.3, 12.4]], x);
    const vol = (x, y) => { const a = Math.atan2(y - 9.5, x - 23), r = 1 + .035 * Math.sin(a * 9) + .025 * Math.sin(a * 15 + 2); return ((x - 23) / (15.8 * r)) ** 2 + ((y - 9.5) / (11.2 * r)) ** 2 <= 1; };
    const st = strands(27, -4, 10, .3);
    hairMass((x, y) => (inHead(x, y) || vol(x, y)) && y <= hl(x) && x < 38.5, (x, y) => {
      if (((x - 25) / 9) ** 2 + ((y - 1.5) / 2.2) ** 2 < 1) return R() < .6 ? HL : H; // sheen
      return x < 18 && y > 15 ? (R() < .6 ? H : HD) : st(x, y);
    }, [0, -7, 40, 30]);
    P.line(27, -2.5, 25.5, 3, HL); // parting
  } else if (hs === 'cap') {
    const CP = def.cap || '#f2f2f2', CD = dk(CP, .8), CL = lt(CP, .3);
    const hl = x => pw([[8, 26], [12, 22], [16, 19], [20, 16.5], [24, 14.4], [30, 13.6], [37, 13.6]], x);
    hairMass((x, y) => inHead(x, y) && y <= hl(x) && y > 12, (x, y) => y > hl(x) - 1 ? mix(H, S, .5) : R() < .2 ? HL : H); // short hair under the cap
    const crown = (x, y) => ((x - 23.8) / 15.3) ** 2 + ((y - 9) / 9) ** 2 <= 1 && y < 14 && x < 36.8;
    P.fill(crown, (x, y) => x < 17 ? CD : y < 3.5 && x > 22 ? CL : CP, [6, -2, 40, 15]);
    P.line(9.5, 13.6, 36.6, 13.6, dk(CP, .7));
    P.stroke([[23.5, .2], [18, 13.4]], .6, dk(CP, .82)); P.stroke([[23.5, .2], [30, 13.4]], .6, dk(CP, .82));
    P.ell(23.5, .3, 1.3, .8, dk(CP, .75));
    P.poly([[33, 12.4], [44, 12.9], [47, 14.2], [45.8, 15.4], [34, 15.2]], CP);
    P.line(34, 15.2, 45.8, 15.4, dk(CP, .6)); P.line(44, 12.9, 47, 14.2, CL);
    P.fill((x, y) => inHead(x, y) && y > 14.8 && y < 16.8 && x > 28, (x, y, a, b, o) => o ? dk(o, .82) : null);
    for (const [x, y] of [[30.5, 10], [31.5, 10], [33, 10], [34, 10.2], [31, 11.2], [32.5, 11.2]]) P.dot(x, y, '#2a2a2a'); // logo
  }

  // ---- beard
  const bd = def.beard;
  const lips = (x, y) => x >= 34 && x <= 38.5 && y >= 31.8 && y <= 33.8;
  const jawBand = (x, y, w) => inHead(x, y) && !inHead(x, y + w) && (x < 36 || y > 33);
  if (bd === 'trim' || bd === 'light') {
    const lift = bd === 'light' ? 1.2 : 0;
    const top = x => x < 20.2 ? 29 : x < 23.6 ? 17.5 + (x < 21 ? 3 : 0) : x < 28 ? lerp(27.5, 30, (x - 23.6) / 4.4) + lift : x < 33 ? lerp(30, 30.5, (x - 28) / 5) + lift * .5 : 30;
    P.fill((x, y) => inHead(x, y) && !inEar(x, y) && !(x < 20.2 && y < 28) && y >= top(x) && !lips(x, y), (x, y, a, b, o) => {
      const fringe = y < top(x) + 2, deep = y > 36 || (x > 30 && y > 33);
      return fringe ? (R() < .4 ? BRL : o) : deep ? (R() < (bd === 'light' ? .3 : .2) ? BRL : BRD) : (R() < .42 ? BRL : R() < .2 ? mix(BRD, S, .2) : BRD);
    }, [12, 14, 42, 44]);
    P.fill((x, y) => x > 32.8 && x < 39.2 && y > 29.6 && y < 31.4 && inHead(x, y), (x) => x < 33.8 ? BRL : BRD);
  } else if (bd === 'goatee' || bd === 'chin') {
    P.fill((x, y) => jawBand(x, y, bd === 'chin' ? 2.4 : 1.8) && x > 19, (x, y, a, b, o) => R() < (bd === 'chin' ? .7 : .42) ? (R() < .5 ? BRL : BRD) : o, [14, 26, 42, 44]);
    P.fill((x, y) => inHead(x, y) && x > 31 && y > 34 && !lips(x, y), (x, y, a, b, o) => R() < .82 ? (R() < .2 ? BRL : BRD) : o, [30, 33, 42, 44]);
    P.fill((x, y) => x > 33.4 && x < 39 && y > 29.8 && y < 31.2 && inHead(x, y), (x, y, a, b, o) => R() < (bd === 'chin' ? .7 : .85) ? BRD : o);
    P.fill((x, y) => x > 35 && x < 37.4 && y > 33.8 && y < 34.8, BRD);
  }
  // ---- nose
  const noseDx = (def.face && def.face.nose) != null ? def.face.nose : fem ? -1 : 0;
  P.stroke([[35.6, 21.2], [38.3 + noseDx * .6, 25.2]], .7, SL);
  P.poly([[34.2, 23], [35.4, 22.6], [37.2 + noseDx * .5, 28], [34.8, 28.2]], (x, y, a, b, o) => o === S || o === SL ? SS : null);
  P.dot(36.2 + noseDx * .4, 28.4, SD); P.dot(37.2 + noseDx * .5, 28.4, SDD); P.dot(39.3 + noseDx, 26.3, SLL);
  P.line(36.8, 29.5, 38.2 + noseDx * .3, 29.5, SS);
  // ---- mouth
  const LIP = fem ? mix(S, '#b04858', .45) : mix(S, '#8a3a30', .35), LIPD = dk(LIP, .72), LIPL = lt(LIP, .15), TEETH = '#f4eee4', MOUTH = '#4a1418';
  const smile = E === 'happy' || E === 'proud' || (def.smile && (E === 'normal' || E === 'blink'));
  const mouthNeutral = () => { P.line(34.2, 32.4, 38.3, 32.6, LIPD); P.line(34.8, 31.6, 38.2, 31.8, LIP); P.line(34.8, 33.3, 37.6, 33.4, LIPL); P.dot(33.9, 32.4, SD); if (fem) P.line(35, 33.9, 37.2, 33.9, LIP); };
  const mouthSmile = () => {
    P.poly([[33.4, 31.4], [38.6, 31.6], [38.1, 33.9], [35, 34.3]], MOUTH);
    P.poly([[33.8, 31.6], [38.5, 31.8], [38.3, 32.8], [34.6, 32.7]], TEETH);
    P.line(33.4, 31.2, 38.4, 31.4, LIPD); P.line(35, 34.4, 38, 34.1, LIP); P.dot(33, 30.7, SD); P.dot(32.8, 30.2, SD);
    P.ell(31.4, 28.6, 1.5, 1, (x, y, a, b, o) => o === S ? SL : null);
  };
  const mouthOpen = big => { P.ell(36.4, 33, big ? 2.1 : 1.5, big ? 1.8 : 1.1, MOUTH); P.line(35, 31.6, 37.8, 31.7, TEETH); };
  if (E === 'angry') { P.poly([[33.8, 31.6], [38.5, 31.8], [38.3, 33.4], [34.2, 33.2]], TEETH); P.line(33.8, 31.4, 38.5, 31.6, LIPD); P.line(34.2, 33.5, 38.2, 33.6, LIPD); P.line(34.2, 32.5, 38.4, 32.6, '#b8b0a4'); }
  else if (E === 'hurt' || E === 'ko') mouthOpen(true);
  else if (E === 'talk') mouthOpen(false);
  else if (E === 'sad') P.arc(36.3, 34, 2.2, 1.2, Math.PI * 1.1, Math.PI * 1.9, LIPD);
  else if (smile) mouthSmile();
  else mouthNeutral();
  // ---- eyes
  const EX = 29.8, EY = 21.4, IRIS = def.eyeCol || '#3c2819', PUP = dk(IRIS, .45), LASH = '#1a120d', WHITE = '#eee6da';
  const squint = smile && E !== 'happy';
  const eyeOpen = (narrow) => {
    const ry = narrow ? .75 : squint ? 1 : 1.3, rx = fem ? 3.1 : 2.9;
    P.ell(EX, EY, rx, ry, WHITE);
    P.ell(EX + .4, EY + .1, 1.3, Math.min(1.3, ry + .15), IRIS, (x, y) => ((x - EX) / rx) ** 2 + ((y - EY) / ry) ** 2 <= 1.05);
    P.ell(EX + .6, EY + .1, .55, .6, PUP); P.dot(EX - .2, EY - .5, '#ffffff');
    P.arc(EX, EY + .15, rx + .25, ry + .45, Math.PI * 1.02, Math.PI * 1.98, LASH);
    if (fem) { P.arc(EX, EY + .15, rx + .25, ry + .9, Math.PI * 1.1, Math.PI * 1.6, LASH); P.line(EX - rx - .2, EY - .2, EX - rx - 1.3, EY - 1, LASH); }
    P.arc(EX, EY - .1, rx - .2, ry + .5, Math.PI * .15, Math.PI * .85, SS);
    // far eye (seen from the side)
    P.ell(36.3, EY, .85, ry * .85, WHITE); P.ell(36.5, EY + .1, .7, Math.min(.8, ry * .8), IRIS);
    P.line(35.4, EY - ry - .45, 37.1, EY - ry - .35, LASH);
  };
  const eyesShut = (up) => {
    if (up) { P.arc(EX, EY + .6, 2.8, 1.3, Math.PI * 1.1, Math.PI * 1.9, LASH); P.arc(36.3, EY + .5, .9, .8, Math.PI * 1.1, Math.PI * 1.9, LASH); }
    else { P.arc(EX, EY - .6, 2.8, 1, Math.PI * .1, Math.PI * .9, LASH); P.line(35.4, EY + .3, 37, EY + .3, LASH); }
    if (fem) P.line(EX - 3, EY, EX - 4, EY - .8, LASH);
  };
  // ---- brows
  const BR = def.browCol || dk(H, .78), bth = def.browTh || (fem ? .9 : 1.3);
  const brows = t => {
    const near = t === 'angry' ? [[25, 16.6], [28.8, 17.7], [32.8, 19.2]] : t === 'worried' ? [[25.2, 18.5], [29, 17.4], [32.6, 16.4]] : fem ? [[25.2, 18.2], [28, 16.8], [31, 16.9], [32.8, 17.8]] : [[25.2, 18.1], [28.5, 17.2], [32.8, 17.5]];
    P.stroke(near, bth, BR);
    const far = t === 'angry' ? [[35.2, 19], [37.6, 18.3]] : t === 'worried' ? [[35.2, 17.4], [37.4, 18.2]] : [[35.2, 18.1], [37.6, 18]];
    P.stroke(far, bth * .8, BR);
  };
  if (E === 'angry') { eyeOpen(true); brows('angry'); }
  else if (E === 'hurt') { eyesShut(false); brows('worried'); }
  else if (E === 'ko') { P.line(27.8, 20.2, 31.8, 22.8, LASH); P.line(27.8, 22.8, 31.8, 20.2, LASH); P.line(35.5, 20.8, 37, 22, LASH); brows('worried'); }
  else if (E === 'happy' || E === 'proud') { eyesShut(true); brows(); }
  else if (E === 'blink' || E === 'sleepy') { eyesShut(false); brows(); }
  else if (E === 'sad') { eyeOpen(); brows('worried'); }
  else { eyeOpen(); brows(); }
  // ---- glasses
  const gl = (def.acc || []).includes('glasses') ? (def.glasses || 'round') : null;
  if (gl) {
    const F = def.glassesCol || '#2a2434', FL = lt(F, .4), FD = dk(F, .7);
    if (gl === 'round') {
      P.ell(30, 21.6, 5.1, 4.7, (x, y, a, b, o) => o ? mix(o, '#dfe8f0', .14) : null);
      P.ring(30, 21.6, 5.3, 4.9, (x, y) => y < 19.5 ? FL : y > 24 ? FD : F);
      P.arc(37.2, 21.6, 2.4, 4.8, -Math.PI * .5, Math.PI * .5, F);
      P.line(35, 19.4, 36.6, 19.2, F);
      P.line(19.3, 21.2, 24.8, 20.4, F);
    } else {
      const inRR = (x, y, x0, y0, x1, y1, r) => { const qx = clamp(x, x0 + r, x1 - r), qy = clamp(y, y0 + r, y1 - r); return (x - qx) ** 2 + (y - qy) ** 2 <= r * r; };
      const o1 = 1 / HEAD_F;
      P.fill((x, y) => inRR(x, y, 24.4, 18, 35.2, 25.4, 1.5), (x, y, a, b, o) => {
        const inner = inRR(x, y, 24.4 + o1, 18 + o1 * 2, 35.2 - o1, 25.4 - o1, 1);
        return inner ? (o ? mix(o, '#dfe8f0', .12) : null) : (y < 19.5 ? FD : F);
      }, [23, 16, 37, 27]);
      P.stroke([[36.4, 18.3], [39.9, 18.6]], .9, FD); P.stroke([[39.9, 18.6], [39.9, 24.6]], .7, F); P.stroke([[36.4, 25.2], [39.9, 24.8]], .7, F);
      P.stroke([[35.2, 19.4], [36.4, 19.2]], .7, F);
      P.stroke([[19, 21.2], [24.4, 19.2]], 1, F);
    }
    P.dot(26.4, 18.9, '#ffffff'); P.dot(27.3, 18.9, '#f4f8ff');
  }
  if (def.sunHead) { // sunglasses resting on the hair
    P.ell(28.4, 4.8, 3.6, 2, '#16161c'); P.ell(35.2, 5.2, 1.7, 1.9, '#16161c');
    P.line(24.6, 3.4, 36.8, 3.6, '#0c0c10'); P.dot(27, 4, '#6a7890'); P.dot(27.8, 4, '#4a5870');
    P.line(18, 6.5, 24.8, 4.2, '#0c0c10');
  }
  if (def.earrings) {
    const big = def.earrings === 'big', ec = def.earCol || '#d8d8e0';
    P.ring(ear.x + .2, ear.y + ear.ry + (big ? 1.8 : .9), big ? 2.3 : 1.1, big ? 2.6 : 1.3, (x, y) => big && ((x * 3 + y * 5) | 0) % 3 === 0 ? dk(ec, .6) : ec, big ? 2 : 1);
  }
  return G;
}
const _headsHD = new Map();
// canvas + anchor (the neck base, in canvas pixels) so the body can place the head
function headCanvasHD(def, expr, rot) {
  const key = def.id + '|' + expr + '|' + (rot ? 1 : 0); let c = _headsHD.get(key); if (c) return c;
  const G = paintHeadHD(def, expr), f = HEAD_F, ax = 25 * f + 1, ay = (50 + HEAD_OY) * f + 1;
  if (!rot) { c = hdGridCanvas(G); c.anchor = { x: ax, y: ay }; }
  else { const Gr = G.rotCCW(); c = hdGridCanvas(Gr); c.anchor = { x: ay, y: G.w + 1 - ax }; }
  _headsHD.set(key, c); return c;
}

// ============================================================
//  PORTRAIT (72x72, front view, face fills the frame) — HUD, select, cut-in
// ============================================================
const PORT = 72;
function paintPortraitHD(def, expr) {
  const G = new PGrid(PORT, PORT), P = gridPainter(G, 1, 0), R = RNG((def.seed || 7) * 17 + 11);
  G.noOut = new Set();
  const S = def.skin, SS = dk(S, .86), SD = dk(S, .72), SDD = dk(S, .58), SL = lt(S, .15), SLL = lt(S, .28);
  const H = def.hair, H2 = def.hair2 || lt(H, .28), HD = dk(H, .68), HL = lt(H, .22);
  const BRD = def.beardCol || H, BRL = mix(BRD, S, .45);
  const E = expr || 'normal', fem = !!def.fem, hs = def.hairStyle, cx = 36, fa = def.face || {};
  const jw = fa.jaw || 0, chin = fa.chin || 0;
  const HWm = [[9, 7], [11, 11], [14, 14], [18, 16.3], [26, 17.4], [36, 17.6], [43, 17.1], [48, 15.8 + jw * .3], [53, 14 + jw * .6], [57, 11.8 + jw * .8], [60 + chin * .5, 9.4 + jw * .6], [62.5 + chin, 6.8 + jw * .4], [64 + chin, 3.5]];
  const HWf = [[9, 7], [11, 11], [14, 14], [18, 16], [26, 17], [36, 17], [43, 16.4], [48, 15], [53, 12.8], [57, 10.2], [60, 7.8], [62, 5], [63.2, 2.5]];
  const HWT = fem ? HWf : HWm, bottom = HWT[HWT.length - 1][0];
  const halfW = y => y < 9 || y > bottom ? -1 : pw(HWT, y);
  const inFace = (x, y) => { const w = halfW(y); return w >= 0 && Math.abs(x - cx) <= w; };
  const earY = 41, earX = d => cx + d * (pw(HWT, earY) + .6);

  // ---- long hair behind (curls)
  if (hs === 'curlyLong') for (const d of [-1, 1]) for (let i = 0; i < 120; i++) { const x = cx + d * R.r(12, 27), y = R.r(16, 74), r = R.r(1.8, 2.8); P.ell(x, y, r, r * 1.1, (ux, uy) => ux - x + uy - y < -r * .6 ? H2 : R() < .72 ? H : HD); }
  // ---- neck & shoulders / clothes
  const top = def.top || 'tee', body = (x, y) => y >= 62 && Math.abs(x - cx) <= Math.min(37, 9.5 + (y - 62) * 4);
  const neckW = fem ? 7.6 : 9.2;
  P.fill((x, y) => y > 48 && y < 72 && Math.abs(x - cx) <= neckW + Math.max(0, y - 63) * 1.3, (x) => x < cx - neckW + 3 ? SD : x > cx + neckW - 3 ? SS : S);
  const skinBody = top === 'bare' || top === 'crop' || top === 'tank';
  if (skinBody) {
    P.fill(body, (x) => Math.abs(x - cx) > 26 ? SD : Math.abs(x - cx) > 20 ? SS : S);
    if (top === 'bare') { P.stroke([[cx - 6, 67.5], [cx - 20, 69.5]], .8, SD); P.stroke([[cx + 6, 67.5], [cx + 20, 69.5]], .8, SD); P.stroke([[cx - 8, 66.6], [cx - 18, 68.2]], .7, SL); P.stroke([[cx + 8, 66.6], [cx + 18, 68.2]], .7, SL); }
    if (top === 'crop') { const sc = def.cropCol || '#1a1a1e'; P.stroke([[cx - 12, 63], [cx - 13, 72]], 1.3, sc); P.stroke([[cx + 12, 63], [cx + 13, 72]], 1.3, sc); }
    if (top === 'tank') {
      const t = def.shirt; P.fill((x, y) => body(x, y) && y > 69.5 - Math.cos((x - cx) / 9) * 1.5, t);
      P.stroke([[cx - 14, 63], [cx - 15, 72]], 3.2, t); P.stroke([[cx + 14, 63], [cx + 15, 72]], 3.2, t);
      P.fill((x, y) => body(x, y) && y > 69, (x, y, a, b, o) => o === t && x % 2 ? dk(t, .9) : null);
    }
  } else {
    const base = top === 'openShirt' || top === 'suit' ? def.jacket : def.shirt, T = fabric(base);
    P.fill(body, (x) => Math.abs(x - cx) > 27 ? T.d : T.b);
    if (def.vstripes) P.fill(body, (x) => (Math.floor((x - cx + 100) / 3) % 2) ? def.vstripes : null);
    if (top === 'tee') P.ring(cx, 64.5, neckW + 1.8, 4.4, T.dd, 1.4, (x, y) => y > 63);
    if (top === 'hoodie') { P.ring(cx, 65, neckW + 5, 6, T.d, 3.2, (x, y) => y > 61); P.stroke([[cx - 3, 67], [cx - 3.5, 72]], .8, '#f0f0f0'); P.stroke([[cx + 3, 67], [cx + 3.5, 72]], .8, '#f0f0f0'); }
    if (top === 'openShirt') {
      P.fill((x, y) => body(x, y) && y > 63 && Math.abs(x - cx) < 9 - (y - 63) * .2, (x, y) => y < 67 - Math.abs(x - cx) * .1 ? S : def.shirt);
      P.poly([[cx - 10.5, 62.5], [cx - 7, 62], [cx - 6.5, 70], [cx - 13, 66]], T.l); P.poly([[cx + 10.5, 62.5], [cx + 7, 62], [cx + 6.5, 70], [cx + 13, 66]], T.l);
    }
    if (top === 'suit') {
      P.fill((x, y) => body(x, y) && y > 62 && Math.abs(x - cx) < 8.5 - (y - 62) * .9, def.shirt);
      if (def.necktie) { P.poly([[cx - 2, 63], [cx + 2, 63], [cx + 1.4, 65.4], [cx - 1.4, 65.4]], dk(def.necktie, .82)); P.poly([[cx - 1.4, 65.4], [cx + 1.4, 65.4], [cx + 2.6, 72], [cx - 2.6, 72]], (x, y) => (Math.floor(x) + Math.floor(y)) % 3 ? def.necktie : dk(def.necktie, .6)); }
      P.stroke([[cx - 8.5, 62], [cx - 2.5, 72]], .8, T.dd); P.stroke([[cx + 8.5, 62], [cx + 2.5, 72]], .8, T.dd);
      P.poly([[cx - 8, 62], [cx - 3.5, 62.5], [cx - 5, 66]], def.shirt); P.poly([[cx + 8, 62], [cx + 3.5, 62.5], [cx + 5, 66]], def.shirt);
    }
  }
  P.fill((x, y) => y > 68 && G.get(Math.floor(x), Math.floor(y)), (x, y, gx, gy) => { G.noOut.add(gy * G.w + gx); return null; });
  if (def.neck === 'chain' || def.neck === 'pendant' || def.neck === 'goldChain') {
    const col = def.neck === 'goldChain' ? '#e8c060' : '#d8dce4', low = def.neck === 'goldChain' ? 70 : 71;
    P.stroke([[cx - neckW + 1, 62], [cx, low], [cx + neckW - 1, 62]], .7, col);
    if (def.neck === 'pendant') P.poly([[cx - .8, 69.5], [cx + .8, 69.5], [cx + .8, 72], [cx - .8, 72]], '#8a909a');
  }
  if (def.neck === 'choker') for (let i = -4; i <= 4; i++) P.ell(cx + i * 2, 58.6 + Math.abs(i) * .12, .9, .9, i % 2 ? '#c8b8e8' : '#f4f4f8');
  // ---- head shape
  P.fill(inFace, (x, y) => x > cx + halfW(y) - 3.4 ? SS : x < cx - halfW(y) + 1.6 ? SS : S, [10, 8, 62, 66]);
  P.fill((x, y) => !inFace(x, y) && y > 50 && y < bottom + 3 && Math.abs(x - cx) < neckW + 1, SDD);
  P.ell(cx - 3, 22, 8, 3.6, (x, y, a, b, o) => o === S ? SL : null);
  for (const d of [-1, 1]) P.ell(cx + d * 10.5, 42, 3.4, 1.8, (x, y, a, b, o) => o === S ? (d < 0 ? SL : S) : null);
  if (def.blush) for (const d of [-1, 1]) P.ell(cx + d * 10, 44.5, 3.6, 2, (x, y, a, b, o) => o ? mix(o, '#e05a5a', .2) : null);
  for (const d of [-1, 1]) { const ex = earX(d); P.ell(ex, earY, 2.4, 5.4, d < 0 ? S : SS, (x, y) => !inFace(x, y)); P.line(ex + d * .3, earY - 3, ex + d * .3, earY + 3, SD); }
  // ---- hair (front view)
  const hairFill = (test, colFn) => P.fill(test, colFn, [0, 0, 72, 72]);
  const sideCap = (x, y, w, hy) => y < hy && (inFace(x, y) || (((x - cx) / w) ** 2 + ((y - 20) / 15) ** 2 <= 1));
  if (hs === 'buzz') {
    const hl = x => { const d = Math.abs(x - cx); return 19.5 + (d > 8 ? (d - 8) * .55 : 0) + (d > 14 ? (d - 14) * 2.4 : 0); };
    hairFill((x, y) => sideCap(x, y, 18.4, hl(x)), (x, y) => {
      const d = Math.abs(x - cx), edge = y > hl(x) - 1.2;
      if (edge) return R() < .6 ? mix(H, S, .45) : mix(H, S, .68);
      if (d > 12.5) return R() < .5 ? mix(H, S, .4) : mix(H, S, .25);
      return y < 12 && R() < .3 ? HL : R() < .14 ? HL : H;
    });
  } else if (hs === 'messy') {
    const fr = x => { const d = Math.abs(x - cx); return d < 14 ? 23 + (def.fringe || 1.6) * 1.4 + 2.6 * Math.abs(Math.sin(x * .8 + .5)) : d < 16.5 ? 30 : 36; };
    hairFill((x, y) => y < fr(x) && (((x - cx) / 20.8) ** 2 + ((y - 19) / 16) ** 2 <= 1) && y > 2, (x, y) => {
      const a = Math.atan2(y - 8, x - cx - 3), v = Math.sin(a * 13 + (R() - .5)); return y > fr(x) - 1.3 ? HD : v > .6 ? HD : v < -.8 ? HL : H;
    });
    for (let i = 0; i < 9; i++) { const x = R.r(cx - 12, cx + 12); P.stroke([[x, 5 + R() * 3], [x + R.r(-3, 4), 11 + R() * 4]], .7, HL); }
  } else if (hs === 'curlyTop' || hs === 'curlyLong') {
    const tight = hs === 'curlyTop', hy = tight ? 22.5 : 21, reg = (x, y) => y > 1 && ((x - cx) / (tight ? 20.5 : 19.8)) ** 2 + ((y - 17) / 15.5) ** 2 <= 1 && (y < hy + (Math.abs(x - cx) > 15 ? 12 : 0));
    hairFill(reg, HD);
    for (let i = 0; i < 220; i++) { const x = R.r(10, 62), y = R.r(1, hy + 10); if (!reg(x, y)) continue; const r = tight ? R.r(1.7, 2.4) : R.r(2, 2.8); P.ell(x, y, r, r, (ux, uy) => ux - x + uy - y < -r * .7 ? (tight ? HL : H2) : ux - x + uy - y > r * .6 ? HD : H, reg); }
    if (tight) for (let i = 0; i < 10; i++) { const x = R.r(cx - 10, cx + 10); P.ell(x, R.r(21, 24), 2, 2, (ux, uy) => uy < 22 ? H : HD); }
    else P.stroke([[cx - 1, 4], [cx - 1.5, 13]], .7, mix(H, S, .5)); // centre parting
  } else if (hs === 'braid') {
    const hl = x => { const d = Math.abs(x - cx); return 20 + (d > 10 ? (d - 10) * .9 : 0) + (d > 15 ? (d - 15) * 3 : 0); };
    hairFill((x, y) => sideCap(x, y, 18.6, hl(x)), (x, y) => {
      const a = Math.atan2(y - 40, x - cx), v = Math.sin(a * 40 + R() * .6), streak = Math.sin((x - cx) * .5) > .6;
      const base = streak ? mix(H, H2, .5) : H; return v > .75 ? dk(base, .72) : v < -.85 ? lt(base, .2) : base;
    });
    P.stroke([[cx - 5, 3.5], [cx - 4.5, 13]], .6, mix(H, S, .4));
    for (let i = 0; i < 6; i++) { const y = 46 + i * 5, col = mix(H, H2, i / 5); P.ell(cx + 20.5 + (i % 2) * .8, y, 3, 3.2, col); P.arc(cx + 20.5 + (i % 2) * .8, y, 3, 3.2, .3, 2.8, dk(col, .65)); }
  } else if (hs === 'quiff') {
    const hl = x => { const d = Math.abs(x - cx); return 19 + (d > 9 ? (d - 9) * .6 : 0) + (d > 14 ? (d - 14) * 2.2 : 0); };
    hairFill((x, y) => sideCap(x, y, 18.4, hl(x)) && y > 10, (x) => Math.abs(x - cx) > 12 ? (R() < .5 ? mix(H, S, .4) : mix(H, S, .22)) : H);
    const top = (x, y) => ((x - cx - 1) / 15) ** 2 + ((y - 11) / 9.5) ** 2 <= 1 && y < 20;
    hairFill(top, (x, y) => !top(x, y - 1.6) ? (R() < .6 ? H2 : lt(H2, .12)) : ((Math.floor(x * 3 + y * 5) + (R() * 3 | 0)) % 7 === 0 ? HD : R() < .15 ? HL : H));
  } else if (hs === 'sidePart') {
    const hl = x => { const d = Math.abs(x - cx); return 20.5 + (d > 10 ? (d - 10) * .6 : 0) + (d > 15 ? (d - 15) * 2.4 : 0); };
    hairFill((x, y) => (sideCap(x, y, 19.8, hl(x)) || (((x - cx) / 19.8) ** 2 + ((y - 16) / 13.8) ** 2 <= 1 && y < hl(x))) && y > 1.5, (x, y) => {
      if (((x - cx - 3) / 10) ** 2 + ((y - 8) / 2.6) ** 2 < 1) return R() < .6 ? HL : H;
      const a = Math.atan2(y - 2, x - (cx - 7)), v = Math.sin(a * 16 + R() * .8); return v > .6 ? HD : H;
    });
    P.stroke([[cx - 7, 3], [cx - 7.5, 12]], .6, mix(H, S, .35));
  } else if (hs === 'cap') {
    const CP = def.cap || '#f2f2f2', CD = dk(CP, .82), CL = lt(CP, .3);
    hairFill((x, y) => Math.abs(x - cx) > 14.5 && y > 20 && y < 36 && inFace(x, y), () => R() < .2 ? HL : H);
    const crown = (x, y) => ((x - cx) / 19.2) ** 2 + ((y - 19) / 15.5) ** 2 <= 1 && y < 22.5;
    hairFill(crown, (x, y) => Math.abs(x - cx) > 14 ? CD : y < 9 ? CL : CP);
    P.line(cx, 4, cx, 22, CD); P.stroke([[cx - 9, 6], [cx - 12, 22]], .5, CD); P.stroke([[cx + 9, 6], [cx + 12, 22]], .5, CD);
    for (const [x, y] of [[-3, 15], [-2, 15], [0, 15], [1, 15], [3, 15], [-2, 16.5], [0, 16.5], [2, 16.5]]) P.dot(cx + x, y, '#2a2a2a');
    P.fill((x, y) => ((x - cx - 1) / 21.5) ** 2 + ((y - 22.2) / 4.6) ** 2 <= 1 && y > 21.5, (x, y) => y > 25 ? dk(CP, .62) : CP);
    P.fill((x, y) => inFace(x, y) && y > 26.5 && y < 29, (x, y, a, b, o) => o ? dk(o, .84) : null);
  }
  // ---- beard (front)
  const bd = def.beard, mouthY = 51.5;
  const inLips = (x, y) => Math.abs(x - cx) < 5.2 && y > mouthY - 1.6 && y < mouthY + 2.2;
  const nearEdge = (x, y, w) => inFace(x, y) && (!inFace(x - w, y) || !inFace(x + w, y) || !inFace(x, y + w));
  if (bd === 'trim' || bd === 'light') {
    const lift = bd === 'light' ? 1.5 : 0, cheekY = d => 40 + lift + Math.max(0, 12 - d) * .35 + (d < 6 ? 1.5 : 0);
    P.fill((x, y) => inFace(x, y) && !inLips(x, y) && ((Math.abs(x - cx) > 15 && y > 30) || y > cheekY(Math.abs(x - cx))), (x, y, a, b, o) => {
      const d = Math.abs(x - cx);
      if (d <= 15 && y < cheekY(d) + 1.6) return R() < .5 ? BRL : o;
      return R() < (bd === 'light' ? .28 : .18) ? BRL : R() < .3 ? dk(BRD, .82) : BRD;
    }, [10, 28, 62, 66]);
    P.fill((x, y) => Math.abs(x - cx) < 6.4 && y > mouthY - 3.6 && y < mouthY - 1.5, (x) => Math.abs(x - cx) > 5.4 ? BRL : BRD);
  } else if (bd === 'goatee' || bd === 'chin') {
    P.fill((x, y) => nearEdge(x, y, bd === 'chin' ? 2.6 : 1.8) && y > 44, (x, y, a, b, o) => R() < (bd === 'chin' ? .7 : .4) ? (R() < .5 ? BRL : BRD) : o, [10, 40, 62, 66]);
    P.fill((x, y) => inFace(x, y) && Math.abs(x - cx) < 6.2 - Math.max(0, y - 58) * .3 && y > mouthY + 2.3, (x, y, a, b, o) => R() < .85 ? (R() < .2 ? BRL : BRD) : o, [26, 50, 46, 66]);
    P.fill((x, y) => Math.abs(x - cx) < 5.8 && y > mouthY - 3.3 && y < mouthY - 1.6, (x, y, a, b, o) => R() < (bd === 'chin' ? .7 : .88) ? BRD : o);
  }
  // ---- nose
  P.stroke([[cx + .6, 35.5], [cx + .9, 43.5]], .7, SL);
  P.fill((x, y) => x > cx + 1.8 && x < cx + 3.2 && y > 37 && y < 44.5, (x, y, a, b, o) => o === S || o === SL ? SS : null);
  P.ell(cx + .6, 45.2, 2.1, 1.3, (x, y, a, b, o) => o === S || o === SL ? (y < 45 ? SLL : S) : null);
  P.dot(cx - 2.4, 46.4, SDD); P.dot(cx + 3.4, 46.4, SDD); P.arc(cx + .6, 45.6, 3.4, 1.6, .2, 2.9, SD);
  // ---- mouth
  const LIP = fem ? mix(S, '#b04858', .5) : mix(S, '#8a3a30', .38), LIPD = dk(LIP, .72), LIPL = lt(LIP, .15), TEETH = '#f4eee4', MOUTH = '#4a1418';
  const smile = E === 'happy' || E === 'proud' || (def.smile && (E === 'normal' || E === 'blink'));
  if (E === 'angry') { P.poly([[cx - 5, mouthY - 1], [cx + 5, mouthY - 1], [cx + 4.5, mouthY + 1.5], [cx - 4.5, mouthY + 1.5]], TEETH); P.line(cx - 5, mouthY - 1.4, cx + 5, mouthY - 1.4, LIPD); P.line(cx - 4.5, mouthY + 1.8, cx + 4.5, mouthY + 1.8, LIPD); P.line(cx - 4.5, mouthY + .2, cx + 4.5, mouthY + .2, '#b8b0a4'); }
  else if (E === 'hurt' || E === 'ko') { P.ell(cx + .3, mouthY + .8, 3.6, 2.8, MOUTH); P.line(cx - 2.5, mouthY - 1.4, cx + 3, mouthY - 1.4, TEETH); }
  else if (E === 'talk') { P.ell(cx + .3, mouthY + .4, 3, 1.8, MOUTH); P.line(cx - 2, mouthY - 1, cx + 2.5, mouthY - 1, TEETH); }
  else if (smile) {
    P.poly([[cx - 6.6, mouthY - 1.6], [cx + 6.8, mouthY - 1.6], [cx + 4.4, mouthY + 2.8], [cx - 4.2, mouthY + 2.8]], MOUTH);
    P.poly([[cx - 6, mouthY - 1.3], [cx + 6.2, mouthY - 1.3], [cx + 5.4, mouthY + .6], [cx - 5.2, mouthY + .6]], TEETH);
    P.line(cx - 6.6, mouthY - 1.9, cx + 6.8, mouthY - 1.9, LIPD); P.stroke([[cx - 4, mouthY + 3.3], [cx + 4.2, mouthY + 3.3]], .8, LIP);
    P.dot(cx - 7.4, mouthY - 2.6, SD); P.dot(cx + 7.6, mouthY - 2.6, SD);
    for (const d of [-1, 1]) P.ell(cx + d * 10.5, 45.5, 3, 1.6, (x, y, a, b, o) => o === S ? SL : null);
  } else if (E === 'sad') P.arc(cx + .3, mouthY + 1.6, 4.4, 1.6, Math.PI * 1.1, Math.PI * 1.9, LIPD);
  else { P.line(cx - 4.6, mouthY, cx + 4.8, mouthY, LIPD); P.stroke([[cx - 3.6, mouthY - .9], [cx - .5, mouthY - 1.3], [cx + 1, mouthY - .9], [cx + 3.8, mouthY - .9]], .7, LIP); P.stroke([[cx - 3.2, mouthY + 1.2], [cx + 3.4, mouthY + 1.2]], fem ? 1.3 : .8, LIPL); }
  // ---- eyes & brows
  const IRIS = def.eyeCol || '#3c2819', PUP = dk(IRIS, .45), LASH = '#1a120d', WHITE = '#eee6da', EY = 35.6;
  const squint = smile && E !== 'happy';
  const eye = (ex, t) => {
    if (t === 'shut') { P.arc(ex, EY - .8, 3.4, 1.2, .2, Math.PI - .2, LASH); return; }
    if (t === 'up') { P.arc(ex, EY + 1, 3.4, 1.8, Math.PI + .3, Math.PI * 2 - .3, LASH); return; }
    if (t === 'x') { P.line(ex - 2.4, EY - 2, ex + 2.4, EY + 2, LASH); P.line(ex - 2.4, EY + 2, ex + 2.4, EY - 2, LASH); return; }
    const ry = t === 'narrow' ? 1 : squint ? 1.3 : 1.7, rx = fem ? 3.8 : 3.5;
    P.ell(ex, EY, rx, ry, WHITE);
    P.ell(ex + .3, EY + .1, 1.8, Math.min(1.8, ry + .2), IRIS, (x, y) => ((x - ex) / rx) ** 2 + ((y - EY) / ry) ** 2 <= 1.05);
    P.ell(ex + .4, EY + .1, .8, .8, PUP); P.dot(ex - .6, EY - .7, '#ffffff');
    P.arc(ex, EY + .2, rx + .3, ry + .5, Math.PI + .05, Math.PI * 2 - .05, LASH);
    if (fem) { P.arc(ex, EY + .2, rx + .3, ry + 1, Math.PI + .2, Math.PI * 2 - .2, LASH); const o = ex < cx ? -1 : 1; P.line(ex + o * (rx + .2), EY - .3, ex + o * (rx + 1.4), EY - 1.3, LASH); }
    P.arc(ex, EY - .1, rx - .2, ry + .6, .2, Math.PI - .2, SS);
  };
  const BR = def.browCol || dk(H, .78), bth = (def.browTh || (fem ? .9 : 1.3)) * 1.4;
  const brows = t => {
    for (const d of [-1, 1]) {
      const pts = t === 'angry' ? [[cx + d * 13, 29.5], [cx + d * 8.5, 30.6], [cx + d * 4.2, 32.4]] : t === 'worried' ? [[cx + d * 13, 31.8], [cx + d * 8.5, 30.8], [cx + d * 4.2, 29.8]] : fem ? [[cx + d * 13, 31.4], [cx + d * 10, 29.8], [cx + d * 6.5, 29.9], [cx + d * 4.3, 30.8]] : [[cx + d * 13, 31.2], [cx + d * 9, 30.1], [cx + d * 4.3, 30.7]];
      P.stroke(pts, bth, BR);
    }
  };
  const et = E === 'angry' ? 'narrow' : E === 'hurt' || E === 'blink' || E === 'sleepy' ? 'shut' : E === 'happy' || E === 'proud' ? 'up' : E === 'ko' ? 'x' : 'open';
  eye(cx - 8.4, et); eye(cx + 8.8, et);
  brows(E === 'angry' ? 'angry' : E === 'hurt' || E === 'ko' || E === 'sad' ? 'worried' : null);
  // ---- glasses (front)
  const gl = (def.acc || []).includes('glasses') ? (def.glasses || 'round') : null;
  if (gl) {
    const F = def.glassesCol || '#2a2434', FL = lt(F, .4), FD = dk(F, .7);
    if (gl === 'round') {
      for (const ex of [cx - 8.2, cx + 8.8]) { P.ell(ex, 36, 6, 5.4, (x, y, a, b, o) => o ? mix(o, '#dfe8f0', .12) : null); P.ring(ex, 36, 6.3, 5.7, (x, y) => y < 33 ? FL : y > 39 ? FD : F); }
      P.line(cx - 1.9, 34.2, cx + 2.5, 34.2, F); P.line(cx - 1.6, 32.6, cx + 2.2, 32.6, FL);
      P.line(cx - 14.5, 34.5, earX(-1) + 1, 35, F); P.line(cx + 15.1, 34.5, earX(1) - 1, 35, F);
    } else {
      const inRR = (x, y, x0, y0, x1, y1, r) => { const qx = clamp(x, x0 + r, x1 - r), qy = clamp(y, y0 + r, y1 - r); return (x - qx) ** 2 + (y - qy) ** 2 <= r * r; };
      for (const [x0, x1] of [[cx - 15.4, cx - 1.8], [cx + 2.3, cx + 15.9]]) P.fill((x, y) => inRR(x, y, x0, 31, x1, 40.4, 1.8), (x, y, a, b, o) => inRR(x, y, x0 + 1, 32.8, x1 - 1, 39.4, 1.2) ? (o ? mix(o, '#dfe8f0', .1) : null) : (y < 33 ? FD : F), [x0 - 1, 29, x1 + 1, 42]);
      P.stroke([[cx - 1.8, 33.2], [cx + 2.3, 33.2]], 1, F);
      P.stroke([[cx - 15.4, 33], [earX(-1) + 1, 34]], 1, F); P.stroke([[cx + 15.9, 33], [earX(1) - 1, 34]], 1, F);
    }
    P.dot(cx - 11, 33.4, '#ffffff'); P.dot(cx - 10, 33.4, '#f4f8ff'); P.dot(cx + 6, 33.4, '#ffffff');
  }
  if (def.sunHead) { for (const d of [-1, 1]) P.ell(cx + d * 7.6, 12.5, 6, 3, '#16161c'); P.line(cx - 13.5, 11, cx + 13.5, 11, '#0c0c10'); P.dot(cx - 10, 11.8, '#6a7890'); P.dot(cx + 5, 11.8, '#6a7890'); }
  if (def.earrings) {
    const big = def.earrings === 'big', ec = def.earCol || '#d8d8e0';
    for (const d of [-1, 1]) P.ring(earX(d), earY + 6.6 + (big ? 2 : 0), big ? 2.5 : 1.3, big ? 3 : 1.5, (x, y) => big && ((x * 3 + y * 5) | 0) % 3 === 0 ? dk(ec, .6) : ec, big ? 2 : 1);
  }
  return G;
}
const _portsHD = new Map();
function portraitCanvasHD(def, expr) {
  const key = def.id + '|' + expr; let c = _portsHD.get(key); if (c) return c;
  c = hdGridCanvas(paintPortraitHD(def, expr)); c.hd = 2;
  _portsHD.set(key, c); return c;
}
