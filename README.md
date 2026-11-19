# CROWNLINE

**Build your empire. Define your legacy.**  
An original browser-based open-world prototype by **JagX Studios — JagX and JRILICENSE**.

## Current build

This repository contains the first playable browser prototype: a procedurally drawn fictional coastal African city, a drivable player vehicle, moving traffic, pedestrians, district labels, a minimap, mission markers, rewards, and local save progress.

### Play locally

Open `index.html` in a modern desktop browser, or serve the repository with any static web server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

The prototype is client-side and does not require an account or backend. You can now leave the vehicle, explore on foot, and return to the parked vehicle with F.

## Controls

| Key | Action |
|---|---|
| W / ↑ | Accelerate |
| S / ↓ | Reverse / brake |
| A / ← | Steer left |
| D / → | Steer right |
| Space | Handbrake |
| E | Interact near an objective |
| Esc | Pause / resume |
| M | City map hint |

## Project structure

```
index.html       Game shell and HUD
styles.css       Responsive cinematic interface
src/game.js     World simulation, driving, missions and save system
README.md        Project documentation
```

## Product direction

CROWNLINE is planned as a PC-first open-world game inspired by selected African countries and real-world geography, with fictionalised buildings, characters, businesses and stories. This browser build is an early gameplay and visual prototype, not the final 3D release.

## Next milestones

1. Improve driving physics, collision and camera feel.
2. Add on-foot character movement and enterable interiors.
3. Add mission dialogue, NPC interactions and a richer city.
4. Add country/region selection and a larger world map.
5. Replace prototype geometry with original licensed 3D assets.
6. Add accessibility, performance settings and automated browser tests.

All original game code and branding in this repository are being developed for CROWNLINE. Third-party fonts and any future external assets must retain their respective licences.
