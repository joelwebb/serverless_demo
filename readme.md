<div id="top"></div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="#">
    <img src="static/logo2.png" alt="Logo">
  </a>

<h3 align="center">Gridfall Chronicles</h3>

  <p align="center">
    This repo contains the gridfall App
    <br />
    <a href="#"><strong>Explore the docs »</strong></a>
    <br />
  </p>
</div>



 


<!-- TABLE OF CONTENTS -->
## Table of Contents
<details>
  <summary>Display Contents</summary>
  <hr>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#codebase-structure">Codebase Structure</a></li>
    <li><a href="#installation-and-usage">Installation</a></li>
    <ul>
        <li><a href="#labeling-tool">Labeling Tools</a></li>
        <li><a href="#tutorials-&-examples">Tutorials & Examples</a></li>
    </ul>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project
This repo holds the code for gridfall!

If you are fighting with DS_Stores, run this in your terminal and kill them all forever! 
```defaults write com.apple.desktopservices DSDontWriteNetworkStores true```

<br />
<br />

<!-- codebase-structure -->
## ✨ Codebase structure

The project has a simple structure, represented as below:

```bash
< PROJECT ROOT >
    |--- .github/workflows/actions/
    |-- docs/
        |--- index.html
    |-- static/
        |--- css/
        |--- images/
        |--- js/
    |-- templates/
        |--- index.html
        |--- etc.html
    |-- tests/
        |--- etc.html
    |-- requirements.txt
    |-- zappa_settings.json
    |-- app.py
    |-- readme.md
    
```
<br />


<!-- Installation and Usage-->
## Installation And Usage
To run this app, create a virtual environment:
```
pip install virtualenv
virtualenv env
```

Activate your env
```
source env/bin/activate

#windows
env/scripts/activate.sh
```

INstall packages in the env
```
pip install -r requirements.txt
```

Once you have them installed, use zappa for interacting with the app 

```
zappa status dev
```

