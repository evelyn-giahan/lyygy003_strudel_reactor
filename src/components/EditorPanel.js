// src/components/EditorPanel.js
const EditorPanel = ({ template, onChange }) => {
    return (
      <div className="d-flex flex-column h-100">
        <label className="form-label">Text to preprocess:</label>
        <textarea
          className="form-control flex-grow-1"
          style={{
            minHeight: '60vh',  // make it tall enough by default
            resize: 'none',     // disable manual resize
          }}
          value={template}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  };
  
  export default EditorPanel;
  