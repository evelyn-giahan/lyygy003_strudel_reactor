// src/components/AudioControls.js
export default function AudioControls({ tempo, onTempo, volume, onVolume }) {
    return (
      <div className="card mt-3">
        <div className="card-body">
          <h6 className="card-title">Audio Controls</h6>
  
          <div className="mb-3">
            <label htmlFor="tempo" className="form-label">
              Tempo: <strong>{tempo}</strong> BPM
            </label>
            <input
              id="tempo"
              type="range"
              className="form-range"
              min="60"
              max="200"
              step="1"
              value={tempo}
              onChange={(e) => onTempo(Number(e.target.value))}
            />
          </div>
  
          <div>
            <label htmlFor="volume" className="form-label">
              Volume: <strong>{volume.toFixed(1)}</strong>×
            </label>
            <input
              id="volume"
              type="range"
              className="form-range"
              min="0"
              max="2"
              step="0.1"
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    );
  }
  