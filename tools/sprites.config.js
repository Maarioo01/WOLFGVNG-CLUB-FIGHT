// ============================================================
//  Sprite build config — which image/figure becomes which pose.
//  Used by tools/sprite-cutter.html (run through tools/build_sprites.py).
//
//  Per character:
//    sheets: [{ src, poses: [...] }]  figures are detected automatically and read
//            row by row, left to right; `poses` names them in that order
//            ('skip' = unused figure, e.g. a back view or a duplicate).
//            Single-pose images: { src: 'images/sprites/alba/crouch.png', poses: ['crouch'] }
//    flip:   poses that face left in the art and must be mirrored
//    tol:    background colour tolerance (default 24; checkerboard backgrounds need ~70)
//    grid:   force the art-pixel size of a sheet (auto-detected otherwise)
//    match:  ['walk_back_1', 'walk_fwd_1'] scale this sheet so its first pose is as tall as an already-cut pose
//            (for sheets drawn at a different size than the others)
//    area:   [x, y, w, h] part of the image that holds the drawings (e.g. inside a phone screenshot)
//    dx:     per-pose horizontal nudge of the anchor, in art pixels (to line frames up)
//    erase:  { pose: [[x, y, w, h], ...] } art-pixel boxes to clear (e.g. sheet text touching a figure)
//    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' } — frames the
//               HUD / select faces are cut from (head area is found automatically)
//    alias:  { pose: 'otherPose' } reuse a drawing for another pose
//    scale:  { pose: 1.1 } make one pose bigger/smaller (when the AI drew part of a sheet at another size)
//    body:   false = only use the portraits; the in-game body stays code-drawn (not enough poses yet)
//
//  Pose names the game understands (missing ones fall back to the closest):
//    stance walk_1..walk_4 punch punch2 kick block crouch crouch_block crouch_punch sweep
//    jump jump_kick jump_punch hit knockdown ko getup victory special special_1
//    super_1 super_2 super_3 face_front
// ============================================================
const SPRITE_CONFIG = {
  // Sheets A–E from docs/pose-prompts.md. Each later sheet is scaled with `match` so its poses have the same size.
  mario: {
    sheets: [
      { src: 'images/sprites/mario/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/mario/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3', 'skip'] },
      { src: 'images/sprites/mario/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/mario/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      { src: 'images/sprites/mario/sheet_E.png', match: ['stance', 'idle_1'], poses: ['face_front', 'block', 'hit', 'ko', 'victory_1', 'stance'] }],
    portraits: { normal: 'face_front', happy: 'victory_1' }, // their hit pose has the head thrown back
  },
  peno: {
    sheets: [
      { src: 'images/sprites/peño/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/peño/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/peño/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/peño/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      { src: 'images/sprites/peño/sheet_E.png', match: ['stance', 'idle_1'], poses: ['face_front', 'block', 'hit', 'ko', 'victory_1', 'stance'] }],
    // his sheet A walk row is drawn ~12% smaller than the idle row
    scale: { walk_fwd_1: 1.12, walk_fwd_2: 1.12, walk_fwd_3: 1.12, walk_fwd_4: 1.12, walk_fwd_5: 1.12, walk_fwd_6: 1.12 },
    portraits: { normal: 'face_front', happy: 'victory_1' }, // their hit pose has the head thrown back
  },
  alba: {
    sheets: [{ src: 'images/alba.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] },
      { src: 'images/sprites/alba/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6', 'jump_1', 'jump_2', 'skip'] },
      { src: 'images/sprites/alba/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch'] },
      { src: 'images/sprites/alba/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/alba/sheet_D.png', match: ['victory_2', 'victory'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] }],
    flip: ['ko'],
    alias: { jump_3: 'jump_2' }, // her sheet B has no jump; sheet A's extra crouch / tuck frames are the jump
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  alvaro: {
    sheets: [{ src: 'images/alvaro.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] },
      { src: 'images/sprites/alvaro/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/alvaro/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/alvaro/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/alvaro/sheet_D.png', match: ['victory_2', 'victory'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  belli: {
    sheets: [{ src: 'images/belli.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] },
      { src: 'images/sprites/belli/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/belli/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/belli/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/belli/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  bene: {
    sheets: [{ src: 'images/bene.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] },
      { src: 'images/sprites/bene/seed_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'skip', 'skip', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/bene/seed_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/bene/seed_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/bene/seed_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] }],
    flip: ['ko'],
    erase: { victory: [[31, 8, 14, 7]] }, // the sheet's "VICTORY" label overlaps the racket
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  carlottis: {
    sheets: [{ src: 'images/Carlottis.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] },
      { src: 'images/sprites/carlotis/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6', 'skip', 'skip', 'skip'] },
      { src: 'images/sprites/carlotis/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3', 'skip'] },
      { src: 'images/sprites/carlotis/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/carlotis/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'skip', 'special_3'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  marcos: {
    sheets: [{ src: 'images/marcos.jpg', poses: ['face_front', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  oso: {
    sheets: [{ src: 'images/oso.jpg', poses: ['face_front', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
};
if (typeof module !== 'undefined') module.exports = SPRITE_CONFIG;
