// preprocess.js – pure text preprocessor
// src/lib/preprocess.js
export function preprocess(template, state) {
  const SILENCE = "~";       
  const replacement = state.p1Hush ? SILENCE : "";
  return template.replaceAll("<p1_Radio>", replacement);
}

