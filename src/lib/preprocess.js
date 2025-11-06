// src/lib/preprocess.js
// Pure text preprocessor: no DOM, no globals.
export function preprocess(template, state) {
    let out = template;
  
    // 1: p1 mute/hush via placeholder
    // Put <p1_Radio> in your tune where you want the mute to apply.
    out = out.replaceAll('<p1_Radio>', state.p1Hush ? '_' : '');
  
    // 2: tempo / volume tokens
    if (typeof state.tempo === 'number') out = out.replaceAll('${tempo}', String(state.tempo));
    if (typeof state.volume === 'number') out = out.replaceAll('${vol}', String(state.volume));
  
    return out;
  }
  