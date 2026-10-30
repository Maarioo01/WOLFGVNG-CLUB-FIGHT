# How the game is built, and where to change things

A practical map for anyone who wants to change **WOLFGVNG FIGHT CLUB** by hand: where each thing lives and what to edit. You don't need to know the whole code; find the section for what you want to change.

**Basics**
- Everything is plain JavaScript in `js/`. There's no build step: edit a file, save, reload the browser.
- To run it locally: `python3 serve.py`, then open http://localhost:8765.
  - Shortcuts: `http://localhost:8765/#2p` goes straight to the 2-player select screen; `#fight2p=0` goes straight into a fight on stage 0.
- The screen is **400 × 225 game units** (drawn at 2× for sharpness). The floor is at `y = 200` (`GROUND`). Positive y goes **down**.
- The game runs at **60 ticks per second**, so durations in the code are in ticks (60 = one second).
- After changing something, play a quick match in both modes (vs CPU and 2 players) and open the browser console (F12) to check for red errors.

---

## 1. Map of the files

`index.html` loads the scripts in this order, and each file can use everything defined in the ones before it.

| File | What's inside |
|---|---|
| `js/core.js` | screen setup, maths helpers, pixel text (`text`, `tiny`), **keyboard / gamepad / touch input**, screen shake, flash and fades |
| `js/audio.js` | sound effects (`sfx`), **background songs** (`SONGS`), the old chiptune music (switched off) |
| `js/art.js` | animation timing (`ANIM`), sprite drawing helpers, **character definitions (`CH`)** |
| `js/art_hd.js` | fighters drawn by code (only used if a fighter has no sprites) |
| `js/sprites.js` | loads the sprite sheets and decides **which drawing shows in each animation** |
| `assets/fighters/` | the **generated** sprite atlases. Don't edit; rebuild them (section 2) |
| `js/world.js` | the old Raval street stages (no longer in the list) and the perspective-floor maths the new stages reuse |
| `js/stages.js` | the **stages**: background strip, floor, and the **crowd** of fighters reacting to the fight |
| `js/objects.js` | the **objects**: balls drawn as shaded spheres that spin, and the cap, sandal and cat (from the objects atlas, or code-drawn stand-ins) |
| `js/fight.js` | **moves and hits, specials, projectiles, rounds, timer, KO, CPU AI, the HUD** |
| `js/supers.js` | the **supers** (one scripted scene per fighter) and the super bar speed |
| `js/story.js` | screen switching (`go`, `goFade`), difficulty, **stage list (`STAGES`)**, **title menu**, **controls screen**. The old story mode is commented out at the bottom |
| `js/versus.js` | **fighter list (`ROSTER`)**, CPU tuning, **character select**, the **fight screen**, pause and end-of-match menus |
| `js/main.js` | the main loop (60 ticks/s) |
| `tools/` | the tools that turn the AI drawings into sprites (`build_sprites.py`) and stage backgrounds (`build_stages.py`) |
| `images/sprites/<name>/` | the AI sprite sheets (A–F) for each fighter |
| `images/objetos/` | the AI object sheets (O1, O2), made with `docs/object-prompts.md` |
| `images/fondos/` | the photos of the stages' places; the ChatGPT backgrounds go in `images/fondos/arte/` |
| `assets/stages/` | the **generated** stage backgrounds. Don't edit; rebuild them (section 8) |
| `music/` | the background songs (MP3) |

---

## 2. Sprites (the fighters' drawings)

**Where they come from:** each fighter has sheets of poses drawn with an AI tool, saved in `images/sprites/<folder>/sheet_A.png … sheet_F.png`. The prompts to create them are in `docs/pose-prompts.md` (fighting poses, sheets A–E) and `docs/super-prompts.md` (super, sheet F).

**How they get into the game:** a tool cuts each figure out of the sheet, removes the magenta background, snaps it to a pixel grid and packs all the poses of a fighter into one image.

1. Save the sheet as PNG with a flat magenta `#FF00FF` background, every figure facing right.
2. In `tools/sprites.config.js`, add the sheet to that fighter's `sheets` list. Name the figures in reading order (left to right, then the next row). Use `'skip'` for a figure you don't want:
   ```js
   { src: 'images/sprites/alba/sheet_E.png', match: ['stance', 'idle_1'], poses: ['face_front', 'block', 'hit', 'ko', 'victory_1', 'stance'] },
   ```
   The `match` part makes this sheet the same size as the rest: here, the sheet's `stance` comes out as tall as the already-cut `idle_1`. The options are explained at the top of `sprites.config.js`.
