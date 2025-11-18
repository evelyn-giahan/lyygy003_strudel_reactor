// src/components/Instruction.js
import { Link } from "react-router-dom";
import "../App.css"; // reuse the same styles

export default function Instruction() {
  return (
    <div className="app-root theme-light">
      {/* hero header reused style but with different title */}
      <header className="app-header-hero">
        <h1 className="app-title text-uppercase">Instruction</h1>

        {/* back link on the left */}
        <Link to="/" className="app-header-link">
          &#x2190; Back
        </Link>
      </header>

      <div className="container-fluid app-main py-4 app-container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h2 className="mb-3">How to use this Strudel demo</h2>

                <p>
                  Hi, welcome to the Strudel Page. This page explains how the main Strudel page works.
                </p>

                <h4 className="mt-4">1. Playback Controls</h4>

                <p>
                  These four buttons control how your Strudel code is prepared and played.
                  Because this project uses a custom <code>preprocess()</code> step, some actions
                  must be updated before playback.
                </p>

                <h5 className="mt-3">Preprocess</h5>
                <p>
                  Rebuilds the tune using your UI settings (tempo, volume, ON/HUSH).
                  It also replaces <code>&lt;p1_radio&gt;</code>, and applies block muting between
                  <code>&lt;p1_block_start&gt;</code> / <code>&lt;p1_block_end&gt;</code>.
                  <strong> Use this whenever you edit the code or change ON/HUSH, details below.</strong>
                </p>

                <h5 className="mt-3">Proc &amp; Play</h5>
                <p>
                  Runs <strong>Preprocess → Play</strong> in one click.
                  This is the fastest way to hear your updated tune.
                </p>

                <h5 className="mt-3">Play</h5>
                <p>
                  Starts playback of whatever is currently in the Strudel editor.
                  <strong> No preprocessing happens here.</strong>
                  If you changed code but didn’t preprocess, the sound won’t update.
                </p>

                <h5 className="mt-3">Stop</h5>
                <p>Stops playback immediately.</p>

                <h5 className="mt-3">No-Preprocess Needed</h5>
                <ul>
                  <li>Tempo slider (live)</li>
                  <li>Volume slider + Mute button (live)</li>
                  <li>Dark mode toggle</li>
                  <li>Save / Load settings</li>
                </ul>

                <p>
                  All other changes—notes, effects, ON/HUSH, new lines of code—require preprocessing.
                </p>


                <h4 className="mt-4">2. Audio Controls</h4>
                <p>
                  The tempo slider changes <code>setcps(BPM/60/4)</code> in the
                  preprocess step. This is where you can modify the speed of the playback. The volume slider multiplies every voice with{" "}
                  <code>all(x =&gt; x.postgain(volume))</code>. Use this volume slider if you want to turn up the volume or turn it down.
                  There is also a <strong>speaker icon</strong> where you can quickly mute the volume and unmute it whenever you want.
                </p>

                <h4 className="mt-4">3. Instrument Controls</h4>
                <p>
                  The <strong>p1 ON / HUSH</strong> radio buttons control which parts of the tune
                  are muted. My project supports two tag types in the Strudel template:
                  <code>{" <p1_radio> "}</code> for single-line mute, and
                  <code>{" <p1_block_start> / <p1_block_end> "}</code> for multi-line blocks.
                </p>

                <h5 className="mt-3">✔ Using <code>{"<p1_radio>"}</code> (inline mute)</h5>
                <p>
                  Use this when you want to mute a <strong>single line</strong>. When p1 is ON,
                  the tag becomes empty. When p1 is HUSH, it becomes <code>~ </code> (Strudel’s
                  silence operator).
                </p>

                <pre className="instruction-code">
                  {`<p1_radio> bd*8
`}
                </pre>

                <p>
                  • p1 ON → <code>bd*8</code>
                  <br />
                  • p1 HUSH → <code>~ bd*8</code>
                </p>

                <h5 className="mt-4">✔ Using block tags for multiple lines</h5>
                <p>
                  Use <code>{"<p1_block_start>"}</code> and <code>{"<p1_block_end>"}</code> when you
                  need to toggle <strong>several lines at once</strong>. The whole block becomes a
                  comment <code>/* ... */</code> when p1 is HUSH. Recommend when you want to mute the whole instrument such as drum or drum 2
                </p>

                <pre className="instruction-code">
                  {`<p1_block_start>
d1 $ sound "sine" # n "0 2 4 7"
d1 $ sound "saw"  # n "3 5 8 10"
<p1_block_end>
`}
                </pre>
                <br />
                <p>
                  • p1 ON → the block plays normally
                  <br />
                  • p1 HUSH → the block becomes:
                </p>


                <pre className="instruction-code">
                  {`/* 
d1 $ sound "sine" # n "0 2 4 7"
d1 $ sound "saw"  # n "3 5 8 10"
*/`}
                </pre>

                <h5 className="mt-4">✔ When to use each tag</h5>

                <ul>
                  <li>Use <code>{"<p1_radio>"}</code> for <strong>single short patterns</strong>.</li>
                  <li>
                    Use block tags for <strong>larger instrument sections</strong> or multiple lines.
                  </li>
                  <li>Blocks keep your tune clean when muting a full instrument.</li>
                  <li>Inline tags are faster for small toggles.</li>
                </ul>

                <h4 className="mt-4">4. D3 Visualiser</h4>
                <p>
                  The bar graph is a <strong>live view of the Strudel parameters</strong> that my
                  code logs on every cycle, not a raw audio waveform. In the preprocessor I add:
                </p>

                <pre className="instruction-code">
                  {`all(x => x.log())`}
                </pre>

                <p>
                  This makes each voice print a line to the console while it plays. A typical
                  log entry contains values such as <code>lpenv</code> (low-pass filter
                  envelope) or <code>cutoff</code> (filter cutoff frequency). My D3 code reads
                  these values and turns them into the bar chart:
                </p>

                <ul>
                  <li>
                    Each <strong>bar on the x-axis</strong> is one recent log message
                    (roughly the last 100 events). Older events are on the left, newer ones on
                    the right.
                  </li>
                  <li>
                    The <strong>height of the bar</strong> comes from the numeric value inside
                    the log line – it first tries <code>lpenv</code>, and if that is missing it
                    falls back to <code>cutoff</code>.
                  </li>
                  <li>
                    The <strong>colour gradient</strong> is just a visual effect to make changes
                    in the filter envelope / brightness easier to see while the tune plays.
                  </li>
                </ul>

                <p>
                  In practice, this means the visualiser is showing how the synth&apos;s filter
                  envelope or cutoff is changing over time. Higher bars usually correspond to
                  “brighter” or more intense moments in the pattern, so you can glance at the
                  chart and see where the music is peaking or becoming more active.
                </p>

                <h4 className="mt-4">5. JSON Settings</h4>
                <p>
                  The <strong>Save settings</strong> button writes tempo, volume
                  and p1 Hush state into <code>localStorage</code> as JSON.{" "}
                  <strong>Load settings</strong> restores them on demand.
                </p>

                <p className="mt-4 mb-0">
                  When you are ready to experiment, use the{" "}
                  <Link to="/">Back</Link> link at the top to return to the main
                  Strudel page. Thank you for reading all these. <strong>Author:</strong> Gia Han Ly (lyygy003).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
