const { app, BrowserWindow, screen, Menu, Tray} = require('electron')

var workerWindow  = require('./windows/WorkerWindow.js')
var lyricsWindow  = require('./windows/LyricsWindow.js')
var loginWindow   = require('./windows/LoginWindow.js')

const main = async () => {
  await workerWindow.startWorker()

  workerWindow.anonymous ? loginWindow.showLogin() : lyricsWindow.showLyricsWindow()

  config()
  setInterval(config, 10000);
  createTray()
}

const config = async () => {
  var startRequestTime = Date.now()
  const playbackData = await workerWindow.getCurrentPlaybackData()

  if (playbackData == null ) {
    console.log("playbackData is null, closing app...")
    app.exit()
  }
  if(playbackData == 401) {
    // token expired
    console.log("Token expired, renewing...")
    await workerWindow.renewAccessToken()
    return
  } 

  if (lyricsWindow.getSongID() !== playbackData["item"]["id"]) {
    // nueva reproduccion de cancion detectada
    lyricsWindow.setSongID(playbackData["item"]["id"])

    if (playbackData["is_playing"]) {
      var artist = playbackData["item"]["artists"][0]["name"]
      var songName = playbackData["item"]["name"]
      var progress_ms = playbackData["progress_ms"] + Math.abs(Date.now() - startRequestTime)

      startRequestTime = Date.now()
      lyricsData = await workerWindow.getLyricsData(playbackData["item"]["id"])
      // trying to get a fixed progres_ms adding the two response time
      // im also counting the request travel time because yes
      progress_ms += Math.abs(Date.now() - startRequestTime) 
      
      console.log(`Currently Playing: ${songName} - ${artist}`)
      lyricsWindow.setProgressMs(progress_ms)

      await lyricsWindow.syncLyrics(lyricsData)
      return
    } 

  }
  var progress_ms = playbackData["progress_ms"] + Math.abs(Date.now() - startRequestTime)
  lyricsWindow.setProgressMs(progress_ms)
}

var tray = null
const createTray = () => {
  tray = new Tray('pai.ico')
  var contextMenu = Menu.buildFromTemplate([
    {
        label: 'Abrir', click: function () {
            mainWindow.show()
        }
    },
    {
        label: 'Salir', click: function () {
            app.isQuiting = true
            app.quit()
        }
    }
  ])
  tray.setToolTip('Lyrics')
  tray.setContextMenu(contextMenu)
}


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  main()
})
