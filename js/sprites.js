'use strict';
// ============================================================
//  SPRITES — fighters drawn with frames cut from the design images
//  (tools/build_sprites.py -> assets/fighters/<id>.png + sprites-data.js).
//  A fighter with sprites uses them for every animation; missing poses fall back
//  to the closest one. Fighters without sprites keep the code-drawn look (art_hd.js).
// ============================================================
const ART_PX = 2;   // screen pixels per art pixel (2 = one game unit, the same pixel size as the stages)
const SPRITES = {}; // id -> { meta, img, alt, cache }

// pose -> the pose to use when it hasn't been drawn yet (names from docs/pose-prompts.md;
// the older names stance / walk_1-4 / punch / kick / victory / knockdown / special come from the first sheets)
const SPRITE_FALLBACK = {
  idle_1: 'stance', idle_2: 'idle_1', idle_3: 'idle_2', idle_4: 'idle_1',
  walk_fwd_1: 'walk_1', walk_fwd_2: 'walk_2', walk_fwd_3: 'walk_2', walk_fwd_4: 'walk_3', walk_fwd_5: 'walk_4', walk_fwd_6: 'walk_4',
  walk_back_1: 'walk_fwd_6', walk_back_2: 'walk_fwd_5', walk_back_3: 'walk_fwd_4', walk_back_4: 'walk_fwd_3', walk_back_5: 'walk_fwd_2', walk_back_6: 'walk_fwd_1',
  walk_1: 'stance', walk_2: 'walk_1', walk_3: 'walk_1', walk_4: 'walk_2',
  punch_1: 'stance', punch_2: 'punch', punch: 'stance', strong_1: 'punch_1', strong_2: 'punch_2',
  kick_1: 'stance', kick_2: 'kick', kick: 'stance', block: 'stance', hit: 'stance',
  crouch: 'stance', crouch_block: 'crouch', crouch_punch: 'punch_2', crouch_hit: 'hit', sweep_1: 'crouch', sweep_2: 'kick_2',
  jump_1: 'crouch', jump_2: 'stance', jump_3: 'jump_2', jump_kick: 'kick_2', jump_punch: 'punch_2',
  knockdown_1: 'knockdown', knockdown_2: 'ko', knockdown: 'hit', ko: 'hit', getup_1: 'crouch', getup_2: 'getup_1',
  victory_1: 'victory', victory_2: 'victory_1', victory: 'stance',
  special_1: 'stance', special_2: 'special', special_3: 'special_2', special: 'punch_2',
  // super_* / prop_* (sheet F) have no fallback here: supers.js picks a stand-in pose for each one
};
// game animation -> pose for each keyframe of ANIM[name] (art.js), so the timing is the move's frame data;
// { loop, d } = looping cycle with its own speed (d ticks per frame). A trailing '+' lifts the frame one art
// pixel when the pose is only a stand-in (so a single stance still breathes).
const SPRITE_ANIM = {
  idle: { loop: ['idle_1', 'idle_2+', 'idle_3+', 'idle_4'], d: 11 }, stand: { loop: ['idle_1', 'idle_2+'], d: 22 }, intro: { loop: ['idle_1', 'idle_2+'], d: 22 },
  walkF: { loop: ['walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'], d: 5 },
  walkB: { loop: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6'], d: 6 },
  crouch: ['crouch', 'crouch'], jump: ['jump_1', 'jump_2', 'jump_3', 'jump_3'],
  jab: ['idle_1', 'punch_1', 'punch_2', 'punch_2', 'idle_1', 'idle_1'],
  cross: ['idle_1', 'strong_1', 'strong_2', 'strong_2', 'idle_1', 'idle_1'],
  kick: ['idle_1', 'kick_1', 'kick_2', 'kick_2', 'idle_1', 'idle_1'],
  cpunch: ['crouch', 'crouch_punch', 'crouch_punch', 'crouch_punch', 'crouch', 'crouch'],
  sweep: ['crouch', 'sweep_1', 'sweep_2', 'sweep_2', 'crouch', 'crouch'],
  jkick: ['jump_2', 'jump_kick', 'jump_kick'], jpunch: ['jump_2', 'jump_punch', 'jump_punch'],
  flip: ['special_1', 'special_2', 'special_3'],
  throw: ['idle_1', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  ballkick: ['idle_1', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  blow: ['idle_1', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  snatch: ['idle_1', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  dpunch: ['idle_1', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  charge: ['idle_1', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  pound: ['idle_1', 'crouch', 'special_1', 'special_2', 'special_2', 'special_3', 'idle_1'],
  pico: ['idle_1', 'special_1', 'special_2', 'special_3', 'special_2', 'idle_1', 'idle_1'],
  hit: ['hit', 'hit', 'idle_1', 'idle_1'], hitC: ['crouch_hit', 'crouch', 'crouch'],
  block: ['block'], blockC: ['crouch_block'],
  knock: ['knockdown_1', 'knockdown_2'], lie: ['knockdown_2'], getup: ['knockdown_2', 'getup_1', 'getup_2', 'idle_1'], // knockdown_2 = lying (old sheets: ko)
  win: { loop: ['victory_1', 'victory_2+'], d: 12 }, laugh: { loop: ['victory_1', 'victory_2+'], d: 12 },
};

function loadSprites() {
  if (typeof SPRITE_DATA === 'undefined') return Promise.resolve();
  // a failed load is retried twice (a network hiccup would otherwise leave that fighter code-drawn)
  const img = (src, tries = 3) => new Promise(res => {
    const im = new Image(); im.onload = () => res(im);
    im.onerror = () => tries > 1 ? setTimeout(() => img(src, tries - 1).then(res), 400) : res(null);
    im.src = src;
  });
  return Promise.all(Object.entries(SPRITE_DATA).map(([id, meta]) =>
    Promise.all([img('assets/fighters/' + id + '.png'), img('assets/fighters/' + id + '_alt.png')]).then(([main, alt]) => {
      if (main) SPRITES[id] = { meta, img: main, alt: alt || main, cache: new Map() };
    })));
}
// sprite set of a fighter def (mirror-match copies carry `base`); portraitSet also covers
// characters whose body is still code-drawn (only the face comes from the design)
const portraitSet = def => (def && def.fighter && SPRITES[def.base || def.id]) || null;
const spriteSet = def => { const s = portraitSet(def); return s && s.meta.body !== false ? s : null; };
// does this fighter's sprite set have exactly this pose (no fallback)? Used for the super's sheet F frames
const spriteHas = (def, name) => { const s = spriteSet(def); return !!(s && s.meta.frames[name]); };
function spritePose(set, name) {
  for (let n = name, i = 0; n && i < 10; n = SPRITE_FALLBACK[n], i++) if (set.meta.frames[n]) return n;
  return set.meta.frames.stance ? 'stance' : set.meta.frames.idle_1 ? 'idle_1' : Object.keys(set.meta.frames)[0];
}
// cut one frame out of the atlas (cached); returned in the shape drawSpr() expects
function spriteFrame(def, name) {
  const set = spriteSet(def), plus = name.endsWith('+'), want = plus ? name.slice(0, -1) : name, pose = spritePose(set, want), alt = !!def.base;
  const bob = plus && pose !== want ? 1 : 0; // only lift stand-in frames
  const key = pose + '|' + (alt ? 1 : 0) + '|' + bob;
  let s = set.cache.get(key); if (s) return s;
  const f = set.meta.frames[pose], [c, g] = mk(f.w, f.h), sc = ART_PX / 2;
  g.drawImage(alt ? set.alt : set.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  s = { c, ax: f.ax, ay: f.ay + bob, sc, hand1: pt(f.w * .3 * sc, -f.h * .55 * sc), hand2: pt(f.w * .3 * sc, -f.h * .55 * sc), top: pt(0, -f.h * sc) };
  set.cache.set(key, s); return s;
}
// the sprite for animation `anim` at tick t (same keyframe timing as the code-drawn poses)
function spriteForAnim(def, anim, t) {
  const seq = SPRITE_ANIM[anim] || SPRITE_ANIM.idle, A = ANIM[anim];
  if (seq.loop) return spriteFrame(def, seq.loop[Math.floor(Math.max(0, t) / seq.d) % seq.loop.length]);
  if (!A) return spriteFrame(def, seq[0]);
  const tt = A.loop ? ((Math.floor(t) % A.total) + A.total) % A.total : clamp(Math.floor(t), 0, A.total);
  let acc = 0, i = 0;
  for (; i < A.keys.length - 1; i++) { if (tt < acc + A.keys[i].d) break; acc += A.keys[i].d; }
  return spriteFrame(def, seq[Math.min(i, seq.length - 1)]);
}
// HUD / select / cut-in face from the atlas; null if this fighter has no portraits
function spritePortrait(def, expr) {
  const set = portraitSet(def); if (!set) return null;
  const P = set.meta.portraits || {}, want = expr === 'happy' || expr === 'proud' ? 'happy' : expr === 'hurt' || expr === 'ko' ? 'hurt' : expr === 'angry' ? 'angry' : 'normal';
  const e = P[want] ? want : P.normal ? 'normal' : null; if (!e) return null;
  const alt = !!def.base, key = 'portrait|' + e + '|' + (alt ? 1 : 0);
  let c = set.cache.get(key); if (c) return c;
  const r = P[e], z = Math.max(1, Math.round(64 / r.w)), [cc, g] = mk(r.w * z, r.h * z);
  g.imageSmoothingEnabled = false; g.drawImage(alt ? set.alt : set.img, r.x, r.y, r.w, r.h, 0, 0, r.w * z, r.h * z);
  cc.hd = 2; set.cache.set(key, cc); return cc;
}
