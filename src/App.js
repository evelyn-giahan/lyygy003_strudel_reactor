// src/App.js
import "./App.css";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { StrudelMirror } from "@strudel/codemirror";
import { evalScope } from "@strudel/core";
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, registerSynthSounds } from "@strudel/webaudio";
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
  const [template, setTemplate]   = useState(stranger_tune);
  const [processed, setProcessed] = useState(stranger_tune);
  const [p1Hush, setP1Hush]       = useState(false);

  const [tempo, setTempo]   = useState(140); // BPM
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
      root: document.getElementById("editor"),
      drawTime,

      // D3-based pastel bar visualiser representing Strudel playback
      onDraw: (haps, time) => {
  const svg = d3.select("#visualiser");
  if (svg.empty()) return;

  const width  = parseFloat(svg.style("width")) || 600;
  const height = parseFloat(svg.attr("height")) || 220;

  // Use the actual haps array; if empty, just clear bars
  const data = haps && haps.length > 0 ? haps : [];

  // If no events, remove all bars and playhead and bail out
  if (data.length === 0) {
    svg.selectAll("rect.bar").remove();
    svg.selectAll("line.playhead").remove();
    return;
  }

  const barWidth = width / data.length;

  // Pastel rainbow colour scale
  const colorScale = d3.scaleSequential()
    .domain([0, data.length - 1])
    .interpolator((t) => d3.hsl(t * 360, 0.6, 0.75).formatHex());

  // ==== BARS ====
  const bars = svg.selectAll("rect.bar").data(data);

  bars
    .join(
      enter => enter.append("rect").attr("class", "bar"),
      update => update,
      exit => exit.remove()
    )
    .attr("x", (_d, i) => i * barWidth)
    .attr("width", Math.max(barWidth - 2, 1))   // small gap between bars
    .attr("fill", (_d, i) => colorScale(i))
    .attr("y", () => {
      // choose a height between 30% and 70% of the svg
      const hNorm = 0.3 + 0.4 * Math.random();
      return height * (1 - hNorm);
    })
    .attr("height", () => {
      const hNorm = 0.3 + 0.4 * Math.random();
      return height * hNorm;
    });

  // ==== PLAYHEAD LINE ====
  const playheadX = (time % 1) * width;

  const playhead = svg.selectAll("line.playhead").data([playheadX]);

  playhead
    .join(
      enter => enter
        .append("line")
        .attr("class", "playhead")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2),
      update => update
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
          import("@strudel/webaudio"),
        );
        await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);
      },
    });

    // Seed REPL with initial code
    if (globalEditor) {
      globalEditor.setCode(processed);
    }
  }, []); // run once

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
    <div className="container-fluid py-3">
      <h2 className="mb-3 text-center">Strudel Demo</h2>

      <HeaderBar
        onPreprocess={handlePreprocess}
        onProcPlay={handleProcPlay}
        onPlay={handlePlay}
        onStop={handleStop}
      />

      <div className="row g-4">
        {/* Left column: editor + processed preview */}
        <div className="col-md-8 d-flex flex-column" style={{ height: "85vh" }}>
          <EditorPanel template={template} onChange={setTemplate} />
          <ReplOutput processed={processed} />
        </div>

        {/* Right column: radios + sliders */}
        <div className="col-md-4">
          <ControlPanel p1Hush={p1Hush} onChangeP1={setP1Hush} />
          <AudioControls
            tempo={tempo}
            onTempo={setTempo}
            volume={volume}
            onVolume={setVolume}
          />
        </div>
      </div>

      {/* D3 visualiser (SVG) */}
      <svg
        id="visualiser"
        className="mt-3 mb-5 w-100"
        height="220"
        style={{ backgroundColor: "#111", borderRadius: "8px", border: "1px solid #444" }}
      ></svg>
    </div>
  );
}
