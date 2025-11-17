// src/lib/settingsStorage.js
// This file handles saving & loading JSON settings using localStorage.
// I also add console.log() so I can debug what is being saved/loaded.

const STORAGE_KEY = "strudelSettings_v1";

export function saveSettings(settings) {
  try {
    console.log("Saving settings object:", settings);

    const json = JSON.stringify(settings);
    console.log("Saving JSON string:", json);

    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error("Error saving settings:", err);
  }
}

export function loadSettings() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    console.log("Loaded JSON from storage:", json);

    if (!json) return null;

    const parsed = JSON.parse(json);
    console.log("Parsed settings object:", parsed);

    return parsed;
  } catch (err) {
    console.error("Error loading settings:", err);
    return null;
  }
}
