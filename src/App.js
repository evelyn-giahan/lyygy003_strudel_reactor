// src/App.js
import "./App.css";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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
import ControlPanel from "./components/ControlPanel";
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

  // ---- Boot Strudel REPL once ----
  useEffect(() => {
    // make sure the Strudel setup runs only once, the first time the app loads.
    // if I don’t gate it, React re-renders could try to create multiple editors.
    if (hasRun.current) return;
    hasRun.current = true;

    // monkey patch console so Strudel logs show up as expected and
    // logArray is built for the D3 visualiser.
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

      // D3-based bar graph driven by the console-monkey-patch data.
      // x-axis: index 0..99, y-axis: lpenv (or cutoff as fallback).
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
          svg.selectAll("*").remove();
          return;
        }

        // parse each line and extract lpenv (or cutoff if lpenv missing)
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
        const x = d3
          .scaleBand()
          .domain(parsed.map((d) => d.x))
          .range([0, innerWidth])
          .padding(0.1);

        // y: lpenv / cutoff value
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
  const handleSaveSettings = () => {
    const settings = {
      p1Hush,
      tempo,
      volume,
    };
    // This calls into settingsStorage.js which logs the object + JSON string.
    saveSettings(settings);
  };

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

  // ---- Manual handlers ----
  // This function applies my custom preprocess function to the template text.
  const handlePreprocess = () => {
    // pass in the whole state so preprocess can decide what to change.
    const next = preprocess(template, { p1Hush, tempo, volume });
    setProcessed(next);
    // after preprocessing, push the new code into StrudelMirror.
    if (globalEditor) globalEditor.setCode(next);
  };

  // Preprocess and then immediately play.
  const handleProcPlay = () => {
    handlePreprocess();
    if (globalEditor) globalEditor.evaluate();
  };

  // Plays whatever code is currently inside the Strudel editor.
  const handlePlay = () => {
    if (globalEditor) globalEditor.evaluate();
  };

  // Stop the current playback.
  const handleStop = () => {
    if (globalEditor) globalEditor.stop();
  };

  return (
    <div className="app-root">
      {/* Hero header */}
      <header className="app-header-hero">
        <h1 className="app-title text-uppercase">Strudel Demo</h1>
        <a href="#" className="app-header-link">
          Instruction
        </a>
      </header>

      <div className="container-fluid app-main py-4 app-container">
        <div className="row gx-3 gy-4 align-items-start">
          {/* LEFT BLUE PANEL */}
          <aside className="col-lg-3 col-xl-3 d-flex justify-content-start">
            <div className="side-panel shadow-sm">
              <div className="side-panel-inner">
                <h5 className="section-heading mb-3">Audio Controls</h5>
                <AudioControls
                  tempo={tempo}
                  onTempo={setTempo}
                  volume={volume}
                  onVolume={setVolume}
                />
                <hr />
                <h5 className="section-heading mb-3">Instrument Controls</h5>
                <ControlPanel p1Hush={p1Hush} onChangeP1={setP1Hush} />
                
                {/* JSON Save / Load buttons */}
                <hr />
                <h5 className="section-heading mb-3">Settings JSON</h5>
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
