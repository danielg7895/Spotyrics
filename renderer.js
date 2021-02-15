const { ipcRenderer } = require('electron')

console.log("HEYY")

ipcRenderer.on("on-lyrics-updated", (event, lyrics) => {
    console.log("HEYYYY")
    document.getElementsByClassName("lyrics")[0].innerText = lyrics;
});