3. Run `python3 tools/build_sprites.py alba` (or with no name, to rebuild everyone). It needs Google Chrome.
   - It writes `assets/fighters/alba.png`, `alba_alt.png` (the recoloured copy for mirror matches), `alba.json` and `sprites-data.js`.
   - The log shows how many figures it found and the size of each pose. If the counts don't match, the names are shifted.
   - It also evens out the size: every pose of sheets A–E is re-cut so its head is as big as in `idle_1` (the AI often draws a row, or a whole sheet, smaller or bigger than the stance). The log shows this per row under `size fit`: `walk_fwd_1 0.80` means that head was at 80% of `idle_1`'s, and `-> x1.27` is the size change applied to the row. Poses marked `?` can't be measured (frontal or tilted heads) and take their row's size.
4. Reload the game. To see what the cutter detected, open http://localhost:8765/tools/sprite-cutter.html?char=alba&debug=1 while `serve.py` is running.

**Pose names** the game understands:
- `idle_1-4`, `walk_fwd_1-6`, `walk_back_1-6`
- `crouch`, `jump_1-3`
- `punch_1/2`, `strong_1/2`, `kick_1/2`
- `crouch_punch`, `sweep_1/2`, `jump_kick`, `jump_punch`
- `block`, `crouch_block`, `hit`, `crouch_hit`
- `knockdown_1/2`, `getup_1/2`
- `victory_1/2`, `special_1-3`
- for the super: `super_*` and `prop_*`

If a pose is missing, the game uses the closest one: see `SPRITE_FALLBACK` in `js/sprites.js`.

**Which drawing shows in each animation:** `SPRITE_ANIM` in `js/sprites.js`.
- A list follows the move's timing, one drawing per stage of the move:
  ```js
  kick: ['idle_1', 'kick_1', 'kick_2', 'kick_2', 'idle_1', 'idle_1'],
  ```
- `{ loop: [...], d: 11 }` is a looping animation that changes drawing every `d` ticks (idle, walking, victory).
- The timing itself lives in `ANIM` (`defA(...)` lines in `js/art.js`). The first number of each pair is just a code-drawn pose; the second is how many ticks that stage lasts.

**Faces (HUD, select screen, super cut-in):** cut automatically from the poses in `FACES` (top of `tools/sprites.config.js`) when you rebuild.

**Size on screen:** `ART_PX` in `js/sprites.js` is screen pixels per drawing pixel; changing it resizes every fighter. The hit areas follow the stance height automatically.

---

## 3. Moves, hits and damage

All in `js/fight.js`.

**Normal moves** are in `MOVES`, one line per move:
```js
jab: { anim: 'jab', s: 4, a: 3, r: 8, dmg: 5, hs: 14, bs: 8, push: 2.4, box: [6, -50, 26, 10], lvl: 'mid', snd: 'hitL', stop: 5, cancel: ['cross', 'kick'], meter: 5 },
```

| Key | Meaning |
|---|---|
| `anim` | animation name (`ANIM` / `SPRITE_ANIM`) |
| `s`, `a`, `r` | ticks of startup, active (when it can hit) and recovery |
| `dmg` | damage (everyone has 100 HP) |
| `hs`, `bs` | ticks the opponent is stunned on hit / on block |
| `push` | how far the opponent is pushed |
| `box` | hit area `[x forward, y up (negative), width, height]`, scaled by the fighter's size |
| `lvl` | `'mid'`, `'low'` (must block crouching) or `'high'` (must block standing) |
| `kd` | `1` = knocks down |
| `stop` | hit-freeze ticks (the "impact" pause) |
| `snd` | sound: `hitL` / `hitM` / `hitH` |
| `cancel` | moves that can follow it if it connects (combos) |
| `meter` | super bar gained by the attacker |
| `lunge`, `dash` | the attacker moves forward while doing it |

