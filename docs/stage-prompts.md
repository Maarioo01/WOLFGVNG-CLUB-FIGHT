# Prompts for the stage backgrounds

The game's stages are four real places: Marcos's attic, Bene's pool, Bene's garden at dusk, and the Castilla-La Mancha bridge. The photos are in `images/fondos/`. This guide turns each photo into a **pixel-art background** in the same style as the fighters, with ChatGPT.

**What the game draws itself (don't worry about it in the image):**
- **The floor** the fighters stand on, in perspective: wooden planks, pool tiles, lawn or grass. Everything below the image's floor line is cut away.
- **The crowd.** The fighters who aren't fighting stand in front of the background and react to the fight. The image must have **no people**.
- The lamp glow at night and the darkening at the edges.

## Status

| Place | File to make | Status |
|---|---|---|
| Marcos's attic | `images/fondos/arte/casa_marcos.png` | ⏳ To do |
| Bene's pool | `images/fondos/arte/parcela_bene_1.png` | ⏳ To do |
| Bene's garden at dusk | `images/fondos/arte/parcela_bene_2.png` | ⏳ To do |
| The bridge | `images/fondos/arte/puente.png` | ⏳ To do |

## How to make each background

1. Open ChatGPT and **attach two images**:
   1. the **photo of the place** (the file is named in the place's block below);
   2. a **character sheet for the style**, e.g. `images/sprites/mario/sheet_A.png`.
2. Paste the [general prompt](#general-prompt-paste-every-time), then the **place's block** right below it.
3. Check the result against the [checklist](#checklist). Regenerate anything that's off.
4. Save it as PNG with the exact name from the status table, in `images/fondos/arte/` (create the folder the first time).
5. Tell me. I cut it to size, match the floor colours and put it in the game.

**Why the layout is so strict:** the game screen is wide (16:9) and the camera moves sideways a little, so the game uses a **wide strip** of the image:
- **Width:** the full width.
- **Height:** from about 30% of the height down to the floor line at 75%.
- **What gets cut:** the top 30% (behind the health bars) and everything below the floor line.
- **The edges:** they only show when the fighters go to a corner, so the main landmark goes in the middle.

---

## General prompt (paste every time)

```
Create a BACKGROUND for a stage of a 2D side-view fighting game (like the stages of Street Fighter II or Final Fight), based on the attached PHOTO of the place. The second attached image is a character sprite sheet from the same game: copy its pixel-art style.

FORMAT
- Landscape image, 3:2 (1536 x 1024).
- Flat front view of the place, like a theatre backdrop: we look straight at it, no strong perspective, no tilted horizon.

FLOOR LINE (very important)
- The floor line is the line where the back of the scene meets the ground. It is one straight horizontal line across the whole image, at 75% of the height (about 770 px from the top).
- Everything in the scene stands on that line (furniture, walls, the monument...). Below the line, only plain ground continuing towards the viewer: no objects (the game replaces that part with its own floor).
- The top 30% of the image is only sky, ceiling or treetops: nothing important there.
- The main landmark of the place goes in the middle 60% of the width.

SCALE
- Draw everything at a scale where a standing adult would be about 1/8 of the image height (about 128 px). But do not draw any people.

STYLE
- Crisp pixel art like the attached character sheet: hard square pixels (each pixel about 3x3 image pixels), dark outlines on objects, 2-4 flat shades per colour, limited palette.
- No anti-aliasing, blur, photo textures, gradients or glow effects.
- Keep it a little less detailed and less saturated than the characters, so fighters stand out in front of it.

STRICT RULES
- NO PEOPLE, no animals, no characters anywhere (the game adds its own crowd).
- No text, logos, labels, frames, borders or black bars (only the text the place block below asks for).
- Fill the whole image edge to edge.

PLACE
```

Then paste the place's block right below it.

---

## Place blocks

### Marcos's attic (`casa_marcos`)
Photo: `images/fondos/casa_marcos.jpeg`
```
Marcos's attic living room, from the attached photo, in the evening with warm indoor light.
- Back wall: white walls and a white sloped attic ceiling coming down from the top. On the left, a long horizontal window band showing the dark night outside, with a white radiator under it.
- Along the back wall, standing on the floor line: a long green corduroy couch (ribbed fabric, light olive green) with a couple of cushions, empty.
- In front of the couch, its legs on the floor line: a low dark wooden coffee table with playing cards laid out in rows, a red board-game box and a phone on it.
- Ground below the floor line: dark wooden floor.
```

### Bene's pool (`parcela_bene_1`)
Photo: `images/fondos/parcela_bene_1.jpeg`
```
The swimming pool of a Spanish country house ("parcela"), from the attached photo, on a sunny summer afternoon. We stand on the near edge of the pool, looking across it.
- The floor line is the near edge of the pool: a white stone border running straight across the whole image.
- Above it, from front to back: the blue pool water with light ripples (empty: no people; an empty white rainbow unicorn float and a black tyre float drifting in the water are welcome), the far edge of the pool, a red terracotta tiled deck, two white plastic sun loungers, a white gazebo tent with a dark table under it, a small white garden statue, a low brick wall with a white railing on the right, a tall dark-green hedge along the back, big trees above the hedge, a street lamp, blue sky with white clouds.
- Ground below the floor line: red terracotta tiles.
```

### Bene's garden at dusk (`parcela_bene_2`)
Photo: `images/fondos/parcela_bene_2.jpeg`
```
The garden of the same country house, from the attached photo, at dusk on a summer evening.
- Sky: deep purple-blue, with a pink-orange glow low on the horizon.
- On the left: a white single-storey porch building with columns, a tiled roof, tables inside and a barbecue, its light on.
- In the middle: big dark trees and a metal swing frame.
- On the right: a tall street lamp with its lamp lit (warm orange), and the back of a dark parked car cut by the right edge.
- The floor line is the far edge of the lawn. Ground below it: green lawn.
- Everything dim and bluish except the lit lamp and the porch light.
```

### The bridge (`puente`)
Photo: `images/fondos/puente.jpg`
```
The cable-stayed bridge "Puente de Castilla-La Mancha" over the river Tajo, from the attached photo, on an overcast grey day.
- In the middle: one very tall, slightly leaning white concrete pylon, with two fans of thin steel cables spreading down to both sides. Its top can reach the top of the image.
- On the left: distant green-brown hills, a road with a blue pedestrian-crossing sign and tall street lamps.
- In the middle-right, standing on the floor line: a brick monument with a large tiled sign in blue-and-yellow Talavera ceramic style, with a small coat of arms and the text "PUENTE DE CASTILLA-LA MANCHA" and "Río Tajo".
- Wild grass and dry bushes along the floor line.
- Ground below the floor line: grass.
```

---

## Checklist

- Landscape 3:2, filled edge to edge (no borders or black bars).
- The floor line is a **straight horizontal line at about 3/4 of the height**, and things stand on it.
- **No people** anywhere (empty pool floats are fine).
- The main landmark is in the middle; the top 30% is only sky or ceiling.
- Pixel art like the characters: square pixels, flat colours, no blur.
- No text, except the bridge's sign.

## When ChatGPT gets it wrong

| Problem | What to say |
|---|---|
| It adds people | "Remove all the people, keep everything else the same." |
| The floor line is tilted or curved | "Make the floor line a straight horizontal line at 3/4 of the height." |
| It comes out square or vertical | "Make it landscape 3:2 (1536 x 1024)." |
| It looks like a filtered photo, not pixel art | "Redraw it as crisp pixel art with big square pixels and flat colours, like the attached character sheet." |
| It won't use the photo because of the people in it | Attach only the character sheet; the place block describes the place on its own. |
