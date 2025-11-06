// src/components/HeaderBar.js
const HeaderBar = ({ onPreprocess, onProcPlay, onPlay, onStop }) => {
    return (
      <nav className="mb-3">
        <button onClick={onPreprocess} className="btn btn-outline-primary me-2">Preprocess</button>
        <button onClick={onProcPlay} className="btn btn-outline-primary me-3">Proc &amp; Play</button>
        <button onClick={onPlay} className="btn btn-outline-primary me-2">Play</button>
        <button onClick={onStop} className="btn btn-outline-primary">Stop</button>
      </nav>
    );
  };
  export default HeaderBar;
  
  