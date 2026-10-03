# Prompts to generate the missing poses

These prompts are for the AI image tool that made the original character sheets. Each request makes **one sheet** of poses for **one character**. Supers are left out on purpose, since they're disabled for now.

## Why these poses

- **Walking looks static:** the walk frames in the current sheets are casual strolls, and all four show nearly the same stride. **Sheet A** and **Sheet B** add a real walk cycle forward and backward with the guard up, plus a breathing idle.
- **Missing moves:** crouch, jump, sweep, low and air attacks, the special, knockdown and get-up currently borrow the closest pose (the stance or the punch). **Sheets C** and **D** add them.
- **Mario and Peño** also need **Sheet E**. Their sheets have no block, hit, K.O. or victory, and their walk frames show trousers instead of shorts.

**Priority:** A and B first (movement), then D (special and knockdowns), then C (attacks).

## How to make each sheet

1. Open the AI tool and **attach the character's current sheet** as the reference image:

   | Character | Reference sheet |
   |---|---|
   | Mario | `images/mario.jpg` |
   | Peño | `images/peño.jpg` |
   | Alba | `images/alba.jpg` |
   | Álvaro | `images/alvaro.jpg` |
   | Belli | `images/belli.jpg` |
   | Bene | `images/bene.jpg` |
   | Carlottis | `images/Carlottis.jpg` |
   | Marcos | `images/marcos.jpg` |
   | Oso | `images/oso.jpg` |

2. Paste three things, in this order:
   1. the **general prompt**
   2. the **character block**
   3. **one sheet list** (A, B, C, D or E)
3. Check the result against the **checklist** at the end. Regenerate if something is off.
4. Save it as PNG, named `images/sprites/<character>/sheet_A.png` (then `sheet_B.png`, and so on).
   - Folder names: `mario`, `peno`, `alba`, `alvaro`, `belli`, `bene`, `carlottis`, `marcos`, `oso`.
   - You don't have to cut the poses out: the game's tool finds each figure in the sheet by itself, reading left to right and top to bottom, as long as the figures don't touch.
   - If you prefer to cut them yourself, save one PNG per pose, named after the pose, e.g. `images/sprites/alba/walk_fwd_3.png`.
5. Tell me when they're in, and I'll add them to `tools/sprites.config.js` and rebuild.

---

## General prompt (paste every time)

```
Create a pixel-art sprite sheet for a 2D side-view fighting game (like Street Fighter II), using the attached image as the character reference.

CHARACTER
- Exactly the same character as in the reference: same face, hair, outfit, colours, accessories, body proportions and pixel-art style.
- Same size in every pose: the fighting stance must be exactly as tall as the fighting stance in the reference. Do not zoom in or out between poses.

STYLE
- Crisp pixel art: hard square pixels, dark outline around the whole character, 2–3 flat shades per colour, limited palette.
- No anti-aliasing, blur, gradients, glow, motion lines, speed trails, impact stars, dust or shadows.

VIEW
- Every pose faces RIGHT (side / three-quarter view toward the right edge of the image), like the "fight stance" in the reference.
- The whole body is visible in every pose, never cut off by the edge of the image.

LAYOUT
- Background: one solid flat colour, pure magenta #FF00FF, filling the whole image. No checkerboard, no gradient, no floor line, no shadow. Do not use magenta anywhere on the character.
- Put the poses in a grid, in exactly the order listed below (left to right, then top to bottom), one pose per cell.
- Leave wide empty magenta space around every figure (at least 40 px). Figures must never touch or overlap each other.
- In each row, the feet of standing poses rest on the same horizontal line.
- No text of any kind: no title, no labels, no numbers, no frames, no grid lines.
- Large output, at least 2048 px wide.

POSES FOR THIS SHEET
```

Then paste the character block and one sheet list below it.

---

## Character blocks

### Mario
```
CHARACTER DETAILS: athletic man, shirtless with defined abs, very short buzz-cut brown hair, trimmed dark beard, thin round glasses, navy-blue sports shorts with white side piping and a small white logo, barefoot. He ALWAYS wears these shorts, never trousers.
SPECIAL MOVE (dash punch), used in sheet D:
- special_1: crouched lunge wind-up, rear fist pulled back by the hip.
- special_2: lunging far forward with a long straight punch, body leaning forward, back leg stretched out behind.
- special_3: recovering, stepping back into the fighting stance.
```

