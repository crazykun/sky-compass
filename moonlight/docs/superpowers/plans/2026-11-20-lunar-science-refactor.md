# Lunar Science Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Preserve the existing lunar education experience while adding a real astronomy mode, modular source files, deterministic interaction state, responsive layouts, and measurable rendering improvements.

**Architecture:** Native browser ES modules share a DOM-independent store. Astronomy Engine 2.1.19 is vendored locally; real and teaching models implement the same view contract. One visibility-aware animation scheduler drives all Canvas renderers, and the moon texture renderer uses reduced internal resolutions with cached geometry.

**Tech Stack:** HTML5, CSS, native JavaScript modules, Canvas 2D, Astronomy Engine 2.1.19, Node.js `node:test`, browser GUI regression tests.

## Global Constraints

- Preserve the dark/gold visual direction and all existing core sections.
- No runtime CDN or build step; serve through a local/static HTTP server.
- Real mode and teaching mode must be explicitly labelled and must not share misleading date semantics.
- Keep `backups/index-20261120-original.html` unchanged.
- Do not commit or push; this workspace is not a git repository.

---

### Task 1: Scientific model and validation

**Files:**
- Create: `js/astro.js`, `js/lunar.js`, `tests/load-astronomy.mjs`, `tests/astronomy.test.mjs`, `tests/lunar.test.mjs`.
- Consume: `assets/vendor/astronomy.browser.min.js`.

**Interfaces:**
- `phaseAt(date): { phase, elongation, illumination }`
- `lunarMonthAround(date): { start, end, quarters, lengthDays, dayCount }`
- `dateForMonthDay(date, dayIndex): Date`
- `dateAtPhase(date, fraction): Date`
- `solarToLunar(date): { y, m, d, leap }`

- [x] Write failing tests for the 2024-04-08 solar-eclipse new moon, 2024-09-18 full moon, 2026-11-20 illumination, quarter ordering, 29/30-day month counts, and lunar dates 2000-01-01 and 2026-11-20.
- [x] Run `node --test tests/*.test.mjs`; expect missing-module failure.
- [x] Implement validated date bounds, phase calculations, quarter enumeration and interpolation.
- [x] Re-run tests; expect all tests to pass with key-phase tolerance below two minutes.

### Task 2: Central view store

**Files:**
- Create: `js/store.js`, `js/data.js`, `tests/store.test.mjs`.

**Interfaces:**
- `getView()` returns `{ mode, date, phase, illumination, dayIndex, dayCount, monthProgress, lunar, month, phaseName, alias, description }`.
- `setMode(mode)`, `setDate(date)`, `setDay(index)`, `setPhase(fraction)`, `setMonthProgress(fraction)`, `subscribe(listener)`.

- [x] Test real/sim switching, day selection, phase wrapping, month-progress clamping and subscriber notification.
- [x] Implement the smallest DOM-independent store that satisfies the tests.
- [x] Re-run all unit tests.

### Task 3: Static HTML/CSS and rendering primitives

**Files:**
- Replace: `index.html` (content only; retain backup).
- Create: `css/base.css`, `css/theme.css`, `css/layout.css`, `css/mobile.css`, `js/moon.js`, `js/animation.js`.

**Interfaces:**
- `drawMoon(ctx,cx,cy,r,phase,craters=true)` preserves existing waxing/waning semantics.
- `addAnimation(fn,{element, fps})` returns an unsubscribe function; the scheduler stops while hidden and skips offscreen elements.

- [x] Move existing markup/styles without the inline texture or script.
- [x] Add real/sim controls, a date input, a scientific note, accessible labels and live regions.
- [x] Add mobile single-column rules for timeline/detail/poetry and `prefers-reduced-motion` rules.
- [x] Check that the page loads before feature modules are attached without script syntax errors.

### Task 4: Feature module migration and interaction repair

**Files:**
- Create: `js/main.js`, `js/starfield.js`, `js/lunar-calendar.js`, `js/solar-system.js`, `js/timeline.js`, `js/kids.js`, `js/moon-detail.js`.

**Interfaces:**
- Every feature exports `init...(deps)` and subscribes to `getView()` rather than owning a competing date variable.
- Timeline and solar playback stop each other; manual selection stops both and synchronizes all displays.

- [x] Migrate calendar, hero, cause diagram, poems and theme switching.
- [x] Migrate timeline/3D and fix waning HUD clipping and complete reset synchronization.
- [x] Fix quiz scoping with `#kidOpts .kid-opt`; provide retry/next-question behavior and leave orbit tabs enabled.
- [x] Make calendar cells and child cards keyboard-operable with roles, labels and focus styles.
- [x] Run desktop GUI smoke tests for every control.

### Task 5: Texture and rendering performance

**Files:**
- Modify: `js/moon-detail.js`, `js/starfield.js`, `js/animation.js`.
- Consume: `assets/moon-texture.jpg`.

- [x] Cache sphere geometry and reusable `ImageData` buffers per quality level.
- [x] Render at 320px while moving and at most 520px at rest; upscale to the existing 760px display canvas.
- [x] Limit automatic detail rendering to 15 FPS and skip it offscreen/hidden.
- [x] Add DPR-capped starfield sizing and reduce particles for narrow/reduced-motion displays.
- [x] Verify texture loading, landmarks, front/back/reset and drag behavior.

### Task 6: Regression and documentation

**Files:**
- Create: `README.md`, `docs/science.md`.
- Modify: any module implicated by test failures.

- [x] Run `node --test tests/*.test.mjs` and `node --check` on every JavaScript source file.
- [x] Browser-test real/sim mode, arbitrary dates, exact quarter selection, calendar/timeline/3D synchronization, kid wrong/right answers, reset, texture and theme.
- [x] Test 1280×720, 390×844 and 320×720; require no document horizontal overflow.
- [x] Record screenshots under `gui-test-screenshots/` and report any unsupported console-log collection honestly.
- [x] Document startup (`python3 -I -m http.server 8765 --bind 127.0.0.1 --directory .`), scientific limitations, vendor license and backup location.
