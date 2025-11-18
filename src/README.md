# Strudel Demo – Part B README

This is my Strudel demo web app for the React assignment. It wraps the provided `stranger_tune` in a custom UI with audio controls, instrument controls, theming, JSON save/load, a D3 visualiser, and a split view for template vs processed code plus a live Strudel editor.

---

## 1. What my controls do

### 1.1 Audio Controls (left panel – “Audio Controls”)

- **Tempo slider**
  - Range: 60–200 BPM.
  - Updates a `tempo` state and injects `setcps(tempo/60/4)` into the header.
  - If music is playing, it reprocesses and restarts playback with the new tempo.

- **Volume slider**
  - Range: 0.00x to 2.00x.
  - Injects a global `all(x => x.postgain(volume))` into the header.
  - While playing, changing it reprocesses and restarts audio at the new volume.

- **Mute button**
  - Toggles `isMuted` and remembers `lastVolume`.
  - Mute: sets `volume` to 0 and re-runs audio muted.
  - Unmute: restores `lastVolume` (or 1.0) and re-runs audio at that level.
  - Label shows `0x` when muted and e.g. `1.25x` when unmuted.

---

### 1.2 Instrument Controls (left panel – “Instrument Controls”)

- **p1: ON / p1: HUSH**
  - Two radio buttons that toggle a `p1Hush` flag.
  - Template markers used: `<p1_radio>`, `<p1_block_start>`, `<p1_block_end>`.
  - p1: ON – markers are removed and the block plays normally.
  - p1: HUSH – `<p1_radio>` becomes `~` and everything between `<p1_block_start>` / `<p1_block_end>` is commented out.
  - Works as a simple “mute this voice” control from the UI.

---

### 1.3 Theme Controls (left panel – “Theme Controls”)

- **Theme switch**
  - Toggles a `darkMode` state and applies `theme-light` or `theme-dark` on the root.
  - Light theme: baby-blue palette, soft panels, light cards.
  - Dark theme: dark backgrounds, light text, adjusted buttons and visualiser frame.
  - Label updates between “Light theme” and “Dark theme”.

---

### 1.4 Settings JSON (left panel – “Settings JSON”)

- **Save settings**
  - Saves `p1Hush`, `tempo`, and `volume` as JSON in `window.localStorage` under the key `strudelSettings_v1`.
  - Logs both the settings object and JSON string to the console.

- **Load settings**
  - Reads and parses JSON from `localStorage`.
  - Safely restores `p1Hush` (boolean), `tempo` (number), and `volume` (number) if present.
  - Lets me quickly restore favourite tempo / volume / p1 setups.

---

### 1.5 HeaderBar buttons (above the visualiser)

- **Preprocess**
  - Runs `preprocess(template, { p1Hush, tempo, volume })`.
  - Updates the “Final Processed Output” panel and the Strudel editor.
  - Does not start playback.

- **Proc & Play**
  - Calls `runWithState()`:
    - Preprocesses with current `p1Hush`, `tempo`, `volume`.
    - Stops any existing playback.
    - Loads the new code into the editor and starts playback.
  - Main one-click button.

- **Play**
  - Calls `globalEditor.evaluate()`.
  - Plays whatever is currently in the live Strudel editor (no new preprocess).

- **Stop**
  - Calls `globalEditor.stop()` and sets `isPlaying` to `false`.

---

### 1.6 Editor + Processed Output (middle-right)

- **Text to Preprocess**
  - Large textarea bound to `template`, initialised with `stranger_tune`.
  - Where users type or paste Strudel template code (including markers like `<p1_radio>`).

- **Final Processed Output**
  - Read-only view of the `preprocess()` result.
  - Shows:
    - Removed `setcps(...)` lines.
    - New header: `setcps(tempo/60/4)`, `all(x => x.postgain(volume))`, `all(x => x.log())`.
    - How p1-related markers were expanded or commented.

---

### 1.7 Strudel Live Code Editor (bottom card)

- Contains the StrudelMirror editor (`globalEditor`).
- This is the code that actually runs on Play / Proc & Play.
- Preprocessed code is pushed here, but it can also be edited manually for live tweaks.

---

### 1.8 Visualiser (top right – black box with bars)

- SVG element with id `visualiser`.
- `onDraw`:
  - Uses `getD3Data()` to read recent log lines from the console monkey patch.
  - Extracts numeric `lpenv:` or `cutoff:` values and maps them to `(x, y)` data points.
- D3:
  - Clears and redraws axes and bars every frame.
  - Uses a vertical gradient (light blue → baby pink).
  - Shows a live bar chart that moves with the logged values from the music.

---

## 2. Quirks and usage notes (for markers)

### 2.1 Browser audio gesture

- Uses Web Audio via `webaudioOutput`.
- Browsers usually need a user gesture before audio can start.
- On first load, the very first click might be silent; one extra click on Play or Proc & Play usually unlocks audio.

