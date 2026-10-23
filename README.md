# Baku — Dream Eater

A standalone, portrait-first marble shooter with a Japanese-inspired ink-and-paper dreamscape. An original indigo-and-plum Baku chimera protects a curled-up sleeping ink cat. Dispel the brightly colored nightmare orbs before they reach the cat.

The optimized Baku illustration is embedded in `index.html`; the cat, scenery, sound, effects and interfaces are drawn or synthesized there. There are no runtime downloads, accounts or dependencies. Open it directly in Safari or Chrome, or serve it as a static page. Audio begins after the first interaction. Existing campaign progress is preserved from the earlier theme. The master artwork and its generation prompt are in `assets/`.

## Play

- Tap the arena to aim and shoot, or drag and release for precision.
- Drag the lower aim pad for remote aiming. Hold FIRE for repeated shots; SWAP exchanges the current and next colors. Gentle movements aim precisely; faster swipes travel farther, with the same sensitivity on both axes.
- **EAT** inhales up to six visible orbs matching the loaded color. It starts charged and refills through matches and cascades. Protected orbs beneath tunnels or closed shutters cannot be swallowed. Consumed special orbs activate their powers.
- Drag Baku along a horizontal or vertical rail on sliding stages, or use the separate movement strip above the aim pad. Releasing the movement strip never shoots or swaps. Thirteen moving arenas have solid paper cover: relocate to open a firing lane. Cover also blocks inhale.
- Tap an empty floating island or HOP to jump between launch positions. Baku cannot shoot during the short jump.
- Pause opens resume, restart, settings, home and map controls. The lore screens have been removed.

Desktop: mouse aims, left click fires, right click swaps. WASD aims in eight directions; hold Space to fire; Enter also fires; X/Shift swaps; B inhales; J/Tab hops; P/Escape pauses; M toggles effects. Hold arrow keys along a rail to move Baku; left/right rotate the aim on other stages. Menus support arrows/Tab, Enter/Space, and Escape.

Standard controllers: right stick aims; left stick moves along a rail (or aims on other stages); hold R2/RT or A/Cross to fire; X/Square or L1/LB swaps; B/Circle inhales; Y/Triangle or R1/RB hops; Start pauses. Menus support D-pad/left stick, A/Cross to select and B/Circle to go back. A dead zone prevents stick drift. Controller menu activation never also fires a shot. Controller checks use simulated standard-mapping input; physical hardware was not attached for testing.

## Different scenes, different rules

- **Mirror Lake, Silver Reflection and Moon Mirror:** Shots bounce off the side mirrors, up to twice. Aim around obstructing rows and make bank shots. The aiming guide follows the reflected trajectory.
- **Paper Doors, Folded Horizons and Endless Doorway:** Shots entering one edge emerge from the opposite edge, up to twice. A shot never hits orbs in the space skipped by the door. The guide shows the wrap.
- **Floating Garden, Twin Dreams and Floating Islands:** Two floating launch islands create different shooting angles. Some combine hopping with crossing bridges or paper doors.
- **Paper Shutters and Paper Labyrinth:** Timed shutters protect a section for 2.2 seconds and open for 4.3 seconds. The rings show the remaining time.
- **Bamboo Steps, Lantern Cascade, Cloud River, Painted Sands and Quiet Pagoda:** Bamboo ink strokes, lanterns, cloud washes, raked-sand lines and pagoda silhouettes distinguish the arenas. Short courses apply pressure sooner; long stepped mazes allow more planning.

There are 22 authored tracks: straight switchbacks, zigzags, spirals, rectangular mazes, a figure eight and petal-like formations. Four layouts slide horizontally, four slide vertically, six have hopping islands, eight use timed shutters, and four contain crossing tunnels. Protected underground sections cannot be shot; visible overpass marbles can.

## Chain feel and readability

