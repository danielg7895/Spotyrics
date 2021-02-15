const { BrowserWindow, screen } = require('electron')

var lyricsWindow = null

var CURRENTLY_PLAYING_SONG_ID = null

const showLyricsWindow = () => {
    lyricsWindow = new BrowserWindow({
        width: 1920,
        height: 200,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        //backgroundColor: "#1b1b1b",
        webPreferences: {
        nodeIntegration: true
        }
    })
    lyricsWindow.setIgnoreMouseEvents(true)

    // remove hardcode
    lyricsWindow.setBounds( {
      x: 0,
      y: 1080-100
    })
    lyricsWindow.loadFile('index.html')
}

var progress_ms = { time: 0, updated_time: 0}
var padding = 0
const syncLyrics = async (lyricsData) => {
    var songID = CURRENTLY_PLAYING_SONG_ID
    padding = 0
    
    if (lyricsData !== null) {
      var lines = lyricsData["lyrics"]["lines"]

      while (true) {
        const last_progress_ms = progress_ms["time"]
        var timer = Date.now()

        //console.log(`estimated progress ms: ${last_progress_ms + padding}, spotify progress_ms ${progress_ms["time"]}`)
        if (songID != CURRENTLY_PLAYING_SONG_ID) {
          console.log("NEW SONG!!")
          lyricsWindow.webContents.send("on-lyrics-updated", " ")
          break
        }

        var currentLine = getLineFromTime(last_progress_ms + padding + 100, lines)  // cambiar el progress_ms
        var nextLineTime = lines[lines.indexOf(currentLine) + 1]["time"]
        lyricsWindow.webContents.send("on-lyrics-updated", currentLine["words"][0]["string"])

        var sleepTime = Math.abs(Math.round(nextLineTime - (last_progress_ms + padding))) || 2000 // for songs that doesnt have time
        await sleep(sleepTime)
        
        //padding += Math.abs(Date.now() - timer)
        padding = progress_ms["time"] !== last_progress_ms ? (Date.now() - progress_ms.updated_time) : padding + Math.abs(Date.now() - timer)
      }

      lyricsWindow.webContents.send("on-lyrics-updated", "")
      CURRENTLY_PLAYING_SONG_ID = null
    }
}

const getLineFromTime = (currentPlayingSongMs, linesArray=null, linesArrayLeftovers = null, counter=0) => { 
  // la media de esta funcion es 6 loops
  const linesArrLen = linesArray ? linesArray.length : []

  if(linesArrLen === 0 && linesArrayLeftovers) {
    //    currentPlayingSongMs = 1123         // lower than the rest values in the linesArray,
    //                            |           // the next call will set an empty array to linesArray,
    //   linesArray =           [1268, 2888]  // the linesArrLen will be 0 and this if will be executed.

    //console.log(`ARRLEN es 0, retorno ${linesArrayLeftovers[0]}`)
    return linesArrayLeftovers[0]
  } 
  else if(linesArrLen === 1) {
    //    currentPlayingSongMs = 1123         // lower than the right value in the linesArray,
    //                            |           // the next call will set an array with size 1 -> [1001],
    //   linesArray =           [1001, 2888]  // and this if will be executed.

    //console.log(`ARRLEN es 1, retorno ${JSON.stringify(linesArray[0])}`)
    return linesArray[0]
  }
  
  const middlePosition = Math.round(linesArrLen / 2)
  if (linesArray[middlePosition]["time"] > currentPlayingSongMs) {
    return getLineFromTime(currentPlayingSongMs, linesArray.slice(0, middlePosition), linesArray.slice(middlePosition, linesArrLen), ++counter)
  }
  else if(linesArray[middlePosition]["time"] < currentPlayingSongMs) {
    return getLineFromTime(currentPlayingSongMs, linesArray.slice(middlePosition, linesArrLen), linesArray.slice(0, middlePosition), ++counter)
  }
  else {
    // currentPlayingSongMs == line ms
    console.log(`currentPlayingSongMs == line ms, retorno ${JSON.stringify(linesArray[middlePosition])}`)
    return linesArray[middlePosition]
  }

}

const setProgressMs = (newProgress) => {
  console.log(`updating progess_ms: ${newProgress}`)
  progress_ms = {
    time: newProgress,
    updated_time: Date.now()
  }
}

const setSongID = (id) => {
  CURRENTLY_PLAYING_SONG_ID = id
}

const getSongID = () => {
  return CURRENTLY_PLAYING_SONG_ID
}

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { 
    showLyricsWindow,
    syncLyrics,
    setProgressMs,
    sleep,
    setSongID,
    getSongID,

    lyricsWindow,
}