### Peño
```
CHARACTER DETAILS: man with short dark messy hair, full dark beard, dark-framed glasses, red-and-white vertical striped football shirt, navy-blue shorts, barefoot. He ALWAYS wears these shorts, never trousers.
SPECIAL MOVE (football kick), used in sheet D (draw NO ball, the game adds it):
- special_1: standing on the back leg with the kicking leg swung far back, arms out for balance.
- special_2: kicking leg swung forward and up in a big follow-through.
- special_3: landing back into the fighting stance.
```

### Alba
```
CHARACTER DETAILS: athletic woman, long dark-brown curly hair in a high ponytail, black sports bra, black tight shorts, black socks, mint-green sneakers.
SPECIAL MOVE (flip kick), used in sheet D:
- special_1: crouched low, about to jump.
- special_2: in mid-air doing a somersault, body curled up.
- special_3: flying kick in mid-air, one leg fully extended forward and down.
```

### Álvaro
```
CHARACTER DETAILS: young man, white baseball cap, royal-blue hoodie, light-blue baggy jeans, light-blue and white sneakers, big smile, small hoop earrings.
SPECIAL MOVE (cap throw), used in sheet D:
- special_1: throwing arm pulled back holding his white cap (the cap is no longer on his head).
- special_2: throwing arm fully extended forward, hand open, the cap already gone (no cap drawn).
- special_3: hand going back to the head, returning to the fighting stance (cap back on).
```

### Belli
```
CHARACTER DETAILS: young man, black messy hair with a fringe, black t-shirt, blue jeans, black-and-white sneakers, big smile.
SPECIAL MOVE (shoulder charge), used in sheet D:
- special_1: crouched low, shoulder turned forward, ready to charge.
- special_2: charging forward leading with the shoulder, body leaning hard forward, back leg pushing.
- special_3: recovering into the fighting stance.
```

### Bene
```
CHARACTER DETAILS: young man with short dark curly hair, black sunglasses resting on top of his head, mustard-yellow open short-sleeve shirt over a white tank top, silver chain, light denim shorts, white socks, white sneakers with a dark-red logo. He always holds a tennis racket.
SPECIAL MOVE (tennis serve), used in sheet D (draw NO ball, the game adds it):
- special_1: racket raised high behind his head, the other arm up as if he just tossed the ball.
- special_2: racket swung forward and down after the hit.
- special_3: follow-through, returning to the fighting stance.
```

### Carlottis
```
CHARACTER DETAILS: woman with a long brown braid hanging behind her (lighter blonde towards the ends), big hoop earrings, white ribbed tank top, long orange crochet skirt, brown sandals, big smile.
SPECIAL MOVE (sandal throw), used in sheet D (the thrown sandal is added by the game):
- special_1: holding one of her sandals raised behind her head (that foot is bare).
- special_2: throwing arm fully extended forward, hand open, sandal gone.
- special_3: returning to the fighting stance.
```

### Marcos
```
CHARACTER DETAILS: man with a brown swept-up quiff, short beard, white t-shirt, silver chain, black trousers with a black belt, white sneakers.
SPECIAL MOVE (grab), used in sheet D:
- special_1: lunging forward with both arms reaching out, hands open.
- special_2: arms fully extended, hands closing as if grabbing someone.
- special_3: pulling back into the fighting stance.
```

### Oso
```
CHARACTER DETAILS: man with dark swept hair, short beard, dark charcoal suit, white shirt, gold patterned tie, black dress shoes.
SPECIAL MOVE (ground pound), used in sheet D:
- special_1: jumping up with both fists raised high above his head.
- special_2: crouched low, slamming both fists into the ground.
- special_3: standing back up into the fighting stance.
```

---

## Sheet lists (paste one per request)

### Sheet A: idle and walk forward (10 poses, 5 columns × 2 rows)
```
1. idle_1: fighting stance. Knees bent, feet apart with the front foot forward, both fists up by the chin (guard).
2. idle_2: same stance, body slightly lower (knees a bit more bent), fists slightly lower.
3. idle_3: same stance at its lowest point (breathing bounce).
4. idle_4: same stance rising back up, between idle_2 and idle_1.
5. walk_fwd_1: walking FORWARD (to the right) with the guard up. Front foot stepping forward, legs wide apart, heel touching down.
6. walk_fwd_2: weight shifting onto the front foot, knees bent, body at its lowest.
7. walk_fwd_3: back foot passing next to the front foot, legs close together, body at its highest.
8. walk_fwd_4: the OTHER foot now stepping forward, legs wide apart again.
9. walk_fwd_5: weight shifting onto that foot, knees bent.
10. walk_fwd_6: back foot passing, legs close together (the cycle loops back to walk_fwd_1).
The 6 walk frames form a smooth looping walk cycle: the legs must clearly change position in every frame, while the arms keep the fighting guard up.
```

