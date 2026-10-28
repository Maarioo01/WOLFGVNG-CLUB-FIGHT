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
//            (for sheets drawn at a different size than the others); matchBy: 'head' compares head widths instead.
//            For the fight sheets (A–E) this is only the starting size: the size fit below sets the final one
//    (size fit) every figure of sheets A–E is re-cut so its head is as big as idle_1's (the AI draws some rows or
//            whole sheets bigger or smaller). Figures whose head is seen like in the stance are measured and give
//            their row its size; the rest of the row (frontal victory poses, flinches…) follows. The build log
//            prints it per row: "size fit … walk_fwd_1 0.80 … -> x1.25" (0.80 = head at 80% of idle_1's).
//            fit: false on a sheet or a character turns it off. Sheets with props / palette (sheet F) are never fitted
//    area:   [x, y, w, h] part of the image that holds the drawings (e.g. inside a phone screenshot)
//    dx:     per-pose horizontal nudge of the anchor, in art pixels (to line frames up)
//    erase:  { pose: [[x, y, w, h], ...] } art-pixel boxes to clear (e.g. sheet text touching a figure)
//    portraits: { normal: 'face_front', happy: 'victory', hurt: 'hit' } — frames the
//               HUD / select faces are cut from (head area is found automatically)
//    props:  true for sheets with objects (sheet F): small objects count as figures, solid white ones aren't text
//    '_ref': a figure only used to measure the size (with match), not stored
//    matchBy: 'headTop' measures the head from its top down; headWin: [from, to] = the columns (fractions of the
//            figure's width) the head is in, when an arm or an object is beside it
//    palette: 'F' quantizes this sheet's frames with their own colours (colors: n, default 48)
//    shadow: true also removes dark magenta (a floor shadow drawn under a figure)
//    alias:  { pose: 'otherPose' } reuse a drawing for another pose
//    scale:  { pose: 1.1 } make one pose bigger/smaller by hand (on top of the size fit for sheets A–E)
//    body:   false = only use the portraits; the in-game body stays code-drawn (not enough poses yet)
//
//  Pose names the game understands (missing ones fall back to the closest):
//    stance walk_1..walk_4 punch punch2 kick block crouch crouch_block crouch_punch sweep
//    jump jump_kick jump_punch hit knockdown ko getup victory special special_1
//    super_1 super_2 super_3 face_front
// ============================================================
// HUD / select / cut-in faces: the same poses for everyone (fight stance, victory, flinch)
const FACES = { normal: 'idle_1', happy: 'victory_2', hurt: 'crouch_hit' };
const SPRITE_CONFIG = {
  // Sheets A–E from docs/pose-prompts.md. Each later sheet starts at its `match` size; the size fit then evens out every pose.
  mario: {
    sheets: [
      { src: 'images/sprites/mario/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/mario/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3', 'skip'] },
      { src: 'images/sprites/mario/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/mario/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      { src: 'images/sprites/mario/sheet_E.png', match: ['stance', 'idle_1'], poses: ['face_front', 'block', 'hit', 'ko', 'victory_1', 'stance'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/mario/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_2', 'idle_1'], poses: ['super_1', 'super_2', 'super_3', 'super_4'] }],
    portraits: FACES,
  },
  peno: {
    sheets: [
      { src: 'images/sprites/peño/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/peño/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/peño/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/peño/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      { src: 'images/sprites/peño/sheet_E.png', match: ['stance', 'idle_1'], poses: ['face_front', 'block', 'hit', 'ko', 'victory_1', 'stance'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/peño/sheet_F.png', props: true, palette: 'F', match: ['super_1', 'face_front'], poses: ['super_1', 'super_2', 'super_3', 'super_4', 'super_5'] }],
    portraits: FACES,
  },
  alba: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/alba.jpg', poses: ['face_front', 'skip', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 87, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      { src: 'images/sprites/alba/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6', 'jump_1', 'jump_2', 'skip'] },
      { src: 'images/sprites/alba/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch'] },
      { src: 'images/sprites/alba/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/alba/sheet_D.png', grid: 3.27, poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/alba/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_1', 'idle_1'], poses: ['super_1', 'super_2', 'super_3', 'super_4'] }],
    alias: { jump_3: 'jump_2' }, // her sheet B has no jump; sheet A's extra crouch / tuck frames are the jump
    portraits: FACES,
  },
  alvaro: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/alvaro.jpg', poses: ['face_front', 'skip', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 88, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      { src: 'images/sprites/alvaro/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/alvaro/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/alvaro/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/alvaro/sheet_D.png', grid: 3.49, poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/alvaro/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_1', 'idle_1'], headWin: [.36, .72], poses: ['super_1', 'prop_car'] }],
    portraits: FACES,
  },
  belli: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/belli.jpg', poses: ['face_front', 'skip', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 89, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      { src: 'images/sprites/belli/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/belli/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/belli/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/belli/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/belli/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_1', 'idle_1'], poses: ['super_1', 'super_2'] }],
    portraits: FACES,
  },
  bene: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/bene.jpg', poses: ['face_front', 'skip', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 89, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      { src: 'images/sprites/bene/seed_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'skip', 'skip', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/bene/seed_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/bene/seed_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/bene/seed_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/bene/sheet_F.png', props: true, palette: 'F', match: ['super_1', 'idle_1'], poses: ['super_1', 'super_2', 'prop_note'] }],
    portraits: FACES,
  },
  carlottis: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/Carlottis.jpg', poses: ['face_front', 'skip', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 89, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      { src: 'images/sprites/carlotis/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6', 'skip', 'skip', 'skip'] },
      { src: 'images/sprites/carlotis/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3', 'skip'] },
      { src: 'images/sprites/carlotis/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/carlotis/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'skip', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/carlotis/sheet_F.png', props: true, palette: 'F', match: ['super_1', 'idle_1'], poses: ['super_1', 'super_2', 'skip', 'prop_syringe'] }],
    portraits: FACES,
  },
  marcos: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/marcos.jpg', poses: ['face_front', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 88, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      { src: 'images/sprites/marcos/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/marcos/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/marcos/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/marcos/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/marcos/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['special_1', 'idle_1'], poses: ['special_1', 'special_2', 'special_3', 'super_1', 'prop_yogurt', 'prop_yogurt_2'] }],
    portraits: FACES,
  },
  oso: {
    // [ORIGINAL DESIGN] first drawings, other style; replaced by sheets A–D: { src: 'images/oso.jpg', poses: ['face_front', 'skip', 'walk_1', 'walk_2', 'walk_3', 'walk_4', 'stance', 'punch', 'kick', 'block', 'victory', 'hit', 'ko'] }
    height: 89, // stance height all the sheets are scaled to (it came from the original design)
    sheets: [
      // his sheet A also repeats the ground-pound frames at the end (they come from sheet D)
      { src: 'images/sprites/oso/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6', 'skip', 'skip', 'skip'] },
      { src: 'images/sprites/oso/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/oso/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/oso/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/oso/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_2', 'idle_1'], headWin: [.43, .57], poses: ['super_1', 'super_2'] }],
    dx: { super_2: -18 }, // the gavel pulls the slam frame's anchor forward: keep it on his body
    portraits: FACES,
  },
  // New characters: no original sheet. Like most of the cast they have no sheet E (front face, block, hit, victory):
  // a standing hit shows the flinch (crouch_hit), the block shows the guard stance and the win shows victory_2.
  manu: {
    sheets: [
      { src: 'images/sprites/manu/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/manu/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/manu/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      // his sheet D stance is drawn more crouched, so the height comparison would blow the sheet up: compare heads
      { src: 'images/sprites/manu/sheet_D.png', match: ['special_3', 'idle_1'], matchBy: 'head', poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/manu/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_1', 'idle_1'], headWin: [0, .68], shadow: true, poses: ['super_1', 'prop_isaac', 'prop_isaac_2'] }],
    alias: { hit: 'crouch_hit', victory_1: 'victory_2' },
    portraits: FACES,
  },
  casado: {
    sheets: [
      { src: 'images/sprites/casado/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6'] },
      { src: 'images/sprites/casado/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/casado/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/casado/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/casado/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['prop_tank_2', 'idle_1'], headWin: [.37, .53], poses: ['super_1', 'prop_tank', 'prop_tank_2', 'prop_missile'] }],
    alias: { hit: 'crouch_hit', victory_1: 'victory_2' },
    portraits: FACES,
    scale: { super_1: .8 }, // sheet F: the AI drew his jump 25% bigger than himself in the tank
  },
  madeverxp: {
    sheets: [
      // sheet A also has an extra stance and his cat-throw frames (those come from sheet D)
      { src: 'images/sprites/madeverXP/sheet_A.png', poses: ['idle_1', 'idle_2', 'idle_3', 'idle_4', 'skip', 'walk_fwd_1', 'walk_fwd_2', 'walk_fwd_3', 'walk_fwd_4', 'walk_fwd_5', 'walk_fwd_6', 'skip', 'skip', 'skip'] },
      { src: 'images/sprites/madeverXP/sheet_B.png', match: ['walk_back_1', 'walk_fwd_1'], poses: ['walk_back_1', 'walk_back_2', 'walk_back_3', 'walk_back_4', 'walk_back_5', 'walk_back_6', 'crouch', 'jump_1', 'jump_2', 'jump_3'] },
      { src: 'images/sprites/madeverXP/sheet_C.png', match: ['punch_1', 'idle_1'], poses: ['punch_1', 'punch_2', 'strong_1', 'strong_2', 'kick_1', 'kick_2', 'crouch_punch', 'sweep_1', 'sweep_2', 'jump_kick', 'jump_punch', 'crouch_block'] },
      { src: 'images/sprites/madeverXP/sheet_D.png', match: ['special_3', 'idle_1'], poses: ['crouch_hit', 'knockdown_1', 'knockdown_2', 'getup_1', 'getup_2', 'victory_2', 'special_1', 'special_2', 'special_3'] },
      { src: 'images/sprites/madeverXP/sheet_E.png', match: ['stance', 'idle_1'], poses: ['face_front', 'block', 'hit', 'ko', 'victory_1', 'stance'] },
      // super move (docs/super-prompts.md); skipped until the file exists
      { src: 'images/sprites/madeverXP/sheet_F.png', props: true, palette: 'F', matchBy: 'headTop', match: ['super_2', 'idle_1'], poses: ['super_1', 'super_2'] },
      // Charizard for his super, from the user's Charizard sheet (13 poses; only the 3/4 stance and the roar are used),
      // cut about 150 art px tall
      { src: 'images/sprites/madeverXP/charizard.jpg', props: true, palette: 'Z', colors: 40, grid: 3.2, poses: ['skip', 'prop_charizard', 'skip', 'skip', 'skip', 'skip', 'skip', 'prop_charizard_2'] }],
    portraits: FACES,
  },
};
if (typeof module !== 'undefined') module.exports = SPRITE_CONFIG;
