// src/components/AudioControls.js

//contains the two sliders for tempo and volume
//it just calls the callbacks from props when the user moves the sliders. and the mute function when it set the volume back to 0
import React from "react";

export default function AudioControls({
  tempo,
  onTempo,
  volume,
  onVolume,
  isMuted,
  onToggleMute,
}) {
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
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </div>

        {/* Mute / unmute button with Bootstrap Icons */}
        <button
          type="button"
          className="btn btn-outline-secondary mute-button"
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <i
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
