// src/components/ControlPanel.js
//manages the p1 ON / HUSH radio buttons
import React from "react";

export default function InstrumentControls({ p1Hush, onChangeP1 }) { //parameter
  // p1Hush: boolean from parent, true = p1 is muted (HUSH), false = p1 is ON
  // onChangeP1: callback from parent, I call this when user switches between ON / HUSH
  return (
    <div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="radio"
          name="p1Radio" // same name so 2 inputs act as one radio group
          id="p1On"
          checked={!p1Hush}     // checked is controlled by React: this one is active when p1Hush is false
          onChange={() => onChangeP1(false)} // when user click this, tell parent: "set p1Hush to false (so p1 is ON)"
        />
         {/* htmlFor links the label to the input with the same id,
            so clicking on the text "p1: ON" also toggles the radio */}
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
          // this one is active when p1Hush is true
          checked={p1Hush}
          // when user click this, tell parent: "set p1Hush to true (so p1 is HUSH)"
          onChange={() => onChangeP1(true)}
        />
        <label className="form-check-label" htmlFor="p1Hush">
          p1: HUSH
        </label>
      </div>
    </div>
  );
}
