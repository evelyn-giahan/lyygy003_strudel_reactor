// src/components/ReplOutput.js
export default function ReplOutput({ processed }) {
  return (
    <div className="mt-3">
      <div id="editor" />
      <div id="output" />
      <pre className="mt-2 p-2 bg-dark text-light rounded" style={{ whiteSpace: "pre-wrap" }}>
        {processed}
      </pre>
    </div>
  );
}
