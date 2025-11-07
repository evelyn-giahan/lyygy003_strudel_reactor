import './App.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StrudelMirror } from '@strudel/codemirror';
import { evalScope } from '@strudel/core';
import { drawPianoroll } from '@strudel/draw';
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, registerSynthSounds } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { registerSoundfonts } from '@strudel/soundfonts';
import { stranger_tune } from './tunes';
import console_monkey_patch from './console-monkey-patch';

import HeaderBar from './components/HeaderBar';
import EditorPanel from './components/EditorPanel';
import ReplOutput from './components/ReplOutput';
import ControlPanel from './components/ControlPanel';
import { preprocess } from './lib/preprocess';

let globalEditor = null;

export default function StrudelDemo() {
  // ---- State and Refs ----
  const hasRun = useRef(false);
  const [template, setTemplate] = useState(stranger_tune);
  const [p1Hush, setP1Hush] = useState(false);

  // ---- Processed Output ----
  const processed = useMemo(() => preprocess(template, { p1Hush }), [template, p1Hush]);

  // ---- Strudel Initialisation ----
  useEffect(() => {
    if (hasRun.current) return;
    console_monkey_patch();
    hasRun.current = true;

    const canvas = document.getElementById('roll');
    if (canvas) {
      canvas.width = canvas.width * 2;
      canvas.height = canvas.height * 2;
    }
    const drawContext = canvas ? canvas.getContext('2d') : null;
    const drawTime = [-2, 2];

    globalEditor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: document.getElementById('editor'),
      drawTime,
      onDraw: (haps, time) => {
        if (!drawContext) return;
        drawPianoroll({ haps, time, ctx: drawContext, drawTime, fold: 0 });
      },
      prebake: async () => {
        initAudioOnFirstClick();
        const loadModules = evalScope(
          import('@strudel/core'),
          import('@strudel/draw'),
          import('@strudel/mini'),
          import('@strudel/tonal'),
          import('@strudel/webaudio'),
        );
        await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);
      },
    });
  }, []);

  // ---- Sync processed text to REPL ----
  useEffect(() => {
    if (globalEditor) globalEditor.setCode(processed);
  }, [processed]);

  // ---- Handlers ----
  const handlePreprocess = () => {
    if (globalEditor) globalEditor.setCode(processed);
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

  // ---- Render ----
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
      <div className="col-md-8 d-flex flex-column" style={{ height: '85vh' }}>
          <EditorPanel template={template} onChange={setTemplate} />
          <ReplOutput processed={processed} />
        </div>

        <div className="col-md-4">
          <ControlPanel p1Hush={p1Hush} onChangeP1={setP1Hush} />
        </div>
      </div>

      <canvas id="roll" className="mt-3" />
    </div>
  );
}
