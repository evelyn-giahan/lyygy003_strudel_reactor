// src/components/EditorPanel.js
const EditorPanel = ({ template, onChange }) => {
    return (
      <div>
        <label className="form-label">Text to preprocess:</label>
        <textarea
          className="form-control"
          rows={15}
          value={template}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  };
  export default EditorPanel;
  
  