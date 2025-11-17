// src/components/D3Graph.js
import React from "react";

export default function D3Graph({ height = 220 }) {
  return (
    <div className="visualiser-wrapper mb-3">
      <svg
        id="visualiser"           
        height={height}
        className="visualiser-svg"
      />
    </div>
  );
}
