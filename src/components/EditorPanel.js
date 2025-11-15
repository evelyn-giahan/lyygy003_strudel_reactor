// src/components/EditorPanel.js

// The title is handled by the card header in App.js, so I just render the textarea here
export default function EditorPanel({ template, onChange }) {
  return (
    <div className="d-flex flex-column h-100">
      <textarea
        className="form-control flex-grow-1"
        style={{ minHeight: "60vh", resize: "none" }} //disable manual resizing to keep the layout stable
        value={template}
        //notify the App.js whenever the user types
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
