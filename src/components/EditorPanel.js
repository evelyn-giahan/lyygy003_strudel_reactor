// src/components/EditorPanel.js
export default function EditorPanel({ template, onChange }) {
  return (
    <div className="d-flex flex-column h-100">
      <textarea
        className="form-control flex-grow-1"
        style={{ minHeight: "60vh", resize: "none" }}
        value={template}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
