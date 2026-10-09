# Prompts for the super moves (sheet F)

Each fighter has one **super**: a short cinematic that knocks the opponent out in one go. It needs a full blue bar and can be used **once per match**. The super is already in the game. Until a fighter's sheet F exists, it plays with stand-in frames and simple code-drawn objects. When the sheet is added, the real drawings replace them.

This guide makes one extra sheet per character, **sheet F**, with the frames and objects of their super. Marcos's sheet F also has the frames of his new special, the "pico" strikes.

**What the game draws itself (don't put it in the drawings):** fire, explosions, smoke, flashes, speed lines, tears, the football, the musical notes' movement and the screen glitch. The sheets only need the character poses and the objects listed.

## How to make each sheet

1. Open the AI tool and **attach the character's sheet A** (`images/sprites/<folder>/sheet_A.png`, or `seed_A.png` for Bene) as the reference.
2. Paste two things, in this order:
   1. the **general super prompt**
   2. the **character's block** from [Character blocks](#character-blocks)
3. Check the result against the [checklist](#checklist-before-sending-a-sheet). Regenerate anything that's off.
4. Save it as PNG at `images/sprites/<folder>/sheet_F.png`, using the folder that already exists:

   | Character | Folder |
   |---|---|
   | Mario | `mario` |
   | Peño | `peño` |
   | Alba | `alba` |
   | Álvaro | `alvaro` |
   | Belli | `belli` |
   | Bene | `bene` |
   | Carlottis | `carlotis` |
   | Marcos | `marcos` |
   | Oso | `oso` |
   | Casado | `casado` |
   | MadeverXP (Alberto) | `madeverXP` |
   | Manu | `manu` |

5. Run `python3 tools/build_sprites.py` (or tell me). The sheets are already listed in `tools/sprites.config.js`, so nothing else needs editing as long as the figures are in the listed order.

**About sizes:**
- The **first figure** of every sheet is the character in the normal fighting stance. The game uses it to measure the size, so every pose of the character must be drawn at that same size.
- **Objects and creatures** (car, tank, Charizard, yogurt…) can be any size, because the game resizes them. Draw them big and detailed: none smaller than half the character's height.

---

## General super prompt (paste every time)

```
Create a pixel-art sprite sheet for the SUPER MOVE of a character in a 2D side-view fighting game (like Street Fighter II), using the attached image as the character reference.

CHARACTER
- Exactly the same character as in the reference: same face, hair, outfit, colours, accessories, body proportions and pixel-art style, unless a figure below says the outfit changes.
- Same size in every figure: the character must be exactly as tall as in the reference.

STYLE
- Crisp pixel art: hard square pixels, dark outline around every figure, 2–3 flat shades per colour, limited palette, the same style as the reference.
- No anti-aliasing, blur, gradients or glow. No effects at all: no fire, explosions, smoke, motion lines, speed trails, sparks, impact stars, tears or shadows (the game adds them).

VIEW
- Every figure faces RIGHT (side / three-quarter view toward the right edge of the image).
- Every figure is complete, never cut off by the edge of the image.

LAYOUT
- Background: one solid flat colour, pure magenta #FF00FF everywhere. No checkerboard, gradient, floor line or shadow. Do not use magenta on the figures.
- Put the figures in exactly the order listed below (left to right, then top to bottom).
- Leave wide empty magenta space around every figure (at least 40 px). Figures must never touch or overlap.
- Objects, vehicles and creatures listed below are separate figures, drawn big and detailed (at least half as tall as the character).
- No text, labels, numbers, frames or grid lines (only text printed on an object when the list asks for it).
- Large output, at least 2048 px wide.

FIGURES FOR THIS SHEET
1. ref: the character in the normal fighting stance, exactly like the reference (used to measure the size).
```

Then paste the character block right below it. Each block continues the numbered list from figure 2.

---

## Character blocks

### Mario: ¡INYECCIÓN!
*In the game:* he shows a syringe, injects himself, grows until he fills the screen, then knocks the opponent out with one huge punch. The game enlarges figures 4 and 5 to fill the screen, so draw them at normal size.
```
2. super_1: Mario holding up a big syringe in his front hand next to his face, grinning mischievously.
3. super_2: Mario injecting the syringe into his own upper arm, grimacing.
4. super_3: Mario transformed into a HUGE bodybuilder: enormous muscles and veins, same face, glasses, beard and navy shorts, flexing both arms. Drawn the SAME HEIGHT as the reference figure (the game enlarges it), just much bulkier.
5. super_4: the same huge muscular Mario throwing a massive straight punch to the right, arm fully extended. Same height as the reference.
```

### Peño: ¡CHOLISMO!
*In the game:* in a puff of smoke he becomes "Cholo" Simeone. He kicks a football into the opponent, then runs off-screen and comes back as Peño. The game draws the ball.
```
2. super_1: Peño transformed into Diego "Cholo" Simeone: keep Peño's face, glasses and beard, but with slicked-back black hair, a black suit, black shirt and black tie. Standing intensely, pointing at his own temple.
3. super_2: Peño-as-Simeone about to kick a football: kicking leg swung far back, arms out for balance (no ball drawn).
4. super_3: Peño-as-Simeone kicking hard: leg extended forward and up in a big follow-through.
5. super_4: Peño-as-Simeone running to the right, arms pumping, frame 1.
6. super_5: Peño-as-Simeone running to the right, frame 2 (the other leg forward).
```
*If the tool refuses the name:* drop "Diego Simeone" and keep the description (slicked-back black hair, all-black suit, shirt and tie).

### Alba: ¡IPPON!
*In the game:* she changes into a judo gi, does a backflip over the opponent, lands behind him and throws him over her shoulder into the ground. The game moves the opponent.
```
2. super_1: Alba wearing a white judo gi with a black belt, in a judo stance (knees bent, hands forward ready to grip).
3. super_2: Alba in the gi in mid-air doing a backflip: upside down, body curled.
4. super_3: Alba in the gi doing a judo shoulder throw: bent forward, both hands pulling forward and down over her shoulder (the opponent is NOT drawn).
5. super_4: Alba in the gi standing proudly with fists on her hips (victory).
```

### Álvaro: ¡A TODO GAS!
*In the game:* a sports car arrives, he jumps in, drives at full speed through the opponent and leaves.
```
2. super_1: Álvaro jumping up with arms raised, as if jumping into a car seat.
3. prop_car: a red Italian convertible sports car (Ferrari style, no logos or brand text) seen from the side, facing right, roof down, with Álvaro sitting in the driver's seat (white cap and blue hoodie visible).
```

### Belli: ¡HACKEO!
*In the game:* he sits down to code on a laptop. A huge virus logo takes over the screen and the opponent glitches and collapses.
```
2. super_1: Belli sitting on a chair at a small desk, typing on a laptop, facing right, focused (desk, chair and laptop included in the figure).
3. super_2: the same, typing with his hands in a different position and an evil grin.
4. prop_virus: a big square virus logo: a green pixel skull with crossbones and circuit lines on a black square, like a hacker icon.
```

### Bene: ¡CONCIERTO!
*In the game:* he plays his tennis racket like an electric guitar and fires musical notes until the opponent is blown away.
```
2. super_1: Bene playing his tennis racket like an electric guitar: rock pose, one foot forward, strumming the strings.
3. super_2: rock pose 2: leaning back, racket-guitar raised, mouth open singing.
4. prop_note: one big musical note (♪), bright yellow with a dark outline (the game copies and colours it).
```

### Carlottis: ¡VACUNA!
*In the game:* she changes into a nurse uniform, throws a volley of syringes and the opponent collapses.
```
2. super_1: Carlottis in a nurse uniform (white dress, white nurse cap with a red cross, white shoes), keeping her braid and earrings, holding a big syringe, fighting stance.
3. super_2: Carlottis in the nurse uniform throwing a syringe, throwing arm extended forward, hand open.
4. prop_syringe: one big syringe seen from the side, needle pointing RIGHT, clear barrel with light-blue liquid.
```

### Marcos: special ¡PICO! and super ¡YOGURAZO!
*In the game:*
- **Special:** quick strikes with his hand in "pico" (fingertips pinched together into a point) while "PICO" pops up.
- **Super:** a giant Greek yogurt drops between them. He pushes it over toward the opponent and the yogurt wave knocks him out.
```
2. special_1: Marcos's "pico" wind-up: one hand raised with the fingertips pinched together into a point (like a bird's beak), arm bent, the other fist on guard.
3. special_2: pico strike: that arm fully extended forward, fingertips pinched together pointing at the opponent.
4. special_3: pico strike with the OTHER hand, fingertips pinched together, the first hand pulled back.
5. super_1: Marcos pushing something huge and heavy with both hands, leaning forward, arms extended at chest height.
6. prop_yogurt: a giant Greek yogurt pot standing upright: white plastic pot with a blue label that says "GRIEGO" and a foil lid.
7. prop_yogurt_2: the same pot knocked over on its side (opening facing right) with thick white yogurt pouring out to the right in a big wave.
```

### Oso: ¡CULPABLE!
*In the game:* he raises a giant judge's gavel and flattens the opponent with one blow.
```
2. super_1: Oso holding a giant wooden judge's gavel (court hammer) raised high above his head with both hands.
3. super_2: Oso slamming the giant gavel down in front of him: body bent forward, gavel head on the ground to the right.
```

### Casado: ¡ARTILLERÍA!
*In the game:* a tank rolls in, he climbs aboard and fires a missile that blows the opponent away. The game draws the shot's flash, smoke and explosion.
```
2. super_1: Casado jumping up with one knee raised and arms up, climbing onto something.
3. prop_tank: an olive-green military tank seen from the side, facing right, long gun barrel pointing right, with Casado standing in the open top hatch from the waist up, saluting.
4. prop_tank_2: the same tank firing: gun barrel pulled back from the recoil, Casado in the hatch pointing forward and shouting (no fire or smoke drawn).
5. prop_missile: a missile seen from the side pointing RIGHT: grey body, red tip, fins.
```

### MadeverXP (Alberto): ¡LANZALLAMAS!
*In the game:* he throws a Poké Ball, Charizard comes out and burns the opponent with a stream of fire. The game draws the fire.
```
2. super_1: MadeverXP about to throw a Poké Ball: red-and-white ball in his hand, arm swung back (his cat still on his shoulder).
3. super_2: throw follow-through: arm forward, hand open, ball gone.
4. prop_pokeball: a Poké Ball: red top, white bottom, black band, white button.
5. prop_charizard: Charizard: orange fire dragon Pokémon with a cream belly, blue-green wing membranes and a flame on the tip of its tail, standing, wings spread, facing right.
6. prop_charizard_2: the same Charizard breathing fire: head stretched forward, mouth wide open (no fire drawn).
```
*If the tool refuses the names:*
- **Poké Ball:** "a red-and-white capture ball with a black band and a white button".
- **Charizard:** "an orange fire-breathing dragon with a cream belly, teal wing membranes and a flame on the tip of its tail".

### Manu: ¡LÁGRIMAS!
*In the game:* Isaac appears, Manu climbs on top of him and Isaac cries a storm of tears at the opponent. The game draws the tears.
```
2. super_1: Manu climbing up: arms raised, one knee lifted, as if climbing onto something.
3. prop_isaac: Isaac, the main character of the video game The Binding of Isaac: a crying child with a huge round bald head, big sad watery eyes and a small pale body (wearing simple shorts), standing, facing right, with Manu sitting on top of his head. Isaac is about twice as tall as Manu.
4. prop_isaac_2: the same, Isaac crying hard with his mouth wide open, Manu on his head pointing forward (no tears drawn).
```
*If the tool refuses the name:* "a cartoon crying child with a huge round bald head, big sad watery eyes and a small pale body".

---

## Checklist before sending a sheet

- [ ] The background is pure magenta `#FF00FF`, flat everywhere, with no checkerboard, gradient, floor or shadow.
- [ ] The **first figure** is the normal fighting stance, the same size as the reference.
- [ ] Every figure faces **right**, is complete, and doesn't touch any other figure.
- [ ] The character looks the same as in the reference, apart from the outfit changes the list asks for.
- [ ] The figures are in the listed order, with no effects (fire, smoke, tears, lines) and no text except "GRIEGO" on the yogurt.

If one figure comes out wrong, ask the tool to redraw just that one in the same sheet, or generate it on its own and send it as a separate image named after the pose (e.g. `images/sprites/oso/super_2.png`).
