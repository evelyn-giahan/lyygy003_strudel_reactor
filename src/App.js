// src/App.js
// Main React component for my Strudel demo.
// This file wires everything together:
// - React state (tempo, volume, p1Hush, darkMode, etc.)
// - StrudelMirror editor + audio
// - D3 visualiser that reads real Strudel logs (via console_monkey_patch)
// - All the small UI components (audio controls, instrument controls, editor, etc.)

import "./App.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as d3 from "d3";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

import { StrudelMirror } from "@strudel/codemirror";
import { evalScope } from "@strudel/core";
import {
  initAudioOnFirstClick,
  getAudioContext,
  webaudioOutput,
  registerSynthSounds,
} from "@strudel/webaudio";
import { transpiler } from "@strudel/transpiler";
import { registerSoundfonts } from "@strudel/soundfonts";

import { stranger_tune } from "./tunes";
import console_monkey_patch, { getD3Data } from "./console-monkey-patch";

import HeaderBar from "./components/HeaderBar";
import EditorPanel from "./components/EditorPanel";
import ReplOutput from "./components/ReplOutput";
import InstrumentControls from "./components/InstrumentControls";
import AudioControls from "./components/AudioControls";
import { preprocess } from "./lib/preprocess";
import { saveSettings, loadSettings } from "./lib/settingsStorage"; // JSON helpers

// I keep a global reference to the Strudel editor so the buttons
// (Play / Stop / Proc & Play) can call evaluate() and stop()
let globalEditor = null;