---

### 2.2 Template vs live editor

- **Text to Preprocess** – main template textarea (with markers).  
- **Live Strudel Code Editor** – bottom editor that actually runs.

Flow:

- Preprocess / Proc & Play:
  - Start from the template.
  - Run `preprocess()`.
  - Push the result into the live editor.
- Play:
  - Plays current content of the live editor only.

Editing the live editor does not sync back into the textarea (by design).

---

### 2.3 Tempo handling and `setcps` removal

- Some Strudel examples contain their own `setcps(...)`.
- `preprocess()` removes old `setcps(...)` lines that are alone on a line.
- Then adds a single `setcps(tempo/60/4)` based on the slider.
- The tempo slider is the single source of truth for tempo.

---

### 2.4 Volume and mute state

- Dragging volume to `0`:
  - Sets `volume = 0` and `isMuted = true`.
- Dragging it above `0`:
  - Sets `isMuted = false`.
- Mute button:
  - On mute: stores last non-zero volume in `lastVolume`.
  - On unmute: restores that value (or `1.0` as fallback).

---

### 2.5 Visualiser depends on log format

- Visualiser expects log lines containing `lpenv:` or `cutoff:`.
- Logging is enabled via `all(x => x.log())` in the header.
- If a tune does not produce these fields, bars may be flat or empty, but audio still plays.

---

### 2.6 Settings JSON and localStorage

- Save / Load use `window.localStorage`.
- Settings persist across refreshes in the same browser profile, but not incognito or different browsers.
- Any `localStorage` errors are caught and logged so the app does not crash.

---

### 2.7 Routing

- Uses `react-router-dom`:
  - `/` – main Strudel demo.
  - `/instructions` – instruction page.
- The “Instruction” link in the header goes to `/instructions`.

---

## 3. Demonstration video link

I will add the final demo video link here after I record and upload it.

**Video link:**  
https://mymailunisaedu-my.sharepoint.com/:v:/g/personal/lyygy003_mymail_unisa_edu_au/IQB2PZCfXCsTTKb1wD-j--bWAUwIDo19S0_0O8weYt5pjx0?e=QvboB7&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D

I'm so sorry but it's over 5 mins, I tried to do it faster but there were to many things to say

## 4. Bonus features I would like to claim

### Layout, theme, and styling

- Hero header with gradient background and title.
- Left blue control panel using a Bootstrap accordion.
- Right main area includes:
  - Visualiser with transport buttons.
  - Template vs processed output view.
  - Live Strudel editor at the bottom.
- Rounded cards and a baby-blue palette for the light theme.
- Full dark theme that restyles header, cards, side panel and buttons.
- This is the area I am most confident in: eye-catching but still clear and easy to read.

---

## 5. Song code sources

- The only tune I use in the app is the assignment-provided `stranger_tune` imported from `./tunes`.
- I did **not** include any other Strudel bakery song code in the final submission.

During development, I briefly used patterns from:

- https://strudel.cc/workshop/getting-started/

These examples were only pasted into **“Text to Preprocess”** to test that:

- The input field works with other Strudel examples.
- My preprocess function and visualiser still behave correctly with different code.

Those workshop snippets were **only used for testing** and are **not** part of my final submitted tune.

## 6. AI Usage

This project used an AI assistant (ChatGPT, OpenAI) to help reason about the D3 visualiser logic.  
Below is the main prompt and a summary of the response.

### Prompt 1 Input

I’m building a Strudel demo React app. I have a StrudelMirror editor and I want to draw a live D3 bar visualiser every time Strudel calls `onDraw`. The data is coming from a helper `getD3Data()` which returns an array of log lines that contain `lpenv:` or `cutoff:` values.

I need help to figure out the logic to write `onDraw` function that:

- Selects `<svg id="visualiser">`
- Reads the current width from `getBoundingClientRect()` so the chart is responsive
- Parses each log line and uses `lpenv` (or `cutoff` if `lpenv` is missing) as the y-value
- Clears the SVG on every frame, then draws a bar chart with D3 using a gradient from light blue to pink
- Adds x and y axes (x ticks every 10 items)

### Output Prompt 1

* I did use markdown to modify the output to make it look better, but the output look exactly the same

1. **Select the SVG safely**  
   Try to select `#visualiser`; if it doesn’t exist (e.g. component not mounted), exit early to avoid errors.

2. **Measure the drawing area**  
   Use `getBoundingClientRect()` on the SVG to get the current width for responsiveness, and read its `height` attribute. Compute an inner width/height with margins so axes and bars fit neatly.

3. **Fetch and parse Strudel log data**  
   Call `getD3Data()` to get log lines. For each line:
   - Prefer the numeric value after `lpenv:`
   - If missing, fall back to the value after `cutoff:`
   - If neither exists, treat it as `0`  
   Map them into `{ x: index, y: value }`. If there’s no data, clear the SVG and return.