**Which button does which move:** `Fighter.update` → the `case 'idle'` block. Punch is `jab` (crouching: `cpunch`), kick is `kick` (crouching: `sweep`), jumping gives `jpunch` / `jkick`.

**Combos and the moves everyone has** (also in `MOVES`):

| Input | Move | Where |
|---|---|---|
| □ □ ✕ | `jab` → `cross` → `remate` (knocks down) | `cancel` lists; the cancel block in `Fighter.updateMove` |
| ↓□ ↓□ ↓✕ | `cpunch` → `cpunch` (once, `chainN`) → `sweep` | same |
| □ + ✕ up close | `grab` (AGARRE) | `Fighter.tryThrow`; the opponent is in the `'thrown'` state, drawn rotated (`ov`), until `Fight.throwLand` hits them with the move. Pressing the two buttons up to 3 ticks apart works too (`thBuf`) |
| → → / ← ← | dash / back-dash | `PadCtrl.dash` (two taps within 14 ticks), `Fighter.startDash`, state `'dash'` (afterimages in `draw`) |
| ↓ + ✕ in the air | `dive` (PISOTÓN) | the `case 'jump'` block; bounces off on hit |
| automatic | ¡CONTRA! counter-hit: +25% damage, +6 stun | `Fight.hit` (`counterHit`) |
| automatic | combo ranks at 3, 5, 7 hits | `COMBO_RANKS`; the crowd reacts with `'combo'` |

**Specials** (two per fighter): `SPECIALS[id].special` (△, or ↓↘→ + □) and `.special2` (↓ + △, or ↓↙← + □), same keys plus:

