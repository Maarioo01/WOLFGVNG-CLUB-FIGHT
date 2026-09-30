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
| Súper (barra azul llena) | T | O · Num 0 |

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
| RB / R1 · RT / R2 | Súper |
| B / ○ | Volver (menús) |
| Menu / Options | Pausa · confirmar |
| View / Create | Pausa |

## Personajes

Diseños de referencia en `images/`. Los personajes se dibujan por código (`CH` en `js/art.js`); sus especiales y súpers están en `SPECIALS` en `js/fight.js`.

| Personaje | Especial | Súper |
|---|---|---|
| Mario | ¡Directo! (puñetazo con carrerilla) | ¡KO Técnico! |
| Peño | ¡Golazo! (balón que bota) | ¡Hat-trick! |
| Alba | ¡Mortal! (patada voladora) | ¡Sin piedad! |
| Álvaro | ¡Gorrazo! (lanza la gorra) | ¡A lo loco! |
| Belli | ¡Embestida! (carga que derriba) | ¡Modo bestia! |
| Bene | ¡Saque! (pelota de tenis rápida) | ¡Match point! |
| Carlottis | ¡Chanclazo! (lanza la sandalia) | ¡Trenzazo! |
| Marcos | ¡Agarrón! (embestida con agarre) | ¡A lo grande! |
| Oso | ¡Terremoto! (pisotón con onda) | ¡Abrazo de oso! |

**Dificultad de la CPU:** Fácil / Medio / Difícil, en el menú principal y en el menú de pausa.

## Estructura
- `js/core.js` — canvas, utilidades, texto pixel, input (teclado por jugador / mandos / táctil), efectos
- `js/audio.js` — sintetizador chiptune (pulso/triángulo/ruido), SFX y secuenciador de música
- `js/art.js` — esqueleto + poses con keyframes, y la definición de cada personaje (`CH`)
- `js/art_hd.js` — dibujo detallado de los luchadores: cuerpo, ropa, cabeza grande con cara, pelo, barba y gafas, y retratos del HUD / selección
- `js/world.js` — escenarios procedurales con parallax, suelo en perspectiva, público, palomas, lluvia
- `js/fight.js` — luchadores, frame data, IA, proyectiles, HUD
- `js/story.js` — título, controles, datos de escenarios (el modo historia está comentado)
- `js/versus.js` — selección de personaje y escenario, combate 1P vs CPU / 2P, pausa y revancha
- `js/main.js` — bucle principal (60 Hz fijo). Atajos dev: `#cpu`, `#2p`, `#fight=0..4`, `#fight2p=0..4`
