# WOLFGVNG CLUB FIGHT

Juego de lucha arcade 2D en pixel art, 1 contra 1. HTML5 Canvas + WebAudio, sin dependencias: todo el arte y el sonido se generan por código.

## Cómo jugar

```
python serve.py
```
Abre http://localhost:8765 (también funciona abriendo `index.html` directamente o desde GitHub Pages).

**Modos:** `1 JUGADOR VS CPU` o `2 JUGADORES` → elegir luchadores → elegir escenario (o aleatorio) → gana el combate quien gane 3 rondas (de 3 a 5 rondas) → revancha / cambiar personajes / menú. Todos los luchadores tienen la misma vida (también la CPU).

### Teclado (dos jugadores en el mismo teclado)

| Acción | Jugador 1 | Jugador 2 |
|---|---|---|
| Moverse (atrás = bloquear) | W A S D | ← ↑ ↓ → |
| Puñetazo | F | K · Num 1 |
| Patada (↓ + patada = barrido) | G | L · Num 2 |
| Especial (o ↓↘→ + puño) | H | Ñ (`;` en teclado US) · Num 3 |
| Súper (barra azul llena, una vez por combate) | T | O · Num 0 |

En modo **vs CPU** el jugador 1 puede usar cualquiera de los dos lados del teclado (y cualquier mando).

| Tecla | Acción |
|---|---|
| Enter / Espacio | Confirmar · pausa en combate |
| Esc / P | Pausa · volver |
| Retroceso | Volver |
| M | Sonido on/off (música incluida) |

### Mandos (Xbox / PS5, mapeo estándar en Chrome/Edge para Windows)

El primer mando conectado es el J1 y el segundo el J2 (pulsa un botón para que el navegador lo detecte).

| Botón | Acción |
|---|---|
| Cruceta / stick izquierdo | Moverse |
| X / □ | Puñetazo |
| A / ✕ | Patada · confirmar en menús |
| Y / △ · LB / L1 | Especial |
| RB / R1 · RT / R2 | Súper |
| B / ○ | Volver (menús) |
| Menu / Options | Pausa · confirmar |
| View / Create | Pausa |

## Personajes

Diseños de referencia en `images/`. Los especiales están en `SPECIALS` en `js/fight.js` y los súpers en `js/supers.js`.

| Personaje | Especial | Súper |
|---|---|---|
| Mario | ¡Directo! (puñetazo con carrerilla) | ¡Inyección! (se pincha, crece hasta llenar la pantalla y suelta un puñetazo gigante) |
| Peño | ¡Golazo! (balón que bota) | ¡Cholismo! (se convierte en el Cholo Simeone, chuta el balón y se va corriendo) |
| Alba | ¡Mortal! (patada voladora) | ¡Ippon! (judogi y cinturón negro, mortal hacia atrás por encima del rival y lo tumba) |
| Álvaro | ¡Gorrazo! (lanza la gorra) | ¡A todo gas! (se sube a un deportivo y atropella al rival) |
| Belli | ¡Embestida! (carga que derriba) | ¡Hackeo! (programa en su mesa, un virus llena la pantalla y el rival cae) |
| Bene | ¡Saque! (pelota de tenis rápida) | ¡Concierto! (toca la raqueta como una guitarra y dispara notas) |
| Carlottis | ¡Chanclazo! (lanza la sandalia) | ¡Vacuna! (uniforme de enfermera y lluvia de jeringuillas) |
| Marcos | ¡Pico! (golpes rápidos con la mano en pico) | ¡Yogurazo! (un yogur griego gigante que vuelca sobre el rival) |
| Oso | ¡Terremoto! (pisotón con onda) | ¡Culpable! (mazo de juez gigante, un solo golpe) |
| Manu | ¡Cabezazo! (se lanza de cabeza) | ¡Lágrimas! (aparece Isaac, Manu se sube encima e Isaac llora sobre el rival) |
| Casado | ¡Firmes! (saludo militar y grito que lanza una onda) | ¡Artillería! (llega un tanque, se sube y dispara un misil) |
| MadeverXP (Alberto) | ¡Gatazo! (lanza a su gato) | ¡Lanzallamas! (lanza una Poké Ball, sale Charizard y escupe fuego) |

