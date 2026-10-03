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
//    area:   [x, y, w, h] part of the image that holds the drawings (e.g. inside a phone screenshot)
//    dx:     per-pose horizontal nudge of the anchor, in art pixels (to line frames up)
//    erase:  { pose: [[x, y, w, h], ...] } art-pixel boxes to clear (e.g. sheet text touching a figure)
//    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' } — frames the
//               HUD / select faces are cut from (head area is found automatically)
//    body:   false = only use the portraits; the in-game body stays code-drawn (not enough poses yet)
//
//  Pose names the game understands (missing ones fall back to the closest):
//    stance walk_1..walk_4 punch punch2 kick block crouch crouch_block crouch_punch sweep
//    jump jump_kick jump_punch hit knockdown ko getup victory special special_1
//    super_1 super_2 super_3 face_front
// ============================================================
const SPRITE_CONFIG = {
  // Mario & Peño: their sheets only have stance + punches (and walk frames in trousers), so for now only
  // their faces come from the design (HUD / select); the body stays code-drawn until the new poses arrive.
  mario: {
    body: false,
    sheets: [{ src: 'images/mario.jpg', tol: 70, poses: ['skip', 'face_front', 'skip', 'stance', 'skip', 'skip', 'punch', 'skip'] }],
    portraits: { normal: 'face_front' },
  },
  peno: {
    body: false,
    sheets: [{ src: 'images/peño.jpg', area: [0, 0, 704, 1250], tol: 70, poses: ['skip', 'face_front', 'skip', 'stance', 'punch', 'skip', 'skip', 'skip'] }],
    portraits: { normal: 'face_front' },
  },
  alba: {
    sheets: [{ src: 'images/alba.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  alvaro: {
    sheets: [{ src: 'images/alvaro.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  belli: {
    sheets: [{ src: 'images/belli.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
    flip: ['ko'],
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  bene: {
    sheets: [{ src: 'images/bene.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
    flip: ['ko'],
    erase: { victory: [[31, 8, 14, 7]] }, // the sheet's "VICTORY" label overlaps the racket
    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' },
  },
  carlottis: {
    sheets: [{ src: 'images/Carlottis.jpg', poses: ['face_front', 'skip', 'skip',
        'walk_1', 'walk_2', 'walk_3', 'walk_4',
        'stance', 'punch', 'kick', 'block',
        'victory', 'hit', 'ko'] }],
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
