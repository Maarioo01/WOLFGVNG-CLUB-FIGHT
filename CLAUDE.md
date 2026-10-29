# CLAUDE.md — WOLFGVNG CLUB FIGHT

2D pixel-art 1v1 fighting game about the user's group of friends. Fork of freddysae0/raval-fighter. Plain HTML5 canvas + WebAudio: no build step, no dependencies, no frameworks. Played on GitHub Pages (Windows PC, Xbox/PS5 pads) and locally with `python3 serve.py` → http://localhost:8765.

For "where is X / how do I change Y", see `docs/GUIDE.md`. It's the human-facing map of the code and covers the same ground in more detail.

## Working with this user

- They write in English, sometimes Spanish. In-game text and `README.md` are Spanish; `docs/*.md` are English.
- **Comment out, don't delete,** anything they remove. The story mode, the original Raval cast, the original JPG designs and the chiptune music are all commented out or switched off. Mark them with tags like `[STORY]`, `[OLD CHARS]`, `[ORIGINAL DESIGN]`, `[CHIPTUNE MUSIC off]`.
- The art comes from ChatGPT image generation, using prompt guides I write (`docs/pose-prompts.md`, `docs/super-prompts.md`). They drop PNG sheets in `images/sprites/<folder>/` and ask me to put them in the game.
- When a task is finished: commit on `main`, then push so they can play it on Pages. Commit message trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Pushing:** this Mac has no saved GitHub login, so `git push` fails until they sign in from VS Code (Source Control → Sync). The repo has `http.postBuffer` set locally because big pushes used to disconnect. Never store a token in the repo or in git config.
- **Copyright:** the songs in `music/` and the Pokémon/Isaac references are their choice for a private friends' game. Mention it once if it matters, don't lecture.
- **Fixed design decisions:**
  - Mario and Peño always wear shorts.
  - "Alberto" in the user's messages is MadeverXP.
  - A match goes to 3 round wins.
  - Everyone has 100 HP, including the CPU.
  - Each fighter's super is once per match and an instant K.O.
  - Pad layout (PlayStation names): □ punch, ✕ kick, △ special, ○ super, L2 jump, R2 crouch. In menus ✕ confirms and ○ goes back.

## Code map (script order in `index.html` = load order, all globals)

| File | What it holds |
|---|---|
| `js/core.js` | canvas (400×225 logical, `RES` 2), math helpers, pixel text (`text`, `tiny`), **input** (`KEYS`, `Input.poll` gamepads, touch), shake/flash/fade |
| `js/audio.js` | `sfx(name)` synth effects, **songs** (`SONGS`, `bgmUpdate`, `setSong`), chiptune sequencer (off: `CHIPTUNE = false`) |
| `js/art.js` | pose skeleton + `ANIM` keyframes (`defA`), `getSprite`, `drawSpr`, portraits, **`CH` character defs** (name, colour, fallback look) |
| `js/art_hd.js` | code-drawn fighters (fallback when a fighter has no sprites) |
| `js/sprites.js` | sprite atlas loading, `SPRITE_ANIM` (game anim → pose names), `SPRITE_FALLBACK`, `spriteFrame`, `spritePortrait` |
| `assets/fighters/*` | **generated**: atlases + `sprites-data.js`. Never edit by hand; rebuild |
| `js/world.js` | the old procedural Raval stages (`buildStage`, out of `STAGES` as `[OLD STAGES]`) and the floor maths the new stages reuse (`HORIZON`, `floorF`, `projX`, `vignette`) |
| `js/stages.js` | the stages (`buildPhotoStage`): background strip, code-drawn perspective floor (`buildGround`), the crowd of fighters (`cast`, `react`) |
| `assets/stages/*` | **generated** stage backgrounds. Never edit by hand; rebuild |
| `js/fight.js` | `MOVES`, `SPECIALS`, `WINS_TO_WIN`, `Fighter` (states, frame data), `PadCtrl`/`AICtrl`, `Proj` (projectiles), `Fight` (hits, KO, rounds, HUD, super cut-in) |
| `js/supers.js` | `SUPER_CHARGE`, `SUPERS` (one generator script per fighter), `SuperScene`, props (`PROP_SIZE`, `PROP_DRAW` stand-ins) |
| `js/story.js` | scene helpers `go`/`goFade`, `GAME` + difficulty, `STAGES`, `TitleScene`, `ControlsScene`, menu option helpers; the story mode is commented out |
| `js/versus.js` | `ROSTER`, `CPU_AI`, `SelectScene`, `VersusScene` (fight scene, pause / post-match menus) |
| `js/main.js` | fixed 60 Hz loop (`tick`/`render`), dev hashes `#cpu #2p #fight=N #fight2p=N` |
| `tools/` | sprite pipeline: `sprites.config.js` (which figure is which pose), `sprite-cutter.html` (runs in Chrome), `build_sprites.py`; stage pipeline: `stages.config.js`, `stage-cutter.html`, `build_stages.py` |

## Sprite pipeline (most of the work)

- Rebuild with `python3 tools/build_sprites.py [ids…]`. It needs Google Chrome and writes `assets/fighters/`. A sheet whose file doesn't exist yet is just skipped.
- Each sheet entry in `sprites.config.js` lists pose names in reading order (rows, then left to right). Use `'skip'` for unused figures.
- **Scale.** Every sheet must come out the same size, about 88 art px for the stance:
  - `match: [poseInThisSheet, alreadyCutPose]` compares heights;
  - `matchBy: 'head'` compares head widths;
  - `matchBy: 'headTop'` + `headWin: [from, to]` measures from the head top inside a column window, for arms or objects beside the head;
  - `grid: p` forces the scale; `height:` pins the stance height.
  - For sheets A–E those only give the starting size. The **size fit** (`fitSizes` in the cutter) then re-cuts every figure so its head is as big as `idle_1`'s: it template-matches `idle_1`'s head on the source image, figures with a low match cost set their row's size and the whole row follows. The build log prints it per row (`size fit`). `scale:` is a manual fix on top of it; `fit: false` turns it off. Sheet F is never fitted, so the supers' frames don't move.
