// src/components/ControlPanel.js
//manages the p1 ON / HUSH radio buttons
import React from "react";

export default function InstrumentControls({ p1Hush, onChangeP1 }) {
  return (
    <div>
      <p className="mb-2 fw-semibold">Instrument Controls</p>

      <div className="form-check">
        <input
          className="form-check-input"
          type="radio"
          name="p1Radio"
          id="p1On"
          checked={!p1Hush}
          onChange={() => onChangeP1(false)}
        />
        <label className="form-check-label" htmlFor="p1On">
          p1: ON
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="radio"
          name="p1Radio"
          id="p1Hush"
          checked={p1Hush}
          onChange={() => onChangeP1(true)}
        />
        <label className="form-check-label" htmlFor="p1Hush">
          p1: HUSH
        </label>
      </div>
    </div>
  );
}
