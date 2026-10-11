# Rainbow Ride (Regenboogrit)

A mobile-friendly Three.js game: ride a unicorn along a rainbow, explore cloud castles and dragon backs, and solve arithmetic questions to earn a safe flying boost.

## Run locally

Node.js is sufficient. Game code and Three.js are included in `dist/`; no install or build is required.

```sh
node server.mjs
```

Open http://localhost:4173. A device on the same Wi-Fi network can use the computer's LAN address and port 4173 if its firewall allows it. The hosted version is published through Sites.

## Language and controls

The first launch asks the player to choose Dutch or English. The choice is saved and can be changed using the NL/EN menu button. Menus, instructions, questions, hints, feedback, accessibility labels, results, and number formatting follow the selected language. Saved review questions are translated when shown; changing language preserves progress and records.

Swipe left/right to change lanes, up to jump, and down to duck. Large touch buttons are also available. Desktop controls support arrow keys, WASD, and Space; Escape pauses. Fairy arches contain five low stars that can only be collected while ducking, including on raised routes. At least every third ordinary obstacle row includes an arch, with a clear escape lane.

## Speed and timer

Advanced settings contain three increasingly fast adventure modes:

| Mode | Original adventure speed | Starting speed | Maximum after ten active minutes |
| --- | --- | --- | --- |
| Easy | 100% | 12 | 34 |
| Normal (default) | 120% | 14.4 | 40.8 |
| Hard | 150% | 18 | 51 |

Speeds are world units per second before boosts. Each multiplier applies to the entire speed curve. Speed rises about 46% above its starting value after 30 active seconds, 77% after one minute, and more than doubles after two minutes. Obstacle frequency also increases. Pauses, countdowns, and questions do not count as active running time.

The previous adventure setting migrates to Normal; the previous calm setting migrates to Easy. Existing adventure records remain accessible under Easy. Each mode has separate records.

The arithmetic timer defaults to 30 seconds. Options are Practice (unlimited), Relaxed (60 seconds), Quick (30 seconds), and Challenge (15 seconds). It applies per question, including rescues, and pauses while the page is hidden. Correct answers stop it immediately. Expiry on an ordinary question reveals the answer and continues without a boost; expiry on a rescue question ends the run.

## Arithmetic practice

Choose a Dutch school group from 3 to 8, then turn individual topics off or on. These are adjustable practice profiles, not an assessment of the full curriculum. English uses the same Dutch group profiles.

| Group | Default practice |
| --- | --- |
| 3 | Addition and subtraction below 20 |
| 4 | Addition/subtraction below 100; tables 1, 2, 5, and 10 with factors up to 5 |
| 5 (default) | Addition/subtraction below 100; tables 1-5 with factors up to 5; matching division |
| 6 | Addition/subtraction below 1,000; all tables; division; simple fractions |
| 7 | Group 6 topics, plus decimals and percentages |
| 8 | Addition/subtraction below 10,000; all tables; division; wider fraction and percentage practice; decimals |

All appropriate topics start enabled when a group is selected. The default is a gentle beginning-of-group-5 mix, with both multiplication factors from 1 to 5. The player decides when to try harder material.

Customize addition/subtraction limits using 10, 20, 50, 100, 1,000, 10,000, or a whole number from 2 to 10,000. Operands and results stay strictly below that limit and are never negative. Select tables 1-10 individually, with factors up to 3, 5, or 10. Division reverses the selected multiplication facts. Decimals, fractions, and percentages follow the group profile rather than the whole-number limit.

Starting is disabled without an enabled topic, or when tables/division are enabled without a selected table. Restore defaults resets group topics, limits, and tables while preserving timer, speed, and language. Choices persist after reloading. Review questions respect the active practice profile, so excluded topics and tables do not reappear.

## Routes, boosts, and rescues

Rainbow ramps lead onto cloud platforms and dragon backs. The first route has ramps up and down; later routes include gaps and rooftop obstacles. Catch ramps permit safe lower landings after missed jumps. Ramp transitions are smooth, and a clear lane on the base rainbow remains available. Leaving a raised route lets the unicorn fall back down. Dragons without a rainbow path are obstacles.

A correct first answer gives a four-second boost, up to triple speed, and five stars. The unicorn rises six world units and visibly flies over dragons, clouds, and fairy arches while the camera follows. Using a hint, or answering correctly after one mistake, gives a smaller 2.5-second boost and two stars.

After two wrong answers, the solution stays visible until the player chooses to continue on the ground without a boost or math reward. Each ordinary question starts with two attempts. The original timer continues during the retry and stops when the solution is revealed.

Both boosts end with a separate 1.6-second descent: height and speed ease down, wings fold, and running resumes. Flight obstacles have passed before descent begins, followed by three seconds of protected clear runway. Physics uses small simulation steps to handle lower frame rates. Approaching a math gate does not abruptly cancel a jump.

Difficult questions return after intervening questions. One correct rescue answer can continue a crashed run, up to three times. Another crash within five active seconds after a rescue ends the run. A wrong rescue answer also ends it.

## Progress and records

The end screen shows the latest distance and a prominent high score. A shorter run never overwrites a record. Records are separated by group, enabled topics, applicable limits, speed, and timer. Language is not part of a record's identity. Existing records remain stored when practice combinations change.

Stars, unlocked coats, settings, arithmetic progress, and high scores are stored only in the current browser. Devices do not automatically share progress.

## Source structure

Source identifiers, comments, and documentation are English. Dutch translations live in a separate locale catalog. The first-launch picker intentionally shows both language names.

- `dist/app.mjs`: menu, input, question dialogs, and persistence
- `dist/engine.mjs`: timing, movement, collisions, boosts, and rescues
- `dist/course.mjs`: ramps, raised routes, heights, and flight paths
- `dist/rules.mjs`: settings, migration, profile identity, and difficulty
- `dist/practice.mjs`: group profiles, topic selection, and question generation
- `dist/questions.mjs`: arithmetic data and localized prompts/hints
- `dist/i18n.mjs`: translation, number formatting, and DOM localization
- `dist/locales/nl.mjs`: Dutch translations keyed by English messages
- `dist/timer.mjs`: pausable arithmetic timer
- `dist/world.mjs`: procedural 3D models and camera
- `dist/audio.mjs`: gentle Web Audio sounds
- `dist/vendor/`: Three.js r180 and its MIT license

Models are generated from geometry. Fonts have system fallbacks.

## Verification

```sh
node --test
```

Tests cover arithmetic boundaries, input, collisions, boosts, rescue limits, a twelve-minute run, ramps, jumping between roofs, height collisions, visible flight clearance, safe landings at 20/30/60/120 FPS in all speed modes, early acceleration, duck-only stars, retries, and narrow-screen camera framing.

Simulated DOM tests cover question flows, assisted boosts, persistent records, practice customization, reload persistence, first-launch language selection, English feedback and decimal input, translated saved reviews, and speed selection. Translation checks validate static message coverage and placeholder consistency. Browser QA complements these tests; touch controls on a physical device still require manual checking.
