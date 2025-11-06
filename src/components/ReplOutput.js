// src/components/ReplOutput.js
const ReplOutput = ({ processed }) => {
    return (
      <div className="mt-3">
        {/* Strudel REPL root anchors */}
        <div id="editor" />
        <div id="output" />
  
        {/* Show processed text (for debugging/Part A transparency) */}
        <pre className="mt-2 p-2 bg-dark text-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
          {processed}
        </pre>
      </div>
    );
  };
  
  export default ReplOutput;
  