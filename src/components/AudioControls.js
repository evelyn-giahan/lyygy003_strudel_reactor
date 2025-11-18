// src/components/AudioControls.js

//contains the two sliders for tempo and volume
//it just calls the callbacks from props when the user moves the sliders. and the mute function when it set the volume back to 0
import React from "react";

export default function AudioControls({
  tempo, // current tempo value (BPM) from parent state
  onTempo, // callback to update tempo in parent
  volume,  // current volume multiplier from parent
  onVolume, // callback to update volume in parent
  isMuted,  // true when app is muted
  onToggleMute, // callback when user clicks the mute / unmute button
}) {

  // For display I show either "0x" when muted,
  // or the volume with 2 decimal places like "1.25x"
  const displayVolume = isMuted ? "0x" : `${volume.toFixed(2)}x`;

  return (
    <div>
      {/* Tempo slider */}
      <div className="mb-3">
        <label className="form-label">
          Tempo (BPM): <strong>{tempo}</strong>
        </label>
        <input
          type="range"
          className="form-range"
          min="60"
          max="200"
          value={tempo}
          // when user drags the tempo slider, I send the new number
          // back to the parent via onTempo()
          onChange={(e) => onTempo(Number(e.target.value))}
        />
      </div>

      {/* Volume + mute */}
      <div className="mb-2 d-flex align-items-center">
        <div className="flex-grow-1 me-2">
          <label className="form-label mb-1">
            Volume: <strong>{displayVolume}</strong>
          </label>
          <input
            type="range"
            className="form-range"
            min="0"
            max="2"
            step="0.01"
            value={volume}
             // same idea: slider only updates parent via onVolume(),
            // parent decides what to do (postgain, mute state, etc.)
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </div>

        {/* Mute / unmute button with Bootstrap Icons */}
        <button
          type="button"
          className="btn btn-outline-secondary mute-button"
          // I don't change volume here directly, just tell parent:
          // "user clicked mute / unmute" because This component is just UI
          //It never owns the logic. It just reports user actions back up
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <i
          // swap the bell icon depending on isMuted flag
            className={
              isMuted ? "bi bi-bell-slash-fill" : "bi bi-bell-fill"
            }
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