```

<!-- roadmap -->
## Roadmap
# Gridfall Chronicles - TODO.md

## 1. Project Setup

- [ ] Initialize repository and virtual environment
  - Create `requirements.txt` (Flask, Flask-Login, SQLAlchemy, etc.)
  - Create basic Flask application structure:
    - `/app/__init__.py`, `/app/models.py`, `/app/routes.py`, `/app/static/`, `/app/templates/`
  - Configure application factory and settings (`config.py`)

## 2. Database & Models

- [ ] Define SQLAlchemy models in `models.py`:
  - `User` (id, username, email, password_hash, cloud_backup_enabled)
  - `Hero` (id, user_id, name, level, hp, stats, equipment, abilities)
  - `Enemy` (id, level_id, type, hp, stats, is_boss, behavior)
  - `Equipment` (id, name, stats, special_ability)
  - `TerrainTile` (id, type, damage, status_effect)
  - `Level` (id, map_layout, terrain_tiles, background_image)
  - `BattleState` (id, user_id, level_id, hero_positions, enemy_positions, turn)
  - `SaveSlot` (id, user_id, slot_number, data)
  - `Ability` (id, hero_id, name, type, level_requirement, effect)

## 3. Authentication & Backup

- [ ] Implement user registration and login
  - Routes: `/register`, `/login`, `/logout`
  - Use Flask-Login for session management
  - Templates: `register.html`, `login.html`
  - Forms & validation (WTForms)

- [ ] Local & cloud backup
  - Frontend: toggle for local vs. cloud backup
  - Backend: endpoints `/backup/local` and `/backup/cloud`
  - Integrate with chosen cloud storage API (e.g., AWS S3 / Firebase)

## 4. Landing Page

- [ ] Create `landing.html`
  - Links to Login & Registration
  - Buttons to enable local/cloud backup
  - CSS: responsive, mobile-first layout

## 5. Main Menu & Home Screen

- [ ] Create `home.html`
  - Display notifications area (JS polling or WebSocket)
  - "Play Next Level" button → `/map`
  - Bottom navigation bar (shared partial `_navbar.html`)
    - Buttons: Maps, Team, Events, Shops, Settings
  - CSS: bottom-fixed nav, icon assets

## 6. Map Page

- [ ] Create `map.html`
  - Render map image + SVG overlay for spots
  - JS: draw glowing circle at current level
  - JS: show dotted path to next unlock
  - Unlock logic: call backend route `/api/progress` → JSON of unlocked levels
  - Click handler: `onSpotClick(levelId)` → redirect to `/battle/<levelId>`

## 7. Battle Screen

- [ ] Create `battle.html`
  - HTML grid 7×5 (flex or CSS grid)
  - Overlay background image (semi-transparent)
  - JS modules:
    - `grid.js`: initialize positions, render heroes/enemies
    - `dragTimer.js`: start 4s timer on drag start
    - `movement.js`: handle drag, nudges (cardinal only), snapping to last valid tile
    - `terrain.js`: detect tile effects on move, apply damage/status immediately
    - `attack.js`: check pincer/combat at end-of-turn and when enemies cornered
    - `enemyAI.js`: move enemies up to 7 random valid squares, handle boss behavior
    - `animations.js`: CSS class toggles for movement trails, attacks, traps

- [ ] Backend battle logic (`routes.py`)
  - GET `/battle/<levelId>` → serve template + initial state JSON
  - POST `/battle/<levelId>/resolve` → accept final positions, compute:
    - HP changes, pincer attacks, terrain effects
    - Enemy death, hero revival placement
    - EXP tally and save to user profile
    - Return updated state for UI

## 8. Team, Characters, Equipment & Embers

- [ ] Create master lists:
  - [ ] Equipment items (weapons, armor, accessories)
  - [ ] Ember types (tiers, elemental/ability modifiers)
- [ ] Define attributes for each equipment item:
  - [ ] Base stats (attack, defense, magic, speed, etc.)
  - [ ] Rarity tiers and stat scaling factors
  - [ ] Special ability parameters (cooldown, effect strength)
- [ ] Define Ember attributes:
  - [ ] Passive buffs (stat boosts, status resistances)
  - [ ] Active triggers (on hit, on move, on death)
  - [ ] Tier system and rarity
- [ ] Create imagery assets:
  - Concept sketches for each equipment and ember
  - Final icon assets (512×512 PNGs)
  - Thumbnail versions (64×64, 128×128)
  - Optimize assets for web/mobile (compression)
- [ ] Write descriptions and lore:
  - Flavor text for each item and ember
  - Mechanical effect summaries
- [ ] Database model updates:
  - Extend `Equipment` model with image paths, rarity, ability refs
  - Create new `Ember` model (id, name, tier, effect_json, image_path)
  - Generate migration scripts
- [ ] Equipment & Ember management UI:
  - `equipment.html` and `embers.html` pages
  - Filtering, searching, sorting UI components
  - Drag-and-drop equip/unequip features
  - Visual indicators for equipped slots
- [ ] API endpoint implementation:
  - GET `/api/equipment`, `/api/embers` (with filters)
  - POST `/api/equipment/equip`, `/api/equipment/unequip`
  - POST `/api/ember/equip`, `/api/ember/unequip`
  - Ensure updates reflect in user’s profile and hero stats
- [ ] Hero model and UI integration:
  - Update `Hero` model to include equipment_slots and ember_slots fields
  - Hero detail page showing stats augmented by gear and embers
  - API for hero creation, update, and retrieval (`/api/hero`)
- [ ] Gameplay integration:
  - Equipment stat and ability effect calculations in battle resolution
  - Ember effect hooks in movement, attack, and terrain modules
  - Visual feedback (CSS animations) when ember or equipment abilities trigger

## 9. Save & Load Game Save & Load Game

- [ ] Implement Save Slots UI in settings or home
  - Routes: `/save`, `/load/<slotNumber>`
  - Backend: serialize `BattleState` and user progress to `SaveSlot`

## 10. Lore & Story Integration

- [ ] Define lore outline for each level:
  - [ ] Tutorial (world intro, NPC guidance)
  - [ ] Castle Dungeon (history of the fallen kingdom, enemy backstory)
  - [ ] Forest Ruins (ancient civilization lore, relics)
  - [ ] Frozen Keep (legend of the ice queen)
  - [ ] Volcanic Forge (origin of ember magic)
  - [ ] Boss Arenas (specific boss origins and motivations)
  - [ ] Epilogue Scenes (conclusion and future teasers)
- [ ] Create data model for per-level lore entries:
  - New `LevelLore` model (id, level_id, title, content, trigger_type)
  - Migration scripts to add `lore_entries` table
- [ ] Populate initial lore content:
  - Write title and full text for each level’s lore entry
  - Store content in JSON or DB seed scripts
- [ ] Script story beats and dialogue:
  - Intro cutscenes (level start)
  - Mid-level events (on reaching specific tiles/events)
  - Post-level transition texts (victory/defeat)
- [ ] Asset creation for lore presentation:
  - Illustrations/backgrounds for each story entry
  - UI templates/partials for cutscene panels (`lore.html` enhancements)
- [ ] Integrate lore triggers in UI and gameplay:
  - Map: display lore tooltip when level icon is tapped
  - Battle: trigger dialogue panels at boss HP thresholds
  - Level clear: show story snippet on victory screen
- [ ] Backend routes and endpoints:
  - GET `/api/levels/<levelId>/lore` returns lore data
  - POST triggers if dynamic events needed
- [ ] QA and polish:
  - Test lore flow on mobile UI for readability
  - Verify correct lore entry loads for each level
  - Adjust timing of cutscenes and trigger points

## 11. Abilities & Progression Abilities & Progression

- [ ] Ability data model, level requirements
- [ ] UI for active/passive abilities (`abilities.html`)
- [ ] JS to trigger active abilities (AoE, line, ring, etc.)
- [ ] Backend: compute ability effects server-side for validation
- [ ] EXP & leveling routes: `/api/levelup` → apply stat boosts or unlock abilities

## 12. Boss & Special Enemy Logic

- [ ] Extend `Enemy` model for boss stats and forms
- [ ] Implement boss movement (2–7 tiles), AoE specials
- [ ] Lifecycle: on HP reach zero → transform or end level

## 13. Animations & CSS Effects

- [ ] Create `static/css/animations.css`
  - Keyframes for tile moves, trap triggers, pincer attacks, level-clear animation
- [ ] Integrate CSS class toggles in JS modules

## 14. Testing & QA

- [ ] Unit tests for Python logic (pytest)
- [ ] Frontend tests (Jest or Cypress)
- [ ] Manual playthroughs for each level type

## 15. Deployment

- [ ] Dockerfile & `docker-compose.yml`
- [ ] Production WSGI config (Gunicorn)
- [ ] CI pipeline setup (GitHub Actions)


<!-- LICENSE -->
## License
All rights reserved. Fully Owned by Vitality Robotics. 

<!-- CONTACT -->
## Contact
Joe Webb - joe.webb@vitalityrobots.com

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

We would like to tip our hat to our contributors:
<a href = "https://github.com/Vitality-Robotics-Inc/vitality-tools/graphs/contributors">
  <img src = "https://contrib.rocks/image?repo = joelwebb/serverless-labeling-tool"/>
</a>

Made with [contributors-img](https://contrib.rocks).
<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