| Key | Meaning |
|---|---|
| `pop` | text that pops up when the special comes out |
| `cd` | cooldown in ticks |
| `spawn: { at, type }` | throws a projectile `type` at tick `at` |
| `flip` | the move is a jump |
| `hop` | small jump, as in Oso's ground pound |
| `multi: n` | hits again every `n` ticks while active (Marcos's PICO) |
| `hitPop` | text on each hit |
| `name` | the move list name when there's no `pop` |
| `fly: [vx, vy]` | a jump attack (Mario's knee) |
| `spin` | the kick frames alternate sides while active (Alba's spinning kick) |
| `teleport` | reappears behind the opponent (Belli) |
| `counter` | a stance: a punch or kick landing during it is countered with `COUNTER_HIT` (Casado, `Fight.counter`) |
| `ai: [min, max]` | the distance at which the CPU uses it |

**Projectiles** (ball, cap, sandal, tennis ball, cat, shout, shock wave, and the second specials' lob, boomerang, smash, homing sandal, ¡PROTESTO! bubble, Isaac bomb, pouncing cat): class `Proj`.
- The constructor sets speed, damage and size per `type`. `high` = must be blocked standing; `hits` = how many times it can hit (the boomerang: 2); `custom` = it handles its own hits in `update` (the bomb's explosion, the cat that clings); `noClash` = other projectiles go through it.
- `draw()` draws each type, with a shadow on the floor (`objShadow`).
- `spawnProj` picks the throw sound.
- To add a new one: give it a `type` in `SPECIALS`, and add a line in the constructor and a drawing in `draw()`.

**The objects' drawings** (`js/objects.js`):
- **Balls** (`BALLS`: football, tennis, Poké Ball, tear, bomb) are painted as spheres pixel by pixel: lit from the top-left, 3 tones, a highlight, a dark outline, and their pattern on the sphere (the football's pentagons sit where a real ball has them). Each has 16 spin angles. `drawBall(g, kind, x, y, size, angle)`; a projectile adds to its angle as it flies, so it really rolls.
- **Other objects** come from the shared `objetos` atlas: `objFrame('obj_cap')`, or `objFrames('cap', 'flip')` for the spin frames. Until an object is in the atlas, `OBJ_STANDIN` draws it in code.
- They're drawn at 2x detail (one pixel = one screen pixel), like the HUD faces.

**The move list** (pause → MOVIMIENTOS): `MOVE_LIST` and `drawMoveList` in `js/versus.js`; the specials' names come from `SPECIALS` and `SUPERS`.

**What happens on a hit** (damage, block, combo scaling, knockdown, sparks, sounds, super bar gain): `Fight.hit()`.
- Blocking is "hold back".
- Each extra hit in a combo does 12% less damage, down to a minimum of 50%.

**Health:** every fighter starts at 100 (`this.maxHp = 100` in the `Fighter` constructor).

**Hit and hurt boxes** (the areas that can hit and be hit): `Fighter.hurtbox()` and `Fighter.hitbox()`.

---

## 4. Rounds, timer, KO

In `js/fight.js`:

| What | Where |
|---|---|
| Round wins needed to win the match | `WINS_TO_WIN` (now 3, so a match lasts 3 to 5 rounds). The win markers in the HUD follow it |
| Round time | `this.timer = 60 * 60` in `Fight.startRound()` (ticks, so 60 seconds) |
| Round start ("RONDA 1… ¡PELEA!") | `Fight.update()`, `phase === 'intro'`. The numbers are ticks since the round started |
| KO (slow motion, freeze, flash, "K.O.") | `Fight.ko()` |
| Who wins the round / the match; time-out by health; next round | end of `Fight.update()` (`phase === 'ko' \|\| 'timeup'`) |
| Super bar kept between rounds, reset at round 1 | `Fight.startRound()` |
| Big texts (RONDA, ¡PELEA!, K.O., ¡TIEMPO!, PERFECTO) | `Fight.drawHUD()` |

What happens after the match (rematch / pick fighters / main menu): `VersusScene.endFight` and `VersusScene.act` in `js/versus.js`.

---

## 5. The super move

In `js/supers.js`.

- **Bar speed:** `SUPER_CHARGE` at the top: higher fills faster. The amounts gained per hit are in `Fight.hit()` and `Fight.gain()` (`js/fight.js`). It's once per match: see `canSuper` in `js/fight.js`.
- **Super name and script per fighter:** `SUPERS`. Each script is a `function*` (one step per tick) that moves the fighters and props and ends with `S.finish(...)`, which knocks the opponent out. Helpers inside a script:

  | Helper | What it does |
  |---|---|
  | `S.set(fighter, { pose: 'super_1\|idle_1' })` | shows a pose (`super_1` if it exists, otherwise `idle_1`) |
  | `S.prop({ kind: 'car', x, ... })` | adds an object: a car, tank, yogurt… |
  | `S.wait(n)` / `S.until(fn)` | waits n ticks / until something happens |
  | `S.spread(dist)` | makes the two fighters step apart |
  | `S.say(x, y, 'TEXT')` | text that pops up |
  | `S.boom(x, y, big)`, `S.poof(x)` | a hit spark / a puff of smoke |

- **Object sizes on screen:** `PROP_SIZE`.
- **Fallback drawings when there's no sheet F:** `PROP_DRAW`.
- **The cut-in banner with the face and super name:** `drawCutin` in `js/fight.js`.

---

## 6. Music and sound

In `js/audio.js`.

- **Background songs:** the `SONGS` list. To add one:
  1. Copy the MP3 into `music/`, with a short name and no spaces.
  2. Add a line: `{ name: 'NOMBRE', src: 'music/nombre.mp3' },`.

  It then appears in the **MÚSICA** option of the main and pause menus. The default volume is `BGM.vol`.
- **Sound effects:** `sfx(name)`. Each `case` builds the sound from synth tones (`osc`) and noise (`nz`), so there are no audio files. Add a new `case` to create a sound and call `sfx('mysound')` where you need it.
- **Mute:** the M key (`toggleMute`); it mutes songs too.
- **Old chiptune music:** set `CHIPTUNE = true` to bring it back. The tracks are in `TRACKS`; stages choose theirs with `music:` in `STAGES`.
- **Background sounds** (crickets, wind; the old street noise and rain): `ambient()`. Each stage picks one with `ambient:` in `STAGES`.

---

## 7. Controls

**Keyboard:** `KEYS` in `js/core.js` maps each key to `[player, action]`:
```js
KeyF: [0, 'punch'],   // player 1 (0) punches with F
KeyK: [1, 'punch'],   // player 2 (1) punches with K
```
- Actions: `up down left right punch kick special super start pause back mute`.
- Key names are the browser's `KeyboardEvent.code` (e.g. `KeyF`, `ArrowUp`, `Numpad1`, `Semicolon`).

**Gamepads (PS5 / Xbox):** `Input.poll` in `js/core.js`, in the `st` object. It uses the standard button numbers listed in the comment above it; for example `punch: b(2)` means Square / X.
- Layout: Square punch, Cross kick, Triangle special, Circle super (L1 / R1 repeat special / super), L2 jump, R2 crouch, d-pad or left stick to move, Options pause. In menus Cross confirms and Circle goes back.
- The first pad connected is player 1, the second player 2.
- If the browser doesn't recognise a PlayStation pad (no "standard" mapping), `padButtons` puts its buttons back in the standard order.
- The CONTROLES screen is also a button test: it shows each connected pad's name, and a row lights up while its button is held. `(SIN MAPEO)` after the name means the browser gives an unknown layout.

**Combinations** need no extra buttons: ↓ + special is the second special, punch + kick together is the throw, two quick taps of a direction dash (`PadCtrl` in `js/fight.js`: `qcf`, `qcb`, `dash`).

**Touch buttons (phone):** the `<div class="tb" data-a="...">` elements in `index.html`.

**After changing controls, update the help:**
- the CONTROLES screen (`ControlsScene` in `js/story.js`);
- the move list (`MOVE_LIST` in `js/versus.js`);
- the tables in `README.md`;
- the hint lines on the select screen (`SelectScene.draw` in `js/versus.js`).

---

## 8. Stages (backgrounds)

The stages are four real places: Marcos's attic, Bene's pool, Bene's garden at dusk and the Castilla-La Mancha bridge. A stage has three parts, drawn by `js/stages.js`:

1. **The background**: a 560 × 162 pixel-art strip, `assets/stages/<art>.png`. It moves at 55% of the camera's speed, and its bottom row is the floor line (y = 150).
2. **The floor** the fighters stand on: drawn in code, in perspective, below the strip (`buildGround`).
3. **The crowd**: the fighters who aren't fighting, at half size, standing just in front of the background and reacting to the fight.

**The list of stages:** `STAGES` in `js/story.js`.

| Field | Meaning |
|---|---|
| `name`, `sub` | name on the stage select and in the round banner; the line under it on the stage select |
| `art` | the background strip (see below) |
| `floor` | `style`: `planks`, `tiles`, `lawn` or `field`; `cols`: `[main, second, seams / detail]`; `size`: the tile size for `tiles` (22 units by default); `edge`: a stone edge along the floor line (the pool); `decals`: rugs or tarps, `{ x: [from, to], d: [from, to], col, rim }` (x in world units around the arena centre 620; d is the depth: 1 under the fighters, 1.65 at the crowd, 1.82 at the floor line) |
| `haze` | the colour the floor fades into near the floor line |
| `host` | a fighter who is always in the crowd when he isn't fighting (Marcos at his house, Bene at his parcela) |
| `crowd`, `slots` | how many spectators (6) and where they stand (world x around the centre; the left half supports J1, the right half J2) |
| `night`, `crowdTint`, `glow` | darker edges; a colour mixed into the crowd; lamps on the strip `[{ x, y }]` (strip pixels) with a pool of light on the floor |
| `ambient` | background sound: `null`, `'crickets'`, `'wind'` (also `'street'`, `'rain'`) |

**Making a background:**
1. Make the picture with ChatGPT using `docs/stage-prompts.md` and save it in `images/fondos/arte/<art>.png`.
2. Run `python3 tools/build_stages.py` (or `python3 tools/build_stages.py puente` for one). It needs Google Chrome.
   - It cuts the strip above the picture's floor line, shrinks it and reduces its colours.
   - Its settings are in `tools/stages.config.js`: crop, floor line (`horizon`), colours, dithering, brightness.
   - Until the art exists, it uses the photo in `images/fondos/` as a stand-in.
   - The log suggests the `haze` and floor colours for `STAGES`.
3. To see the crop and a mock-up of the fight screen with fighters and crowd for scale, run `python3 serve.py` and open http://localhost:8765/tools/stage-cutter.html?stage=puente&debug=1.

**The crowd** (`cast` and `react` in `js/stages.js`):
- **Who:** `cast()` picks it when a fight starts: the host first, then the other free fighters at random.
- **Poses:** watching uses the fight stance; cheering, the victory pose; shocked, `hit`; sad, `crouch_hit` and then turning away. These are the `crowd*` animations in `SPRITE_ANIM` (`js/sprites.js`). A future spectator sheet with `crowd_idle_1`, `crowd_cheer_1`… drawings would replace them without code changes.
- **What they react to:** the calls to `stage.react(...)` in `js/fight.js`.

  | Event | Reaction |
  |---|---|
  | `'hit'` | a landed hit: some of the attacker's fans cheer, a few of the others flinch |
  | `'super'` | everyone is shocked |
  | `'ko'` | the winner's fans cheer, the others are shocked |
  | `'round'` | the winner's fans cheer until the next round, the others look sad |
  | `'match'` | the winner's fans keep cheering |
  | `'start'` | a short cheer at "¡PELEA!" |

**Other screens:**
- **Stage select screen:** `SelectScene.drawStage` in `js/versus.js`.
- **Title screen background:** `TitleScene.init` in `js/story.js`. It shows its own copy of the garden at dusk.

**The old Raval street stages** are still in `js/world.js` (`buildStage`), commented out of `STAGES` with the tag `[OLD STAGES]`. Uncomment them to bring them back; `stageWorld()` builds whichever kind an entry is.

---

## 9. Screens, menus and transitions

- **Changing screens:** `go(new Scene())` switches instantly; `goFade(() => new Scene(), speed)` fades to black first. Both are in `js/story.js`.
- **Each screen is a class** with `init()`, `update()` (60 times per second, read input here) and `draw(g)`.

| Screen | Class | File |
|---|---|---|
| Title | `TitleScene` | `js/story.js` |
| Controls | `ControlsScene` | `js/story.js` |
| Character + stage select | `SelectScene` | `js/versus.js` |
| Fight (pause and post-match menus included) | `VersusScene` | `js/versus.js` |

- **Main menu options:** `this.items` in `TitleScene.init`, and the `if (it === '...')` lines in `TitleScene.update`.
  - Options changed with ← → (like DIFICULTAD or MÚSICA) use `drawOption` and `optionInput` (`js/story.js`).
- **Pause menu:** `pauseItems` in `VersusScene.init`.
  - The menu box itself is `drawMenu` (`js/versus.js`).
- **Effects** (all in `js/core.js`):
  - `flash(ticks, colour)` flashes the screen;
  - `shake(strength, ticks)` shakes it;
  - `fadeTo` / `drawFade` handle fades.
- **Fight-only effects** (`js/fight.js`):
  - hit-freeze (`this.hitstop`), slow motion (`this.slow`);
  - sparks (`Fight.spark`), dust (`Fight.dust`), popping texts (`Fight.popup`).
- **Difficulty:**
  - `DIFFS` and `aiFor()` in `js/story.js` scale how the CPU plays;
  - the base CPU personality is `CPU_AI` in `js/versus.js`;
  - the CPU's brain is `AICtrl` in `js/fight.js`.

---

## 10. The HUD (health bars, faces, timer)

`Fight.drawHUD()` in `js/fight.js`:
- the health bar colours;
- the super bar and its SUPER / USADO labels;
- the face frames;
- names, win markers, the timer;
- the combo counter ("3 GOLPES");
- the round and KO texts.

The layout constants are at the top of the function: `BW` bar width, `XL` margin, `PB` face box size.

---

## 11. Adding a new fighter (checklist)

1. **Drawings:** make their sheets with `docs/pose-prompts.md` (the "new characters" section) and save them in `images/sprites/<folder>/`.
2. **`tools/sprites.config.js`:** add an entry like Manu's or Casado's, then run `python3 tools/build_sprites.py <id>`.
3. **`js/art.js`:** add them to `CH` (copy an existing `mkChar(HDB({...}))` line).
   - `id` must match the config; `name` is what the game shows; `color` is their player colour.
   - The rest is only used if the sprites are missing.
4. **`js/versus.js`:** add the `id` to `ROSTER` (6 per row on the select screen).
5. **`js/fight.js`:** give them a special in `SPECIALS`.
6. **`js/supers.js`:** give them a super in `SUPERS` (copy the simplest one, e.g. Bene's or Oso's).
7. **`README.md`:** add them to the character table.

---

## 12. Publishing

The game is published with GitHub Pages from the `main` branch. Commit and push, and the site updates a minute or two later; refresh with Ctrl+F5.
