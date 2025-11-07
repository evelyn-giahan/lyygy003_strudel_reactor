// src/components/ControlPanel.js
const ControlPanel = ({ p1Hush, onChangeP1 }) => {
    return (
      <div className="card">
        <div className="card-body">
          <h6 className="card-title">Instrument Controls</h6>
  
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="p1"
              id="p1_on"
              checked={!p1Hush}
              onChange={() => onChangeP1(false)}
            />
            <label className="form-check-label" htmlFor="p1_on">p1: ON</label>
          </div>
  
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="p1"
              id="p1_hush"
              checked={p1Hush}
              onChange={() => onChangeP1(true)}
            />
            <label className="form-check-label" htmlFor="p1_hush">p1: HUSH</label>
          </div>
        </div>
      </div>
    );
  };
  
  export default ControlPanel;
  