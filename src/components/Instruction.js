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
          &lt; Back
        </Link>
      </header>

      <div className="container-fluid app-main py-4 app-container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h2 className="mb-3">How to use this Strudel demo</h2>

                <p>
                  This page explains how the main Strudel page works. Use it as a
                  quick guide for markers or anyone maintaining the project.
                </p>

                <h4 className="mt-4">1. Audio Controls</h4>
                <p>
                  The tempo slider changes <code>setcps(BPM/60/4)</code> in the
                  preprocess step. The volume slider multiplies every voice with{" "}
                  <code>all(x =&gt; x.postgain(volume))</code>.
                </p>

                <h4 className="mt-4">2. Instrument Controls</h4>
                <p>
                  The <strong>p1 ON / HUSH</strong> radio buttons switch a block
                  of code between active and muted using{" "}
                  <code>&lt;p1_block_start&gt;</code> and{" "}
                  <code>&lt;p1_block_end&gt;</code> tags inside the tune file.
                </p>

                <h4 className="mt-4">3. D3 Visualiser</h4>
                <p>
                  The bar graph reads live data from the Strudel{" "}
                  <code>.log()</code> output, using <code>lpenv</code> or{" "}
                  <code>cutoff</code> values for the bar height.
                </p>

                <h4 className="mt-4">4. JSON Settings</h4>
                <p>
                  The <strong>Save settings</strong> button writes tempo, volume
                  and p1 Hush state into <code>localStorage</code> as JSON.{" "}
                  <strong>Load settings</strong> restores them on demand.
                </p>

                <p className="mt-4 mb-0">
                  When you are ready to experiment, use the{" "}
                  <Link to="/">Back</Link> link at the top to return to the main
                  Strudel page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