### Sheet B: walk back, crouch and jump (10 poses, 5 columns × 2 rows)
```
1. walk_back_1: walking BACKWARD (moving to the left, still facing right) with the guard up, body leaning slightly back. Back foot stepping backward, legs wide apart.
2. walk_back_2: weight shifting onto the back foot, knees bent.
3. walk_back_3: front foot passing next to the back foot, legs close together.
4. walk_back_4: the other foot stepping backward, legs wide apart.
5. walk_back_5: weight shifting onto it, knees bent.
6. walk_back_6: legs passing close together (loops back to walk_back_1).
7. crouch: crouched low, knees deeply bent, fists still up in guard.
8. jump_1: take-off. Deep squat just before jumping, arms down and back.
9. jump_2: in the air with the knees tucked up to the chest, guard up.
10. jump_3: falling, legs stretching down to land, arms slightly out.
```

### Sheet C: attacks (12 poses, 4 columns × 3 rows)
```
1. punch_1: quick punch wind-up. Front fist pulled slightly back, shoulders turning.
2. punch_2: quick punch (jab). Front arm fully extended straight forward at head height.
3. strong_1: strong punch wind-up. Rear fist pulled far back, body twisting.
4. strong_2: strong punch (cross). Rear arm fully extended forward at head height, hips rotated, leaning into the punch.
5. kick_1: kick wind-up. Front knee raised high (chambered), guard up.
6. kick_2: kick. Front leg fully extended straight forward at waist height.
7. crouch_punch: crouched low, punching straight forward at waist height.
8. sweep_1: crouched low, one leg drawn back, about to sweep.
9. sweep_2: low sweep. Crouched with one leg stretched out along the floor to the right.
10. jump_kick: in mid-air, flying kick with one leg extended forward and down, the other knee tucked.
11. jump_punch: in mid-air, punching forward and down, knees tucked.
12. crouch_block: crouched low with both forearms raised in front of the face (blocking).
```

### Sheet D: hit, knockdown, get-up, victory and special (9 poses, 5 columns × 2 rows, last cell empty)
```
1. crouch_hit: crouched, flinching from a hit, head snapped back, eyes shut.
2. knockdown_1: knocked off the feet, body flying backward (to the left), arms flailing, pained face.
3. knockdown_2: landing flat on the back on the ground.
4. getup_1: sitting up on the ground, one hand pushing on the floor.
5. getup_2: kneeling on one knee, pushing up to stand.
6. victory_2: a second victory celebration pose, with the arms in a different position than the victory pose in the reference.
7. special_1: (see SPECIAL MOVE in the character details)
8. special_2: (see SPECIAL MOVE in the character details)
9. special_3: (see SPECIAL MOVE in the character details)
```

### Sheet E: Mario and Peño only (6 poses, 3 columns × 2 rows)
Their current sheets only have the stance and punches, and their walk frames show trousers. This sheet completes their basic set, in **shorts**.
```
1. face_front: standing facing the viewer (front view), relaxed, arms at the sides.
2. block: standing, both forearms raised in front of the face (blocking).
3. hit: standing, flinching from a hit to the face, head snapped back.
4. ko: knocked out, lying flat on his back on the ground.
5. victory_1: victory celebration, both arms raised.
6. stance: fighting stance (same as idle_1), wearing his shorts.
```

---

## Checklist before sending a sheet

- [ ] The background is pure magenta `#FF00FF`, flat everywhere, with no checkerboard, gradient, floor or shadow.
- [ ] Every figure faces **right**, the whole body is visible, and no figure touches another.
- [ ] Same face, hair, outfit, colours and size as the reference. Mario and Peño wear **shorts**.
- [ ] The poses are in the listed order. There's no text anywhere.
- [ ] The walk frames really change leg positions from one frame to the next.

If only one or two poses come out wrong, ask the tool to redraw just those poses in the same sheet, or cut the good ones out and generate the rest separately.
