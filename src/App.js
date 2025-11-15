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
import console_monkey_patch from "./console-monkey-patch";

import HeaderBar from "./components/HeaderBar";
import EditorPanel from "./components/EditorPanel";
import ReplOutput from "./components/ReplOutput";
import ControlPanel from "./components/ControlPanel";
import AudioControls from "./components/AudioControls";
import { preprocess } from "./lib/preprocess";

// I keep a global reference to the Strudel editor so the buttons
// (Play / Stop / Proc & Play) can call evaluate() and stop()
let globalEditor = null;

// this is to even if React re-renders later, don’t boot Strudel again
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
  //so I can adapt the Strudel code if I want to change tempo and volume
  const [tempo, setTempo] = useState(140); // BPM
  const [volume, setVolume] = useState(1.0); // 1.0 = normal loudness

  // ---- Boot Strudel REPL once ----
  useEffect(() => {

    //make sure the Strudel setup runs only once, the first time the app loads, if don't use it, many elements might duplicates multiple time causing crash
    if (hasRun.current) return;
    hasRun.current = true;

    //monkey patch console so Strudel logs show up as expected.

    console_monkey_patch();

    //show events up to 2 seconds before the current beat and 2 seconds after
    const drawTime = [-2, 2]; //visible time window Strudel uses for onDraw


    //create a StrudelMirror editor and connect it to the hidden #editor div.
    globalEditor = new StrudelMirror({
      defaultOutput: webaudioOutput, // use WebAudio as output
      getTime: () => getAudioContext().currentTime, //syncs with AudioContext time
      transpiler,
      root: document.getElementById("editor"),  // mounted in bottom card
      drawTime,

      // D3-based pastel bar visualiser representing Strudel playback
      onDraw: (haps, time) => {
        //select the SVG where I want to draw the bars.
        const svg = d3.select("#visualiser");
        if (svg.empty()) return;

        //use the actual width from the DOM so it adapts to the layout
        const node = svg.node();
        const rect = node.getBoundingClientRect();
        const width = rect.width || 600;
        const height = parseFloat(svg.attr("height")) || 220;

        //haps (happenings, maybe...) is the list of musical events Strudel gives
        const data = haps && haps.length > 0 ? haps : [];

        // If no events, clear and bail
        if (data.length === 0) {
          svg.selectAll("rect.bar").remove();
          svg.selectAll("line.playhead").remove();
          return;
        }

        const barWidth = width / data.length;

        // Pastel rainbow colour scale
        const colorScale = d3
          .scaleSequential()
          .domain([0, data.length - 1])
          .interpolator((t) => d3.hsl(t * 360, 0.6, 0.75).formatHex());

        // Height based on time plus index so it moves smoothly but doesn't "stack"
        const bars = svg.selectAll("rect.bar").data(data, (_d, i) => i);

        bars
          .join(
            (enter) =>
              enter
                .append("rect")
                .attr("class", "bar")
                //Because it keep jumping before so I start from the bottom with zero height so the bar does not jump
                .attr("y", height)
                .attr("height", 0),
            (update) => update,
            (exit) => exit.remove()
          )
          .attr("x", (_d, i) => i * barWidth)
          .attr("width", Math.max(barWidth - 3, 1)) // small gap by substract a few pixels
          .attr("fill", (_d, i) => colorScale(i))
          .attr("y", (_d, i) => {
            //I don’t have direct amplitude here, so I fake movement using time + index
            //this makes the bars breathe with time instead of staying static
            const amp = Math.abs(Math.sin(time + i)); // 0..1
            const hNorm = 0.3 + amp * 0.4; // between 30% and 70% of the height
            const barHeight = height * hNorm;
            return height - barHeight; //draw from bottom upwards
          })
          .attr("height", (_d, i) => {
            const amp = Math.abs(Math.sin(time + i));
            const hNorm = 0.3 + amp * 0.4;
            return height * hNorm;
          });

        // Moving playhead line. little white line
        const playheadX = (time % 1) * width;

        const playhead = svg.selectAll("line.playhead").data([playheadX]);

        playhead
          .join(
            (enter) =>
              enter
                .append("line")
                .attr("class", "playhead")
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2),
            (update) => update
          )
          .attr("x1", playheadX)
          .attr("x2", playheadX);
      },

      //load all required modules and soundfonts
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

    //load the default Strudel tune into the REPL output when the page first loads
    //Without this, the editor starts empty and no music will play until the user adds code manually
    if (globalEditor) {
      globalEditor.setCode(processed);
    }
  }, [processed]);

  // ---- Manual handlers ----
    //This function applies my custom preprocess function to the template text
  const handlePreprocess = () => {
      //pass in the whole state so preprocess can decide what to change
    const next = preprocess(template, { p1Hush, tempo, volume });
    setProcessed(next);
    //after preprocessing, push the new code into StrudelMirror
    if (globalEditor) globalEditor.setCode(next);
  };

  //preprocess and then immediately play
  const handleProcPlay = () => {
    handlePreprocess();
    if (globalEditor) globalEditor.evaluate();
  };

  //plays whatever code is currently inside the Strudel editor
  const handlePlay = () => {
    if (globalEditor) globalEditor.evaluate();
  };
//stop the current playback
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
                    {/* This is the large textarea the user edits, one the left side of the right part, first column*/}
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
