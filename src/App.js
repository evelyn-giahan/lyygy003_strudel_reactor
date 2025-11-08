import "./App.css";
import { useEffect, useRef, useState } from "react";
import { StrudelMirror } from "@strudel/codemirror";
import { evalScope } from "@strudel/core";
import { drawPianoroll } from "@strudel/draw";
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

    const canvas = document.getElementById("roll");
    const drawContext = canvas?.getContext("2d") ?? null;
    if (canvas) {
      canvas.width  = canvas.width * 2;
      canvas.height = canvas.height * 2;
    }
    const drawTime = [-2, 2];

    globalEditor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: document.getElementById("editor"),
      drawTime,
      onDraw: (haps, time) => {
        if (!drawContext) return;
        drawPianoroll({ haps, time, ctx: drawContext, drawTime, fold: 0 });
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

    if (globalEditor) globalEditor.setCode(processed);
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

      <canvas id="roll" className="mt-3 mb-5" />
    </div>
  );
}
