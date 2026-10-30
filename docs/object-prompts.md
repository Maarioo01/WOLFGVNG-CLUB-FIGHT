# Prompts for the object sheets (O1 and O2)

The game shows small objects:
- **Thrown in the specials:** Álvaro's cap, Carlottis's sandal, MadeverXP's cat.
- **On the floor:** the items the friends in the crowd throw into the arena, which you can pick up and use on your opponent.

These two ChatGPT sheets give them the same pixel-art style as the fighters. Until a sheet exists, the game uses code-drawn stand-ins, so nothing breaks while you make them.

**What the game draws itself (don't put it in the sheets):**
- the balls: Peño's football, Bene's tennis ball, the Poké Ball, Manu's tears and the Isaac bomb. They're real shaded spheres that spin.
- the flies around the poop, sparks, shadows and motion trails.
- the Greek yogurt. Marcos's sheet F already has it.

## Status

| Sheet | File to make | Status |
|---|---|---|
| O1, the specials' objects | `images/objetos/sheet_O1.png` | ⏳ To do |
| O2, the floor items | `images/objetos/sheet_O2.png` | ⏳ To do |

## How to make each sheet

1. Open ChatGPT and **attach the reference images** listed with the sheet below. They show the style and the objects as the fighters carry them.
2. Paste the [general prompt](#general-prompt-paste-every-time), then the **sheet's list** right below it.
3. Check the result against the [checklist](#checklist). Regenerate anything that's off.
4. Save it as PNG with the exact name from the status table, in `images/objetos/` (create the folder the first time).
5. Run `python3 tools/build_sprites.py objetos` (or tell me). It cuts every object at its in-game size. The sizes are in `tools/sprites.config.js` (`objetos`), so the size you draw them at doesn't matter.

**About the order:** the tool names the objects by their order (rows, then left to right), so they must come out in the listed order. If ChatGPT swaps two, tell me: it's a one-line fix.

---

## General prompt (paste every time)

```
Create a pixel-art sprite sheet of OBJECTS for a 2D side-view fighting game (like Street Fighter II), in exactly the same pixel-art style as the attached character sprite sheets.

STYLE
- Crisp pixel art: hard square pixels, a dark outline around every object, 2–3 flat shades per colour, limited palette, the same style as the attached sheets.
- No anti-aliasing, blur, gradients or glow. No effects: no motion lines, speed trails, sparks, smoke, shadows or reflections.

OBJECTS
- Each object on its own, complete, nobody holding or wearing it.
- Draw every object BIG and detailed: at least 300 px on its longest side.
- Objects that have a front point to the RIGHT.

LAYOUT
- Background: one solid flat colour, pure magenta #FF00FF everywhere. No checkerboard, gradient, floor line or shadow. Do not use magenta on the objects.
- Put the objects in exactly the order listed below, in rows (left to right, then top to bottom).
- Leave wide empty magenta space around every object (at least 60 px). Objects must never touch or overlap.
- No text, labels, numbers, frames or grid lines (only text printed on an object when the list asks for it).
- Large output, at least 2048 px wide.

OBJECTS FOR THIS SHEET
```

Then paste the sheet's list right below it.

---

## Sheet O1: the specials' objects (4 objects, one row)

**Attach:**
- `images/sprites/alvaro/sheet_A.png` (his cap);
- `images/sprites/carlotis/sheet_A.png` (her sandals);
- `images/sprites/madeverXP/sheet_D.png` (his cat, in his special).

```
1. obj_cap: the white baseball cap from the attached sheet (Álvaro's), seen exactly from the side, visor pointing RIGHT. Plain white with light grey shading, a small button on top.
2. obj_sandal: one brown leather sandal like the attached sheet's (Carlottis's), seen from directly ABOVE (top view): the sole with two straps across it, toes pointing RIGHT.
3. obj_cat_1: the small black cat with green eyes from the attached sheet (MadeverXP's), leaping through the air to the RIGHT, seen from the side: front legs stretched forward, back legs stretched back, tail up, ears flat, an angry face.
4. obj_cat_2: the same black cat in mid-air, seen from the side facing RIGHT, legs tucked under its body, tail curled up.
```

## Sheet O2: the floor items (9 objects, 3 rows of 3)

**Attach:** any character sheet for the style, e.g. `images/sprites/mario/sheet_A.png`.

```
1. obj_dumbbell: a gym hand dumbbell lying horizontally, side view: a chrome handle with black hexagonal weights on both ends.
2. obj_belt: a black martial-arts belt (judo belt) tied in its knot, with the two ends hanging down, seen from the front.
3. obj_car: a small red remote-control toy sports car, side view facing RIGHT, chunky black wheels, a short antenna, no logos or brand text.
4. obj_laptop: an open laptop seen in three-quarter view from the left, so the screen and the keyboard both show. Dark grey, the screen glowing with lines of green text.
5. obj_float: an inflatable unicorn pool float ring, side view facing RIGHT: a white ring with the unicorn's head and neck at the front, a rainbow mane, a golden horn and a rainbow tail.
6. obj_firstaid: a white first-aid kit box with a carrying handle on top and a big green cross on the front.
7. obj_book: a very thick hardcover law book standing upright, slightly turned, dark red cover with gold letters "CÓDIGO PENAL".
8. obj_poop: a cartoon poop pile: brown, swirled into three tiers, with a white shine highlight (no flies, no face).
9. obj_ration: an army field ration pack: an olive-green sealed box with a black stencil-style label and a small fold-out flap.
```

---

## Checklist

- [ ] The background is pure magenta `#FF00FF`, flat everywhere, with no checkerboard, gradient, floor or shadow.
- [ ] The objects are in the listed order, complete, and none touches another.
- [ ] The cap, the car and the float face **right**; the sandal's toes point right.
- [ ] No people, hands, effects or shadows. No text except "CÓDIGO PENAL" on the book.

If one object keeps failing, generate the rest without it and tell me which one is missing. The game keeps that object's stand-in.
