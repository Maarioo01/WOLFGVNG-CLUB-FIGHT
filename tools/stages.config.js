// ============================================================
//  Stage backgrounds build config: which image becomes each stage's background strip.
//  Used by tools/stage-cutter.html (run through tools/build_stages.py) -> assets/stages/<id>.png
//
//  The strip is 560 x 162 art px. Its bottom row is the floor line (y = 150 in the game, where the game's own
//  perspective floor starts); the top 12 rows only show during screen shakes. The game moves it at 55% of the
//  camera speed, centred on the arena, so only the middle ~510 columns are seen in a fight.
//
//  Per stage:
//    art:    the ChatGPT background (docs/stage-prompts.md): a path, or { src, ...options } to fine-tune it.
//            Used when the file exists. Defaults: the whole width, floor line at 75% of the height
//    photo:  { src, ...options } the stand-in used while the art is missing (the real photo, cropped)
//  Options:
//    x:        [from, to] source columns that become the strip's width (default: the whole width)
//    horizon:  source row of the floor line (the strip's bottom row)
//    width:    strip width in art px (default 560)
//    colors:   palette size (default 48)
//    dither:   0..1 ordered dithering (default 0; photos look better with ~.3)
//    bright:   -1..1 added light (default 0);  contrast, sat: multipliers (default 1)
// ============================================================
const STAGE_CONFIG = {
  casa_marcos: { art: 'images/fondos/arte/casa_marcos.png', photo: { src: 'images/fondos/casa_marcos.jpeg', x: [0, 739], horizon: 1000, dither: .3 } },
  parcela_bene_1: { art: 'images/fondos/arte/parcela_bene_1.png', photo: { src: 'images/fondos/parcela_bene_1.jpeg', x: [0, 736], horizon: 388, dither: .3 } },
  parcela_bene_2: { art: 'images/fondos/arte/parcela_bene_2.png', photo: { src: 'images/fondos/parcela_bene_2.jpeg', x: [0, 731], horizon: 232, dither: .3 } },
  puente: { art: 'images/fondos/arte/puente.png', photo: { src: 'images/fondos/puente.jpg', x: [0, 900], horizon: 1000, dither: .3 } },
};
if (typeof module !== 'undefined') module.exports = STAGE_CONFIG;
