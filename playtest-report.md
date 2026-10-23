# Playtest — 23 October 2026

Seven complete simulated runs used normal game rules, aiming, ammo swapping, rail movement, hopping and live projectile collisions. No forced victories, health changes or invulnerability were used. These runs check progression and mechanics; the aiming agent is more accurate than a human player, so the times are not difficulty estimates.

| Run | Result | Game time | Shots | Repositions | Enemy casts | Wards countered |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Adventure / First Dream | Clear | 37.23 s | 94 | 0 | — | — |
| Adventure / Bamboo Steps | Clear | 31.68 s | 113 | 1 | — | — |
| Practice / Floating Garden | Clear | 38.40 s | 111 | 28 | — | — |
| Duel / Paper Phantom | Clear | 9.65 s | 40 | 7 | 1 | 2 |
| Duel / Lantern Wisp | Clear | 18.53 s | 100 | 9 | 2 | 8 |
| Duel / Moon Moth | Clear | 16.33 s | 88 | 17 | 1 | 3 |
| Duel / Storm Wraith | Clear | 20.53 s | 111 | 0 | 2 | 6 |

## Issues found and fixed

- **Final-wave stall:** Both Adventure runs originally remained active after 220 seconds despite exceeding the score goal. Repeated knockback pinned the remaining chain near the entrance. Cleanup now exposes the tail even while retreat is queued, and only supplies remaining colors. Both replays finish.
- **Passive opponents:** Accurate chain matching could suppress every cast in two Duels. Wards now remain active during ordinary damage windows; cascades cancel whole casts. Every replay includes enemy attacks and successful ward counters.
- **Detached firing orb:** The loaded orb now has an animated colored dream-breath connection to Baku's curled trunk. Firing adds a pulse and recoil; the displayed orb and actual projectile origin stay aligned. Eight aim directions were visually inspected.
- **Ambiguous mobile movement:** A dedicated strip separates repositioning from the aim pad. Releasing it cannot fire or swap. Aim swipes use the same sensitivity on both axes, with fine movement and a bounded fast swipe.
- **Controller input edges:** Fixed button-edge handling so swaps, hops and menu actions fire once per press, while the trigger repeats. Menu selection does not also fire a projectile.
- **Pause composition:** Moved the Baku portrait so its loaded orb clears the PAUSED heading.
- **Enemy readability:** Moved enemy names and health into the HUD where the chain cannot cover them. Wards stay at least 90 pixels from the launcher, keeping the creature and loaded orb visible.

## Additional checks

- All six smoke, arena, trial, audio, input and render suites pass.
- Thirteen moving arenas have targets blocked from one position and reachable from another; tests sweep real projectiles through both cases.
- Four enemy patterns have warning time, actual moving collision, wrong-color absorption, matching counters, chain-speed pressure and cascade interruption.
- Actual browser touch input covers aiming, hold fire, swapping, hopping, movement, pause and results. Keyboard and simulated standard-controller input cover menus and gameplay. Physical controller hardware was not attached.
- Chrome layouts at 375×667, 390×844, 430×932, 844×390 and desktop sizes have no document scrolling or overflow.
- Title, map, Gauntlet, trials, settings, pause, results and game-over screens were rendered and visually checked.
- The real stereo Web Audio graph was rendered offline: peak about 0.057, RMS about 0.0105, no clipping. The score is 72 BPM with sparse plucks, flute, bells and quiet sustained harmony.
- Browser checks reported no JavaScript errors. Gameplay rendered in about 0.23 ms per frame in the headless desktop check; that is not a mobile hardware benchmark.

Run `node tests/playthroughs.cjs` while the game server is running on port 4173. The script accepts `BASE_URL` and `CHROME_PATH` overrides and writes its detailed report and screenshots to the system temporary directory.
