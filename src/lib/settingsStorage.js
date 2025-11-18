// src/lib/settingsStorage.js
// This file handles saving & loading JSON settings using localStorage.
// I also add console.log() so I can debug what is being saved/loaded.
// I use localStorage so the browser remembers things like tempo, volume, p1Hush,
// even if I refresh the page. I also log stuff to console so I can see what happens


// All settings are stored under this single key in localStorage
//if I ever need a “v2” format later, I can just change this string
const STORAGE_KEY = "strudelSettings_v1";

//function to save the current setting
//the React side passes me something like: { p1Hush, tempo, volume }
export function saveSettings(settings) {
  try {
    //log the raw JS object first so I can see exactly what I’m saving in the console
    console.log("Saving settings object:", settings);

    // localStorage can only store strings, so I need to convert the object to JSON.
    const json = JSON.stringify(settings);
    console.log("Saving JSON string:", json);
    // I actually write the JSON string into localStorage under my fixed key
    //if the key already exists, this just overwrites it
    localStorage.setItem(STORAGE_KEY, json)
  } catch (err) {
    console.error("Error saving settings:", err);
  }
}

//Load settings back from localStorage
//returns the parsed object on success, or null if there is nothing or it fails
export function loadSettings() {
  try {
    // Grab the JSON string for my key. This returns null if nothing was saved yet
    const json = localStorage.getItem(STORAGE_KEY);
    console.log("Loaded JSON from storage:", json);

    //If there is no saved data at all, i tell the caller nothing here
    if (!json) return null;

    //convert the JSON string back into a normal JS object
    const parsed = JSON.parse(json);
    console.log("Parsed settings object:", parsed);

    //Hand the object back to React. The App will then pick what fields
    //it wants to restore (tempo, volume, p1Hush, etc.)
    return parsed;
  } catch (err) { //if it fail, catch error
    console.error("Error loading settings:", err);
    return null;
  }
}
