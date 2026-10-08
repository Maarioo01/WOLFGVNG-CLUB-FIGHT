# WOLFGVNG CLUB FIGHT

Juego de lucha arcade 2D en pixel art, 1 contra 1. HTML5 Canvas + WebAudio, sin dependencias: todo el arte y el sonido se generan por código.

## Cómo jugar

```
python serve.py
```
Abre http://localhost:8765 (también funciona abriendo `index.html` directamente o desde GitHub Pages).

**Modos:** `1 JUGADOR VS CPU` o `2 JUGADORES` → elegir luchadores → elegir escenario (o aleatorio) → combate al mejor de 3 rondas → revancha / cambiar personajes / menú.

### Teclado (dos jugadores en el mismo teclado)

| Acción | Jugador 1 | Jugador 2 |
|---|---|---|
| Moverse (atrás = bloquear) | W A S D | ← ↑ ↓ → |
| Puñetazo | F | K · Num 1 |
| Patada (↓ + patada = barrido) | G | L · Num 2 |
| Especial (o ↓↘→ + puño) | H | Ñ (`;` en teclado US) · Num 3 |
<!-- Súper desactivado por ahora: | Súper (barra azul llena) | T | O · Num 0 | -->

En modo **vs CPU** el jugador 1 puede usar cualquiera de los dos lados del teclado (y cualquier mando).

| Tecla | Acción |
|---|---|
| Enter / Espacio | Confirmar · pausa en combate |
| Esc / P | Pausa · volver |
| Retroceso | Volver |
| M | Sonido on/off |

### Mandos (Xbox / PS5, mapeo estándar en Chrome/Edge para Windows)

El primer mando conectado es el J1 y el segundo el J2 (pulsa un botón para que el navegador lo detecte).

| Botón | Acción |
|---|---|
| Cruceta / stick izquierdo | Moverse |
| X / □ | Puñetazo |
| A / ✕ | Patada · confirmar en menús |
| Y / △ · LB / L1 | Especial |
<!-- Súper desactivado por ahora: | RB / R1 · RT / R2 | Súper | -->
| B / ○ | Volver (menús) |
| Menu / Options | Pausa · confirmar |
| View / Create | Pausa |

## Personajes

Diseños de referencia en `images/`. Los personajes se dibujan por código (`CH` en `js/art.js`); sus especiales están en `SPECIALS` en `js/fight.js` (los súpers están comentados por ahora).

| Personaje | Especial |
|---|---|
| Mario | ¡Directo! (puñetazo con carrerilla) |
| Peño | ¡Golazo! (balón que bota) |
| Alba | ¡Mortal! (patada voladora) |
| Álvaro | ¡Gorrazo! (lanza la gorra) |
| Belli | ¡Embestida! (carga que derriba) |
| Bene | ¡Saque! (pelota de tenis rápida) |
| Carlottis | ¡Chanclazo! (lanza la sandalia) |
| Marcos | ¡Agarrón! (embestida con agarre) |
| Oso | ¡Terremoto! (pisotón con onda) |

**Dificultad de la CPU:** Fácil / Medio / Difícil, en el menú principal y en el menú de pausa.

## Sprites de los personajes

Los luchadores se dibujan con los fotogramas de los diseños (`images/`). Una herramienta los recorta, limpia el fondo, los ajusta a la rejilla de píxeles y genera `assets/fighters/`:

```
python3 tools/build_sprites.py          # todos los personajes
python3 tools/build_sprites.py alba     # solo uno
```

Necesita Google Chrome instalado. Qué dibujo es qué pose se define en `tools/sprites.config.js`. Para ver lo que detecta: `python3 serve.py` y abrir `http://localhost:8765/tools/sprite-cutter.html?char=alba&debug=1`.

**Añadir poses nuevas.** Una imagen PNG por pose en `images/sprites/<personaje>/<pose>.png` (p. ej. `images/sprites/alba/crouch.png`):

- un solo personaje, cuerpo entero, mirando a la **derecha**
- fondo de un solo color (magenta `#FF00FF`), sin cuadros, sombras ni texto
- mismo tamaño y ropa que el resto de sus dibujos

Luego añadir la imagen a `sheets` en `tools/sprites.config.js` y volver a ejecutar el comando.

Poses que entiende el juego (si falta alguna usa la más parecida): ver la lista completa y el prompt para generarlas en [`docs/pose-prompts.md`](docs/pose-prompts.md).

Mario, Peño, Alba, Álvaro, Belli, Bene y Carlottis tienen ya todas sus poses (hojas A–E en `images/sprites/`). Marcos y Oso todavía usan solo su hoja original (faltan sus hojas A–D).

**Personajes nuevos (Manu, Casado y MadeverXP):** de momento solo hay fotos (`images/manu*.jpeg`, `images/casado*.jpeg`, `images/madeverXP*.jpeg`). Primero hay que crear su hoja de diseño base y luego las hojas A–E; los pasos y los prompts están en [`docs/pose-prompts.md`](docs/pose-prompts.md#new-characters-manu-casado-madeverxp). Cuando estén, se añaden al juego.

## Estructura
- `js/core.js` — canvas, utilidades, texto pixel, input (teclado por jugador / mandos / táctil), efectos
- `js/audio.js` — sintetizador chiptune (pulso/triángulo/ruido), SFX y secuenciador de música
- `js/art.js` — esqueleto + poses con keyframes, y la definición de cada personaje (`CH`)
- `js/art_hd.js` — luchadores dibujados por código (para los que aún no tienen sprites)
- `js/sprites.js` — luchadores con los sprites de los diseños: carga, animaciones y caras del HUD
- `tools/` — herramienta que convierte los diseños en sprites (`build_sprites.py`, `sprite-cutter.html`, `sprites.config.js`)
- `js/world.js` — escenarios procedurales con parallax, suelo en perspectiva, público, palomas, lluvia
- `js/fight.js` — luchadores, frame data, IA, proyectiles, HUD
- `js/story.js` — título, controles, datos de escenarios (el modo historia está comentado)
- `js/versus.js` — selección de personaje y escenario, combate 1P vs CPU / 2P, pausa y revancha
- `js/main.js` — bucle principal (60 Hz fijo). Atajos dev: `#cpu`, `#2p`, `#fight=0..4`, `#fight2p=0..4`