- After every build, check the result visually against `idle_1`, at the same scale (screenshot page). The AI often draws a sheet at another size, or ignores layout instructions (e.g. it dropped the "ref" figure from every sheet F). Height alone misleads: walk frames stand more upright than the stance and victory poses raise the arms, so compare heads, torsos and shoes.
- `palette: 'F'` gives sheet F (super frames, props) its own colours, so the fight poses don't change.
- `shadow: true` keys out dark-magenta floor shadows.
- **Portraits:**
  - `FACES` holds the same poses for everyone.
  - They're cut at a fixed head size and re-sampled from the source image at 64 px (`hiresCrop`), so the faces stay sharp.
- **Original JPG designs** (`images/<name>.jpg`) are commented out of the config. Never bring them back: they're a different style with halos.
- Pose names and fallbacks: see `SPRITE_FALLBACK` in `js/sprites.js`. No sheet E means block = `idle_1` and hit = `crouch_hit`. A single victory drawing bounces (`hop`).

## Stages

- **Places:** four real places from the photos in `images/fondos/`: Marcos's attic, Bene's pool, Bene's garden at dusk, the bridge.
- **Backgrounds:** the user makes them with ChatGPT from `docs/stage-prompts.md` (its status table tracks which exist) and saves them in `images/fondos/arte/<art>.png`.
  - `python3 tools/build_stages.py` cuts each into a 560×162 strip in `assets/stages/`. Settings are in `tools/stages.config.js`.
  - Until an art file exists, the tool uses the photo as a stand-in. All 4 art files exist (2026-10-30).
  - ChatGPT drew the floor lines at different heights, so every `art` entry sets its own `horizon` (the source row where the code-drawn floor starts). Find it on the debug page.
- **Geometry:**
  - The strip's bottom row is the floor line (y = 150). It moves at parallax 0.55 (= `floorF(150)`), centred on `ARENA_C`, so the seam with the floor never slides.
  - The floor is code-drawn (`buildGround` styles `planks` / `tiles` / `lawn` / `field`).
  - Colours, host, lamps and ambient sound are per stage in `STAGES`. The build log suggests the colours.
- **The crowd:**
  - Who: the fighters who aren't fighting, picked by `cast()` with the host first.
  - Drawing: exactly half size, through `drawHalf`. At RES 2 one art pixel is one canvas pixel, and the anchors are snapped so the pixels stay crisp; other scales blur.
  - Poses: `crowd*` animations in `sprites.js`, falling back to fight poses.
  - Reactions: `stage.react(kind, x, side)` calls in `fight.js` (`hit`, `super`, `ko`, `round`, `match`, `start`).

## Supers

- `SUPERS[id].run` is a generator. Helpers:
  - `S.set(f, ov)` takes over a fighter's drawing;
  - `S.prop` adds a prop;
  - `S.wait` / `S.until` pause the script;
  - `S.spread(min)` steps the fighters apart;
  - `S.finish(vx, vy)` K.O.s the opponent and unfreezes the fight.
- Frames named `super_*` / `prop_*` come from sheet F; `'super_1|idle_1'` means "super_1 if it exists, else idle_1" (a stand-in).
- Every script measures its geometry from the real frames (`frameOf`) and has a code-drawn fallback.
- When a vehicle or creature is drawn with the character in it, `PROP_CREW` hides him until he boards (car, tank). Manu's Isaac appears under him instead.
- ChatGPT refuses some things:
  - self-injection with a syringe (Mario);
  - hacker / virus wording (Belli);
  - anything that looks like a Pokémon, because the image itself is checked.

  The game draws those objects in code. Never suggest wording tricks to get a lookalike past the image check.
- Still waiting for sheet F: Mario, Belli, MadeverXP (his throwing poses). Charizard comes from `images/sprites/madeverXP/charizard.jpg`.

## Testing (no test framework in the repo)

My harness lived in the session scratchpad (gone now), so rebuild it if needed:
- a copy of `index.html` with a scenario script, served by a threaded Python server with `request_queue_size = 128` (the default 5 drops script loads);
- **give that page `<base href="/">`** if it isn't at the repo root. The game loads its atlases and stage strips by relative URL; when they 404 it silently falls back to code-drawn fighters, and every test still "passes". Assert `Object.keys(SPRITES).length === 12` and `Object.keys(STAGE_IMG).length === 4` in every run;
- headless Chrome loads `page.html#scenario`, calls `tick()` synchronously, then `render()`;
- results and `canvas.toDataURL()` are POSTed back to the server;
- contact sheets of frames, taken every N ticks, are the way to check supers and animations;
- set `window.requestAnimationFrame = () => 0` before `main.js`, so only the scenario ticks;
- gamepads: replace `navigator.getGamepads` with fake pads (standard; raw PlayStation with the hat on axis 9 as in Chrome, or the d-pad as 4 trailing buttons as in Firefox) and check `Input.pl[p].held` after `Input.poll()`.

- Syntax check without node: `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -e "checkSyntax('js/x.js')"`.
- macOS has no `timeout`: use `perl -e 'alarm 40; exec @ARGV' …`. No PIL either: `sips` for crops/scaling (its `--cropOffset` behaves oddly).
- Before committing:
  - all 12 supers end in a K.O. with the round going to the attacker;
  - 12 full matches (3 wins) end with the post-match menu;
  - the select screen and HUD look right;
  - no console errors.