4. **Clear the previous frame**  
   Remove all existing children from the SVG so each `onDraw` renders a fresh frame instead of drawing on top of old bars.

5. **Create a chart group and gradient**  
   - Append a `<g>` with a `translate(left, top)` transform for margins.  
   - Append `<defs>` with a `<linearGradient id="gradient">` that fades from light blue at the bottom to pink at the top. Bars later use `fill="url(#gradient)"`.

6. **Set up D3 scales and axes**  
   - X: band scale over the indices (0..N-1) mapped to the inner width with padding.  
   - Y: linear scale from `[0, maxY]` to `[innerHeight, 0]`.  
   - Add a bottom axis (showing only every 10th tick) and a left axis with ~5 ticks, styled in a light colour.

7. **Draw the bars**  
   Bind the parsed data to `rect` elements using `.join("rect")`.  
   For each bar, set:
   - `x` from the band scale
   - `width` from `bandwidth()`
   - `y` from the y scale
   - `height` as `innerHeight - y(d.y)`
   - `fill` as `url(#gradient)`

8. **Pitfalls highlighted by the AI**  
   - Handle missing SVG / zero width safely.  
   - Clear the SVG when there is no data.  
   - Be aware of potential gradient ID clashes if you ever stop clearing the SVG.  
   - Limit x-axis ticks to avoid clutter.  
   - Full re-draw per frame is fine for ~100 bars but may not scale to very large datasets.

### Prompt 2 Input

I want to add a very small JSON save/load feature for my React Strudel app.  
In `App.js`, I already have three state variables I want to store:

- `tempo`
- `volume`
- `p1Hush`

I decided to move the save/load logic into a separate helper file called `settingsStorage.js` so `App.js` stays clean.

I want this helper module to do the following:

- Define a constant `STORAGE_KEY` (for example `"strudelDemo.settings.v1"`) which both functions use.
- Provide a function `saveSettings(settings)` that:
  - Takes an object like `{ tempo, volume, p1Hush }`
  - Uses `JSON.stringify()` to turn it into a JSON string
  - Saves it into `localStorage` under `STORAGE_KEY`
  - Logs both the original object and the JSON string so I can debug what was saved
- Provide a function `loadSettings()` that:
  - Reads from `localStorage` using `STORAGE_KEY`
  - If nothing is found, returns `null`
  - If something is found, tries to parse it with `JSON.parse()` in a `try/catch`
  - If parsing fails, logs the error and returns `null`
  - If parsing succeeds, logs the parsed object and returns it

I also want to wire this into `App.js` with two handlers:

- `handleSaveSettings`:
  - Collect `{ tempo, volume, p1Hush }` from state
  - Call `saveSettings(settings)`

- `handleLoadSettings`:
  - Call `loadSettings()` and store the result in `loaded`
  - If `loaded` is `null`, just return early
  - Otherwise:
    - If `typeof loaded.p1Hush === "boolean"`, call `setP1Hush(loaded.p1Hush)`
    - If `typeof loaded.tempo === "number"`, call `setTempo(loaded.tempo)`
    - If `typeof loaded.volume === "number"`, call `setVolume(loaded.volume)`
  - This type checking is to stop corrupted data from breaking the app.

### Prompt 2 Output

I created a small helper file called **`settingsStorage.js`** to handle saving and loading my app settings (tempo, volume, and p1Hush).  
This keeps the save/load logic separate from `App.js`.

#### settingsStorage.js

```js
// src/lib/settingsStorage.js
const STORAGE_KEY = "strudelDemo.settings.v1";

export function saveSettings(settings) {
  try {
    const json = JSON.stringify(settings);
    console.log("[saveSettings] object:", settings);
    console.log("[saveSettings] json:", json);
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error("[saveSettings] failed:", err);
  }
}

export function loadSettings() {
  try {
    const json = window.localStorage.getItem(STORAGE_KEY);
    if (!json) {
      console.log("[loadSettings] no settings found");
      return null;
    }
    const obj = JSON.parse(json);
    console.log("[loadSettings] parsed:", obj);
    return obj;
  } catch (err) {
    console.error("[loadSettings] failed:", err);
    return null;
  }
}
```

#### App.js

```js

import { saveSettings, loadSettings } from "./lib/settingsStorage";

const handleSaveSettings = () => {
  const settings = { p1Hush, tempo, volume };
  saveSettings(settings);
};

const handleLoadSettings = () => {
  const loaded = loadSettings();
  if (!loaded) return;

  if (typeof loaded.p1Hush === "boolean") setP1Hush(loaded.p1Hush);
  if (typeof loaded.tempo === "number") setTempo(loaded.tempo);
  if (typeof loaded.volume === "number") setVolume(loaded.volume);
};

```



