# How the game is built, and where to change things

A practical map for anyone who wants to change **WOLFGVNG CLUB FIGHT** by hand: where each thing lives and what to edit. You don't need to know the whole code; find the section for what you want to change.

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
| `js/world.js` | the **stages / backgrounds** (buildings, crowd, floor, rain, pigeons…) |
| `js/fight.js` | **moves and hits, specials, projectiles, rounds, timer, KO, CPU AI, the HUD** |
| `js/supers.js` | the **supers** (one scripted scene per fighter) and the super bar speed |
| `js/story.js` | screen switching (`go`, `goFade`), difficulty, **stage list (`STAGES`)**, **title menu**, **controls screen**. The old story mode is commented out at the bottom |
| `js/versus.js` | **fighter list (`ROSTER`)**, CPU tuning, **character select**, the **fight screen**, pause and end-of-match menus |
| `js/main.js` | the main loop (60 ticks/s) |
| `tools/` | the tool that turns the AI drawings into sprites |
| `images/sprites/<name>/` | the AI sprite sheets (A–F) for each fighter |
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

**Specials** (one per fighter): `SPECIALS`, same keys plus:

| Key | Meaning |
|---|---|
| `pop` | text that pops up when the special comes out |
| `cd` | cooldown in ticks |
| `spawn: { at, type }` | throws a projectile `type` at tick `at` |
| `flip` | the move is a jump |
| `hop` | small jump, as in Oso's ground pound |
| `multi: n` | hits again every `n` ticks while active (Marcos's PICO) |
| `hitPop` | text on each hit |

**Projectiles** (ball, cap, sandal, tennis ball, cat, shout, shock wave): class `Proj`.
- The constructor sets speed, damage and size per `type`.
- `draw()` draws each type.
- `spawnProj` picks the throw sound.
- To add a new one: give it a `type` in `SPECIALS`, and add a line in the constructor and a drawing in `draw()`.

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
- **Street ambience / rain sound:** `ambient()`.

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

**Touch buttons (phone):** the `<div class="tb" data-a="...">` elements in `index.html`.

**After changing controls, update the help:**
- the CONTROLES screen (`ControlsScene` in `js/story.js`);
- the tables in `README.md`;
- the hint lines on the select screen (`SelectScene.draw` in `js/versus.js`).

---

## 8. Stages (backgrounds)

- **The list of stages** (name, look, time of day): `STAGES` in `js/story.js`.
  - `theme` picks the street style: `hospital`, `rambla`, `macba`, `joaquin` or `riera`.
  - `tod` is the time of day: `afternoon`, `sunset`, `dusk`, `night` or `rain`.
  - `seed` changes the random details (shops, windows, crowd).
  - The `ai` / `enemy` / `intro` fields belong to the old story mode and aren't used in versus.

  To add a stage, copy an entry and change `name`, `theme`, `tod` and `seed`. It appears in the stage select automatically.
- **How a stage is drawn:** `buildStage()` in `js/world.js`.
  - It paints the sky, buildings, shops, signs, floor, people in the crowd, pigeons and rain from those settings.
  - Theme-specific details are in `if (cfg.theme === '...')` blocks. A brand-new theme means adding such blocks.
  - The time of day picks the colour palette and the lights.
- **Stage select screen:** `SelectScene.drawStage` in `js/versus.js`.
- **Title screen background:** `TitleScene.init` in `js/story.js` (it builds the stage that appears behind the logo).

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
