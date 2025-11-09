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

let globalEditor = null;

export default function StrudelDemo() {
  const hasRun = useRef(false);

  // ---- App state (single source of truth) ----
  const [template, setTemplate] = useState(stranger_tune);
  const [processed, setProcessed] = useState(stranger_tune);
  const [p1Hush, setP1Hush] = useState(false);

  const [tempo, setTempo] = useState(140); // BPM
  const [volume, setVolume] = useState(1.0); // 1.0 = normal loudness

  // ---- Boot Strudel REPL once ----
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console_monkey_patch();

    const drawTime = [-2, 2];

    globalEditor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: document.getElementById("editor"),  // mounted in bottom card
      drawTime,

      // D3-based pastel bar visualiser representing Strudel playback
      onDraw: (haps, time) => {
        const svg = d3.select("#visualiser");
        if (svg.empty()) return;

        const node = svg.node();
        const rect = node.getBoundingClientRect();
        const width = rect.width || 600;
        const height = parseFloat(svg.attr("height")) || 220;

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

        // Height based on time + index so it moves smoothly but doesn't "stack"
        const bars = svg.selectAll("rect.bar").data(data, (_d, i) => i);

        bars
          .join(
            (enter) =>
              enter
                .append("rect")
                .attr("class", "bar")
                .attr("y", height)
                .attr("height", 0),
            (update) => update,
            (exit) => exit.remove()
          )
          .attr("x", (_d, i) => i * barWidth)
          .attr("width", Math.max(barWidth - 3, 1)) // small gap
          .attr("fill", (_d, i) => colorScale(i))
          .attr("y", (_d, i) => {
            const amp = Math.abs(Math.sin(time + i)); // 0..1
            const hNorm = 0.3 + amp * 0.4; // between 30% and 70%
            const barHeight = height * hNorm;
            return height - barHeight;
          })
          .attr("height", (_d, i) => {
            const amp = Math.abs(Math.sin(time + i));
            const hNorm = 0.3 + amp * 0.4;
            return height * hNorm;
          });

        // Moving playhead line
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

    // Seed REPL with initial code
    if (globalEditor) {
      globalEditor.setCode(processed);
    }
  }, [processed]);

  // ---- Manual handlers ----
  const handlePreprocess = () => {
    const next = preprocess(template, { p1Hush, tempo, volume });
    setProcessed(next);
    if (globalEditor) globalEditor.setCode(next);
  };

  const handleProcPlay = () => {
    handlePreprocess();
    if (globalEditor) globalEditor.evaluate();
  };

  const handlePlay = () => {
    if (globalEditor) globalEditor.evaluate();
  };

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
          {/* LEFT BLUE PANEL (unchanged) */}
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
