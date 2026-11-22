# umbra-vault-stealth

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/0xdedipra/umbra-vault-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/0xdedipra/umbra-vault-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**UMBRA VAULT** is a top-down stealth heist set in a night museum, drawn entirely with procedural Canvas 2D — no image, audio or font files, and no network. Across three floors (the Galeri Kartika painting wing, the Rumah Kaca botanical court, and the laser-woven Brankas Bawah vault) you steal the Kartika collection piece by piece and slip out the EXIT unseen. Guards patrol learnable routes with pauses and look-arounds, carrying flashlights whose cones are raycast against real walls, pillars and display cases; a darkness layer with lamp pools and moonlight decides how visible you are, and the HUD's IN SHADOW / EXPOSED readout tells you where it is safe to stand. Detection is a meter, not a switch — distance, light, crouching and running all change how fast it fills, and breaking line of sight lets it drain, so a near miss is a scare you can recover from. Sleeping guards can be discovered by their colleagues, cameras sweep red cones that feed a building-wide alarm (a wall panel blinds them for twenty seconds), laser beams cycle on a readable beat across the vault approaches, and a thrown coin can pull a patrol off its route. Each floor is graded with stars for the target, the full haul, and a GHOST bonus for never being truly seen. All sound is synthesised WebAudio, including guard footsteps that swell as a patrol you cannot see draws closer.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser — the game runs fully offline from the static files under `game/`. Move with WASD or the arrow keys; hold SHIFT to run (faster, but your footsteps carry and guards turn toward the noise), and C or CTRL to crouch (slower and quieter, and low enough to hide behind display cases, planters and benches). Press E to steal an artefact from its case, to silently take down an unsuspecting guard from behind, or to use a camera panel; press F to throw a coin toward the mouse and draw a guard away; R restarts the floor, P pauses, and M mutes. Steal each floor's marked target, help yourself to the side loot, and reach the glowing EXIT — every floor is scored on loot, time, and how often you were truly seen.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7h35kkm4&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