**Súper:** la barra azul (debajo de la vida) se llena pegando y recibiendo golpes, y se conserva entre rondas. Se llena en algo menos de una ronda. Con la barra llena, el súper (T / O · Num 0 / RB · RT) lanza la escena del personaje, que deja K.O. al rival al instante y gana esa ronda. Solo se puede usar **una vez por combate**; después la barra pone USADO. La velocidad de carga se ajusta con `SUPER_CHARGE` en `js/supers.js`.

Los súpers de Alba, Álvaro, Bene, Carlottis, Casado, Manu, Marcos, Oso y Peño ya usan sus dibujos (hoja F, `images/sprites/<carpeta>/sheet_F.png`); el Charizard de MadeverXP sale de `images/sprites/madeverXP/charizard.jpg`. Mario, Belli y MadeverXP aún no tienen hoja F: de momento usan poses parecidas y objetos dibujados por código. Los prompts, el estado de cada uno y qué hacer si ChatGPT rechaza una imagen están en [`docs/super-prompts.md`](docs/super-prompts.md).

**Dificultad de la CPU:** Fácil / Medio / Difícil, en el menú principal y en el menú de pausa. Cambia cómo juega y cuánto pega la CPU, no su vida.

**Música:** dos canciones en `music/` (`epica.mp3` y `patricio.mp3`). Se elige con **MÚSICA** en el menú principal o en el de pausa (← →): ÉPICA, PATRICIO o NO (sin música). La elección se guarda en el navegador y la canción suena siempre, en los menús y en los combates. Para añadir otra canción: copiarla a `music/` y añadirla a `SONGS` en `js/audio.js`. La música chiptune original sigue en el código, apagada (`CHIPTUNE` en `js/audio.js`).

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

Los 12 luchadores usan solo las hojas generadas (A–E en `images/sprites/`); los primeros diseños (`images/*.jpg`, de otro estilo) ya no se usan. Mario, Peño y MadeverXP tienen además la hoja E (bloqueo, golpe de pie y segunda pose de victoria). Los demás usan la guardia para bloquear, el gesto de dolor agachado al recibir golpes y su pose de victoria con un saltito. Las caras del HUD, la selección y el súper se recortan de la pose de combate de cada uno, todas con el mismo encuadre y a más resolución que los sprites.

**Personajes nuevos:** los pasos y los prompts para crear un personaje desde fotos (hoja base y hojas A–E) están en [`docs/pose-prompts.md`](docs/pose-prompts.md#new-characters-manu-casado-madeverxp).

## Estructura

Guía para hacer cambios a mano (dónde están los sprites, golpes, rondas, música, controles, escenarios…): [`docs/GUIDE.md`](docs/GUIDE.md).

- `js/core.js` — canvas, utilidades, texto pixel, input (teclado por jugador / mandos / táctil), efectos
- `js/audio.js` — canciones de fondo (`music/`), SFX sintetizados (pulso/triángulo/ruido) y la música chiptune original (apagada)
- `js/art.js` — esqueleto + poses con keyframes, y la definición de cada personaje (`CH`)
- `js/art_hd.js` — luchadores dibujados por código (para los que aún no tienen sprites)
- `js/sprites.js` — luchadores con los sprites de los diseños: carga, animaciones y caras del HUD
- `tools/` — herramienta que convierte los diseños en sprites (`build_sprites.py`, `sprite-cutter.html`, `sprites.config.js`)
- `js/world.js` — escenarios procedurales con parallax, suelo en perspectiva, público, palomas, lluvia
- `js/fight.js` — luchadores, frame data, IA, proyectiles, HUD
- `js/supers.js` — los súpers: escena de cada personaje (guion, objetos y efectos)
- `js/story.js` — título, controles, datos de escenarios (el modo historia está comentado)
- `js/versus.js` — selección de personaje y escenario, combate 1P vs CPU / 2P, pausa y revancha
- `js/main.js` — bucle principal (60 Hz fijo). Atajos dev: `#cpu`, `#2p`, `#fight=0..4`, `#fight2p=0..4`
