// preprocess.js – pure text preprocessor
// src/lib/preprocess.js
export function preprocess(template, state) {
  const { p1Hush, tempo, volume } = state;

  //authoring template
  let out = template;

  //remove any existing setcps(...) lines in the template (to avoid double tempo)
  // My UI injects a fresh tempo line every time (setcps(BPM/60/4)).
  // If the original tune already contains its own setcps(), Strudel
  // will keep BOTH lines and the *second one wins*. That means the 
  // old tempo inside the tune would override my UI slider value.
  //
  // Simple example:
  //   User tune contains:   setcps(30/60/4)     // slow
  //   I inject:             setcps(140/60/4)    // fast
  //   Final code becomes:
  //       setcps(140/60/4)
  //       setcps(30/60/4)   this one overrides the UI
  //
 out = out.replace(/(^|\n)\s*setcps\([^)]*\)\s*\n/g, "\n");

  out = out.replaceAll("<p1_radio>", p1Hush ? "~ " : "");

  // Block mute tags: <p1_block_start> ... <p1_block_end>
  //    - When p1 is HUSH -> wrap everything between them in /* ... */
  //    - When p1 is ON   -> markers are removed so the block runs as normal
  if (p1Hush) {
    out = out
      .replaceAll("<p1_block_start>", "/*")
      .replaceAll("<p1_block_end>", "*/");
  } else {
    // when ON, just remove the markers completely
    out = out
      .replaceAll("<p1_block_start>", "")
      .replaceAll("<p1_block_end>", "");
  }
  
  //prepend tempo & volume header
  //tempo: setcps(BPM/60/4)
  //volume: apply a global postgain multiplier with `all`
  const header =
  `setcps(${tempo}/60/4)\n` +
  `all(x => x.postgain(${volume}))\n` + 
  `all(x => x.log())\n\n`; //make haps log appear in the console 

  return header + out;
}

