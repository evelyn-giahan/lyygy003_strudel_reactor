// src/components/ReplOutput.js
const ReplOutput = ({ processed }) => (
  <pre className="mt-2 p-2 bg-dark text-light rounded" style={{ whiteSpace: "pre-wrap" }}>
    {processed}
  </pre>
);

export default ReplOutput;