// this is to make sure even if React re-renders later, it doesn’t boot Strudel again
export default function StrudelDemo() {
  const hasRun = useRef(false);

  // ---- App state (single source of truth) ----
  // This is the "template" text the user edits in the left textarea.
  const [template, setTemplate] = useState(stranger_tune);
  // This is the processed version of the text that is actually sent to Strudel.
  const [processed, setProcessed] = useState(stranger_tune);
  // p1Hush is linked to the radio buttons and controls whether <p1_Radio> becomes "_".
  const [p1Hush, setP1Hush] = useState(false);
  // These are the sliders in AudioControls. Right now I pass them into preprocess()
  // so I can adapt the Strudel code if I want to change tempo and volume.
  const [tempo, setTempo] = useState(140); // BPM
  const [volume, setVolume] = useState(1.0); // 1.0 = normal loudness
  //adding new state for dark mode toggle (false = light, true = dark)
  const [darkMode, setDarkMode] = useState(false);
  //this state is to track whenever the playbakc is running
  const [isPlaying, setIsPlaying] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(1.0);

  // Helper to re-run preprocess() using the current template + state,
  // and immediately restart playback with the new tempo/volume.
  // nextTempo / nextVolume let me override just those two when sliders move.
  function runWithState({ nextTempo = tempo, nextVolume = volume } = {}) {
    const nextCode = preprocess(template, {
      p1Hush,
      tempo: nextTempo,
      volume: nextVolume,
    });

    setProcessed(nextCode);

    if (globalEditor) {
      // always stop the old pattern first before loading new code
      globalEditor.stop();

      globalEditor.setCode(nextCode);
      globalEditor.evaluate();
    }

    setIsPlaying(true);
  }

  // ---- Boot Strudel REPL once ----
  useEffect(() => {
    // make sure the Strudel setup runs only once, the first time the app loads
    // if I don’t gate it, React re-renders could try to create multiple editors
    if (hasRun.current) return;
    hasRun.current = true;

    // monkey patch console so Strudel logs show up as expected and
    // logArray is built for the D3 visualiser
    //
    // Originally I faked visualiser data using Math.sin(...) just to make
    // the bars move, but that wasn’t connected to the real sound at all.
    // After tutor feedback, I changed it so console_monkey_patch captures
    // actual Strudel log lines (with lpenv/cutoff values), and getD3Data()
    // gives me a rolling buffer for the D3 graph. So now the graph reacts
    // to real musical events instead of fake math
    console_monkey_patch();

    // show events up to 2 seconds before the current beat and 2 seconds after
    const drawTime = [-2, 2]; // visible time window Strudel uses for onDraw

    // create a StrudelMirror editor and connect it to the hidden #editor div.
    globalEditor = new StrudelMirror({
      defaultOutput: webaudioOutput, // use WebAudio as output
      getTime: () => getAudioContext().currentTime, // sync with AudioContext time
      transpiler,
      root: document.getElementById("editor"), // mounted in bottom card
      drawTime,

      // D3-based bar graph driven by the console-monkey-patch data
      // x-axis: index 0..99, y-axis: lpenv (or cutoff as fallback)
      //
      // onDraw is called repeatedly by Strudel while the pattern is running
      // Here I build the bar chart:
      //   - X axis  = index in the log buffer (0 = oldest event, last = newest event)
      //   - Y axis  = numeric lpenv/cutoff value for that event
      // So the bars show “how strong / bright” each recent event is (height)
      // and in which order they happened (left → right)
      onDraw: () => {
        const svg = d3.select("#visualiser");
        if (svg.empty()) return;

        // real width from DOM so it responds to layout changes
        const node = svg.node();
        const rect = node.getBoundingClientRect();
        const width = rect.width || 600;
        const height = parseFloat(svg.attr("height")) || 220;

        // current rolling array of log lines from console_monkey_patch
        const rawData = getD3Data();
        if (!rawData || rawData.length === 0) {
          // nothing logged yet → clear the svg so old bars don’t hang around
          svg.selectAll("*").remove();
          return;
        }

        // parse each line and extract lpenv (or cutoff if lpenv missing)
        // Each data point becomes { x: index, y: value }:
        //   x = 0..N-1, older events on the left, newest on the right
        //   y = parsed lpenv / cutoff number (this drives bar height)
        const parsed = rawData.map((line, i) => {
          const match =
            /lpenv:([0-9.]+)/.exec(line) || /cutoff:([0-9.]+)/.exec(line);
          const yVal = match ? parseFloat(match[1]) : 0;
          return { x: i, y: yVal };
        });

        // chart margins and inner drawing area
        const margin = { top: 10, right: 10, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // clear previous frame so we can redraw fresh from the latest array
        svg.selectAll("*").remove();

        // main <g> wrapper with margin transform
        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        // gradient definition for pretty bars
        const defs = svg.append("defs");
        const gradient = defs
          .append("linearGradient")
          .attr("id", "gradient")
          .attr("x1", "0%")
          .attr("x2", "0%")
          .attr("y1", "100%")
          .attr("y2", "0%");

        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#91b8f7ff")
          .attr("stop-opacity", 0.7);

        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#ffacdbff")
          .attr("stop-opacity", 1.0);

        // x: index of log entry (0..99)
        //    This is my horizontal axis. It doesn’t use real seconds,
        //    but just the order of events in the buffer:
        //    older events on the left, newer events on the right.
        const x = d3
          .scaleBand()
          .domain(parsed.map((d) => d.x))
          .range([0, innerWidth])
          .padding(0.1);

        // y: lpenv / cutoff value
        //    This is my vertical axis. Bigger lpenv/cutoff -> taller bar
        //    I scale it so 0 is at the bottom and max is near the top
        // Note that if the song code doesn't have any lpenv or cutoff value, the visualiser won't work
        const yMax = d3.max(parsed, (d) => d.y) || 1;
        const y = d3
          .scaleLinear()
          .domain([0, yMax])
          .range([innerHeight, 0]);

        // axes (only show some x ticks to avoid clutter)
        const xAxis = d3
          .axisBottom(x)
          .tickValues(parsed.filter((d) => d.x % 10 === 0).map((d) => d.x));
        const yAxis = d3.axisLeft(y).ticks(5);

        g.append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(xAxis)
          .attr("color", "#aaa");

        g.append("g").call(yAxis).attr("color", "#aaa");

        // bars: height is based on the parsed lpenv/cutoff
        // Each <rect> is one event from the log:
        //   - x position = its index on X axis
        //   - height     = its lpenv/cutoff value mapped through Y scale
        //   - fill       = my blue→pink gradient
        g.selectAll(".bar")
          .data(parsed)
          .join("rect")
          .attr("class", "bar")
          .attr("x", (d) => x(d.x))
          .attr("width", x.bandwidth())
          .attr("y", (d) => y(d.y))
          .attr("height", (d) => innerHeight - y(d.y))
          .attr("fill", "url(#gradient)");
      },

      // load all required modules and soundfonts
      prebake: async () => {
        initAudioOnFirstClick();
        const loadModules = evalScope(
          import("@strudel/core"),
          import("@strudel/draw"),
          import("@strudel/mini"),
          import("@strudel/tonal"),
          import("@strudel/webaudio")
        );
        await Promise.all([
          loadModules,
          registerSynthSounds(),
          registerSoundfonts(),
        ]);
      },
    });

    // load the default Strudel tune into the REPL output when the page first loads.
    // without this, the editor starts empty and no music will play until the user adds code manually.
    if (globalEditor) {
      globalEditor.setCode(processed);
    }
  }, []); // run once – hasRun + this empty dependency keeps the setup stable

  // ---- JSON Save / Load handlers ----
  // Build a small plain JS object from my React state and hand it to saveSettings().
  const handleSaveSettings = () => {
    const settings = {
      p1Hush,
      tempo,
      volume,
    };
    // This calls into settingsStorage.js which logs the object + JSON string.
    saveSettings(settings);
  };

  // Try to restore any saved settings from localStorage via loadSettings().
  const handleLoadSettings = () => {
    const loaded = loadSettings();
    if (!loaded) return;

    // Safely restore each field if it exists.
    if (typeof loaded.p1Hush === "boolean") {
      setP1Hush(loaded.p1Hush);
    }
    if (typeof loaded.tempo === "number") {
      setTempo(loaded.tempo);
    }
    if (typeof loaded.volume === "number") {
      setVolume(loaded.volume);
    }
  };

  // When tempo slider moves, update state and, if we are already playing,
  // re-run the pattern with the new tempo
  const handleTempoChange = (newTempo) => {
    setTempo(newTempo);

    if (isPlaying) {
      runWithState({ nextTempo: newTempo });
    }
  };

  // When volume slider moves, update state + mute flag and,
  // if playing, re-run the pattern with the new volume
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);

    // if user drags slider above 0, remember it as “normal” volume
    if (newVolume > 0) {
      setLastVolume(newVolume);
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }

    if (isPlaying) {
      runWithState({ nextVolume: newVolume });
    }
  };

  // This handles the mute button logic:
  // - Unmuted -> Muted: remember last non-zero volume, set volume=0 and re-run if needed
  // - Muted   -> Unmuted: restore lastVolume (or 1.0) and re-run if needed
  const handleToggleMute = () => {
    if (!isMuted) {
      // going from unmuted -> muted
      const safeLast = volume > 0 ? volume : lastVolume || 1.0;
      setLastVolume(safeLast);
      setIsMuted(true);
      setVolume(0);

      if (isPlaying) {
        runWithState({ nextVolume: 0 });
      }
    } else {
      // going from muted -> unmuted
      const restored = lastVolume || 1.0;
      setIsMuted(false);
      setVolume(restored);

      if (isPlaying) {
        runWithState({ nextVolume: restored });
      }
    }
  };

  // ---- Manual handlers ----
  // This function applies my custom preprocess function to the template text
  const handlePreprocess = () => {
    // pass in the whole state so preprocess can decide what to change.
    const next = preprocess(template, { p1Hush, tempo, volume });
    setProcessed(next);
    // after preprocessing, push the new code into StrudelMirror.
    if (globalEditor) globalEditor.setCode(next);
  };

  // Preprocess and then immediately play.
  const handleProcPlay = () => {
    runWithState(); // uses current tempo + volume
  };

  // Plays whatever code is currently inside the Strudel editor
  const handlePlay = () => {
    if (globalEditor) {
      globalEditor.evaluate();
      setIsPlaying(true);
    }
  };

  // Stop the current playback
  const handleStop = () => {
    if (globalEditor) {
      globalEditor.stop();
      setIsPlaying(false);
    }
  };

  return (
    <div className={`app-root ${darkMode ? "theme-dark" : "theme-light"}`}>
      {/* Hero header */}
      <header className="app-header-hero">
        <h1 className="app-title text-uppercase">Strudel Demo</h1>
        <Link to="/instructions" className="app-header-link">
          Instruction
        </Link>
      </header>

      <div className="container-fluid app-main py-4 app-container">
        <div className="row gx-3 gy-4 align-items-start">
          {/* LEFT BLUE PANEL */}
          <aside className="col-lg-3 col-xl-3 d-flex justify-content-start">
            <div className="side-panel shadow-sm w-100">
              <div className="side-panel-inner">
                {/* I swapped the old stacked headings for an accordion so the left panel feels less crowded */}
                <div className="accordion" id="sideControlsAccordion">

                  {/* Audio section */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="audioControlsHeading">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#audioControlsBody"
                        aria-expanded="true"
                        aria-controls="audioControlsBody"
                      >
                        Audio Controls
                      </button>
                    </h2>
                    <div
                      id="audioControlsBody"
                      className="accordion-collapse collapse show"
                      aria-labelledby="audioControlsHeading"
                    >
                      <div className="accordion-body">
                        <AudioControls
                          tempo={tempo}
                          onTempo={handleTempoChange}
                          volume={volume}
                          onVolume={handleVolumeChange}
                          isMuted={isMuted}
                          onToggleMute={handleToggleMute}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instrument section */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="instrumentControlsHeading">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#instrumentControlsBody"
                        aria-expanded="false"
                        aria-controls="instrumentControlsBody"
                      >
                        Instrument Controls
                      </button>
                    </h2>
                    <div
                      id="instrumentControlsBody"
                      className="accordion-collapse collapse"
                      aria-labelledby="instrumentControlsHeading"
                    >
                      <div className="accordion-body">
                        <InstrumentControls p1Hush={p1Hush} onChangeP1={setP1Hush} />
                      </div>
                    </div>
                  </div>

                  {/* Theme / dark–light toggle */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="themeControlsHeading">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#themeControlsBody"
                        aria-expanded="false"
                        aria-controls="themeControlsBody"
                      >
                        Theme Controls
                      </button>
                    </h2>
                    <div
                      id="themeControlsBody"
                      className="accordion-collapse collapse"
                      aria-labelledby="themeControlsHeading"
                    >
                      <div className="accordion-body">
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="themeSwitch"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="themeSwitch">
                            {darkMode ? "Dark theme" : "Light theme"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* JSON save / load controls */}
                  <div className="accordion-item">
                    <h2 className="accordion-header" id="jsonSettingsHeading">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#jsonSettingsBody"
                        aria-expanded="false"
                        aria-controls="jsonSettingsBody"
                      >
                        Settings JSON
                      </button>
                    </h2>
                    <div
                      id="jsonSettingsBody"
                      className="accordion-collapse collapse"
                      aria-labelledby="jsonSettingsHeading"
                    >
                      <div className="accordion-body">
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={handleSaveSettings}
                          >
                            Save settings
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handleLoadSettings}
                          >
                            Load settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                {/* end accordion */}
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN AREA */}
          <section className="col-lg-9 col-xl-9">
            {/* 1. Visualiser + buttons */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <div className="visualiser-wrapper mb-3">
                  <svg
                    id="visualiser"
                    height="220"
                    className="visualiser-svg"
                  />
                </div>

                <div className="d-flex justify-content-center">
                  <HeaderBar
                    onPreprocess={handlePreprocess}
                    onProcPlay={handleProcPlay}
                    onPlay={handlePlay}
                    onStop={handleStop}
                  />
                </div>
              </div>
            </div>

            {/* 2. Editor + processed output side by side */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h6 className="section-heading mb-0">
                      Text to Preprocess
                    </h6>
                  </div>
                  <div className="card-body pt-2">
                    {/* This is the large textarea the user edits, one the left side of the right part, first column */}
                    <EditorPanel template={template} onChange={setTemplate} />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h6 className="section-heading mb-0">
                      Final Processed Output
                    </h6>
                  </div>
                  <div className="card-body pt-2">
                    {/* This shows the processed code after clicking Preprocess / Proc & Play. */}
                    <ReplOutput processed={processed} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BOTTOM: Strudel live code editor (black box) */}
            <div className="card shadow-sm border-0 mt-4">
              <div className="card-header bg-transparent border-0 pb-0">
                <h6 className="section-heading mb-0">
                  Live Strudel Code Editor
                </h6>
              </div>
              <div className="card-body pt-2">
                {/* StrudelMirror mounts here */}
                <div id="editor" />
                <div id="output" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
