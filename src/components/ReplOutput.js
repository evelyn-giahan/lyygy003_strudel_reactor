// src/components/ReplOutput.js
const ReplOutput = ({ processed }) => {
    return (
      <div className="mt-3">
        <div id="editor" />
        <div id="output" />
        <pre className="mt-2 p-2 bg-dark text-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
          {processed}
        </pre>
      </div>
    );
  };
  
  export default ReplOutput;
  