Every gap closes by pulling its **front section backward**, including gaps with different colors at their ends. Forward movement and spawning pause while sections rejoin. Matching colors retract faster and can trigger cascades.

A normal match also gives an 80-pixel retreat; bigger clears and deeper cascades push farther, with queued knockback capped at seven pearl diameters. Reverse moves at 105 pixels/second independently of Slow or Lucid effects. Retreat pauses spawning and keeps targets visible near the entrance.

Baku uses an original textured indigo, plum and ivory portrait with a shaggy mane, an elephant trunk and striped tiger paws. A ribbon of colored dream-breath connects its curled trunk to the loaded orb, with a pulse and recoil on firing. The animal stays upright as it aims. Rearward orbs pass behind the portrait. The 44-pixel loaded orb has the same position as the projectile origin; idle movement and recoil affect the body rather than shifting the aim. The front screens share pale paper, restrained ink branches and plum controls.

After the score goal is met, the final chain rolls out of the entrance rather than getting pinned there by repeated knockback. Cleanup ammo uses only colors remaining in the chain.

Chain orbs are 33 pixels wide in red, lime, royal blue, yellow, magenta and ivory. Each color has a persistent, different texture and emblem. Settings include extra symbol contrast, gentle effects, aim assist, separate music/effects switches and music volume.

## Modes

- **Adventure:** 76 levels across 13 stages, preserving the classic campaign ordering while using original dreamscape layouts.
- **Gauntlet:** Practice clears a finite target; Survival keeps increasing speed and color pressure. Per-map records are separate.
- **Dream Sprint:** Three-minute score attack with a match multiplier up to ×8.
- **Iron Baku:** Ten routes with one life and a cumulative score.
- **Heroic:** The campaign with six colors, faster chains and higher targets.
- **Nightmare Duels:** Four original opponents cast a moving triad, a lantern fan, an arc around the launch position, or sweeping storm wards. Each cast has a 1.25-second warning. Wards absorb shots and briefly increase chain speed by 28%. Shoot a ward's displayed color to break it, refill inhale and open a damage window. Chain matches also expose the enemy and stop the speed pressure; cascades clear the whole ward wave and interrupt the cast. Wards remain obstacles during ordinary damage windows, so positioning and shot order matter. Matching inhale can consume wards. Shoot the exposed opponent's displayed color to damage it.
- **Weekly:** A seeded Sprint route changes each Monday UTC, with a local best for each week.

Lucid mode provides rapid fire, bonus points and a blast every third match. Coins, dream gifts, on-beat shots, gap shots, streaks, power orbs and cascades add scoring options. Scores and progress remain on this device.

The original 72 BPM ambient score leaves space between soft plucks, breathy flute and lingering bells, with a long room tail. Lucid mode adds quiet sustained harmony; danger never adds urgent drums. Effects use softer water/wood/bell-like tones. This is synthesized fantasy music, rather than a reconstruction of a traditional performance.

## Verification

```bash
node tests/smoke.mjs
node tests/arenas.mjs
node tests/trials.mjs
node tests/audio.mjs
node tests/input.mjs
node tests/render.mjs
node tests/playthroughs.cjs
```

Input and render tests use `@napi-rs/canvas` from the development environment. Full playthroughs use Playwright with Chrome and the local server at `http://127.0.0.1:4173/` (override with `BASE_URL` and `CHROME_PATH`). Runtime gameplay requires no packages. Tests cover campaign progression, chain joining, cascades, retreat, reflected/wrapped swept collision, cover-dependent visibility, inhale, rails, hopping, gates, tunnels, enemy casting and counters, touch/keyboard/controller input, final-wave cleanup and gesture-gated audio. See `playtest-report.md` for findings from seven complete simulated runs.

Optional developer keys: backtick opens tuning; F1 shows collision circles; F2 shows counters; F4 slows simulation; F5 advances a level; F6 toggles invulnerability.

For GitHub Pages, publish `index.html` from the repository root. No build is required.
