// preprocess.js – pure text preprocessor
// src/lib/preprocess.js
export function preprocess(template, state) {
  const { p1Hush, tempo, volume } = state;

  //authoring template
  let out = template;

  //remove any existing setcps(...) lines in the template (to avoid double tempo)
  out = out.replace(/(^|\n)\s*setcps\([^)]*\)\s*\n/g, "\n");

  //apply instrument toggle tag
  //use "_" to truly mute that voice; "" when ON.
  out = out.replaceAll("<p1_Radio>", p1Hush ? "_" : "");

  //prepend tempo & volume header
  //tempo: setcps(BPM/60/4)
  //volume: apply a global postgain multiplier with `all`
  const header =
  `setcps(${tempo}/60/4)\n` +
  `all(x => x.postgain(${volume}))\n` + 
  `all(x => x.log())\n\n`; //make haps log appear in the console 

  return header + out;
}

