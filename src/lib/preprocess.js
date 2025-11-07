// preprocess.js – pure text preprocessor
export function preprocess(template, state) {
    let out = template;
    out = out.replaceAll('<p1_Radio>', state.p1Hush ? '_' : '');
    return out;
  }
  